/**
 * app.js — 渲染程序主入口
 * 整合所有 renderer 模組的初始化與事件綁定
 *
 * 依賴（由 index.html 依序載入的 script）：
 *   renderer/platform-config.js
 *   renderer/toast.js
 *   renderer/sidebar.js
 *   renderer/nav-bar.js
 *   renderer/tab-manager.js
 *   renderer/grid-popup.js
 *   renderer/shortcut-settings.js
 *   renderer/theme.js
 *   renderer/quick-notes.js
 */

document.addEventListener('DOMContentLoaded', () => {

  //#region 初始化各模組
  initWebviews();
  initTheme();
  initQuickNotes();
  bindNavBarEvents(webviews);
  bindGridPopupEvents(getShortcutConfig());
  //#endregion

  //#region 快捷鍵設定載入
  loadShortcutConfig((config) => {
    renderPlatformGrid(config);
    renderSidebar(config, (tabName) => switchTab(tabName, config));

    const initTab = localStorage.getItem('activeTab') || 'messenger';
    switchTab(initTab, config);

    bindWebviewEvents(config);
  });
  //#endregion

  //#region 快捷鍵設定 Modal
  bindShortcutSettingsEvents((newConfig) => {
    renderPlatformGrid(newConfig);
    renderSidebar(newConfig, (tabName) => switchTab(tabName, newConfig));
  });
  //#endregion

  //#region 鍵盤快捷鍵
  document.addEventListener('keydown', (e) => {
    const config = getShortcutConfig();
    const settingsModal = document.getElementById('settings-modal');

    if (e.key === 'Escape') {
      if (!document.getElementById('grid-popup').classList.contains('hidden')) {
        closePopup(); return;
      }
      if (!settingsModal.classList.contains('hidden')) {
        settingsModal.classList.add('hidden'); return;
      }
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'Tab') {
      e.preventDefault();
      const cur = localStorage.getItem('activeTab') || 'messenger';
      const sidebarOrder = getSidebarOrder(config).map(o => o.key);
      switchTab(sidebarOrder[(sidebarOrder.indexOf(cur) + 1) % sidebarOrder.length], config);
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
      if (localStorage.getItem('activeTab') === 'notes') {
        e.preventDefault();
        const addBtn = document.getElementById('add-note-btn');
        if (addBtn) addBtn.click();
      }
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g') {
      e.preventDefault();
      togglePopup();
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r') {
      e.preventDefault();
      const wv = getActiveWebview(webviews);
      if (wv) { setNavLoading(true); wv.reload(); }
    }
  });
  //#endregion

  //#region IPC 監聽
  if (window.electronAPI && window.electronAPI.onSwitchTab) {
    window.electronAPI.onSwitchTab((shortcutNum) => {
      switchTabCarousel(shortcutNum, getShortcutConfig());
    });
  }

  if (window.electronAPI && window.electronAPI.onToast) {
    window.electronAPI.onToast((msg, type) => showToast(msg, type || 'info'));
  }
  //#endregion
});
