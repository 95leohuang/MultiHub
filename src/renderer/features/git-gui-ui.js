/**
 * git-gui-ui.js — Git GUI Tab 主控制器
 * 功能：Repo 列表、Commit Log、Diff、Branch 管理、Local Changes / Staging、Stash、Tags
 */

/**
 * 常用 Lucide icon 內嵌 SVG path map
 * 每個 value 是 SVG 內部 path/circle 等元素的 innerHTML
 */
const ICONS = {
  'git-branch': '<line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>',
  'git-commit': '<circle cx="12" cy="12" r="3"/><line x1="3" y1="12" x2="9" y2="12"/><line x1="15" y1="12" x2="21" y2="12"/>',
  'arrow-down': '<line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>',
  'arrow-up': '<line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>',
  'arrow-up-right': '<polyline points="7 7 17 7 17 17"/><line x1="7" y1="17" x2="17" y2="7"/>',
  'refresh-cw': '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
  'search': '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  'folder': '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
  'file-text': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
  'package': '<path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
  'check': '<polyline points="20 6 9 17 4 12"/>',
  'check-circle': '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
  'list': '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
  'git-merge': '<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/>',
  'tag': '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>',
  'layers': '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
  'plus': '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  'trash-2': '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>',
  'log-in': '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>',
  'git-pull-request': '<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><line x1="6" y1="9" x2="6" y2="21"/>',
  'inbox': '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  'alert-circle': '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
  'x': '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
};

/**
 * 產生 Lucide icon 的 inline SVG HTML 字串
 * @param {string} name - icon 名稱（kebab-case，如 'git-branch'）
 * @param {number} size - 圖示尺寸（預設 14）
 * @param {string} cls  - 額外 CSS class
 */
function LucideIcon(name, size = 14, cls = '') {
  const inner = ICONS[name] || '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon${cls ? ' ' + cls : ''}" aria-hidden="true">${inner}</svg>`;
}

document.addEventListener('DOMContentLoaded', () => {
  const ui = document.getElementById('git-gui-ui');
  if (!ui) return;

  //#region 狀態
  /** @type {{ path: string, name: string, branch: string, isDirty: boolean }[]} */
  let repos = [];
  let activeRepo = null;
  let activeTab = 'log';
  let logCommits = [];
  let activeCommitHash = null;
  let activeCommitFiles = [];
  let activeChangeFile = null;
  /** @type {boolean} 是否顯示所有分支 */
  let logShowAll = true;
  /** @type {{ local: object[], remote: object[], current: string }} */
  let branchData = { local: [], remote: [], current: '' };
  /** @type {'flat'|'tree'|'grouped'} */
  let branchViewMode = 'tree';
  /** @type {string} */
  let branchFilter = '';
  /** @type {object[]} */
  let changeFiles = [];
  //#endregion

  //#region DOM 骨架注入
  ui.innerHTML = `
    <div class="gg-sidebar">
      <div class="gg-sidebar-header">
        <span class="gg-sidebar-title">Repositories</span>
        <button class="gg-icon-btn" id="gg-open-folder-btn" title="開啟資料夾搜尋">＋</button>
      </div>
      <div class="gg-repo-search">
        <input type="text" id="gg-repo-filter" placeholder="篩選 repo..." />
      </div>
      <div class="gg-repo-list" id="gg-repo-list"></div>
      <div class="gg-sidebar-add">
        <button class="gg-add-btn" id="gg-add-repo-btn">＋ 新增 Repository</button>
      </div>
    </div>

    <div class="gg-main">
      <!-- 頂部工具列 -->
      <div class="gg-toolbar" id="gg-toolbar">
        <span class="gg-toolbar-repo-name" id="gg-toolbar-repo-name">—</span>
        <span class="gg-toolbar-branch" id="gg-toolbar-branch">
          <span>⎇</span><span id="gg-toolbar-branch-name">—</span>
        </span>
        <div class="gg-toolbar-sep"></div>
        <button class="gg-toolbar-btn" id="gg-btn-fetch">${LucideIcon('arrow-down', 13)} Fetch</button>
        <button class="gg-toolbar-btn" id="gg-btn-pull">${LucideIcon('log-in', 13)} Pull</button>
        <button class="gg-toolbar-btn" id="gg-btn-push">${LucideIcon('arrow-up-right', 13)} Push</button>
        <div class="gg-toolbar-spacer"></div>
        <button class="gg-toolbar-btn" id="gg-btn-refresh">${LucideIcon('refresh-cw', 13)} 重新整理</button>
      </div>

      <!-- Tab 列 -->
      <div class="gg-tabs">
        <div class="gg-tab active" data-tab="log">Commits</div>
        <div class="gg-tab" data-tab="changes">Changes <span class="gg-tab-badge hidden" id="gg-changes-badge">0</span></div>
        <div class="gg-tab" data-tab="branches">Branches</div>
        <div class="gg-tab" data-tab="stash">Stashes</div>
        <div class="gg-tab" data-tab="tags">Tags</div>
      </div>

      <!-- === Commit Log 面板 === -->
      <div class="gg-panel active" id="gg-panel-log">
        <div class="gg-log-layout">

          <!-- 上半：Commit Table -->
          <div class="gg-log-top">
            <!-- 篩選列 + 表頭 -->
            <div class="gg-log-header">
              <div class="gg-log-toolbar">
                <button class="gg-log-filter-btn active" id="gg-log-all-btn">All Branches</button>
                <button class="gg-log-filter-btn" id="gg-log-current-btn">${LucideIcon('git-branch', 12)} Current</button>
              </div>
              <div class="gg-log-cols-header">
                <div class="gg-col-graph-subject">GRAPH &amp; SUBJECT</div>
                <div class="gg-col-author">AUTHOR</div>
                <div class="gg-col-sha">SHA</div>
                <div class="gg-col-time">COMMIT TIME</div>
              </div>
            </div>
            <!-- Commit 列表 -->
            <div class="gg-log-list" id="gg-log-list">
              <div class="gg-empty"><div class="gg-empty-icon">${LucideIcon('git-commit', 32)}</div><p>選擇左側 Repository</p></div>
            </div>
          </div>

          <!-- 下半：Commit Detail -->
          <div class="gg-log-detail" id="gg-log-detail">
            <div class="gg-diff-placeholder">
              <div class="gg-empty"><div class="gg-empty-icon">${LucideIcon('search', 32)}</div><p>點擊上方 Commit 查看詳情</p></div>
            </div>
          </div>

        </div>
      </div>

      <!-- === Local Changes 面板 === -->
      <div class="gg-panel" id="gg-panel-changes">
        <div class="gg-changes-layout">
          <div class="gg-changes-left">
            <!-- Staged -->
            <div class="gg-changes-section" style="flex: 0 0 auto; max-height: 50%;">
              <div class="gg-changes-section-header">
                Staged <span id="gg-staged-count" style="font-weight:400">(0)</span>
                <div class="section-actions">
                  <button class="gg-icon-btn" id="gg-unstage-all-btn" title="Unstage All">${LucideIcon('arrow-down', 13)}</button>
                </div>
              </div>
              <div class="gg-changes-list" id="gg-staged-list"></div>
            </div>
            <!-- Unstaged -->
            <div class="gg-changes-section" style="flex: 1;">
              <div class="gg-changes-section-header">
                Changes <span id="gg-unstaged-count" style="font-weight:400">(0)</span>
                <div class="section-actions">
                  <button class="gg-icon-btn" id="gg-stage-all-btn" title="Stage All">${LucideIcon('arrow-up', 13)}</button>
                </div>
              </div>
              <div class="gg-changes-list" id="gg-unstaged-list"></div>
            </div>
            <!-- Commit Box -->
            <div class="gg-commit-box">
              <textarea class="gg-commit-textarea" id="gg-commit-msg" placeholder="輸入 commit message..."></textarea>
              <div class="gg-commit-actions">
                <button class="gg-toolbar-btn primary" id="gg-commit-btn" style="flex:1">${LucideIcon('check', 13)} Commit</button>
                <button class="gg-toolbar-btn" id="gg-stash-save-btn" title="Stash 所有變更">${LucideIcon('package', 13)} Stash</button>
              </div>
            </div>
          </div>
          <!-- Diff 預覽 -->
          <div class="gg-log-detail" style="flex:1;">
            <div class="gg-diff-view" id="gg-changes-diff">
              <div class="gg-diff-placeholder">
                <div class="gg-empty"><div class="gg-empty-icon">${LucideIcon('file-text', 32)}</div><p>點擊檔案查看 diff</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- === Branch 管理面板 === -->
      <div class="gg-panel" id="gg-panel-branches">
        <div class="gg-branches-layout">
          <div class="gg-branches-toolbar">
            <button class="gg-toolbar-btn primary" id="gg-new-branch-btn">${LucideIcon('plus', 13)} New Branch</button>
            <div id="gg-new-branch-form" style="display:none; gap:6px; align-items:center; flex:1">
              <input type="text" class="gg-inline-input" id="gg-new-branch-name" placeholder="branch-name" style="flex:1">
              <button class="gg-toolbar-btn primary" id="gg-create-branch-btn">建立</button>
              <button class="gg-toolbar-btn" id="gg-cancel-branch-btn">取消</button>
            </div>
          </div>
          <div class="gg-branches-search-bar">
            <div class="gg-branches-search-wrap">
              <svg class="gg-search-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" class="gg-branches-search-input" id="gg-branch-search" placeholder="搜尋分支...">
              <button class="gg-search-clear hidden" id="gg-branch-search-clear" title="清除">✕</button>
            </div>
            <div class="gg-branch-view-btns">
              <button class="gg-view-btn active" id="gg-view-tree" data-mode="tree" title="樹狀結構">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                Tree
              </button>
              <button class="gg-view-btn" id="gg-view-flat" data-mode="flat" title="平面列表">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                Flat
              </button>
              <button class="gg-view-btn" id="gg-view-grouped" data-mode="grouped" title="依前綴分群">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                Grouped
              </button>
            </div>
          </div>
          <div class="gg-branches-content" id="gg-branches-content">
            <!-- 由 RenderBranches 動態生成 -->
          </div>
        </div>
      </div>

      <!-- === Stash 面板 === -->
      <div class="gg-panel" id="gg-panel-stash">
        <div class="gg-stash-layout">
          <div class="gg-stash-toolbar">
            <button class="gg-toolbar-btn primary" id="gg-stash-push-btn">${LucideIcon('package', 13)} Stash Push</button>
          </div>
          <div class="gg-stash-list" id="gg-stash-list">
            <div class="gg-empty"><div class="gg-empty-icon">${LucideIcon('package', 32)}</div><p>無 Stash 記錄</p></div>
          </div>
        </div>
      </div>

      <!-- === Tags 面板 === -->
      <div class="gg-panel" id="gg-panel-tags">
        <div class="gg-tag-list" id="gg-tag-list">
          <div class="gg-empty"><div class="gg-empty-icon">${LucideIcon('tag', 32)}</div><p>無 Tags</p></div>
        </div>
      </div>
    </div>
  `;
  //#endregion

  //#region DOM 元素參考
  const repoListEl = document.getElementById('gg-repo-list');
  const repoFilterEl = document.getElementById('gg-repo-filter');
  const addRepoBtn = document.getElementById('gg-add-repo-btn');
  const openFolderBtn = document.getElementById('gg-open-folder-btn');
  const toolbarRepoName = document.getElementById('gg-toolbar-repo-name');
  const toolbarBranchName = document.getElementById('gg-toolbar-branch-name');
  const btnFetch = document.getElementById('gg-btn-fetch');
  const btnPull = document.getElementById('gg-btn-pull');
  const btnPush = document.getElementById('gg-btn-push');
  const btnRefresh = document.getElementById('gg-btn-refresh');
  const logListEl = document.getElementById('gg-log-list');
  const logDetailEl = document.getElementById('gg-log-detail');
  const changesBadge = document.getElementById('gg-changes-badge');
  const stagedListEl = document.getElementById('gg-staged-list');
  const unstagedListEl = document.getElementById('gg-unstaged-list');
  const stagedCount = document.getElementById('gg-staged-count');
  const unstagedCount = document.getElementById('gg-unstaged-count');
  const stageAllBtn = document.getElementById('gg-stage-all-btn');
  const unstageAllBtn = document.getElementById('gg-unstage-all-btn');
  const commitMsgEl = document.getElementById('gg-commit-msg');
  const commitBtn = document.getElementById('gg-commit-btn');
  const stashSaveBtn = document.getElementById('gg-stash-save-btn');
  const changesDiffEl = document.getElementById('gg-changes-diff');
  const branchesContentEl = document.getElementById('gg-branches-content');
  const branchSearchEl = document.getElementById('gg-branch-search');
  const branchSearchClearEl = document.getElementById('gg-branch-search-clear');
  const newBranchBtn = document.getElementById('gg-new-branch-btn');
  const newBranchForm = document.getElementById('gg-new-branch-form');
  const newBranchNameEl = document.getElementById('gg-new-branch-name');
  const createBranchBtn = document.getElementById('gg-create-branch-btn');
  const cancelBranchBtn = document.getElementById('gg-cancel-branch-btn');
  const stashListEl = document.getElementById('gg-stash-list');
  const stashPushBtn = document.getElementById('gg-stash-push-btn');
  const tagListEl = document.getElementById('gg-tag-list');
  //#endregion

  //#region 工具函式

  /** 格式化相對時間 */
  function RelativeTime(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const secs = Math.floor(diff / 1000);
    if (secs < 60) return `${secs}s 前`;
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m 前`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h 前`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d 前`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo 前`;
    return `${Math.floor(months / 12)}y 前`;
  }

  /** 顯示 Toast（安全呼叫全域函式） */
  function Toast(msg, type) {
    if (typeof showToast === 'function') showToast(msg, type || 'info');
  }

  /** 設定載入中狀態到容器 */
  function SetLoading(el) {
    el.innerHTML = '<div class="gg-loading"><div class="gg-spinner"></div> 載入中...</div>';
  }

  /** 解析 diff 字串並渲染為 HTML */
  function RenderDiff(diffText) {
    if (!diffText || !diffText.trim()) {
      return '<div class="gg-diff-placeholder"><div class="gg-empty"><p>無差異內容</p></div></div>';
    }
    const lines = diffText.split('\n');
    let html = '';
    let leftNum = 0;
    let rightNum = 0;
    let inHunk = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('diff ') || line.startsWith('index ') || line.startsWith('--- ') || line.startsWith('+++ ')) {
        if (!inHunk) {
          html += `<div class="gg-diff-hunk-header" style="color:var(--text-muted);padding:4px 12px;font-size:11px;">${EscHtml(line)}</div>`;
        }
        continue;
      }
      if (line.startsWith('@@')) {
        inHunk = true;
        // 解析 @@ -l,s +l,s @@
        const m = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
        if (m) { leftNum = parseInt(m[1]) - 1; rightNum = parseInt(m[2]) - 1; }
        html += `<div class="gg-diff-hunk"><div class="gg-diff-hunk-header">${EscHtml(line)}</div>`;
        continue;
      }
      if (!inHunk) continue;

      let cls = '';
      let lLeft = '';
      let lRight = '';

      if (line.startsWith('+') && !line.startsWith('+++')) {
        cls = 'added';
        rightNum++;
        lRight = rightNum;
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        cls = 'removed';
        leftNum++;
        lLeft = leftNum;
      } else {
        leftNum++;
        rightNum++;
        lLeft = leftNum;
        lRight = rightNum;
      }

      html += `<div class="gg-diff-line ${cls}">
        <div class="gg-diff-line-nums">
          <span class="gg-diff-lnum">${lLeft}</span>
          <span class="gg-diff-lnum">${lRight}</span>
        </div>
        <div class="gg-diff-line-content">${EscHtml(line)}</div>
      </div>`;
    }
    return html || '<div class="gg-diff-placeholder"><div class="gg-empty"><p>無差異內容</p></div></div>';
  }

  function EscHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  //#endregion

  //#region Repo 列表

  function LoadSavedRepos() {
    const saved = localStorage.getItem('gg-repos');
    if (saved) {
      try { repos = JSON.parse(saved); } catch (e) { repos = []; }
    }
    RenderRepoList();
    if (repos.length > 0) SelectRepo(repos[0]);
  }

  function SaveRepos() {
    localStorage.setItem('gg-repos', JSON.stringify(repos));
  }

  function RenderRepoList() {
    const filter = repoFilterEl.value.toLowerCase();
    const filtered = repos.filter(r => r.name.toLowerCase().includes(filter) || r.path.toLowerCase().includes(filter));
    if (filtered.length === 0) {
      repoListEl.innerHTML = '<div class="gg-empty" style="padding:20px;font-size:12px;"><p>無 Repository</p></div>';
      return;
    }
    repoListEl.innerHTML = filtered.map(r => `
      <div class="gg-repo-item ${r.isDirty ? 'dirty' : ''} ${activeRepo && activeRepo.path === r.path ? 'active' : ''}"
           data-path="${r.path}">
        <span class="gg-repo-icon">📁</span>
        <div class="gg-repo-info">
          <div class="gg-repo-name">${EscHtml(r.name)}</div>
          <div class="gg-repo-branch">${EscHtml(r.branch || '...')}</div>
        </div>
        <span class="gg-repo-dirty-dot"></span>
      </div>
    `).join('');

    repoListEl.querySelectorAll('.gg-repo-item').forEach(el => {
      el.addEventListener('click', () => {
        const p = el.dataset.path;
        const repo = repos.find(r => r.path === p);
        if (repo) SelectRepo(repo);
      });
    });
  }

  function SelectRepo(repo) {
    activeRepo = repo;
    toolbarRepoName.textContent = repo.name;
    toolbarBranchName.textContent = repo.branch || '...';
    RenderRepoList();
    RefreshActiveTab();
  }

  async function AddRepo(repoPath) {
    if (repos.find(r => r.path === repoPath)) {
      Toast('此 Repository 已在列表中', 'warning');
      return;
    }
    const parts = repoPath.replace(/\\/g, '/').split('/');
    const name = parts[parts.length - 1] || parts[parts.length - 2] || repoPath;
    const repo = { path: repoPath, name, branch: '...', isDirty: false };
    repos.push(repo);
    SaveRepos();
    // 非同步取得分支資訊
    window.electronAPI.getRepoInfo(repoPath)
      .then(info => {
        repo.branch = info.branch || '?';
        repo.isDirty = info.isDirty || false;
        RenderRepoList();
      })
      .catch(() => { });
    RenderRepoList();
    SelectRepo(repo);
  }

  repoFilterEl.addEventListener('input', RenderRepoList);

  addRepoBtn.addEventListener('click', () => {
    window.electronAPI.selectDirectory()
      .then(p => { if (p) AddRepo(p); })
      .catch(() => { });
  });

  openFolderBtn.addEventListener('click', () => {
    window.electronAPI.selectDirectory()
      .then(p => { if (p) AddRepo(p); })
      .catch(() => { });
  });
  //#endregion

  //#region Tab 切換

  document.querySelectorAll('.gg-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.gg-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.gg-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const panelId = `gg-panel-${tab.dataset.tab}`;
      const panel = document.getElementById(panelId);
      if (panel) panel.classList.add('active');
      activeTab = tab.dataset.tab;
      if (activeRepo) LoadTab(activeTab);
    });
  });

  function RefreshActiveTab() {
    if (activeRepo) LoadTab(activeTab);
  }

  function LoadTab(tab) {
    if (!activeRepo) return;
    if (tab === 'log') LoadLog();
    if (tab === 'changes') LoadChanges();
    if (tab === 'branches') LoadBranches();
    if (tab === 'stash') LoadStashes();
    if (tab === 'tags') LoadTags();
  }
  //#endregion

  //#region Toolbar 按鈕

  function SetBtnLoading(btn, label) {
    btn.disabled = true;
    btn._origText = btn.textContent;
    btn.textContent = label;
  }

  function ResetBtn(btn) {
    btn.disabled = false;
    btn.textContent = btn._origText || btn.textContent;
  }

  btnFetch.addEventListener('click', () => {
    if (!activeRepo) return;
    SetBtnLoading(btnFetch, '...');
    window.electronAPI.gitGuiFetch(activeRepo.path)
      .then(r => {
        ResetBtn(btnFetch);
        if (r.success) { Toast('Fetch 完成', 'success'); RefreshActiveTab(); }
        else Toast(`Fetch 失敗：${r.error}`, 'error');
      })
      .catch(e => { ResetBtn(btnFetch); Toast(e.message, 'error'); });
  });

  btnPull.addEventListener('click', () => {
    if (!activeRepo) return;
    SetBtnLoading(btnPull, '...');
    window.electronAPI.gitGuiPull(activeRepo.path)
      .then(r => {
        ResetBtn(btnPull);
        if (r.success) { Toast('Pull 完成', 'success'); RefreshActiveTab(); }
        else Toast(`Pull 失敗：${r.error}`, 'error');
      })
      .catch(e => { ResetBtn(btnPull); Toast(e.message, 'error'); });
  });

  btnPush.addEventListener('click', () => {
    if (!activeRepo) return;
    SetBtnLoading(btnPush, '...');
    window.electronAPI.gitGuiPush(activeRepo.path, false)
      .then(r => {
        ResetBtn(btnPush);
        if (r.success) { Toast('Push 完成', 'success'); RefreshActiveTab(); }
        else Toast(`Push 失敗：${r.error}`, 'error');
      })
      .catch(e => { ResetBtn(btnPush); Toast(e.message, 'error'); });
  });

  btnRefresh.addEventListener('click', () => {
    if (!activeRepo) return;
    // 更新分支資訊
    window.electronAPI.getRepoInfo(activeRepo.path)
      .then(info => {
        activeRepo.branch = info.branch || '?';
        activeRepo.isDirty = info.isDirty || false;
        toolbarBranchName.textContent = activeRepo.branch;
        SaveRepos();
        RenderRepoList();
      })
      .catch(() => { });
    RefreshActiveTab();
    Toast('已重新整理', 'info');
  });
  //#endregion

  //#region Commit Log

  function LoadLog() {
    if (!activeRepo) return;
    SetLoading(logListEl);
    logDetailEl.innerHTML = `<div class="gg-diff-placeholder"><div class="gg-empty"><div class="gg-empty-icon">${LucideIcon('search', 32)}</div><p>點擊上方 Commit 查看詳情</p></div></div>`;

    const opts = { limit: 300, showAll: logShowAll };
    window.electronAPI.gitGuiLog(activeRepo.path, opts)
      .then(commits => {
        logCommits = commits;
        if (commits.length === 0) {
          logListEl.innerHTML = `<div class="gg-empty"><div class="gg-empty-icon">${LucideIcon('git-commit', 32)}</div><p>無 Commit 記錄</p></div>`;
          return;
        }
        RenderLogList(commits);
      })
      .catch(() => {
        logListEl.innerHTML = '<div class="gg-empty"><p>載入失敗</p></div>';
      });
  }

  //#region Graph Lane 演算法

  /** 預設 lane 顏色循環（SourceGit 風格） */
  const LANE_COLORS = [
    '#4c9be8', '#e8804c', '#9b59b6', '#27ae60',
    '#e74c3c', '#16a085', '#f39c12', '#2980b9',
    '#8e44ad', '#1abc9c', '#d35400', '#2ecc71'
  ];

  /**
   * 計算所有 commit 的 lane 佈局。
   * 回傳每個 commit 的：
   *   lane      - 節點所在 lane index
   *   color     - 節點顏色
   *   upLines   - 從上一行到本節點（上半段）的連線：{ fromLane, toLane, color }
   *   downLines - 從本節點到下一行（下半段）的連線：{ fromLane, toLane, color }
   *   maxLane   - 全域最大 lane（用於統一 SVG 寬度）
   *
   * @param {{ hash: string, parents: string[] }[]} commits
   */
  function BuildGraphLanes(commits) {
    // activeLanes[i] = hash｜null，表示此 lane 目前正在追蹤哪個 commit
    let activeLanes = [];

    // laneColor[i] = 此 lane 的固定顏色（分配時決定，不隨 commit 改變）
    const laneColor = [];

    let globalMaxLane = 0;

    /** 取得 hash 所在的 lane；若不存在則分配新 lane */
    function assignLane(hash) {
      let idx = activeLanes.indexOf(hash);
      if (idx !== -1) return idx;
      // 優先填入空位
      idx = activeLanes.indexOf(null);
      if (idx === -1) { idx = activeLanes.length; }
      activeLanes[idx] = hash;
      if (!laneColor[idx]) {
        laneColor[idx] = LANE_COLORS[idx % LANE_COLORS.length];
      }
      return idx;
    }

    const results = [];

    commits.forEach(c => {
      // ── 1. 先備份目前的 activeLanes（不含將要新分配的）─────────
      const prevLanes = activeLanes.slice();
      const alreadyExists = activeLanes.includes(c.hash);

      const myLane = assignLane(c.hash);
      const myColor = laneColor[myLane];

      // ── 2. 記錄「上半段」連線（對上一行已存在的 lanes 才畫）──
      const upLines = [];
      prevLanes.forEach((h, l) => {
        if (!h) return;
        if (h === c.hash) {
          upLines.push({ fromLane: l, toLane: myLane, color: laneColor[l] || myColor });
        } else {
          // 其他 lane 直通
          upLines.push({ fromLane: l, toLane: l, color: laneColor[l] });
        }
      });

      // ── 3. 計算下一狀態的 activeLanes ────────────────────
      const nextLanes = activeLanes.slice();

      if (c.parents.length === 0) {
        // 根節點：釋放此 lane
        nextLanes[myLane] = null;
      } else {
        // 第一個 parent 繼承此 lane
        nextLanes[myLane] = c.parents[0];
        // merge：額外 parents 佔用新 lane
        for (let p = 1; p < c.parents.length; p++) {
          if (!nextLanes.includes(c.parents[p])) {
            let slot = nextLanes.indexOf(null);
            if (slot === -1) { slot = nextLanes.length; }
            nextLanes[slot] = c.parents[p];
            if (!laneColor[slot]) {
              laneColor[slot] = LANE_COLORS[slot % LANE_COLORS.length];
            }
          }
        }
      }

      // 清理尾部 null
      while (nextLanes.length > 0 && nextLanes[nextLanes.length - 1] === null) nextLanes.pop();

      // ── 4. 記錄「下半段」連線（從節點到下一行）──────────
      const downLines = [];
      nextLanes.forEach((h, l) => {
        if (!h) return;
        if (l === myLane) {
          // 從節點向下
          downLines.push({ fromLane: myLane, toLane: l, color: laneColor[l] });
        } else {
          // 其他 lane 直通
          downLines.push({ fromLane: l, toLane: l, color: laneColor[l] });
        }
      });

      // merge：從節點向右/左延伸到 parent lane（下半段）
      if (c.parents.length > 1) {
        for (let p = 1; p < c.parents.length; p++) {
          const pLane = nextLanes.indexOf(c.parents[p]);
          if (pLane !== -1 && pLane !== myLane) {
            downLines.push({ fromLane: myLane, toLane: pLane, color: myColor, curve: true });
          }
        }
      }

      const maxUsed = Math.max(myLane, ...nextLanes.map((_, i) => i));
      globalMaxLane = Math.max(globalMaxLane, maxUsed);

      results.push({ lane: myLane, color: myColor, upLines, downLines });

      activeLanes = nextLanes;
    });

    // 補齊 maxLane
    results.forEach(r => { r.maxLane = globalMaxLane; });
    return results;
  }

  /**
   * 產生單一 row 的 SVG graph（SourceGit 風格：折線 + 帶外環空心節點）
   */
  function BuildGraphSvg(g, rowH, svgW) {
    const { lane, color, upLines, downLines } = g;
    const colW = 10;  // 緊湊欄寬
    const h = rowH;
    const cy = h / 2;
    const cx = lane * colW + colW / 2;
    const r = 3;   // 節點半徑
    const sw = 1.5; // stroke-width
    const bend = Math.round(h * 0.35); // 折點高度偏移

    let paths = '';

    // 上半段：折線（先水平移動，再垂直）
    upLines.forEach(e => {
      const x1 = e.fromLane * colW + colW / 2;
      const x2 = e.toLane * colW + colW / 2;
      if (x1 === x2) {
        paths += `<line x1="${x1}" y1="0" x2="${x2}" y2="${cy}" stroke="${e.color}" stroke-width="${sw}" stroke-linecap="round"/>`;
      } else {
        // 折線：垂直到折點，再斜線到目標
        const fy = Math.round(cy * 0.45);
        paths += `<polyline points="${x1},0 ${x1},${fy} ${x2},${cy}" fill="none" stroke="${e.color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`;
      }
    });

    // 下半段：折線（先斜線到折點，再垂直）
    downLines.forEach(e => {
      const x1 = e.fromLane * colW + colW / 2;
      const x2 = e.toLane * colW + colW / 2;
      if (x1 === x2) {
        paths += `<line x1="${x1}" y1="${cy}" x2="${x2}" y2="${h}" stroke="${e.color}" stroke-width="${sw}" stroke-linecap="round"/>`;
      } else {
        const fy = Math.round(cy + (h - cy) * 0.55);
        paths += `<polyline points="${x1},${cy} ${x2},${fy} ${x2},${h}" fill="none" stroke="${e.color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`;
      }
    });

    // 節點：帶外環的空心圓（SourceGit 風格）
    paths += `<circle cx="${cx}" cy="${cy}" r="${r + 1.5}" fill="var(--bg-primary)" stroke="${color}" stroke-width="1.2"/>`;
    paths += `<circle cx="${cx}" cy="${cy}" r="${r - 0.5}" fill="${color}"/>`;

    return `<svg width="${svgW}" height="${h}" viewBox="0 0 ${svgW} ${h}" style="display:block;flex-shrink:0">${paths}</svg>`;
  }

  //#endregion

  function RenderLogList(commits) {
    const graphData = BuildGraphLanes(commits);
    const ROW_H = 28;  // SourceGit 風格：緊湊單行
    const COL_W = 10;
    const MAX_LANES = 16;
    const maxL = Math.min(graphData.reduce((m, g) => Math.max(m, g.maxLane), 0), MAX_LANES - 1);
    const SVG_W = (maxL + 2) * COL_W;
    const MAX_TAGS = 4;
    const MAX_LABEL = 22;

    logListEl.innerHTML = commits.map((c, i) => {
      const g = graphData[i];

      const refTags = c.refs.map(r => {
        let cls = 'local';
        if (r.includes('HEAD')) cls = 'head';
        else if (r.includes('/')) cls = 'remote';
        else if (r.startsWith('tag:')) cls = 'tag';
        const full = r.replace('tag: ', '').replace('refs/heads/', '').replace('refs/remotes/', '');
        const label = full.length > MAX_LABEL ? full.slice(0, MAX_LABEL) + '…' : full;
        return `<span class="gg-ref-tag ${cls}" title="${EscHtml(full)}">${EscHtml(label)}</span>`;
      });
      const visibleTags = refTags.slice(0, MAX_TAGS);
      const extra = refTags.length - visibleTags.length;
      const tagsHtml = visibleTags.join('') + (extra > 0 ? `<span class="gg-ref-tag more">+${extra}</span>` : '');

      return `<div class="gg-commit-item ${activeCommitHash === c.hash ? 'active' : ''}" data-hash="${c.hash}" data-idx="${i}">
        <div class="gg-col-graph-subject">
          <div class="gg-commit-graph" style="width:${SVG_W}px;height:${ROW_H}px;flex-shrink:0">${BuildGraphSvg(g, ROW_H, SVG_W)}</div>
          <div class="gg-commit-subject-wrap">
            ${tagsHtml}
            <span class="gg-commit-subject" title="${EscHtml(c.subject)}">${EscHtml(c.subject)}</span>
          </div>
        </div>
        <div class="gg-col-author" title="${EscHtml(c.authorName)}">${EscHtml(c.authorName)}</div>
        <div class="gg-col-sha">${c.shortHash}</div>
        <div class="gg-col-time">${RelativeTime(c.authorDate)}</div>
      </div>`;
    }).join('');

    logListEl.querySelectorAll('.gg-commit-item').forEach(el => {
      el.addEventListener('click', () => {
        logListEl.querySelectorAll('.gg-commit-item').forEach(e => e.classList.remove('active'));
        el.classList.add('active');
        LoadCommitDetail(el.dataset.hash);
      });
    });
  }

  function LoadCommitDetail(hash) {
    activeCommitHash = hash;
    logDetailEl.innerHTML = '<div class="gg-loading"><div class="gg-spinner"></div> 載入中...</div>';

    window.electronAPI.gitGuiCommitDetail(activeRepo.path, hash)
      .then(detail => {
        if (!detail) { logDetailEl.innerHTML = '<div class="gg-empty"><p>無法載入 commit 詳情</p></div>'; return; }

        const refsHtml = detail.refs ? detail.refs.split(',').map(r => r.trim()).filter(Boolean)
          .map(r => `<span class="gg-ref-tag local">${EscHtml(r)}</span>`).join('') : '';

        logDetailEl.innerHTML = `
          <div class="gg-detail-header">
            <div class="gg-detail-subject">${EscHtml(detail.subject || '')}</div>
            ${refsHtml ? `<div class="gg-commit-refs" style="margin-bottom:6px">${refsHtml}</div>` : ''}
            <div class="gg-detail-meta">
              <span>👤 ${EscHtml(detail.authorName || '')} &lt;${EscHtml(detail.authorEmail || '')}&gt;</span>
              <span>🕐 ${detail.authorDate || ''}</span>
              <span style="font-family:monospace;color:var(--accent)">${detail.shortHash || ''}</span>
            </div>
            ${detail.body ? `<div class="gg-detail-body-text">${EscHtml(detail.body)}</div>` : ''}
          </div>
          <div class="gg-detail-layout">
            <div class="gg-detail-files" id="gg-detail-files-list">
              <div class="gg-loading"><div class="gg-spinner"></div></div>
            </div>
            <div class="gg-diff-view" id="gg-detail-diff-view">
              <div class="gg-diff-placeholder"><div class="gg-empty"><p>選擇左側檔案查看 diff</p></div></div>
            </div>
          </div>
        `;

        window.electronAPI.gitGuiCommitDiff(activeRepo.path, hash)
          .then(data => {
            activeCommitFiles = data.files || [];
            RenderCommitFiles(activeCommitFiles, hash);
          })
          .catch(() => {
            const el = document.getElementById('gg-detail-files-list');
            if (el) el.innerHTML = '<div class="gg-empty"><p>載入失敗</p></div>';
          });
      })
      .catch(() => {
        logDetailEl.innerHTML = '<div class="gg-empty"><p>載入失敗</p></div>';
      });
  }

  function RenderCommitFiles(files, hash) {
    const el = document.getElementById('gg-detail-files-list');
    if (!el) return;
    if (files.length === 0) { el.innerHTML = '<div class="gg-empty"><p>無變更</p></div>'; return; }

    el.innerHTML = files.map((f, i) => `
      <div class="gg-file-item" data-idx="${i}">
        <span class="gg-file-status ${f.status}">${f.status}</span>
        <span class="gg-file-name" title="${EscHtml(f.path)}">${EscHtml(f.path.split('/').pop())}</span>
      </div>
    `).join('');

    el.querySelectorAll('.gg-file-item').forEach((item, i) => {
      item.addEventListener('click', () => {
        el.querySelectorAll('.gg-file-item').forEach(x => x.classList.remove('active'));
        item.classList.add('active');
        LoadFileDiff(hash, files[i].path);
      });
    });

    // 預設展開第一個檔案的 diff
    if (files.length > 0) {
      el.querySelector('.gg-file-item').click();
    }
  }

  function LoadFileDiff(hash, filePath) {
    const diffEl = document.getElementById('gg-detail-diff-view');
    if (!diffEl) return;
    diffEl.innerHTML = '<div class="gg-loading"><div class="gg-spinner"></div></div>';
    window.electronAPI.gitGuiFileDiff(activeRepo.path, hash, filePath)
      .then(diff => { diffEl.innerHTML = RenderDiff(diff); })
      .catch(() => { diffEl.innerHTML = '<div class="gg-empty"><p>載入失敗</p></div>'; });
  }
  //#endregion

  //#region Local Changes / Staging

  function LoadChanges() {
    if (!activeRepo) return;
    stagedListEl.innerHTML = '<div class="gg-loading"><div class="gg-spinner"></div></div>';
    unstagedListEl.innerHTML = '';

    window.electronAPI.gitGuiStatus(activeRepo.path)
      .then(files => {
        changeFiles = files;
        RenderChanges(files);
      })
      .catch(() => {
        stagedListEl.innerHTML = '<div class="gg-empty"><p>載入失敗</p></div>';
      });
  }

  function RenderChanges(files) {
    const staged = files.filter(f => f.staged);
    const unstaged = files.filter(f => !f.staged || f.unstaged);
    const untracked = files.filter(f => f.untracked);
    const unstagedAll = files.filter(f => !f.staged);

    stagedCount.textContent = `(${staged.length})`;
    unstagedCount.textContent = `(${unstagedAll.length})`;

    const totalChanges = files.length;
    changesBadge.textContent = totalChanges;
    changesBadge.classList.toggle('hidden', totalChanges === 0);

    // Staged
    if (staged.length === 0) {
      stagedListEl.innerHTML = '<div class="gg-empty" style="padding:12px;font-size:11px;"><p>無 Staged 變更</p></div>';
    } else {
      stagedListEl.innerHTML = staged.map(f => `
        <div class="gg-change-item" data-path="${EscHtml(f.path)}" data-mode="staged">
          <span class="gg-change-xy staged">${f.xy[0]}</span>
          <span class="gg-change-path" title="${EscHtml(f.path)}">${EscHtml(f.path)}</span>
          <span class="gg-change-action">
            <button class="gg-branch-action-btn" data-action="unstage" data-path="${EscHtml(f.path)}">↓</button>
          </span>
        </div>
      `).join('');
    }

    // Unstaged + Untracked
    if (unstagedAll.length === 0) {
      unstagedListEl.innerHTML = '<div class="gg-empty" style="padding:12px;font-size:11px;"><p>工作區乾淨</p></div>';
    } else {
      unstagedListEl.innerHTML = unstagedAll.map(f => `
        <div class="gg-change-item" data-path="${EscHtml(f.path)}" data-mode="unstaged">
          <span class="gg-change-xy ${f.untracked ? 'untracked' : ''}">${f.untracked ? '?' : f.xy[1]}</span>
          <span class="gg-change-path" title="${EscHtml(f.path)}">${EscHtml(f.path)}</span>
          <span class="gg-change-action">
            <button class="gg-branch-action-btn" data-action="stage" data-path="${EscHtml(f.path)}">↑</button>
          </span>
        </div>
      `).join('');
    }

    // 綁定 stage/unstage 按鈕
    document.querySelectorAll('#gg-staged-list .gg-branch-action-btn[data-action="unstage"]').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); DoUnstage(btn.dataset.path); });
    });
    document.querySelectorAll('#gg-unstaged-list .gg-branch-action-btn[data-action="stage"]').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); DoStage(btn.dataset.path); });
    });

    // 綁定 diff 預覽
    document.querySelectorAll('.gg-change-item').forEach(item => {
      item.addEventListener('click', () => {
        document.querySelectorAll('.gg-change-item').forEach(x => x.classList.remove('active'));
        item.classList.add('active');
        const filePath = item.dataset.path;
        changesDiffEl.innerHTML = '<div class="gg-loading"><div class="gg-spinner"></div></div>';
        window.electronAPI.gitGuiWorkdirDiff(activeRepo.path, filePath)
          .then(diff => { changesDiffEl.innerHTML = RenderDiff(diff); })
          .catch(() => { changesDiffEl.innerHTML = '<div class="gg-empty"><p>載入失敗</p></div>'; });
      });
    });
  }

  function DoStage(filePath) {
    if (!activeRepo) return;
    window.electronAPI.gitGuiStage(activeRepo.path, filePath)
      .then(r => {
        if (r.success) LoadChanges();
        else Toast(`Stage 失敗：${r.error}`, 'error');
      })
      .catch(e => Toast(e.message, 'error'));
  }

  function DoUnstage(filePath) {
    if (!activeRepo) return;
    window.electronAPI.gitGuiUnstage(activeRepo.path, filePath)
      .then(r => {
        if (r.success) LoadChanges();
        else Toast(`Unstage 失敗：${r.error}`, 'error');
      })
      .catch(e => Toast(e.message, 'error'));
  }

  stageAllBtn.addEventListener('click', () => {
    if (!activeRepo) return;
    window.electronAPI.gitGuiStageAll(activeRepo.path)
      .then(r => {
        if (r.success) LoadChanges();
        else Toast(`Stage All 失敗：${r.error}`, 'error');
      })
      .catch(e => Toast(e.message, 'error'));
  });

  unstageAllBtn.addEventListener('click', () => {
    if (!activeRepo) return;
    window.electronAPI.gitGuiUnstageAll(activeRepo.path)
      .then(r => {
        if (r.success) LoadChanges();
        else Toast(`Unstage All 失敗：${r.error}`, 'error');
      })
      .catch(e => Toast(e.message, 'error'));
  });

  commitBtn.addEventListener('click', () => {
    if (!activeRepo) return;
    const msg = commitMsgEl.value.trim();
    if (!msg) { Toast('請輸入 commit message', 'warning'); return; }
    window.electronAPI.gitGuiCommit(activeRepo.path, msg)
      .then(r => {
        if (r.success) {
          commitMsgEl.value = '';
          Toast('Commit 成功', 'success');
          LoadChanges();
          if (activeTab === 'log') LoadLog();
          // 更新分支資訊
          window.electronAPI.getRepoInfo(activeRepo.path)
            .then(info => {
              activeRepo.branch = info.branch || '?';
              toolbarBranchName.textContent = activeRepo.branch;
              SaveRepos();
              RenderRepoList();
            })
            .catch(() => { });
        } else {
          Toast(`Commit 失敗：${r.error}`, 'error');
        }
      })
      .catch(e => Toast(e.message, 'error'));
  });

  stashSaveBtn.addEventListener('click', () => {
    if (!activeRepo) return;
    window.electronAPI.gitGuiStashPush(activeRepo.path, '')
      .then(r => {
        if (r.success) { Toast('Stash 成功', 'success'); LoadChanges(); }
        else Toast(`Stash 失敗：${r.error}`, 'error');
      })
      .catch(e => Toast(e.message, 'error'));
  });
  //#endregion

  //#region Branch 管理

  function LoadBranches() {
    if (!activeRepo) return;
    branchesContentEl.innerHTML = '<div class="gg-loading"><div class="gg-spinner"></div></div>';

    window.electronAPI.gitGuiBranches(activeRepo.path)
      .then(data => {
        branchData = data;
        RenderBranches(data);
      })
      .catch(() => {
        branchesContentEl.innerHTML = '<div class="gg-empty"><p>載入失敗</p></div>';
      });
  }

  //#region Branch 渲染輔助

  /** 產生單一 branch item HTML */
  function BranchItemHtml(b, isRemote) {
    const icon = b.isCurrent
      ? '<span class="gg-branch-icon current">✓</span>'
      : isRemote
        ? '<span class="gg-branch-icon remote">☁</span>'
        : '<span class="gg-branch-icon">⎇</span>';
    const actions = isRemote
      ? `<button class="gg-branch-action-btn" data-action="checkout-remote" data-name="${EscHtml(b.name)}">建立本地</button>`
      : (!b.isCurrent
        ? `<button class="gg-branch-action-btn" data-action="checkout" data-name="${EscHtml(b.name)}">切換</button>
             <button class="gg-branch-action-btn danger" data-action="delete" data-name="${EscHtml(b.name)}">刪除</button>`
        : '');
    return `<div class="gg-branch-item${b.isCurrent ? ' current' : ''}" data-name="${EscHtml(b.name)}">
      ${icon}
      <span class="gg-branch-name" title="${EscHtml(b.name)}">${EscHtml(b.name)}</span>
      <span class="gg-branch-hash">${EscHtml(b.hash || '')}</span>
      <div class="gg-branch-actions">${actions}</div>
    </div>`;
  }

  /** 綁定 branch item 事件 */
  function BindBranchEvents(container) {
    container.querySelectorAll('[data-action="checkout"]').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); DoCheckout(btn.dataset.name); });
    });
    container.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); DoDeleteBranch(btn.dataset.name); });
    });
    container.querySelectorAll('[data-action="checkout-remote"]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const localName = btn.dataset.name.replace(/^[^/]+\//, '');
        DoCreateBranch(localName, btn.dataset.name);
      });
    });
  }

  /** 套用搜尋過濾 */
  function FilterBranches(list, keyword) {
    if (!keyword) return list;
    const kw = keyword.toLowerCase();
    return list.filter(b => b.name.toLowerCase().includes(kw));
  }

  /** 將分支列表轉成樹狀節點 */
  function BuildTree(branches) {
    const root = {};
    branches.forEach(b => {
      const parts = b.name.split('/');
      let node = root;
      parts.forEach((part, i) => {
        if (!node[part]) node[part] = { _children: {}, _branch: null };
        if (i === parts.length - 1) node[part]._branch = b;
        node = node[part]._children;
      });
    });
    return root;
  }

  /** 遞迴渲染樹狀節點 */
  function RenderTreeNode(node, depth, isRemote) {
    let html = '';
    Object.entries(node).forEach(([key, val]) => {
      const hasChildren = Object.keys(val._children).length > 0;
      const b = val._branch;
      if (hasChildren) {
        html += `<div class="gg-tree-group" style="--depth:${depth}">
          <div class="gg-tree-folder" data-folder="1">
            <span class="gg-tree-arrow">▶</span>
            <span class="gg-tree-folder-icon">📁</span>
            <span class="gg-tree-folder-name">${EscHtml(key)}</span>
          </div>
          <div class="gg-tree-children">
            ${b ? BranchItemHtml(b, isRemote) : ''}
            ${RenderTreeNode(val._children, depth + 1, isRemote)}
          </div>
        </div>`;
      } else if (b) {
        html += `<div style="--depth:${depth}" class="gg-tree-leaf">${BranchItemHtml(b, isRemote)}</div>`;
      }
    });
    return html;
  }

  /** 依前綴分群 */
  function GroupBranches(branches) {
    const groups = {};
    branches.forEach(b => {
      const slash = b.name.indexOf('/');
      const key = slash === -1 ? '（無前綴）' : b.name.substring(0, slash);
      if (!groups[key]) groups[key] = [];
      groups[key].push(b);
    });
    return groups;
  }

  //#endregion

  function RenderBranches(data) {
    const kw = branchFilter.trim().toLowerCase();
    const localFiltered = FilterBranches(data.local, kw);
    const remoteFiltered = FilterBranches(data.remote, kw);

    if (branchViewMode === 'flat') {
      RenderBranchesFlat(localFiltered, remoteFiltered);
    } else if (branchViewMode === 'tree') {
      RenderBranchesTree(localFiltered, remoteFiltered);
    } else {
      RenderBranchesGrouped(localFiltered, remoteFiltered);
    }
  }

  function RenderBranchesFlat(local, remote) {
    const localHtml = local.length === 0
      ? '<div class="gg-empty" style="padding:12px;font-size:11px;"><p>無本地分支</p></div>'
      : local.map(b => BranchItemHtml(b, false)).join('');
    const remoteHtml = remote.length === 0
      ? '<div class="gg-empty" style="padding:12px;font-size:11px;"><p>無遠端分支</p></div>'
      : remote.map(b => BranchItemHtml(b, true)).join('');
    branchesContentEl.innerHTML = `
      <div class="gg-branch-section">
        <div class="gg-branch-section-title">本地分支 <span class="gg-branch-count">${local.length}</span></div>
        <div>${localHtml}</div>
      </div>
      <div class="gg-branch-section">
        <div class="gg-branch-section-title">遠端分支 <span class="gg-branch-count">${remote.length}</span></div>
        <div>${remoteHtml}</div>
      </div>`;
    BindBranchEvents(branchesContentEl);
  }

  function RenderBranchesTree(local, remote) {
    const localTree = BuildTree(local);
    const remoteTree = BuildTree(remote);
    const localHtml = local.length === 0 ? '<div class="gg-empty" style="padding:12px;font-size:11px;"><p>無本地分支</p></div>' : RenderTreeNode(localTree, 0, false);
    const remoteHtml = remote.length === 0 ? '<div class="gg-empty" style="padding:12px;font-size:11px;"><p>無遠端分支</p></div>' : RenderTreeNode(remoteTree, 0, true);
    branchesContentEl.innerHTML = `
      <div class="gg-branch-section">
        <div class="gg-branch-section-title">本地分支 <span class="gg-branch-count">${local.length}</span></div>
        <div class="gg-tree-root">${localHtml}</div>
      </div>
      <div class="gg-branch-section">
        <div class="gg-branch-section-title">遠端分支 <span class="gg-branch-count">${remote.length}</span></div>
        <div class="gg-tree-root">${remoteHtml}</div>
      </div>`;
    BindBranchEvents(branchesContentEl);
    // 樹狀折疊切換
    branchesContentEl.querySelectorAll('.gg-tree-folder').forEach(folder => {
      folder.addEventListener('click', () => {
        const group = folder.closest('.gg-tree-group');
        group.classList.toggle('collapsed');
      });
    });
  }

  function RenderBranchesGrouped(local, remote) {
    const localGroups = GroupBranches(local);
    const remoteGroups = GroupBranches(remote);
    const renderGroups = (groups, isRemote) => {
      if (Object.keys(groups).length === 0) return '<div class="gg-empty" style="padding:12px;font-size:11px;"><p>無分支</p></div>';
      return Object.entries(groups).map(([prefix, branches]) => `
        <div class="gg-grouped-section">
          <div class="gg-grouped-header">
            <span class="gg-tree-arrow">▶</span>
            <span>${EscHtml(prefix)}</span>
            <span class="gg-branch-count">${branches.length}</span>
          </div>
          <div class="gg-grouped-items">
            ${branches.map(b => BranchItemHtml(b, isRemote)).join('')}
          </div>
        </div>`).join('');
    };
    branchesContentEl.innerHTML = `
      <div class="gg-branch-section">
        <div class="gg-branch-section-title">本地分支 <span class="gg-branch-count">${local.length}</span></div>
        <div>${renderGroups(localGroups, false)}</div>
      </div>
      <div class="gg-branch-section">
        <div class="gg-branch-section-title">遠端分支 <span class="gg-branch-count">${remote.length}</span></div>
        <div>${renderGroups(remoteGroups, true)}</div>
      </div>`;
    BindBranchEvents(branchesContentEl);
    branchesContentEl.querySelectorAll('.gg-grouped-header').forEach(h => {
      h.addEventListener('click', () => h.closest('.gg-grouped-section').classList.toggle('collapsed'));
    });
  }

  function DoCheckout(branchName) {
    if (!activeRepo) return;
    window.electronAPI.gitGuiCheckout(activeRepo.path, branchName)
      .then(r => {
        if (r.success) {
          Toast(`已切換至 ${branchName}`, 'success');
          activeRepo.branch = branchName;
          toolbarBranchName.textContent = branchName;
          SaveRepos();
          RenderRepoList();
          LoadBranches();
        } else {
          Toast(`切換失敗：${r.error}`, 'error');
        }
      })
      .catch(e => Toast(e.message, 'error'));
  }

  function DoDeleteBranch(branchName) {
    if (!activeRepo) return;
    window.electronAPI.gitGuiDeleteBranch(activeRepo.path, branchName, false)
      .then(r => {
        if (r.success) { Toast(`已刪除分支 ${branchName}`, 'success'); LoadBranches(); }
        else Toast(`刪除失敗：${r.error}`, 'error');
      })
      .catch(e => Toast(e.message, 'error'));
  }

  function DoCreateBranch(name, from) {
    if (!activeRepo) return;
    window.electronAPI.gitGuiCreateBranch(activeRepo.path, name, from)
      .then(r => {
        if (r.success) {
          Toast(`已建立並切換至 ${name}`, 'success');
          activeRepo.branch = name;
          toolbarBranchName.textContent = name;
          SaveRepos();
          RenderRepoList();
          LoadBranches();
        } else {
          Toast(`建立失敗：${r.error}`, 'error');
        }
      })
      .catch(e => Toast(e.message, 'error'));
  }

  //#region Branch 搜尋與檢視切換事件
  branchSearchEl.addEventListener('input', () => {
    branchFilter = branchSearchEl.value;
    branchSearchClearEl.classList.toggle('hidden', !branchFilter);
    RenderBranches(branchData);
  });

  branchSearchClearEl.addEventListener('click', () => {
    branchFilter = '';
    branchSearchEl.value = '';
    branchSearchClearEl.classList.add('hidden');
    RenderBranches(branchData);
  });

  document.querySelectorAll('.gg-view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      branchViewMode = btn.dataset.mode;
      document.querySelectorAll('.gg-view-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      RenderBranches(branchData);
    });
  });
  //#endregion

  //#region Log 篩選切換
  const logAllBtn = document.getElementById('gg-log-all-btn');
  const logCurrentBtn = document.getElementById('gg-log-current-btn');

  logAllBtn.addEventListener('click', () => {
    if (logShowAll) return;
    logShowAll = true;
    logAllBtn.classList.add('active');
    logCurrentBtn.classList.remove('active');
    LoadLog();
  });

  logCurrentBtn.addEventListener('click', () => {
    if (!logShowAll) return;
    logShowAll = false;
    logCurrentBtn.classList.add('active');
    logAllBtn.classList.remove('active');
    LoadLog();
  });
  //#endregion

  // New Branch Form
  newBranchBtn.addEventListener('click', () => {
    newBranchBtn.style.display = 'none';
    newBranchForm.style.display = 'flex';
    newBranchNameEl.focus();
  });

  cancelBranchBtn.addEventListener('click', () => {
    newBranchForm.style.display = 'none';
    newBranchBtn.style.display = '';
    newBranchNameEl.value = '';
  });

  createBranchBtn.addEventListener('click', () => {
    const name = newBranchNameEl.value.trim();
    if (!name) { Toast('請輸入分支名稱', 'warning'); return; }
    DoCreateBranch(name, 'HEAD');
    newBranchForm.style.display = 'none';
    newBranchBtn.style.display = '';
    newBranchNameEl.value = '';
  });

  newBranchNameEl.addEventListener('keydown', e => {
    if (e.key === 'Enter') createBranchBtn.click();
    if (e.key === 'Escape') cancelBranchBtn.click();
  });
  //#endregion

  //#region Stash

  function LoadStashes() {
    if (!activeRepo) return;
    stashListEl.innerHTML = '<div class="gg-loading"><div class="gg-spinner"></div></div>';
    window.electronAPI.gitGuiStashes(activeRepo.path)
      .then(stashes => {
        if (stashes.length === 0) {
          stashListEl.innerHTML = `<div class="gg-empty"><div class="gg-empty-icon">${LucideIcon('package', 32)}</div><p>無 Stash 記錄</p></div>`;
          return;
        }
        stashListEl.innerHTML = stashes.map(s => `
          <div class="gg-stash-item">
            <span class="gg-stash-ref">${EscHtml(s.ref)}</span>
            <span class="gg-stash-msg">${EscHtml(s.message)}</span>
            <span class="gg-stash-date">${s.date ? RelativeTime(s.date) : ''}</span>
            <div style="display:flex;gap:4px">
              <button class="gg-branch-action-btn" data-action="pop" data-ref="${EscHtml(s.ref)}">Pop</button>
              <button class="gg-branch-action-btn danger" data-action="drop" data-ref="${EscHtml(s.ref)}">Drop</button>
            </div>
          </div>
        `).join('');

        stashListEl.querySelectorAll('[data-action="pop"]').forEach(btn => {
          btn.addEventListener('click', () => {
            window.electronAPI.gitGuiStashPop(activeRepo.path, btn.dataset.ref)
              .then(r => {
                if (r.success) { Toast('Stash Pop 成功', 'success'); LoadStashes(); LoadChanges(); }
                else Toast(`Pop 失敗：${r.error}`, 'error');
              })
              .catch(e => Toast(e.message, 'error'));
          });
        });

        stashListEl.querySelectorAll('[data-action="drop"]').forEach(btn => {
          btn.addEventListener('click', () => {
            window.electronAPI.gitGuiStashDrop(activeRepo.path, btn.dataset.ref)
              .then(r => {
                if (r.success) { Toast('Stash Drop 成功', 'success'); LoadStashes(); }
                else Toast(`Drop 失敗：${r.error}`, 'error');
              })
              .catch(e => Toast(e.message, 'error'));
          });
        });
      })
      .catch(() => {
        stashListEl.innerHTML = '<div class="gg-empty"><p>載入失敗</p></div>';
      });
  }

  stashPushBtn.addEventListener('click', () => {
    if (!activeRepo) return;
    window.electronAPI.gitGuiStashPush(activeRepo.path, '')
      .then(r => {
        if (r.success) { Toast('Stash Push 成功', 'success'); LoadStashes(); LoadChanges(); }
        else Toast(`Stash 失敗：${r.error}`, 'error');
      })
      .catch(e => Toast(e.message, 'error'));
  });
  //#endregion

  //#region Tags

  function LoadTags() {
    if (!activeRepo) return;
    tagListEl.innerHTML = '<div class="gg-loading"><div class="gg-spinner"></div></div>';
    window.electronAPI.gitGuiTags(activeRepo.path)
      .then(tags => {
        if (tags.length === 0) {
          tagListEl.innerHTML = '<div class="gg-empty"><div class="gg-empty-icon">🏷</div><p>無 Tags</p></div>';
          return;
        }
        tagListEl.innerHTML = tags.map(t => `
          <div class="gg-tag-item">
            <span class="gg-tag-name">🏷 ${EscHtml(t.name)}</span>
            <span class="gg-tag-date">${EscHtml(t.date || '')}</span>
            <span class="gg-tag-msg">${EscHtml(t.message || '')}</span>
          </div>
        `).join('');
      })
      .catch(() => {
        tagListEl.innerHTML = '<div class="gg-empty"><p>載入失敗</p></div>';
      });
  }
  //#endregion

  // 初始載入
  LoadSavedRepos();
});
