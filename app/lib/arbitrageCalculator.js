/**
 * 套利计算器工具函数
 * 提供折溢价率计算、套利收益计算、手续费计算等功能
 */

/**
 * 手续费配置
 */
export const FEE_CONFIG = {
  LOF: {
    subscriptionFee: 0.012,
    subscriptionFeeDiscount: 0.001,
    redemptionFee: 0.005,
    redemptionFeeDiscount: 0.0025,
    commission: 0.0003,
    minCommission: 5,
  },
  ETF: {
    subscriptionFee: 0,
    redemptionFee: 0,
    commission: 0.0003,
    minCommission: 5,
  },
};

/**
 * 套利类型
 */
export const ARBITRAGE_TYPE = {
  PREMIUM: 'premium',
  DISCOUNT: 'discount',
};

/**
 * 计算折溢价率
 * @param {number} price 场内价格
 * @param {number} iopv 估算净值 (IOPV)
 * @returns {number|null} 折溢价率百分比，正数表示溢价，负数表示折价
 */
export function calculatePremiumDiscount(price, iopv) {
  if (!price || !iopv || iopv <= 0) return null;
  return ((price - iopv) / iopv) * 100;
}

/**
 * 计算溢价套利收益
 * 场外申购 -> 场内卖出
 * @param {Object} params 参数
 * @param {number} params.amount 投入金额
 * @param {number} params.iopv 申购时净值
 * @param {number} params.sellPrice 卖出价格
 * @param {number} params.shares 申购份额（可选，不传则根据金额计算）
 * @param {string} params.type 基金类型 (LOF/ETF)
 * @param {boolean} params.useDiscount 是否使用优惠费率
 * @returns {Object} 计算结果
 */
export function calculatePremiumArbitrage(params) {
  const { amount, iopv, sellPrice, shares, type = 'LOF', useDiscount = false } = params;

  if (!amount || !iopv || !sellPrice) {
    return { error: '参数不完整' };
  }

  const config = FEE_CONFIG[type] || FEE_CONFIG.LOF;

  const actualShares = shares || amount / iopv;

  const subscriptionRate = useDiscount
    ? config.subscriptionFeeDiscount
    : config.subscriptionFee;
  const subscriptionFee = amount * subscriptionRate;

  const sellAmount = actualShares * sellPrice;

  const commission = Math.max(sellAmount * config.commission, config.minCommission);

  const totalFees = subscriptionFee + commission;

  const netProfit = sellAmount - amount - totalFees;

  const profitPercent = (netProfit / amount) * 100;

  return {
    type: ARBITRAGE_TYPE.PREMIUM,
    amount,
    shares: actualShares,
    iopv,
    sellPrice,
    subscriptionFee,
    commission,
    totalFees,
    netProfit,
    profitPercent,
    feeDetails: {
      subscription: {
        rate: subscriptionRate * 100,
        amount: subscriptionFee,
      },
      commission: {
        rate: config.commission * 100,
        amount: commission,
      },
    },
  };
}

/**
 * 计算折价套利收益
 * 场内买入 -> 场外赎回
 * @param {Object} params 参数
 * @param {number} params.amount 投入金额
 * @param {number} params.buyPrice 买入价格
 * @param {number} params.nav 赎回时净值
 * @param {string} params.type 基金类型 (LOF/ETF)
 * @param {boolean} params.useDiscount 是否使用优惠费率
 * @returns {Object} 计算结果
 */
export function calculateDiscountArbitrage(params) {
  const { amount, buyPrice, nav, type = 'LOF', useDiscount = false } = params;

  if (!amount || !buyPrice || !nav) {
    return { error: '参数不完整' };
  }

  const config = FEE_CONFIG[type] || FEE_CONFIG.LOF;

  const buyCommission = Math.max(amount * config.commission, config.minCommission);

  const shares = (amount - buyCommission) / buyPrice;

  const redemptionRate = useDiscount
    ? config.redemptionFeeDiscount
    : config.redemptionFee;

  const redemptionAmount = shares * nav;
  const redemptionFee = redemptionAmount * redemptionRate;

  const totalFees = buyCommission + redemptionFee;

  const netProfit = redemptionAmount - amount - totalFees;

  const profitPercent = (netProfit / amount) * 100;

  return {
    type: ARBITRAGE_TYPE.DISCOUNT,
    amount,
    shares,
    buyPrice,
    nav,
    buyCommission,
    redemptionFee,
    totalFees,
    netProfit,
    profitPercent,
    feeDetails: {
      commission: {
        rate: config.commission * 100,
        amount: buyCommission,
      },
      redemption: {
        rate: redemptionRate * 100,
        amount: redemptionFee,
      },
    },
  };
}

/**
 * 统一套利计算入口
 * @param {Object} params 参数
 * @param {string} params.arbitrageType 套利类型 (premium/discount)
 * @returns {Object} 计算结果
 */
export function calculateArbitrageProfit(params) {
  const { arbitrageType, ...rest } = params;

  if (arbitrageType === ARBITRAGE_TYPE.PREMIUM) {
    return calculatePremiumArbitrage(rest);
  } else if (arbitrageType === ARBITRAGE_TYPE.DISCOUNT) {
    return calculateDiscountArbitrage(rest);
  }

  return { error: '未知的套利类型' };
}

/**
 * 计算手续费
 * @param {number} amount 金额
 * @param {string} feeType 费用类型
 * @param {string} fundType 基金类型 (LOF/ETF)
 * @param {boolean} useDiscount 是否使用优惠费率
 * @returns {Object} 手续费详情
 */
export function calculateFees(amount, feeType, fundType = 'LOF', useDiscount = false) {
  const config = FEE_CONFIG[fundType] || FEE_CONFIG.LOF;

  switch (feeType) {
    case 'subscription': {
      const rate = useDiscount ? config.subscriptionFeeDiscount : config.subscriptionFee;
      return {
        rate: rate * 100,
        amount: amount * rate,
      };
    }
    case 'redemption': {
      const rate = useDiscount ? config.redemptionFeeDiscount : config.redemptionFee;
      return {
        rate: rate * 100,
        amount: amount * rate,
      };
    }
    case 'commission': {
      return {
        rate: config.commission * 100,
        amount: Math.max(amount * config.commission, config.minCommission),
      };
    }
    default:
      return { rate: 0, amount: 0 };
  }
}

/**
 * 格式化金额
 * @param {number} value 金额
 * @param {number} decimals 小数位数
 * @returns {string} 格式化后的金额
 */
export function formatMoney(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) return '--';
  return value.toFixed(decimals);
}

/**
 * 格式化百分比
 * @param {number} value 百分比值
 * @param {number} decimals 小数位数
 * @returns {string} 格式化后的百分比
 */
export function formatPercent(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) return '--';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * 判断套利是否有利可图
 * @param {number} premiumDiscountPercent 折溢价率百分比
 * @param {string} type 基金类型
 * @returns {Object} 判断结果
 */
export function isArbitrageProfitable(premiumDiscountPercent, type = 'LOF') {
  const config = FEE_CONFIG[type] || FEE_CONFIG.LOF;

  const totalFeePercent =
    (config.subscriptionFee + config.redemptionFee + config.commission * 2) * 100;

  const threshold = totalFeePercent + 0.3;

  if (premiumDiscountPercent > threshold) {
    return {
      profitable: true,
      type: ARBITRAGE_TYPE.PREMIUM,
      message: `溢价${premiumDiscountPercent.toFixed(2)}%，超过成本线${threshold.toFixed(2)}%`,
    };
  } else if (premiumDiscountPercent < -threshold) {
    return {
      profitable: true,
      type: ARBITRAGE_TYPE.DISCOUNT,
      message: `折价${Math.abs(premiumDiscountPercent).toFixed(2)}%，超过成本线${threshold.toFixed(2)}%`,
    };
  }

  return {
    profitable: false,
    type: null,
    message: `折溢价率${premiumDiscountPercent.toFixed(2)}%，不足以覆盖交易成本`,
  };
}

/**
 * 获取套利建议
 * @param {Object} quote 行情数据
 * @param {number} iopv 估算净值
 * @param {string} type 基金类型
 * @returns {Object} 套利建议
 */
export function getArbitrageAdvice(quote, iopv, type = 'LOF') {
  if (!quote || !iopv) {
    return {
      hasOpportunity: false,
      advice: '数据不完整，无法判断',
    };
  }

  const premiumDiscountPercent = calculatePremiumDiscount(quote.price, iopv);
  const profitable = isArbitrageProfitable(premiumDiscountPercent, type);

  return {
    hasOpportunity: profitable.profitable,
    arbitrageType: profitable.type,
    premiumDiscountPercent,
    advice: profitable.message,
    riskLevel: Math.abs(premiumDiscountPercent) > 5 ? 'high' : Math.abs(premiumDiscountPercent) > 3 ? 'medium' : 'low',
  };
}
