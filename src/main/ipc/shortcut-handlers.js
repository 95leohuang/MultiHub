'use strict';

const { ipcMain } = require('electron');
const Store = require('electron-store');

const store = new Store();

/**
 * 註冊快捷鍵配置 IPC handlers
 * (從 index.js 抽取)
 */
function registerShortcutHandlers() {
  ipcMain.handle('get-shortcut-config', () => {
    return store.get('shortcutConfig', {
      'Alt+1': ['messenger'],
      'Alt+2': ['chatgpt'],
      'Alt+3': ['gemini'],
      'Alt+4': ['git'],
      'Alt+5': ['discord'],
      'Alt+6': ['telegram']
    });
  });

  ipcMain.handle('save-shortcut-config', (event, config) => {
    store.set('shortcutConfig', config);
    // 動態重新註冊全域快捷鍵
    const { registerShortcuts, unregisterShortcuts } = require('../shortcuts');
    unregisterShortcuts();
    registerShortcuts();
  });
}

module.exports = { registerShortcutHandlers };
