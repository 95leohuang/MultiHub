/**
 * tabs.js — Multi Hub 主控制器
 * 功能：側邊欄、導航列、Toast 通知、未讀徽章、Webview 管理、快捷鍵設定
 */

// ============================================================
// Toast 通知系統（全域可用）
// ============================================================

/**
 * 顯示 Toast 通知
 * @param {string} message
 * @param {'info'|'success'|'warning'|'error'} type
 * @param {number} duration
 */
function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const icons = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span class="toast-message">${message}</span><button class="toast-close">✕</button>`;
  container.appendChild(toast);
  const remove = () => {
    toast.classList.add('removing');
    setTimeout(() => toast.parentNode && toast.parentNode.removeChild(toast), 300);
  };
  const timer = setTimeout(remove, duration);
  toast.querySelector('.toast-close').addEventListener('click', () => { clearTimeout(timer); remove(); });
}

/**
 * 開啟外部連結
 * @param {string} url
 */
function openExternalUrl(url) {
  if (window.electronAPI && window.electronAPI.openExternal) {
    window.electronAPI.openExternal(url);
  }
}

// ============================================================
// 主初始化
// ============================================================
document.addEventListener('DOMContentLoaded', () => {

  //#region DOM 元素
  const dockTrigger = document.getElementById('dock-trigger');
  const dockFavicon = document.getElementById('dock-favicon');
  const dockBadge = document.getElementById('dock-badge');
  const gridPopup = document.getElementById('grid-popup');
  const popupGrid = document.querySelector('.popup-grid');
  const sidebarTabsEl = document.getElementById('sidebar-tabs');
  const navBar = document.getElementById('nav-bar');
  const navBack = document.getElementById('nav-back');
  const navForward = document.getElementById('nav-forward');
  const navReload = document.getElementById('nav-reload');
  const navHome = document.getElementById('nav-home');
  const navPageTitle = document.getElementById('nav-page-title');
  const navSpinner = document.getElementById('nav-loading-spinner');
  const navOpenExt = document.getElementById('nav-open-external');
  const settingsModal = document.getElementById('settings-modal');
  const shortcutConfigList = document.getElementById('shortcut-config-list');
  //#endregion

  //#region 平台設定
  const platformConfig = {
    messenger: { label: 'Messenger', favicon: 'https://static.xx.fbcdn.net/rsrc.php/yO/r/qa11ER6rke_.ico', homeUrl: 'https://www.messenger.com', color: '#0084ff' },
    chatgpt: { label: 'ChatGPT', favicon: 'https://chatgpt.com/favicon.ico', homeUrl: 'https://chatgpt.com', color: '#10a37f' },
    gemini: { label: 'Gemini', favicon: 'https://www.gstatic.com/lamda/images/gemini_favicon_f069958c85030456e93de685481c559f160ea06b.png', homeUrl: 'https://gemini.google.com', color: '#8b5cf6' },
    git: { label: 'Git Update', favicon: '../assets/git-icon.png', homeUrl: null, color: '#f97316' },
    skills: { label: 'Skill Sync', favicon: 'https://cdn-icons-png.flaticon.com/512/2103/2103633.png', homeUrl: null, color: '#06b6d4' },
    notes: { label: 'Quick Notes', favicon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23f59e0b" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>', homeUrl: null, color: '#f59e0b' },
    discord: { label: 'Discord', favicon: 'https://cdn.prod.website-files.com/6257adef93867e50d84d30e2/6266bc493fb42d4e27bb8393_847541504914fd33810e70a0ea73177e.ico', homeUrl: 'https://discord.com/app', color: '#5865f2' },
    telegram: { label: 'Telegram', favicon: 'https://web.telegram.org/favicon.ico', homeUrl: 'https://web.telegram.org', color: '#0088cc' }
  };

  const tabOrder = ['messenger', 'chatgpt', 'gemini', 'git', 'skills', 'notes', 'discord', 'telegram'];

  const webviews = {
    messenger: document.getElementById('messenger-webview'),
    chatgpt: document.getElementById('chatgpt-webview'),
    gemini: document.getElementById('gemini-webview'),
    git: document.getElementById('git-updater-ui'),
    skills: document.getElementById('skill-sync-ui'),
    notes: document.getElementById('quick-notes-ui'),
    discord: document.getElementById('discord-webview'),
    telegram: document.getElementById('telegram-webview')
  };

  const isWebviewEl = (el) => el && el.tagName === 'WEBVIEW';
  //#endregion

  //#region 快捷鍵配置
  let shortcutConfig = {
    1: ['messenger'],
    2: ['chatgpt'],
    3: ['gemini'],
    4: ['git'],
    5: ['notes'],
    6: ['discord'],
    7: ['telegram']
  };

  /** 預設快捷鍵對照（用於 migration 補齊遺漏的平台） */
  const defaultShortcutConfig = {
    1: ['messenger'],
    2: ['chatgpt'],
    3: ['gemini'],
    4: ['git'],
    5: ['notes'],
    6: ['discord'],
    7: ['telegram']
  };

  /**
   * 將舊版 shortcutConfig 做向前相容的 migration：
   * 把所有已知平台中未出現在任何 key 的，依照 defaultShortcutConfig 補入對應位置。
   * @param {object} config
   * @returns {object} 補齊後的 config
   */
  function migrateShortcutConfig(config) {
    const merged = {};
    // 複製所有舊 key
    Object.keys(config).forEach(k => {
      merged[k] = [...(config[k] || [])];
    });
    // 找出已出現的平台
    const allAssigned = new Set(Object.values(merged).flat());
    // 把 defaultShortcutConfig 中未出現的平台補回去
    Object.entries(defaultShortcutConfig).forEach(([k, services]) => {
      services.forEach(svc => {
        if (!allAssigned.has(svc) && platformConfig[svc]) {
          if (!merged[k]) merged[k] = [];
          // 只在預設 key 沒有衝突時才補入
          if (!merged[k].includes(svc)) {
            merged[k].push(svc);
            allAssigned.add(svc);
          }
        }
      });
    });
    return merged;
  }

  function loadShortcutConfig() {
    if (window.electronAPI && window.electronAPI.getShortcutConfig) {
      window.electronAPI.getShortcutConfig()
        .then(config => {
          if (config) {
            shortcutConfig = migrateShortcutConfig(config);
          }
          renderPlatformGrid();
          renderSidebar();
        })
        .catch(err => {
          console.error('loadShortcutConfig:', err);
          renderPlatformGrid();
          renderSidebar();
        });
    } else {
      renderPlatformGrid();
      renderSidebar();
    }
  }
  //#endregion

  //#region 未讀徽章
  const unreadCounts = {};

  /**
   * 更新某個 tab 的未讀徽章
   * @param {string} tabKey
   * @param {number} count
   */
  function updateBadge(tabKey, count) {
    unreadCounts[tabKey] = count;

    // 側邊欄徽章
    const sideBadge = document.getElementById(`badge-${tabKey}`);
    if (sideBadge) {
      sideBadge.textContent = count > 99 ? '99+' : String(count);
      sideBadge.classList.toggle('hidden', count <= 0);
    }

    // Grid popup 徽章
    document.querySelectorAll(`.grid-favicon[data-tab="${tabKey}"]`).forEach(img => {
      const item = img.closest('.grid-item');
      if (item) item.classList.toggle('has-badge', count > 0);
    });

    // Dock 徽章（總計）
    const total = Object.values(unreadCounts).reduce((a, b) => a + b, 0);
    if (dockBadge) {
      dockBadge.textContent = total > 99 ? '99+' : String(total);
      dockBadge.classList.toggle('hidden', total <= 0);
    }

    if (window.electronAPI && window.electronAPI.updateBadge) {
      window.electronAPI.updateBadge(total);
    }
  }
  //#endregion

  //#region 側邊欄渲染
  /**
   * 計算側邊欄排序：先依 shortcutConfig Alt+數字順序（保留快捷鍵標籤），
   * 未分配到任何快捷鍵的平台則按 label 字母排序附在後面。
   * @returns {{ key: string, shortcutNum: number|null }[]}
   */
  function getSidebarOrder() {
    const assigned = [];
    const seen = new Set();
    const maxKey = Math.max(...Object.keys(shortcutConfig).map(Number));
    for (let i = 1; i <= maxKey; i++) {
      (shortcutConfig[i] || []).forEach(key => {
        if (!seen.has(key) && platformConfig[key]) {
          assigned.push({ key, shortcutNum: i });
          seen.add(key);
        }
      });
    }
    const unassigned = tabOrder
      .filter(key => !seen.has(key) && platformConfig[key])
      .sort((a, b) => platformConfig[a].label.localeCompare(platformConfig[b].label))
      .map(key => ({ key, shortcutNum: null }));
    return [...assigned, ...unassigned];
  }

  function renderSidebar() {
    const activeTab = localStorage.getItem('activeTab') || 'messenger';
    sidebarTabsEl.innerHTML = '';
    const ordered = getSidebarOrder();
    let dividerAdded = false;

    ordered.forEach(({ key, shortcutNum }) => {
      const cfg = platformConfig[key];
      if (!cfg) return;

      // 在未分配區塊前插入分隔線
      if (!dividerAdded && shortcutNum === null) {
        dividerAdded = true;
        const div = document.createElement('div');
        div.className = 'sidebar-divider';
        sidebarTabsEl.appendChild(div);
      }

      const btn = document.createElement('button');
      btn.className = `sidebar-tab${key === activeTab ? ' active' : ''}`;
      btn.dataset.tab = key;

      const img = document.createElement('img');
      img.src = cfg.favicon;
      img.alt = cfg.label;
      img.onerror = () => { img.style.display = 'none'; };

      const badge = document.createElement('span');
      badge.className = `sidebar-badge${(unreadCounts[key] || 0) > 0 ? '' : ' hidden'}`;
      badge.id = `badge-${key}`;
      if ((unreadCounts[key] || 0) > 0) badge.textContent = String(unreadCounts[key]);

      const tooltip = document.createElement('span');
      tooltip.className = 'sidebar-tooltip';
      tooltip.textContent = shortcutNum !== null
        ? `${cfg.label} (Alt+${shortcutNum})`
        : cfg.label;

      btn.appendChild(img);
      btn.appendChild(badge);
      btn.appendChild(tooltip);
      btn.addEventListener('click', () => switchTab(key));
      sidebarTabsEl.appendChild(btn);
    });
  }
  //#endregion

  //#region Grid Popup 渲染
  function renderPlatformGrid() {
    const activeTab = localStorage.getItem('activeTab') || 'messenger';
    popupGrid.innerHTML = '';
    for (let i = 1; i <= 7; i++) {
      const services = shortcutConfig[i] || [];
      const item = document.createElement('div');
      item.className = `grid-item${services.includes(activeTab) ? ' active' : ''}`;
      item.dataset.shortcut = String(i);

      const hasUnread = services.some(s => (unreadCounts[s] || 0) > 0);
      if (hasUnread) item.classList.add('has-badge');

      const iconsContainer = document.createElement('div');
      iconsContainer.className = 'grid-icons-container';

      services.forEach((serviceKey, index) => {
        const cfg = platformConfig[serviceKey];
        if (!cfg) return;
        const img = document.createElement('img');
        img.className = `grid-favicon${serviceKey === activeTab ? ' active' : ''}`;
        img.src = cfg.favicon;
        img.title = cfg.label;
        img.dataset.tab = serviceKey;
        if (serviceKey !== activeTab && services.length > 1) {
          const off = (index + 1) * 3;
          img.style.transform = `scale(0.8) translate(${off}px, ${-off}px)`;
          img.style.zIndex = String(services.length - index);
        }
        img.addEventListener('click', (e) => { e.stopPropagation(); switchTab(serviceKey); });
        iconsContainer.appendChild(img);
      });

      const label = document.createElement('span');
      label.className = 'grid-label';
      const activeInGroup = services.find(s => s === activeTab);
      label.textContent = activeInGroup
        ? platformConfig[activeInGroup].label
        : (services.length > 0 ? platformConfig[services[0]].label : '未設定');

      const scSpan = document.createElement('span');
      scSpan.className = 'grid-shortcut';
      scSpan.textContent = String(i);

      item.appendChild(iconsContainer);
      item.appendChild(label);
      item.appendChild(scSpan);
      item.addEventListener('click', () => switchTabCarousel(i));
      popupGrid.appendChild(item);
    }
  }
  //#endregion

  //#region Popup 控制
  let isPopupOpen = false;

  function togglePopup() {
    isPopupOpen = !isPopupOpen;
    gridPopup.classList.toggle('hidden', !isPopupOpen);
    dockTrigger.classList.toggle('active', isPopupOpen);
  }

  function closePopup() {
    isPopupOpen = false;
    gridPopup.classList.add('hidden');
    dockTrigger.classList.remove('active');
  }
  //#endregion

  //#region 導航列
  function getActiveWebview() {
    const el = webviews[localStorage.getItem('activeTab') || 'messenger'];
    return isWebviewEl(el) ? el : null;
  }

  function updateNavBar(tabName) {
    const wv = webviews[tabName];
    const isWV = isWebviewEl(wv);
    navBar.classList.toggle('hidden', !isWV);
    if (!isWV) return;
    try { navBack.disabled = !wv.canGoBack(); navForward.disabled = !wv.canGoForward(); } catch (_) { }
  }

  navBack.addEventListener('click', () => { const wv = getActiveWebview(); if (wv && wv.canGoBack()) wv.goBack(); });
  navForward.addEventListener('click', () => { const wv = getActiveWebview(); if (wv && wv.canGoForward()) wv.goForward(); });
  navReload.addEventListener('click', () => {
    const wv = getActiveWebview();
    if (!wv) return;
    navReload.classList.add('loading');
    wv.reload();
  });
  navHome.addEventListener('click', () => {
    const activeTab = localStorage.getItem('activeTab') || 'messenger';
    const cfg = platformConfig[activeTab];
    const wv = getActiveWebview();
    if (wv && cfg && cfg.homeUrl) wv.loadURL(cfg.homeUrl);
  });
  navOpenExt.addEventListener('click', () => {
    const wv = getActiveWebview();
    if (wv) openExternalUrl(wv.getURL());
  });
  //#endregion

  //#region Tab 切換
  /**
   * 切換 Tab
   * @param {string} tabName
   */
  function switchTab(tabName) {
    // 1. Webview 顯示
    Object.entries(webviews).forEach(([name, el]) => {
      el.classList.toggle('active', name === tabName);
      if (name === tabName && isWebviewEl(el) && !el.src && el.dataset.src) {
        el.src = el.dataset.src;
      }
    });

    // 2. 側邊欄 active
    document.querySelectorAll('.sidebar-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // 3. Grid Popup active
    document.querySelectorAll('.grid-item').forEach(item => {
      const services = shortcutConfig[item.dataset.shortcut] || [];
      const isActiveGroup = services.includes(tabName);
      item.classList.toggle('active', isActiveGroup);
      item.querySelectorAll('.grid-favicon').forEach((img, index) => {
        const isThis = img.dataset.tab === tabName;
        img.classList.toggle('active', isThis);
        if (isThis) {
          img.style.transform = '';
          img.style.zIndex = '10';
        } else {
          const off = (index + 1) * 3;
          img.style.transform = `scale(0.8) translate(${off}px, ${-off}px)`;
          img.style.zIndex = String(services.length - index);
        }
      });
      const lbl = item.querySelector('.grid-label');
      if (lbl) {
        lbl.textContent = isActiveGroup
          ? platformConfig[tabName].label
          : (services.length > 0 ? platformConfig[services[0]].label : '');
      }
    });

    // 4. Dock favicon
    const cfg = platformConfig[tabName];
    if (cfg && dockFavicon) dockFavicon.src = cfg.favicon;

    // 5. 導航列
    if (navPageTitle) navPageTitle.textContent = cfg ? cfg.label : tabName;
    updateNavBar(tabName);

    localStorage.setItem('activeTab', tabName);
    closePopup();
  }

  /**
   * 輪播切換
   * @param {number} shortcutNum
   */
  function switchTabCarousel(shortcutNum) {
    const services = shortcutConfig[shortcutNum];
    if (!services || services.length === 0) return;
    if (services.length === 1) { switchTab(services[0]); return; }
    const cur = localStorage.getItem('activeTab');
    const idx = services.indexOf(cur);
    switchTab(services[idx !== -1 ? (idx + 1) % services.length : 0]);
  }
  //#endregion

  //#region Webview 事件
  /**
   * 注入 Google 登入提示
   * @param {HTMLElement} wv
   */
  function showGoogleLoginHint(wv) {
    wv.executeJavaScript(`
      if (!document.getElementById('mh-login-hint')) {
        const h = document.createElement('div');
        h.id = 'mh-login-hint';
        h.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#1a73e8;color:#fff;padding:10px 20px;text-align:center;z-index:999999;font-size:13px;font-family:system-ui;';
        h.innerHTML = '⚠️ Google 不允許在此應用程式內登入。請在外部瀏覽器登入後重新整理。<button onclick="this.parentElement.remove()" style="margin-left:16px;background:rgba(255,255,255,0.2);border:none;color:#fff;padding:3px 10px;border-radius:4px;cursor:pointer;">關閉</button>';
        document.body.prepend(h);
      }
    `).catch(() => { });
  }

  const internalDomains = ['messenger.com', 'facebook.com', 'chatgpt.com', 'openai.com', 'google.com', 'gemini.google.com', 'discord.com', 'telegram.org'];

  Object.entries(webviews).forEach(([name, wv]) => {
    if (!isWebviewEl(wv)) return;

    wv.addEventListener('did-start-loading', () => {
      wv.classList.add('loading');
      if (name === localStorage.getItem('activeTab')) {
        navSpinner.classList.remove('hidden');
        navReload.classList.add('loading');
      }
    });

    wv.addEventListener('did-stop-loading', () => {
      wv.classList.remove('loading');
      if (name === localStorage.getItem('activeTab')) {
        navSpinner.classList.add('hidden');
        navReload.classList.remove('loading');
        try { navBack.disabled = !wv.canGoBack(); navForward.disabled = !wv.canGoForward(); } catch (_) { }
      }
    });

    wv.addEventListener('page-title-updated', (e) => {
      if (name === localStorage.getItem('activeTab') && navPageTitle) {
        navPageTitle.textContent = e.title || platformConfig[name].label;
      }
      if (name === 'messenger' || name === 'telegram' || name === 'discord') {
        const match = (e.title || '').match(/\((\d+)\)/);
        updateBadge(name, match ? parseInt(match[1], 10) : 0);
      }
    });

    wv.addEventListener('did-navigate', (e) => {
      if (name === localStorage.getItem('activeTab')) {
        try { navBack.disabled = !wv.canGoBack(); navForward.disabled = !wv.canGoForward(); } catch (_) { }
      }
      if (name === 'gemini' && e.url && e.url.includes('accounts.google.com')) {
        showGoogleLoginHint(wv);
      }
    });

    wv.addEventListener('did-navigate-in-page', () => {
      if (name === localStorage.getItem('activeTab')) {
        try { navBack.disabled = !wv.canGoBack(); navForward.disabled = !wv.canGoForward(); } catch (_) { }
      }
    });

    wv.addEventListener('new-window', (e) => {
      if (!internalDomains.some(d => e.url.includes(d))) {
        e.preventDefault();
        openExternalUrl(e.url);
      }
    });

    wv.addEventListener('will-navigate', (e) => {
      if (name === 'gemini' && e.url && (
        e.url.includes('accounts.google.com/signin') ||
        e.url.includes('accounts.google.com/v3/signin') ||
        e.url.includes('accounts.google.com/ServiceLogin')
      )) {
        e.preventDefault();
        openExternalUrl(e.url);
      }
    });
  });
  //#endregion

  //#region 快捷鍵設定 Modal
  function renderShortcutSettings() {
    shortcutConfigList.innerHTML = '';
    for (let i = 1; i <= 7; i++) {
      const row = document.createElement('div');
      row.className = 'shortcut-row';

      const header = document.createElement('div');
      header.className = 'shortcut-row-header';
      header.innerHTML = `<span class="shortcut-number">${i}</span><span class="shortcut-label">Alt + ${i}</span>`;

      const servicesDiv = document.createElement('div');
      servicesDiv.className = 'shortcut-services';

      const currentServices = shortcutConfig[i] || [];
      tabOrder.forEach(serviceKey => {
        const isSelected = currentServices.includes(serviceKey);
        const cfg = platformConfig[serviceKey];

        const lbl = document.createElement('label');
        lbl.className = `service-check${isSelected ? ' selected' : ''}`;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.dataset.shortcut = String(i);
        checkbox.dataset.service = serviceKey;
        checkbox.checked = isSelected;
        checkbox.addEventListener('change', (e) => lbl.classList.toggle('selected', e.target.checked));

        const icon = document.createElement('img');
        icon.src = cfg.favicon;
        icon.width = 14;
        icon.height = 14;
        icon.alt = cfg.label;
        icon.style.cssText = 'vertical-align:middle;flex-shrink:0;';
        icon.onerror = () => { icon.style.display = 'none'; };

        const dot = document.createElement('span');
        dot.className = 'service-check-dot';
        dot.style.cssText = `background:${cfg.color};`;

        const text = document.createElement('span');
        text.textContent = cfg.label;

        lbl.appendChild(checkbox);
        lbl.appendChild(icon);
        lbl.appendChild(text);
        servicesDiv.appendChild(lbl);
      });

      row.appendChild(header);
      row.appendChild(servicesDiv);
      shortcutConfigList.appendChild(row);
    }
  }

  const sidebarSettingsBtn = document.getElementById('sidebar-settings-btn');
  if (sidebarSettingsBtn) {
    sidebarSettingsBtn.addEventListener('click', () => {
      renderShortcutSettings();
      settingsModal.classList.remove('hidden');
    });
  }

  const shortcutSettingsBtn = document.getElementById('shortcut-settings-btn');
  if (shortcutSettingsBtn) {
    shortcutSettingsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      renderShortcutSettings();
      settingsModal.classList.remove('hidden');
      closePopup();
    });
  }

  const closeSettingsBtn = document.getElementById('close-settings');
  if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', () => settingsModal.classList.add('hidden'));

  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) settingsModal.classList.add('hidden');
  });

  const resetShortcutsBtn = document.getElementById('reset-shortcuts');
  if (resetShortcutsBtn) {
    resetShortcutsBtn.addEventListener('click', () => {
      shortcutConfig = { 1: ['messenger'], 2: ['chatgpt'], 3: ['gemini'], 4: ['git'], 5: ['notes'], 6: ['discord'], 7: ['telegram'] };
      renderShortcutSettings();
    });
  }

  const saveShortcutsBtn = document.getElementById('save-shortcuts');
  if (saveShortcutsBtn) {
    saveShortcutsBtn.addEventListener('click', () => {
      const newConfig = {};
      for (let i = 1; i <= 7; i++) {
        newConfig[i] = Array.from(document.querySelectorAll(`input[data-shortcut="${i}"]:checked`))
          .map(input => input.dataset.service);
      }
      shortcutConfig = newConfig;
      if (window.electronAPI && window.electronAPI.saveShortcutConfig) {
        window.electronAPI.saveShortcutConfig(newConfig).catch(e => console.error('saveShortcutConfig:', e));
      }
      renderPlatformGrid();
      renderSidebar();
      settingsModal.classList.add('hidden');
      showToast('快捷鍵設定已儲存', 'success');
    });
  }
  //#endregion

  //#region Dock Trigger 事件
  dockTrigger.addEventListener('click', (e) => { e.stopPropagation(); togglePopup(); });

  document.addEventListener('click', (e) => {
    if (isPopupOpen && !gridPopup.contains(e.target) && e.target !== dockTrigger) closePopup();
  });
  //#endregion

  //#region 鍵盤快捷鍵
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (isPopupOpen) { closePopup(); return; }
      if (!settingsModal.classList.contains('hidden')) { settingsModal.classList.add('hidden'); return; }
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Tab') {
      e.preventDefault();
      const cur = localStorage.getItem('activeTab') || 'messenger';
      const sidebarOrder = getSidebarOrder().map(o => o.key);
      switchTab(sidebarOrder[(sidebarOrder.indexOf(cur) + 1) % sidebarOrder.length]);
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
      if (localStorage.getItem('activeTab') === 'notes') {
        e.preventDefault();
        const addBtn = document.getElementById('add-note-btn');
        if (addBtn) addBtn.click();
      }
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g') {
      e.preventDefault();
      togglePopup();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r') {
      e.preventDefault();
      const wv = getActiveWebview();
      if (wv) { navReload.classList.add('loading'); wv.reload(); }
    }
  });

  if (window.electronAPI && window.electronAPI.onSwitchTab) {
    window.electronAPI.onSwitchTab((shortcutNum) => switchTabCarousel(shortcutNum));
  }
  //#endregion

  //#region Toast IPC 監聽
  if (window.electronAPI && window.electronAPI.onToast) {
    window.electronAPI.onToast((msg, type) => showToast(msg, type || 'info'));
  }
  //#endregion

  //#region 主題切換
  const themeToggleBtn = document.getElementById('theme-toggle');
  const themeIconDark = document.getElementById('theme-icon-dark');
  const themeIconLight = document.getElementById('theme-icon-light');

  /**
   * 套用主題
   * @param {'dark'|'light'} theme
   */
  function applyTheme(theme) {
    if (theme === 'light') {
      document.body.classList.add('theme-light');
      if (themeIconDark) themeIconDark.style.display = 'none';
      if (themeIconLight) themeIconLight.style.display = '';
      if (themeToggleBtn) themeToggleBtn.title = '切換為深色主題';
    } else {
      document.body.classList.remove('theme-light');
      if (themeIconDark) themeIconDark.style.display = '';
      if (themeIconLight) themeIconLight.style.display = 'none';
      if (themeToggleBtn) themeToggleBtn.title = '切換為淺色主題';
    }
    localStorage.setItem('theme', theme);
  }

  // 恢復上次的主題偏好
  const savedTheme = localStorage.getItem('theme') || 'dark';
  applyTheme(savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const current = document.body.classList.contains('theme-light') ? 'light' : 'dark';
      const next = current === 'light' ? 'dark' : 'light';
      applyTheme(next);
      showToast(next === 'light' ? '已切換為淺色主題' : '已切換為深色主題', 'info', 2000);
    });
  }
  //#endregion

  //#region Quick Notes
  /** @type {{ id: string, title: string, body: string, updatedAt: number }[]} */
  let notes = [];
  /** @type {string|null} */
  let activeNoteId = null;
  let saveTimer = null;

  const notesList = document.getElementById('notes-list');
  const notesEmpty = document.getElementById('notes-empty');
  const addNoteBtn = document.getElementById('add-note-btn');
  const editorEmpty = document.getElementById('notes-editor-empty');
  const editorContent = document.getElementById('notes-editor-content');
  const noteTitleInput = document.getElementById('note-title-input');
  const noteBodyInput = document.getElementById('note-body-input');
  const noteMeta = document.getElementById('note-meta');
  const noteCopyBtn = document.getElementById('note-copy-btn');
  const noteDeleteBtn = document.getElementById('note-delete-btn');
  const noteSaveStatus = document.getElementById('note-save-status');

  /** 從 localStorage 載入筆記 */
  function loadNotes() {
    try {
      const raw = localStorage.getItem('quickNotes');
      notes = raw ? JSON.parse(raw) : [];
    } catch (_) {
      notes = [];
    }
    renderNotesList();
  }

  /** 儲存所有筆記至 localStorage */
  function saveNotes() {
    localStorage.setItem('quickNotes', JSON.stringify(notes));
  }

  /**
   * 格式化時間
   * @param {number} ts
   */
  function fmtTime(ts) {
    return new Date(ts).toLocaleString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  /** 渲染筆記清單 */
  function renderNotesList() {
    if (!notesList || !notesEmpty) return;
    notesList.innerHTML = '';
    if (notes.length === 0) {
      notesEmpty.classList.remove('hidden');
      return;
    }
    notesEmpty.classList.add('hidden');
    notes.forEach(note => {
      const item = document.createElement('div');
      item.className = `note-list-item${note.id === activeNoteId ? ' active' : ''}`;
      item.dataset.id = note.id;
      const preview = (note.body || '').replace(/\n/g, ' ').slice(0, 60);
      item.innerHTML = `
        <div class="note-item-title">${note.title || '無標題'}</div>
        <div class="note-item-preview">${preview || '（空白）'}</div>
        <div class="note-item-time">${fmtTime(note.updatedAt)}</div>
      `;
      item.addEventListener('click', () => openNote(note.id));
      notesList.appendChild(item);
    });
  }

  /**
   * 開啟筆記進入編輯模式
   * @param {string} id
   */
  function openNote(id) {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    activeNoteId = id;
    renderNotesList();
    if (editorEmpty) editorEmpty.classList.add('hidden');
    if (editorContent) editorContent.classList.remove('hidden');
    if (noteTitleInput) noteTitleInput.value = note.title || '';
    if (noteBodyInput) noteBodyInput.value = note.body || '';
    if (noteMeta) noteMeta.textContent = `最後更新：${fmtTime(note.updatedAt)}`;
    if (noteSaveStatus) noteSaveStatus.textContent = '';
  }

  /** 新增一筆筆記並開啟 */
  function addNote() {
    const note = { id: `note_${Date.now()}`, title: '', body: '', updatedAt: Date.now() };
    notes.unshift(note);
    saveNotes();
    renderNotesList();
    openNote(note.id);
    if (noteTitleInput) noteTitleInput.focus();
    showToast('已新增筆記', 'success', 2000);
  }

  /** 自動儲存目前編輯中的筆記 */
  function autoSave() {
    if (!activeNoteId) return;
    const note = notes.find(n => n.id === activeNoteId);
    if (!note) return;
    note.title = noteTitleInput ? noteTitleInput.value : note.title;
    note.body = noteBodyInput ? noteBodyInput.value : note.body;
    note.updatedAt = Date.now();
    saveNotes();
    renderNotesList();
    if (noteMeta) noteMeta.textContent = `最後更新：${fmtTime(note.updatedAt)}`;
    if (noteSaveStatus) {
      noteSaveStatus.textContent = '✓ 已儲存';
      setTimeout(() => { if (noteSaveStatus) noteSaveStatus.textContent = ''; }, 2000);
    }
  }

  /** 刪除目前筆記 */
  function deleteCurrentNote() {
    if (!activeNoteId) return;
    const idx = notes.findIndex(n => n.id === activeNoteId);
    if (idx === -1) return;
    notes.splice(idx, 1);
    saveNotes();
    activeNoteId = null;
    if (editorEmpty) editorEmpty.classList.remove('hidden');
    if (editorContent) editorContent.classList.add('hidden');
    renderNotesList();
    showToast('筆記已刪除', 'info', 2000);
  }

  // 事件綁定
  if (addNoteBtn) addNoteBtn.addEventListener('click', addNote);

  if (noteTitleInput) {
    noteTitleInput.addEventListener('input', () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(autoSave, 600);
    });
  }

  if (noteBodyInput) {
    noteBodyInput.addEventListener('input', () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(autoSave, 600);
    });
  }

  if (noteCopyBtn) {
    noteCopyBtn.addEventListener('click', () => {
      const note = notes.find(n => n.id === activeNoteId);
      if (!note) return;
      const text = note.title ? `${note.title}\n\n${note.body}` : note.body;
      navigator.clipboard.writeText(text)
        .then(() => showToast('已複製到剪貼板', 'success', 2000))
        .catch(() => showToast('複製失敗', 'error'));
    });
  }

  if (noteDeleteBtn) {
    noteDeleteBtn.addEventListener('click', () => {
      const overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);z-index:99999;display:flex;align-items:center;justify-content:center;';
      overlay.innerHTML = `<div style="background:var(--bg-surface,#252525);border:1px solid var(--border-color,rgba(255,255,255,0.1));border-radius:12px;padding:24px 28px;max-width:360px;width:90%;box-shadow:0 8px 32px rgba(0,0,0,0.5);"><p style="color:var(--text-primary,#f0f0f0);font-size:14px;margin:0 0 20px;line-height:1.5;">確定要刪除這則筆記嗎？</p><div style="display:flex;justify-content:flex-end;gap:10px;"><button id="_cancel_del" style="background:var(--bg-tertiary,#1e1e1e);color:var(--text-secondary,#999);border:1px solid var(--border-color,rgba(255,255,255,0.1));padding:8px 18px;border-radius:6px;cursor:pointer;font-size:13px;">取消</button><button id="_confirm_del" style="background:#ef4444;color:#fff;border:none;padding:8px 18px;border-radius:6px;cursor:pointer;font-size:13px;font-weight:500;">確定刪除</button></div></div>`;
      document.body.appendChild(overlay);
      overlay.querySelector('#_confirm_del').addEventListener('click', () => { document.body.removeChild(overlay); deleteCurrentNote(); });
      overlay.querySelector('#_cancel_del').addEventListener('click', () => document.body.removeChild(overlay));
    });
  }

  loadNotes();
  //#endregion

  //#region 初始化
  // loadShortcutConfig 內部在 config 載入後會呼叫 renderSidebar + renderPlatformGrid
  loadShortcutConfig();

  const initTab = localStorage.getItem('activeTab') || 'messenger';
  switchTab(initTab);
  //#endregion
});
