const { app, BrowserWindow, globalShortcut, session, protocol } = require('electron');
const contextMenu = require('electron-context-menu');

//#region 效能優化設定
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('renderer-process-limit', '4');
app.commandLine.appendSwitch('enable-features', 'MemorySavings');
//#endregion

// 单实例锁定
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

// 右键菜单
contextMenu({
  showSaveImageAs: true,
  showCopyImageAddress: true,
  showSearchWithGoogle: false,
  showInspectElement: app.isPackaged ? false : true
});

app.on('web-contents-created', (event, contents) => {
  if (contents.getType() === 'webview') {
    // webview event hooks (reserved)
  }
});

// ===== 應用生命周期 =====
app.whenReady().then(async () => {
  // 註冊 local:// 協議
  protocol.handle('local', async (request) => {
    let filePath = request.url.slice('local://'.length);
    filePath = decodeURIComponent(filePath);
    if (process.platform === 'win32') {
      if (filePath.startsWith('/')) filePath = filePath.slice(1);
      if (/^[a-zA-Z]\//.test(filePath)) filePath = filePath[0] + ':' + filePath.slice(1);
    }
    try {
      const data = await require('fs').promises.readFile(filePath);
      return new Response(data);
    } catch (error) {
      console.error('Local protocol error:', error, 'path:', filePath);
      return new Response('Not Found', { status: 404 });
    }
  });

  // User-Agent for Google services (YouTube/Gemini login fix)
  const chromeVersion = process.versions.chrome;
  const userAgent = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;

  for (const partition of ['persist:google']) {
    const ses = session.fromPartition(partition);
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
  }

  // 建立視窗 (使用 window.js 模組)
  const { createWindow, getMainWindow } = require('./window');
  createWindow();

  // 建立系統匣 (使用 tray.js 模組)
  if (process.platform !== 'darwin') {
    const { createTray } = require('./tray');
    createTray();
  }

  // 建立選單 (使用 menu.js 模組)
  const { createMenu } = require('./menu');
  createMenu();

  // 全域快捷鍵: Alt+` 顯示/隱藏視窗
  const registered = globalShortcut.register('Alt+`', () => {
    const win = getMainWindow();
    if (win && !win.isDestroyed()) {
      win.isVisible() ? win.hide() : (win.show(), win.focus());
    }
  });

  if (!registered) {
    globalShortcut.register('CommandOrControl+Shift+M', () => {
      const win = getMainWindow();
      if (win && !win.isDestroyed()) {
        win.isVisible() ? win.hide() : (win.show(), win.focus());
      }
    });
  }

  console.log('Global shortcut registered:', registered ? 'Alt+`' : 'Ctrl+Shift+M');

  // ===== 註冊所有 IPC Handlers =====
  const { registerShortcuts } = require('./shortcuts');
  registerShortcuts();

  const { registerShortcutHandlers } = require('./ipc/shortcut-handlers');
  registerShortcutHandlers();

  const { registerAppHandlers } = require('./ipc/app-handlers');
  registerAppHandlers();

  const { registerGitRepoHandlers } = require('./ipc/git-repo-handlers');
  registerGitRepoHandlers();

  const { registerGitGuiHandlers } = require('./ipc/git-gui-handlers');
  registerGitGuiHandlers();

  const { registerSkillHandlers } = require('./ipc/skill-handlers');
  registerSkillHandlers();

  try {
    const { registerStoreHandlers } = require('./ipc/store-handlers');
    registerStoreHandlers();
  } catch (e) { }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      const win = getMainWindow();
      if (win && !win.isDestroyed()) win.show();
    }
  });
});

app.on('window-all-closed', () => {
  const { getTray } = require('./tray');
  if (process.platform !== 'darwin' && !getTray()) app.quit();
});

app.on('before-quit', () => {
  const { setQuitting } = require('./tray');
  setQuitting();
});

app.on('will-quit', () => { globalShortcut.unregisterAll(); });
