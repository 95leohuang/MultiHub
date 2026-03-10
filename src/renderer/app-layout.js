import { renderSidebar } from './sidebar.js';
import { switchTab, bindWebviewEvents } from './tab-manager.js';
import { renderPlatformGrid } from './grid-popup.js';
import { loadShortcutConfig, bindShortcutSettingsEvents } from './shortcut-settings.js';
import { getActiveTab } from './storage.js';

export function applyShortcutConfig(config) {
  renderPlatformGrid(config);
  renderSidebar(config, (tabName) => switchTab(tabName, config));
}

export function initializeShortcutLayout() {
  loadShortcutConfig((config) => {
    applyShortcutConfig(config);

    const initTab = getActiveTab();
    switchTab(initTab, config);
    bindWebviewEvents(config);
  });
}

export function bindShortcutLayoutSettings() {
  bindShortcutSettingsEvents((newConfig) => {
    applyShortcutConfig(newConfig);
  });
}
