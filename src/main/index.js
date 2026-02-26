'use strict';

const { app, session } = require('electron');
const contextMenu = require('electron-context-menu');

//#region 效能優化設定
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('renderer-process-limit', '4');
app.commandLine.appendSwitch('enable-features', 'MemorySavings');
//#endregion

//#region 單一實例鎖定
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const { getMainWindow } = require('./window');
    const win = getMainWindow();
    if (win) {
      if (win.isMinimized()) win.restore();
      win.show();
      win.focus();
    }
  });
}
//#endregion

//#region 右鍵選單
contextMenu({
  showSaveImageAs: true,
  showCopyImageAddress: true,
  showSearchWithGoogle: false,
  showInspectElement: app.isPackaged ? false : true
});
//#endregion

//#region 應用程式生命週期
app.whenReady().then(async () => {
  const { createWindow } = require('./window');
  const { createTray } = require('./tray');
  const { createMenu } = require('./menu');
  const { registerShortcuts } = require('./shortcuts');
  const { registerStoreHandlers } = require('./ipc/store-handlers');
  const { registerGitHandlers } = require('./ipc/git-handlers');
  const { registerSkillHandlers } = require('./ipc/skill-handlers');

  // 註冊所有 IPC handlers
  registerStoreHandlers();
  registerGitHandlers();
  registerSkillHandlers();

  // 設定 Google 服務 User-Agent
  const chromeVersion = process.versions.chrome;
  const userAgent = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
  const ses = session.fromPartition('persist:google');
  ses.setUserAgent(userAgent);
  ses.webRequest.onBeforeSendHeaders((details, callback) => {
    const headers = { ...details.requestHeaders };
    delete headers['X-Electron-Version'];
    headers['User-Agent'] = userAgent;
    headers['Sec-CH-UA'] = `"Chromium";v="${chromeVersion.split('.')[0]}", "Google Chrome";v="${chromeVersion.split('.')[0]}", "Not=A?Brand";v="99"`;
    headers['Sec-CH-UA-Mobile'] = '?0';
    headers['Sec-CH-UA-Platform'] = '"Windows"';
    callback({ requestHeaders: headers });
  });

  createMenu();
  createWindow();

  if (process.platform !== 'darwin') {
    createTray();
  }

  registerShortcuts();

  app.on('activate', () => {
    const { getMainWindow } = require('./window');
    const win = getMainWindow();
    if (!win || win.isDestroyed()) {
      createWindow();
    } else {
      win.show();
    }
  });
});

app.on('window-all-closed', () => {
  const { getTray } = require('./tray');
  if (process.platform !== 'darwin' && !getTray()) {
    app.quit();
  }
});

app.on('before-quit', () => {
  const { setQuitting } = require('./tray');
  setQuitting();
});

app.on('will-quit', () => {
  const { unregisterShortcuts } = require('./shortcuts');
  unregisterShortcuts();
});
//#endregion
