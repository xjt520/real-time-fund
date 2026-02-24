'use client';

import { useState, useMemo } from 'react';
import {
  calculatePremiumArbitrage,
  calculateDiscountArbitrage,
  formatMoney,
  formatPercent,
  ARBITRAGE_TYPE,
} from '../../lib/arbitrageCalculator';

/**
 * 套利计算器组件
 * 计算溢价/折价套利收益
 */
export default function ArbitrageCalculator({ fund, onClose }) {
  const [arbitrageType, setArbitrageType] = useState(ARBITRAGE_TYPE.PREMIUM);
  const [amount, setAmount] = useState(10000);
  const [useDiscount, setUseDiscount] = useState(false);

  const price = fund?.quote?.price || 0;
  const iopv = fund?.iopv || 0;
  const type = fund?.type || 'LOF';

  const result = useMemo(() => {
    if (!price || !iopv || !amount) return null;

    if (arbitrageType === ARBITRAGE_TYPE.PREMIUM) {
      return calculatePremiumArbitrage({
        amount,
        iopv,
        sellPrice: price,
        type,
        useDiscount,
      });
    } else {
      return calculateDiscountArbitrage({
        amount,
        buyPrice: price,
        nav: iopv,
        type,
        useDiscount,
      });
    }
  }, [arbitrageType, amount, price, iopv, type, useDiscount]);

  const quickAmounts = [5000, 10000, 50000, 100000];

  return (
    <div className="glass card" style={{ padding: 20 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 16 }}>套利计算器</h3>
        {onClose && (
          <button
            className="icon-button"
            onClick={onClose}
            style={{ width: 28, height: 28 }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {fund && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 16,
            padding: 12,
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 10,
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{fund.name}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              {fund.code} · {fund.type}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 600 }}>¥{price.toFixed(3)}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              IOPV: ¥{iopv.toFixed(3)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontWeight: 600,
                color:
                  fund.premiumDiscountPercent > 0
                    ? 'var(--danger)'
                    : fund.premiumDiscountPercent < 0
                      ? 'var(--success)'
                      : 'var(--text)',
              }}
            >
              {formatPercent(fund.premiumDiscountPercent)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              {fund.premiumDiscountPercent > 0 ? '溢价' : '折价'}
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 13, marginBottom: 8, color: 'var(--muted)' }}>
          套利类型
        </label>
        <div className="tabs">
          <button
            className={`tab ${arbitrageType === ARBITRAGE_TYPE.PREMIUM ? 'active' : ''}`}
            onClick={() => setArbitrageType(ARBITRAGE_TYPE.PREMIUM)}
          >
            溢价套利
          </button>
          <button
            className={`tab ${arbitrageType === ARBITRAGE_TYPE.DISCOUNT ? 'active' : ''}`}
            onClick={() => setArbitrageType(ARBITRAGE_TYPE.DISCOUNT)}
          >
            折价套利
          </button>
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
          {arbitrageType === ARBITRAGE_TYPE.PREMIUM
            ? '场外申购 → 场内卖出（适合溢价基金）'
            : '场内买入 → 场外赎回（适合折价基金）'}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 13, marginBottom: 8, color: 'var(--muted)' }}>
          投入金额（元）
        </label>
        <input
          type="number"
          className="input"
          value={amount}
          onChange={(e) => setAmount(Math.max(0, parseFloat(e.target.value) || 0))}
          style={{ width: '100%' }}
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          {quickAmounts.map((a) => (
            <button
              key={a}
              className={`chip ${amount === a ? 'active' : ''}`}
              onClick={() => setAmount(a)}
            >
              {a >= 10000 ? `${a / 10000}万` : a}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={useDiscount}
            onChange={(e) => setUseDiscount(e.target.checked)}
            style={{ width: 16, height: 16 }}
          />
          <span style={{ fontSize: 13 }}>使用优惠费率（VIP/平台折扣）</span>
        </label>
      </div>

      {result && !result.error && (
        <div
          style={{
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 12,
            padding: 16,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
              paddingBottom: 12,
              borderBottom: '1px solid var(--border)',
            }}
          >
            <span style={{ fontSize: 14 }}>预计收益</span>
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color:
                    result.netProfit > 0
                      ? 'var(--success)'
                      : result.netProfit < 0
                        ? 'var(--danger)'
                        : 'var(--text)',
                }}
              >
                {result.netProfit > 0 ? '+' : ''}¥{formatMoney(result.netProfit)}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color:
                    result.profitPercent > 0
                      ? 'var(--success)'
                      : result.profitPercent < 0
                        ? 'var(--danger)'
                        : 'var(--muted)',
                }}
              >
                收益率: {formatPercent(result.profitPercent)}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 8,
                color: 'var(--muted)',
              }}
            >
              费用明细
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
              }}
            >
              {result.type === ARBITRAGE_TYPE.PREMIUM ? (
                <>
                  <div
                    style={{
                      padding: 8,
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                      申购费 ({result.feeDetails.subscription.rate}%)
                    </div>
                    <div style={{ fontWeight: 600 }}>
                      ¥{formatMoney(result.feeDetails.subscription.amount)}
                    </div>
                  </div>
                  <div
                    style={{
                      padding: 8,
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                      卖出佣金 ({result.feeDetails.commission.rate}%)
                    </div>
                    <div style={{ fontWeight: 600 }}>
                      ¥{formatMoney(result.feeDetails.commission.amount)}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div
                    style={{
                      padding: 8,
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                      买入佣金 ({result.feeDetails.commission.rate}%)
                    </div>
                    <div style={{ fontWeight: 600 }}>
                      ¥{formatMoney(result.feeDetails.commission.amount)}
                    </div>
                  </div>
                  <div
                    style={{
                      padding: 8,
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                      赎回费 ({result.feeDetails.redemption.rate}%)
                    </div>
                    <div style={{ fontWeight: 600 }}>
                      ¥{formatMoney(result.feeDetails.redemption.amount)}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: 8,
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 8,
            }}
          >
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>总费用</span>
            <span style={{ fontWeight: 600 }}>¥{formatMoney(result.totalFees)}</span>
          </div>

          <div
            style={{
              marginTop: 12,
              padding: 10,
              background:
                result.netProfit > 0
                  ? 'rgba(52, 211, 153, 0.1)'
                  : 'rgba(248, 113, 113, 0.1)',
              borderRadius: 8,
              fontSize: 12,
              color: result.netProfit > 0 ? 'var(--success)' : 'var(--danger)',
            }}
          >
            {result.netProfit > 0
              ? '预计有利可图，但请注意风险'
              : '当前折溢价率不足以覆盖交易成本'}
          </div>
        </div>
      )}

      {result?.error && (
        <div
          style={{
            padding: 12,
            background: 'rgba(248, 113, 113, 0.1)',
            borderRadius: 8,
            color: 'var(--danger)',
            fontSize: 13,
          }}
        >
          {result.error}
        </div>
      )}
    </div>
  );
}
