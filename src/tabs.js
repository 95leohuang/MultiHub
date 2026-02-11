/**
 * Tab 切換邏輯
 * 管理 Messenger、ChatGPT、Gemini、YouTube 頁籤切換
 */

/**
 * 開啟外部連結（透過 electronAPI）
 * @param {string} url - 要開啟的 URL
 */
function openExternalUrl(url) {
  if (window.electronAPI && window.electronAPI.openExternal) {
    window.electronAPI.openExternal(url);
  } else {
    console.error('electronAPI.openExternal not available');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // DOM 元素
  const dockTrigger = document.getElementById('dock-trigger');
  const dockFavicon = document.getElementById('dock-favicon');
  const gridPopup = document.getElementById('grid-popup');
  const popupGrid = document.querySelector('.popup-grid');

  const messengerWebview = document.getElementById('messenger-webview');
  const chatgptWebview = document.getElementById('chatgpt-webview');
  const geminiWebview = document.getElementById('gemini-webview');
  const youtubeWebview = document.getElementById('youtube-webview');
  const discordWebview = document.getElementById('discord-webview');
  const telegramWebview = document.getElementById('telegram-webview');

  // Tab 對應的 webview
  const webviews = {
    messenger: messengerWebview,
    chatgpt: chatgptWebview,
    gemini: geminiWebview,
    git: document.getElementById('git-updater-ui'),
    discord: discordWebview,
    telegram: telegramWebview
  };

  // 平台詳細配置
  const platformConfig = {
    messenger: { label: 'Messenger', favicon: 'https://static.xx.fbcdn.net/rsrc.php/yO/r/qa11ER6rke_.ico' },
    chatgpt: { label: 'ChatGPT', favicon: 'https://chatgpt.com/favicon.ico' },
    gemini: { label: 'Gemini', favicon: 'https://www.gstatic.com/lamda/images/gemini_favicon_f069958c85030456e93de685481c559f160ea06b.png' },
    git: { label: 'Git Update', favicon: '../assets/git-icon.png' },
    discord: { label: 'Discord', favicon: 'https://cdn.prod.website-files.com/6257adef93867e50d84d30e2/6266bc493fb42d4e27bb8393_847541504914fd33810e70a0ea73177e.ico' },
    telegram: { label: 'Telegram', favicon: 'https://web.telegram.org/favicon.ico' }
  };

  // Tab 順序
  const tabOrder = ['messenger', 'chatgpt', 'gemini', 'git', 'discord', 'telegram'];

  // 快捷鍵配置狀態
  let shortcutConfig = {
    1: ['messenger'],
    2: ['chatgpt'],
    3: ['gemini'],
    4: ['git'],
    5: ['discord'],
    6: ['telegram']
  };

  /**
   * 載入快捷鍵配置
   */
  async function loadShortcutConfig() {
    if (window.electronAPI && window.electronAPI.getShortcutConfig) {
      try {
        const config = await window.electronAPI.getShortcutConfig();
        if (config) {
          shortcutConfig = config;
          renderPlatformGrid();
        }
      } catch (err) {
        console.error('Failed to load shortcut config:', err);
      }
    }
  }

  /**
   * 渲染平台切換網格
   */
  function renderPlatformGrid() {
    const activeTab = localStorage.getItem('activeTab') || 'messenger';
    popupGrid.innerHTML = '';

    // 以 1~6 快捷鍵為核心進行渲染
    for (let i = 1; i <= 6; i++) {
      const services = shortcutConfig[i] || [];
      const item = document.createElement('div');
      item.className = 'grid-item';
      item.dataset.shortcut = i;

      const hasActiveTab = services.includes(activeTab);
      if (hasActiveTab) {
        item.classList.add('active');
      }

      const iconsContainer = document.createElement('div');
      iconsContainer.className = 'grid-icons-container';

      services.forEach((serviceKey, index) => {
        const config = platformConfig[serviceKey];
        if (!config) return;

        const img = document.createElement('img');
        img.className = 'grid-favicon';
        const isActive = serviceKey === activeTab;
        if (isActive) img.classList.add('active');
        
        img.src = config.favicon;
        img.title = config.label;
        img.dataset.tab = serviceKey;

        // 如果不是 active 的，稍微位移以營造「後方輪播」感
        if (!isActive && services.length > 1) {
          const offset = (index + 1) * 3;
          img.style.transform = `scale(0.8) translate(${offset}px, ${-offset}px)`;
          img.style.zIndex = services.length - index;
        }

        // 點擊個別圖示直接切換
        img.addEventListener('click', (e) => {
          e.stopPropagation();
          switchTab(serviceKey);
        });

        iconsContainer.appendChild(img);
      });

      const label = document.createElement('span');
      label.className = 'grid-label';
      
      // 標籤邏輯：優先顯示當前在這個快捷鍵分組下 active 的平台名稱
      const activeInGroup = services.find(s => s === activeTab);
      if (activeInGroup) {
        label.textContent = platformConfig[activeInGroup].label;
      } else {
        // 如果此分組沒被選中，顯示分組內第一個平台的名稱（或列表縮寫）
        label.textContent = services.length > 0 ? platformConfig[services[0]].label : '未設定';
      }

      const shortcut = document.createElement('span');
      shortcut.className = 'grid-shortcut';
      shortcut.textContent = i;

      item.appendChild(iconsContainer);
      item.appendChild(label);
      item.appendChild(shortcut);

      item.addEventListener('click', () => {
        switchTabCarousel(i);
      });

      popupGrid.appendChild(item);
    }
  }

  // Popup 狀態
  let isPopupOpen = false;

  /**
   * 切換 Popup 顯示狀態
   */
  function togglePopup() {
    isPopupOpen = !isPopupOpen;
    gridPopup.classList.toggle('hidden', !isPopupOpen);
    dockTrigger.classList.toggle('active', isPopupOpen);
  }

  /**
   * 關閉 Popup
   */
  function closePopup() {
    isPopupOpen = false;
    gridPopup.classList.add('hidden');
    dockTrigger.classList.remove('active');
  }

  /**
   * 切換 Tab
   * @param {string} tabName - Tab 名稱
   */
  function switchTab(tabName) {
    // 1. 更新 webview 顯示
    Object.entries(webviews).forEach(([name, element]) => {
      const isActive = name === tabName;
      element.classList.toggle('active', isActive);

      if (isActive && element.tagName === 'WEBVIEW' && !element.src && element.dataset.src) {
        element.src = element.dataset.src;
      }
    });

    // 2. 更新 Grid UI 狀態
    document.querySelectorAll('.grid-item').forEach(item => {
      const shortcutNum = item.dataset.shortcut;
      const services = shortcutConfig[shortcutNum] || [];
      const isActiveGroup = services.includes(tabName);
      item.classList.toggle('active', isActiveGroup);

      // 更新分組內的圖示位置與狀態
      const icons = item.querySelectorAll('.grid-favicon');
      icons.forEach((img, index) => {
        const isThisActive = img.dataset.tab === tabName;
        img.classList.toggle('active', isThisActive);
        
        if (isThisActive) {
          img.style.transform = '';
          img.style.zIndex = '10';
        } else {
          // 重新計算位移動畫
          const offset = (index + 1) * 3;
          img.style.transform = `scale(0.8) translate(${offset}px, ${-offset}px)`;
          img.style.zIndex = services.length - index;
        }
      });

      // 更新標籤文字：只顯示該分組中「當前選中」的名稱
      const label = item.querySelector('.grid-label');
      if (isActiveGroup) {
        label.textContent = platformConfig[tabName].label;
      } else if (services.length > 0) {
        label.textContent = platformConfig[services[0]].label;
      }
    });

    // 3. 更新 Dock 按鈕的 favicon
    const config = platformConfig[tabName];
    if (config) {
      dockFavicon.src = config.favicon;
    }

    localStorage.setItem('activeTab', tabName);
  }

  /**
   * 根據快捷鍵進行輪播切換
   * @param {number} shortcutNum - 快捷鍵數字 (1-6)
   */
  function switchTabCarousel(shortcutNum) {
    const services = shortcutConfig[shortcutNum];
    if (!services || services.length === 0) return;

    if (services.length === 1) {
      switchTab(services[0]);
      return;
    }

    // 取得當前啟用的 tab
    const currentTab = localStorage.getItem('activeTab');
    const currentIndex = services.indexOf(currentTab);

    // 如果當前 tab 在該快捷鍵的清單中，切換到下一個
    if (currentIndex !== -1) {
      const nextIndex = (currentIndex + 1) % services.length;
      switchTab(services[nextIndex]);
    } else {
      // 否則切換到清單中的第一個
      switchTab(services[0]);
    }
  }

  // 綁定 Dock Trigger 點擊事件
  dockTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePopup();
  });

  // 移除舊的靜態綁定，改由 renderPlatformGrid 處理點擊事件

  // 點擊其他地方關閉 Popup
  document.addEventListener('click', (e) => {
    if (isPopupOpen && !gridPopup.contains(e.target)) {
      closePopup();
    }
  });

  // ESC 鍵關閉 Popup
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isPopupOpen) {
      closePopup();
    }
  });

  // 恢復上次的 Tab 狀態
  const savedTab = localStorage.getItem('activeTab');
  if (savedTab && webviews[savedTab]) {
    switchTab(savedTab);
  }

  // Webview 載入事件處理
  Object.entries(webviews).forEach(([name, webview]) => {
    webview.addEventListener('did-start-loading', () => {
      webview.classList.add('loading');
    });

    webview.addEventListener('did-stop-loading', () => {
      webview.classList.remove('loading');
    });

    // 處理新視窗開啟（外部連結）
    webview.addEventListener('new-window', (e) => {
      const url = e.url;

      // 判斷是否為內部連結
      const internalDomains = [
        'messenger.com', 'facebook.com',
        'chatgpt.com', 'openai.com',
        'google.com', 'gemini.google.com'
      ];
      const isInternal = internalDomains.some(domain => url.includes(domain));

      if (!isInternal) {
        e.preventDefault();
        // 使用 preload 暴露的 API 開啟外部連結
        if (window.electronAPI && window.electronAPI.openExternal) {
          window.electronAPI.openExternal(url);
        }
      }
    });

    // 處理 Google 登入頁面（YouTube/Gemini）- 在外部瀏覽器開啟
    if (name === 'youtube' || name === 'gemini') {
      webview.addEventListener('will-navigate', (e) => {
        const url = e.url;
        // 如果是 Google 登入頁面，在外部瀏覽器開啟
        if (url.includes('accounts.google.com/signin') ||
          url.includes('accounts.google.com/v3/signin') ||
          url.includes('accounts.google.com/ServiceLogin')) {
          e.preventDefault();
          // 使用 openExternalUrl 輔助函數（在主頁面 context 中執行）
          openExternalUrl(url);
        }
      });

      // 監聽頁面載入完成，檢查是否在登入頁面
      webview.addEventListener('did-navigate', (e) => {
        const url = e.url;
        if (url.includes('accounts.google.com')) {
          // 顯示提示訊息
          showGoogleLoginHint(webview, name);
        }
      });
    }

    // 處理頁面標題變化（用於未讀訊息計數）
    webview.addEventListener('page-title-updated', (e) => {
      if (webview.id === 'messenger-webview') {
        const title = e.title;
        const match = title.match(/\((\d+)\)/);

        if (match) {
          const count = parseInt(match[1], 10);
          updateMessengerBadge(count);
        } else {
          updateMessengerBadge(0);
        }
      }
    });
  });

  /**
   * 顯示 Google 登入提示
   * @param {HTMLElement} webview - webview 元素
   * @param {string} serviceName - 服務名稱
   */
  function showGoogleLoginHint(webview, serviceName) {
    const serviceNames = {
      youtube: 'YouTube',
      gemini: 'Gemini'
    };
    const displayName = serviceNames[serviceName] || serviceName;

    // 注入提示訊息到 webview
    webview.executeJavaScript(`
      if (!document.getElementById('multi-hub-login-hint')) {
        const hint = document.createElement('div');
        hint.id = 'multi-hub-login-hint';
        hint.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#1a73e8;color:white;padding:12px 20px;text-align:center;z-index:999999;font-family:system-ui;font-size:14px;box-shadow:0 2px 10px rgba(0,0,0,0.3);';
        hint.innerHTML = '⚠️ Google 不允許在此應用程式內登入。請點擊 <a href="#" onclick="window.open(\\'https://accounts.google.com\\', \\'_blank\\'); return false;" style="color:#fff;text-decoration:underline;font-weight:bold;">這裡</a> 在外部瀏覽器登入後，再重新整理此頁面。 <button onclick="this.parentElement.remove()" style="margin-left:20px;background:rgba(255,255,255,0.2);border:none;color:white;padding:4px 12px;border-radius:4px;cursor:pointer;">關閉</button>';
        document.body.prepend(hint);
      }
    `).catch(() => { });
  }

  /**
   * 更新 Messenger 未讀訊息徽章
   * @param {number} count - 未讀訊息數量
   */
  function updateMessengerBadge(count) {
    const messengerIcon = document.querySelector(`.grid-favicon[data-tab="messenger"]`);
    if (!messengerIcon) return;

    const gridItem = messengerIcon.closest('.grid-item');
    if (!gridItem) return;

    const label = gridItem.querySelector('.grid-label');
    if (!label) return;

    // 取得原始標題（排除舊的數字）
    const services = shortcutConfig[gridItem.dataset.shortcut] || [];
    const baseLabels = services.map(s => {
      let name = platformConfig[s]?.label || s;
      if (s === 'messenger' && count > 0) {
        return `${name} (${count})`;
      }
      return name;
    });

    label.textContent = baseLabels.join(', ');
    gridItem.classList.toggle('has-badge', count > 0);

    // 使用 preload 暴露的 API 通知主進程更新系統托盤
    if (window.electronAPI && window.electronAPI.updateBadge) {
      window.electronAPI.updateBadge(count);
    }
  }

  // 快捷鍵支援（本地 keydown，作為備用）
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Tab: 切換下一個 Tab
    if ((e.ctrlKey || e.metaKey) && e.key === 'Tab') {
      e.preventDefault();
      const currentTab = localStorage.getItem('activeTab') || 'messenger';
      const currentIndex = tabOrder.indexOf(currentTab);
      const nextIndex = (currentIndex + 1) % tabOrder.length;
      switchTab(tabOrder[nextIndex]);
    }

    // Ctrl/Cmd + G: 開關 Grid Popup
    if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
      e.preventDefault();
      togglePopup();
    }
  });

  // 監聽全域快捷鍵 Alt+1~6（從 main process 發送，解決 webview 焦點問題）
  if (window.electronAPI && window.electronAPI.onSwitchTab) {
    window.electronAPI.onSwitchTab((shortcutNum) => {
      switchTabCarousel(shortcutNum);
    });
  }

  // ========================================
  // 快捷鍵設定邏輯
  // ========================================
  const settingsModal = document.getElementById('settings-modal');
  const shortcutSettingsBtn = document.getElementById('shortcut-settings-btn');
  const closeSettingsBtn = document.getElementById('close-settings');
  const cancelSettingsBtn = document.getElementById('reset-shortcuts');
  const saveShortcutsBtn = document.getElementById('save-shortcuts');
  const shortcutConfigList = document.getElementById('shortcut-config-list');

  /**
   * 渲染設定列表
   */
  function renderShortcutSettings() {
    shortcutConfigList.innerHTML = '';

    for (let i = 1; i <= 6; i++) {
      const row = document.createElement('div');
      row.className = 'shortcut-row';

      const header = document.createElement('div');
      header.className = 'shortcut-row-header';
      header.innerHTML = `<span class="shortcut-number">${i}</span><span style="font-size:13px;color:#fff;">Alt + ${i}</span>`;

      const servicesDiv = document.createElement('div');
      servicesDiv.className = 'shortcut-services';

      const currentServices = shortcutConfig[i] || [];

      tabOrder.forEach(serviceKey => {
        const isSelected = currentServices.includes(serviceKey);
        const config = platformConfig[serviceKey];
        const label = document.createElement('label');
        label.className = `service-check ${isSelected ? 'selected' : ''}`;
        label.innerHTML = `
          <input type="checkbox" data-shortcut="${i}" data-service="${serviceKey}" ${isSelected ? 'checked' : ''}>
          ${config.label}
        `;

        label.querySelector('input').addEventListener('change', (e) => {
          label.classList.toggle('selected', e.target.checked);
        });

        servicesDiv.appendChild(label);
      });

      row.appendChild(header);
      row.appendChild(servicesDiv);
      shortcutConfigList.appendChild(row);
    }
  }

  // 開啟設定
  shortcutSettingsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    renderShortcutSettings();
    settingsModal.classList.remove('hidden');
    closePopup();
  });

  // 關閉設定
  closeSettingsBtn.addEventListener('click', () => {
    settingsModal.classList.add('hidden');
  });

  // 點擊 Overlay 關閉
  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      settingsModal.classList.add('hidden');
    }
  });

  // 恢復預設
  cancelSettingsBtn.addEventListener('click', () => {
    shortcutConfig = {
      1: ['messenger'],
      2: ['chatgpt'],
      3: ['gemini'],
      4: ['git'],
      5: ['discord'],
      6: ['telegram']
    };
    renderShortcutSettings();
  });

  // 儲存設定
  saveShortcutsBtn.addEventListener('click', async () => {
    const newConfig = {};
    for (let i = 1; i <= 6; i++) {
      const selected = Array.from(document.querySelectorAll(`input[data-shortcut="${i}"]:checked`))
        .map(input => input.dataset.service);
      newConfig[i] = selected;
    }

    shortcutConfig = newConfig;
    if (window.electronAPI && window.electronAPI.saveShortcutConfig) {
      await window.electronAPI.saveShortcutConfig(newConfig);
    }

    renderPlatformGrid();
    settingsModal.classList.add('hidden');
  });

  // 初始化載入
  renderPlatformGrid();
  loadShortcutConfig();

  // 初始化時更新 Dock favicon
  const initialTab = localStorage.getItem('activeTab') || 'messenger';
  const config = platformConfig[initialTab];
  if (config) {
    dockFavicon.src = config.favicon;
  }

  console.log('Floating Dock system initialized');
});
