/**
 * 本地认证模块
 * 使用 PBKDF2 + SHA-256 进行密码哈希
 */

const SALT_LENGTH = 16;
const HASH_ITERATIONS = 100000;

/**
 * 生成随机盐值
 * @returns {string} 十六进制盐值
 */
export function generateSalt() {
  const array = new Uint8Array(SALT_LENGTH);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 使用 PBKDF2 哈希密码
 * @param {string} password - 明文密码
 * @param {string} salt - 盐值
 * @returns {Promise<string>} 哈希后的密码
 */
export async function hashPassword(password, salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: HASH_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );

  return Array.from(new Uint8Array(derivedBits))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * 验证密码
 * @param {string} password - 明文密码
 * @param {string} storedHash - 存储的哈希值
 * @param {string} salt - 盐值
 * @returns {Promise<boolean>} 是否匹配
 */
export async function verifyPassword(password, storedHash, salt) {
  const computedHash = await hashPassword(password, salt);
  return computedHash === storedHash;
}

/**
 * 获取本地用户列表
 * @returns {Array<{id: string, username: string, passwordHash: string, salt: string, createdAt: string, lastLoginAt: string}>}
 */
export function getLocalUsers() {
  try {
    return JSON.parse(localStorage.getItem('local_users') || '[]');
  } catch {
    return [];
  }
}

/**
 * 创建本地用户
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @returns {Promise<{id: string, username: string}>} 创建的用户信息
 * @throws {Error} 用户名已存在
 */
export async function createLocalUser(username, password) {
  const users = getLocalUsers();

  if (users.some(u => u.username === username)) {
    throw new Error('用户名已存在');
  }

  const salt = generateSalt();
  const passwordHash = await hashPassword(password, salt);

  const newUser = {
    id: `local_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    username,
    passwordHash,
    salt,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  };

  users.push(newUser);
  localStorage.setItem('local_users', JSON.stringify(users));

  return {
    id: newUser.id,
    username: newUser.username,
    createdAt: newUser.createdAt
  };
}

/**
 * 本地登录
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @returns {Promise<{id: string, username: string}>} 登录成功返回用户信息
 * @throws {Error} 用户名或密码错误
 */
export async function loginLocalUser(username, password) {
  const users = getLocalUsers();
  const user = users.find(u => u.username === username);

  if (!user) {
    throw new Error('用户名或密码错误');
  }

  const isValid = await verifyPassword(password, user.passwordHash, user.salt);

  if (!isValid) {
    throw new Error('用户名或密码错误');
  }

  user.lastLoginAt = new Date().toISOString();
  localStorage.setItem('local_users', JSON.stringify(users));

  localStorage.setItem('local_current_user_id', user.id);

  return {
    id: user.id,
    username: user.username,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt
  };
}

/**
 * 获取当前本地用户
 * @returns {{id: string, username: string, createdAt: string, lastLoginAt: string} | null}
 */
export function getCurrentLocalUser() {
  const currentId = localStorage.getItem('local_current_user_id');
  if (!currentId) return null;

  const users = getLocalUsers();
  const user = users.find(u => u.id === currentId);
  if (!user) return null;

  return {
    id: user.id,
    username: user.username,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt
  };
}

/**
 * 本地登出
 */
export function logoutLocalUser() {
  localStorage.removeItem('local_current_user_id');
}

/**
 * 删除本地用户及其数据
 * @param {string} userId - 用户ID
 */
export function deleteLocalUser(userId) {
  const users = getLocalUsers().filter(u => u.id !== userId);
  localStorage.setItem('local_users', JSON.stringify(users));
  localStorage.removeItem(`local_user_${userId}_data`);

  if (localStorage.getItem('local_current_user_id') === userId) {
    localStorage.removeItem('local_current_user_id');
  }
}

/**
 * 检查是否已登录本地用户
 * @returns {boolean}
 */
export function isLocalLoggedIn() {
  return Boolean(localStorage.getItem('local_current_user_id'));
}

/**
 * 获取本地用户数据存储键
 * @param {string} userId - 用户ID
 * @returns {string}
 */
export function getLocalUserDataKey(userId) {
  return `local_user_${userId}_data`;
}
