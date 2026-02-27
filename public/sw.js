/**
 * Service Worker for Arbitrage Monitoring
 * 负责后台轮询套利机会和发送推送通知
 */

const CACHE_NAME = 'arbitrage-v3';
const QUOTE_CACHE_PREFIX = 'quote_';

// 监控配置
const MONITOR_CONFIG = {
  enabled: false, // 默认关闭，用户开启后才启动
  interval: 30000, // 轮询间隔：30秒
  threshold: 2, // 默认阈值：2%
  monitoredCodes: [], // 监控的基金代码列表
};

// 临时存储轮询定时器
let monitorIntervalId = null;

/**
 * 安装事件
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Cache opened');
      return cache.addAll(['/']);
    })
  );
});

/**
 * 激活事件
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Service worker activated');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

/**
 * 消息事件 - 接收来自主线程的控制命令
 */
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'START_MONITOR':
      startMonitor(payload);
      break;
    case 'STOP_MONITOR':
      stopMonitor();
      break;
    case 'UPDATE_CONFIG':
      updateMonitorConfig(payload);
      break;
    case 'TEST_NOTIFICATION':
      showTestNotification();
      break;
    default:
      console.log('[SW] Unknown message type:', type);
  }
});

/**
 * 启动监控
 */
function startMonitor(config = {}) {
  console.log('[SW] Starting monitor with config:', config);

  // 更新配置
  Object.assign(MONITOR_CONFIG, config);
  MONITOR_CONFIG.enabled = true;

  // 清除之前的定时器
  if (monitorIntervalId) {
    clearInterval(monitorIntervalId);
  }

  // 立即执行一次检查
  checkArbitrageOpportunities();

  // 设置定时轮询
  monitorIntervalId = setInterval(() => {
    checkArbitrageOpportunities();
  }, MONITOR_CONFIG.interval);

  // 发送状态更新
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: 'MONITOR_STATUS',
        payload: {
          enabled: true,
          config: MONITOR_CONFIG,
        },
      });
    });
  });
}

/**
 * 停止监控
 */
function stopMonitor() {
  console.log('[SW] Stopping monitor');

  MONITOR_CONFIG.enabled = false;

  if (monitorIntervalId) {
    clearInterval(monitorIntervalId);
    monitorIntervalId = null;
  }

  // 发送状态更新
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: 'MONITOR_STATUS',
        payload: {
          enabled: false,
          config: MONITOR_CONFIG,
        },
      });
    });
  });
}

/**
 * 更新监控配置
 */
function updateMonitorConfig(config) {
  console.log('[SW] Updating monitor config:', config);

  Object.assign(MONITOR_CONFIG, config);

  // 如果监控正在运行，重启以应用新配置
  if (MONITOR_CONFIG.enabled && monitorIntervalId) {
    stopMonitor();
    startMonitor(MONITOR_CONFIG);
  }
}

/**
 * 检查套利机会
 */
async function checkArbitrageOpportunities() {
  if (!MONITOR_CONFIG.enabled || MONITOR_CONFIG.monitoredCodes.length === 0) {
    return;
  }

  try {
    // 通过主线程获取基金数据
    const opportunities = await fetchFundDataFromMain({
      codes: MONITOR_CONFIG.monitoredCodes,
      threshold: MONITOR_CONFIG.threshold,
    });

    // 如果有套利机会，发送通知
    if (opportunities && opportunities.length > 0) {
      sendArbitrageNotification(opportunities);
    }

    // 发送检查结果到主线程
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'MONITOR_CHECK_RESULT',
          payload: {
            timestamp: Date.now(),
            opportunities: opportunities || [],
            checkedCount: MONITOR_CONFIG.monitoredCodes.length,
          },
        });
      });
    });
  } catch (e) {
    console.error('[SW] Error checking arbitrage opportunities:', e);
  }
}

/**
 * 通过主线程获取基金数据
 * Service Worker 无法直接访问 document 和 JSONP，需要通过主线程代理
 * 使用 MessageChannel 实现双向通信
 * @param {Object} params - { codes: 基金代码数组, threshold: 阈值 }
 * @returns {Promise<Array>} 套利机会数组
 */
async function fetchFundDataFromMain(params) {
  const clients = await self.clients.matchAll();

  return new Promise((resolve) => {
    if (clients.length === 0) {
      console.log('[SW] No clients available');
      resolve([]);
      return;
    }

    const timeoutMs = 30000; // 30秒超时
    const messageChannel = new MessageChannel();

    // 设置超时
    const timeout = setTimeout(() => {
      console.log('[SW] Fetch timeout');
      resolve([]);
    }, timeoutMs);

    // 监听响应
    messageChannel.port1.onmessage = (event) => {
      clearTimeout(timeout);
      messageChannel.port1.close();
      resolve(event.data?.opportunities || []);
    };

    // 发送请求到第一个活跃的客户端
    const client = clients[0];
    client.postMessage(
      {
        type: 'FETCH_FUND_DATA_REQUEST',
        payload: params,
      },
      [messageChannel.port2]
    );
  });
}

/**
 * 发送套利机会通知
 */
function sendArbitrageNotification(opportunities) {
  const opportunity = opportunities[0]; // 取第一个
  const count = opportunities.length;

  let title, body;
  if (count === 1) {
    title = `${opportunity.name} 套利机会`;
    body = `${opportunity.type}${opportunity.premiumDiscountPercent.toFixed(2)}%`;
  } else {
    title = `${count} 个套利机会`;
    body = opportunities.map((o) => o.name).join('、');
  }

  const notificationOptions = {
    body,
    icon: '/icon-192.svg',
    badge: '/icon-72.svg',
    tag: 'arbitrage-opportunity',
    data: {
      url: '/arbitrage',
      timestamp: Date.now(),
      opportunities,
    },
    actions: [
      {
        action: 'view',
        title: '查看详情',
      },
    ],
  };

  self.registration.showNotification(title, notificationOptions);
}

/**
 * 测试通知
 */
function showTestNotification() {
  const notificationOptions = {
    body: '套利监控功能已正常工作',
    icon: '/icon-192.svg',
    badge: '/icon-72.svg',
    tag: 'test-notification',
  };

  self.registration.showNotification('套利监控测试', notificationOptions);
}

/**
 * 通知点击事件
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);

  event.notification.close();

  if (event.action === 'view' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/arbitrage')
    );
  }
});

/**
 * 网络请求拦截（可选，用于离线支持）
 */
self.addEventListener('fetch', (event) => {
  // 可以在这里添加缓存策略
  // 目前不拦截，让默认行为处理
});
