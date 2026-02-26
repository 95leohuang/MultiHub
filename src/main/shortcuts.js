'use strict';

const { globalShortcut } = require('electron');

/**
 * 註冊所有全域快捷鍵
 */
function registerShortcuts() {
  const { getMainWindow } = require('./window');

  //#region 顯示/隱藏視窗
  const toggleWindow = () => {
    const win = getMainWindow();
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

  //#region Alt+1~6 切換 Tab
  for (let i = 1; i <= 6; i++) {
    globalShortcut.register(`Alt+${i}`, () => {
      const win = getMainWindow();
      if (win && !win.isDestroyed()) {
        win.webContents.send('switch-tab', i);
        if (!win.isVisible()) win.show();
        win.focus();
      }
    });
  }
  console.log('Tab shortcuts (Alt+1~6) registered');
  //#endregion
}

/**
 * 取消所有全域快捷鍵
 */
function unregisterShortcuts() {
  globalShortcut.unregisterAll();
}

module.exports = { registerShortcuts, unregisterShortcuts };
