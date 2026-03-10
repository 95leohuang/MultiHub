import { getSidebarOrder } from './sidebar.js';
import { getActiveWebview, setNavLoading } from './nav-bar.js';
import { switchTab, webviews } from './tab-manager.js';
import { togglePopup, closePopup } from './grid-popup.js';
import { getActiveTab } from './storage.js';

export function bindAppKeyboardShortcuts(getShortcutConfig) {
  document.addEventListener('keydown', (e) => {
    const config = getShortcutConfig();
    const settingsModal = document.getElementById('settings-modal');

    if (e.key === 'Escape') {
      if (!document.getElementById('grid-popup').classList.contains('hidden')) {
        closePopup();
        return;
      }
      if (!settingsModal.classList.contains('hidden')) {
        settingsModal.classList.add('hidden');
        return;
      }
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'Tab') {
      e.preventDefault();
      const cur = getActiveTab();
      const sidebarOrder = getSidebarOrder(config).map((o) => o.key);
      switchTab(sidebarOrder[(sidebarOrder.indexOf(cur) + 1) % sidebarOrder.length], config);
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
      if (getActiveTab() === 'notes') {
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
      if (wv) {
        setNavLoading(true);
        wv.reload();
      }
    }
  });
}
