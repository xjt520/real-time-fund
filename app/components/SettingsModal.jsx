'use client';

import { useState } from 'react';
import { SettingsIcon } from './Icons';

export default function SettingsModal({
  onClose,
  tempSeconds,
  setTempSeconds,
  saveSettings,
  exportLocalData,
  exportEncryptedData,
  importFileRef,
  handleImportFileChange,
  importMsg,
  autoBackupEnabled,
  setAutoBackupEnabled,
  backups,
  onRestoreBackup,
  onDeleteBackup
}) {
  const [showEncryptPanel, setShowEncryptPanel] = useState(false);
  const [encryptPassword, setEncryptPassword] = useState('');
  const [encryptConfirmPassword, setEncryptConfirmPassword] = useState('');
  const [encryptError, setEncryptError] = useState('');
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [showBackups, setShowBackups] = useState(false);

  const handleEncryptedExport = async () => {
    setEncryptError('');
    if (!encryptPassword) {
      setEncryptError('请输入加密密码');
      return;
    }
    if (encryptPassword.length < 6) {
      setEncryptError('密码至少需要6位');
      return;
    }
    if (encryptPassword !== encryptConfirmPassword) {
      setEncryptError('两次密码不一致');
      return;
    }
    setIsEncrypting(true);
    try {
      await exportEncryptedData(encryptPassword);
      setShowEncryptPanel(false);
      setEncryptPassword('');
      setEncryptConfirmPassword('');
    } catch (err) {
      setEncryptError(err.message || '加密导出失败');
    } finally {
      setIsEncrypting(false);
    }
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="设置" onClick={onClose}>
      <div className="glass card modal" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '80vh', overflowY: 'auto' }}>
        <div className="title" style={{ marginBottom: 12 }}>
          <SettingsIcon width="20" height="20" />
          <span>设置</span>
          <span className="muted">配置和数据管理</span>
        </div>

        <div className="form-group" style={{ marginBottom: 16 }}>
          <div className="muted" style={{ marginBottom: 8, fontSize: '0.8rem' }}>刷新频率</div>
          <div className="chips" style={{ marginBottom: 12 }}>
            {[10, 30, 60, 120, 300].map((s) => (
              <button
                key={s}
                type="button"
                className={`chip ${tempSeconds === s ? 'active' : ''}`}
                onClick={() => setTempSeconds(s)}
                aria-pressed={tempSeconds === s}
              >
                {s} 秒
              </button>
            ))}
          </div>
          <input
            className="input"
            type="number"
            min="10"
            step="5"
            value={tempSeconds}
            onChange={(e) => setTempSeconds(Number(e.target.value))}
            placeholder="自定义秒数"
          />
          {tempSeconds < 10 && (
            <div className="error-text" style={{ marginTop: 8 }}>
              最小 10 秒
            </div>
          )}
        </div>

        <div className="form-group" style={{ marginBottom: 16 }}>
          <div className="muted" style={{ marginBottom: 8, fontSize: '0.8rem' }}>数据导出</div>
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="button secondary" onClick={exportLocalData}>
              普通导出
            </button>
            <button
              type="button"
              className="button secondary"
              onClick={() => setShowEncryptPanel(!showEncryptPanel)}
            >
              加密导出
            </button>
          </div>

          {showEncryptPanel && (
            <div style={{ marginTop: 12, padding: 12, background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
              <div className="muted" style={{ marginBottom: 8, fontSize: '0.75rem' }}>
                设置加密密码（导出文件需要此密码才能导入）
              </div>
              <input
                className="input"
                type="password"
                placeholder="加密密码（至少6位）"
                value={encryptPassword}
                onChange={(e) => setEncryptPassword(e.target.value)}
                style={{ marginBottom: 8 }}
              />
              <input
                className="input"
                type="password"
                placeholder="确认密码"
                value={encryptConfirmPassword}
                onChange={(e) => setEncryptConfirmPassword(e.target.value)}
                style={{ marginBottom: 8 }}
              />
              {encryptError && (
                <div className="error-text" style={{ marginBottom: 8, fontSize: '0.75rem' }}>
                  {encryptError}
                </div>
              )}
              <button
                type="button"
                className="button"
                onClick={handleEncryptedExport}
                disabled={isEncrypting}
                style={{ width: '100%' }}
              >
                {isEncrypting ? '加密中...' : '确认加密导出'}
              </button>
            </div>
          )}

          <div className="muted" style={{ marginBottom: 8, fontSize: '0.8rem', marginTop: 16 }}>数据导入</div>
          <div className="row" style={{ gap: 8, marginTop: 8 }}>
            <button type="button" className="button secondary" onClick={() => importFileRef.current?.click?.()}>
              导入配置
            </button>
          </div>
          <div className="muted" style={{ fontSize: '0.7rem', marginTop: 4 }}>
            支持普通和加密的 JSON 文件
          </div>
          <input
            ref={importFileRef}
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={handleImportFileChange}
          />
          {importMsg && (
            <div className="muted" style={{ marginTop: 8, fontSize: '0.8rem' }}>
              {importMsg}
            </div>
          )}
        </div>

        <div className="form-group" style={{ marginBottom: 16 }}>
          <div className="muted" style={{ marginBottom: 8, fontSize: '0.8rem' }}>自动备份</div>
          <div className="row" style={{ alignItems: 'center', gap: 12 }}>
            <label className="switch">
              <input
                type="checkbox"
                checked={autoBackupEnabled}
                onChange={(e) => setAutoBackupEnabled(e.target.checked)}
              />
              <span className="slider"></span>
            </label>
            <span className="muted" style={{ fontSize: '0.8rem' }}>
              {autoBackupEnabled ? '已开启（保留最近3份）' : '已关闭'}
            </span>
          </div>

          {autoBackupEnabled && backups && backups.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <button
                type="button"
                className="button secondary"
                onClick={() => setShowBackups(!showBackups)}
                style={{ fontSize: '0.8rem' }}
              >
                {showBackups ? '隐藏备份' : `查看备份 (${backups.length})`}
              </button>

              {showBackups && (
                <div style={{ marginTop: 8, maxHeight: 150, overflowY: 'auto' }}>
                  {backups.map((backup, index) => (
                    <div
                      key={backup.timestamp}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: 6,
                        marginBottom: 4,
                        fontSize: '0.8rem'
                      }}
                    >
                      <span>{formatDate(backup.timestamp)}</span>
                      <div className="row" style={{ gap: 8 }}>
                        <button
                          type="button"
                          className="button secondary"
                          onClick={() => onRestoreBackup(backup)}
                          style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                        >
                          恢复
                        </button>
                        <button
                          type="button"
                          className="button secondary"
                          onClick={() => onDeleteBackup(backup.timestamp)}
                          style={{ fontSize: '0.75rem', padding: '4px 8px', color: '#ef4444' }}
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="row" style={{ justifyContent: 'flex-end', marginTop: 24 }}>
          <button className="button" onClick={saveSettings} disabled={tempSeconds < 10}>保存并关闭</button>
        </div>
      </div>
    </div>
  );
}
