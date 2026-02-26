/**
 * 主題切換模組
 * 支援深色 / 淺色主題，偏好持久化至 localStorage
 */

/**
 * 套用主題
 * @param {'dark'|'light'} theme
 */
function applyTheme(theme) {
  const themeIconDark  = document.getElementById('theme-icon-dark');
  const themeIconLight = document.getElementById('theme-icon-light');
  const themeToggleBtn = document.getElementById('theme-toggle');

  if (theme === 'light') {
    document.body.classList.add('theme-light');
    if (themeIconDark)  themeIconDark.style.display  = 'none';
    if (themeIconLight) themeIconLight.style.display = '';
    if (themeToggleBtn) themeToggleBtn.title = '切換為深色主題';
  } else {
    document.body.classList.remove('theme-light');
    if (themeIconDark)  themeIconDark.style.display  = '';
    if (themeIconLight) themeIconLight.style.display = 'none';
    if (themeToggleBtn) themeToggleBtn.title = '切換為淺色主題';
  }
  localStorage.setItem('theme', theme);
}

/**
 * 初始化主題（讀取上次偏好並綁定切換按鈕）
 */
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  applyTheme(savedTheme);

  const themeToggleBtn = document.getElementById('theme-toggle');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const next = document.body.classList.contains('theme-light') ? 'dark' : 'light';
      applyTheme(next);
      showToast(next === 'light' ? '已切換為淺色主題' : '已切換為深色主題', 'info', 2000);
    });
  }
}
