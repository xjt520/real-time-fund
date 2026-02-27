/**
 * 通知事件系统
 * 用于解耦组件间的通知通信
 */

const listeners = new Set();

/**
 * 订阅通知事件
 */
export function subscribeNotification(callback) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

/**
 * 发布通知事件
 */
export function publishNotification(options) {
  listeners.forEach((callback) => {
    try {
      callback(options);
    } catch (e) {
      console.error('[NotificationEvent] 回调执行错误:', e);
    }
  });
}
