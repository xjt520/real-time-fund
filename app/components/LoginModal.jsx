'use client';

import { useState } from 'react';
import { MailIcon, UserIcon } from './Icons';
import LocalLoginPanel from './LocalLoginPanel';

export default function LoginModal({
  onClose,
  loginEmail,
  setLoginEmail,
  loginOtp,
  setLoginOtp,
  loginLoading,
  loginError,
  loginSuccess,
  handleSendOtp,
  handleVerifyEmailOtp,
  handleLocalLogin,
  handleLocalRegister,
  setLoginError,
  isSupabaseConfigured
}) {
  const [mode, setMode] = useState(isSupabaseConfigured ? 'cloud' : 'local');

  const handleLocalLoginWrapper = async (username, password) => {
    await handleLocalLogin(username, password);
  };

  const handleLocalRegisterWrapper = async (username, password) => {
    await handleLocalRegister(username, password);
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="登录"
      onClick={onClose}
    >
      <div className="glass card modal login-modal" onClick={(e) => e.stopPropagation()}>
        <div className="title" style={{ marginBottom: 16 }}>
          {mode === 'cloud' ? <MailIcon width="20" height="20" /> : <UserIcon width="20" height="20" />}
          <span>{mode === 'cloud' ? '邮箱登录' : '本地登录'}</span>
          <span className="muted">{mode === 'cloud' ? '使用邮箱验证登录' : '数据仅存储在本地'}</span>
        </div>

        {isSupabaseConfigured && (
          <div className="tabs" style={{ marginBottom: 16 }}>
            <button
              type="button"
              className={`tab ${mode === 'cloud' ? 'active' : ''}`}
              onClick={() => {
                setMode('cloud');
                setLoginError('');
              }}
            >
              <MailIcon width="16" height="16" />
              云端登录
            </button>
            <button
              type="button"
              className={`tab ${mode === 'local' ? 'active' : ''}`}
              onClick={() => {
                setMode('local');
                setLoginError('');
              }}
            >
              <UserIcon width="16" height="16" />
              本地登录
            </button>
          </div>
        )}

        {mode === 'cloud' ? (
          <form onSubmit={handleSendOtp}>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <div className="muted" style={{ marginBottom: 8, fontSize: '0.8rem' }}>
                请输入邮箱，我们将发送验证码到您的邮箱
              </div>
              <input
                style={{ width: '100%' }}
                className="input"
                type="email"
                placeholder="your@email.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                disabled={loginLoading || !!loginSuccess}
              />
            </div>

            {loginSuccess && (
              <div className="login-message success" style={{ marginBottom: 12 }}>
                <span>{loginSuccess}</span>
              </div>
            )}

            {loginSuccess && (
              <div className="form-group" style={{ marginBottom: 16 }}>
                <div className="muted" style={{ marginBottom: 8, fontSize: '0.8rem' }}>
                  请输入邮箱验证码以完成注册/登录
                </div>
                <input
                  className="input"
                  type="text"
                  placeholder="输入验证码"
                  value={loginOtp}
                  onChange={(e) => setLoginOtp(e.target.value)}
                  disabled={loginLoading}
                  maxLength={6}
                />
              </div>
            )}
            {loginError && (
              <div className="login-message error" style={{ marginBottom: 12 }}>
                <span>{loginError}</span>
              </div>
            )}
            <div className="row" style={{ justifyContent: 'flex-end', gap: 12 }}>
              <button
                type="button"
                className="button secondary"
                onClick={onClose}
                disabled={loginLoading}
              >
                取消
              </button>
              <button
                className="button"
                type={loginSuccess ? 'button' : 'submit'}
                onClick={loginSuccess ? handleVerifyEmailOtp : undefined}
                disabled={loginLoading || (loginSuccess && !loginOtp)}
              >
                {loginLoading ? '处理中...' : loginSuccess ? '确认验证码' : '发送邮箱验证码'}
              </button>
            </div>
          </form>
        ) : (
          <LocalLoginPanel
            onClose={onClose}
            onLogin={handleLocalLoginWrapper}
            onRegister={handleLocalRegisterWrapper}
            loading={loginLoading}
            error={loginError}
            setError={setLoginError}
          />
        )}
      </div>
    </div>
  );
}
