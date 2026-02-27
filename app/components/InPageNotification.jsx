'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { subscribeNotification, publishNotification } from '../lib/notificationEvents';

/**
 * 显示页面内通知（供外部调用）
 */
export function showInPageNotification(options) {
  publishNotification(options);
}

/**
 * 页面内通知容器组件
 */
export default function InPageNotification() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeNotification((options) => {
      const id = Date.now() + Math.random();
      const notification = {
        id,
        title: options.title || '通知',
        body: options.body || '',
        type: options.type || 'info',
        duration: options.duration || 5000,
        onClick: options.onClick,
        ...options,
      };

      setNotifications((prev) => [...prev, notification]);

      if (notification.duration > 0) {
        setTimeout(() => {
          setNotifications((prev) => prev.filter((n) => n.id !== id));
        }, notification.duration);
      }
    });

    return unsubscribe;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const handleClick = useCallback((notification) => {
    if (notification.onClick) {
      notification.onClick();
    }
    removeNotification(notification.id);
  }, [removeNotification]);

  const getTypeStyle = (type) => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: 'rgba(52, 211, 153, 0.15)',
          borderColor: 'rgba(52, 211, 153, 0.5)',
          iconColor: '#34d399',
        };
      case 'warning':
        return {
          backgroundColor: 'rgba(251, 191, 36, 0.15)',
          borderColor: 'rgba(251, 191, 36, 0.5)',
          iconColor: '#fbbf24',
        };
      case 'error':
        return {
          backgroundColor: 'rgba(248, 113, 113, 0.15)',
          borderColor: 'rgba(248, 113, 113, 0.5)',
          iconColor: '#f87171',
        };
      case 'arbitrage':
        return {
          backgroundColor: 'rgba(96, 165, 250, 0.15)',
          borderColor: 'rgba(96, 165, 250, 0.5)',
          iconColor: '#60a5fa',
        };
      default:
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderColor: 'rgba(255, 255, 255, 0.2)',
          iconColor: '#a1a1aa',
        };
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        );
      case 'warning':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        );
      case 'error':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        );
      case 'arbitrage':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        );
      default:
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        );
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 80,
        right: 16,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        maxWidth: 360,
        pointerEvents: 'none',
      }}
    >
      <AnimatePresence>
        {notifications.map((notification) => {
          const style = getTypeStyle(notification.type);
          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              onClick={() => handleClick(notification)}
              style={{
                pointerEvents: 'auto',
                cursor: notification.onClick ? 'pointer' : 'default',
              }}
            >
              <div
                className="glass"
                style={{
                  padding: '12px 16px',
                  borderRadius: 12,
                  backgroundColor: style.backgroundColor,
                  border: `1px solid ${style.borderColor}`,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ color: style.iconColor, flexShrink: 0, marginTop: 2 }}>
                    {getIcon(notification.type)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 14,
                        marginBottom: 4,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {notification.title}
                    </div>
                    {notification.body && (
                      <div
                        style={{
                          fontSize: 13,
                          color: 'var(--text-secondary)',
                          lineHeight: 1.4,
                          wordBreak: 'break-word',
                        }}
                      >
                        {notification.body}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNotification(notification.id);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: 0,
                      fontSize: 16,
                      lineHeight: 1,
                      flexShrink: 0,
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
