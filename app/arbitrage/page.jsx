'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  fetchLofEtfList,
  fetchBatchQuotes,
  clearQuoteCache,
} from '../api/lofEtf';
import {
  FilterBar,
  QuickStats,
  PremiumDiscountTable,
  ArbitrageCalculator,
} from '../components/arbitrage';
import { RefreshIcon } from '../components/Icons';
import MonitorSettings from '../components/arbitrage/MonitorSettings';
import InPageNotification from '../components/InPageNotification';
import { showInPageNotification } from '../lib/pushNotifications';

const FAVORITES_KEY = 'arbitrage_favorites';

function ArrowLeftIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7"/>
    </svg>
  );
}

export default function ArbitragePage() {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [typeFilter, setTypeFilter] = useState('all');
  const [threshold, setThreshold] = useState(0);
  const [sortOrder, setSortOrder] = useState('desc');
  const [favorites, setFavorites] = useState([]);

  const [selectedFund, setSelectedFund] = useState(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showMonitorSettings, setShowMonitorSettings] = useState(false);
  const [monitoredCodes, setMonitoredCodes] = useState([]);

  // 加载收藏和监控列表
  useEffect(() => {
    const saved = localStorage.getItem(FAVORITES_KEY);
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch (e) {
        // ignore
      }
    }

    // 加载监控配置
    const savedConfig = localStorage.getItem('arbitrage_monitor_config');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        setMonitoredCodes(config.monitoredCodes || []);
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const toggleFavorite = useCallback((code) => {
    setFavorites((prev) => {
      const next = prev.includes(code)
        ? prev.filter((c) => c !== code)
        : [...prev, code];
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const toggleMonitor = useCallback((code) => {
    setMonitoredCodes((prev) => {
      let next;
      if (prev.includes(code)) {
        next = prev.filter((c) => c !== code);
      } else {
        next = [...prev, code];
      }

      // 更新 localStorage 中的监控配置
      const savedConfig = localStorage.getItem('arbitrage_monitor_config');
      let config = {
        enabled: false,
        interval: 30000,
        threshold: 2,
        monitoredCodes: [],
      };
      try {
        if (savedConfig) {
          config = { ...config, ...JSON.parse(savedConfig) };
        }
      } catch (e) {
        // ignore
      }
      config.monitoredCodes = next;
      localStorage.setItem('arbitrage_monitor_config', JSON.stringify(config));

      return next;
    });
  }, []);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
      clearQuoteCache();
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const fundList = await fetchLofEtfList();
      const quotesData = await fetchBatchQuotes(fundList);
      setRawData(quotesData);
    } catch (e) {
      setError(e.message || '数据加载失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredData = useMemo(() => {
    let result = rawData;

    if (typeFilter !== 'all') {
      result = result.filter((item) => item.type === typeFilter);
    }

    if (threshold > 0) {
      result = result.filter(
        (item) =>
          item.premiumDiscountPercent !== null &&
          Math.abs(item.premiumDiscountPercent) >= threshold
      );
    }

    result = [...result].sort((a, b) => {
      const aVal = a.premiumDiscountPercent ?? (sortOrder === 'desc' ? -Infinity : Infinity);
      const bVal = b.premiumDiscountPercent ?? (sortOrder === 'desc' ? -Infinity : Infinity);
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });

    return result;
  }, [rawData, typeFilter, threshold, sortOrder]);

  const handleRowClick = useCallback((fund) => {
    setSelectedFund(fund);
    setShowCalculator(true);
  }, []);

  return (
    <div className="container" style={{ paddingTop: 80 }}>
      <div
        className="navbar glass"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Link
          href="/"
          className="icon-button"
          style={{ textDecoration: 'none' }}
          title="返回首页"
        >
          <ArrowLeftIcon width={18} height={18} />
        </Link>

        <div style={{ fontWeight: 600, fontSize: 16 }}>套利监控</div>

        <div className="refresh-btn-wrap" style={{ display: 'flex', gap: 8 }}>
          <button
            className="icon-button"
            onClick={() => setShowMonitorSettings(true)}
            title="监控设置"
          >
            🔔
          </button>
          <button
            className="icon-button"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            aria-busy={refreshing}
            title="刷新数据"
          >
            <RefreshIcon
              width={18}
              height={18}
              className={refreshing ? 'spin' : ''}
            />
          </button>
        </div>
      </div>

      <QuickStats data={rawData} loading={loading} />

      <FilterBar
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        threshold={threshold}
        setThreshold={setThreshold}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
      />

      {error && (
        <div
          style={{
            padding: 12,
            background: 'rgba(248, 113, 113, 0.1)',
            borderRadius: 12,
            color: 'var(--danger)',
            marginBottom: 16,
          }}
        >
          {error}
          <button
            onClick={() => fetchData()}
            style={{
              marginLeft: 12,
              background: 'transparent',
              border: '1px solid var(--danger)',
              color: 'var(--danger)',
              padding: '4px 12px',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            重试
          </button>
        </div>
      )}

      <PremiumDiscountTable
        data={filteredData}
        loading={loading}
        onRowClick={handleRowClick}
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
        monitoredCodes={monitoredCodes}
        onToggleMonitor={toggleMonitor}
      />

      <AnimatePresence>
        {showCalculator && selectedFund && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCalculator(false)}
          >
            <motion.div
              className="glass card modal"
              style={{ maxWidth: 480 }}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <ArbitrageCalculator
                fund={selectedFund}
                onClose={() => setShowCalculator(false)}
              />
            </motion.div>
          </motion.div>
        )}

        {showMonitorSettings && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMonitorSettings(false)}
          >
            <motion.div
              className="glass card modal"
              style={{ maxWidth: 480 }}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <MonitorSettings onClose={() => setShowMonitorSettings(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="footer" style={{ marginTop: 32 }}>
        <p style={{ marginBottom: 8 }}>
          数据仅供参考，不构成投资建议
        </p>
        <p style={{ fontSize: 11, color: 'var(--muted)' }}>
          折溢价率 = (场内价格 - IOPV) / IOPV × 100%
        </p>
      </div>

      {/* 页面内通知组件 */}
      <InPageNotification />
    </div>
  );
}
