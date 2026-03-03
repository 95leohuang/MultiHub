'use strict';

const { globalShortcut } = require('electron');

/**
 * 註冊所有全域快捷鍵
 */
function registerShortcuts() {
  const { BrowserWindow } = require('electron');

  //#region 顯示/隱藏視窗
  const toggleWindow = () => {
    const windows = BrowserWindow.getAllWindows();
    const win = windows.length > 0 ? windows[0] : null;
    if (win && !win.isDestroyed()) {
      if (win.isVisible()) {
        win.hide();
      } else {
        win.show();
        win.focus();
      }
    }
  };

  const registered = globalShortcut.register('Alt+`', toggleWindow);
  if (!registered) {
    globalShortcut.register('CommandOrControl+Shift+M', toggleWindow);
  }
  console.log('Global shortcut registered:', registered ? 'Alt+`' : 'Ctrl+Shift+M');
  //#endregion

  //#region 動態註冊自訂快捷鍵切換 Tab
  const Store = require('electron-store');
  const store = new Store();
  const config = store.get('shortcutConfig', {
    'Alt+1': ['messenger'], 'Alt+2': ['chatgpt'], 'Alt+3': ['gemini'],
    'Alt+4': ['git'], 'Alt+5': ['notes'], 'Alt+6': ['discord'], 'Alt+7': ['telegram']
  });

  // 自動遷移舊版純數字 key
  let hasMigrated = false;
  const migratedConfig = {};
  Object.keys(config).forEach(k => {
    let newKey = k;
    if (/^[1-7]$/.test(k)) {
      newKey = `Alt+${k}`;
      hasMigrated = true;
    }
    migratedConfig[newKey] = config[k];
  });
  if (hasMigrated) store.set('shortcutConfig', migratedConfig);

  const finalConfig = hasMigrated ? migratedConfig : config;

  Object.keys(finalConfig).forEach(accel => {
    // 雖然這裡不使用序號切換，但我們將整個按鍵字串傳給前端，讓前端處理邏輯
    try {
      globalShortcut.register(accel, () => {
        const windows = BrowserWindow.getAllWindows();
        const win = windows.length > 0 ? windows[0] : null;
        if (win && !win.isDestroyed()) {
          win.webContents.send('switch-tab', accel); // 傳送 accelerator 字串
          if (!win.isVisible()) win.show();
          win.focus();
        }
      });
    } catch (e) {
      console.error(`Failed to register shortcut ${accel}:`, e);
    }
  });

  console.log('Tab shortcuts registered dynamically.');
  //#endregion
}

/**
 * 取消所有全域快捷鍵
 */
function unregisterShortcuts() {
  globalShortcut.unregisterAll();
}

module.exports = { registerShortcuts, unregisterShortcuts };
