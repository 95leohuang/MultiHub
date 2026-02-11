const { app, BrowserWindow, Menu, Tray, shell, ipcMain, nativeImage, globalShortcut, session } = require('electron');
const path = require('path');
const crypto = require('crypto');
const Store = require('electron-store');
const contextMenu = require('electron-context-menu');
// Removed unused fetch import

//#region 效能優化設定
// 禁用 GPU 加速（解決某些顯卡驅動的相容性問題）
app.disableHardwareAcceleration();

// 禁用 GPU 沙盒（減少 GPU 程序崩潰）
app.commandLine.appendSwitch('disable-gpu-sandbox');

// 限制渲染程序數量（減少記憶體使用）
app.commandLine.appendSwitch('renderer-process-limit', '4');

// 啟用記憶體節省模式
app.commandLine.appendSwitch('enable-features', 'MemorySavings');
//#endregion

// 初始化配置存储
const store = new Store();

// 快捷鍵配置處理
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

//#region Skill Synchronizer Handlers
ipcMain.handle('compare-skills', async (event, rootPath) => {
  if (!fs.existsSync(rootPath)) return { error: 'Invalid root path' };
  let actualRoot = rootPath;
  const parts = rootPath.split(/[\\/]/);
  const vfcIndex = parts.indexOf('VegasFrenzyClient');
  if (vfcIndex !== -1) {
    if (vfcIndex > 1) actualRoot = parts.slice(0, vfcIndex - 1).join(path.sep);
    else if (vfcIndex > 0) actualRoot = parts.slice(0, vfcIndex).join(path.sep);
  }

  const results = { repos: [], fileMap: {}, scannedRoot: actualRoot };
  const maxDepth = 4;

  function scanSkillsFolder(skillRoot, repoName, currentSubPath = '') {
    const fullPath = path.join(skillRoot, currentSubPath);
    try {
      const entries = fs.readdirSync(fullPath, { withFileTypes: true });
      entries.forEach(entry => {
        const relativePath = path.join(currentSubPath, entry.name);
        if (entry.isDirectory()) scanSkillsFolder(skillRoot, repoName, relativePath);
        else if (entry.isFile()) {
          const filePath = path.join(fullPath, entry.name);
          const content = fs.readFileSync(filePath);
          const hash = crypto.createHash('md5').update(content).digest('hex');
          const stat = fs.statSync(filePath);
          const fileKey = relativePath.replace(/\\/g, '/');
          if (!results.fileMap[fileKey]) results.fileMap[fileKey] = {};
          results.fileMap[fileKey][repoName] = { hash, mtime: stat.mtimeMs, size: stat.size };
        }
      });
    } catch (e) { console.error(e); }
  }

  function findVFC(currentPath, depth) {
    if (depth > maxDepth) return;
    try {
      if (!fs.existsSync(currentPath) || !fs.statSync(currentPath).isDirectory()) return;
      const isVFC = path.basename(currentPath) === 'VegasFrenzyClient';
      if (isVFC) {
        const skillPath = path.join(currentPath, '.cursor', 'skills');
        const hasSkills = fs.existsSync(skillPath);
        const folderName = path.basename(path.dirname(currentPath));
        results.repos.push({ name: folderName, skillPath, exists: hasSkills });
        if (hasSkills) scanSkillsFolder(skillPath, folderName);
        return;
      }
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });
      for (const entry of entries) if (entry.isDirectory()) findVFC(path.join(currentPath, entry.name), depth + 1);
    } catch (e) { console.error(e); }
  }
  findVFC(actualRoot, 0);
  return results;
});

ipcMain.handle('read-skill-content', async (event, { skillPath, filename }) => {
  try {
    const fullPath = path.join(skillPath, filename);
    if (!fs.existsSync(fullPath)) return { error: 'File not found' };
    return { content: fs.readFileSync(fullPath, 'utf8') };
  } catch (err) { return { error: err.message }; }
});

ipcMain.handle('sync-skill-file', async (event, { sourceSkillPath, filename, targetSkillPaths }) => {
  try {
    const sourcePath = path.join(sourceSkillPath, filename);
    const content = fs.readFileSync(sourcePath);
    for (const targetSkillPath of targetSkillPaths) {
      const destPath = path.join(targetSkillPath, filename);
      const destDir = path.dirname(destPath);
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
      fs.writeFileSync(destPath, content);
    }
    return { success: true };
  } catch (err) { return { success: false, error: err.message }; }
});
//#endregion

let mainWindow;
let tray;
let isQuitting = false;
let blocker = null;

// 单实例锁定
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
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

function createWindow() {
  // 获取保存的窗口位置和大小
  const windowBounds = store.get('windowBounds', {
    width: 420,
    height: 700
  });
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
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      enableRemoteModule: false,
      spellcheck: true
    },
    // 使用自訂圖示
    icon: path.join(__dirname, '../assets/icon.png')
  });

  // 加载自訂 HTML（包含 Tab 切換）
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // 窗口准备好后显示
  mainWindow.once('ready-to-show', () => {
    if (isMaximized) {
      mainWindow.maximize();
    }
    mainWindow.show();
  });

  // 即時儲存視窗狀態
  const saveState = () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (!mainWindow.isMaximized()) {
        store.set('windowBounds', mainWindow.getBounds());
      }
      store.set('isMaximized', mainWindow.isMaximized());
    }
  };

  mainWindow.on('resize', saveState);
  mainWindow.on('move', saveState);

  // 保存窗口位置和大小
  mainWindow.on('close', (event) => {
    saveState();

    if (!isQuitting) {
      event.preventDefault();

      if (process.platform === 'darwin') {
        app.hide();
      } else if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.hide();
      }

      return false;
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 处理外部链接
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // 在默认浏览器中打开外部链接
    if (url.startsWith('http') && !url.includes('messenger.com') && !url.includes('facebook.com')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // 处理新窗口
  mainWindow.webContents.on('did-create-window', (window) => {
    window.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });
  });

  // 通知处理
  mainWindow.webContents.on('page-title-updated', (event, title) => {
    event.preventDefault();

    // 检测未读消息数量
    const match = title.match(/\((\d+)\)/);
    if (match) {
      const count = parseInt(match[1], 10);
      updateBadge(count);
    } else {
      updateBadge(0);
    }
  });

  // 创建应用菜单
  createMenu();
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Conversation',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('new-conversation');
          }
        },
        { type: 'separator' },
        {
          label: 'Settings',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            mainWindow.webContents.send('show-settings');
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Alt+F4',
          click: () => {
            isQuitting = true;
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: 'Select All', accelerator: 'CmdOrCtrl+A', role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.webContents.reload();
          }
        },
        {
          label: 'Force Reload',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => {
            mainWindow.webContents.reloadIgnoringCache();
          }
        },
        { type: 'separator' },
        {
          label: 'Actual Size',
          accelerator: 'CmdOrCtrl+0',
          click: () => {
            mainWindow.webContents.setZoomLevel(0);
          }
        },
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => {
            const currentZoom = mainWindow.webContents.getZoomLevel();
            mainWindow.webContents.setZoomLevel(currentZoom + 0.5);
          }
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: () => {
            const currentZoom = mainWindow.webContents.getZoomLevel();
            mainWindow.webContents.setZoomLevel(currentZoom - 0.5);
          }
        },
        { type: 'separator' },
        {
          label: 'Full Screen',
          accelerator: process.platform === 'darwin' ? 'Ctrl+Cmd+F' : 'F11',
          role: 'togglefullscreen'
        }
      ]
    },
    {
      label: 'Window',
      submenu: [
        {
          label: 'Minimize',
          accelerator: 'CmdOrCtrl+M',
          role: 'minimize'
        },
        {
          label: 'Close',
          accelerator: 'CmdOrCtrl+W',
          click: () => {
            mainWindow.hide();
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            const aboutMessage = `Multi Hub v${app.getVersion()}\n\nMulti-service hub for Messenger, ChatGPT, Gemini, Git Repo Updater, Discord, and Telegram`;
            require('electron').dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About',
              message: 'Multi Hub',
              detail: aboutMessage,
              buttons: ['OK']
            });
          }
        },
        { type: 'separator' },
        {
          label: 'Developer Tools',
          accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
          click: () => {
            mainWindow.webContents.toggleDevTools();
          }
        }
      ]
    }
  ];

  // macOS 特定菜单
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.name,
      submenu: [
        {
          label: `关于 ${app.name}`,
          role: 'about'
        },
        { type: 'separator' },
        {
          label: '服务',
          role: 'services'
        },
        { type: 'separator' },
        {
          label: `隐藏 ${app.name}`,
          accelerator: 'Cmd+H',
          role: 'hide'
        },
        {
          label: '隐藏其他',
          accelerator: 'Cmd+Alt+H',
          role: 'hideOthers'
        },
        {
          label: '显示全部',
          role: 'unhide'
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: 'Cmd+Q',
          click: () => {
            isQuitting = true;
            app.quit();
          }
        }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createTray() {
  // 使用自訂圖示作為系統匣圖示
  const trayIconPath = path.join(__dirname, '../assets/icon.png');
  const icon = nativeImage.createFromPath(trayIconPath).resize({ width: 16, height: 16 });
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => {
        mainWindow.show();
      }
    },
    {
      label: 'Exit',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip('Multi Hub');

  tray.on('click', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
      }
    }
  });
}

function updateBadge(count) {
  if (process.platform === 'darwin') {
    app.dock.setBadge(count > 0 ? count.toString() : '');
  } else if (process.platform === 'win32' && tray) {
    // 在 Windows 上，透過工具提示顯示未讀計數
    if (count > 0) {
      tray.setToolTip(`Multi Hub - ${count} 則未讀訊息`);
    } else {
      tray.setToolTip('Multi Hub');
    }
  }
}

//#region Git Operations
const fs = require('fs');

app.on('web-contents-created', (event, contents) => {
  // 只處理 webview 的 webContents
  if (contents.getType() === 'webview') {
    // YouTube adblocker removed
  }
});

// 應用生命周期
app.whenReady().then(async () => {

  // 設定 Google 服務的 User-Agent（解決 YouTube/Gemini 登入問題）

  // 取得 Chrome 版本號
  const chromeVersion = process.versions.chrome;
  const userAgent = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;

  // 為 Google 服務（YouTube、Gemini）的共用 partition 設定 User-Agent
  const googlePartitions = ['persist:google'];

  for (const partition of googlePartitions) {
    const ses = session.fromPartition(partition);
    ses.setUserAgent(userAgent);

    // 移除 Electron 相關的 header，讓 Google 認為是正常瀏覽器
    ses.webRequest.onBeforeSendHeaders((details, callback) => {
      const headers = { ...details.requestHeaders };

      // 移除可能暴露 Electron 身份的 header
      delete headers['X-Electron-Version'];

      // 確保 User-Agent 正確
      headers['User-Agent'] = userAgent;

      // 設定 Sec-CH-UA 相關 header（Client Hints）
      headers['Sec-CH-UA'] = `"Chromium";v="${chromeVersion.split('.')[0]}", "Google Chrome";v="${chromeVersion.split('.')[0]}", "Not=A?Brand";v="99"`;
      headers['Sec-CH-UA-Mobile'] = '?0';
      headers['Sec-CH-UA-Platform'] = '"Windows"';

      callback({ requestHeaders: headers });
    });
  }

  createWindow();

  if (process.platform !== 'darwin') {
    createTray();
  }

  // 註冊全域快捷鍵 Alt+` (反引號) 顯示/隱藏視窗
  // 注意：Alt+Space 在 Windows 是系統保留快捷鍵，改用 Alt+`
  const registered = globalShortcut.register('Alt+`', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });

  // 如果 Alt+` 註冊失敗，嘗試 CommandOrControl+Shift+M
  if (!registered) {
    globalShortcut.register('CommandOrControl+Shift+M', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    });
  }

  console.log('Global shortcut registered:', registered ? 'Alt+`' : 'Ctrl+Shift+M');

  // 註冊 Alt+1~6 快捷鍵切換 Tab（全域快捷鍵，避免 webview 焦點問題）
  for (let i = 1; i <= 6; i++) {
    globalShortcut.register(`Alt+${i}`, () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('switch-tab', i);
        // 確保視窗可見
        if (!mainWindow.isVisible()) {
          mainWindow.show();
        }
        mainWindow.focus();
      }
    });
  }
  console.log('Tab shortcuts (Alt+1~6) registered');

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
});

// 應用程式退出時取消註冊全域快捷鍵
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// IPC 事件处理
ipcMain.on('notification-click', () => {
  mainWindow.show();
});

ipcMain.on('update-badge', (event, count) => {
  updateBadge(count);
});

// 開啟外部連結
ipcMain.on('open-external', (event, url) => {
  shell.openExternal(url);
});

const { exec } = require('child_process');
const { dialog } = require('electron');

// Get/Set Saved Path
ipcMain.handle('get-saved-path', () => {
  return store.get('gitSearchPath', '');
});

ipcMain.handle('save-path', (event, path) => {
  store.set('gitSearchPath', path);
});

// 選擇目錄
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});


// 搜尋 Git 儲存庫
ipcMain.handle('search-repos', async (event, searchPath) => {
  const repos = [];
  const maxDepth = 3;

  function walk(currentPath, depth) {
    if (depth > maxDepth) return;

    try {
      const files = fs.readdirSync(currentPath);
      if (files.includes('.git')) {
        repos.push(currentPath);
        return;
      }

      for (const file of files) {
        const fullPath = path.join(currentPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
          walk(fullPath, depth + 1);
        }
      }
    } catch (e) {
      console.error(`Error walking ${currentPath}:`, e);
    }
  }

  walk(searchPath, 0);
  return repos;
});

// 更新單一儲存庫
ipcMain.handle('update-repo', async (event, repoPath) => {
  const channel = `update-progress-${repoPath}`;
  const sendProgress = (progress, message) => {
    event.sender.send(channel, progress, message);
  };

  const runCommand = (cmd) => {
    return new Promise((resolve, reject) => {
      exec(cmd, { cwd: repoPath }, (error, stdout, stderr) => {
        if (error) {
          error.stderr = stderr;
          reject(error);
          return;
        }
        resolve(stdout);
      });
    });
  };

  let stashed = false;

  try {
    sendProgress(10, 'Fetching...');
    await runCommand('git fetch --all');

    sendProgress(30, 'Checking branches...');
    const branchesOutput = await runCommand('git branch -vv');
    const branches = branchesOutput.split('\n');

    const currentBranchMatch = branches.find(b => b.startsWith('*'));
    const currentBranch = currentBranchMatch ? currentBranchMatch.split(/\s+/)[1] : 'main';

    sendProgress(50, `Checking for updates...`);
    const behindBranches = branches.filter(b => b.includes(': behind'));

    const smartCommand = async (cmd) => {
      try {
        await runCommand(cmd);
      } catch (err) {
        // 如果是因為有本地變更衝突
        if (err.stderr && (err.stderr.includes('local changes to the following files would be overwritten') || err.stderr.includes('Please commit your changes or stash them'))) {
          if (!stashed) {
            sendProgress(55, 'Conflict detected, stashing...');
            const stashResult = await runCommand('git stash');
            if (!stashResult.includes('No local changes to save')) {
              stashed = true;
              // 重試原本指令
              await runCommand(cmd);
              return;
            }
          }
        }
        throw err;
      }
    };

    for (const b of behindBranches) {
      const branchName = b.replace('*', '').trim().split(/\s+/)[0];
      sendProgress(70, `Updating ${branchName}...`);
      await smartCommand(`git checkout ${branchName}`);
      await smartCommand('git pull');
    }

    // 回到原始分支
    if (currentBranchMatch) {
      await smartCommand(`git checkout ${currentBranch}`);
    }

    const isCurrentBehind = behindBranches.some(b => b.includes(` ${currentBranch} `) || (currentBranchMatch && currentBranchMatch.includes(': behind')));
    if (isCurrentBehind) {
      sendProgress(90, `Updating ${currentBranch}...`);
      await smartCommand('git pull');
    }

    if (stashed) {
      sendProgress(95, 'Restoring changes...');
      await runCommand('git stash pop');
    }

    sendProgress(100, 'Finished');
    return { success: true };
  } catch (err) {
    // 發生錯誤時嘗試還原 stash (如果有的話)
    if (stashed) {
      try { await runCommand('git stash pop'); } catch (e) { }
    }
    return { success: false, error: err.stderr || err.message };
  }
});

// End of Skill Sync Handlers removed from bottom

