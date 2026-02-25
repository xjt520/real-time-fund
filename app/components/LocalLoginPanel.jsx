'use client';

import { useState } from 'react';
import { UserIcon } from './Icons';

export default function LocalLoginPanel({
  onClose,
  onLogin,
  onRegister,
  loading,
  error,
  setError
}) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('请输入用户名');
      return;
    }

    if (!password) {
      setError('请输入密码');
      return;
    }

    if (isRegister) {
      if (password.length < 6) {
        setError('密码至少需要6位');
        return;
      }
      if (password !== confirmPassword) {
        setError('两次密码不一致');
        return;
      }
      await onRegister(username.trim(), password);
    } else {
      await onLogin(username.trim(), password);
    }
  };

  const switchMode = () => {
    setIsRegister(!isRegister);
    setError('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group" style={{ marginBottom: 16 }}>
        <div className="muted" style={{ marginBottom: 8, fontSize: '0.8rem' }}>
          {isRegister ? '创建本地账户，数据仅存储在本地浏览器' : '使用本地账户登录'}
        </div>
        <input
          style={{ width: '100%', marginBottom: 12 }}
          className="input"
          type="text"
          placeholder="用户名"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={loading}
          autoComplete="username"
        />
        <input
          style={{ width: '100%', marginBottom: isRegister ? 12 : 0 }}
          className="input"
          type="password"
          placeholder="密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          autoComplete={isRegister ? 'new-password' : 'current-password'}
        />
        {isRegister && (
          <input
            style={{ width: '100%', marginTop: 12 }}
            className="input"
            type="password"
            placeholder="确认密码"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            autoComplete="new-password"
          />
        )}
      </div>

      {error && (
        <div className="login-message error" style={{ marginBottom: 12 }}>
          <span>{error}</span>
        </div>
      )}

      <div className="row" style={{ justifyContent: 'space-between', gap: 12 }}>
        <button
          type="button"
          className="button secondary"
          onClick={switchMode}
          disabled={loading}
        >
          {isRegister ? '已有账户？登录' : '没有账户？注册'}
        </button>
        <div className="row" style={{ gap: 12 }}>
          <button
            type="button"
            className="button secondary"
            onClick={onClose}
            disabled={loading}
          >
            取消
          </button>
          <button
            className="button"
            type="submit"
            disabled={loading}
          >
            {loading ? '处理中...' : isRegister ? '注册' : '登录'}
          </button>
        </div>
      </div>
    </form>
  );
}
