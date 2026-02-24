'use client';

import { useMemo } from 'react';

/**
 * 折溢价表格组件
 * 展示 LOF/ETF 基金的折溢价排行榜
 */
export default function PremiumDiscountTable({
  data,
  loading,
  onRowClick,
  favorites,
  onToggleFavorite,
}) {
  const sortedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return [...data].sort((a, b) => {
      const aVal = a.premiumDiscountPercent ?? -Infinity;
      const bVal = b.premiumDiscountPercent ?? -Infinity;
      return bVal - aVal;
    });
  }, [data]);

  if (loading) {
    return (
      <div className="glass card table-container">
        <div className="empty" style={{ padding: 40 }}>
          <div className="spin" style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 12px' }}></div>
          <span>加载数据中...</span>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="glass card table-container">
        <div className="empty">暂无数据</div>
      </div>
    );
  }

  const formatValue = (val, decimals = 3) => {
    if (val === null || val === undefined || isNaN(val)) return '--';
    return val.toFixed(decimals);
  };

  const formatPercent = (val) => {
    if (val === null || val === undefined || isNaN(val)) return '--';
    const sign = val > 0 ? '+' : '';
    return `${sign}${val.toFixed(2)}%`;
  };

  const getPercentClass = (val) => {
    if (val === null || val === undefined) return '';
    return val > 0 ? 'up' : val < 0 ? 'down' : '';
  };

  const getHighlightStyle = (val) => {
    if (val === null || val === undefined) return {};
    if (Math.abs(val) >= 5) {
      return {
        backgroundColor:
          val > 0 ? 'rgba(248, 113, 113, 0.15)' : 'rgba(52, 211, 153, 0.15)',
        borderLeft: `3px solid ${val > 0 ? 'var(--danger)' : 'var(--success)'}`,
      };
    }
    if (Math.abs(val) >= 3) {
      return {
        backgroundColor:
          val > 0 ? 'rgba(248, 113, 113, 0.08)' : 'rgba(52, 211, 153, 0.08)',
      };
    }
    return {};
  };

  return (
    <div className="glass card table-container">
      <div className="table-header-row">
        <div className="table-header-cell">基金名称</div>
        <div className="table-header-cell text-center">类型</div>
        <div className="table-header-cell text-right">
          <div>现价</div>
          <div style={{ fontSize: 10, fontWeight: 400, color: 'var(--muted)', marginTop: 2 }}>场内交易价格</div>
        </div>
        <div className="table-header-cell text-right">
          <div>IOPV</div>
          <div style={{ fontSize: 10, fontWeight: 400, color: 'var(--muted)', marginTop: 2 }}>实时估算净值</div>
        </div>
        <div className="table-header-cell text-right">
          <div>折溢价</div>
          <div style={{ fontSize: 10, fontWeight: 400, color: 'var(--muted)', marginTop: 2 }}>现价 - IOPV</div>
        </div>
        <div className="table-header-cell text-right">
          <div>折溢价率</div>
          <div style={{ fontSize: 10, fontWeight: 400, color: 'var(--muted)', marginTop: 2 }}>(现价-IOPV)/IOPV</div>
        </div>
        <div className="table-header-cell text-right">
          <div>涨跌幅</div>
          <div style={{ fontSize: 10, fontWeight: 400, color: 'var(--muted)', marginTop: 2 }}>(现价-昨收)/昨收</div>
        </div>
        <div className="table-header-cell text-right">
          <div>100元预估收益</div>
          <div style={{ fontSize: 10, fontWeight: 400, color: 'var(--muted)', marginTop: 2 }}>100×折溢价率</div>
        </div>
        <div className="table-header-cell text-center">操作</div>
      </div>

      {sortedData.map((item) => {
        const isFavorite = favorites?.includes(item.code);
        const highlightStyle = getHighlightStyle(item.premiumDiscountPercent);

        return (
          <div
            key={item.code}
            className="table-row"
            style={{
              cursor: 'pointer',
              ...highlightStyle,
            }}
            onClick={() => onRowClick?.(item)}
          >
            <div className="table-cell name-cell">
              <div className="title-text">
                <span className="name-text">{item.name || item.code}</span>
                <span className="code-text muted">{item.code}</span>
              </div>
            </div>

            <div className="table-cell text-center">
              <span
                className="badge"
                style={{
                  fontSize: 11,
                  padding: '2px 8px',
                  background:
                    item.type === 'ETF'
                      ? 'rgba(34, 211, 238, 0.15)'
                      : 'rgba(96, 165, 250, 0.15)',
                  color: item.type === 'ETF' ? 'var(--primary)' : 'var(--accent)',
                }}
              >
                {item.type}
              </span>
            </div>

            <div className="table-cell text-right">
              <span style={{ fontWeight: 600 }}>
                {formatValue(item.quote?.price)}
              </span>
            </div>

            <div className="table-cell text-right">
              <span className="muted">{formatValue(item.iopv)}</span>
            </div>

            <div className="table-cell text-right">
              <span className={getPercentClass(item.premiumDiscount)}>
                {formatValue(item.premiumDiscount)}
              </span>
            </div>

            <div className="table-cell text-right">
              <span
                className={getPercentClass(item.premiumDiscountPercent)}
                style={{ fontWeight: 600 }}
              >
                {formatPercent(item.premiumDiscountPercent)}
              </span>
            </div>

            <div className="table-cell text-right">
              <span className={getPercentClass(item.quote?.changePercent)}>
                {formatPercent(item.quote?.changePercent)}
              </span>
            </div>

            <div className="table-cell text-right">
              <span
                className={getPercentClass(item.premiumDiscountPercent)}
                style={{ fontWeight: 600 }}
              >
                {item.premiumDiscountPercent !== null && item.premiumDiscountPercent !== undefined
                  ? (item.premiumDiscountPercent > 0 ? '+' : '') + (item.premiumDiscountPercent).toFixed(2) + '元'
                  : '--'}
              </span>
            </div>

            <div className="table-cell text-center action-cell">
              <button
                className={`icon-button fav-button ${isFavorite ? 'active' : ''}`}
                style={{
                  width: 32,
                  height: 32,
                  padding: 0,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite?.(item.code);
                }}
                title={isFavorite ? '取消收藏' : '添加收藏'}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill={isFavorite ? 'var(--accent)' : 'none'}
                  stroke="var(--accent)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </button>
            </div>
          </div>
        );
      })}

      <style jsx>{`
        @media (max-width: 768px) {
          .table-header-row {
            display: none;
          }

          .table-row {
            display: grid;
            grid-template-columns: 1fr 80px;
            grid-template-areas:
              'name premium'
              'info price';
            gap: 8px 12px;
            padding: 12px !important;
          }

          .name-cell {
            grid-area: name;
          }

          .table-cell:nth-child(5) {
            grid-area: premium;
            justify-self: end;
          }

          .table-cell:nth-child(3),
          .table-cell:nth-child(4),
          .table-cell:nth-child(6),
          .table-cell:nth-child(7),
          .table-cell:nth-child(8) {
            display: none;
          }

          .table-row::after {
            content: attr(data-info);
            grid-area: info;
            font-size: 11px;
            color: var(--muted);
          }
        }
      `}</style>
    </div>
  );
}
