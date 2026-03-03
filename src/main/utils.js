// 實用工具函數

/**
 * 檢查是否為 macOS
 */
function isMac() {
  return process.platform === 'darwin';
}

/**
 * 檢查是否為 Windows
 */
function isWindows() {
  return process.platform === 'win32';
}

/**
 * 檢查是否為 Linux
 */
function isLinux() {
  return process.platform === 'linux';
}

/**
 * 格式化未讀消息數量
 * @param {number} count - 未讀消息數量
 * @returns {string} 格式化後的字符串
 */
function formatBadgeCount(count) {
  if (count === 0) return '';
  if (count > 99) return '99+';
  return count.toString();
}

/**
 * 延遲執行
 * @param {number} ms - 延遲毫秒數
 * @returns {Promise}
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 清理 URL
 * @param {string} url - 原始 URL
 * @returns {string} 清理後的 URL
 */
function sanitizeUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.toString();
  } catch {
    return '';
  }
}

module.exports = {
  isMac,
  isWindows,
  isLinux,
  formatBadgeCount,
  delay,
  sanitizeUrl
};





