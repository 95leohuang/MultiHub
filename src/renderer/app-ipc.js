import { showToast } from './toast.js';
import { switchTabCarousel } from './tab-manager.js';

export function bindAppIpc(getShortcutConfig) {
  if (window.electronAPI && window.electronAPI.onSwitchTab) {
    window.electronAPI.onSwitchTab((shortcutNum) => {
      switchTabCarousel(shortcutNum, getShortcutConfig());
    });
  }

  if (window.electronAPI && window.electronAPI.onToast) {
    window.electronAPI.onToast((msg, type) => showToast(msg, type || 'info'));
  }
}
