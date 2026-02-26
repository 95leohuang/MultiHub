document.addEventListener('DOMContentLoaded', async () => {
  const skillSyncUI = document.getElementById('skill-sync-ui');
  if (!skillSyncUI) return;

  skillSyncUI.innerHTML = `
        <div class="skill-header-mini">
            <div class="skill-title-group">
                <h2>Skill Sync</h2>
                <span class="search-pattern-hint">**/VegasFrenzyClient/.cursor/skills</span>
            </div>
            <div class="skill-controls-row">
                <input type="text" id="skill-search-path" class="skill-input-compact" placeholder="Root directory (e.g., E:\\Git)">
                <button id="skill-browse-btn" class="git-btn secondary" style="padding: 4px 10px; font-size: 11px;">Browse</button>
                <div class="master-selector-wrapper" style="display: flex; align-items: center; gap: 4px; margin: 0 10px;">
                    <span style="font-size: 11px; color: #888;">Master:</span>
                    <select id="global-master-select" class="skill-input-compact" style="width: 140px; padding: 2px 4px; border-radius: 4px;"></select>
                </div>
                <button id="skill-scan-btn" class="git-btn" style="padding: 4px 12px; font-size: 11px;">Scan & Compare</button>
            </div>
        </div>
        <div class="skill-matrix-wrapper">
            <table class="skill-matrix" id="skill-matrix-table">
                <thead>
                    <tr id="matrix-header-row">
                        <th class="sticky-col">Filename</th>
                    </tr>
                </thead>
                <tbody id="matrix-body">
                    <tr>
                        <td colspan="100" class="placeholder-cell">Click "Scan & Compare" to analyze.</td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div class="skill-footer" id="skill-log">
            <div class="log-entry">Initialized. Waiting for scan...</div>
        </div>
    `;

  const searchPathInput = document.getElementById('skill-search-path');
  const browseBtn = document.getElementById('skill-browse-btn');
  const scanBtn = document.getElementById('skill-scan-btn');
  const matrixHeader = document.getElementById('matrix-header-row');
  const matrixBody = document.getElementById('matrix-body');
  const logContainer = document.getElementById('skill-log');
  const globalMasterSelect = document.getElementById('global-master-select');

  // Modal elements
  const previewModal = document.getElementById('skill-preview-modal');
  const closePreviewBtn = document.getElementById('close-preview');
  const previewFilenameLabel = document.getElementById('preview-filename');
  const previewVersionList = document.getElementById('preview-version-list');

  const panelsContainer = document.getElementById('preview-panels-container');
  const leftPanel = document.getElementById('left-panel');
  const rightPanel = document.getElementById('right-panel');

  const leftScroller = document.getElementById('left-scroller');
  const rightScroller = document.getElementById('right-scroller');
  const leftLineNumbers = document.getElementById('left-line-numbers');
  const rightLineNumbers = document.getElementById('right-line-numbers');
  const leftTextContent = document.getElementById('left-text-content');
  const rightTextContent = document.getElementById('right-text-content');
  const leftPanelHeader = document.getElementById('left-panel-header');
  const rightPanelHeader = document.getElementById('right-panel-header');
  const diffInfo = document.getElementById('diff-info');
  const clearSelectionBtn = document.getElementById('clear-selection');
  const syncSelectedBtn = document.getElementById('sync-selected-version');

  let currentResults = null;
  let previewContext = {
    filename: '',
    leftRepo: null,
    rightRepo: null
  };

  // Synchronized Scrolling Logic
  let syncScrollSource = null;
  const syncScroll = (source, target) => {
    if (syncScrollSource && syncScrollSource !== source) return;
    syncScrollSource = source;
    target.scrollTop = source.scrollTop;
    target.scrollLeft = source.scrollLeft;
    // Reset source after a short frame to prevent feedback
    requestAnimationFrame(() => {
      if (source.scrollTop === target.scrollTop && source.scrollLeft === target.scrollLeft) {
        syncScrollSource = null;
      }
    });
  };

  leftScroller.addEventListener('scroll', () => syncScroll(leftScroller, rightScroller));
  rightScroller.addEventListener('scroll', () => syncScroll(rightScroller, leftScroller));

  // Load saved path
  const savedPath = await window.electronAPI.getSavedPath();
  if (savedPath) searchPathInput.value = savedPath;

  function addLog(msg, type = 'info') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    logContainer.appendChild(entry);
    logContainer.scrollTop = logContainer.scrollHeight;
  }

  closePreviewBtn.onclick = () => previewModal.classList.add('hidden');
  clearSelectionBtn.onclick = () => {
    previewContext.leftRepo = null;
    previewContext.rightRepo = null;
    updatePreviewUI();
  };

  globalMasterSelect.onchange = () => {
    if (currentResults) renderMatrix(currentResults);
  };

  browseBtn.onclick = async () => {
    const path = await window.electronAPI.selectDirectory();
    if (path) {
      searchPathInput.value = path;
      await window.electronAPI.savePath(path);
    }
  };

  scanBtn.onclick = async () => {
    const rootPath = searchPathInput.value;
    if (!rootPath) { if (typeof showToast === 'function') showToast('請先輸入根目錄路徑', 'warning'); return; }
    await window.electronAPI.savePath(rootPath);
    scanBtn.disabled = true;
    scanBtn.textContent = 'Comparing...';
    try {
      const results = await window.electronAPI.compareSkills(rootPath);
      if (results.error) return addLog(results.error, 'error');
      currentResults = results;
      renderMatrix(results);
      addLog(`Scanned ${results.repos.length} repositories.`, 'success');
    } catch (err) {
      addLog(err.message, 'error');
    } finally {
      scanBtn.disabled = false;
      scanBtn.textContent = 'Scan & Compare';
    }
  };

  function renderMatrix(results) {
    // Populate Global Master Select
    const currentVal = globalMasterSelect.value;
    globalMasterSelect.innerHTML = '<option value="">(Auto-detect)</option>';
    results.repos.forEach(repo => {
      const opt = document.createElement('option');
      opt.value = repo.name;
      opt.textContent = repo.name;
      if (repo.name === currentVal) opt.selected = true;
      globalMasterSelect.appendChild(opt);
    });

    matrixHeader.innerHTML = '<th class="sticky-col">Filename</th>';
    matrixBody.innerHTML = '';
    results.repos.forEach(repo => {
      const th = document.createElement('th');
      th.textContent = repo.name;
      matrixHeader.appendChild(th);
    });
    const filenames = Object.keys(results.fileMap).sort();
    if (filenames.length === 0) {
      matrixBody.innerHTML = '<tr><td colspan="100" class="placeholder-cell">No skill files found.</td></tr>';
      return;
    }
    filenames.forEach(file => {
      const row = document.createElement('tr');
      const nameCell = document.createElement('td');
      nameCell.className = 'sticky-col file-name-cell';

      const repoMap = results.fileMap[file];
      const preferredMaster = globalMasterSelect.value;
      const canSyncFromMaster = preferredMaster && repoMap[preferredMaster];
      const actualSource = canSyncFromMaster ? preferredMaster : Object.keys(repoMap)[0];

      const syncTitle = `Sync this file to all repos using [${actualSource}] as master`;

      nameCell.innerHTML = `<div class="file-info">
                <span class="file-name-text" title="${file}">${file}</span>
                <button class="sync-row-btn" onclick="syncFileToAll('${file}', '${actualSource}')" title="${syncTitle}">⚓</button>
            </div>`;
      row.appendChild(nameCell);
      results.repos.forEach(repo => {
        const td = document.createElement('td');
        const fileInRepo = results.fileMap[file][repo.name];
        if (fileInRepo) {
          const isConsistent = checkConsistency(file, fileInRepo.hash);
          td.innerHTML = `<div class="status-cell ${isConsistent ? 'consistent' : 'diff'}"
                        onclick="openPreview('${file}', '${repo.name}')">
                        <span class="status-icon">${isConsistent ? '●' : '⚠'}</span>
                    </div>`;
        } else {
          td.innerHTML = `<div class="status-cell missing" onclick="handleAutoSync('${file}', '${repo.name}')">+</div>`;
        }
        row.appendChild(td);
      });
      matrixBody.appendChild(row);
    });
  }

  function checkConsistency(filename, hash) {
    const versions = Object.values(currentResults.fileMap[filename]);
    return versions.every(v => v.hash === hash);
  }

  window.openPreview = (filename, initialRepo) => {
    previewModal.classList.remove('hidden');
    previewFilenameLabel.textContent = filename;
    previewContext.filename = filename;
    previewContext.leftRepo = initialRepo;
    previewContext.rightRepo = null;
    updatePreviewUI();
  };

  async function loadContent(repoName) {
    const repo = currentResults.repos.find(r => r.name === repoName);
    if (!repo) return '';
    const res = await window.electronAPI.readSkillContent({ skillPath: repo.skillPath, filename: previewContext.filename });
    return res.content || `// Error Loading Content: ${res.error}`;
  }

  async function updatePreviewUI() {
    // Update Sidebar Version List
    previewVersionList.innerHTML = '';
    const versions = currentResults.fileMap[previewContext.filename];
    Object.keys(versions).forEach(repoName => {
      const item = document.createElement('div');
      const isL = repoName === previewContext.leftRepo;
      const isR = repoName === previewContext.rightRepo;
      item.className = `version-item ${isL || isR ? 'active' : ''}`;

      let label = repoName;
      if (isL) label += ' (Source)';
      else if (isR) label += ' (Target)';

      item.textContent = label;
      item.onclick = () => handleVersionSelect(repoName);
      previewVersionList.appendChild(item);
    });

    // 50/50 Grid vs Single Column
    if (previewContext.leftRepo && previewContext.rightRepo) {
      panelsContainer.classList.remove('single');
      leftPanel.style.display = 'flex';
      rightPanel.style.display = 'flex';
      leftPanelHeader.textContent = `[L] ${previewContext.leftRepo}`;
      rightPanelHeader.textContent = `[R] ${previewContext.rightRepo}`;
    } else {
      panelsContainer.classList.add('single');
      leftPanel.style.display = previewContext.leftRepo ? 'flex' : 'none';
      rightPanel.style.display = previewContext.rightRepo ? 'flex' : 'none';
      if (previewContext.leftRepo) leftPanelHeader.textContent = `[L] ${previewContext.leftRepo}`;
      if (previewContext.rightRepo) rightPanelHeader.textContent = `[R] ${previewContext.rightRepo}`;
    }

    // Parallel Data Fetching
    const [lContent, rContent] = await Promise.all([
      previewContext.leftRepo ? loadContent(previewContext.leftRepo) : Promise.resolve(''),
      previewContext.rightRepo ? loadContent(previewContext.rightRepo) : Promise.resolve('')
    ]);

    // Render logic
    if (previewContext.leftRepo && previewContext.rightRepo) {
      renderProDiff(lContent, rContent);
      diffInfo.textContent = `Comparing Source: ${previewContext.leftRepo} vs Target: ${previewContext.rightRepo}`;
    } else if (previewContext.leftRepo) {
      renderSingle(lContent, true);
      diffInfo.textContent = `Previewing ${previewContext.leftRepo}. Choose another repo to compare.`;
    } else if (previewContext.rightRepo) {
      renderSingle(rContent, false);
      diffInfo.textContent = `Previewing ${previewContext.rightRepo}. Choose another repo to compare.`;
    } else {
      diffInfo.textContent = 'Select a version to preview.';
    }

    syncSelectedBtn.disabled = !previewContext.leftRepo;
    syncSelectedBtn.textContent = previewContext.leftRepo ? `Use ${previewContext.leftRepo} as Master` : 'Use as Master';
  }

  function handleVersionSelect(repoName) {
    if (previewContext.leftRepo === repoName) {
      previewContext.leftRepo = null;
    } else if (previewContext.rightRepo === repoName) {
      previewContext.rightRepo = null;
    } else if (!previewContext.leftRepo) {
      previewContext.leftRepo = repoName;
    } else {
      // Already has leftRepo, assign to rightRepo
      previewContext.rightRepo = repoName;
    }
    updatePreviewUI();
  }

  function renderSingle(content, isLeft) {
    const lines = content.split(/\r?\n/);
    const numContainer = isLeft ? leftLineNumbers : rightLineNumbers;
    const textContainer = isLeft ? leftTextContent : rightTextContent;

    numContainer.innerHTML = '';
    textContainer.innerHTML = '';

    lines.forEach((line, i) => {
      const num = document.createElement('div');
      num.className = 'line-num-entry';
      num.textContent = i + 1;
      numContainer.appendChild(num);

      const code = document.createElement('div');
      code.className = 'diff-line';
      code.textContent = line || ' ';
      textContainer.appendChild(code);
    });
  }

  function renderProDiff(text1, text2) {
    const lines1 = text1.split(/\r?\n/);
    const lines2 = text2.split(/\r?\n/);

    leftLineNumbers.innerHTML = '';
    rightLineNumbers.innerHTML = '';
    leftTextContent.innerHTML = '';
    rightTextContent.innerHTML = '';

    let i = 0, j = 0;
    while (i < lines1.length || j < lines2.length) {
      const l1 = i < lines1.length ? lines1[i] : null;
      const l2 = j < lines2.length ? lines2[j] : null;

      if (l1 === l2 && l1 !== null) {
        appendDiffRow('unchanged', l1, l2, i + 1, j + 1);
        i++; j++;
      } else if (l1 !== null && l2 !== null) {
        appendDiffRow('change', l1, l2, i + 1, j + 1);
        i++; j++;
      } else if (l1 !== null) {
        appendDiffRow('removed', l1, null, i + 1, null);
        i++;
      } else {
        appendDiffRow('added', null, l2, null, j + 1);
        j++;
      }
    }
  }

  function appendDiffRow(type, c1, c2, n1, n2) {
    const isRem = type === 'removed' || type === 'change';
    const isAdd = type === 'added' || type === 'change';

    // L1
    const num1 = document.createElement('div');
    num1.className = 'line-num-entry';
    num1.textContent = n1 || '';
    leftLineNumbers.appendChild(num1);

    const code1 = document.createElement('div');
    code1.className = `diff-line ${isRem ? 'diff-removed' : (type === 'added' ? 'diff-placeholder' : '')}`;
    code1.textContent = (isRem ? '- ' : '  ') + (c1 || ' ');
    leftTextContent.appendChild(code1);

    // L2
    const num2 = document.createElement('div');
    num2.className = 'line-num-entry';
    num2.textContent = n2 || '';
    rightLineNumbers.appendChild(num2);

    const code2 = document.createElement('div');
    code2.className = `diff-line ${isAdd ? 'diff-added' : (type === 'removed' ? 'diff-placeholder' : '')}`;
    code2.textContent = (isAdd ? '+ ' : '  ') + (c2 || ' ');
    rightTextContent.appendChild(code2);
  }

  syncSelectedBtn.onclick = async () => {
    if (!previewContext.leftRepo) return;
    const confirmed = await new Promise(resolve => {
      const msg = `確定要以 [${previewContext.leftRepo}] 為主版本，同步 ${previewContext.filename} 至所有 Repo？`;
      if (typeof showToast === 'function') showToast(msg, 'warning', 5000);
      const overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);z-index:99999;display:flex;align-items:center;justify-content:center;';
      overlay.innerHTML = `<div style="background:var(--bg-surface,#252525);border:1px solid var(--border-color,rgba(255,255,255,0.1));border-radius:12px;padding:24px 28px;max-width:420px;width:90%;box-shadow:0 8px 32px rgba(0,0,0,0.5);"><p style="color:var(--text-primary,#f0f0f0);font-size:14px;margin:0 0 20px;line-height:1.5;">${msg}</p><div style="display:flex;justify-content:flex-end;gap:10px;"><button id="_cancel_sync" style="background:var(--bg-tertiary,#1e1e1e);color:var(--text-secondary,#999);border:1px solid var(--border-color,rgba(255,255,255,0.1));padding:8px 18px;border-radius:6px;cursor:pointer;font-size:13px;">取消</button><button id="_confirm_sync" style="background:#0084ff;color:#fff;border:none;padding:8px 18px;border-radius:6px;cursor:pointer;font-size:13px;font-weight:500;">確定同步</button></div></div>`;
      document.body.appendChild(overlay);
      overlay.querySelector('#_confirm_sync').addEventListener('click', () => { document.body.removeChild(overlay); resolve(true); });
      overlay.querySelector('#_cancel_sync').addEventListener('click', () => { document.body.removeChild(overlay); resolve(false); });
    });
    if (!confirmed) return;
    previewModal.classList.add('hidden');
    await syncFileToAll(previewContext.filename, previewContext.leftRepo);
  };

  window.handleAutoSync = async (filename, targetRepoName) => {
    const sourceRepoName = Object.keys(currentResults.fileMap[filename])[0];
    const targetRepo = currentResults.repos.find(r => r.name === targetRepoName);
    const sourceRepo = currentResults.repos.find(r => r.name === sourceRepoName);
    const res = await window.electronAPI.syncSkillFile({ sourceSkillPath: sourceRepo.skillPath, filename, targetSkillPaths: [targetRepo.skillPath] });
    if (res.success) scanBtn.click();
  };

  window.syncFileToAll = async (filename, sourceRepoNameOverride = null) => {
    const sourceRepoName = sourceRepoNameOverride || Object.keys(currentResults.fileMap[filename])[0];
    const sourceRepo = currentResults.repos.find(r => r.name === sourceRepoName);
    const targetSkillPaths = currentResults.repos.filter(r => r.name !== sourceRepoName).map(r => r.skillPath);
    const res = await window.electronAPI.syncSkillFile({ sourceSkillPath: sourceRepo.skillPath, filename, targetSkillPaths });
    if (res.success) {
      if (typeof showToast === 'function') showToast(`${filename} 同步完成`, 'success');
      scanBtn.click();
    } else {
      if (typeof showToast === 'function') showToast(`同步失敗：${res.error || '未知錯誤'}`, 'error');
    }
  };
});
