/**
 * 快捷鍵設定 Modal 模組
 */

//#region 快捷鍵設定資料
/** @type {object} */
let shortcutConfig = {
  1: ['messenger'], 2: ['chatgpt'], 3: ['gemini'],
  4: ['git'], 5: ['notes'], 6: ['discord'], 7: ['telegram']
};

const defaultShortcutConfig = {
  1: ['messenger'], 2: ['chatgpt'], 3: ['gemini'],
  4: ['git'], 5: ['notes'], 6: ['discord'], 7: ['telegram']
};

/**
 * 向前相容 migration：補齊未分配到任何 key 的已知平台
 * @param {object} config
 * @returns {object}
 */
function migrateShortcutConfig(config) {
  const merged = {};
  Object.keys(config).forEach(k => { merged[k] = [...(config[k] || [])]; });
  const allAssigned = new Set(Object.values(merged).flat());
  Object.entries(defaultShortcutConfig).forEach(([k, services]) => {
    services.forEach(svc => {
      if (!allAssigned.has(svc) && platformConfig[svc]) {
        if (!merged[k]) merged[k] = [];
        if (!merged[k].includes(svc)) { merged[k].push(svc); allAssigned.add(svc); }
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
 * 渲染快捷鍵設定 Modal 內容
 */
function renderShortcutSettings() {
  const shortcutConfigList = document.getElementById('shortcut-config-list');
  if (!shortcutConfigList) return;
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
      icon.width = 14; icon.height = 14; icon.alt = cfg.label;
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

/**
 * 綁定快捷鍵設定 Modal 的所有事件
 * @param {function} onSaved - 儲存後呼叫（傳入新的 config）
 */
function bindShortcutSettingsEvents(onSaved) {
  const settingsModal = document.getElementById('settings-modal');

  const openModal = () => {
    renderShortcutSettings();
    settingsModal.classList.remove('hidden');
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
      shortcutConfig = { ...defaultShortcutConfig };
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
      settingsModal.classList.add('hidden');
      showToast('快捷鍵設定已儲存', 'success');
      onSaved(newConfig);
    });
  }
}
