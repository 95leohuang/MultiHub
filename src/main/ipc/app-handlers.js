'use strict';

const { ipcMain, shell, dialog, app } = require('electron');
const fs = require('fs');
const path = require('path');
const Store = require('electron-store');

const store = new Store();

/**
 * 註冊應用程式 IPC handlers
 * (從 index.js 抽取)
 */
function registerAppHandlers() {
  const { getMainWindow } = require('../window');

  // IPC 事件处理
  ipcMain.on('notification-click', () => {
    const win = getMainWindow();
    if (win && !win.isDestroyed()) win.show();
  });

  ipcMain.on('update-badge', (event, count) => {
    const { updateBadge } = require('../tray');
    updateBadge(count);
  });

  // 開啟外部連結
  ipcMain.on('open-external', (event, url) => {
    shell.openExternal(url);
  });

  // 送出 Toast 通知
  ipcMain.on('show-toast', (event, { message, type }) => {
    const win = getMainWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send('toast', { message, type });
    }
  });

  // Get/Set Saved Path
  ipcMain.handle('get-saved-path', () => {
    return store.get('gitSearchPath', '');
  });

  ipcMain.handle('save-path', (event, savePath) => {
    store.set('gitSearchPath', savePath);
  });

  // 選擇目錄
  ipcMain.handle('select-directory', async () => {
    const win = getMainWindow();
    const result = await dialog.showOpenDialog(win, {
      properties: ['openDirectory']
    });
    if (result.canceled) return null;
    return result.filePaths[0];
  });

  // Quick Notes: 圖片處理
  ipcMain.handle('save-image', async (event, { buffer, ext }) => {
    try {
      const userDataPath = app.getPath('userData');
      const imagesDir = path.join(userDataPath, 'quick-notes-images');
      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
      }
      const filename = `img_${Date.now()}.${ext || 'png'}`;
      const filePath = path.join(imagesDir, filename);
      fs.writeFileSync(filePath, Buffer.from(buffer));
      return `local://${encodeURI(filePath.replace(/\\/g, '/'))}`;
    } catch (error) {
      console.error('Failed to save image:', error);
      return null;
    }
  });

  ipcMain.handle('select-image', async () => {
    try {
      const win = getMainWindow();
      const result = await dialog.showOpenDialog(win, {
        properties: ['openFile'],
        filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] }]
      });

      if (result.canceled || result.filePaths.length === 0) return null;

      const sourcePath = result.filePaths[0];
      const userDataPath = app.getPath('userData');
      const imagesDir = path.join(userDataPath, 'quick-notes-images');
      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
      }

      const ext = path.extname(sourcePath).slice(1);
      const filename = `img_${Date.now()}.${ext || 'png'}`;
      const destPath = path.join(imagesDir, filename);

      fs.copyFileSync(sourcePath, destPath);
      return `local://${encodeURI(destPath.replace(/\\/g, '/'))}`;
    } catch (error) {
      console.error('Failed to select image:', error);
      return null;
    }
  });
}

module.exports = { registerAppHandlers };
