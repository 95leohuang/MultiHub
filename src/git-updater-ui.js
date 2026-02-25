document.addEventListener('DOMContentLoaded', async () => {
  const gitUpdaterUI = document.getElementById('git-updater-ui');
  if (!gitUpdaterUI) return;

  // Inject UI structure
  gitUpdaterUI.innerHTML = `
        <div class="git-header">
            <h2>Git Repository Updater</h2>
            <div class="search-controls">
                <input type="text" id="git-search-path" class="git-input" placeholder="Search directory (e.g., E:\\Git)">
                <button id="git-browse-btn" class="git-btn secondary">Browse...</button>
                <button id="git-search-btn" class="git-btn">Search Repos</button>
                <button id="git-update-all-btn" class="git-btn" disabled>Update All</button>
            </div>
        </div>
        <div class="git-table-container">
            <table class="git-table">
                <thead>
                    <tr>
                        <th class="repo-path-cell">Project / Path</th>
                        <th style="width: 110px;">Branch</th>
                        <th>Status</th>
                        <th style="width: 80px;">Actions</th>
                    </tr>
                </thead>
                <tbody id="git-repo-list">
                    <tr>
                        <td colspan="3" style="text-align: center; color: #666; padding: 40px;">No repositories found. Start by searching a directory.</td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div class="git-log-section">
            <div class="log-tabs" id="log-tabs">
                <div class="log-tab active" data-tab="global">Global Log</div>
            </div>
            <div class="git-log-container" id="git-log">
                <div class="log-entry">Git Updater initialized.</div>
            </div>
        </div>
    `;

  const searchPathInput = document.getElementById('git-search-path');
  const browseBtn = document.getElementById('git-browse-btn');
  const searchBtn = document.getElementById('git-search-btn');
  const updateAllBtn = document.getElementById('git-update-all-btn');
  const repoList = document.getElementById('git-repo-list');
  const logContainer = document.getElementById('git-log');
  const logTabs = document.getElementById('log-tabs');

  let repositories = [];
  let repoLogs = { 'global': ['Git Updater initialized.'] };
  let currentLogTab = 'global';

  // Load saved path
  const savedPath = await window.electronAPI.getSavedPath();
  if (savedPath) {
    searchPathInput.value = savedPath;
    // Auto search if path exists
    setTimeout(() => {
      searchBtn.click();
    }, 100);
  }

  function addLog(repoPath, message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const formattedMsg = `[${timestamp}] ${message}`;

    // Add to global log
    repoLogs['global'].push(formattedMsg);

    // Add to specific repo log if applicable
    if (repoPath && repoPath !== 'global') {
      if (!repoLogs[repoPath]) repoLogs[repoPath] = [];
      repoLogs[repoPath].push(formattedMsg);
    }

    // Refresh view if current tab matches
    if (currentLogTab === 'global' || currentLogTab === repoPath) {
      refreshLogView();
    }
  }

  function refreshLogView() {
    logContainer.innerHTML = '';
    const logs = repoLogs[currentLogTab] || [];
    logs.forEach(msg => {
      const entry = document.createElement('div');
      entry.className = 'log-entry';
      if (msg.toLowerCase().includes('error')) entry.classList.add('error');
      if (msg.toLowerCase().includes('warning')) entry.classList.add('warning');
      entry.textContent = msg;
      logContainer.appendChild(entry);
    });
    logContainer.scrollTop = logContainer.scrollHeight;
  }

  function switchLogTab(tabId) {
    currentLogTab = tabId;
    document.querySelectorAll('.log-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tabId);
    });
    refreshLogView();
  }

  function addRepoTab(repoPath) {
    const parts = repoPath.split(/[\\/]/);
    const repoName = parts.length > 1 ? parts[parts.length - 2] : parts[0];
    if (document.querySelector(`.log-tab[data-tab="${repoPath}"]`)) return;

    const tab = document.createElement('div');
    tab.className = 'log-tab';
    tab.dataset.tab = repoPath;
    tab.textContent = repoName;
    tab.addEventListener('click', () => switchLogTab(repoPath));
    logTabs.appendChild(tab);
  }

  logTabs.querySelector('.log-tab').addEventListener('click', () => switchLogTab('global'));

  browseBtn.addEventListener('click', async () => {
    const path = await window.electronAPI.selectDirectory();
    if (path) {
      searchPathInput.value = path;
      window.electronAPI.savePath(path);
    }
  });

  searchPathInput.addEventListener('change', () => {
    window.electronAPI.savePath(searchPathInput.value);
  });

  searchBtn.addEventListener('click', async () => {
    const path = searchPathInput.value;
    if (!path) {
      if (typeof showToast === 'function') showToast('請先選擇或輸入搜尋路徑', 'warning');
      return;
    }

    searchBtn.disabled = true;
    searchBtn.textContent = 'Searching...';
    repoList.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 40px;">Searching for Git repositories...</td></tr>';
    repositories = [];
    updateAllBtn.disabled = true;

    try {
      const results = await window.electronAPI.searchRepos(path);
      renderRepoList(results);
      addLog('global', `Found ${results.length} repositories.`);
    } catch (err) {
      addLog('global', `Search error: ${err.message}`, 'error');
      repoList.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #f44; padding: 40px;">Error searching repositories.</td></tr>';
    } finally {
      searchBtn.disabled = false;
      searchBtn.textContent = 'Search Repos';
    }
  });

  function renderRepoList(repos) {
    repositories = repos.map(path => ({ path, status: 'Ready', progress: 0, branch: '...' }));

    if (repositories.length === 0) {
      repoList.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #666; padding: 40px;">No Git repositories found.</td></tr>';
      updateAllBtn.disabled = true;
      return;
    }

    updateAllBtn.disabled = false;
    repoList.innerHTML = '';
    repositories.forEach((repo, index) => {
      const parts = repo.path.split(/[\\/]/);
      const repoName = parts.length > 1 ? parts[parts.length - 2] : parts[0];
      const row = document.createElement('tr');
      row.id = `repo-row-${index}`;
      row.innerHTML = `
                <td class="repo-path-cell">
                    <span class="repo-name" title="${repoName}">${repoName}</span>
                    <span class="repo-full-path" title="${repo.path}">${repo.path}</span>
                </td>
                <td>
                    <span id="branch-${index}" class="branch-tag">...</span>
                </td>
                <td>
                    <div class="repo-status">
                        <div class="progress-bar-bg">
                            <div id="progress-${index}" class="progress-bar-fill"></div>
                        </div>
                        <span id="status-text-${index}" class="status-text">${repo.status}</span>
                    </div>
                </td>
                <td>
                    <button class="git-btn" onclick="updateSingleRepo(${index})">Update</button>
                </td>
            `;
      repoList.appendChild(row);
      addRepoTab(repo.path);

      // 非同步取得分支資訊
      if (window.electronAPI && window.electronAPI.getRepoInfo) {
        window.electronAPI.getRepoInfo(repo.path)
          .then(info => {
            const branchEl = document.getElementById(`branch-${index}`);
            if (!branchEl) return;
            if (info && info.branch) {
              branchEl.textContent = info.branch;
              const parts = [];
              if (info.isDirty) parts.push(`${info.changedFiles} 變更中的檔案`);
              if (info.ahead > 0) parts.push(`領先 ${info.ahead} 個 commit`);
              if (info.behind > 0) parts.push(`落後 ${info.behind} 個 commit`);
              branchEl.title = parts.length > 0 ? parts.join(' · ') : '工作區乾淨';
              // 標記狀態：有變更 = 橘色，乾淨 = 綠色
              branchEl.classList.remove('dirty', 'clean', 'behind');
              if (info.behind > 0) branchEl.classList.add('behind');
              else branchEl.classList.add(info.isDirty ? 'dirty' : 'clean');
            } else {
              branchEl.textContent = 'N/A';
            }
          })
          .catch(() => {
            const branchEl = document.getElementById(`branch-${index}`);
            if (branchEl) branchEl.textContent = '?';
          });
      }
    });
  }

  window.updateSingleRepo = async (index) => {
    const repo = repositories[index];
    const statusText = document.getElementById(`status-text-${index}`);
    const progressBar = document.getElementById(`progress-${index}`);

    statusText.textContent = 'Updating...';
    progressBar.style.width = '10%';
    addLog(repo.path, `Starting update...`);

    try {
      const result = await window.electronAPI.updateRepo(repo.path, (progress, message) => {
        progressBar.style.width = `${progress}%`;
        statusText.textContent = message;
        if (message) addLog(repo.path, message);
      });

      if (result.success) {
        statusText.textContent = 'Finished';
        progressBar.style.width = '100%';
        progressBar.style.backgroundColor = '#0c0';
        addLog(repo.path, `Finished successfully.`);
      } else {
        statusText.textContent = 'Failed';
        progressBar.style.backgroundColor = '#f44';
        addLog(repo.path, `Update failed: ${result.error}`, 'error');
      }
    } catch (err) {
      statusText.textContent = 'Error';
      progressBar.style.backgroundColor = '#f44';
      addLog(repo.path, `Error: ${err.message}`, 'error');
    }
  };

  updateAllBtn.addEventListener('click', async () => {
    updateAllBtn.disabled = true;
    addLog('global', 'Starting parallel update...');

    const updatePromises = repositories.map((_, i) => window.updateSingleRepo(i));
    await Promise.all(updatePromises);

    updateAllBtn.disabled = false;
    addLog('global', 'Parallel update finished.');
  });
});
