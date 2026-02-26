/**
 * Quick Notes 模組
 * 支援新增、編輯、刪除、自動儲存、複製筆記
 * 資料持久化至 localStorage
 */

//#region 狀態
/** @type {{ id: string, title: string, body: string, updatedAt: number }[]} */
let notes = [];
/** @type {string|null} */
let activeNoteId = null;
let saveTimer = null;
//#endregion

/**
 * 格式化時間戳
 * @param {number} ts
 * @returns {string}
 */
function fmtTime(ts) {
  return new Date(ts).toLocaleString('zh-TW', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

/** 從 localStorage 載入筆記 */
function loadNotes() {
  try {
    const raw = localStorage.getItem('quickNotes');
    notes = raw ? JSON.parse(raw) : [];
  } catch (_) {
    notes = [];
  }
  renderNotesList();
}

/** 儲存所有筆記至 localStorage */
function saveNotes() {
  localStorage.setItem('quickNotes', JSON.stringify(notes));
}

/** 渲染筆記清單 */
function renderNotesList() {
  const notesList  = document.getElementById('notes-list');
  const notesEmpty = document.getElementById('notes-empty');
  if (!notesList || !notesEmpty) return;

  notesList.innerHTML = '';
  if (notes.length === 0) {
    notesEmpty.classList.remove('hidden');
    return;
  }
  notesEmpty.classList.add('hidden');

  notes.forEach(note => {
    const item = document.createElement('div');
    item.className = `note-list-item${note.id === activeNoteId ? ' active' : ''}`;
    item.dataset.id = note.id;
    const preview = (note.body || '').replace(/\n/g, ' ').slice(0, 60);
    item.innerHTML = `
      <div class="note-item-title">${note.title || '無標題'}</div>
      <div class="note-item-preview">${preview || '（空白）'}</div>
      <div class="note-item-time">${fmtTime(note.updatedAt)}</div>
    `;
    item.addEventListener('click', () => openNote(note.id));
    notesList.appendChild(item);
  });
}

/**
 * 開啟筆記進入編輯模式
 * @param {string} id
 */
function openNote(id) {
  const note = notes.find(n => n.id === id);
  if (!note) return;
  activeNoteId = id;
  renderNotesList();

  const editorEmpty   = document.getElementById('notes-editor-empty');
  const editorContent = document.getElementById('notes-editor-content');
  const noteTitleInput = document.getElementById('note-title-input');
  const noteBodyInput  = document.getElementById('note-body-input');
  const noteMeta       = document.getElementById('note-meta');
  const noteSaveStatus = document.getElementById('note-save-status');

  if (editorEmpty)   editorEmpty.classList.add('hidden');
  if (editorContent) editorContent.classList.remove('hidden');
  if (noteTitleInput) noteTitleInput.value = note.title || '';
  if (noteBodyInput)  noteBodyInput.value  = note.body  || '';
  if (noteMeta)        noteMeta.textContent = `最後更新：${fmtTime(note.updatedAt)}`;
  if (noteSaveStatus)  noteSaveStatus.textContent = '';
}

/** 新增一筆筆記並開啟 */
function addNote() {
  const note = { id: `note_${Date.now()}`, title: '', body: '', updatedAt: Date.now() };
  notes.unshift(note);
  saveNotes();
  renderNotesList();
  openNote(note.id);
  const noteTitleInput = document.getElementById('note-title-input');
  if (noteTitleInput) noteTitleInput.focus();
  showToast('已新增筆記', 'success', 2000);
}

/** 自動儲存目前編輯中的筆記 */
function autoSave() {
  if (!activeNoteId) return;
  const note = notes.find(n => n.id === activeNoteId);
  if (!note) return;

  const noteTitleInput = document.getElementById('note-title-input');
  const noteBodyInput  = document.getElementById('note-body-input');
  const noteMeta       = document.getElementById('note-meta');
  const noteSaveStatus = document.getElementById('note-save-status');

  note.title     = noteTitleInput ? noteTitleInput.value : note.title;
  note.body      = noteBodyInput  ? noteBodyInput.value  : note.body;
  note.updatedAt = Date.now();
  saveNotes();
  renderNotesList();
  if (noteMeta) noteMeta.textContent = `最後更新：${fmtTime(note.updatedAt)}`;
  if (noteSaveStatus) {
    noteSaveStatus.textContent = '✓ 已儲存';
    setTimeout(() => { if (noteSaveStatus) noteSaveStatus.textContent = ''; }, 2000);
  }
}

/** 刪除目前筆記 */
function deleteCurrentNote() {
  if (!activeNoteId) return;
  const idx = notes.findIndex(n => n.id === activeNoteId);
  if (idx === -1) return;
  notes.splice(idx, 1);
  saveNotes();
  activeNoteId = null;

  const editorEmpty   = document.getElementById('notes-editor-empty');
  const editorContent = document.getElementById('notes-editor-content');
  if (editorEmpty)   editorEmpty.classList.remove('hidden');
  if (editorContent) editorContent.classList.add('hidden');
  renderNotesList();
  showToast('筆記已刪除', 'info', 2000);
}

/**
 * 初始化 Quick Notes 模組（綁定所有事件並載入資料）
 */
function initQuickNotes() {
  const addNoteBtn    = document.getElementById('add-note-btn');
  const noteTitleInput = document.getElementById('note-title-input');
  const noteBodyInput  = document.getElementById('note-body-input');
  const noteCopyBtn    = document.getElementById('note-copy-btn');
  const noteDeleteBtn  = document.getElementById('note-delete-btn');

  if (addNoteBtn) addNoteBtn.addEventListener('click', addNote);

  if (noteTitleInput) {
    noteTitleInput.addEventListener('input', () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(autoSave, 600);
    });
  }

  if (noteBodyInput) {
    noteBodyInput.addEventListener('input', () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(autoSave, 600);
    });
  }

  if (noteCopyBtn) {
    noteCopyBtn.addEventListener('click', () => {
      const note = notes.find(n => n.id === activeNoteId);
      if (!note) return;
      const text = note.title ? `${note.title}\n\n${note.body}` : note.body;
      navigator.clipboard.writeText(text)
        .then(() => showToast('已複製到剪貼板', 'success', 2000))
        .catch(() => showToast('複製失敗', 'error'));
    });
  }

  if (noteDeleteBtn) {
    noteDeleteBtn.addEventListener('click', () => {
      const overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);z-index:99999;display:flex;align-items:center;justify-content:center;';
      overlay.innerHTML = `<div style="background:var(--bg-surface,#252525);border:1px solid var(--border-color,rgba(255,255,255,0.1));border-radius:12px;padding:24px 28px;max-width:360px;width:90%;box-shadow:0 8px 32px rgba(0,0,0,0.5);"><p style="color:var(--text-primary,#f0f0f0);font-size:14px;margin:0 0 20px;line-height:1.5;">確定要刪除這則筆記嗎？</p><div style="display:flex;justify-content:flex-end;gap:10px;"><button id="_cancel_del" style="background:var(--bg-tertiary,#1e1e1e);color:var(--text-secondary,#999);border:1px solid var(--border-color,rgba(255,255,255,0.1));padding:8px 18px;border-radius:6px;cursor:pointer;font-size:13px;">取消</button><button id="_confirm_del" style="background:#ef4444;color:#fff;border:none;padding:8px 18px;border-radius:6px;cursor:pointer;font-size:13px;font-weight:500;">確定刪除</button></div></div>`;
      document.body.appendChild(overlay);
      overlay.querySelector('#_confirm_del').addEventListener('click', () => {
        document.body.removeChild(overlay);
        deleteCurrentNote();
      });
      overlay.querySelector('#_cancel_del').addEventListener('click', () => {
        document.body.removeChild(overlay);
      });
    });
  }

  loadNotes();
}
