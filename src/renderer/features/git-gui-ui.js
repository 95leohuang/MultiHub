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
  'more-vertical': '<circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>',
  'chevron-down': '<polyline points="6 9 12 15 18 9"/>',
  'chevron-right': '<polyline points="9 18 15 12 9 6"/>',
  'arrow-left': '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
  'arrow-right': '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
  'git-remote': '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
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

import { showToast } from '../toast.js';

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
  /** @type {{ local: object[], remote: object[], tags: object[], currentBranch: string }} */
  let branchData = null;
  /** @type {'flat'|'tree'|'grouped'} */
  let branchViewMode = 'tree';
  /** @type {string} */
  let branchFilter = '';
  /** @type {object[]} */
  let changeFiles = [];
  /** @type {{ name: string, fetchUrl: string, pushUrl: string }[]} */
  let remotesData = [];
  /** @type {{ hash: string, path: string, initialized: boolean, description: string }[]} */
  let submodulesData = [];
  /** @type {{ path: string, hash: string, branch: string }[]} */
  let worktreesData = [];
  /** @type {{ merging: boolean, rebasing: boolean, cherryPicking: boolean, reverting: boolean }} */
  let inProgressState = { merging: false, rebasing: false, cherryPicking: false, reverting: false };
  /** @type {boolean} Commit box 是否為 Amend 模式 */
  let amendMode = false;
  /** @type {boolean} 是否在 commit log 搜尋模式 */
  let logSearchMode = false;
  /** @type {boolean} 是否在 reflog 檢視模式 */
  let reflogMode = false;
  /** @type {boolean} watcher 是否已啟動 */
  let watcherActive = false;
  /** @type {boolean} 防止 watcher 觸發無限循環的 flag */
  let isRefreshing = false;
  //#endregion

  //#region DOM 骨架注入
  ui.innerHTML = `
    <div class="gg-sidebar" id="gg-sidebar">
      <div class="gg-sidebar-header">
        <span class="gg-sidebar-title">Repositories</span>
        <div style="display:flex;gap:2px;align-items:center">
          <button class="gg-icon-btn" id="gg-open-folder-btn" title="開啟資料夾搜尋">${LucideIcon('plus', 13)}</button>
          <button class="gg-icon-btn" id="gg-sidebar-collapse-btn" title="收縮側邊欄">${LucideIcon('arrow-left', 13)}</button>
        </div>
      </div>
      <!-- 收縮時顯示的 icon 欄 -->
      <div class="gg-sidebar-collapsed-icon" title="展開 Repositories">
        ${LucideIcon('package', 16)}
      </div>
      <div class="gg-sidebar-body">
        <div class="gg-repo-search">
          <input type="text" id="gg-repo-filter" placeholder="篩選 repo..." />
        </div>
        <div class="gg-repo-list" id="gg-repo-list"></div>
        <div class="gg-sidebar-add">
          <button class="gg-add-btn" id="gg-add-repo-btn">${LucideIcon('plus', 13)} 新增 Repository</button>
        </div>
      </div>
    </div>
    <!-- Repo sidebar resize 分隔線 -->
    <div class="gg-sidebar-resizer" id="gg-sidebar-resizer"></div>

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
        <button class="gg-icon-btn" id="gg-btn-clean" title="Clean / GC">${LucideIcon('trash', 14)}</button>
        <button class="gg-icon-btn" id="gg-btn-config" title="Git Config">${LucideIcon('settings', 14)}</button>
        <button class="gg-toolbar-btn" id="gg-btn-refresh">${LucideIcon('refresh-cw', 13)} 重新整理</button>
      </div>

      <!-- Tab 列 -->
      <div class="gg-tabs">
        <div class="gg-tab active" data-tab="log">Commits</div>
        <div class="gg-tab" data-tab="changes">Changes <span class="gg-tab-badge hidden" id="gg-changes-badge">0</span></div>
        <div class="gg-tab" data-tab="stash">Stashes</div>
        <div class="gg-tab" data-tab="tags">Tags</div>
        <div class="gg-tab" data-tab="remotes">Remotes</div>
        <div class="gg-tab" data-tab="submodules">Submodules</div>
        <div class="gg-tab" data-tab="worktrees">Worktrees</div>
      </div>

      <!-- In-Progress Banner（Merge/Rebase/CherryPick/Revert 進行中時顯示）-->
      <div class="gg-in-progress-banner hidden" id="gg-in-progress-banner">
        <span id="gg-in-progress-label"></span>
        <div class="gg-in-progress-actions" id="gg-in-progress-actions"></div>
      </div>

      <!-- === Commit Log 面板 === -->
      <div class="gg-panel active" id="gg-panel-log">
        <!-- Branch 側邊欄 -->
        <div class="gg-log-branch-sidebar" id="gg-log-branch-sidebar">
          <!-- 頂部搜尋 -->
          <div class="gg-lbs-search">
            ${LucideIcon('search', 12, 'gg-lbs-search-icon')}
            <input type="text" id="gg-lbs-filter" placeholder="Search Branches/Tags..." />
          </div>
          <!-- Local Branches -->
          <div class="gg-lbs-group" id="gg-lbs-group-local">
            <div class="gg-lbs-group-header" data-group="local">
              <span class="gg-lbs-chevron" id="gg-lbs-chevron-local">${LucideIcon('chevron-down', 11)}</span>
              ${LucideIcon('git-branch', 11)}
              <span class="gg-lbs-group-label">LOCAL BRANCHES</span>
              <span class="gg-lbs-count" id="gg-lbs-local-count">0</span>
              <button class="gg-icon-btn gg-lbs-action" id="gg-lbs-new-branch" title="New Branch" style="margin-left:auto">${LucideIcon('plus', 11)}</button>
            </div>
            <div class="gg-lbs-group-body" id="gg-lbs-local-list"></div>
          </div>
          <!-- Remote Branches -->
          <div class="gg-lbs-group" id="gg-lbs-group-remote">
            <div class="gg-lbs-group-header" data-group="remote">
              <span class="gg-lbs-chevron" id="gg-lbs-chevron-remote">${LucideIcon('chevron-down', 11)}</span>
              ${LucideIcon('arrow-up-right', 11)}
              <span class="gg-lbs-group-label">REMOTES</span>
              <span class="gg-lbs-count" id="gg-lbs-remote-count">0</span>
            </div>
            <div class="gg-lbs-group-body" id="gg-lbs-remote-list"></div>
          </div>
          <!-- Tags -->
          <div class="gg-lbs-group" id="gg-lbs-group-tags">
            <div class="gg-lbs-group-header" data-group="tags">
              <span class="gg-lbs-chevron" id="gg-lbs-chevron-tags">${LucideIcon('chevron-right', 11)}</span>
              ${LucideIcon('tag', 11)}
              <span class="gg-lbs-group-label">TAGS</span>
              <span class="gg-lbs-count" id="gg-lbs-tags-count">0</span>
            </div>
            <div class="gg-lbs-group-body collapsed" id="gg-lbs-tags-list"></div>
          </div>
        </div>
        <!-- Branch sidebar resize 分隔線 -->
        <div class="gg-log-branch-resizer" id="gg-log-branch-resizer"></div>
        <!-- 右側：Commit Log -->
        <div class="gg-log-layout" id="gg-log-layout">

          <!-- 上半：Commit Table -->
          <div class="gg-log-top">
            <!-- 篩選列 + 表頭 -->
            <div class="gg-log-header">
              <div class="gg-log-toolbar">
                <button class="gg-log-filter-btn active" id="gg-log-all-btn">All Branches</button>
                <button class="gg-log-filter-btn" id="gg-log-current-btn">${LucideIcon('git-branch', 12)} Current</button>
                <div class="gg-toolbar-spacer"></div>
                <button class="gg-icon-btn" id="gg-log-search-btn" title="搜尋 Commits">${LucideIcon('search', 13)}</button>
              </div>
              <!-- Reflog / Bisect 切換 -->
              <div class="gg-reflog-toggle">
                <button class="gg-toolbar-btn" id="gg-reflog-btn" title="切換至 Reflog 檢視">${LucideIcon('history', 13)} Reflog</button>
                <button class="gg-toolbar-btn" id="gg-bisect-btn" title="Git Bisect 二分法除錯">${LucideIcon('scissors', 13)} Bisect</button>
              </div>

              <!-- Commit Log 搜尋欄 -->
              <div class="gg-log-search-bar hidden" id="gg-log-search-bar">
                <select id="gg-log-search-field" class="gg-search-field-select">
                  <option value="message">Message</option>
                  <option value="author">Author</option>
                </select>
                <input type="text" id="gg-log-search-input" placeholder="搜尋關鍵字..." class="gg-log-search-input"/>
                <button class="gg-icon-btn" id="gg-log-search-clear" title="關閉搜尋">${LucideIcon('x', 12)}</button>
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

          <!-- 左側：Unstaged + Staged + 搜尋 -->
          <div class="gg-changes-left" id="gg-changes-left">
            <!-- 搜尋欄 -->
            <div class="gg-changes-search-bar">
              ${LucideIcon('search', 12, 'gg-search-icon')}
              <input type="text" id="gg-changes-filter" placeholder="檢索檔案..." />
            </div>

            <!-- LFS 工具列 -->
            <div class="gg-lfs-toolbar">
              <button class="gg-toolbar-btn" id="gg-lfs-pull-btn" title="LFS Pull">${LucideIcon('download', 12)} LFS Pull</button>
              <button class="gg-toolbar-btn" id="gg-lfs-push-btn" title="LFS Push">${LucideIcon('upload', 12)} LFS Push</button>
              <button class="gg-toolbar-btn" id="gg-lfs-locks-btn" title="LFS Locks">${LucideIcon('lock', 12)} Locks</button>
            </div>

            <!-- Unstaged -->
            <div class="gg-changes-section" id="gg-section-unstaged">
              <div class="gg-changes-section-header">
                <span class="gg-section-icon">${LucideIcon('file-text', 12)}</span>
                <span>UNSTAGED</span>
                <span class="gg-section-count" id="gg-unstaged-count">0</span>
                <div class="gg-section-actions" style="margin-left:auto">
                  <button class="gg-icon-btn gg-view-mode-btn active" data-section="unstaged" data-mode="list" title="Path List">${LucideIcon('list', 12)}</button>
                  <button class="gg-icon-btn gg-view-mode-btn" data-section="unstaged" data-mode="tree" title="Dir Tree">${LucideIcon('folder', 12)}</button>
                  <button class="gg-icon-btn" id="gg-stage-all-btn" title="Stage All">${LucideIcon('arrow-down', 13)}</button>
                </div>
              </div>
              <div class="gg-changes-list" id="gg-unstaged-list"></div>
            </div>

            <!-- 分割線 -->
            <div class="gg-changes-splitter" id="gg-changes-splitter"></div>

            <!-- Staged -->
            <div class="gg-changes-section" id="gg-section-staged">
              <div class="gg-changes-section-header">
                <span class="gg-section-icon">${LucideIcon('check-circle', 12)}</span>
                <span>STAGED</span>
                <span class="gg-section-count" id="gg-staged-count">0</span>
                <div class="gg-section-actions" style="margin-left:auto">
                  <button class="gg-icon-btn gg-view-mode-btn active" data-section="staged" data-mode="list" title="Path List">${LucideIcon('list', 12)}</button>
                  <button class="gg-icon-btn gg-view-mode-btn" data-section="staged" data-mode="tree" title="Dir Tree">${LucideIcon('folder', 12)}</button>
                  <button class="gg-icon-btn" id="gg-unstage-all-btn" title="Unstage All">${LucideIcon('arrow-up', 13)}</button>
                </div>
              </div>
              <div class="gg-changes-list" id="gg-staged-list"></div>
            </div>
          </div>

          <!-- 左右 resizer -->
          <div class="gg-changes-resizer" id="gg-changes-resizer"></div>

          <!-- 右側：Diff + Commit Box -->
          <div class="gg-changes-right" id="gg-changes-right">
            <!-- Diff 預覽 -->
            <div class="gg-changes-diff-area">
              <div class="gg-diff-view" id="gg-changes-diff">
                <div class="gg-diff-placeholder">
                  <div class="gg-empty"><div class="gg-empty-icon">${LucideIcon('file-text', 32)}</div><p>點擊檔案查看 diff</p></div>
                </div>
              </div>
            </div>
            <!-- Commit Message + 按鈕 -->
            <div class="gg-commit-box">
              <textarea class="gg-commit-textarea" id="gg-commit-msg" placeholder="輸入 commit message（Ctrl+Enter 提交）..."></textarea>
              <div class="gg-commit-actions">
                <button class="gg-toolbar-btn primary" id="gg-commit-btn" style="flex:1">${LucideIcon('check', 13)} Commit</button>
                <button class="gg-toolbar-btn" id="gg-stash-save-btn" title="Stash 所有變更">${LucideIcon('package', 13)} Stash</button>
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
              <button class="gg-search-clear hidden" id="gg-branch-search-clear" title="清除">${LucideIcon('x', 12)}</button>
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

          <!-- 左側：Stash 列表 + Changes 列表 -->
          <div class="gg-stash-left">
            <!-- Stash 列表區 -->
            <div class="gg-stash-top">
              <div class="gg-stash-section-header">
                <span>${LucideIcon('layers', 13)} Stashes</span>
                <span class="gg-section-count" id="gg-stash-count">0</span>
                <div class="gg-section-actions">
                  <button class="gg-toolbar-btn primary" id="gg-stash-push-btn" style="padding:2px 8px;font-size:11px">${LucideIcon('plus', 12)} New</button>
                  <button class="gg-icon-btn" id="gg-stash-clear-btn" title="Clear All" style="margin-left:4px">${LucideIcon('trash-2', 13)}</button>
                </div>
              </div>
              <!-- 搜尋 -->
              <div class="gg-changes-search-bar">
                ${LucideIcon('search', 12, 'gg-search-icon')}
                <input type="text" id="gg-stash-filter" placeholder="搜尋 Stash..." />
              </div>
              <div class="gg-stash-list" id="gg-stash-list">
                <div class="gg-empty"><div class="gg-empty-icon">${LucideIcon('package', 28)}</div><p>無 Stash 記錄</p></div>
              </div>
            </div>
            <!-- 分割線 -->
            <div class="gg-changes-splitter" id="gg-stash-splitter"></div>
            <!-- 選中 Stash 的 Changes -->
            <div class="gg-stash-bottom">
              <div class="gg-stash-section-header">
                <span>${LucideIcon('file-text', 13)} Changes</span>
                <span class="gg-section-count" id="gg-stash-changes-count">0</span>
              </div>
              <div class="gg-changes-list" id="gg-stash-changes-list">
                <div class="gg-empty" style="padding:12px;font-size:11px"><p>選擇左側 Stash 查看變更</p></div>
              </div>
            </div>
          </div>

          <!-- 右側：Diff 預覽 -->
          <div class="gg-stash-right">
            <div class="gg-diff-view" id="gg-stash-diff">
              <div class="gg-diff-placeholder">
                <div class="gg-empty"><div class="gg-empty-icon">${LucideIcon('file-text', 32)}</div><p>點擊左側檔案查看 diff</p></div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- === Tags 面板 === -->
      <div class="gg-panel" id="gg-panel-tags">
        <div class="gg-tag-toolbar">
          <button class="gg-toolbar-btn primary" id="gg-create-tag-btn">${LucideIcon('plus', 13)} New Tag</button>
          <button class="gg-toolbar-btn" id="gg-push-all-tags-btn" title="Push All Tags to origin">${LucideIcon('arrow-up-right', 13)} Push All</button>
        </div>
        <div class="gg-tag-list" id="gg-tag-list">
          <div class="gg-empty"><div class="gg-empty-icon">${LucideIcon('tag', 32)}</div><p>無 Tags</p></div>
        </div>
      </div>

      <!-- === Remotes 面板 === -->
      <div class="gg-panel" id="gg-panel-remotes">
        <div class="gg-remotes-toolbar">
          <button class="gg-toolbar-btn primary" id="gg-add-remote-btn">${LucideIcon('plus', 13)} Add Remote</button>
        </div>
        <div class="gg-remotes-list" id="gg-remotes-list">
          <div class="gg-empty"><div class="gg-empty-icon">${LucideIcon('git-remote', 32)}</div><p>無 Remotes</p></div>
        </div>
      </div>

      <!-- === Submodules 面板 === -->
      <div class="gg-panel" id="gg-panel-submodules">
        <div class="gg-submodules-toolbar">
          <button class="gg-toolbar-btn" id="gg-submodule-update-all-btn">${LucideIcon('download', 13)} Update All</button>
          <button class="gg-toolbar-btn" id="gg-submodule-sync-all-btn">${LucideIcon('sync', 13)} Sync All</button>
        </div>
        <div class="gg-submodules-list" id="gg-submodules-list">
          <div class="gg-empty"><div class="gg-empty-icon">${LucideIcon('package', 32)}</div><p>無 Submodules</p></div>
        </div>
      </div>

      <!-- === Worktrees 面板 === -->
      <div class="gg-panel" id="gg-panel-worktrees">
        <div class="gg-worktrees-toolbar">
          <button class="gg-toolbar-btn primary" id="gg-worktree-add-btn">${LucideIcon('plus', 13)} Add Worktree</button>
          <button class="gg-toolbar-btn" id="gg-worktree-prune-btn">${LucideIcon('trash', 13)} Prune</button>
        </div>
        <div class="gg-worktrees-list" id="gg-worktrees-list">
          <div class="gg-empty"><div class="gg-empty-icon">${LucideIcon('layout', 32)}</div><p>無 Worktrees</p></div>
        </div>
      </div>
    </div>

    <!-- ===== 通用 Modal 彈窗 ===== -->
    <div class="gg-modal-overlay hidden" id="gg-modal-overlay">
      <div class="gg-modal" id="gg-modal">
        <div class="gg-modal-header">
          <span class="gg-modal-title" id="gg-modal-title">操作</span>
          <button class="gg-icon-btn" id="gg-modal-close">${LucideIcon('x', 14)}</button>
        </div>
        <div class="gg-modal-body" id="gg-modal-body"></div>
        <div class="gg-modal-footer" id="gg-modal-footer">
          <button class="gg-toolbar-btn" id="gg-modal-cancel">取消</button>
          <button class="gg-toolbar-btn primary" id="gg-modal-confirm">確認</button>
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
  const btnConfig = document.getElementById('gg-btn-config');
  const btnClean = document.getElementById('gg-btn-clean');
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
  const changesFilterEl = document.getElementById('gg-changes-filter');
  // LFS
  const lfsPullBtn = document.getElementById('gg-lfs-pull-btn');
  const lfsPushBtn = document.getElementById('gg-lfs-push-btn');
  const lfsLocksBtn = document.getElementById('gg-lfs-locks-btn');
  // Stash
  const stashListEl = document.getElementById('gg-stash-list');
  const stashFilterEl = document.getElementById('gg-stash-filter');
  const stashCountEl = document.getElementById('gg-stash-count');
  const stashChangesListEl = document.getElementById('gg-stash-changes-list');
  const stashChangesCountEl = document.getElementById('gg-stash-changes-count');
  const stashDiffEl = document.getElementById('gg-stash-diff');
  const stashClearBtn = document.getElementById('gg-stash-clear-btn');
  const branchesContentEl = document.getElementById('gg-branches-content');
  const branchSearchEl = document.getElementById('gg-branch-search');
  const branchSearchClearEl = document.getElementById('gg-branch-search-clear');
  const newBranchBtn = document.getElementById('gg-new-branch-btn');
  const newBranchForm = document.getElementById('gg-new-branch-form');
  const newBranchNameEl = document.getElementById('gg-new-branch-name');
  const createBranchBtn = document.getElementById('gg-create-branch-btn');
  const cancelBranchBtn = document.getElementById('gg-cancel-branch-btn');
  const stashPushBtn = document.getElementById('gg-stash-push-btn');
  const tagListEl = document.getElementById('gg-tag-list');
  // Repo sidebar
  const sidebarEl = document.getElementById('gg-sidebar');
  const sidebarCollapseBtn = document.getElementById('gg-sidebar-collapse-btn');
  const sidebarResizerEl = document.getElementById('gg-sidebar-resizer');
  // Log Branch sidebar
  const lbsLocalList = document.getElementById('gg-lbs-local-list');
  const lbsRemoteList = document.getElementById('gg-lbs-remote-list');
  const lbsTagsList = document.getElementById('gg-lbs-tags-list');
  const lbsFilterEl = document.getElementById('gg-lbs-filter');
  const lbsLocalCount = document.getElementById('gg-lbs-local-count');
  const lbsRemoteCount = document.getElementById('gg-lbs-remote-count');
  const lbsTagsCount = document.getElementById('gg-lbs-tags-count');
  const lbsNewBranchBtn = document.getElementById('gg-lbs-new-branch');
  const logBranchResizerEl = document.getElementById('gg-log-branch-resizer');
  // 搜尋
  const logSearchBtn = document.getElementById('gg-log-search-btn');
  const logSearchBar = document.getElementById('gg-log-search-bar');
  const reflogBtn = document.getElementById('gg-reflog-btn');
  const bisectBtn = document.getElementById('gg-bisect-btn');
  const logSearchInput = document.getElementById('gg-log-search-input');
  const logSearchField = document.getElementById('gg-log-search-field');
  const logSearchClear = document.getElementById('gg-log-search-clear');
  // Tags 工具列
  const createTagBtn = document.getElementById('gg-create-tag-btn');
  const pushAllTagsBtn = document.getElementById('gg-push-all-tags-btn');
  // Remotes
  const remotesListEl = document.getElementById('gg-remotes-list');
  const addRemoteBtn = document.getElementById('gg-add-remote-btn');
  // Submodules
  const submodulesListEl = document.getElementById('gg-submodules-list');
  const submoduleUpdateAllBtn = document.getElementById('gg-submodule-update-all-btn');
  const submoduleSyncAllBtn = document.getElementById('gg-submodule-sync-all-btn');
  // Worktrees
  const worktreesListEl = document.getElementById('gg-worktrees-list');
  const worktreeAddBtn = document.getElementById('gg-worktree-add-btn');
  const worktreePruneBtn = document.getElementById('gg-worktree-prune-btn');
  // In-Progress Banner
  const inProgressBanner = document.getElementById('gg-in-progress-banner');
  const inProgressLabel = document.getElementById('gg-in-progress-label');
  const inProgressActions = document.getElementById('gg-in-progress-actions');
  // Modal
  const modalOverlay = document.getElementById('gg-modal-overlay');
  const modalTitle = document.getElementById('gg-modal-title');
  const modalBody = document.getElementById('gg-modal-body');
  const modalConfirm = document.getElementById('gg-modal-confirm');
  const modalCancel = document.getElementById('gg-modal-cancel');
  const modalClose = document.getElementById('gg-modal-close');
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

  //#region 通用 Modal 系統

  /** @type {Function|null} 目前 modal 的確認回調 */
  let _modalConfirmCb = null;

  /**
   * 顯示通用 Modal
   * @param {{ title: string, body: string, confirmText?: string, cancelText?: string, onConfirm: Function, danger?: boolean }} opts
   */
  function ShowModal(opts) {
    modalTitle.textContent = opts.title || '操作';
    modalBody.innerHTML = opts.body || '';
    modalConfirm.textContent = opts.confirmText || '確認';
    modalCancel.textContent = opts.cancelText || '取消';
    modalConfirm.className = `gg-toolbar-btn${opts.danger ? ' danger' : ' primary'}`;
    _modalConfirmCb = opts.onConfirm || null;
    modalOverlay.classList.remove('hidden');
    // 自動 focus 第一個 input
    setTimeout(() => {
      const first = modalBody.querySelector('input, select, textarea');
      if (first) first.focus();
    }, 50);
  }

  function CloseModal() {
    modalOverlay.classList.add('hidden');
    _modalConfirmCb = null;
  }

  modalConfirm.addEventListener('click', () => {
    if (_modalConfirmCb) _modalConfirmCb();
  });
  modalCancel.addEventListener('click', CloseModal);
  modalClose.addEventListener('click', CloseModal);
  modalOverlay.addEventListener('click', e => {
    if (e.target === modalOverlay) CloseModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !modalOverlay.classList.contains('hidden')) CloseModal();
  });
  //#endregion

  //#region In-Progress Banner（Merge / Rebase / Cherry-pick / Revert）

  function CheckInProgress() {
    if (!activeRepo) return;
    window.electronAPI.gitGuiInProgress(activeRepo.path)
      .then(state => {
        inProgressState = state;
        RenderInProgressBanner();
      })
      .catch(() => { });
  }

  function RenderInProgressBanner() {
    const { merging, rebasing, cherryPicking, reverting } = inProgressState;
    const active = merging || rebasing || cherryPicking || reverting;
    inProgressBanner.classList.toggle('hidden', !active);
    if (!active) return;

    if (merging) {
      inProgressLabel.textContent = '⚠ Merge 進行中，請解決衝突後提交。';
      inProgressActions.innerHTML = `
        <button class="gg-toolbar-btn danger" id="gg-ipb-abort">Abort Merge</button>
      `;
      document.getElementById('gg-ipb-abort')?.addEventListener('click', () => {
        window.electronAPI.gitGuiAbortMerge(activeRepo.path)
          .then(r => { if (r.success) { Toast('Merge 已中止', 'success'); RefreshAll(); } else Toast(r.error, 'error'); });
      });
    } else if (rebasing) {
      inProgressLabel.textContent = '⚠ Rebase 進行中，請解決衝突後繼續。';
      inProgressActions.innerHTML = `
        <button class="gg-toolbar-btn primary" id="gg-ipb-continue">Continue</button>
        <button class="gg-toolbar-btn danger" id="gg-ipb-abort">Abort Rebase</button>
      `;
      document.getElementById('gg-ipb-continue')?.addEventListener('click', () => {
        window.electronAPI.gitGuiRebaseContinue(activeRepo.path)
          .then(r => { if (r.success) { Toast('Rebase Continue 成功', 'success'); RefreshAll(); } else Toast(r.error, 'error'); });
      });
      document.getElementById('gg-ipb-abort')?.addEventListener('click', () => {
        window.electronAPI.gitGuiRebaseAbort(activeRepo.path)
          .then(r => { if (r.success) { Toast('Rebase 已中止', 'success'); RefreshAll(); } else Toast(r.error, 'error'); });
      });
    } else if (cherryPicking) {
      inProgressLabel.textContent = '⚠ Cherry-pick 進行中，請解決衝突後提交。';
      inProgressActions.innerHTML = `
        <button class="gg-toolbar-btn danger" id="gg-ipb-abort">Abort Cherry-pick</button>
      `;
      document.getElementById('gg-ipb-abort')?.addEventListener('click', () => {
        window.electronAPI.gitGuiCherryPickAbort(activeRepo.path)
          .then(r => { if (r.success) { Toast('Cherry-pick 已中止', 'success'); RefreshAll(); } else Toast(r.error, 'error'); });
      });
    } else if (reverting) {
      inProgressLabel.textContent = '⚠ Revert 進行中，請解決衝突後提交。';
      inProgressActions.innerHTML = '';
    }
  }

  /** 完整刷新所有面板 */
  function RefreshAll() {
    if (isRefreshing) return;
    isRefreshing = true;
    CheckInProgress();
    RefreshActiveTab();
    branchData = null;
    window.electronAPI.getRepoInfo(activeRepo.path)
      .then(info => {
        activeRepo.branch = info.branch || '?';
        activeRepo.isDirty = info.isDirty || false;
        toolbarBranchName.textContent = activeRepo.branch;
        SaveRepos();
        RenderRepoList();
      })
      .catch(() => { })
      .finally(() => { setTimeout(() => { isRefreshing = false; }, 3000); });
  }
  //#endregion

  //#region Watcher（Git 目錄監聽 → 自動 Refresh）

  function StartWatcher(repoPath) {
    if (watcherActive) return;
    window.electronAPI.gitGuiWatchStart(repoPath)
      .then(r => {
        if (r.success) {
          watcherActive = true;
        }
      })
      .catch(() => { });
  }

  function StopWatcher(repoPath) {
    if (!watcherActive) return;
    window.electronAPI.gitGuiWatchStop(repoPath).catch(() => { });
    watcherActive = false;
  }

  // 監聽 main process 推送的 repo-changed 事件
  window.electronAPI.onGitGuiRepoChanged((changedPath) => {
    if (activeRepo && activeRepo.path === changedPath && !isRefreshing) {
      RefreshAll();
    }
  });
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
           data-path="${EscHtml(r.path)}">
        <span class="gg-repo-icon">${LucideIcon('folder', 14)}</span>
        <div class="gg-repo-info">
          <div class="gg-repo-name">${EscHtml(r.name)}</div>
          <div class="gg-repo-branch">${LucideIcon('git-branch', 10)} ${EscHtml(r.branch || '...')}</div>
        </div>
        <span class="gg-repo-dirty-dot"></span>
        <button class="gg-repo-menu-btn" data-path="${EscHtml(r.path)}" title="操作">${LucideIcon('more-vertical', 14)}</button>
      </div>
    `).join('');

    repoListEl.querySelectorAll('.gg-repo-item').forEach(el => {
      el.addEventListener('click', e => {
        if (e.target.closest('.gg-repo-menu-btn')) return;
        const p = el.dataset.path;
        const repo = repos.find(r => r.path === p);
        if (repo) SelectRepo(repo);
      });
    });

    repoListEl.querySelectorAll('.gg-repo-menu-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        ShowRepoContextMenu(btn, btn.dataset.path);
      });
    });
  }

  function ShowRepoContextMenu(anchor, repoPath) {
    document.querySelector('.gg-repo-ctx-menu')?.remove();
    const menu = document.createElement('div');
    menu.className = 'gg-repo-ctx-menu';
    menu.innerHTML = `
      <button class="gg-ctx-item" data-action="remove">${LucideIcon('x', 13)} 從列表移除</button>
    `;
    document.body.appendChild(menu);
    const rect = anchor.getBoundingClientRect();
    menu.style.top = `${rect.bottom + 4}px`;
    menu.style.left = `${rect.left}px`;

    menu.querySelector('[data-action="remove"]').addEventListener('click', () => {
      repos = repos.filter(r => r.path !== repoPath);
      SaveRepos();
      if (activeRepo && activeRepo.path === repoPath) {
        activeRepo = repos.length > 0 ? repos[0] : null;
        if (activeRepo) SelectRepo(activeRepo);
        else {
          toolbarRepoName.textContent = '—';
          toolbarBranchName.textContent = '—';
        }
      }
      RenderRepoList();
      menu.remove();
    });

    const close = e => { if (!menu.contains(e.target)) { menu.remove(); document.removeEventListener('mousedown', close); } };
    setTimeout(() => document.addEventListener('mousedown', close), 0);
  }

  function SelectRepo(repo) {
    if (activeRepo && activeRepo.path !== repo.path) StopWatcher(activeRepo.path);
    ClearRepoState();
    activeRepo = repo;
    toolbarRepoName.textContent = repo.name;
    toolbarBranchName.textContent = repo.branch || '...';
    RenderRepoList();
    StartWatcher(repo.path);
    CheckInProgress();
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
    if (tab === 'remotes') LoadRemotes();
    if (tab === 'submodules') LoadSubmodules();
    if (tab === 'worktrees') LoadWorktrees();
  }

  function ClearRepoState() {
    branchData = null;
    activeCommitHash = null;
    activeCommitFiles = [];
    changeFiles = [];
    remotesData = [];
    submodulesData = [];
    worktreesData = [];
    inProgressState = { merging: false, rebasing: false, cherryPicking: false, reverting: false };
    amendMode = false;
    logSearchMode = false;
    reflogMode = false;
    isRefreshing = false;
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
    ShowPullOptionsModal();
  });

  btnPush.addEventListener('click', () => {
    if (!activeRepo) return;
    ShowPushOptionsModal();
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

  if (btnConfig) {
    btnConfig.addEventListener('click', () => {
      if (!activeRepo) return;
      ShowConfigModal();
    });
  }

  if (btnClean) {
    btnClean.addEventListener('click', () => {
      if (!activeRepo) return;
      ShowCleanModal();
    });
  }
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

    // 同步更新 Branch sidebar（若 branchData 已有就直接 re-render，否則發一次請求）
    if (branchData) {
      RenderLogBranchSidebar(branchData);
    } else {
      window.electronAPI.gitGuiBranches(activeRepo.path)
        .then(data => {
          if (!data.currentBranch && data.current) data.currentBranch = data.current;
          branchData = data;
          RenderLogBranchSidebar(data);
        });
    }
  }

  function LoadReflog() {
    if (!activeRepo) return;
    SetLoading(logListEl);
    logDetailEl.innerHTML = `<div class="gg-diff-placeholder"><div class="gg-empty"><div class="gg-empty-icon">${LucideIcon('search', 32)}</div><p>點擊上方 Reflog 項目查看詳情</p></div></div>`;

    window.electronAPI.gitGuiReflog(activeRepo.path, 50)
      .then(entries => {
        if (entries.length === 0) {
          logListEl.innerHTML = `<div class="gg-empty"><div class="gg-empty-icon">${LucideIcon('history', 32)}</div><p>無 Reflog 記錄</p></div>`;
          return;
        }
        RenderReflogList(entries);
      })
      .catch(() => {
        logListEl.innerHTML = '<div class="gg-empty"><p>載入失敗</p></div>';
      });
  }

  function RenderReflogList(entries) {
    logListEl.innerHTML = entries.map((entry, i) => `
      <div class="gg-commit-item ${activeCommitHash === entry.hash ? 'active' : ''}" data-hash="${entry.hash}" data-short-hash="${entry.shortHash}" data-idx="${i}" data-reflog="true">
        <div class="gg-log-graph-subject">
          <div class="gg-log-subject">
            <span class="gg-log-hash">${EscHtml(entry.shortHash)}</span>
            <span class="gg-log-message">${EscHtml(entry.subject)}</span>
          </div>
        </div>
        <div class="gg-log-author">${EscHtml(entry.ref)}</div>
      </div>
    `).join('');

    logListEl.querySelectorAll('.gg-commit-item').forEach(el => {
      el.addEventListener('click', () => {
        const hash = el.dataset.hash;
        activeCommitHash = hash;
        logListEl.querySelectorAll('.gg-commit-item').forEach(e => e.classList.remove('active'));
        el.classList.add('active');
        LoadCommitDetail(hash, true); // true 表示是 reflog 項目
      });

      // Reflog 右鍵選單：Reset 功能
      el.addEventListener('contextmenu', e => {
        e.preventDefault();
        const hash = el.dataset.hash;
        const subject = el.querySelector('.gg-log-message')?.textContent || '';
        ShowReflogContextMenu(e, hash, subject);
      });
    });
  }

  function ShowReflogContextMenu(e, refHash, subject) {
    const menu = document.createElement('div');
    menu.className = 'gg-context-menu';
    menu.style.left = `${e.clientX}px`;
    menu.style.top = `${e.clientY}px`;

    const items = [
      { label: `${LucideIcon('refresh-ccw', 12)} Reset (Soft)`, action: 'reset-soft' },
      { label: `${LucideIcon('refresh-ccw', 12)} Reset (Mixed)`, action: 'reset-mixed' },
      { label: `${LucideIcon('refresh-ccw', 12)} Reset (Hard)`, action: 'reset-hard' },
    ];

    menu.innerHTML = items.map(item =>
      `<div class="gg-context-item" data-action="${item.action}">${item.label}</div>`
    ).join('');

    document.body.appendChild(menu);
    const close = ev => { if (!menu.contains(ev.target)) { menu.remove(); document.removeEventListener('mousedown', close); } };
    setTimeout(() => document.addEventListener('mousedown', close), 0);

    menu.addEventListener('click', ev => {
      const action = ev.target.closest('[data-action]')?.dataset.action;
      if (!action || !activeRepo) return;
      menu.remove();

      let mode = 'mixed';
      if (action === 'reset-soft') mode = 'soft';
      else if (action === 'reset-hard') mode = 'hard';

      if (confirm(`確定要 Reset 到 "${subject}"？(${mode} 模式)`)) {
        Toast(`Resetting (${mode})...`, 'info');
        window.electronAPI.gitGuiResetToReflog(activeRepo.path, refHash, mode)
          .then(r => {
            if (r.success) {
              Toast(`Reset (${mode}) 完成`, 'success');
              RefreshAll();
            } else Toast(r.error, 'error');
          });
      }
    });
  }

  //#endregion

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

      return `<div class="gg-commit-item ${activeCommitHash === c.hash ? 'active' : ''}" data-hash="${c.hash}" data-short-hash="${c.shortHash}" data-idx="${i}">
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
    InitLogContextMenu();
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
      .then(diff => {
        const hasDiffContent = diff && /^[+\-@]/m.test(diff);
        if (hasDiffContent) {
          diffEl.innerHTML = RenderDiff(diff);
        } else {
          // diff 無內容（新增二進制 / 圖片 / 文字檔），嘗試顯示 blob
          ShowFileBlob(diffEl, activeRepo.path, hash, filePath);
        }
      })
      .catch(() => { diffEl.innerHTML = '<div class="gg-empty"><p>載入失敗</p></div>'; });
  }

  /**
   * 取得並顯示 blob 內容：圖片預覽 / 文字查看 / binary 提示
   * @param {HTMLElement} el 目標容器
   * @param {string} repoPath
   * @param {string} hash  commit hash（或 'workdir' 代表工作目錄）
   * @param {string} filePath
   */
  function ShowFileBlob(el, repoPath, hash, filePath) {
    if (!el) return;
    const blobPromise = (hash === 'workdir')
      ? window.electronAPI.gitGuiWorkdirBlob(repoPath, filePath)
      : window.electronAPI.gitGuiFileBlob(repoPath, hash, filePath);

    blobPromise.then(res => {
      if (!res || !res.found) {
        el.innerHTML = '<div class="gg-diff-placeholder"><div class="gg-empty"><p>找不到檔案內容</p></div></div>';
        return;
      }
      if (res.type === 'image') {
        el.innerHTML = `
            <div class="gg-blob-image-wrap">
              <img src="data:${res.mime};base64,${res.base64}" class="gg-blob-image" alt="${EscHtml(filePath.split('/').pop())}">
              <div class="gg-blob-image-info">${EscHtml(filePath.split('/').pop())}</div>
            </div>`;
      } else if (res.type === 'binary') {
        const kb = (res.size / 1024).toFixed(1);
        el.innerHTML = `<div class="gg-diff-placeholder"><div class="gg-empty">${LucideIcon('package', 28)}<p>二進制檔案 (${kb} KB)</p></div></div>`;
      } else {
        // 文字內容
        const lines = (res.content || '').split('\n');
        const linesHtml = lines.map((line, i) => `
            <div class="gg-diff-line">
              <div class="gg-diff-line-nums"><span class="gg-diff-lnum">${i + 1}</span><span class="gg-diff-lnum"></span></div>
              <div class="gg-diff-line-content">${EscHtml(line)}</div>
            </div>`).join('');
        el.innerHTML = `<div class="gg-blob-text-header">${EscHtml(filePath)} <span class="gg-blob-line-count">${lines.length} 行</span></div>${linesHtml}`;
      }
    })
      .catch(() => { el.innerHTML = '<div class="gg-empty"><p>載入失敗</p></div>'; });
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

  /** 返回 檔案狀態對應的 CSS class 和標籤 */
  function FileStatusMeta(statusChar, untracked) {
    if (untracked) return { cls: 'untracked', label: '?' };
    const c = statusChar || ' ';
    if (c === 'M') return { cls: 'modified', label: 'M' };
    if (c === 'A') return { cls: 'added', label: 'A' };
    if (c === 'D') return { cls: 'deleted', label: 'D' };
    if (c === 'R') return { cls: 'renamed', label: 'R' };
    if (c === 'C') return { cls: 'copied', label: 'C' };
    if (c === 'U') return { cls: 'conflict', label: 'U' };
    if (c === 'T') return { cls: 'modified', label: 'T' };
    return { cls: 'modified', label: c };
  }

  /** 顯示模式：list | tree */
  let changesViewMode = { unstaged: 'list', staged: 'list' };

  /** 產生 change item HTML */
  function ChangeItemHtml(f, mode) {
    const { cls, label } = FileStatusMeta(f.statusChar, f.untracked);
    const fname = f.path.split('/').pop();
    const fdir = f.path.includes('/') ? f.path.substring(0, f.path.lastIndexOf('/')) : '';
    const actionIcon = mode === 'staged'
      ? `<button class="gg-change-action-btn" data-action="unstage" data-path="${EscHtml(f.path)}" title="Unstage">${LucideIcon('arrow-up', 12)}</button>`
      : `<button class="gg-change-action-btn" data-action="stage"   data-path="${EscHtml(f.path)}" title="Stage">${LucideIcon('arrow-down', 12)}</button>`;
    return `<div class="gg-change-item" data-path="${EscHtml(f.path)}" data-mode="${mode}" data-staged="${mode === 'staged'}">
      <span class="gg-change-status ${cls}" title="${EscHtml(f.path)}">${label}</span>
      <span class="gg-change-filename" title="${EscHtml(f.path)}">${EscHtml(fname)}</span>
      ${fdir ? `<span class="gg-change-dir">${EscHtml(fdir)}</span>` : ''}
      <span class="gg-change-actions">${actionIcon}</span>
    </div>`;
  }

  /** 建立目錄樹 HTML */
  function RenderChangeTree(files, mode) {
    const tree = {};
    files.forEach(f => {
      const parts = f.path.split('/');
      let node = tree;
      parts.forEach((part, i) => {
        if (i === parts.length - 1) {
          if (!node.__files__) node.__files__ = [];
          node.__files__.push(f);
        } else {
          if (!node[part]) node[part] = {};
          node = node[part];
        }
      });
    });
    return RenderTreeNodes(tree, mode, 0);
  }

  function RenderTreeNodes(node, mode, depth) {
    let html = '';
    // Folders
    Object.keys(node).filter(k => k !== '__files__').sort().forEach(key => {
      const fid = `ctree-${depth}-${key}`.replace(/[^a-z0-9-]/gi, '_');
      html += `<div class="gg-change-tree-folder" style="--depth:${depth}" data-folderid="${fid}">
        <span class="gg-lbs-chevron" id="${fid}-chev">${LucideIcon('chevron-down', 10)}</span>
        ${LucideIcon('folder', 11)}
        <span>${EscHtml(key)}</span>
      </div>
      <div id="${fid}-body">${RenderTreeNodes(node[key], mode, depth + 1)}</div>`;
    });
    // Files
    (node.__files__ || []).forEach(f => { html += ChangeItemHtml(f, mode); });
    return html;
  }

  function RenderChanges(files) {
    const filter = changesFilterEl ? changesFilterEl.value.toLowerCase() : '';
    const staged = files.filter(f => f.staged && (!filter || f.path.toLowerCase().includes(filter)));
    const unstaged = files.filter(f => !f.staged && (!filter || f.path.toLowerCase().includes(filter)));

    stagedCount.textContent = staged.length;
    unstagedCount.textContent = unstaged.length;

    // Badge：只計算唯一路徑
    const uniquePaths = new Set(files.map(f => f.path));
    changesBadge.textContent = uniquePaths.size;
    changesBadge.classList.toggle('hidden', uniquePaths.size === 0);

    // Unstaged
    if (unstaged.length === 0) {
      unstagedListEl.innerHTML = '<div class="gg-empty" style="padding:12px;font-size:11px;"><p>工作區乾淨</p></div>';
    } else if (changesViewMode.unstaged === 'tree') {
      unstagedListEl.innerHTML = RenderChangeTree(unstaged, 'unstaged');
    } else {
      unstagedListEl.innerHTML = unstaged.map(f => ChangeItemHtml(f, 'unstaged')).join('');
    }

    // Staged
    if (staged.length === 0) {
      stagedListEl.innerHTML = '<div class="gg-empty" style="padding:12px;font-size:11px;"><p>無 Staged 變更</p></div>';
    } else if (changesViewMode.staged === 'tree') {
      stagedListEl.innerHTML = RenderChangeTree(staged, 'staged');
    } else {
      stagedListEl.innerHTML = staged.map(f => ChangeItemHtml(f, 'staged')).join('');
    }

    BindChangesEvents();
    document.dispatchEvent(new Event('gg-changes-loaded'));
  }

  /** 一次性 event delegation 初始化 */
  function InitChangesEvents() {
    const panel = document.getElementById('gg-panel-changes');
    if (!panel || panel._changesInited) return;
    panel._changesInited = true;

    // Shift/Ctrl 複選狀態管理
    let lastSelectedPath = null;
    let selectedPaths = new Set(); // 記錄當前選取的所有路徑

    function updateSelectionUI() {
      panel.querySelectorAll('.gg-change-item').forEach(x => {
        if (selectedPaths.has(x.dataset.path)) {
          x.classList.add('active');
        } else {
          x.classList.remove('active');
        }
      });
    }

    // 單一 click listener 處理所有子元素
    panel.addEventListener('click', e => {
      // 顯示模式切換（優先判斷）
      const viewBtn = e.target.closest('.gg-view-mode-btn');
      if (viewBtn) {
        const section = viewBtn.dataset.section;
        const mode = viewBtn.dataset.mode;
        changesViewMode[section] = mode;
        panel.querySelectorAll(`.gg-view-mode-btn[data-section="${section}"]`).forEach(b => b.classList.remove('active'));
        viewBtn.classList.add('active');
        if (changeFiles.length) RenderChanges(changeFiles);
        return;
      }
      // Stage / Unstage 按鈕
      const actionBtn = e.target.closest('.gg-change-action-btn');
      if (actionBtn) {
        e.stopPropagation();
        if (actionBtn.dataset.action === 'stage') DoStage(actionBtn.dataset.path);
        if (actionBtn.dataset.action === 'unstage') DoUnstage(actionBtn.dataset.path);
        return;
      }
      // Tree folder 折疊
      const folder = e.target.closest('.gg-change-tree-folder');
      if (folder) {
        const fid = folder.dataset.folderid;
        const bodyEl = document.getElementById(`${fid}-body`);
        const chevEl = document.getElementById(`${fid}-chev`);
        if (!bodyEl) return;
        const collapsed = bodyEl.classList.toggle('collapsed');
        if (chevEl) chevEl.innerHTML = collapsed ? LucideIcon('chevron-right', 10) : LucideIcon('chevron-down', 10);
        return;
      }
      // Item click → 處理單選/複選與 diff
      const item = e.target.closest('.gg-change-item');
      if (item) {
        const path = item.dataset.path;

        if (e.ctrlKey || e.metaKey) {
          // Ctrl/Cmd-click: toggle selection
          if (selectedPaths.has(path)) {
            selectedPaths.delete(path);
          } else {
            selectedPaths.add(path);
          }
          lastSelectedPath = path;
        } else if (e.shiftKey && lastSelectedPath) {
          // Shift-click: select range
          const sectionId = item.closest('.gg-changes-section').id;
          const allItems = Array.from(document.querySelectorAll(`#${sectionId} .gg-change-item`)).map(el => el.dataset.path);
          const startIndex = allItems.indexOf(lastSelectedPath);
          const endIndex = allItems.indexOf(path);

          if (startIndex !== -1 && endIndex !== -1) {
            const start = Math.min(startIndex, endIndex);
            const end = Math.max(startIndex, endIndex);
            selectedPaths.clear();
            for (let i = start; i <= end; i++) {
              selectedPaths.add(allItems[i]);
            }
          }
        } else {
          // Normal click: single selection
          selectedPaths.clear();
          selectedPaths.add(path);
          lastSelectedPath = path;
          // Normal click 才會立即預覽 diff
          ShowChangeDiff(path, item.dataset.staged === 'true');
        }

        updateSelectionUI();
      }
    });

    // 右鍵選單
    panel.addEventListener('contextmenu', e => {
      const item = e.target.closest('.gg-change-item');
      if (!item) return;
      e.preventDefault();

      const path = item.dataset.path;
      // 如果右鍵點擊的項目不在目前選取清單中，則單選該項目
      if (!selectedPaths.has(path)) {
        selectedPaths.clear();
        selectedPaths.add(path);
        lastSelectedPath = path;
        updateSelectionUI();
      }

      const isStaged = item.dataset.staged === 'true';
      ShowChangesContextMenu(e, Array.from(selectedPaths), isStaged, item.dataset.mode);
    });
  }

  function BindChangesEvents() { InitChangesEvents(); }

  /** 顯示 diff（staged 或 unstaged） */
  function ShowChangeDiff(fp, isStagedFile) {
    changesDiffEl.innerHTML = '<div class="gg-loading"><div class="gg-spinner"></div></div>';
    window.electronAPI.gitGuiWorkdirDiff(activeRepo.path, fp, isStagedFile)
      .then(diff => {
        const hasDiff = diff && /^[+\-@]/m.test(diff);
        if (hasDiff) { changesDiffEl.innerHTML = RenderDiff(diff); }
        else { ShowFileBlob(changesDiffEl, activeRepo.path, 'workdir', fp); }
      })
      .catch(() => { changesDiffEl.innerHTML = '<div class="gg-empty"><p>載入失敗</p></div>'; });
  }

  /** 右鍵選單支援多選 */
  function ShowChangesContextMenu(e, filePaths, isStaged, mode) {
    document.querySelectorAll('.gg-ctx-menu').forEach(m => m.remove());
    const menu = document.createElement('div');
    menu.className = 'gg-ctx-menu';
    menu.style.left = e.clientX + 'px';
    menu.style.top = e.clientY + 'px';

    const isMulti = filePaths.length > 1;
    const labelSuffix = isMulti ? ` (${filePaths.length} 個檔案)` : '';

    const SEP = { sep: true };
    const items = [
      !isMulti ? { label: `${LucideIcon('arrow-up-right', 12)} Open`, action: 'open' } : null,
      !isMulti ? { label: `${LucideIcon('folder', 12)} Reveal in Explorer`, action: 'reveal' } : null,
      !isMulti ? SEP : null,
      !isStaged ? { label: `${LucideIcon('arrow-down', 12)} Stage${labelSuffix}`, action: 'stage' } : null,
      isStaged ? { label: `${LucideIcon('arrow-up', 12)} Unstage${labelSuffix}`, action: 'unstage' } : null,
      { label: `${LucideIcon('trash-2', 12)} Discard...${labelSuffix}`, action: 'discard', cls: 'danger' },
      SEP,
      !isMulti ? { label: `${LucideIcon('package', 12)} Stash...`, action: 'stash' } : null,
      !isMulti ? SEP : null,
      !isMulti ? { label: `${LucideIcon('list', 12)} Copy Path`, action: 'copy-path' } : null,
    ].filter(Boolean);

    menu.innerHTML = items.map(item =>
      item.sep
        ? '<div class="gg-ctx-sep"></div>'
        : `<div class="gg-ctx-item${item.cls ? ' ' + item.cls : ''}" data-action="${item.action}">${item.label}</div>`
    ).join('');

    document.body.appendChild(menu);

    const closeMenu = () => { menu.remove(); document.removeEventListener('click', closeMenu); };
    setTimeout(() => document.addEventListener('click', closeMenu), 0);

    menu.addEventListener('click', ev => {
      const action = ev.target.closest('[data-action]')?.dataset.action;
      menu.remove();
      if (!action || !activeRepo) return;

      const firstPath = filePaths[0];

      if (action === 'stage') { DoStage(filePaths); return; }
      if (action === 'unstage') { DoUnstage(filePaths); return; }
      if (action === 'open' && !isMulti) { window.electronAPI.gitGuiOpenFile(activeRepo.path, firstPath); return; }
      if (action === 'reveal' && !isMulti) { window.electronAPI.gitGuiRevealFile(activeRepo.path, firstPath); return; }
      if (action === 'copy-path' && !isMulti) { navigator.clipboard.writeText(firstPath); Toast('路徑已複製', 'success'); return; }
      if (action === 'stash' && !isMulti) {
        document.getElementById('gg-stash-msg-input').value = `Stash file: ${firstPath}`;
        document.getElementById('gg-stash-modal').style.display = 'flex';
        return;
      }
      if (action === 'discard') {
        const msg = isMulti ? `確定要還原這 ${filePaths.length} 個檔案的變更嗎？這將無法復原。` : `確定要還原 ${firstPath} 的變更嗎？這將無法復原。`;
        if (confirm(msg)) {
          window.electronAPI.gitGuiDiscard(activeRepo.path, filePaths, isStaged)
            .then(r => {
              if (r.success) { Toast('已還原變更', 'success'); LoadChanges(); }
              else Toast(`還原失敗：${r.error}`, 'error');
            });
        }
      }
    });

    const close = ev => { if (!menu.contains(ev.target)) { menu.remove(); document.removeEventListener('mousedown', close); } };
    setTimeout(() => document.addEventListener('mousedown', close), 0);
  }

  // Changes 搜尋過濾
  if (changesFilterEl) {
    changesFilterEl.addEventListener('input', () => { if (changeFiles.length) RenderChanges(changeFiles); });
  }

  // LFS 事件處理
  if (lfsPullBtn) {
    lfsPullBtn.addEventListener('click', () => {
      if (!activeRepo) return;
      Toast('LFS Pull...', 'info');
      window.electronAPI.gitGuiLfsPull(activeRepo.path)
        .then(r => { if (r.success) { Toast('LFS Pull 完成', 'success'); LoadChanges(); } else Toast(r.error, 'error'); });
    });
  }

  if (lfsPushBtn) {
    lfsPushBtn.addEventListener('click', () => {
      if (!activeRepo) return;
      if (confirm('確定要執行 LFS Push？')) {
        Toast('LFS Push...', 'info');
        window.electronAPI.gitGuiLfsPush(activeRepo.path)
          .then(r => { if (r.success) { Toast('LFS Push 完成', 'success'); } else Toast(r.error, 'error'); });
      }
    });
  }

  if (lfsLocksBtn) {
    lfsLocksBtn.addEventListener('click', () => {
      if (!activeRepo) return;
      ShowLfsLocksModal();
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
    // Amend 模式
    if (amendMode) {
      window.electronAPI.gitGuiCommitAmend(activeRepo.path, msg)
        .then(r => {
          if (r.success) {
            commitMsgEl.value = '';
            const amendCb = document.getElementById('gg-amend-checkbox');
            if (amendCb) amendCb.checked = false;
            amendMode = false;
            Toast('Amend 成功', 'success');
            LoadChanges();
            if (activeTab === 'log') LoadLog();
          } else {
            Toast(`Amend 失敗：${r.error}`, 'error');
          }
        })
        .catch(e => Toast(e.message, 'error'));
      return;
    }
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

  // stashSaveBtn 已由下方 Stash with Message Modal 區塊覆寫，此處不重複綁定
  //#endregion

  //#region Branch 管理

  function LoadBranches() {
    if (!activeRepo) return;
    if (branchesContentEl) branchesContentEl.innerHTML = '<div class="gg-loading"><div class="gg-spinner"></div></div>';
    if (lbsLocalList) lbsLocalList.innerHTML = '<div class="gg-loading" style="padding:8px;font-size:11px"><div class="gg-spinner"></div></div>';

    window.electronAPI.gitGuiBranches(activeRepo.path)
      .then(data => {
        // 兼容舊格式（current）和新格式（currentBranch）
        if (!data.currentBranch && data.current) data.currentBranch = data.current;
        branchData = data;
        RenderBranches(data);
        RenderLogBranchSidebar(data);
      })
      .catch(() => {
        if (branchesContentEl) branchesContentEl.innerHTML = '<div class="gg-empty"><p>載入失敗</p></div>';
      });
  }

  //#region Log Branch Sidebar 渲染

  /** 渲染 Commit Log 左側的 Branch 側邊欄 */
  function RenderLogBranchSidebar(data) {
    if (!lbsLocalList) return;
    const kw = (lbsFilterEl ? lbsFilterEl.value : '').toLowerCase();
    const local = (data.local || []).filter(b => !kw || b.name.toLowerCase().includes(kw));
    const remote = (data.remote || []).filter(b => !kw || b.name.toLowerCase().includes(kw));
    const tags = (data.tags || []).filter(t => !kw || t.name.toLowerCase().includes(kw));

    if (lbsLocalCount) lbsLocalCount.textContent = local.length;
    if (lbsRemoteCount) lbsRemoteCount.textContent = remote.length;
    if (lbsTagsCount) lbsTagsCount.textContent = tags.length;

    // Local branches — tree view
    const localTree = BuildTree(local);
    lbsLocalList.innerHTML = local.length === 0
      ? '<div class="gg-empty" style="padding:10px 12px;font-size:11px">無本地分支</div>'
      : RenderLbsTree(localTree, 0, false, data.currentBranch);

    // Remote branches — tree view
    lbsRemoteList.innerHTML = remote.length === 0
      ? '<div class="gg-empty" style="padding:10px 12px;font-size:11px">無遠端分支</div>'
      : RenderLbsTree(BuildTree(remote), 0, true, null);

    // Tags — flat list
    lbsTagsList.innerHTML = tags.length === 0
      ? '<div class="gg-empty" style="padding:10px 12px;font-size:11px">無 Tags</div>'
      : tags.map(t => `
          <div class="gg-lbs-item" data-type="tag" data-name="${EscHtml(t.name)}">
            ${LucideIcon('tag', 11)}
            <span class="gg-lbs-item-name" title="${EscHtml(t.name)}">${EscHtml(t.name)}</span>
          </div>`).join('');

    BindLbsEvents();
  }

  /**
   * 遞迴渲染 Branch sidebar 樹節點
   * @param {object} node
   * @param {number} depth
   * @param {boolean} isRemote
   * @param {string|null} currentBranch
   */
  function RenderLbsTree(node, depth, isRemote, currentBranch, pathPrefix) {
    let html = '';
    const prefix = pathPrefix || (isRemote ? 'r' : 'l');
    Object.entries(node).forEach(([key, val]) => {
      const hasChildren = val._children && Object.keys(val._children).length > 0;
      const b = val._branch;
      const fullPath = `${prefix}/${depth}/${key}`;

      if (hasChildren) {
        // Folder node（有子節點）— 用 data-attribute 代替 getElementById 找 body
        html += `<div class="gg-lbs-folder" style="--depth:${depth}" data-folderpath="${EscHtml(fullPath)}">
          <span class="gg-lbs-chevron">${LucideIcon('chevron-down', 10)}</span>
          ${LucideIcon('folder', 11)}
          <span>${EscHtml(key)}</span>
        </div>
        <div class="gg-lbs-folder-body" data-bodypath="${EscHtml(fullPath)}">
          ${b ? RenderLbsItem(b, depth + 1, isRemote, currentBranch) : ''}
          ${RenderLbsTree(val._children, depth + 1, isRemote, currentBranch, fullPath)}
        </div>`;
      } else if (b) {
        // Leaf branch node
        html += RenderLbsItem(b, depth, isRemote, currentBranch);
      }
    });
    return html;
  }

  /** 產生單一 branch item HTML */
  function RenderLbsItem(b, depth, isRemote, currentBranch) {
    const isCurrent = !isRemote && b.name === currentBranch;
    const shortName = b.name.split('/').pop();
    return `<div class="gg-lbs-item${isCurrent ? ' current' : ''}" style="--depth:${depth}"
      data-type="${isRemote ? 'remote' : 'local'}" data-name="${EscHtml(b.name)}">
      ${isCurrent ? `<span class="gg-lbs-current-dot"></span>` : LucideIcon('git-branch', 11)}
      <span class="gg-lbs-item-name" title="${EscHtml(b.name)}">${EscHtml(shortName)}</span>
    </div>`;
  }

  /** 初始化 Branch sidebar 事件（一次性，用 event delegation） */
  function InitLbsEvents() {
    const lbsSidebar = document.getElementById('gg-log-branch-sidebar');
    if (!lbsSidebar || lbsSidebar._lbsInited) return;
    lbsSidebar._lbsInited = true;

    // Shift/Ctrl 複選狀態管理
    let lastSelectedBranch = null;
    let selectedBranches = new Set();

    function updateLbsSelectionUI() {
      lbsSidebar.querySelectorAll('.gg-lbs-item').forEach(x => {
        if (selectedBranches.has(x.dataset.name)) {
          x.classList.add('active');
        } else {
          x.classList.remove('active');
        }
      });
    }

    lbsSidebar.addEventListener('click', e => {
      // Group header 折疊/展開
      const header = e.target.closest('.gg-lbs-group-header');
      if (header) {
        const group = header.dataset.group;
        const bodyEl = document.getElementById(`gg-lbs-${group}-list`);
        const chevEl = document.getElementById(`gg-lbs-chevron-${group}`);
        if (!bodyEl) return;
        const collapsed = bodyEl.classList.toggle('collapsed');
        if (chevEl) chevEl.innerHTML = collapsed ? LucideIcon('chevron-right', 11) : LucideIcon('chevron-down', 11);
        return;
      }

      // Folder 折疊/展開
      const folder = e.target.closest('.gg-lbs-folder');
      if (folder) {
        // body 是 folder 的下一個相鄰元素
        const bodyEl = folder.nextElementSibling;
        if (!bodyEl || !bodyEl.classList.contains('gg-lbs-folder-body')) return;
        const collapsed = bodyEl.classList.toggle('collapsed');
        const chevEl = folder.querySelector('.gg-lbs-chevron');
        if (chevEl) chevEl.innerHTML = collapsed ? LucideIcon('chevron-right', 10) : LucideIcon('chevron-down', 10);
        return;
      }

      // Branch / Tag item 點擊 → 過濾 commit log & 支援複選
      const item = e.target.closest('.gg-lbs-item');
      if (item) {
        const name = item.dataset.name;
        const type = item.dataset.type;

        if (e.ctrlKey || e.metaKey) {
          // Ctrl/Cmd-click
          if (selectedBranches.has(name)) {
            selectedBranches.delete(name);
          } else {
            selectedBranches.add(name);
          }
          lastSelectedBranch = name;
        } else if (e.shiftKey && lastSelectedBranch) {
          // Shift-click
          const allItems = Array.from(lbsSidebar.querySelectorAll('.gg-lbs-item')).map(el => el.dataset.name);
          const startIndex = allItems.indexOf(lastSelectedBranch);
          const endIndex = allItems.indexOf(name);

          if (startIndex !== -1 && endIndex !== -1) {
            const start = Math.min(startIndex, endIndex);
            const end = Math.max(startIndex, endIndex);
            selectedBranches.clear();
            for (let i = start; i <= end; i++) {
              selectedBranches.add(allItems[i]);
            }
          }
        } else {
          // Normal click
          selectedBranches.clear();
          selectedBranches.add(name);
          lastSelectedBranch = name;
          if (activeRepo) LoadLogForBranch(name, type);
        }

        updateLbsSelectionUI();
      }
    });

    // 右鍵選單支援多選
    lbsSidebar.addEventListener('contextmenu', e => {
      const item = e.target.closest('.gg-lbs-item');
      if (!item) return;
      e.preventDefault();

      const name = item.dataset.name;
      if (!selectedBranches.has(name)) {
        selectedBranches.clear();
        selectedBranches.add(name);
        lastSelectedBranch = name;
        updateLbsSelectionUI();
      }

      ShowLbsContextMenu(e, Array.from(selectedBranches), item.dataset.type);
    });
  }

  /** Branch sidebar 右鍵選單（含 Merge / Rebase / Rename / Set Upstream） */
  function ShowLbsContextMenu(e, branchNames, primaryType) {
    document.querySelectorAll('.gg-ctx-menu').forEach(m => m.remove());
    const menu = document.createElement('div');
    menu.className = 'gg-ctx-menu';
    menu.style.left = e.clientX + 'px';
    menu.style.top = e.clientY + 'px';

    const isMulti = branchNames.length > 1;
    const isTag = primaryType === 'tag';
    const isRemote = primaryType === 'remote';
    const firstBranch = branchNames[0];
    const labelSuffix = isMulti ? ` (${branchNames.length} 個)` : '';
    const SEP = { sep: true };

    const items = [
      !isMulti && !isTag ? { label: `${LucideIcon('check', 12)} Checkout`, action: 'checkout' } : null,
      !isMulti && !isTag && !isRemote ? { label: `${LucideIcon('plus', 12)} Create Branch Here`, action: 'create' } : null,
      !isMulti && !isTag && !isRemote ? { label: `${LucideIcon('git-merge', 12)} Merge into Current`, action: 'merge' } : null,
      !isMulti && !isTag && !isRemote ? { label: `${LucideIcon('arrow-right', 12)} Rebase Current onto This`, action: 'rebase' } : null,
      !isMulti && !isTag && !isRemote ? SEP : null,
      !isMulti && !isTag && !isRemote ? { label: `${LucideIcon('edit-2', 12)} Rename`, action: 'rename' } : null,
      !isMulti && !isTag && !isRemote ? { label: `${LucideIcon('link', 12)} Set Upstream`, action: 'set-upstream' } : null,
      !isTag && !isRemote ? SEP : null,
      !isTag ? { label: `${LucideIcon('trash-2', 12)} Delete${labelSuffix}`, action: 'delete', cls: 'danger' } : null,
      !isMulti && isTag ? { label: `${LucideIcon('trash-2', 12)} Delete Tag`, action: 'delete-tag', cls: 'danger' } : null,
      SEP,
      !isMulti ? { label: `${LucideIcon('list', 12)} Copy Name`, action: 'copy' } : null,
    ].filter(Boolean);

    menu.innerHTML = items.map(item =>
      item.sep
        ? '<div class="gg-ctx-sep"></div>'
        : `<div class="gg-ctx-item${item.cls ? ' ' + item.cls : ''}" data-action="${item.action}">${item.label}</div>`
    ).join('');

    document.body.appendChild(menu);

    const closeMenu = () => { menu.remove(); document.removeEventListener('click', closeMenu); };
    setTimeout(() => document.addEventListener('click', closeMenu), 0);

    menu.addEventListener('click', ev => {
      const action = ev.target.closest('[data-action]')?.dataset.action;
      menu.remove();
      if (!action || !activeRepo) return;

      if (action === 'checkout') { DoCheckout(firstBranch); return; }
      if (action === 'copy') { navigator.clipboard.writeText(firstBranch); Toast('已複製分支名稱', 'success'); return; }
      if (action === 'create') {
        const newName = prompt(`從 ${firstBranch} 建立新分支：`, '');
        if (newName) {
          window.electronAPI.gitGuiCreateBranch(activeRepo.path, newName, firstBranch)
            .then(r => { if (r.success) { Toast(`已建立 ${newName}`, 'success'); LoadBranches(); } else Toast(`建立失敗：${r.error}`, 'error'); });
        }
        return;
      }
      if (action === 'merge') {
        ShowModal({
          title: `Merge "${firstBranch}" into current branch`,
          body: `<div class="gg-modal-field">
            <label>Strategy</label>
            <select id="gg-m-merge-strategy" class="gg-modal-input">
              <option value="merge">Merge commit</option>
              <option value="squash">Squash</option>
              <option value="ff-only">Fast-forward Only</option>
              <option value="no-ff">No Fast-forward</option>
            </select>
          </div>`,
          confirmText: 'Merge',
          onConfirm: () => {
            const strategy = document.getElementById('gg-m-merge-strategy')?.value || 'merge';
            CloseModal();
            window.electronAPI.gitGuiMerge(activeRepo.path, firstBranch, strategy)
              .then(r => {
                if (r.success) { Toast('Merge 成功', 'success'); RefreshAll(); }
                else { Toast(`Merge 失敗：${r.error}`, 'error'); CheckInProgress(); }
              });
          }
        });
        return;
      }
      if (action === 'rebase') {
        if (confirm(`確定要將當前分支 Rebase 到 "${firstBranch}"？`)) {
          window.electronAPI.gitGuiRebase(activeRepo.path, firstBranch)
            .then(r => {
              if (r.success) { Toast('Rebase 成功', 'success'); RefreshAll(); }
              else { Toast(`Rebase 失敗：${r.error}`, 'error'); CheckInProgress(); }
            });
        }
        return;
      }
      if (action === 'rename') {
        ShowModal({
          title: `Rename Branch: ${firstBranch}`,
          body: `<div class="gg-modal-field">
            <label>New Name</label>
            <input id="gg-m-rename-branch" type="text" value="${EscHtml(firstBranch)}" class="gg-modal-input"/>
          </div>`,
          confirmText: 'Rename',
          onConfirm: () => {
            const newName = document.getElementById('gg-m-rename-branch')?.value.trim();
            if (!newName || newName === firstBranch) { CloseModal(); return; }
            CloseModal();
            window.electronAPI.gitGuiRenameBranch(activeRepo.path, firstBranch, newName)
              .then(r => {
                if (r.success) { Toast(`已重新命名為 "${newName}"`, 'success'); LoadBranches(); }
                else Toast(`重新命名失敗：${r.error}`, 'error');
              });
          }
        });
        return;
      }
      if (action === 'set-upstream') {
        window.electronAPI.gitGuiBranches(activeRepo.path)
          .then(data => {
            const remoteOpts = (data.remote || []).map(b => `<option value="${EscHtml(b.name)}">${EscHtml(b.name)}</option>`).join('');
            ShowModal({
              title: `Set Upstream for "${firstBranch}"`,
              body: `<div class="gg-modal-field">
                <label>Upstream Branch</label>
                <select id="gg-m-upstream" class="gg-modal-input">
                  <option value="">（清除 Upstream）</option>
                  ${remoteOpts}
                </select>
              </div>`,
              confirmText: 'Set',
              onConfirm: () => {
                const upstream = document.getElementById('gg-m-upstream')?.value || '';
                CloseModal();
                window.electronAPI.gitGuiSetUpstream(activeRepo.path, firstBranch, upstream)
                  .then(r => { if (r.success) Toast('Upstream 已設定', 'success'); else Toast(`設定失敗：${r.error}`, 'error'); });
              }
            });
          });
        return;
      }
      if (action === 'delete') {
        const msg = isMulti ? `確定要刪除這 ${branchNames.length} 個分支嗎？` : `確定要刪除分支 ${firstBranch} 嗎？`;
        if (confirm(msg)) {
          Promise.all(branchNames.map(b => window.electronAPI.gitGuiDeleteBranch(activeRepo.path, b, false)))
            .then(() => { Toast('已刪除分支', 'success'); LoadBranches(); });
        }
        return;
      }
      if (action === 'delete-tag') {
        if (confirm(`確定要刪除 Tag ${firstBranch} 嗎？`)) {
          window.electronAPI.gitGuiDeleteTag(activeRepo.path, firstBranch)
            .then(r => { if (r.success) { Toast('已刪除 Tag', 'success'); LoadTags(); } else Toast(r.error, 'error'); });
        }
        return;
      }
    });

    const close = ev => { if (!menu.contains(ev.target)) { menu.remove(); document.removeEventListener('mousedown', close); } };
    setTimeout(() => document.addEventListener('mousedown', close), 0);
  }

  /** BindLbsEvents: render 後呼叫，確保 InitLbsEvents 已執行（幂等） */
  function BindLbsEvents() {
    InitLbsEvents();
  }

  /** 以指定 branch 載入 commit log（filter） */
  function LoadLogForBranch(branchName, type) {
    if (!activeRepo) return;
    const btnAll = document.getElementById('gg-log-all-btn');
    const btnCurrent = document.getElementById('gg-log-current-btn');
    if (btnAll) btnAll.classList.remove('active');
    if (btnCurrent) btnCurrent.classList.remove('active');
    SetLoading(logListEl);
    // git-gui-log 透過 options.branch 指定分支
    window.electronAPI.gitGuiLog(activeRepo.path, { showAll: false, branch: branchName })
      .then(commits => RenderLogList(commits))
      .catch(() => { logListEl.innerHTML = '<div class="gg-empty"><p>載入失敗</p></div>'; });
  }

  // Branch sidebar 搜尋過濾
  if (lbsFilterEl) {
    lbsFilterEl.addEventListener('input', () => {
      if (branchData) RenderLogBranchSidebar(branchData);
    });
  }

  // New branch 按鈕（sidebar 版）
  if (lbsNewBranchBtn) {
    lbsNewBranchBtn.addEventListener('click', () => {
      // Branches tab 已移除，直接使用 lbs inline 創建分支（展開式 input）
      const lbsFilter = document.getElementById('gg-lbs-filter');
      if (lbsFilter) lbsFilter.focus();
    });
  }
  //#endregion

  //#region Branch 渲染輔助

  /** 產生單一 branch item HTML */
  function BranchItemHtml(b, isRemote) {
    const icon = b.isCurrent
      ? `<span class="gg-branch-icon current">${LucideIcon('check', 12)}</span>`
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
    if (branchesContentEl) {
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
  }

  function RenderBranchesTree(local, remote) {
    const localTree = BuildTree(local);
    const remoteTree = BuildTree(remote);
    const localHtml = local.length === 0 ? '<div class="gg-empty" style="padding:12px;font-size:11px;"><p>無本地分支</p></div>' : RenderTreeNode(localTree, 0, false);
    const remoteHtml = remote.length === 0 ? '<div class="gg-empty" style="padding:12px;font-size:11px;"><p>無遠端分支</p></div>' : RenderTreeNode(remoteTree, 0, true);
    if (branchesContentEl) {
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
      branchesContentEl.querySelectorAll('.gg-tree-folder').forEach(folder => {
        folder.addEventListener('click', () => {
          const group = folder.closest('.gg-tree-group');
          group.classList.toggle('collapsed');
        });
      });
    }
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
    if (branchesContentEl) {
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
    if (branchData) RenderBranches(branchData);
  });

  branchSearchClearEl.addEventListener('click', () => {
    branchFilter = '';
    branchSearchEl.value = '';
    branchSearchClearEl.classList.add('hidden');
    if (branchData) RenderBranches(branchData);
  });

  document.querySelectorAll('.gg-view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      branchViewMode = btn.dataset.mode;
      document.querySelectorAll('.gg-view-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (branchData) RenderBranches(branchData);
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

  let allStashes = [];
  let activeStash = null;

  function LoadStashes() {
    if (!activeRepo) return;
    stashListEl.innerHTML = '<div class="gg-loading"><div class="gg-spinner"></div></div>';
    window.electronAPI.gitGuiStashes(activeRepo.path)
      .then(stashes => {
        allStashes = stashes;
        stashCountEl.textContent = stashes.length;
        RenderStashList();
        // 自動選第一筆
        if (stashes.length > 0) SelectStash(stashes[0]);
        else {
          stashChangesListEl.innerHTML = '<div class="gg-empty" style="padding:12px;font-size:11px"><p>選擇上方 Stash 查看變更</p></div>';
          stashChangesCountEl.textContent = 0;
          stashDiffEl.innerHTML = `<div class="gg-diff-placeholder"><div class="gg-empty"><div class="gg-empty-icon">${LucideIcon('file-text', 32)}</div><p>點擊左側檔案查看 diff</p></div></div>`;
        }
      })
      .catch(() => {
        stashListEl.innerHTML = '<div class="gg-empty"><p>載入失敗</p></div>';
      });
  }

  function RenderStashList() {
    const filter = stashFilterEl ? stashFilterEl.value.toLowerCase() : '';
    const visible = allStashes.filter(s =>
      !filter || s.ref.toLowerCase().includes(filter) || s.message.toLowerCase().includes(filter)
    );

    if (visible.length === 0) {
      stashListEl.innerHTML = `<div class="gg-empty"><div class="gg-empty-icon">${LucideIcon('package', 28)}</div><p>無 Stash 記錄</p></div>`;
      return;
    }

    stashListEl.innerHTML = visible.map(s => `
      <div class="gg-stash-item ${activeStash && activeStash.ref === s.ref ? 'active' : ''}"
           data-ref="${EscHtml(s.ref)}">
        <div class="gg-stash-item-top">
          <span class="gg-stash-ref">${EscHtml(s.ref)}</span>
          <span class="gg-stash-date">${s.date ? RelativeTime(s.date) : ''}</span>
        </div>
        <div class="gg-stash-msg">${EscHtml(s.message)}</div>
      </div>
    `).join('');

    InitStashEvents();
  }

  /** 一次性 event delegation 初始化 Stash 面板 */
  function InitStashEvents() {
    const panel = document.getElementById('gg-panel-stash');
    if (!panel || panel._stashInited) return;
    panel._stashInited = true;

    // Stash 選取 + 右鍵
    stashListEl.addEventListener('click', e => {
      const item = e.target.closest('.gg-stash-item');
      if (!item) return;
      const ref = item.dataset.ref;
      const s = allStashes.find(x => x.ref === ref);
      if (s) SelectStash(s);
    });

    stashListEl.addEventListener('contextmenu', e => {
      const item = e.target.closest('.gg-stash-item');
      if (!item) return;
      e.preventDefault();
      const ref = item.dataset.ref;
      ShowStashContextMenu(e, ref);
    });

    // Stash changes 選取→ diff
    stashChangesListEl.addEventListener('click', e => {
      const item = e.target.closest('.gg-change-item');
      if (!item || !activeStash) return;
      stashChangesListEl.querySelectorAll('.gg-change-item').forEach(x => x.classList.remove('active'));
      item.classList.add('active');
      stashDiffEl.innerHTML = '<div class="gg-loading"><div class="gg-spinner"></div></div>';
      window.electronAPI.gitGuiStashFileDiff(activeRepo.path, activeStash.ref, item.dataset.path)
        .then(diff => {
          if (diff && /^[+\-@]/m.test(diff)) stashDiffEl.innerHTML = RenderDiff(diff);
          else stashDiffEl.innerHTML = '<div class="gg-empty"><p>無差異</p></div>';
        })
        .catch(() => { stashDiffEl.innerHTML = '<div class="gg-empty"><p>載入失敗</p></div>'; });
    });
  }

  /** Stash 右鍵選單 */
  function ShowStashContextMenu(e, ref) {
    document.querySelectorAll('.gg-ctx-menu').forEach(m => m.remove());
    const menu = document.createElement('div');
    menu.className = 'gg-ctx-menu';
    menu.style.left = e.clientX + 'px';
    menu.style.top = e.clientY + 'px';
    menu.innerHTML = [
      `<div class="gg-ctx-item" data-action="apply">${LucideIcon('check', 12)} Apply（保留 stash）</div>`,
      `<div class="gg-ctx-item" data-action="pop">${LucideIcon('arrow-down', 12)} Pop（套用並刪除）</div>`,
      '<div class="gg-ctx-sep"></div>',
      `<div class="gg-ctx-item danger" data-action="drop">${LucideIcon('trash-2', 12)} Drop（刪除）</div>`,
    ].join('');
    document.body.appendChild(menu);

    menu.addEventListener('click', ev => {
      const action = ev.target.closest('[data-action]')?.dataset.action;
      menu.remove();
      if (!action || !activeRepo) return;
      if (action === 'apply') {
        window.electronAPI.gitGuiStashApply(activeRepo.path, ref)
          .then(r => { if (r.success) { Toast('Apply 成功', 'success'); LoadChanges(); } else Toast(r.error, 'error'); });
      }
      if (action === 'pop') {
        window.electronAPI.gitGuiStashPop(activeRepo.path, ref)
          .then(r => { if (r.success) { Toast('Pop 成功', 'success'); LoadStashes(); LoadChanges(); } else Toast(r.error, 'error'); });
      }
      if (action === 'drop') {
        if (!confirm(`確定要刪除 ${ref}？`)) return;
        window.electronAPI.gitGuiStashDrop(activeRepo.path, ref)
          .then(r => { if (r.success) { Toast('Drop 成功', 'success'); LoadStashes(); } else Toast(r.error, 'error'); });
      }
    });

    const close = ev => { if (!menu.contains(ev.target)) { menu.remove(); document.removeEventListener('mousedown', close); } };
    setTimeout(() => document.addEventListener('mousedown', close), 0);
  }

  function SelectStash(s) {
    activeStash = s;
    RenderStashList();
    // 載入 stash changes
    stashChangesListEl.innerHTML = '<div class="gg-loading"><div class="gg-spinner"></div></div>';
    window.electronAPI.gitGuiStashFiles(activeRepo.path, s.ref)
      .then(files => {
        stashChangesCountEl.textContent = files.length;
        if (files.length === 0) {
          stashChangesListEl.innerHTML = '<div class="gg-empty" style="padding:12px;font-size:11px"><p>無變更</p></div>';
          return;
        }
        stashChangesListEl.innerHTML = files.map(f => {
          const statusChar = f.xy ? f.xy[0] : 'M';
          const { cls, label } = FileStatusMeta(statusChar, false);
          const fname = f.path.split('/').pop();
          const fdir = f.path.includes('/') ? f.path.substring(0, f.path.lastIndexOf('/')) : '';
          return `<div class="gg-change-item" data-path="${EscHtml(f.path)}">
            <span class="gg-change-status ${cls}">${label}</span>
            <span class="gg-change-filename" title="${EscHtml(f.path)}">${EscHtml(fname)}</span>
            ${fdir ? `<span class="gg-change-dir">${EscHtml(fdir)}</span>` : ''}
          </div>`;
        }).join('');
      })
      .catch(() => {
        stashChangesListEl.innerHTML = '<div class="gg-empty"><p>載入失敗</p></div>';
      });
  }

  if (stashFilterEl) {
    stashFilterEl.addEventListener('input', RenderStashList);
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

  if (stashClearBtn) {
    stashClearBtn.addEventListener('click', () => {
      if (!activeRepo || allStashes.length === 0) return;
      if (!confirm(`確定要清除所有 ${allStashes.length} 個 Stash 嗎？`)) return;
      window.electronAPI.gitGuiStashClear(activeRepo.path)
        .then(r => {
          if (r.success) { Toast('已清除所有 Stash', 'success'); LoadStashes(); }
          else Toast(`清除失敗：${r.error}`, 'error');
        })
        .catch(e => Toast(e.message, 'error'));
    });
  }
  //#endregion

  //#region Tags

  function LoadTags() {
    if (!activeRepo) return;
    tagListEl.innerHTML = '<div class="gg-loading"><div class="gg-spinner"></div></div>';
    window.electronAPI.gitGuiTags(activeRepo.path)
      .then(tags => {
        if (tags.length === 0) {
          tagListEl.innerHTML = `<div class="gg-empty"><div class="gg-empty-icon">${LucideIcon('tag', 28)}</div><p>無 Tags</p></div>`;
          return;
        }
        tagListEl.innerHTML = tags.map(t => `
          <div class="gg-tag-item" data-name="${EscHtml(t.name)}">
            ${LucideIcon('tag', 12)}
            <span class="gg-tag-name">${EscHtml(t.name)}</span>
            <span class="gg-tag-date">${EscHtml(t.date || '')}</span>
            <span class="gg-tag-msg">${EscHtml(t.message || '')}</span>
          </div>
        `).join('');
        InitTagEvents();
      })
      .catch(() => {
        tagListEl.innerHTML = '<div class="gg-empty"><p>載入失敗</p></div>';
      });
  }

  function InitTagEvents() {
    const panel = document.getElementById('gg-panel-tags');
    if (!panel || panel._tagInited) return;
    panel._tagInited = true;

    tagListEl.addEventListener('contextmenu', e => {
      const item = e.target.closest('.gg-tag-item');
      if (!item) return;
      e.preventDefault();
      ShowTagContextMenu(e, item.dataset.name);
    });
  }

  function ShowTagContextMenu(e, tagName) {
    document.querySelectorAll('.gg-ctx-menu').forEach(m => m.remove());
    const menu = document.createElement('div');
    menu.className = 'gg-ctx-menu';
    menu.style.left = e.clientX + 'px';
    menu.style.top = e.clientY + 'px';
    menu.innerHTML = [
      `<div class="gg-ctx-item" data-action="push">${LucideIcon('arrow-up-right', 12)} Push Tag to origin</div>`,
      `<div class="gg-ctx-item" data-action="copy">${LucideIcon('list', 12)} Copy Name</div>`,
      '<div class="gg-ctx-sep"></div>',
      `<div class="gg-ctx-item danger" data-action="delete">${LucideIcon('trash-2', 12)} Delete Tag</div>`,
    ].join('');
    document.body.appendChild(menu);

    menu.addEventListener('click', ev => {
      const action = ev.target.closest('[data-action]')?.dataset.action;
      menu.remove();
      if (!action || !activeRepo) return;
      if (action === 'copy') { navigator.clipboard.writeText(tagName); Toast('已複製 Tag 名稱', 'success'); }
      if (action === 'push') {
        window.electronAPI.gitGuiPushTag(activeRepo.path, tagName, 'origin')
          .then(r => { if (r.success) Toast(`Tag "${tagName}" 已推送`, 'success'); else Toast(r.error, 'error'); });
      }
      if (action === 'delete') {
        if (confirm(`確定要刪除 Tag "${tagName}"？`)) {
          window.electronAPI.gitGuiDeleteTag(activeRepo.path, tagName)
            .then(r => { if (r.success) { Toast(`已刪除 Tag "${tagName}"`, 'success'); LoadTags(); } else Toast(r.error, 'error'); });
        }
      }
    });
    const close = ev => { if (!menu.contains(ev.target)) { menu.remove(); document.removeEventListener('mousedown', close); } };
    setTimeout(() => document.addEventListener('mousedown', close), 0);
  }

  // Create Tag 按鈕
  if (createTagBtn) {
    createTagBtn.addEventListener('click', () => {
      if (!activeRepo) return;
      ShowModal({
        title: 'New Tag',
        body: `
          <div class="gg-modal-field">
            <label>Tag Name</label>
            <input id="gg-m-tag-name" type="text" placeholder="v1.0.0" class="gg-modal-input"/>
          </div>
          <div class="gg-modal-field">
            <label>Ref（預設 HEAD）</label>
            <input id="gg-m-tag-ref" type="text" placeholder="HEAD" class="gg-modal-input"/>
          </div>
          <div class="gg-modal-field">
            <label>Message（可選，留空為 lightweight tag）</label>
            <input id="gg-m-tag-msg" type="text" placeholder="Release message..." class="gg-modal-input"/>
          </div>`,
        confirmText: 'Create Tag',
        onConfirm: () => {
          const name = document.getElementById('gg-m-tag-name')?.value.trim();
          const ref = document.getElementById('gg-m-tag-ref')?.value.trim() || 'HEAD';
          const msg = document.getElementById('gg-m-tag-msg')?.value.trim();
          if (!name) { Toast('請輸入 Tag 名稱', 'warning'); return; }
          CloseModal();
          window.electronAPI.gitGuiCreateTag(activeRepo.path, name, ref, msg)
            .then(r => { if (r.success) { Toast(`Tag "${name}" 已建立`, 'success'); LoadTags(); } else Toast(r.error, 'error'); });
        }
      });
    });
  }

  // Push All Tags 按鈕
  if (pushAllTagsBtn) {
    pushAllTagsBtn.addEventListener('click', () => {
      if (!activeRepo) return;
      window.electronAPI.gitGuiPushAllTags(activeRepo.path, 'origin')
        .then(r => { if (r.success) Toast('所有 Tags 已推送至 origin', 'success'); else Toast(r.error, 'error'); });
    });
  }
  //#endregion

  //#region Remotes 面板

  function LoadRemotes() {
    if (!activeRepo) return;
    remotesListEl.innerHTML = '<div class="gg-loading"><div class="gg-spinner"></div></div>';
    window.electronAPI.gitGuiRemotes(activeRepo.path)
      .then(remotes => {
        remotesData = remotes;
        RenderRemotes(remotes);
      })
      .catch(() => {
        remotesListEl.innerHTML = '<div class="gg-empty"><p>載入失敗</p></div>';
      });
  }

  function RenderRemotes(remotes) {
    if (remotes.length === 0) {
      remotesListEl.innerHTML = `<div class="gg-empty"><div class="gg-empty-icon">${LucideIcon('server', 28)}</div><p>無 Remotes</p></div>`;
      return;
    }
    remotesListEl.innerHTML = remotes.map(r => `
      <div class="gg-remote-item" data-name="${EscHtml(r.name)}">
        <div class="gg-remote-header">
          ${LucideIcon('server', 13)}
          <span class="gg-remote-name">${EscHtml(r.name)}</span>
          <div class="gg-remote-actions">
            <button class="gg-icon-btn" data-action="fetch" data-name="${EscHtml(r.name)}" title="Fetch ${EscHtml(r.name)}">${LucideIcon('arrow-down-circle', 13)}</button>
            <button class="gg-icon-btn" data-action="edit" data-name="${EscHtml(r.name)}" title="Edit Remote">${LucideIcon('edit-2', 13)}</button>
            <button class="gg-icon-btn danger" data-action="delete" data-name="${EscHtml(r.name)}" title="Delete Remote">${LucideIcon('trash-2', 13)}</button>
          </div>
        </div>
        <div class="gg-remote-url">${LucideIcon('link', 11)} ${EscHtml(r.fetchUrl)}</div>
      </div>
    `).join('');
    InitRemoteEvents();
  }

  function InitRemoteEvents() {
    const panel = document.getElementById('gg-panel-remotes');
    if (!panel || panel._remoteInited) return;
    panel._remoteInited = true;

    remotesListEl.addEventListener('click', e => {
      const btn = e.target.closest('[data-action]');
      if (!btn || !activeRepo) return;
      const action = btn.dataset.action;
      const name = btn.dataset.name;

      if (action === 'fetch') {
        Toast(`Fetching ${name}...`, 'info');
        window.electronAPI.gitGuiFetchRemote(activeRepo.path, name)
          .then(r => { if (r.success) { Toast(`Fetch ${name} 完成`, 'success'); RefreshActiveTab(); } else Toast(r.error, 'error'); });
      }
      if (action === 'edit') {
        const remote = remotesData.find(r => r.name === name);
        if (!remote) return;
        ShowModal({
          title: `Edit Remote: ${name}`,
          body: `
            <div class="gg-modal-field">
              <label>Name</label>
              <input id="gg-m-remote-name" type="text" value="${EscHtml(remote.name)}" class="gg-modal-input"/>
            </div>
            <div class="gg-modal-field">
              <label>URL</label>
              <input id="gg-m-remote-url" type="text" value="${EscHtml(remote.fetchUrl)}" class="gg-modal-input"/>
            </div>`,
          confirmText: 'Save',
          onConfirm: () => {
            const newName = document.getElementById('gg-m-remote-name')?.value.trim();
            const newUrl = document.getElementById('gg-m-remote-url')?.value.trim();
            if (!newName) { Toast('名稱不可為空', 'warning'); return; }
            CloseModal();
            window.electronAPI.gitGuiEditRemote(activeRepo.path, name, newName, newUrl)
              .then(r => { if (r.success) { Toast('Remote 已更新', 'success'); LoadRemotes(); } else Toast(r.error, 'error'); });
          }
        });
      }
      if (action === 'delete') {
        if (confirm(`確定要刪除 Remote "${name}"？`)) {
          window.electronAPI.gitGuiDeleteRemote(activeRepo.path, name)
            .then(r => { if (r.success) { Toast(`已刪除 Remote "${name}"`, 'success'); LoadRemotes(); } else Toast(r.error, 'error'); });
        }
      }
    });
  }

  // Add Remote 按鈕
  if (addRemoteBtn) {
    addRemoteBtn.addEventListener('click', () => {
      if (!activeRepo) return;
      ShowModal({
        title: 'Add Remote',
        body: `
          <div class="gg-modal-field">
            <label>Name</label>
            <input id="gg-m-remote-name" type="text" placeholder="origin" class="gg-modal-input"/>
          </div>
          <div class="gg-modal-field">
            <label>URL</label>
            <input id="gg-m-remote-url" type="text" placeholder="https://github.com/..." class="gg-modal-input"/>
          </div>`,
        confirmText: 'Add',
        onConfirm: () => {
          const name = document.getElementById('gg-m-remote-name')?.value.trim();
          const url = document.getElementById('gg-m-remote-url')?.value.trim();
          if (!name || !url) { Toast('名稱與 URL 不可為空', 'warning'); return; }
          CloseModal();
          window.electronAPI.gitGuiAddRemote(activeRepo.path, name, url)
            .then(r => { if (r.success) { Toast(`Remote "${name}" 已新增`, 'success'); LoadRemotes(); } else Toast(r.error, 'error'); });
        }
      });
    });
  }

  //#region Submodules

  function LoadSubmodules() {
    if (!activeRepo) return;
    submodulesListEl.innerHTML = '<div class="gg-loading"><div class="gg-spinner"></div></div>';
    window.electronAPI.gitGuiSubmodules(activeRepo.path)
      .then(submodules => {
        submodulesData = submodules;
        RenderSubmodules(submodules);
      })
      .catch(() => {
        submodulesListEl.innerHTML = '<div class="gg-empty"><p>載入失敗</p></div>';
      });
  }

  function RenderSubmodules(submodules) {
    if (submodules.length === 0) {
      submodulesListEl.innerHTML = `<div class="gg-empty"><div class="gg-empty-icon">${LucideIcon('package', 28)}</div><p>無 Submodules</p></div>`;
      return;
    }
    submodulesListEl.innerHTML = submodules.map(s => `
      <div class="gg-submodule-item" data-path="${EscHtml(s.path)}">
        <div class="gg-submodule-header">
          ${s.initialized ? LucideIcon('check-circle', 13, 'color: var(--success)') : LucideIcon('circle', 13, 'color: var(--text-muted)')}
          <span class="gg-submodule-path">${EscHtml(s.path)}</span>
          <div class="gg-submodule-actions">
            <button class="gg-icon-btn" data-action="update" data-path="${EscHtml(s.path)}" title="Update">${LucideIcon('download', 13)}</button>
            <button class="gg-icon-btn" data-action="sync" data-path="${EscHtml(s.path)}" title="Sync">${LucideIcon('sync', 13)}</button>
            ${s.initialized ? `<button class="gg-icon-btn danger" data-action="deinit" data-path="${EscHtml(s.path)}" title="Deinit">${LucideIcon('trash-2', 13)}</button>` : `<button class="gg-icon-btn" data-action="init" data-path="${EscHtml(s.path)}" title="Init">${LucideIcon('play', 13)}</button>`}
          </div>
        </div>
        <div class="gg-submodule-info">
          <span class="gg-submodule-hash">${EscHtml(s.hash.substring(0, 8))}</span>
          ${s.description ? `<span class="gg-submodule-desc">${EscHtml(s.description)}</span>` : ''}
        </div>
      </div>
    `).join('');
    InitSubmoduleEvents();
  }

  function InitSubmoduleEvents() {
    const panel = document.getElementById('gg-panel-submodules');
    if (!panel || panel._submoduleInited) return;
    panel._submoduleInited = true;

    submodulesListEl.addEventListener('click', e => {
      const btn = e.target.closest('[data-action]');
      if (!btn || !activeRepo) return;
      const action = btn.dataset.action;
      const path = btn.dataset.path;

      if (action === 'update') {
        Toast(`Updating ${path}...`, 'info');
        window.electronAPI.gitGuiSubmoduleUpdate(activeRepo.path, path, false)
          .then(r => { if (r.success) { Toast(`Update ${path} 完成`, 'success'); LoadSubmodules(); } else Toast(r.error, 'error'); });
      }
      if (action === 'sync') {
        Toast(`Syncing ${path}...`, 'info');
        window.electronAPI.gitGuiSubmoduleSync(activeRepo.path, path)
          .then(r => { if (r.success) { Toast(`Sync ${path} 完成`, 'success'); LoadSubmodules(); } else Toast(r.error, 'error'); });
      }
      if (action === 'init') {
        Toast(`Initializing ${path}...`, 'info');
        window.electronAPI.gitGuiSubmoduleInit(activeRepo.path, path)
          .then(r => { if (r.success) { Toast(`Init ${path} 完成`, 'success'); LoadSubmodules(); } else Toast(r.error, 'error'); });
      }
      if (action === 'deinit') {
        if (confirm(`確定要 Deinit Submodule "${path}"？`)) {
          window.electronAPI.gitGuiSubmoduleDeinit(activeRepo.path, path)
            .then(r => { if (r.success) { Toast(`Deinit ${path} 完成`, 'success'); LoadSubmodules(); } else Toast(r.error, 'error'); });
        }
      }
    });

    submoduleUpdateAllBtn.addEventListener('click', () => {
      if (!activeRepo) return;
      if (confirm('確定要 Update All Submodules？')) {
        Toast('Updating all submodules...', 'info');
        window.electronAPI.gitGuiSubmoduleUpdate(activeRepo.path, null, true)
          .then(r => { if (r.success) { Toast('Update All 完成', 'success'); LoadSubmodules(); } else Toast(r.error, 'error'); });
      }
    });

    submoduleSyncAllBtn.addEventListener('click', () => {
      if (!activeRepo) return;
      if (confirm('確定要 Sync All Submodules？')) {
        Toast('Syncing all submodules...', 'info');
        window.electronAPI.gitGuiSubmoduleSync(activeRepo.path, null)
          .then(r => { if (r.success) { Toast('Sync All 完成', 'success'); LoadSubmodules(); } else Toast(r.error, 'error'); });
      }
    });
  }
  //#endregion

  //#region Worktrees

  function LoadWorktrees() {
    if (!activeRepo) return;
    worktreesListEl.innerHTML = '<div class="gg-loading"><div class="gg-spinner"></div></div>';
    window.electronAPI.gitGuiWorktrees(activeRepo.path)
      .then(wts => { worktreesData = wts; RenderWorktrees(wts); })
      .catch(() => { worktreesListEl.innerHTML = '<div class="gg-empty"><p>載入失敗</p></div>'; });
  }

  function RenderWorktrees(wts) {
    if (wts.length === 0) {
      worktreesListEl.innerHTML = `<div class="gg-empty"><div class="gg-empty-icon">${LucideIcon('layout', 28)}</div><p>無 Worktrees</p></div>`;
      return;
    }
    worktreesListEl.innerHTML = wts.map((wt, i) => `
      <div class="gg-worktree-item" data-path="${EscHtml(wt.path)}">
        <div class="gg-worktree-header">
          ${LucideIcon(i === 0 ? 'home' : 'layout', 13)}
          <span class="gg-worktree-branch">${EscHtml(wt.branch || '(detached)')}</span>
          ${i === 0 ? '<span class="gg-worktree-main-badge">main</span>' : ''}
          <div class="gg-worktree-actions">
            ${i > 0 ? `<button class="gg-icon-btn danger" data-action="remove" data-path="${EscHtml(wt.path)}" title="Remove">${LucideIcon('trash-2', 13)}</button>` : ''}
          </div>
        </div>
        <div class="gg-worktree-path">${EscHtml(wt.path)}</div>
        ${wt.hash ? `<div class="gg-worktree-hash">${EscHtml(wt.hash.substring(0, 8))}</div>` : ''}
      </div>
    `).join('');
    InitWorktreeEvents();
  }

  function InitWorktreeEvents() {
    const panel = document.getElementById('gg-panel-worktrees');
    if (!panel || panel._worktreeInited) return;
    panel._worktreeInited = true;

    worktreesListEl.addEventListener('click', e => {
      const btn = e.target.closest('[data-action]');
      if (!btn || !activeRepo) return;
      if (btn.dataset.action === 'remove') {
        const wtPath = btn.dataset.path;
        if (confirm(`確定要移除 Worktree "${wtPath}"？`)) {
          window.electronAPI.gitGuiWorktreeRemove(activeRepo.path, wtPath, false)
            .then(r => { if (r.success) { Toast('Worktree 已移除', 'success'); LoadWorktrees(); } else Toast(r.error, 'error'); });
        }
      }
    });

    worktreeAddBtn.addEventListener('click', () => {
      if (!activeRepo) return;
      ShowModal({
        title: 'Add Worktree',
        body: `
          <div class="gg-modal-field">
            <label>路徑</label>
            <input id="gg-wt-path" type="text" class="gg-modal-input" placeholder="e.g. ../my-worktree"/>
          </div>
          <div class="gg-modal-field">
            <label>Branch</label>
            <input id="gg-wt-branch" type="text" class="gg-modal-input" placeholder="e.g. feature/my-branch"/>
          </div>
          <div class="gg-modal-field">
            <label><input type="checkbox" id="gg-wt-new-branch"> 建立新 Branch</label>
          </div>`,
        confirmText: 'Add',
        onConfirm: () => {
          const wtPath = document.getElementById('gg-wt-path')?.value.trim();
          const branch = document.getElementById('gg-wt-branch')?.value.trim();
          const createNew = document.getElementById('gg-wt-new-branch')?.checked || false;
          if (!wtPath || !branch) { Toast('路徑和 Branch 不可為空', 'warning'); return; }
          CloseModal();
          window.electronAPI.gitGuiWorktreeAdd(activeRepo.path, wtPath, branch, createNew)
            .then(r => { if (r.success) { Toast('Worktree 已新增', 'success'); LoadWorktrees(); } else Toast(r.error, 'error'); });
        }
      });
    });

    worktreePruneBtn.addEventListener('click', () => {
      if (!activeRepo) return;
      window.electronAPI.gitGuiWorktreePrune(activeRepo.path)
        .then(r => { if (r.success) { Toast('Prune 完成', 'success'); LoadWorktrees(); } else Toast(r.error, 'error'); });
    });
  }
  //#endregion

  //#region Bisect

  function ShowBisectModal() {
    if (!activeRepo) return;
    window.electronAPI.gitGuiBisectStatus(activeRepo.path)
      .then(status => {
        if (status.active) {
          ShowModal({
            title: 'Git Bisect（進行中）',
            body: `
              <div class="gg-bisect-log">${EscHtml(status.log || '').replace(/\n/g, '<br>')}</div>
              <p style="font-size:12px;color:var(--text-muted);margin-top:10px">請標記當前 commit 是否包含 bug：</p>
              <div class="gg-bisect-actions">
                <button class="gg-toolbar-btn danger" id="gg-bisect-bad-btn">${LucideIcon('x-circle', 13)} Bad（有 Bug）</button>
                <button class="gg-toolbar-btn success" id="gg-bisect-good-btn">${LucideIcon('check-circle', 13)} Good（無 Bug）</button>
                <button class="gg-toolbar-btn" id="gg-bisect-skip-btn">${LucideIcon('skip-forward', 13)} Skip</button>
              </div>`,
            confirmText: '停止 Bisect',
            onConfirm: () => {
              CloseModal();
              window.electronAPI.gitGuiBisectReset(activeRepo.path)
                .then(r => { if (r.success) { Toast('Bisect 已停止', 'success'); RefreshAll(); } else Toast(r.error, 'error'); });
            }
          });
          const markBtn = (id, mark) => {
            document.getElementById(id)?.addEventListener('click', () => {
              CloseModal();
              window.electronAPI.gitGuiBisectMark(activeRepo.path, mark)
                .then(r => {
                  if (r.success) {
                    if (r.output.includes('is the first bad commit')) {
                      Toast(`找到問題 Commit！\n${r.output}`, 'success');
                      window.electronAPI.gitGuiBisectReset(activeRepo.path);
                    } else { Toast(`Bisect (${mark}) 完成`, 'success'); ShowBisectModal(); }
                    RefreshAll();
                  } else Toast(r.error, 'error');
                });
            });
          };
          markBtn('gg-bisect-bad-btn', 'bad');
          markBtn('gg-bisect-good-btn', 'good');
          markBtn('gg-bisect-skip-btn', 'skip');
        } else {
          ShowModal({
            title: 'Git Bisect 開始',
            body: `
              <p style="font-size:12px;color:var(--text-muted);margin-bottom:12px">指定已知的 Bad commit 和 Good commit 以開始二分搜尋：</p>
              <div class="gg-modal-field">
                <label>Bad Commit（含 Bug）</label>
                <input id="gg-bisect-bad-ref" type="text" class="gg-modal-input" placeholder="HEAD 或 commit hash"/>
              </div>
              <div class="gg-modal-field">
                <label>Good Commit（無 Bug）</label>
                <input id="gg-bisect-good-ref" type="text" class="gg-modal-input" placeholder="e.g. v1.0.0 或 commit hash"/>
              </div>`,
            confirmText: '開始 Bisect',
            onConfirm: () => {
              const badRef = document.getElementById('gg-bisect-bad-ref')?.value.trim() || 'HEAD';
              const goodRef = document.getElementById('gg-bisect-good-ref')?.value.trim();
              if (!goodRef) { Toast('請輸入 Good Commit', 'warning'); return; }
              CloseModal();
              Toast('Bisect 開始...', 'info');
              window.electronAPI.gitGuiBisectStart(activeRepo.path, badRef, goodRef)
                .then(r => {
                  if (r.success) { Toast('Bisect 已開始，請標記當前 commit', 'success'); RefreshAll(); ShowBisectModal(); }
                  else Toast(r.error, 'error');
                });
            }
          });
        }
      });
  }
  //#endregion

  //#region LFS Locks Modal

  function ShowLfsLocksModal() {
    if (!activeRepo) return;
    Toast('載入 LFS Locks...', 'info');
    window.electronAPI.gitGuiLfsLocks(activeRepo.path)
      .then(locks => {
        const locksHtml = locks.length === 0
          ? '<p style="text-align:center;color:var(--text-muted);padding:20px;">無 LFS Locks</p>'
          : locks.map(lock => `
              <div class="gg-lfs-lock-item" data-path="${EscHtml(lock.path)}" data-id="${EscHtml(lock.id)}">
                <div class="gg-lock-info">
                  <div class="gg-lock-path">${EscHtml(lock.path)}</div>
                  <div class="gg-lock-meta">ID: ${EscHtml(lock.id)} • ${EscHtml(lock.email)}</div>
                </div>
                <div class="gg-lock-actions">
                  <button class="gg-icon-btn danger" data-action="unlock" data-path="${EscHtml(lock.path)}" title="Unlock">${LucideIcon('unlock', 13)}</button>
                </div>
              </div>
            `).join('');

        ShowModal({
          title: 'LFS Locks',
          body: `
            <div class="gg-lfs-locks-container">
              ${locksHtml}
            </div>
            <div class="gg-lfs-lock-new" style="margin-top:16px;">
              <input type="text" id="gg-lfs-lock-path" placeholder="檔案路徑..." class="gg-modal-input" style="width:100%;margin-bottom:8px;">
              <button class="gg-toolbar-btn primary" id="gg-lfs-lock-add-btn" style="width:100%;">${LucideIcon('lock', 13)} Lock File</button>
            </div>
          `,
          confirmText: '關閉',
          onConfirm: () => CloseModal()
        });

        // Locks 列表事件
        document.getElementById('gg-modal-body').addEventListener('click', e => {
          const btn = e.target.closest('[data-action]');
          if (!btn) return;
          const action = btn.dataset.action;
          const path = btn.dataset.path;

          if (action === 'unlock') {
            if (confirm(`確定要 Unlock "${path}"？`)) {
              Toast('Unlocking...', 'info');
              window.electronAPI.gitGuiLfsUnlock(activeRepo.path, path, false)
                .then(r => {
                  if (r.success) {
                    Toast('Unlock 成功', 'success');
                    CloseModal();
                    ShowLfsLocksModal(); // 重新載入
                  } else Toast(r.error, 'error');
                });
            }
          }
        });

        // 新增 Lock 按鈕事件
        const lockAddBtn = document.getElementById('gg-lfs-lock-add-btn');
        if (lockAddBtn) {
          lockAddBtn.addEventListener('click', () => {
            const pathInput = document.getElementById('gg-lfs-lock-path');
            const path = pathInput?.value.trim();
            if (!path) { Toast('請輸入檔案路徑', 'warning'); return; }

            Toast(`Locking ${path}...`, 'info');
            window.electronAPI.gitGuiLfsLock(activeRepo.path, path)
              .then(r => {
                if (r.success) {
                  Toast('Lock 成功', 'success');
                  CloseModal();
                  ShowLfsLocksModal(); // 重新載入
                } else Toast(r.error, 'error');
              });
          });
        }
      })
      .catch(err => Toast(`載入失敗：${err.message}`, 'error'));
  }
  //#endregion

  //#region Git Config Modal

  function ShowConfigModal() {
    if (!activeRepo) return;
    const COMMON_KEYS = [
      { key: 'user.name', label: 'User Name', type: 'text' },
      { key: 'user.email', label: 'User Email', type: 'text' },
      { key: 'core.autocrlf', label: 'Auto CRLF', type: 'select', opts: ['true', 'false', 'input'] },
      { key: 'pull.rebase', label: 'Pull Rebase', type: 'select', opts: ['true', 'false', 'merges'] },
      { key: 'push.default', label: 'Push Default', type: 'select', opts: ['simple', 'current', 'upstream', 'matching'] },
    ];

    let configScope = 'local';
    let configData = {};

    const buildBody = (data) => `
      <div class="gg-config-scope-tabs">
        <button class="gg-config-scope-btn ${configScope === 'local' ? 'active' : ''}" data-scope="local">Local</button>
        <button class="gg-config-scope-btn ${configScope === 'global' ? 'active' : ''}" data-scope="global">Global</button>
      </div>
      <div class="gg-config-fields">
        ${COMMON_KEYS.map(item => `
          <div class="gg-modal-field">
            <label>${item.label} <span class="gg-config-key">(${item.key})</span></label>
            ${item.type === 'select'
        ? `<select id="gg-cfg-${item.key.replace('.', '-')}" class="gg-modal-input gg-modal-select">
                  ${item.opts.map(o => `<option value="${o}" ${data[item.key] === o ? 'selected' : ''}>${o}</option>`).join('')}
                 </select>`
        : `<input id="gg-cfg-${item.key.replace('.', '-')}" type="text" class="gg-modal-input" value="${EscHtml(data[item.key] || '')}" placeholder="(未設定)">`
      }
          </div>
        `).join('')}
      </div>`;

    const loadAndShow = (scope) => {
      configScope = scope;
      window.electronAPI.gitGuiConfigGet(activeRepo.path, scope)
        .then(data => {
          configData = data;
          if (document.getElementById('gg-modal-body')) {
            document.getElementById('gg-modal-body').innerHTML = buildBody(data);
            BindConfigModalEvents();
          } else {
            ShowModal({
              title: 'Git Config',
              body: buildBody(data),
              confirmText: '儲存',
              onConfirm: () => SaveConfig()
            });
            BindConfigModalEvents();
          }
        });
    };

    const BindConfigModalEvents = () => {
      document.querySelectorAll('.gg-config-scope-btn').forEach(btn => {
        btn.addEventListener('click', () => loadAndShow(btn.dataset.scope));
      });
    };

    const SaveConfig = () => {
      COMMON_KEYS.forEach(item => {
        const el = document.getElementById(`gg-cfg-${item.key.replace('.', '-')}`);
        if (!el) return;
        const val = el.value.trim();
        if (val) {
          window.electronAPI.gitGuiConfigSet(activeRepo.path, configScope, item.key, val)
            .then(r => { if (!r.success) Toast(`${item.key} 儲存失敗：${r.error}`, 'error'); });
        }
      });
      Toast('Config 已儲存', 'success');
      CloseModal();
    };

    window.electronAPI.gitGuiConfigGet(activeRepo.path, configScope)
      .then(data => {
        configData = data;
        ShowModal({
          title: 'Git Config',
          body: buildBody(data),
          confirmText: '儲存',
          onConfirm: () => SaveConfig()
        });
        BindConfigModalEvents();
      });
  }
  //#endregion

  //#region Clean / GC Modal

  function ShowCleanModal() {
    if (!activeRepo) return;
    Toast('預覽 Clean 清單...', 'info');
    window.electronAPI.gitGuiCleanPreview(activeRepo.path)
      .then(files => {
        const filesHtml = files.length === 0
          ? '<p style="text-align:center;color:var(--text-muted);padding:16px">無 Untracked 檔案</p>'
          : `<div class="gg-clean-list">${files.map(f => `<div class="gg-clean-file">${LucideIcon('file', 11)} ${EscHtml(f)}</div>`).join('')}</div>`;

        ShowModal({
          title: 'Clean Untracked Files',
          body: `
            ${filesHtml}
            ${files.length > 0 ? `
            <div class="gg-modal-field" style="margin-top:12px">
              <label><input type="checkbox" id="gg-clean-dirs"> 同時清除 Untracked 目錄</label>
            </div>` : ''}
            <div class="gg-modal-field" style="margin-top:8px;border-top:1px solid var(--border-color);padding-top:12px">
              <label>Git GC（garbage collection）</label>
              <button class="gg-toolbar-btn" id="gg-gc-btn" style="margin-top:6px;width:100%">${LucideIcon('cpu', 13)} Run GC</button>
            </div>`,
          confirmText: files.length > 0 ? '清除 Untracked' : '關閉',
          onConfirm: () => {
            if (files.length === 0) { CloseModal(); return; }
            const inclDirs = document.getElementById('gg-clean-dirs')?.checked || false;
            if (confirm(`確定要刪除 ${files.length} 個 Untracked 檔案？此操作不可逆！`)) {
              CloseModal();
              window.electronAPI.gitGuiClean(activeRepo.path, true, inclDirs)
                .then(r => {
                  if (r.success) { Toast('Clean 完成', 'success'); LoadChanges(); }
                  else Toast(r.error, 'error');
                });
            }
          }
        });

        const gcBtn = document.getElementById('gg-gc-btn');
        if (gcBtn) {
          gcBtn.addEventListener('click', () => {
            CloseModal();
            Toast('Running GC...', 'info');
            window.electronAPI.gitGuiGc(activeRepo.path)
              .then(r => { if (r.success) Toast('GC 完成', 'success'); else Toast(r.error, 'error'); });
          });
        }
      })
      .catch(err => Toast(`預覽失敗：${err.message}`, 'error'));
  }
  //#endregion

  //#region Push / Pull Options Modal

  function ShowPullOptionsModal() {
    window.electronAPI.gitGuiRemotes(activeRepo.path)
      .then(remotes => {
        const remoteOpts = remotes.map(r => `<option value="${EscHtml(r.name)}">${EscHtml(r.name)}</option>`).join('');
        ShowModal({
          title: 'Pull Options',
          body: `
            <div class="gg-modal-field">
              <label>Remote</label>
              <select id="gg-m-pull-remote" class="gg-modal-input">
                ${remoteOpts || '<option value="">（無 Remote）</option>'}
              </select>
            </div>
            <div class="gg-modal-field">
              <label>Strategy</label>
              <select id="gg-m-pull-strategy" class="gg-modal-input">
                <option value="merge">Merge（預設）</option>
                <option value="rebase">Rebase</option>
                <option value="ff-only">Fast-forward Only</option>
              </select>
            </div>`,
          confirmText: 'Pull',
          onConfirm: () => {
            const remote = document.getElementById('gg-m-pull-remote')?.value || '';
            const strategy = document.getElementById('gg-m-pull-strategy')?.value || 'merge';
            CloseModal();
            SetBtnLoading(btnPull, '...');
            window.electronAPI.gitGuiPullOptions(activeRepo.path, remote, '', strategy)
              .then(r => {
                ResetBtn(btnPull);
                if (r.success) { Toast('Pull 完成', 'success'); RefreshAll(); }
                else Toast(`Pull 失敗：${r.error}`, 'error');
              })
              .catch(e => { ResetBtn(btnPull); Toast(e.message, 'error'); });
          }
        });
      })
      .catch(() => {
        // fallback：直接 pull
        SetBtnLoading(btnPull, '...');
        window.electronAPI.gitGuiPull(activeRepo.path)
          .then(r => { ResetBtn(btnPull); if (r.success) { Toast('Pull 完成', 'success'); RefreshAll(); } else Toast(`Pull 失敗：${r.error}`, 'error'); })
          .catch(e => { ResetBtn(btnPull); Toast(e.message, 'error'); });
      });
  }

  function ShowPushOptionsModal() {
    window.electronAPI.gitGuiRemotes(activeRepo.path)
      .then(remotes => {
        const remoteOpts = remotes.map(r => `<option value="${EscHtml(r.name)}">${EscHtml(r.name)}</option>`).join('');
        ShowModal({
          title: 'Push Options',
          body: `
            <div class="gg-modal-field">
              <label>Remote</label>
              <select id="gg-m-push-remote" class="gg-modal-input">
                ${remoteOpts || '<option value="">（無 Remote）</option>'}
              </select>
            </div>
            <div class="gg-modal-field gg-modal-checkbox">
              <input type="checkbox" id="gg-m-push-force"/>
              <label for="gg-m-push-force">Force Push（--force-with-lease）</label>
            </div>
            <div class="gg-modal-field gg-modal-checkbox">
              <input type="checkbox" id="gg-m-push-upstream"/>
              <label for="gg-m-push-upstream">Set Upstream（-u）</label>
            </div>`,
          confirmText: 'Push',
          onConfirm: () => {
            const remote = document.getElementById('gg-m-push-remote')?.value || '';
            const force = document.getElementById('gg-m-push-force')?.checked || false;
            const setUpstream = document.getElementById('gg-m-push-upstream')?.checked || false;
            CloseModal();
            SetBtnLoading(btnPush, '...');
            window.electronAPI.gitGuiPushOptions(activeRepo.path, remote, '', force, setUpstream)
              .then(r => {
                ResetBtn(btnPush);
                if (r.success) { Toast('Push 完成', 'success'); RefreshAll(); }
                else Toast(`Push 失敗：${r.error}`, 'error');
              })
              .catch(e => { ResetBtn(btnPush); Toast(e.message, 'error'); });
          }
        });
      })
      .catch(() => {
        SetBtnLoading(btnPush, '...');
        window.electronAPI.gitGuiPush(activeRepo.path, false)
          .then(r => { ResetBtn(btnPush); if (r.success) { Toast('Push 完成', 'success'); RefreshAll(); } else Toast(`Push 失敗：${r.error}`, 'error'); })
          .catch(e => { ResetBtn(btnPush); Toast(e.message, 'error'); });
      });
  }
  //#endregion

  //#region Commit Amend 模式

  /** 在 Commit box 注入 Amend checkbox（只在第一次初始化）*/
  function InitAmendCheckbox() {
    const commitBox = document.getElementById('gg-commit-box');
    if (!commitBox || commitBox._amendInited) return;
    commitBox._amendInited = true;

    const checkbox = document.createElement('label');
    checkbox.className = 'gg-amend-label';
    checkbox.innerHTML = `<input type="checkbox" id="gg-amend-checkbox"/> Amend last commit`;
    commitBox.insertBefore(checkbox, commitBox.querySelector('#gg-commit-btn'));

    document.getElementById('gg-amend-checkbox').addEventListener('change', e => {
      amendMode = e.target.checked;
      if (amendMode) {
        window.electronAPI.gitGuiLastCommitMessage(activeRepo.path)
          .then(msg => { commitMsgEl.value = msg; });
      } else {
        commitMsgEl.value = '';
      }
    });
  }

  /** LoadChanges 後呼叫以注入 Amend checkbox */
  document.addEventListener('gg-changes-loaded', InitAmendCheckbox);
  //#endregion

  //#region Commit Log 搜尋

  if (logSearchBtn) {
    logSearchBtn.addEventListener('click', () => {
      logSearchMode = !logSearchMode;
      logSearchBar.classList.toggle('hidden', !logSearchMode);
      if (logSearchMode) {
        logSearchInput.focus();
      } else {
        logSearchInput.value = '';
        LoadLog();
      }
    });

    if (reflogBtn) {
      reflogBtn.addEventListener('click', () => {
        reflogMode = !reflogMode;
        reflogBtn.classList.toggle('active', reflogMode);
        if (reflogMode) {
          LoadReflog();
        } else {
          LoadLog();
        }
      });
    }

    if (bisectBtn) {
      bisectBtn.addEventListener('click', () => {
        if (!activeRepo) return;
        ShowBisectModal();
      });
    }
  }

  if (logSearchClear) {
    logSearchClear.addEventListener('click', () => {
      logSearchMode = false;
      logSearchBar.classList.add('hidden');
      logSearchInput.value = '';
      LoadLog();
    });
  }

  let logSearchTimer = null;
  if (logSearchInput) {
    logSearchInput.addEventListener('input', () => {
      clearTimeout(logSearchTimer);
      logSearchTimer = setTimeout(() => {
        const kw = logSearchInput.value.trim();
        if (!kw || !activeRepo) { LoadLog(); return; }
        const field = logSearchField?.value || 'message';
        SetLoading(logListEl);
        window.electronAPI.gitGuiSearchCommits(activeRepo.path, kw, field)
          .then(commits => RenderLogList(commits))
          .catch(() => { logListEl.innerHTML = '<div class="gg-empty"><p>搜尋失敗</p></div>'; });
      }, 400);
    });
    logSearchInput.addEventListener('keydown', e => {
      if (e.key === 'Escape') logSearchClear?.click();
    });
  }
  //#endregion

  //#region Commit Log 右鍵選單（Reset / Cherry-pick / Revert）

  /** 覆寫 / 擴充 logListEl 的 contextmenu 事件以支援新操作 */
  function InitLogContextMenu() {
    const logList = document.getElementById('gg-log-list');
    if (!logList || logList._ctxInited) return;
    logList._ctxInited = true;

    logList.addEventListener('contextmenu', e => {
      const row = e.target.closest('.gg-log-row');
      if (!row) return;
      e.preventDefault();
      const hash = row.dataset.hash;
      const shortHash = row.dataset.shortHash || hash?.substring(0, 7);
      ShowLogContextMenu(e, hash, shortHash);
    });
  }

  function ShowLogContextMenu(e, hash, shortHash) {
    document.querySelectorAll('.gg-ctx-menu').forEach(m => m.remove());
    const menu = document.createElement('div');
    menu.className = 'gg-ctx-menu';
    menu.style.left = e.clientX + 'px';
    menu.style.top = e.clientY + 'px';
    menu.innerHTML = [
      `<div class="gg-ctx-item" data-action="cherry-pick">${LucideIcon('git-commit', 12)} Cherry-pick</div>`,
      `<div class="gg-ctx-item" data-action="revert">${LucideIcon('rotate-ccw', 12)} Revert Commit</div>`,
      '<div class="gg-ctx-sep"></div>',
      `<div class="gg-ctx-item" data-action="reset-soft">${LucideIcon('arrow-left', 12)} Reset → Soft</div>`,
      `<div class="gg-ctx-item" data-action="reset-mixed">${LucideIcon('arrow-left', 12)} Reset → Mixed</div>`,
      `<div class="gg-ctx-item danger" data-action="reset-hard">${LucideIcon('alert-triangle', 12)} Reset → Hard</div>`,
      '<div class="gg-ctx-sep"></div>',
      `<div class="gg-ctx-item" data-action="copy-hash">${LucideIcon('copy', 12)} Copy Hash</div>`,
    ].join('');
    document.body.appendChild(menu);

    menu.addEventListener('click', ev => {
      const action = ev.target.closest('[data-action]')?.dataset.action;
      menu.remove();
      if (!action || !activeRepo || !hash) return;

      if (action === 'copy-hash') {
        navigator.clipboard.writeText(hash);
        Toast('Hash 已複製', 'success');
        return;
      }
      if (action === 'cherry-pick') {
        if (confirm(`確定要 Cherry-pick ${shortHash}？`)) {
          window.electronAPI.gitGuiCherryPick(activeRepo.path, hash)
            .then(r => {
              if (r.success) { Toast('Cherry-pick 成功', 'success'); RefreshAll(); }
              else { Toast(`Cherry-pick 失敗：${r.error}`, 'error'); CheckInProgress(); }
            });
        }
        return;
      }
      if (action === 'revert') {
        if (confirm(`確定要 Revert ${shortHash}？`)) {
          window.electronAPI.gitGuiRevert(activeRepo.path, hash)
            .then(r => {
              if (r.success) { Toast('Revert 成功', 'success'); RefreshAll(); }
              else { Toast(`Revert 失敗：${r.error}`, 'error'); CheckInProgress(); }
            });
        }
        return;
      }
      const modeMap = { 'reset-soft': 'soft', 'reset-mixed': 'mixed', 'reset-hard': 'hard' };
      const mode = modeMap[action];
      if (mode) {
        const warn = mode === 'hard' ? '\n⚠ Hard reset 將丟棄所有未提交的變更！' : '';
        if (confirm(`確定要 Reset（${mode}）到 ${shortHash}？${warn}`)) {
          window.electronAPI.gitGuiReset(activeRepo.path, hash, mode)
            .then(r => {
              if (r.success) { Toast(`Reset (${mode}) 成功`, 'success'); RefreshAll(); }
              else Toast(`Reset 失敗：${r.error}`, 'error');
            });
        }
      }
    });

    const close = ev => { if (!menu.contains(ev.target)) { menu.remove(); document.removeEventListener('mousedown', close); } };
    setTimeout(() => document.addEventListener('mousedown', close), 0);
  }

  //#endregion

  //#region Stash with Message Modal

  const _stashSaveBtnHandler = () => {
    if (!activeRepo) return;
    ShowModal({
      title: 'Stash Changes',
      body: `
        <div class="gg-modal-field">
          <label>Message（可選）</label>
          <input id="gg-m-stash-msg" type="text" placeholder="WIP: ..." class="gg-modal-input"/>
        </div>`,
      confirmText: 'Stash',
      onConfirm: () => {
        const msg = document.getElementById('gg-m-stash-msg')?.value.trim() || '';
        CloseModal();
        window.electronAPI.gitGuiStashPush(activeRepo.path, msg)
          .then(r => {
            if (r.success) { Toast('Stash 成功', 'success'); LoadStashes(); LoadChanges(); }
            else Toast(`Stash 失敗：${r.error}`, 'error');
          })
          .catch(e => Toast(e.message, 'error'));
      }
    });
  };
  stashSaveBtn.addEventListener('click', _stashSaveBtnHandler);
  //#endregion

  //#region Repo Sidebar 收縮 / Resizer

  /** Repo sidebar 收縮/展開 */
  let sidebarCollapsed = false;

  function ToggleSidebar() {
    sidebarCollapsed = !sidebarCollapsed;
    sidebarEl.classList.toggle('collapsed', sidebarCollapsed);
    if (sidebarCollapseBtn) {
      sidebarCollapseBtn.innerHTML = sidebarCollapsed
        ? LucideIcon('arrow-right', 13)
        : LucideIcon('arrow-left', 13);
      sidebarCollapseBtn.title = sidebarCollapsed ? '展開側邊欄' : '收縮側邊欄';
    }
  }

  if (sidebarCollapseBtn) {
    sidebarCollapseBtn.addEventListener('click', ToggleSidebar);
  }

  // 點擊收縮 icon 欄也可展開
  const sidebarCollapsedIcon = sidebarEl ? sidebarEl.querySelector('.gg-sidebar-collapsed-icon') : null;
  if (sidebarCollapsedIcon) {
    sidebarCollapsedIcon.addEventListener('click', () => {
      if (sidebarCollapsed) ToggleSidebar();
    });
  }

  /** 通用水平 resizer 拖拉工廠 */
  function MakeHorizResizer(resizerEl, getTargetEl, minW, maxW, onDone) {
    if (!resizerEl) return;
    resizerEl.addEventListener('mousedown', e => {
      e.preventDefault();
      const targetEl = typeof getTargetEl === 'function' ? getTargetEl() : getTargetEl;
      const startX = e.clientX;
      const startW = targetEl.offsetWidth;
      resizerEl.classList.add('dragging');
      document.body.style.cursor = 'col-resize';

      const onMove = mv => {
        const delta = mv.clientX - startX;
        const newW = Math.min(maxW, Math.max(minW, startW + delta));
        targetEl.style.width = newW + 'px';
        targetEl.style.minWidth = newW + 'px';
      };
      const onUp = () => {
        resizerEl.classList.remove('dragging');
        document.body.style.cursor = '';
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        if (onDone) onDone();
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }

  // Repo sidebar resizer（只在非收縮時有效）
  MakeHorizResizer(
    sidebarResizerEl,
    () => sidebarEl,
    160, 400,
    null
  );

  // Log Branch sidebar resizer
  MakeHorizResizer(
    logBranchResizerEl,
    () => document.getElementById('gg-log-branch-sidebar'),
    150, 500,
    null
  );

  // Changes 左右 resizer
  MakeHorizResizer(
    document.getElementById('gg-changes-resizer'),
    () => document.getElementById('gg-changes-left'),
    160, 600,
    null
  );

  /** 通用垂直 resizer 拖拉工廠 */
  function MakeVertResizer(resizerEl, getTopEl, minH, maxH) {
    if (!resizerEl) return;
    resizerEl.addEventListener('mousedown', e => {
      e.preventDefault();
      const topEl = typeof getTopEl === 'function' ? getTopEl() : getTopEl;
      const startY = e.clientY;
      const startH = topEl.offsetHeight;
      resizerEl.classList.add('dragging');
      document.body.style.cursor = 'row-resize';

      const onMove = mv => {
        const delta = mv.clientY - startY;
        const newH = Math.min(maxH, Math.max(minH, startH + delta));
        topEl.style.height = newH + 'px';
        topEl.style.flexBasis = newH + 'px';
        topEl.style.flexShrink = '0';
      };
      const onUp = () => {
        resizerEl.classList.remove('dragging');
        document.body.style.cursor = '';
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }

  // Changes Unstaged/Staged 上下 resizer
  MakeVertResizer(
    document.getElementById('gg-changes-splitter'),
    () => document.getElementById('gg-section-unstaged'),
    60, 2000
  );
  //#endregion

  // 初始載入
  LoadSavedRepos();
});
