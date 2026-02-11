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
  const gridItems = document.querySelectorAll('.grid-item');

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

  // 平台名稱對應
  const platformNames = {
    messenger: 'Messenger',
    chatgpt: 'ChatGPT',
    gemini: 'Gemini',
    git: 'Git Update',
    discord: 'Discord',
    telegram: 'Telegram'
  };

  // Tab 順序（用於快捷鍵切換）
  const tabOrder = ['messenger', 'chatgpt', 'gemini', 'git', 'discord', 'telegram'];

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
   * @param {string} tabName - Tab 名稱 (messenger | chatgpt | gemini | youtube)
   */
  function switchTab(tabName) {
    // 更新 Grid Item 狀態
    gridItems.forEach(item => {
      item.classList.toggle('active', item.dataset.tab === tabName);
    });

    // 更新 webview 顯示
    Object.entries(webviews).forEach(([name, element]) => {
      const isActive = name === tabName;
      element.classList.toggle('active', isActive);

      // 如果是 webview 且未載入，則執行延遲載入
      if (isActive && element.tagName === 'WEBVIEW' && !element.src && element.dataset.src) {
        element.src = element.dataset.src;
      }
    });

    // 更新 Dock 按鈕的 favicon
    const activeItem = document.querySelector(`.grid-item[data-tab="${tabName}"]`);
    if (activeItem) {
      const faviconImg = activeItem.querySelector('.grid-favicon');
      if (faviconImg) {
        dockFavicon.src = faviconImg.src;
      }
    }

    // 儲存當前 tab 狀態
    localStorage.setItem('activeTab', tabName);

    // 切換後關閉 Popup
    closePopup();
  }

  // 綁定 Dock Trigger 點擊事件
  dockTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePopup();
  });

  // 綁定 Grid Item 點擊事件
  gridItems.forEach(item => {
    item.addEventListener('click', () => {
      switchTab(item.dataset.tab);
    });
  });

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
    const messengerItem = document.querySelector('.grid-item[data-tab="messenger"]');
    if (!messengerItem) return;

    const label = messengerItem.querySelector('.grid-label');
    if (!label) return;

    if (count > 0) {
      label.textContent = `Messenger (${count})`;
      messengerItem.classList.add('has-badge');
    } else {
      label.textContent = 'Messenger';
      messengerItem.classList.remove('has-badge');
    }

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

  // 監聽全域快捷鍵 Ctrl+1~6（從 main process 發送，解決 webview 焦點問題）
  if (window.electronAPI && window.electronAPI.onSwitchTab) {
    window.electronAPI.onSwitchTab((tabIndex) => {
      const index = tabIndex - 1;
      if (tabOrder[index]) {
        switchTab(tabOrder[index]);
      }
    });
  }

  // 初始化時更新 Dock favicon
  const initialTab = localStorage.getItem('activeTab') || 'messenger';
  const initialItem = document.querySelector(`.grid-item[data-tab="${initialTab}"]`);
  if (initialItem) {
    const faviconImg = initialItem.querySelector('.grid-favicon');
    if (faviconImg) {
      dockFavicon.src = faviconImg.src;
    }
  }

  console.log('Floating Dock system initialized');
});
