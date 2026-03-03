/**
 * 快捷鍵設定 Modal 模組
 * 實作 Master-Detail 佈局、自訂快捷鍵與拖曳排序
 */

//#region 快捷鍵設定資料
/** @type {object} */
let shortcutConfig = {
  'Alt+1': ['messenger'], 'Alt+2': ['chatgpt'], 'Alt+3': ['gemini'],
  'Alt+4': ['git'], 'Alt+5': ['notes'], 'Alt+6': ['discord']
};

const defaultShortcutConfig = {
  'Alt+1': ['messenger'], 'Alt+2': ['chatgpt'], 'Alt+3': ['gemini'],
  'Alt+4': ['git'], 'Alt+5': ['notes'], 'Alt+6': ['discord']
};

/**
 * 遷移舊版純數字 key 至 Alt+ 格式，並補齊未分配的平台
 * @param {object} config
 * @returns {object}
 */
function migrateShortcutConfig(config) {
  const merged = {};

  // 遍歷目前的 config，如果是純數字則轉成 Alt+數字
  Object.keys(config).forEach(k => {
    let newKey = k;
    if (/^[1-7]$/.test(k)) {
      newKey = `Alt+${k}`;
    }
    if (newKey !== 'Alt+7') {
      merged[newKey] = [...(config[k] || [])];
    }
  });

  // Check if there are exactly 6 groups, if not, fill in missing defaults
  let currentKeys = Object.keys(merged);
  let defaultKeys = Object.keys(defaultShortcutConfig);

  if (currentKeys.length < 6) {
    for (let defKey of defaultKeys) {
      if (!currentKeys.includes(defKey) && currentKeys.length < 6) {
        merged[defKey] = [];
        currentKeys.push(defKey);
      }
    }
  }

  const allAssigned = new Set(Object.values(merged).flat());

  // 補齊預設配置裡有，但目前設定裡未指派的平台
  Object.entries(defaultShortcutConfig).forEach(([k, services]) => {
    services.forEach(svc => {
      if (!allAssigned.has(svc) && platformConfig[svc]) {
        // Find if this default key exists in merged, if not just put it in the first available key
        let targetKey = merged[k] ? k : Object.keys(merged)[0];
        if (!merged[targetKey]) merged[targetKey] = [];
        if (!merged[targetKey].includes(svc)) {
          merged[targetKey].push(svc);
          allAssigned.add(svc);
        }
      }
    });
  });

  return merged;
}

/**
 * 取得目前的快捷鍵設定
 * @returns {object}
 */
function getShortcutConfig() {
  return shortcutConfig;
}
//#endregion

/**
 * 從 Electron Store 載入快捷鍵設定，完成後呼叫 callback
 * @param {function} onLoaded
 */
function loadShortcutConfig(onLoaded) {
  if (window.electronAPI && window.electronAPI.getShortcutConfig) {
    window.electronAPI.getShortcutConfig()
      .then(config => {
        if (config) shortcutConfig = migrateShortcutConfig(config);
        onLoaded(shortcutConfig);
      })
      .catch(err => {
        console.error('loadShortcutConfig:', err);
        onLoaded(shortcutConfig);
      });
  } else {
    onLoaded(shortcutConfig);
  }
}

/**
 * 輔助函數：將 Browser Keydown Event 轉為 Electron Accelerator 字串
 * @param {KeyboardEvent} e - keydown 事件
 * @returns {string|null} - 格式化後的 Accelerator (如: CommandOrControl+Shift+A)
 */
function getAcceleratorFromEvent(e) {
  // 忽略純修飾鍵的按下
  if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return null;

  let keys = [];

  // 處理修飾鍵
  if (e.ctrlKey || e.metaKey) keys.push('CommandOrControl');
  if (e.altKey) keys.push('Alt');
  if (e.shiftKey) keys.push('Shift');

  // 處理主要按鍵
  let key = e.key;
  // 將特殊鍵正規化為 Electron 支持的格式
  if (key.length === 1 && /[a-z]/.test(key)) {
    key = key.toUpperCase();
  } else if (key === ' ') {
    key = 'Space';
  } else if (key === '+') {
    key = 'Plus';
  } else if (key.length > 1) {
    // 確保首字大寫如 ArrowUp, Enter, Escape 等
    key = key.charAt(0).toUpperCase() + key.slice(1);
  }

  keys.push(key);

  return keys.join('+');
}

/**
 * 渲染快捷鍵設定 Modal 內容 (Master-Details)
 */
function renderShortcutSettings() {
  const tabsContainer = document.getElementById('shortcut-tabs');
  const panelsContainer = document.getElementById('shortcut-panels');

  if (!tabsContainer || !panelsContainer) return;

  tabsContainer.innerHTML = '';
  panelsContainer.innerHTML = '';

  const groups = Object.keys(shortcutConfig);
  let activeIndex = 0; // Default active tab is the first one

  groups.forEach((keyString, index) => {
    const services = shortcutConfig[keyString] || [];

    // ======== 建立 Tab (Master) ========
    const tabItem = document.createElement('div');
    tabItem.className = `shortcut-tab-item${index === activeIndex ? ' active' : ''}`;
    tabItem.dataset.index = index;

    // Accelerator View
    const keyDisplay = document.createElement('div');
    keyDisplay.className = 'shortcut-key-display';

    const keyText = document.createElement('div');
    keyText.className = 'shortcut-key-text';
    keyText.textContent = keyString.replace('CommandOrControl', 'Ctrl/Cmd');

    const editBtn = document.createElement('button');
    editBtn.className = 'shortcut-edit-btn';
    editBtn.title = "編輯快捷鍵";
    editBtn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 20h9"></path>
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
      </svg>
    `;

    keyDisplay.appendChild(keyText);
    keyDisplay.appendChild(editBtn);

    // Preview Icons
    const previewIcons = document.createElement('div');
    previewIcons.className = 'shortcut-preview-icons';

    /** 更新此 Tab 上的預覽小圖示 */
    const updatePreviewIcons = (currentServices) => {
      previewIcons.innerHTML = '';
      currentServices.forEach(svc => {
        if (platformConfig[svc]) {
          const img = document.createElement('img');
          img.className = 'shortcut-preview-icon';
          img.src = platformConfig[svc].favicon;
          img.title = platformConfig[svc].label;
          previewIcons.appendChild(img);
        }
      });
    };
    updatePreviewIcons(services);

    tabItem.appendChild(keyDisplay);
    tabItem.appendChild(previewIcons);
    tabsContainer.appendChild(tabItem);

    // Edit Key Logic
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();

      // 替換為輸入框
      const input = document.createElement('input');
      input.className = 'shortcut-key-input';
      input.type = 'text';
      input.value = "按下組合鍵...";
      input.readOnly = true;

      keyDisplay.innerHTML = '';
      keyDisplay.appendChild(input);
      input.focus();

      const onKeydown = (ev) => {
        ev.preventDefault();
        ev.stopPropagation();

        // 如果按 Esc，取消編輯
        if (ev.key === 'Escape') {
          finishEdit(keyString);
          return;
        }

        const newAccel = getAcceleratorFromEvent(ev);
        if (newAccel) {
          // Check for duplicates
          const isDuplicate = Object.keys(shortcutConfig).some(k => k !== keyString && k === newAccel);
          if (isDuplicate) {
            showToast(`快捷鍵 ${newAccel} 已被使用`, 'warning');
            finishEdit(keyString);
            return;
          }

          // 更新設定字典的 Key (這需要建立新物件以保持順序或直接增刪)
          const newServices = [...shortcutConfig[keyString]];
          delete shortcutConfig[keyString];
          shortcutConfig[newAccel] = newServices;

          finishEdit(newAccel);
        }
      };

      const finishEdit = (finalAccel) => {
        input.removeEventListener('keydown', onKeydown);
        input.removeEventListener('blur', onBlur);

        // Re-render EVERYTHING to reflect the new key safely
        renderShortcutSettings();

        // 保持選中狀態
        const newTabs = document.querySelectorAll('.shortcut-tab-item');
        newTabs.forEach(t => t.classList.remove('active'));
        const panels = document.querySelectorAll('.shortcut-panel');
        panels.forEach(p => p.classList.remove('active'));

        const newGroupKeys = Object.keys(shortcutConfig);
        const newIdx = newGroupKeys.indexOf(finalAccel) !== -1 ? newGroupKeys.indexOf(finalAccel) : index;

        if (newTabs[newIdx]) newTabs[newIdx].classList.add('active');
        if (panels[newIdx]) panels[newIdx].classList.add('active');
      };

      const onBlur = () => finishEdit(keyString);

      input.addEventListener('keydown', onKeydown);
      input.addEventListener('blur', onBlur);
    });

    // ======== 建立 Panel (Detail) ========
    const panel = document.createElement('div');
    panel.className = `shortcut-panel${index === activeIndex ? ' active' : ''}`;
    panel.dataset.index = index;

    // 區塊：已選平台 (可拖曳排序)
    const assignedTitle = document.createElement('div');
    assignedTitle.className = 'panel-section-title';
    assignedTitle.textContent = '已分配平台 (拖曳調整輪播順序)';

    const assignedList = document.createElement('div');
    assignedList.className = 'assigned-list';

    // 區塊：所有可用平台 (點擊加入)
    const availableTitle = document.createElement('div');
    availableTitle.className = 'panel-section-title';
    availableTitle.textContent = '從可用平台中加入';

    const availableList = document.createElement('div');
    availableList.className = 'available-list';

    // 拖曳相關變數
    let draggedItem = null;

    // 將平台資料渲染進 assigned/available list
    const renderLists = () => {
      assignedList.innerHTML = '';
      availableList.innerHTML = '';

      const currentList = shortcutConfig[keyString] || [];
      updatePreviewIcons(currentList);

      // 1. 渲染 Assigned List
      currentList.forEach((svc, i) => {
        if (!platformConfig[svc]) return;
        const cfg = platformConfig[svc];

        const item = document.createElement('div');
        item.className = 'assigned-item';
        item.draggable = true;
        item.dataset.index = i;
        item.dataset.svc = svc;

        item.innerHTML = `
            <div class="assigned-info">
              <div class="drag-handle">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="9" cy="5" r="1"></circle><circle cx="15" cy="5" r="1"></circle>
                  <circle cx="9" cy="12" r="1"></circle><circle cx="15" cy="12" r="1"></circle>
                  <circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="19" r="1"></circle>
                </svg>
              </div>
              <img src='${cfg.favicon}' alt="${cfg.label}">
              <span>${cfg.label}</span>
            </div>
            <button class="remove-btn" title="移除">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          `;

        // 移除按鈕事件
        item.querySelector('.remove-btn').addEventListener('click', () => {
          shortcutConfig[keyString] = currentList.filter(s => s !== svc);
          renderLists();
        });

        // 拖曳事件
        item.addEventListener('dragstart', (e) => {
          draggedItem = item;
          e.dataTransfer.effectAllowed = 'move';
          // 延遲加上 class 避免原生拖曳圖示透明
          setTimeout(() => item.classList.add('dragging'), 0);
        });

        item.addEventListener('dragend', () => {
          item.classList.remove('dragging');
          draggedItem = null;

          // 拖曳結束後，根據新的 DOM 順序更新 shortcutConfig
          const newOrder = Array.from(assignedList.children).map(node => node.dataset.svc);
          shortcutConfig[keyString] = newOrder;
          renderLists(); // 重繪以確保資料與 UI 完全同步
        });

        assignedList.appendChild(item);
      });

      // Drag Drop List Container Events
      assignedList.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const afterElement = getDragAfterElement(assignedList, e.clientY);
        const currentDrag = document.querySelector('.dragging');
        if (!currentDrag) return;

        if (afterElement == null) {
          assignedList.appendChild(currentDrag);
        } else {
          assignedList.insertBefore(currentDrag, afterElement);
        }
      });

      // 2. 渲染 Available List
      tabOrder.forEach(svc => {
        if (!platformConfig[svc]) return;
        const cfg = platformConfig[svc];
        const isAssigned = currentList.includes(svc);

        const item = document.createElement('div');
        item.className = `available-item${isAssigned ? ' selected' : ''}`;

        item.innerHTML = `
             <img src='${cfg.favicon}' alt="${cfg.label}">
             <span>${cfg.label}</span>
          `;

        if (!isAssigned) {
          item.addEventListener('click', () => {
            shortcutConfig[keyString].push(svc);
            renderLists();
          });
        }

        availableList.appendChild(item);
      });
    };

    renderLists();

    panel.appendChild(assignedTitle);
    panel.appendChild(assignedList);
    panel.appendChild(availableTitle);
    panel.appendChild(availableList);

    panelsContainer.appendChild(panel);

    // Tab 切換事件
    tabItem.addEventListener('click', () => {
      document.querySelectorAll('.shortcut-tab-item').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.shortcut-panel').forEach(p => p.classList.remove('active'));

      tabItem.classList.add('active');
      panel.classList.add('active');
    });
  });
}

/**
 * 輔助函數：計算拖曳時該插入哪個元素前面
 */
function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.assigned-item:not(.dragging)')];

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

/**
 * 綁定快捷鍵設定 Modal 的所有事件
 * @param {function} onSaved - 儲存後呼叫（傳入新的 config）
 */
function bindShortcutSettingsEvents(onSaved) {
  const settingsModal = document.getElementById('settings-modal');

  const openModal = () => {
    // Make a deep copy of config so we can cancel edits easily
    loadShortcutConfig((config) => {
      shortcutConfig = JSON.parse(JSON.stringify(config));
      renderShortcutSettings();
      settingsModal.classList.remove('hidden');
    });
  };

  const sidebarSettingsBtn = document.getElementById('sidebar-settings-btn');
  if (sidebarSettingsBtn) sidebarSettingsBtn.addEventListener('click', openModal);

  const shortcutSettingsBtn = document.getElementById('shortcut-settings-btn');
  if (shortcutSettingsBtn) {
    shortcutSettingsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openModal();
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
      shortcutConfig = JSON.parse(JSON.stringify(defaultShortcutConfig));
      renderShortcutSettings();
    });
  }

  const saveShortcutsBtn = document.getElementById('save-shortcuts');
  if (saveShortcutsBtn) {
    saveShortcutsBtn.addEventListener('click', () => {
      if (window.electronAPI && window.electronAPI.saveShortcutConfig) {
        window.electronAPI.saveShortcutConfig(shortcutConfig).catch(e => console.error('saveShortcutConfig:', e));
      }
      settingsModal.classList.add('hidden');
      showToast('快捷鍵設定已儲存', 'success');
      onSaved(shortcutConfig); // 將最新配置傳回 app.js 進行左側欄等畫面重整
    });
  }
}
