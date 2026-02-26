/**
 * Toast 通知系統（全域可用）
 */

/**
 * 顯示 Toast 通知
 * @param {string} message
 * @param {'info'|'success'|'warning'|'error'} type
 * @param {number} duration
 */
function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const icons = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span class="toast-message">${message}</span><button class="toast-close">✕</button>`;
  container.appendChild(toast);
  const remove = () => {
    toast.classList.add('removing');
    setTimeout(() => toast.parentNode && toast.parentNode.removeChild(toast), 300);
  };
  const timer = setTimeout(remove, duration);
  toast.querySelector('.toast-close').addEventListener('click', () => { clearTimeout(timer); remove(); });
}

/**
 * 開啟外部連結（透過 Electron IPC）
 * @param {string} url
 */
function openExternalUrl(url) {
  if (window.electronAPI && window.electronAPI.openExternal) {
    window.electronAPI.openExternal(url);
  }
}
