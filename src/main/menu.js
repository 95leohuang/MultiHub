'use strict';

const { Menu, app } = require('electron');

/**
 * 建立並套用應用程式選單
 */
function createMenu() {
  const { getMainWindow } = require('./window');
  const { setQuitting } = require('./tray');

  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Conversation',
          accelerator: 'CmdOrCtrl+N',
          click: () => { const w = getMainWindow(); if (w) w.webContents.send('new-conversation'); }
        },
        { type: 'separator' },
        {
          label: 'Settings',
          accelerator: 'CmdOrCtrl+,',
          click: () => { const w = getMainWindow(); if (w) w.webContents.send('show-settings'); }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Alt+F4',
          click: () => { setQuitting(); app.quit(); }
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
          click: () => { const w = getMainWindow(); if (w) w.webContents.reload(); }
        },
        {
          label: 'Force Reload',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => { const w = getMainWindow(); if (w) w.webContents.reloadIgnoringCache(); }
        },
        { type: 'separator' },
        {
          label: 'Actual Size',
          accelerator: 'CmdOrCtrl+0',
          click: () => { const w = getMainWindow(); if (w) w.webContents.setZoomLevel(0); }
        },
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => { const w = getMainWindow(); if (w) w.webContents.setZoomLevel(w.webContents.getZoomLevel() + 0.5); }
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: () => { const w = getMainWindow(); if (w) w.webContents.setZoomLevel(w.webContents.getZoomLevel() - 0.5); }
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
        { label: 'Minimize', accelerator: 'CmdOrCtrl+M', role: 'minimize' },
        {
          label: 'Close',
          accelerator: 'CmdOrCtrl+W',
          click: () => { const w = getMainWindow(); if (w) w.hide(); }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            const w = getMainWindow();
            require('electron').dialog.showMessageBox(w, {
              type: 'info',
              title: 'About',
              message: 'Multi Hub',
              detail: `Multi Hub v${app.getVersion()}\n\nMulti-service hub for Messenger, ChatGPT, Gemini, Git Repo Updater, Discord, and Telegram`,
              buttons: ['OK']
            });
          }
        },
        { type: 'separator' },
        {
          label: 'Developer Tools',
          accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
          click: () => { const w = getMainWindow(); if (w) w.webContents.toggleDevTools(); }
        }
      ]
    }
  ];

  if (process.platform === 'darwin') {
    template.unshift({
      label: app.name,
      submenu: [
        { label: `关于 ${app.name}`, role: 'about' },
        { type: 'separator' },
        { label: '服务', role: 'services' },
        { type: 'separator' },
        { label: `隐藏 ${app.name}`, accelerator: 'Cmd+H', role: 'hide' },
        { label: '隐藏其他', accelerator: 'Cmd+Alt+H', role: 'hideOthers' },
        { label: '显示全部', role: 'unhide' },
        { type: 'separator' },
        { label: '退出', accelerator: 'Cmd+Q', click: () => { setQuitting(); app.quit(); } }
      ]
    });
  }

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

module.exports = { createMenu };
