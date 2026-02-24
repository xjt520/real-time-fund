'use client';

/**
 * 筛选栏组件
 * 用于筛选 LOF/ETF 类型和折溢价阈值
 */
export default function FilterBar({
  typeFilter,
  setTypeFilter,
  threshold,
  setThreshold,
  sortOrder,
  setSortOrder,
}) {
  return (
    <div className="filter-bar" style={{ marginTop: 0, marginBottom: 16 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div className="tabs" style={{ flexShrink: 0 }}>
          <button
            className={`tab ${typeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setTypeFilter('all')}
          >
            全部
          </button>
          <button
            className={`tab ${typeFilter === 'LOF' ? 'active' : ''}`}
            onClick={() => setTypeFilter('LOF')}
          >
            LOF
          </button>
          <button
            className={`tab ${typeFilter === 'ETF' ? 'active' : ''}`}
            onClick={() => setTypeFilter('ETF')}
          >
            ETF
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginLeft: 'auto',
          }}
        >
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>折溢价阈值</span>
          <div className="chips">
            {[
              { value: 0, label: '不限' },
              { value: 1, label: '>1%' },
              { value: 2, label: '>2%' },
              { value: 3, label: '>3%' },
              { value: 5, label: '>5%' },
            ].map((item) => (
              <button
                key={item.value}
                className={`chip ${threshold === item.value ? 'active' : ''}`}
                onClick={() => setThreshold(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>排序</span>
          <div className="chips">
            <button
              className={`chip ${sortOrder === 'desc' ? 'active' : ''}`}
              onClick={() => setSortOrder('desc')}
            >
              溢价优先
            </button>
            <button
              className={`chip ${sortOrder === 'asc' ? 'active' : ''}`}
              onClick={() => setSortOrder('asc')}
            >
              折价优先
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
