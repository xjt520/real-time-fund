/**
 * 数据加密模块
 * 使用 AES-256-GCM 进行数据加密
 */

const SALT_LENGTH = 16;
const IV_LENGTH = 12;

/**
 * 从密码派生 AES 密钥
 * @param {string} password - 密码
 * @param {Uint8Array} salt - 盐值
 * @returns {Promise<CryptoKey>}
 */
async function deriveKey(password, salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * 将 Uint8Array 转换为 Base64
 * @param {Uint8Array} bytes
 * @returns {string}
 */
function uint8ArrayToBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * 将 Base64 转换为 Uint8Array
 * @param {string} base64
 * @returns {Uint8Array}
 */
function base64ToUint8Array(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * 加密数据
 * @param {object} data - 要加密的数据对象
 * @param {string} password - 加密密码
 * @returns {Promise<{version: string, algorithm: string, salt: string, iv: string, ciphertext: string, exportedAt: string}>}
 */
export async function encryptData(data, password) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(password, salt);

  const encoder = new TextEncoder();
  const plaintext = encoder.encode(JSON.stringify(data));

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    plaintext
  );

  return {
    version: '1.0',
    algorithm: 'AES-GCM',
    salt: uint8ArrayToBase64(salt),
    iv: uint8ArrayToBase64(iv),
    ciphertext: uint8ArrayToBase64(new Uint8Array(encrypted)),
    exportedAt: new Date().toISOString()
  };
}

/**
 * 解密数据
 * @param {{algorithm: string, salt: string, iv: string, ciphertext: string}} encryptedPayload - 加密的数据
 * @param {string} password - 解密密码
 * @returns {Promise<object>} 解密后的数据
 * @throws {Error} 解密失败
 */
export async function decryptData(encryptedPayload, password) {
  const salt = base64ToUint8Array(encryptedPayload.salt);
  const iv = base64ToUint8Array(encryptedPayload.iv);
  const ciphertext = base64ToUint8Array(encryptedPayload.ciphertext);

  const key = await deriveKey(password, salt);

  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      ciphertext
    );

    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(decrypted));
  } catch (error) {
    throw new Error('解密失败，密码错误或数据损坏');
  }
}

/**
 * 检查是否为加密格式
 * @param {any} data - 要检查的数据
 * @returns {boolean}
 */
export function isEncryptedPayload(data) {
  return (
    data &&
    typeof data === 'object' &&
    data.version === '1.0' &&
    data.algorithm === 'AES-GCM' &&
    typeof data.ciphertext === 'string'
  );
}
