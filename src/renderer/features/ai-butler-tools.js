/**
 * AI Butler — 工具模組
 * 擷取各分頁上下文，供 AI 大管家理解當前狀態
 */

/**
 * 取得當前分頁的上下文資訊
 * @returns {{ activeTab: string, extra: string }}
 */
export function getActiveContext() {
  const activeTab = localStorage.getItem('activeTab') || 'messenger';

  const gatherers = {
    notes: gatherQuickNotesContext,
    skills: gatherSkillSyncContext,
    gitgui: gatherGitGuiContext,
    git: gatherGitUpdaterContext,
    messenger: () => gatherWebviewContext('Messenger'),
    chatgpt: () => gatherWebviewContext('ChatGPT'),
    gemini: () => gatherWebviewContext('Gemini'),
    discord: () => gatherWebviewContext('Discord'),
    telegram: () => gatherWebviewContext('Telegram')
  };

  const gather = gatherers[activeTab];
  const extra = gather ? gather() : '';

  return { activeTab, extra };
}

/**
 * Quick Notes: 讀取當前筆記
 */
function gatherQuickNotesContext() {
  try {
    const notes = JSON.parse(localStorage.getItem('quickNotes') || '[]');
    const activeId = localStorage.getItem('activeNoteId') || null;
    const noteCount = notes.length;

    // 找當前編輯的筆記
    const editor = document.getElementById('note-editor');
    const titleInput = document.getElementById('note-title');

    let info = `筆記數量: ${noteCount}`;

    if (activeId) {
      const activeNote = notes.find(n => n.id === activeId);
      if (activeNote) {
        info += `\n目前編輯的筆記: "${activeNote.title}"`;
      }
    }

    // 讀取編輯器中的即時內容
    if (editor && editor.style.display !== 'none') {
      const title = titleInput ? titleInput.value : '';
      const body = editor.value || '';
      if (title || body) {
        info += `\n\n--- 目前筆記內容 ---`;
        if (title) info += `\n標題: ${title}`;
        if (body) {
          // 截取前 2000 字元避免 token 爆炸
          const truncated = body.length > 2000 ? body.slice(0, 2000) + '\n...(已截斷)' : body;
          info += `\n內容:\n${truncated}`;
        }
      }
    }

    // 列出所有筆記標題
    if (noteCount > 0 && noteCount <= 20) {
      info += `\n\n--- 所有筆記 ---`;
      notes.forEach((n, i) => {
        info += `\n${i + 1}. ${n.title || '(無標題)'}`;
      });
    }

    return info;
  } catch (e) {
    return '（無法讀取筆記狀態）';
  }
}

/**
 * Skill Sync: 讀取掃描結果概要
 */
function gatherSkillSyncContext() {
  try {
    // 從 DOM 讀取摘要
    const summary = document.getElementById('matrix-summary');
    const searchPath = document.getElementById('skill-search-path');

    let info = '';
    if (searchPath && searchPath.value) {
      info += `掃描路徑: ${searchPath.value}`;
    }

    if (summary) {
      const text = summary.textContent.trim();
      if (text) info += `\n摘要: ${text}`;
    }

    // 讀取矩陣表格中的差異資訊
    const rows = document.querySelectorAll('#matrix-body tr');
    if (rows.length > 0) {
      const diffFiles = [];
      rows.forEach(row => {
        const filename = row.querySelector('.file-name-text');
        const diffCells = row.querySelectorAll('.status-cell.diff');
        const missingCells = row.querySelectorAll('.status-cell.missing');
        if (filename && (diffCells.length > 0 || missingCells.length > 0)) {
          let detail = filename.textContent;
          if (diffCells.length > 0) detail += ` (${diffCells.length} 個版本不同)`;
          if (missingCells.length > 0) detail += ` (${missingCells.length} 個 repo 缺少)`;
          diffFiles.push(detail);
        }
      });
      if (diffFiles.length > 0) {
        info += `\n\n--- 有差異的檔案 ---`;
        diffFiles.forEach(f => { info += `\n• ${f}`; });
      } else if (rows.length > 0 && !rows[0].querySelector('.placeholder-cell')) {
        info += `\n所有檔案一致，無差異。`;
      }
    }

    // 讀取 header 中的 repo 名稱
    const headers = document.querySelectorAll('#matrix-header-row th');
    if (headers.length > 1) {
      const repos = Array.from(headers).slice(1).map(th => th.textContent);
      info += `\nRepos: ${repos.join(', ')}`;
    }

    return info || '尚未執行掃描';
  } catch (e) {
    return '（無法讀取 Skill Sync 狀態）';
  }
}

/**
 * Git GUI: 讀取當前 repo/branch 狀態
 */
function gatherGitGuiContext() {
  try {
    let info = '';

    const repoName = document.getElementById('gg-toolbar-repo-name');
    const branch = document.querySelector('#gg-toolbar-branch .gg-branch-name');

    if (repoName) info += `當前 Repo: ${repoName.textContent}`;
    if (branch) info += `\n當前 Branch: ${branch.textContent}`;

    // 目前所在的 Tab
    const activeTab = document.querySelector('.gg-tab.active');
    if (activeTab) info += `\n目前檢視: ${activeTab.textContent}`;

    // Local changes 摘要
    const changeRows = document.querySelectorAll('#gg-panel-changes .gg-changes-file-row');
    if (changeRows.length > 0) {
      info += `\n本地變更: ${changeRows.length} 個檔案`;
      const files = Array.from(changeRows).slice(0, 10).map(r => {
        const name = r.querySelector('.gg-changes-filename');
        const status = r.querySelector('.gg-changes-status');
        return `  ${status ? status.textContent : '?'} ${name ? name.textContent : ''}`;
      });
      info += '\n' + files.join('\n');
      if (changeRows.length > 10) info += `\n  ...及其他 ${changeRows.length - 10} 個檔案`;
    }

    // Sidebar 中所有 repo
    const sidebarItems = document.querySelectorAll('#gg-sidebar .gg-sidebar-item');
    if (sidebarItems.length > 0) {
      info += `\n\n已載入 ${sidebarItems.length} 個 Repo`;
    }

    return info || '尚未選擇 Repo';
  } catch (e) {
    return '（無法讀取 Git GUI 狀態）';
  }
}

/**
 * Git Updater: 讀取 repo 清單和狀態
 */
function gatherGitUpdaterContext() {
  try {
    const cards = document.querySelectorAll('.repo-card');
    if (cards.length === 0) return '尚未掃描 Repo';

    let info = `已掃描 ${cards.length} 個 Repo`;

    const repoList = Array.from(cards).slice(0, 15).map(card => {
      const name = card.querySelector('.repo-name');
      const status = card.querySelector('.repo-status');
      return `• ${name ? name.textContent : '?'} — ${status ? status.textContent : ''}`;
    });

    info += '\n' + repoList.join('\n');
    if (cards.length > 15) info += `\n...及其他 ${cards.length - 15} 個`;

    return info;
  } catch (e) {
    return '（無法讀取 Git Updater 狀態）';
  }
}

/**
 * Webview 分頁: 只回報未讀數
 */
function gatherWebviewContext(platformName) {
  try {
    const badge = document.querySelector(`#badge-${platformName.toLowerCase()}`);
    const count = badge && !badge.classList.contains('hidden') ? badge.textContent : '0';
    return `${platformName} 未讀訊息: ${count} 則`;
  } catch (e) {
    return '';
  }
}

// ======= P2: Tool Execution (Renderer Side) =======

/**
 * 初始化工具執行監聽器
 * 由 main process 透過 IPC 呼叫
 */
export function initToolListener() {
  if (!window.electronAPI?.onAiButlerExecuteTool) return;

  window.electronAPI.onAiButlerExecuteTool(async ({ name, args, responseChannel }) => {
    let result;
    try {
      switch (name) {
        case 'update_note':
          result = executeUpdateNote(args);
          break;
        case 'create_note':
          result = executeCreateNote(args);
          break;
        case 'get_skill_diff_summary':
          result = { summary: gatherSkillSyncContext() };
          break;
        case 'get_git_status':
          result = { status: gatherGitGuiContext() };
          break;
        case 'generate_commit_message':
          result = await executeGenerateCommitMessage();
          break;
        default:
          result = { error: `未知工具: ${name}` };
      }
    } catch (e) {
      result = { error: e.message };
    }

    window.electronAPI.aiButlerToolResult(responseChannel, result);
  });
}

/**
 * 修改目前正在編輯的筆記
 */
function executeUpdateNote({ title, body }) {
  try {
    const notes = JSON.parse(localStorage.getItem('quickNotes') || '[]');
    const activeId = localStorage.getItem('activeNoteId');
    if (!activeId) return { error: '目前沒有正在編輯的筆記' };

    const note = notes.find(n => n.id === activeId);
    if (!note) return { error: '找不到筆記' };

    if (title !== undefined) note.title = title;
    if (body !== undefined) note.body = body;
    note.updatedAt = Date.now();

    localStorage.setItem('quickNotes', JSON.stringify(notes));

    // 更新 DOM
    const titleEl = document.getElementById('note-title');
    const editorEl = document.getElementById('note-editor');
    if (titleEl && title !== undefined) titleEl.value = title;
    if (editorEl && body !== undefined) editorEl.value = body;

    // 觸發 renderNotesList（透過 DOM event）
    window.dispatchEvent(new CustomEvent('notes-updated'));

    return { success: true, message: `已更新筆記 "${note.title}"` };
  } catch (e) {
    return { error: e.message };
  }
}

/**
 * 建立新筆記
 */
function executeCreateNote({ title, body }) {
  try {
    const notes = JSON.parse(localStorage.getItem('quickNotes') || '[]');
    const newNote = {
      id: `note-${Date.now()}`,
      title: title || '新筆記',
      body: body || '',
      updatedAt: Date.now()
    };
    notes.unshift(newNote);
    localStorage.setItem('quickNotes', JSON.stringify(notes));
    localStorage.setItem('activeNoteId', newNote.id);

    window.dispatchEvent(new CustomEvent('notes-updated'));

    return { success: true, message: `已建立筆記 "${newNote.title}"`, noteId: newNote.id };
  } catch (e) {
    return { error: e.message };
  }
}

/**
 * 取得 staged diff 用於生成 commit message
 */
async function executeGenerateCommitMessage() {
  try {
    const repoName = document.getElementById('gg-toolbar-repo-name');
    if (!repoName || repoName.textContent === '—') {
      return { error: '尚未選取 Repo' };
    }

    // 收集 staged 檔案列表
    const stagedRows = document.querySelectorAll('#gg-panel-changes .gg-changes-section:first-child .gg-changes-file-row');
    if (stagedRows.length === 0) {
      return { error: '沒有 staged 的檔案' };
    }

    const files = Array.from(stagedRows).map(row => {
      const name = row.querySelector('.gg-changes-filename');
      const status = row.querySelector('.gg-changes-status');
      return `${status ? status.textContent : '?'} ${name ? name.textContent : ''}`;
    });

    return {
      repo: repoName.textContent,
      stagedFiles: files,
      suggestion: `基於以上 ${files.length} 個 staged 檔案，請生成 conventional commit message`
    };
  } catch (e) {
    return { error: e.message };
  }
}
