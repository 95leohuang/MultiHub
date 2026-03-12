const { contextBridge, ipcRenderer, shell } = require('electron');

/**
 * 主視窗預載腳本
 * 用於 index.html（Tab 容器頁面）
 */

// 監聽頁面載入完成
window.addEventListener('DOMContentLoaded', () => {
  console.log('Main preload script loaded');
});

// 暴露安全的 API 到渲染進程
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  },
  // 更新未讀訊息徽章
  updateBadge: (count) => {
    ipcRenderer.send('update-badge', count);
  },
  // 開啟外部連結
  openExternal: (url) => {
    ipcRenderer.send('open-external', url);
  },
  // 可以添加更多需要的API
  onNewConversation: (callback) => {
    ipcRenderer.on('new-conversation', callback);
  },
  onShowSettings: (callback) => {
    ipcRenderer.on('show-settings', callback);
  },
  // 監聽 Tab 切換快捷鍵（從 main process 發送）
  onSwitchTab: (callback) => {
    ipcRenderer.on('switch-tab', (event, tabIndex) => callback(tabIndex));
  },
  // Git 相關 API
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  searchRepos: (path) => ipcRenderer.invoke('search-repos', path),
  updateRepo: (repoPath, onProgress) => {
    const channel = `update-progress-${repoPath}`;
    const listener = (event, progress, message) => onProgress(progress, message);
    ipcRenderer.on(channel, listener);
    return ipcRenderer.invoke('update-repo', repoPath).finally(() => {
      ipcRenderer.removeListener(channel, listener);
    });
  },
  getSavedPath: () => ipcRenderer.invoke('get-saved-path'),
  savePath: (path) => ipcRenderer.invoke('save-path', path),
  getShortcutConfig: () => ipcRenderer.invoke('get-shortcut-config'),
  saveShortcutConfig: (config) => ipcRenderer.invoke('save-shortcut-config', config),
  // Skill 同步相關 API
  compareSkills: (rootPath) => ipcRenderer.invoke('compare-skills', rootPath),
  readSkillContent: (data) => ipcRenderer.invoke('read-skill-content', data),
  syncSkillFile: (data) => ipcRenderer.invoke('sync-skill-file', data),
  // Quick Notes: 圖片處理 API
  saveImage: (data) => ipcRenderer.invoke('save-image', data),
  selectImage: () => ipcRenderer.invoke('select-image'),
  // Git Repo Info
  getRepoInfo: (repoPath) => ipcRenderer.invoke('get-repo-info', repoPath),
  // Toast 通知監聽
  onToast: (callback) => ipcRenderer.on('toast', (event, { message, type }) => callback(message, type)),
  // Git GUI API
  gitGuiLog: (repoPath, options) => ipcRenderer.invoke('git-gui-log', repoPath, options),
  gitGuiCommitDiff: (repoPath, hash) => ipcRenderer.invoke('git-gui-commit-diff', repoPath, hash),
  gitGuiFileDiff: (repoPath, hash, filePath) => ipcRenderer.invoke('git-gui-file-diff', repoPath, hash, filePath),
  gitGuiWorkdirDiff: (repoPath, filePath, staged) => ipcRenderer.invoke('git-gui-workdir-diff', repoPath, filePath, staged),
  gitGuiBranches: (repoPath) => ipcRenderer.invoke('git-gui-branches', repoPath),
  gitGuiCheckout: (repoPath, branch) => ipcRenderer.invoke('git-gui-checkout', repoPath, branch),
  gitGuiCreateBranch: (repoPath, name, from) => ipcRenderer.invoke('git-gui-create-branch', repoPath, name, from),
  gitGuiDeleteBranch: (repoPath, name, force) => ipcRenderer.invoke('git-gui-delete-branch', repoPath, name, force),
  gitGuiStatus: (repoPath) => ipcRenderer.invoke('git-gui-status', repoPath),
  gitGuiStage: (repoPath, filePath) => ipcRenderer.invoke('git-gui-stage', repoPath, filePath),
  gitGuiUnstage: (repoPath, filePath) => ipcRenderer.invoke('git-gui-unstage', repoPath, filePath),
  gitGuiStageAll: (repoPath) => ipcRenderer.invoke('git-gui-stage-all', repoPath),
  gitGuiUnstageAll: (repoPath) => ipcRenderer.invoke('git-gui-unstage-all', repoPath),
  gitGuiCommit: (repoPath, message) => ipcRenderer.invoke('git-gui-commit', repoPath, message),
  gitGuiFetch: (repoPath) => ipcRenderer.invoke('git-gui-fetch', repoPath),
  gitGuiPull: (repoPath) => ipcRenderer.invoke('git-gui-pull', repoPath),
  gitGuiPush: (repoPath, force) => ipcRenderer.invoke('git-gui-push', repoPath, force),
  gitGuiCommitDetail: (repoPath, hash) => ipcRenderer.invoke('git-gui-commit-detail', repoPath, hash),
  gitGuiStashes: (repoPath) => ipcRenderer.invoke('git-gui-stashes', repoPath),
  gitGuiStashPush: (repoPath, message) => ipcRenderer.invoke('git-gui-stash-push', repoPath, message),
  gitGuiStashPop: (repoPath, ref) => ipcRenderer.invoke('git-gui-stash-pop', repoPath, ref),
  gitGuiStashDrop: (repoPath, ref) => ipcRenderer.invoke('git-gui-stash-drop', repoPath, ref),
  gitGuiStashApply: (repoPath, ref) => ipcRenderer.invoke('git-gui-stash-apply', repoPath, ref),
  gitGuiStashClear: (repoPath) => ipcRenderer.invoke('git-gui-stash-clear', repoPath),
  gitGuiStashFiles: (repoPath, ref) => ipcRenderer.invoke('git-gui-stash-files', repoPath, ref),
  gitGuiStashFileDiff: (repoPath, ref, filePath) => ipcRenderer.invoke('git-gui-stash-file-diff', repoPath, ref, filePath),
  gitGuiFileBlob: (repoPath, hash, filePath) => ipcRenderer.invoke('git-gui-file-blob', repoPath, hash, filePath),
  gitGuiWorkdirBlob: (repoPath, filePath) => ipcRenderer.invoke('git-gui-workdir-blob', repoPath, filePath),
  gitGuiTags: (repoPath) => ipcRenderer.invoke('git-gui-tags', repoPath),
  gitGuiDiscard: (repoPath, filePath, staged) => ipcRenderer.invoke('git-gui-discard', repoPath, filePath, staged),
  gitGuiOpenFile: (repoPath, filePath) => ipcRenderer.invoke('git-gui-open-file', repoPath, filePath),
  gitGuiRevealFile: (repoPath, filePath) => ipcRenderer.invoke('git-gui-reveal-file', repoPath, filePath),
  // Tag 操作
  gitGuiCreateTag: (repoPath, name, ref, message) => ipcRenderer.invoke('git-gui-create-tag', repoPath, name, ref, message),
  gitGuiDeleteTag: (repoPath, name) => ipcRenderer.invoke('git-gui-delete-tag', repoPath, name),
  gitGuiPushTag: (repoPath, name, remote) => ipcRenderer.invoke('git-gui-push-tag', repoPath, name, remote),
  gitGuiPushAllTags: (repoPath, remote) => ipcRenderer.invoke('git-gui-push-all-tags', repoPath, remote),
  // Remote 管理
  gitGuiRemotes: (repoPath) => ipcRenderer.invoke('git-gui-remotes', repoPath),
  gitGuiAddRemote: (repoPath, name, url) => ipcRenderer.invoke('git-gui-add-remote', repoPath, name, url),
  gitGuiEditRemote: (repoPath, name, newName, newUrl) => ipcRenderer.invoke('git-gui-edit-remote', repoPath, name, newName, newUrl),
  gitGuiDeleteRemote: (repoPath, name) => ipcRenderer.invoke('git-gui-delete-remote', repoPath, name),
  gitGuiPruneRemote: (repoPath, name) => ipcRenderer.invoke('git-gui-prune-remote', repoPath, name),
  gitGuiFetchRemote: (repoPath, remote) => ipcRenderer.invoke('git-gui-fetch-remote', repoPath, remote),
  // Merge
  gitGuiMerge: (repoPath, branch, strategy) => ipcRenderer.invoke('git-gui-merge', repoPath, branch, strategy),
  gitGuiAbortMerge: (repoPath) => ipcRenderer.invoke('git-gui-abort-merge', repoPath),
  // Reset
  gitGuiReset: (repoPath, hash, mode) => ipcRenderer.invoke('git-gui-reset', repoPath, hash, mode),
  // Cherry-pick
  gitGuiCherryPick: (repoPath, hash) => ipcRenderer.invoke('git-gui-cherry-pick', repoPath, hash),
  gitGuiCherryPickAbort: (repoPath) => ipcRenderer.invoke('git-gui-cherry-pick-abort', repoPath),
  // Revert
  gitGuiRevert: (repoPath, hash) => ipcRenderer.invoke('git-gui-revert', repoPath, hash),
  // Rename Branch
  gitGuiRenameBranch: (repoPath, oldName, newName) => ipcRenderer.invoke('git-gui-rename-branch', repoPath, oldName, newName),
  // Set Upstream
  gitGuiSetUpstream: (repoPath, localBranch, upstream) => ipcRenderer.invoke('git-gui-set-upstream', repoPath, localBranch, upstream),
  // Commit Amend
  gitGuiCommitAmend: (repoPath, message) => ipcRenderer.invoke('git-gui-commit-amend', repoPath, message),
  gitGuiLastCommitMessage: (repoPath) => ipcRenderer.invoke('git-gui-last-commit-message', repoPath),
  // Commit 搜尋
  gitGuiSearchCommits: (repoPath, keyword, field) => ipcRenderer.invoke('git-gui-search-commits', repoPath, keyword, field),
  // Push/Pull with options
  gitGuiPushOptions: (repoPath, remote, branch, force, setUpstream) => ipcRenderer.invoke('git-gui-push-options', repoPath, remote, branch, force, setUpstream),
  gitGuiPullOptions: (repoPath, remote, branch, strategy) => ipcRenderer.invoke('git-gui-pull-options', repoPath, remote, branch, strategy),
  // Watcher
  gitGuiWatchStart: (repoPath) => ipcRenderer.invoke('git-gui-watch-start', repoPath),
  gitGuiWatchStop: (repoPath) => ipcRenderer.invoke('git-gui-watch-stop', repoPath),
  onGitGuiRepoChanged: (callback) => ipcRenderer.on('git-gui-repo-changed', (event, repoPath) => callback(repoPath)),
  offGitGuiRepoChanged: (callback) => ipcRenderer.removeListener('git-gui-repo-changed', callback),
  // Rebase
  gitGuiRebase: (repoPath, branch) => ipcRenderer.invoke('git-gui-rebase', repoPath, branch),
  gitGuiRebaseAbort: (repoPath) => ipcRenderer.invoke('git-gui-rebase-abort', repoPath),
  gitGuiRebaseContinue: (repoPath) => ipcRenderer.invoke('git-gui-rebase-continue', repoPath),
  // In-Progress 狀態
  gitGuiInProgress: (repoPath) => ipcRenderer.invoke('git-gui-in-progress', repoPath),
  // Submodule 管理
  gitGuiSubmodules: (repoPath) => ipcRenderer.invoke('git-gui-submodules', repoPath),
  gitGuiSubmoduleUpdate: (repoPath, path, init) => ipcRenderer.invoke('git-gui-submodule-update', repoPath, path, init),
  gitGuiSubmoduleSync: (repoPath, path) => ipcRenderer.invoke('git-gui-submodule-sync', repoPath, path),
  gitGuiSubmoduleInit: (repoPath, path) => ipcRenderer.invoke('git-gui-submodule-init', repoPath, path),
  gitGuiSubmoduleDeinit: (repoPath, path) => ipcRenderer.invoke('git-gui-submodule-deinit', repoPath, path),
  // LFS 管理
  gitGuiLfsLocks: (repoPath) => ipcRenderer.invoke('git-gui-lfs-locks', repoPath),
  gitGuiLfsLock: (repoPath, path) => ipcRenderer.invoke('git-gui-lfs-lock', repoPath, path),
  gitGuiLfsUnlock: (repoPath, path, force) => ipcRenderer.invoke('git-gui-lfs-unlock', repoPath, path, force),
  gitGuiLfsPull: (repoPath) => ipcRenderer.invoke('git-gui-lfs-pull', repoPath),
  gitGuiLfsPush: (repoPath) => ipcRenderer.invoke('git-gui-lfs-push', repoPath),
  // Bisect
  gitGuiBisectStart: (repoPath, badRef, goodRef) => ipcRenderer.invoke('git-gui-bisect-start', repoPath, badRef, goodRef),
  gitGuiBisectMark: (repoPath, mark) => ipcRenderer.invoke('git-gui-bisect-mark', repoPath, mark),
  gitGuiBisectReset: (repoPath) => ipcRenderer.invoke('git-gui-bisect-reset', repoPath),
  gitGuiBisectStatus: (repoPath) => ipcRenderer.invoke('git-gui-bisect-status', repoPath),
  // Worktree 管理
  gitGuiWorktrees: (repoPath) => ipcRenderer.invoke('git-gui-worktrees', repoPath),
  gitGuiWorktreeAdd: (repoPath, wtPath, branch, createBranch) => ipcRenderer.invoke('git-gui-worktree-add', repoPath, wtPath, branch, createBranch),
  gitGuiWorktreeRemove: (repoPath, wtPath, force) => ipcRenderer.invoke('git-gui-worktree-remove', repoPath, wtPath, force),
  gitGuiWorktreePrune: (repoPath) => ipcRenderer.invoke('git-gui-worktree-prune', repoPath),
  // Git Config 編輯
  gitGuiConfigGet: (repoPath, scope) => ipcRenderer.invoke('git-gui-config-get', repoPath, scope),
  gitGuiConfigSet: (repoPath, scope, key, value) => ipcRenderer.invoke('git-gui-config-set', repoPath, scope, key, value),
  gitGuiConfigUnset: (repoPath, scope, key) => ipcRenderer.invoke('git-gui-config-unset', repoPath, scope, key),
  // Clean / GC
  gitGuiCleanPreview: (repoPath) => ipcRenderer.invoke('git-gui-clean-preview', repoPath),
  gitGuiClean: (repoPath, force, directories) => ipcRenderer.invoke('git-gui-clean', repoPath, force, directories),
  gitGuiGc: (repoPath) => ipcRenderer.invoke('git-gui-gc', repoPath),
  // Reflog 檢視
  gitGuiReflog: (repoPath, limit) => ipcRenderer.invoke('git-gui-reflog', repoPath, limit),
  gitGuiResetToReflog: (repoPath, refHash, mode) => ipcRenderer.invoke('git-gui-reset-to-reflog', repoPath, refHash, mode),
  // AI Butler API
  aiButlerChat: (data) => ipcRenderer.invoke('ai-butler-chat', data),
  aiButlerGetConfig: () => ipcRenderer.invoke('ai-butler-get-config'),
  aiButlerSaveConfig: (config) => ipcRenderer.invoke('ai-butler-save-config', config),
  aiButlerGetModels: (provider) => ipcRenderer.invoke('ai-butler-get-models', provider),
  // AI Butler Tool Execution (main→renderer)
  onAiButlerExecuteTool: (callback) => {
    ipcRenderer.on('ai-butler-execute-tool', (event, data) => callback(data));
  },
  aiButlerToolResult: (channel, result) => {
    ipcRenderer.send(channel, result);
  }
});

// 快捷键增强
document.addEventListener('keydown', (event) => {
  // Ctrl/Cmd + F - 搜索对话
  if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
    const searchButton = document.querySelector('[aria-label*="搜索"], [aria-label*="Search"]');
    if (searchButton) {
      event.preventDefault();
      searchButton.click();
    }
  }

  // Ctrl/Cmd + N - 新对话（通过IPC从主进程触发）
  // Ctrl/Cmd + , - 设置（通过IPC从主进程触发）
});

// 阻止某些默认行为
window.addEventListener('beforeunload', (event) => {
  // 可以在这里添加退出前的清理逻辑
});

// 性能优化：禁用不必要的功能
window.addEventListener('load', () => {
  // 禁用某些追踪脚本（如果需要）
  console.log('Multi Hub - Page Loaded');
});

// 暗黑模式切换支持
const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

function handleThemeChange(e) {
  // Facebook Messenger 会自动处理暗黑模式
  // 这里可以添加额外的样式调整
}

prefersDarkScheme.addEventListener('change', handleThemeChange);

// 错误处理
window.addEventListener('error', (event) => {
  console.error('Page error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});





