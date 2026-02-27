'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { showInPageNotification } from '../../lib/pushNotifications';
import { fetchLofEtfQuote, fetchIOPV, fetchLofNav, LOF_ETF_LIST } from '../../api/lofEtf';

const MONITOR_STORAGE_KEY = 'arbitrage_monitor_config';

/**
 * 加载监控配置
 */
function loadConfig() {
  try {
    const saved = localStorage.getItem(MONITOR_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('[Monitor] 加载配置失败:', e);
  }
  return {
    enabled: false,
    interval: 30000,
    threshold: 2,
    monitoredCodes: [],
  };
}

/**
 * 保存监控配置
 */
function saveConfig(config) {
  try {
    localStorage.setItem(MONITOR_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('[Monitor] 保存配置失败:', e);
  }
}

/**
 * 监控设置组件
 */
export default function MonitorSettings({ onClose }) {
  const [monitorEnabled, setMonitorEnabled] = useState(false);
  const [config, setConfig] = useState({
    interval: 30000,
    threshold: 2,
    monitoredCodes: [],
  });

  const [loading, setLoading] = useState(false);
  const [lastCheckResult, setLastCheckResult] = useState(null);
  const [logs, setLogs] = useState([]);

  const monitorIntervalRef = useRef(null);

  // 添加日志
  const addLog = useCallback((message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = { timestamp, message, type };
    console.log(`[Monitor ${timestamp}] ${message}`);
    setLogs((prev) => [...prev.slice(-19), logEntry]); // 保留最近20条
  }, []);

  // 初始化
  useEffect(() => {
    const savedConfig = loadConfig();
    setConfig(savedConfig);
    setMonitorEnabled(savedConfig.enabled);
    addLog('监控组件已初始化');
  }, [addLog]);

  // 监控检查函数
  const checkArbitrageOpportunities = useCallback(async () => {
    if (config.monitoredCodes.length === 0) {
      addLog('没有监控的基金，跳过检查', 'warning');
      return;
    }

    addLog(`开始检查 ${config.monitoredCodes.length} 只基金，阈值 ${config.threshold}%`);
    const opportunities = [];

    for (const code of config.monitoredCodes) {
      const fundInfo = LOF_ETF_LIST.find((f) => f.code === code);
      if (!fundInfo) {
        addLog(`基金 ${code} 未找到`, 'warning');
        continue;
      }

      try {
        // 获取行情
        const quote = await fetchLofEtfQuote(code, fundInfo.type);
        if (!quote) {
          addLog(`${fundInfo.name}(${code}) 行情获取失败`, 'error');
          continue;
        }

        // 获取 IOPV/净值
        let iopv = null;
        if (fundInfo.type === 'ETF') {
          iopv = await fetchIOPV(code);
        } else {
          const navData = await fetchLofNav(code);
          iopv = navData?.gsz || navData?.nav || null;
        }

        // 计算折溢价率
        let premiumDiscountPercent = null;
        if (quote.price && iopv && iopv > 0) {
          premiumDiscountPercent = ((quote.price - iopv) / iopv) * 100;
        }

        addLog(
          `${fundInfo.name}: 现价=${quote.price?.toFixed(3)}, IOPV=${iopv?.toFixed(3)}, 折溢价率=${premiumDiscountPercent?.toFixed(2)}%`,
          'info'
        );

        // 检查是否超过阈值
        if (premiumDiscountPercent !== null && Math.abs(premiumDiscountPercent) >= config.threshold) {
          const opportunity = {
            code,
            name: fundInfo.name,
            type: fundInfo.type,
            price: quote.price,
            iopv,
            premiumDiscountPercent,
            direction: premiumDiscountPercent > 0 ? '溢价' : '折价',
          };
          opportunities.push(opportunity);
          addLog(
            `发现套利机会！${fundInfo.name} ${opportunity.direction}${premiumDiscountPercent.toFixed(2)}%`,
            'success'
          );
        }
      } catch (e) {
        addLog(`${fundInfo.name}(${code}) 检查失败: ${e.message}`, 'error');
      }
    }

    // 更新检查结果
    const result = {
      timestamp: Date.now(),
      opportunities,
      checkedCount: config.monitoredCodes.length,
    };
    setLastCheckResult(result);

    // 如果有套利机会，发送通知
    if (opportunities.length > 0) {
      opportunities.forEach((opp) => {
        showInPageNotification({
          title: `${opp.name} 套利机会`,
          body: `${opp.direction}${opp.premiumDiscountPercent.toFixed(2)}%`,
          type: 'arbitrage',
          duration: 10000,
        });
      });
      addLog(`发现 ${opportunities.length} 个套利机会，已发送通知`, 'success');
    } else {
      addLog('本次检查未发现套利机会');
    }
  }, [config, addLog]);

  // 启动/停止监控
  useEffect(() => {
    if (monitorEnabled && config.monitoredCodes.length > 0) {
      addLog(`监控已启动，间隔 ${config.interval / 1000} 秒`);

      // 立即执行一次
      checkArbitrageOpportunities();

      // 设置定时轮询
      monitorIntervalRef.current = setInterval(() => {
        checkArbitrageOpportunities();
      }, config.interval);

      return () => {
        if (monitorIntervalRef.current) {
          clearInterval(monitorIntervalRef.current);
          monitorIntervalRef.current = null;
        }
      };
    } else {
      if (monitorIntervalRef.current) {
        clearInterval(monitorIntervalRef.current);
        monitorIntervalRef.current = null;
      }
    }
  }, [monitorEnabled, config.interval, config.monitoredCodes, checkArbitrageOpportunities, addLog]);

  // 切换监控状态
  const handleToggleMonitor = () => {
    const newEnabled = !monitorEnabled;
    setMonitorEnabled(newEnabled);

    const newConfig = { ...config, enabled: newEnabled };
    setConfig(newConfig);
    saveConfig(newConfig);

    if (newEnabled) {
      addLog('监控已开启');
    } else {
      addLog('监控已关闭');
      if (monitorIntervalRef.current) {
        clearInterval(monitorIntervalRef.current);
        monitorIntervalRef.current = null;
      }
    }
  };

  // 更新配置
  const handleUpdateConfig = (newConfig) => {
    setConfig(newConfig);
    saveConfig(newConfig);
    addLog(`配置已更新: 阈值=${newConfig.threshold}%, 间隔=${newConfig.interval / 1000}秒`);
  };

  // 手动检查
  const handleManualCheck = () => {
    addLog('手动触发检查');
    checkArbitrageOpportunities();
  };

  // 发送测试通知
  const handleTestNotification = () => {
    showInPageNotification({
      title: '测试通知',
      body: '套利监控功能正常工作！',
      type: 'success',
      duration: 5000,
    });
    addLog('已发送测试通知');
  };

  return (
    <div className="glass" style={{ padding: 20, borderRadius: 12, maxHeight: '80vh', overflow: 'auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>套利监控设置</h3>
        {onClose && (
          <button
            className="icon-button"
            onClick={onClose}
            title="关闭"
          >
            ✕
          </button>
        )}
      </div>

      {/* 监控状态 */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 500 }}>监控状态</span>
          <button
            className={`btn ${monitorEnabled ? 'btn-danger' : 'btn-success'}`}
            onClick={handleToggleMonitor}
            disabled={config.monitoredCodes.length === 0}
            style={{ padding: '8px 20px', fontSize: 14 }}
          >
            {monitorEnabled ? '停止监控' : '启动监控'}
          </button>
        </div>

        {config.monitoredCodes.length === 0 && (
          <div
            style={{
              padding: 10,
              backgroundColor: 'rgba(255, 149, 0, 0.1)',
              borderRadius: 8,
              fontSize: 12,
              color: '#ff9500',
            }}
          >
            请先在套利列表中添加要监控的基金
          </div>
        )}

        {monitorEnabled && (
          <div
            style={{
              padding: 10,
              backgroundColor: 'rgba(52, 199, 89, 0.1)',
              borderRadius: 8,
              fontSize: 12,
            }}
          >
            ✓ 监控运行中，每 {config.interval / 1000} 秒检查一次
          </div>
        )}
      </div>

      {/* 阈值设置 */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>
          折溢价率阈值 (%)
        </label>
        <input
          type="number"
          step="0.1"
          min="0.1"
          max="20"
          value={config.threshold}
          onChange={(e) =>
            handleUpdateConfig({ ...config, threshold: parseFloat(e.target.value) || 1 })
          }
          style={{
            width: '100%',
            padding: 10,
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.1)',
            backgroundColor: 'rgba(255,255,255,0.05)',
            color: 'var(--text-primary)',
            fontSize: 14,
          }}
        />
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
          超过此值时触发通知
        </div>
      </div>

      {/* 轮询间隔 */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>
          轮询间隔 (秒)
        </label>
        <select
          value={config.interval / 1000}
          onChange={(e) =>
            handleUpdateConfig({ ...config, interval: parseInt(e.target.value) * 1000 })
          }
          style={{
            width: '100%',
            padding: 10,
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.1)',
            backgroundColor: 'rgba(255,255,255,0.05)',
            color: 'var(--text-primary)',
            fontSize: 14,
          }}
        >
          <option value="5">5 秒</option>
          <option value="10">10 秒</option>
          <option value="15">15 秒</option>
          <option value="30">30 秒</option>
          <option value="60">1 分钟</option>
          <option value="120">2 分钟</option>
          <option value="300">5 分钟</option>
        </select>
      </div>

      {/* 监控的基金列表 */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>
          监控基金 ({config.monitoredCodes.length})
        </label>
        {config.monitoredCodes.length > 0 ? (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            {config.monitoredCodes.map((code) => {
              const fundInfo = LOF_ETF_LIST.find((f) => f.code === code);
              return (
                <span
                  key={code}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 4,
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    fontSize: 12,
                  }}
                >
                  {fundInfo?.name || code}
                </span>
              );
            })}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            暂无监控基金，请在套利列表中点击铃铛图标添加
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div style={{ marginBottom: 20, display: 'flex', gap: 8 }}>
        <button
          className="btn btn-outline"
          onClick={handleManualCheck}
          disabled={config.monitoredCodes.length === 0}
          style={{ flex: 1 }}
        >
          手动检查
        </button>
        <button
          className="btn btn-outline"
          onClick={handleTestNotification}
          style={{ flex: 1 }}
        >
          测试通知
        </button>
      </div>

      {/* 最后检查结果 */}
      {lastCheckResult && (
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>
            上次检查
          </label>
          <div
            style={{
              padding: 10,
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderRadius: 8,
              fontSize: 12,
            }}
          >
            <div>时间: {new Date(lastCheckResult.timestamp).toLocaleString()}</div>
            <div>检查数量: {lastCheckResult.checkedCount}</div>
            <div>
              套利机会:{' '}
              {lastCheckResult.opportunities.length > 0
                ? lastCheckResult.opportunities
                    .map((o) => `${o.name}(${o.direction}${o.premiumDiscountPercent.toFixed(2)}%)`)
                    .join(', ')
                : '无'}
            </div>
          </div>
        </div>
      )}

      {/* 日志 */}
      <div>
        <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>
          运行日志
        </label>
        <div
          style={{
            padding: 10,
            backgroundColor: 'rgba(0,0,0,0.2)',
            borderRadius: 8,
            fontSize: 11,
            fontFamily: 'monospace',
            maxHeight: 150,
            overflow: 'auto',
          }}
        >
          {logs.length > 0 ? (
            logs.map((log, i) => (
              <div
                key={i}
                style={{
                  color:
                    log.type === 'success'
                      ? '#34c759'
                      : log.type === 'error'
                      ? '#ff3b30'
                      : log.type === 'warning'
                      ? '#ff9500'
                      : 'var(--text-secondary)',
                  marginBottom: 4,
                }}
              >
                [{log.timestamp}] {log.message}
              </div>
            ))
          ) : (
            <div style={{ color: 'var(--text-muted)' }}>暂无日志</div>
          )}
        </div>
      </div>
    </div>
  );
}
