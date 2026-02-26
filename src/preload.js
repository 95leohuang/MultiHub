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
  // Git Repo Info
  getRepoInfo: (repoPath) => ipcRenderer.invoke('get-repo-info', repoPath),
  // Toast 通知監聽
  onToast: (callback) => ipcRenderer.on('toast', (event, { message, type }) => callback(message, type)),
  // Git GUI API
  gitGuiLog: (repoPath, options) => ipcRenderer.invoke('git-gui-log', repoPath, options),
  gitGuiCommitDiff: (repoPath, hash) => ipcRenderer.invoke('git-gui-commit-diff', repoPath, hash),
  gitGuiFileDiff: (repoPath, hash, filePath) => ipcRenderer.invoke('git-gui-file-diff', repoPath, hash, filePath),
  gitGuiWorkdirDiff: (repoPath, filePath) => ipcRenderer.invoke('git-gui-workdir-diff', repoPath, filePath),
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
  gitGuiTags: (repoPath) => ipcRenderer.invoke('git-gui-tags', repoPath)
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





