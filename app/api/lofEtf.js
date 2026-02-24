/**
 * LOF/ETF 套利数据 API
 * 提供实时行情、IOPV 估算净值、历史折溢价等数据
 */
import { cachedRequest, clearCachedRequest } from '../lib/cacheRequest';

/**
 * 热门 LOF/ETF 基金列表
 * 包含 LOF 和 ETF 两种类型的代表性基金
 */
export const LOF_ETF_LIST = [
  // LOF 基金（场内交易的开放式基金）
  { code: '161725', name: '招商中证白酒A', type: 'LOF' },
  { code: '161726', name: '招商中证白酒C', type: 'LOF' },
  { code: '163406', name: '兴业趋势投资', type: 'LOF' },
  { code: '160323', name: '华夏磐晟', type: 'LOF' },
  { code: '160324', name: '华夏磐益', type: 'LOF' },
  { code: '160106', name: '南方积极配置', type: 'LOF' },
  { code: '160105', name: '南方积极成长', type: 'LOF' },
  { code: '161005', name: '富国天惠成长A', type: 'LOF' },
  { code: '161010', name: '富国天惠成长C', type: 'LOF' },
  { code: '162411', name: '华宝标普油气', type: 'LOF' },
  { code: '160717', name: '华夏恒生ETF联接A', type: 'LOF' },
  { code: '160718', name: '华夏恒生ETF联接C', type: 'LOF' },
  { code: '161825', name: '银行指数A', type: 'LOF' },
  { code: '161826', name: '银行指数C', type: 'LOF' },
  { code: '160416', name: '华安标普石油指数', type: 'LOF' },
  { code: '160417', name: '华安纳斯达克100', type: 'LOF' },
  { code: '160719', name: '嘉实恒生中国', type: 'LOF' },
  { code: '160720', name: '嘉实恒生科技', type: 'LOF' },
  { code: '163208', name: '兴业中证500', type: 'LOF' },
  { code: '160805', name: '长盛全债指数', type: 'LOF' },

  // ETF 基金（交易所交易基金）
  { code: '510300', name: '沪深300ETF', type: 'ETF' },
  { code: '510050', name: '上证50ETF', type: 'ETF' },
  { code: '510500', name: '中证500ETF', type: 'ETF' },
  { code: '159915', name: '创业板ETF', type: 'ETF' },
  { code: '588000', name: '科创50ETF', type: 'ETF' },
  { code: '512880', name: '证券ETF', type: 'ETF' },
  { code: '512690', name: '酒ETF', type: 'ETF' },
  { code: '159996', name: '消费ETF', type: 'ETF' },
  { code: '512010', name: '医药ETF', type: 'ETF' },
  { code: '512760', name: '芯片ETF', type: 'ETF' },
  { code: '515790', name: '光伏ETF', type: 'ETF' },
  { code: '516160', name: '新能源车ETF', type: 'ETF' },
  { code: '159766', name: '旅游ETF', type: 'ETF' },
  { code: '512200', name: '房地产ETF', type: 'ETF' },
  { code: '512660', name: '军工ETF', type: 'ETF' },
  { code: '515180', name: '银行ETF', type: 'ETF' },
  { code: '512400', name: '有色金属ETF', type: 'ETF' },
  { code: '159985', name: '豆粕ETF', type: 'ETF' },
  { code: '518880', name: '黄金ETF', type: 'ETF' },
  { code: '513100', name: '纳指ETF', type: 'ETF' },
  { code: '513050', name: '港科技ETF', type: 'ETF' },
  { code: '159920', name: '恒生ETF', type: 'ETF' },
  { code: '513060', name: '恒生医疗ETF', type: 'ETF' },
  { code: '513130', name: '恒生科技ETF', type: 'ETF' },
  { code: '159941', name: '纳指100ETF', type: 'ETF' },
  { code: '513030', name: '德国ETF', type: 'ETF' },
  { code: '513080', name: '法国ETF', type: 'ETF' },
  { code: '513520', name: '日经ETF', type: 'ETF' },
  { code: '159949', name: '创业板50ETF', type: 'ETF' },
  { code: '512100', name: '中证1000ETF', type: 'ETF' },
];

/**
 * 获取 LOF/ETF 列表
 * @returns {Promise<Array>} 基金列表
 */
export async function fetchLofEtfList() {
  return Promise.resolve([...LOF_ETF_LIST]);
}

/**
 * 获取市场代码前缀（腾讯证券格式）
 * @param {string} code 基金代码
 * @returns {string} 市场前缀 (sh/sz/bj)
 */
function getMarketPrefix(code) {
  const codeStr = String(code);
  if (codeStr.startsWith('6') || codeStr.startsWith('9')) return 'sh';
  if (codeStr.startsWith('4') || codeStr.startsWith('8')) return 'bj';
  return 'sz';
}

/**
 * 获取东方财富 secid（市场ID.代码）
 * @param {string} code 基金代码
 * @returns {string} secid (1.xxx for 上海, 0.xxx for 深圳)
 */
function getEastmoneySecid(code) {
  const codeStr = String(code);
  if (codeStr.startsWith('6') || codeStr.startsWith('9')) return `1.${codeStr}`;
  if (codeStr.startsWith('4') || codeStr.startsWith('8')) return `0.${codeStr}`;
  return `0.${codeStr}`;
}

/**
 * 获取腾讯证券行情代码
 * @param {string} code 基金代码
 * @param {string} type 基金类型 (LOF/ETF)
 * @returns {string} 腾讯证券代码
 */
function getTencentCode(code, type) {
  const prefix = getMarketPrefix(code);
  return `${prefix}${code}`;
}

/**
 * 获取实时行情（腾讯证券）
 * @param {string} code 基金代码
 * @param {string} type 基金类型
 * @returns {Promise<Object|null>} 行情数据
 */
export async function fetchLofEtfQuote(code, type = 'ETF') {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  const tencentCode = getTencentCode(code, type);
  const cacheKey = `quote_${tencentCode}`;

  return cachedRequest(
    () =>
      new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = `https://qt.gtimg.cn/q=${tencentCode}&_t=${Date.now()}`;

        const varName = `v_${tencentCode}`;

        const cleanup = () => {
          if (document.body.contains(script)) {
            document.body.removeChild(script);
          }
        };

        script.onload = () => {
          const dataStr = window[varName];
          if (dataStr && dataStr.length > 5) {
            const parts = dataStr.split('~');
            resolve({
              code: code,
              name: parts[1] || '',
              price: parseFloat(parts[3]) || 0,
              change: parseFloat(parts[4]) || 0,
              changePercent: parseFloat(parts[5]) || 0,
              volume: parseFloat(parts[6]) || 0,
              amount: parseFloat(parts[37]) || 0,
              high: parseFloat(parts[33]) || 0,
              low: parseFloat(parts[34]) || 0,
              open: parseFloat(parts[32]) || 0,
              prevClose: parseFloat(parts[4]) ? parseFloat(parts[3]) - parseFloat(parts[4]) : 0,
              time: parts[30] || '',
            });
          } else {
            resolve(null);
          }
          cleanup();
        };

        script.onerror = () => {
          cleanup();
          resolve(null);
        };

        document.body.appendChild(script);

        setTimeout(() => {
          cleanup();
          resolve(null);
        }, 5000);
      }),
    cacheKey,
    { cacheTime: 10 * 1000 }
  );
}

/**
 * 获取 ETF 的 IOPV（实时参考净值）
 * 使用天天基金估值接口
 * @param {string} code ETF 代码
 * @returns {Promise<number|null>} IOPV 值
 */
export async function fetchIOPV(code) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  const cacheKey = `iopv_${code}`;

  return cachedRequest(
    () =>
      new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = `https://fundgz.1234567.com.cn/js/${code}.js?rt=${Date.now()}`;

        const originalJsonpgz = window.jsonpgz;

        const cleanup = () => {
          if (document.body.contains(script)) {
            document.body.removeChild(script);
          }
          window.jsonpgz = originalJsonpgz;
        };

        window.jsonpgz = (data) => {
          cleanup();
          if (data && data.gsz) {
            resolve(parseFloat(data.gsz));
          } else if (data && data.dwjz) {
            resolve(parseFloat(data.dwjz));
          } else {
            resolve(null);
          }
        };

        script.onload = () => {
          if (window.jsonpgz === originalJsonpgz) {
            cleanup();
            resolve(null);
          }
        };

        script.onerror = () => {
          cleanup();
          resolve(null);
        };

        document.body.appendChild(script);

        setTimeout(() => {
          cleanup();
          resolve(null);
        }, 5000);
      }),
    cacheKey,
    { cacheTime: 10 * 1000 }
  );
}

/**
 * 获取 LOF 基金净值
 * 使用天天基金估值接口
 * @param {string} code 基金代码
 * @returns {Promise<Object|null>} 净值数据
 */
export async function fetchLofNav(code) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  const cacheKey = `nav_${code}`;

  return cachedRequest(
    () =>
      new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = `https://fundgz.1234567.com.cn/js/${code}.js?rt=${Date.now()}`;

        const originalJsonpgz = window.jsonpgz;

        const cleanup = () => {
          if (document.body.contains(script)) {
            document.body.removeChild(script);
          }
          window.jsonpgz = originalJsonpgz;
        };

        window.jsonpgz = (data) => {
          cleanup();
          if (data) {
            resolve({
              nav: data.dwjz ? parseFloat(data.dwjz) : null,
              gsz: data.gsz ? parseFloat(data.gsz) : null,
              name: data.name || '',
              gszzl: data.gszzl ? parseFloat(data.gszzl) : null,
            });
          } else {
            resolve(null);
          }
        };

        script.onload = () => {
          if (window.jsonpgz === originalJsonpgz) {
            cleanup();
            resolve(null);
          }
        };

        script.onerror = () => {
          cleanup();
          resolve(null);
        };

        document.body.appendChild(script);

        setTimeout(() => {
          cleanup();
          resolve(null);
        }, 5000);
      }),
    cacheKey,
    { cacheTime: 10 * 1000 }
  );
}

/**
 * 批量获取行情数据（顺序处理避免 JSONP 冲突）
 * @param {Array<{code: string, type: string}>} funds 基金列表
 * @returns {Promise<Array>} 行情数据数组
 */
export async function fetchBatchQuotes(funds) {
  if (!funds || funds.length === 0) return [];

  const results = [];

  for (const fund of funds) {
    const quote = await fetchLofEtfQuote(fund.code, fund.type);

    if (!quote) {
      results.push({
        ...fund,
        quote: null,
        iopv: null,
        premiumDiscount: null,
        premiumDiscountPercent: null,
      });
      continue;
    }

    let iopv = null;

    if (fund.type === 'ETF') {
      iopv = await fetchIOPV(fund.code);
    } else {
      const navData = await fetchLofNav(fund.code);
      iopv = navData?.gsz || navData?.nav || null;
    }

    let premiumDiscountPercent = null;
    if (quote.price && iopv && iopv > 0) {
      premiumDiscountPercent = ((quote.price - iopv) / iopv) * 100;
    }

    results.push({
      ...fund,
      quote,
      iopv,
      premiumDiscount: quote.price && iopv ? quote.price - iopv : null,
      premiumDiscountPercent,
    });
  }

  return results;
}

/**
 * 获取历史折溢价数据
 * @param {string} code 基金代码
 * @param {string} range 时间范围 (1m/3m/6m/1y)
 * @returns {Promise<Array>} 历史数据
 */
export async function fetchPDHistory(code, range = '1m') {
  if (typeof window === 'undefined') return [];

  const cacheKey = `pd_history_${code}_${range}`;

  return cachedRequest(
    () =>
      new Promise(async (resolve) => {
        try {
          const historyData = await fetchHistoryFromTencent(code, range);
          resolve(historyData);
        } catch (e) {
          resolve([]);
        }
      }),
    cacheKey,
    { cacheTime: 10 * 60 * 1000 }
  );
}

/**
 * 从腾讯证券获取历史数据
 * @param {string} code 基金代码
 * @param {string} range 时间范围
 * @returns {Promise<Array>} 历史数据
 */
async function fetchHistoryFromTencent(code, range) {
  return new Promise((resolve) => {
    const tencentCode = getMarketPrefix(code) + code;
    const varName = `${tencentCode}_day`;

    const script = document.createElement('script');

    let days = 30;
    switch (range) {
      case '3m': days = 90; break;
      case '6m': days = 180; break;
      case '1y': days = 365; break;
      default: days = 30;
    }

    script.src = `https://web.qtimg.cn/v2/quote/dayKline/${tencentCode}?_var=${varName}&r=${Date.now()}`;

    const cleanup = () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };

    script.onload = () => {
      const data = window[varName];
      if (data && data.data && Array.isArray(data.data)) {
        const result = data.data.slice(-days).map((item) => ({
          date: item[0] || '',
          open: parseFloat(item[1]) || 0,
          close: parseFloat(item[2]) || 0,
          high: parseFloat(item[3]) || 0,
          low: parseFloat(item[4]) || 0,
          volume: parseFloat(item[5]) || 0,
        }));
        resolve(result);
      } else {
        resolve([]);
      }
      cleanup();
    };

    script.onerror = () => {
      cleanup();
      resolve([]);
    };

    document.body.appendChild(script);

    setTimeout(() => {
      cleanup();
      resolve([]);
    }, 8000);
  });
}

/**
 * 清除行情缓存
 * @param {string} code 基金代码（可选）
 */
export function clearQuoteCache(code) {
  if (code) {
    clearCachedRequest(`quote_${getMarketPrefix(code)}${code}`);
    clearCachedRequest(`iopv_${code}`);
    clearCachedRequest(`nav_${code}`);
  } else {
    LOF_ETF_LIST.forEach((fund) => {
      clearCachedRequest(`quote_${getMarketPrefix(fund.code)}${fund.code}`);
      clearCachedRequest(`iopv_${fund.code}`);
      clearCachedRequest(`nav_${fund.code}`);
    });
  }
}
