'use client';

/**
 * 快速统计卡片组件
 * 展示套利监控的统计数据
 */
export default function QuickStats({ data, loading }) {
  if (loading) {
    return (
      <div className="grid" style={{ marginBottom: 16 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="col-3">
            <div className="glass card" style={{ height: 80 }}>
              <div className="stat">
                <span className="label">加载中...</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const validData = data.filter(
    (d) => d.premiumDiscountPercent !== null && d.premiumDiscountPercent !== undefined
  );

  const totalFunds = validData.length;
  const premiumCount = validData.filter((d) => d.premiumDiscountPercent > 0).length;
  const discountCount = validData.filter((d) => d.premiumDiscountPercent < 0).length;

  const highPremium = validData.filter((d) => d.premiumDiscountPercent > 3).length;
  const highDiscount = validData.filter((d) => d.premiumDiscountPercent < -3).length;

  const avgPremiumDiscount =
    totalFunds > 0
      ? validData.reduce((sum, d) => sum + d.premiumDiscountPercent, 0) / totalFunds
      : 0;

  const maxPremium =
    totalFunds > 0
      ? Math.max(...validData.map((d) => d.premiumDiscountPercent))
      : 0;
  const maxDiscount =
    totalFunds > 0
      ? Math.min(...validData.map((d) => d.premiumDiscountPercent))
      : 0;

  return (
    <div className="grid" style={{ marginBottom: 16 }}>
      <div className="col-3">
        <div className="glass card">
          <div className="stat">
            <span className="label">监控基金数</span>
            <span className="value">{totalFunds}</span>
          </div>
          <div
            style={{
              display: 'flex',
              gap: 12,
              marginTop: 8,
              fontSize: 12,
              color: 'var(--muted)',
            }}
          >
            <span>LOF: {data.filter((d) => d.type === 'LOF').length}</span>
            <span>ETF: {data.filter((d) => d.type === 'ETF').length}</span>
          </div>
        </div>
      </div>

      <div className="col-3">
        <div className="glass card">
          <div className="stat">
            <span className="label">溢价/折价</span>
            <div style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
              <span className="value up" style={{ fontSize: 18 }}>
                {premiumCount}
              </span>
              <span style={{ color: 'var(--muted)' }}>/</span>
              <span className="value down" style={{ fontSize: 18 }}>
                {discountCount}
              </span>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              gap: 12,
              marginTop: 8,
              fontSize: 12,
            }}
          >
            <span className="up">高溢价(&gt;3%): {highPremium}</span>
            <span className="down">高折价(&lt;-3%): {highDiscount}</span>
          </div>
        </div>
      </div>

      <div className="col-3">
        <div className="glass card">
          <div className="stat">
            <span className="label">平均折溢价</span>
            <span
              className="value"
              style={{
                color:
                  avgPremiumDiscount > 0
                    ? 'var(--danger)'
                    : avgPremiumDiscount < 0
                      ? 'var(--success)'
                      : 'var(--text)',
              }}
            >
              {avgPremiumDiscount > 0 ? '+' : ''}
              {avgPremiumDiscount.toFixed(3)}%
            </span>
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: 12,
              color: 'var(--muted)',
            }}
          >
            市场整体{' '}
            {avgPremiumDiscount > 0.5
              ? '偏溢价'
              : avgPremiumDiscount < -0.5
                ? '偏折价'
                : '相对平衡'}
          </div>
        </div>
      </div>

      <div className="col-3">
        <div className="glass card">
          <div className="stat">
            <span className="label">极值</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span className="up" style={{ fontSize: 14 }}>
                最高溢价: +{maxPremium.toFixed(2)}%
              </span>
              <span className="down" style={{ fontSize: 14 }}>
                最大折价: {maxDiscount.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
