/**
 * 導航列模組
 * 負責 Webview 的上一頁/下一頁/重整/首頁/外部開啟/標題顯示
 */

//#region DOM 元素（延遲綁定）
let _navBar, _navBack, _navForward, _navReload, _navHome, _navPageTitle, _navSpinner, _navOpenExt;

function initNavBar() {
  _navBar       = document.getElementById('nav-bar');
  _navBack      = document.getElementById('nav-back');
  _navForward   = document.getElementById('nav-forward');
  _navReload    = document.getElementById('nav-reload');
  _navHome      = document.getElementById('nav-home');
  _navPageTitle = document.getElementById('nav-page-title');
  _navSpinner   = document.getElementById('nav-loading-spinner');
  _navOpenExt   = document.getElementById('nav-open-external');
}
//#endregion

/**
 * 取得目前 active 的 Webview 元素
 * @param {Record<string, HTMLElement>} webviews
 * @returns {HTMLElement|null}
 */
function getActiveWebview(webviews) {
  const el = webviews[localStorage.getItem('activeTab') || 'messenger'];
  return el && el.tagName === 'WEBVIEW' ? el : null;
}

/**
 * 根據目前 Tab 更新導航列顯示狀態
 * @param {string} tabName
 * @param {Record<string, HTMLElement>} webviews
 */
function updateNavBar(tabName, webviews) {
  if (!_navBar) return;
  const wv = webviews[tabName];
  const isWV = wv && wv.tagName === 'WEBVIEW';
  _navBar.classList.toggle('hidden', !isWV);
  if (!isWV) return;
  try {
    _navBack.disabled    = !wv.canGoBack();
    _navForward.disabled = !wv.canGoForward();
  } catch (_) { /* 尚未載入時忽略 */ }
}

/**
 * 更新導覽列的頁面標題
 * @param {string} title
 */
function setNavTitle(title) {
  if (_navPageTitle) _navPageTitle.textContent = title;
}

/**
 * 更新 spinner 與 reload 按鈕的載入狀態
 * @param {boolean} isLoading
 */
function setNavLoading(isLoading) {
  if (_navSpinner) _navSpinner.classList.toggle('hidden', !isLoading);
  if (_navReload)  _navReload.classList.toggle('loading', isLoading);
}

/**
 * 綁定導航列按鈕事件
 * @param {Record<string, HTMLElement>} webviews
 */
function bindNavBarEvents(webviews) {
  initNavBar();

  _navBack.addEventListener('click', () => {
    const wv = getActiveWebview(webviews);
    if (wv && wv.canGoBack()) wv.goBack();
  });

  _navForward.addEventListener('click', () => {
    const wv = getActiveWebview(webviews);
    if (wv && wv.canGoForward()) wv.goForward();
  });

  _navReload.addEventListener('click', () => {
    const wv = getActiveWebview(webviews);
    if (!wv) return;
    setNavLoading(true);
    wv.reload();
  });

  _navHome.addEventListener('click', () => {
    const activeTab = localStorage.getItem('activeTab') || 'messenger';
    const cfg = platformConfig[activeTab];
    const wv = getActiveWebview(webviews);
    if (wv && cfg && cfg.homeUrl) wv.loadURL(cfg.homeUrl);
  });

  _navOpenExt.addEventListener('click', () => {
    const wv = getActiveWebview(webviews);
    if (wv) openExternalUrl(wv.getURL());
  });
}
