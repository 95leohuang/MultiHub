/**
 * app.js — 渲染程序主入口
 * 整合所有 renderer 模組的初始化與事件綁定
 *
 * 依賴（由 index.html 依序載入的 script）：
 *   renderer/platform-config.js
 *   renderer/toast.js
 *   renderer/sidebar.js
 *   renderer/nav-bar.js
 *   renderer/tab-manager.js
 *   renderer/grid-popup.js
 *   renderer/shortcut-settings.js
 *   renderer/theme.js
 *   renderer/quick-notes.js
 */

import { bindNavBarEvents } from './nav-bar.js';
import { initWebviews, webviews } from './tab-manager.js';
import { bindGridPopupEvents } from './grid-popup.js';
import { getShortcutConfig } from './shortcut-settings.js';
import { initTheme } from './theme.js';
import { initializeShortcutLayout, bindShortcutLayoutSettings } from './app-layout.js';
import { bindAppKeyboardShortcuts } from './app-keyboard.js';
import { bindAppIpc } from './app-ipc.js';
import { initQuickNotes } from './features/quick-notes.js';
import { initAiButler, toggleDrawer as toggleAiButler } from './features/ai-butler-ui.js';

import './features/git-updater-ui.js';
import './features/skill-sync-ui.js';
import './features/git-gui-ui.js';

document.addEventListener('DOMContentLoaded', () => {

  //#region 初始化各模組
  initWebviews();
  initTheme();
  initQuickNotes();
  initAiButler();
  bindNavBarEvents(webviews);
  bindGridPopupEvents(getShortcutConfig());

  // AI Butler sidebar button
  document.getElementById('ai-butler-sidebar-btn')
    ?.addEventListener('click', toggleAiButler);
  //#endregion

  initializeShortcutLayout();
  bindShortcutLayoutSettings();
  bindAppKeyboardShortcuts(getShortcutConfig);
  bindAppIpc(getShortcutConfig);
});
