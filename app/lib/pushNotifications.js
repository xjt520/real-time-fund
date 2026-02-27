/**
 * 推送通知管理工具
 */

import { publishNotification } from './notificationEvents';

/**
 * 显示页面内通知
 */
export function showInPageNotification(options) {
  publishNotification(options);
}

/**
 * 检查浏览器是否支持推送通知
 */
export function isPushNotificationSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'Notification' in window &&
    'PushManager' in window
  );
}

/**
 * 检查通知权限状态
 */
export function getNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * 请求通知权限
 */
export async function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    throw new Error('当前浏览器不支持通知');
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    throw new Error('通知权限已被拒绝');
  }

  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * 注册 Service Worker
 */
export async function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    throw new Error('当前浏览器不支持 Service Worker');
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    console.log('[Push] Service Worker 注册成功:', registration);
    return registration;
  } catch (error) {
    console.error('[Push] Service Worker 注册失败:', error);
    throw error;
  }
}

/**
 * 发送测试通知
 */
export async function sendTestNotification() {
  showInPageNotification({
    title: '测试通知',
    body: '套利监控功能正常工作！',
    type: 'success',
    duration: 5000,
  });
}
