/**
 * 側邊欄模組
 * 負責渲染側邊欄 Tab 按鈕、未讀徽章更新
 */

//#region 狀態
/** @type {Record<string, number>} */
const unreadCounts = {};
//#endregion

/**
 * 計算側邊欄排序：先依 shortcutConfig 順序，未分配的按 label 字母排序附後
 * @param {object} shortcutConfig
 * @returns {{ key: string, shortcutNum: number|null }[]}
 */
function getSidebarOrder(shortcutConfig) {
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

/**
 * 渲染側邊欄
 * @param {object} shortcutConfig
 * @param {function} onTabClick
 */
function renderSidebar(shortcutConfig, onTabClick) {
  const sidebarTabsEl = document.getElementById('sidebar-tabs');
  if (!sidebarTabsEl) return;

  const activeTab = localStorage.getItem('activeTab') || 'messenger';
  sidebarTabsEl.innerHTML = '';
  const ordered = getSidebarOrder(shortcutConfig);
  let dividerAdded = false;

  ordered.forEach(({ key, shortcutNum }) => {
    const cfg = platformConfig[key];
    if (!cfg) return;

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
    tooltip.textContent = shortcutNum !== null ? `${cfg.label} (Alt+${shortcutNum})` : cfg.label;

    btn.appendChild(img);
    btn.appendChild(badge);
    btn.appendChild(tooltip);
    btn.addEventListener('click', () => onTabClick(key));
    sidebarTabsEl.appendChild(btn);
  });
}

/**
 * 更新某個 tab 的未讀徽章（側邊欄 + Grid Popup + Dock）
 * @param {string} tabKey
 * @param {number} count
 * @param {object} shortcutConfig
 * @param {HTMLElement} dockBadge
 */
function updateBadge(tabKey, count, shortcutConfig, dockBadge) {
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
