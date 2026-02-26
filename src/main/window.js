'use strict';

const { BrowserWindow, shell } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store();

/** @type {BrowserWindow|null} */
let mainWindow = null;

/**
 * 建立主視窗
 * @returns {BrowserWindow}
 */
function createWindow() {
  const windowBounds = store.get('windowBounds', { width: 420, height: 700 });
  const isMaximized = store.get('isMaximized', false);

  mainWindow = new BrowserWindow({
    width: windowBounds.width,
    height: windowBounds.height,
    x: windowBounds.x,
    y: windowBounds.y,
    title: 'Multi Hub',
    backgroundColor: '#fff',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      enableRemoteModule: false,
      spellcheck: true
    },
    icon: path.join(__dirname, '../../assets/icon.png')
  });

  mainWindow.loadFile(path.join(__dirname, '../index.html'));

  mainWindow.once('ready-to-show', () => {
    if (isMaximized) mainWindow.maximize();
    mainWindow.show();
  });

  //#region 視窗狀態儲存
  const saveState = () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (!mainWindow.isMaximized()) store.set('windowBounds', mainWindow.getBounds());
      store.set('isMaximized', mainWindow.isMaximized());
    }
  };

  mainWindow.on('resize', saveState);
  mainWindow.on('move', saveState);
  //#endregion

  //#region 關閉行為：最小化至系統匣
  mainWindow.on('close', (event) => {
    saveState();
    const { isQuitting } = require('./tray');
    if (!isQuitting()) {
      event.preventDefault();
      if (process.platform === 'darwin') {
        require('electron').app.hide();
      } else if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.hide();
      }
      return false;
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  //#endregion

  //#region 外部連結處理
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http') && !url.includes('messenger.com') && !url.includes('facebook.com')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.webContents.on('did-create-window', (window) => {
    window.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });
  });
  //#endregion

  //#region 頁面標題變更（未讀訊息偵測）
  mainWindow.webContents.on('page-title-updated', (event, title) => {
    event.preventDefault();
    const match = title.match(/\((\d+)\)/);
    const { updateBadge } = require('./tray');
    updateBadge(match ? parseInt(match[1], 10) : 0);
  });
  //#endregion

  return mainWindow;
}

/**
 * 取得主視窗實例
 * @returns {BrowserWindow|null}
 */
function getMainWindow() {
  return mainWindow;
}

module.exports = { createWindow, getMainWindow };
