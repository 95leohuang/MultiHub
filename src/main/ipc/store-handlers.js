'use strict';

const { ipcMain, shell, dialog } = require('electron');
const Store = require('electron-store');

const store = new Store();

/**
 * 註冊設定儲存相關 IPC handlers
 */
function registerStoreHandlers() {
  //#region 快捷鍵設定
  ipcMain.handle('get-shortcut-config', () => {
    return store.get('shortcutConfig', {
      1: ['messenger'],
      2: ['chatgpt'],
      3: ['gemini'],
      4: ['git'],
      5: ['discord'],
      6: ['telegram']
    });
  });

  ipcMain.handle('save-shortcut-config', (event, config) => {
    store.set('shortcutConfig', config);
  });
  //#endregion

  //#region 路徑儲存
  ipcMain.handle('get-saved-path', () => {
    return store.get('gitSearchPath', '');
  });

  ipcMain.handle('save-path', (event, pathValue) => {
    store.set('gitSearchPath', pathValue);
  });
  //#endregion

  //#region 目錄選擇
  ipcMain.handle('select-directory', async () => {
    const { getMainWindow } = require('../window');
    const result = await dialog.showOpenDialog(getMainWindow(), {
      properties: ['openDirectory']
    });
    if (result.canceled) return null;
    return result.filePaths[0];
  });
  //#endregion

  //#region 外部連結 & 通知
  ipcMain.on('open-external', (event, url) => {
    shell.openExternal(url);
  });

  ipcMain.on('notification-click', () => {
    const { getMainWindow } = require('../window');
    const win = getMainWindow();
    if (win) win.show();
  });

  ipcMain.on('update-badge', (event, count) => {
    const { updateBadge } = require('../tray');
    updateBadge(count);
  });
  //#endregion

  //#region Toast IPC 轉發
  ipcMain.on('show-toast', (event, { message, type }) => {
    const { getMainWindow } = require('../window');
    const win = getMainWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send('toast', { message, type });
    }
  });
  //#endregion
}

module.exports = { registerStoreHandlers };
