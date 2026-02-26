/**
 * Tab 切換與 Webview 管理模組
 */

/** @type {Record<string, HTMLElement>} */
const webviews = {
  messenger: null,
  chatgpt: null,
  gemini: null,
  git: null,
  skills: null,
  notes: null,
  discord: null,
  telegram: null,
  gitgui: null
};

/**
 * 初始化 Webview 元素對應表
 */
function initWebviews() {
  Object.keys(webviews).forEach(key => {
    const id = key === 'git' ? 'git-updater-ui' :
      key === 'skills' ? 'skill-sync-ui' :
        key === 'notes' ? 'quick-notes-ui' :
          key === 'gitgui' ? 'git-gui-ui' :
            `${key}-webview`;
    webviews[key] = document.getElementById(id);
  });
}

/**
 * 切換 Tab
 * @param {string} tabName
 * @param {object} shortcutConfig
 */
function switchTab(tabName, shortcutConfig) {
  // 1. Webview 顯示切換
  Object.entries(webviews).forEach(([name, el]) => {
    if (!el) return;
    el.classList.toggle('active', name === tabName);
    if (name === tabName && el.tagName === 'WEBVIEW' && !el.src && el.dataset.src) {
      el.src = el.dataset.src;
    }
  });

  // 2. 側邊欄 active 狀態
  document.querySelectorAll('.sidebar-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  // 3. Grid Popup active 狀態
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
  const dockFavicon = document.getElementById('dock-favicon');
  if (cfg && dockFavicon) dockFavicon.src = cfg.favicon;

  // 5. 導航列標題與顯示
  setNavTitle(cfg ? cfg.label : tabName);
  updateNavBar(tabName, webviews);

  localStorage.setItem('activeTab', tabName);

  // 6. 關閉 Grid Popup
  closePopup();
}

/**
 * 輪播切換：依 shortcutConfig 的數字鍵輪播
 * @param {number} shortcutNum
 * @param {object} shortcutConfig
 */
function switchTabCarousel(shortcutNum, shortcutConfig) {
  const services = shortcutConfig[shortcutNum];
  if (!services || services.length === 0) return;
  if (services.length === 1) { switchTab(services[0], shortcutConfig); return; }
  const cur = localStorage.getItem('activeTab');
  const idx = services.indexOf(cur);
  switchTab(services[idx !== -1 ? (idx + 1) % services.length : 0], shortcutConfig);
}

/**
 * 注入 Google 登入提示橫幅
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

/** 內部網域列表（允許在 app 內開啟） */
const internalDomains = [
  'messenger.com', 'facebook.com', 'chatgpt.com', 'openai.com',
  'google.com', 'gemini.google.com', 'discord.com', 'telegram.org'
];

/**
 * 綁定所有 Webview 事件
 * @param {object} shortcutConfig
 */
function bindWebviewEvents(shortcutConfig) {
  Object.entries(webviews).forEach(([name, wv]) => {
    if (!wv || wv.tagName !== 'WEBVIEW') return;

    wv.addEventListener('did-start-loading', () => {
      wv.classList.add('loading');
      if (name === localStorage.getItem('activeTab')) setNavLoading(true);
    });

    wv.addEventListener('did-stop-loading', () => {
      wv.classList.remove('loading');
      if (name === localStorage.getItem('activeTab')) {
        setNavLoading(false);
        try {
          const nb = document.getElementById('nav-back');
          const nf = document.getElementById('nav-forward');
          if (nb) nb.disabled = !wv.canGoBack();
          if (nf) nf.disabled = !wv.canGoForward();
        } catch (_) { }
      }
    });

    wv.addEventListener('page-title-updated', (e) => {
      if (name === localStorage.getItem('activeTab')) {
        setNavTitle(e.title || platformConfig[name].label);
      }
      if (name === 'messenger' || name === 'telegram' || name === 'discord') {
        const match = (e.title || '').match(/\((\d+)\)/);
        updateBadge(name, match ? parseInt(match[1], 10) : 0, shortcutConfig, document.getElementById('dock-badge'));
      }
    });

    wv.addEventListener('did-navigate', (e) => {
      if (name === localStorage.getItem('activeTab')) {
        try {
          const nb = document.getElementById('nav-back');
          const nf = document.getElementById('nav-forward');
          if (nb) nb.disabled = !wv.canGoBack();
          if (nf) nf.disabled = !wv.canGoForward();
        } catch (_) { }
      }
      if (name === 'gemini' && e.url && e.url.includes('accounts.google.com')) {
        showGoogleLoginHint(wv);
      }
    });

    wv.addEventListener('did-navigate-in-page', () => {
      if (name === localStorage.getItem('activeTab')) {
        try {
          const nb = document.getElementById('nav-back');
          const nf = document.getElementById('nav-forward');
          if (nb) nb.disabled = !wv.canGoBack();
          if (nf) nf.disabled = !wv.canGoForward();
        } catch (_) { }
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
}
