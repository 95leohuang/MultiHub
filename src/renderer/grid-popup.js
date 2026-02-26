/**
 * Grid Popup 模組
 * 負責 Floating Dock 按鈕與 Grid Popup 的渲染與互動
 */

//#region 狀態
let isPopupOpen = false;
//#endregion

/**
 * 渲染 Grid Popup 的平台格子
 * @param {object} shortcutConfig
 */
function renderPlatformGrid(shortcutConfig) {
  const popupGrid = document.querySelector('.popup-grid');
  if (!popupGrid) return;

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
      img.addEventListener('click', (e) => {
        e.stopPropagation();
        switchTab(serviceKey, shortcutConfig);
      });
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
    item.addEventListener('click', () => switchTabCarousel(i, shortcutConfig));
    popupGrid.appendChild(item);
  }
}

/**
 * 開關 Grid Popup
 */
function togglePopup() {
  isPopupOpen = !isPopupOpen;
  const gridPopup  = document.getElementById('grid-popup');
  const dockTrigger = document.getElementById('dock-trigger');
  if (gridPopup)   gridPopup.classList.toggle('hidden', !isPopupOpen);
  if (dockTrigger) dockTrigger.classList.toggle('active', isPopupOpen);
}

/**
 * 關閉 Grid Popup
 */
function closePopup() {
  isPopupOpen = false;
  const gridPopup  = document.getElementById('grid-popup');
  const dockTrigger = document.getElementById('dock-trigger');
  if (gridPopup)   gridPopup.classList.add('hidden');
  if (dockTrigger) dockTrigger.classList.remove('active');
}

/**
 * 綁定 Dock Trigger 與 Grid Popup 事件
 * @param {object} shortcutConfig
 */
function bindGridPopupEvents(shortcutConfig) {
  const dockTrigger = document.getElementById('dock-trigger');
  const gridPopup   = document.getElementById('grid-popup');

  if (dockTrigger) {
    dockTrigger.addEventListener('click', (e) => { e.stopPropagation(); togglePopup(); });
  }

  document.addEventListener('click', (e) => {
    if (isPopupOpen && gridPopup && !gridPopup.contains(e.target) && e.target !== dockTrigger) {
      closePopup();
    }
  });
}
