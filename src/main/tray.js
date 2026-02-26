'use strict';

const { Tray, Menu, nativeImage, app } = require('electron');
const path = require('path');

/** @type {Tray|null} */
let tray = null;
let _isQuitting = false;

/**
 * 取得退出狀態
 * @returns {boolean}
 */
function isQuitting() {
  return _isQuitting;
}

/**
 * 設定退出旗標
 */
function setQuitting() {
  _isQuitting = true;
}

/**
 * 建立系統匣
 */
function createTray() {
  const trayIconPath = path.join(__dirname, '../../assets/icon.png');
  const icon = nativeImage.createFromPath(trayIconPath).resize({ width: 16, height: 16 });
  tray = new Tray(icon);

  const buildTrayMenu = () => {
    const { getMainWindow } = require('./window');
    const win = getMainWindow();
    return Menu.buildFromTemplate([
      {
        label: 'Show Multi Hub',
        click: () => {
          if (win && !win.isDestroyed()) { win.show(); win.focus(); }
        }
      },
      { type: 'separator' },
      {
        label: 'Messenger',
        click: () => { if (win) { win.show(); win.webContents.send('switch-tab', 1); } }
      },
      {
        label: 'ChatGPT',
        click: () => { if (win) { win.show(); win.webContents.send('switch-tab', 2); } }
      },
      {
        label: 'Discord',
        click: () => { if (win) { win.show(); win.webContents.send('switch-tab', 5); } }
      },
      { type: 'separator' },
      {
        label: 'Exit',
        click: () => { _isQuitting = true; app.quit(); }
      }
    ]);
  };

  tray.setContextMenu(buildTrayMenu());
  tray.setToolTip('Multi Hub');

  tray.on('click', () => {
    const { getMainWindow } = require('./window');
    const win = getMainWindow();
    if (win && !win.isDestroyed()) {
      if (win.isVisible() && win.isFocused()) {
        win.hide();
      } else {
        win.show();
        win.focus();
      }
    }
  });

  tray.on('double-click', () => {
    const { getMainWindow } = require('./window');
    const win = getMainWindow();
    if (win && !win.isDestroyed()) { win.show(); win.focus(); }
  });
}

/**
 * 更新系統匣未讀徽章
 * @param {number} count
 */
function updateBadge(count) {
  if (process.platform === 'darwin') {
    app.dock.setBadge(count > 0 ? count.toString() : '');
  } else if (process.platform === 'win32' && tray) {
    tray.setToolTip(count > 0 ? `Multi Hub - ${count} 則未讀訊息` : 'Multi Hub');
  }
}

/**
 * 取得 Tray 實例
 * @returns {Tray|null}
 */
function getTray() {
  return tray;
}

module.exports = { createTray, updateBadge, getTray, isQuitting, setQuitting };
