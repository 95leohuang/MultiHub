/**
 * AI Butler — 大管家 UI 模組
 * 支援多 Session 對話歷史
 */

import { showToast } from '../toast.js';
import { logRendererError } from '../logger.js';
import { STORAGE_KEYS, getStorageItem, setStorageItem } from '../storage.js';
import { getActiveContext, initToolListener } from './ai-butler-tools.js';

// ──── SVG helpers ────
const SVG = (path, size = 15) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;

const ICONS = {
  bot: SVG('<rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/>', 18),
  botLg: SVG('<rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/>', 40),
  newChat: SVG('<path d="M12 5v14m-7-7h14"/>'),
  history: SVG('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'),
  settings: SVG('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>'),
  close: SVG('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'),
  send: SVG('<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>', 16),
  trash: SVG('<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>'),
  chevronLeft: SVG('<polyline points="15 18 9 12 15 6"/>'),
  chevronRight: SVG('<polyline points="9 18 15 12 9 6"/>'),
};

// ──── State ────
let drawerOpen = false;
let settingsOpen = false;
let historyOpen = true;   // sidebar visible by default
let isStreaming = false;
let config = {};

// Session model: { id, title, createdAt, messages, totalTokens }
let sessions = [];
let activeSessionId = null;

// DOM refs
let drawer, backdrop, messagesEl, inputEl, sendBtn;
let settingsPanel, modelTag, contextTag;
let sessionListEl;

// ──── Helpers ────
function activeSession() {
  return sessions.find(s => s.id === activeSessionId) || null;
}

function genId() {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function sessionTitle(sess) {
  const first = sess.messages.find(m => m.role === 'user');
  if (!first) return '新對話';
  return first.content.slice(0, 28) + (first.content.length > 28 ? '…' : '');
}

function fmtDate(ts) {
  const d = new Date(ts);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return '剛才';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m 前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h 前`;
  return d.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
}

// ──── Session Persistence ────
function saveSessions() {
  try {
    setStorageItem(STORAGE_KEYS.AI_BUTLER_SESSIONS, JSON.stringify(sessions));
    setStorageItem(STORAGE_KEYS.AI_BUTLER_ACTIVE_SESSION, activeSessionId || '');
  } catch (e) { /* quota */ }
}

function loadSessions() {
  try {
    const raw = getStorageItem(STORAGE_KEYS.AI_BUTLER_SESSIONS);
    if (raw) {
      sessions = JSON.parse(raw);
      // Migrate old single-session history if exists
      if (sessions.length === 0) {
        const oldRaw = getStorageItem(STORAGE_KEYS.AI_BUTLER_HISTORY);
        if (oldRaw) {
          const old = JSON.parse(oldRaw);
          if (old.messages && old.messages.length > 0) {
            const migrated = { id: genId(), createdAt: Date.now(), messages: old.messages, totalTokens: old.totalTokens || 0 };
            migrated.title = sessionTitle(migrated);
            sessions.push(migrated);
          }
        }
      }
    }

    const savedActive = getStorageItem(STORAGE_KEYS.AI_BUTLER_ACTIVE_SESSION);
    if (savedActive && sessions.find(s => s.id === savedActive)) {
      activeSessionId = savedActive;
    } else if (sessions.length > 0) {
      activeSessionId = sessions[0].id;
    }

    if (sessions.length === 0) {
      createNewSession(false);
    }
  } catch (e) {
    logRendererError('AI Butler Session Load', e);
    sessions = [];
    createNewSession(false);
  }
}

// ──── Session CRUD ────
function createNewSession(save = true) {
  const sess = { id: genId(), createdAt: Date.now(), messages: [], totalTokens: 0, title: '新對話' };
  sessions.unshift(sess);
  activeSessionId = sess.id;
  if (save) saveSessions();
  return sess;
}

function deleteSession(id) {
  sessions = sessions.filter(s => s.id !== id);
  if (activeSessionId === id) {
    if (sessions.length === 0) createNewSession(false);
    activeSessionId = sessions[0].id;
  }
  saveSessions();
  renderSessionList();
  renderMessages();
  updateTokenDisplay();
}

function switchSession(id) {
  activeSessionId = id;
  saveSessions();
  renderSessionList();
  renderMessages();
  updateTokenDisplay();
  inputEl.focus();
}

// ──── DOM Injection ────
export function initAiButler() {
  injectDrawerHTML();
  bindEvents();
  loadConfig();
  initToolListener();
}

function injectDrawerHTML() {
  backdrop = document.createElement('div');
  backdrop.className = 'ai-butler-backdrop';
  backdrop.addEventListener('click', toggleDrawer);
  document.body.appendChild(backdrop);

  drawer = document.createElement('div');
  drawer.className = 'ai-butler-drawer';
  drawer.id = 'ai-butler-drawer';
  drawer.innerHTML = `
    <!-- Drawer body: sidebar + main -->
    <div class="ab-layout">

      <!-- History Sidebar -->
      <div class="ab-sidebar" id="ab-sidebar">
        <div class="ab-sidebar-header">
          <span class="ab-sidebar-title">對話紀錄</span>
          <button class="ab-sidebar-close" id="ab-sidebar-close" title="收起">${ICONS.chevronLeft}</button>
        </div>
        <div class="ab-session-list" id="ab-session-list"></div>
        <div class="ab-sidebar-footer">
          <button class="ab-new-btn" id="ab-new-session-btn">
            ${ICONS.newChat} 新對話
          </button>
        </div>
      </div>

      <!-- Main Chat Column -->
      <div class="ab-main">
        <!-- Header -->
        <div class="ai-butler-header">
          <div class="ai-butler-title">
            <button class="ab-history-toggle" id="ab-history-toggle" title="對話紀錄">${ICONS.history}</button>
            <span class="butler-icon">${ICONS.bot}</span>
            <span>AI 大管家</span>
            <span class="ai-butler-model-tag" id="ai-butler-model-tag">未設定</span>
          </div>
          <div class="ai-butler-header-actions">
            <button class="ai-butler-header-btn" id="ai-butler-settings-btn" title="設定">${ICONS.settings}</button>
            <button class="ai-butler-header-btn" id="ai-butler-close-btn" title="關閉 (Alt+A)">${ICONS.close}</button>
          </div>
        </div>

        <!-- Chat Messages -->
        <div class="ai-butler-messages" id="ai-butler-messages"></div>

        <!-- Settings Panel (overlays chat) -->
        <div class="ai-butler-settings" id="ai-butler-settings">
          <div class="ai-settings-group">
            <label class="ai-settings-label">Provider</label>
            <select class="ai-settings-select" id="ai-settings-provider">
              <option value="openai">OpenAI</option>
              <option value="gemini">Google Gemini</option>
            </select>
          </div>
          <div class="ai-settings-group">
            <label class="ai-settings-label">API Key</label>
            <input type="password" class="ai-settings-input" id="ai-settings-apikey" placeholder="sk-... 或 AIza...">
          </div>
          <div class="ai-settings-group">
            <label class="ai-settings-label">Model</label>
            <select class="ai-settings-select" id="ai-settings-model"></select>
          </div>
          <div class="ai-settings-group">
            <label class="ai-settings-label">Rules (系統提示詞)</label>
            <textarea class="ai-settings-textarea" id="ai-settings-rules" rows="5"
              placeholder="你是 Multi Hub 的 AI 大管家..."></textarea>
          </div>
          <div class="ai-settings-group">
            <label class="ai-settings-label">Skills (啟用工具)</label>
            <div class="ai-settings-skills">
              <label class="ai-skill-toggle"><input type="checkbox" id="ai-skill-quicknotes" checked> Quick Notes</label>
              <label class="ai-skill-toggle"><input type="checkbox" id="ai-skill-skillsync" checked> Skill Sync</label>
              <label class="ai-skill-toggle"><input type="checkbox" id="ai-skill-gitgui" checked> Git GUI</label>
              <label class="ai-skill-toggle"><input type="checkbox" id="ai-skill-gitupdater" checked> Git Updater</label>
            </div>
          </div>
          <div class="ai-settings-actions">
            <button class="ai-settings-save-btn" id="ai-settings-save">儲存設定</button>
          </div>
        </div>

        <!-- Context bar -->
        <div class="ai-butler-context" id="ai-butler-context">
          <span>當前分頁：</span>
          <span class="ai-butler-context-tag" id="ai-butler-context-tag">—</span>
        </div>

        <!-- Input -->
        <div class="ai-butler-input-area" id="ai-butler-input-area">
          <textarea class="ai-butler-input" id="ai-butler-input"
            placeholder="問我任何事... (Enter 送出, Shift+Enter 換行)"
            rows="1"></textarea>
          <button class="ai-butler-send-btn" id="ai-butler-send" disabled>${ICONS.send}</button>
        </div>

        <!-- Footer -->
        <div class="ai-butler-footer-info" id="ai-butler-footer">
          <span id="ai-butler-token-count">Tokens: 0</span>
          <span id="ai-butler-status">Ready</span>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(drawer);

  messagesEl = document.getElementById('ai-butler-messages');
  inputEl = document.getElementById('ai-butler-input');
  sendBtn = document.getElementById('ai-butler-send');
  settingsPanel = document.getElementById('ai-butler-settings');
  modelTag = document.getElementById('ai-butler-model-tag');
  contextTag = document.getElementById('ai-butler-context-tag');
  sessionListEl = document.getElementById('ab-session-list');
}

// ──── Events ────
function bindEvents() {
  document.getElementById('ai-butler-close-btn').addEventListener('click', toggleDrawer);

  // History sidebar toggle
  document.getElementById('ab-history-toggle').addEventListener('click', () => {
    historyOpen = !historyOpen;
    document.getElementById('ab-sidebar').classList.toggle('collapsed', !historyOpen);
  });
  document.getElementById('ab-sidebar-close').addEventListener('click', () => {
    historyOpen = false;
    document.getElementById('ab-sidebar').classList.add('collapsed');
  });

  // New session
  document.getElementById('ab-new-session-btn').addEventListener('click', () => {
    createNewSession();
    renderSessionList();
    renderMessages();
    updateTokenDisplay();
    inputEl.focus();
  });

  // Settings toggle
  document.getElementById('ai-butler-settings-btn').addEventListener('click', () => {
    settingsOpen = !settingsOpen;
    settingsPanel.classList.toggle('active', settingsOpen);
  });

  // Provider change → update model list
  document.getElementById('ai-settings-provider').addEventListener('change', async (e) => {
    await loadModels(e.target.value);
  });

  // Save settings
  document.getElementById('ai-settings-save').addEventListener('click', saveConfig);

  // Send
  sendBtn.addEventListener('click', sendMessage);

  inputEl.addEventListener('input', () => {
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + 'px';
    sendBtn.disabled = !inputEl.value.trim() || isStreaming;
  });

  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputEl.value.trim() && !isStreaming) sendMessage();
    }
  });

  // Global hotkey: Alt+A
  document.addEventListener('keydown', (e) => {
    if (e.altKey && e.key.toLowerCase() === 'a') {
      e.preventDefault();
      toggleDrawer();
    }
  });
}

// ──── Session List Rendering ────
function renderSessionList() {
  if (!sessionListEl) return;
  sessionListEl.innerHTML = '';

  sessions.forEach(sess => {
    const item = document.createElement('div');
    item.className = `ab-session-item${sess.id === activeSessionId ? ' active' : ''}`;
    item.dataset.id = sess.id;

    const msgCount = sess.messages.filter(m => m.role === 'user').length;
    item.innerHTML = `
      <div class="ab-session-info" data-switch="${sess.id}">
        <div class="ab-session-title">${escHtml(sessionTitle(sess))}</div>
        <div class="ab-session-meta">${fmtDate(sess.createdAt)} · ${msgCount} 則訊息</div>
      </div>
      <button class="ab-session-del" data-del="${sess.id}" title="刪除">${ICONS.trash}</button>
    `;

    item.querySelector('[data-switch]').addEventListener('click', () => switchSession(sess.id));
    item.querySelector('[data-del]').addEventListener('click', (e) => {
      e.stopPropagation();
      if (sessions.length === 1) {
        createNewSession();
      }
      deleteSession(sess.id);
    });

    sessionListEl.appendChild(item);
  });
}

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ──── Drawer ────
export function toggleDrawer() {
  drawerOpen = !drawerOpen;
  drawer.classList.toggle('open', drawerOpen);
  backdrop.classList.toggle('open', drawerOpen);

  if (drawerOpen) {
    updateContext();
    inputEl.focus();
    if (settingsOpen) {
      settingsOpen = false;
      settingsPanel.classList.remove('active');
    }
  }
}

function updateContext() {
  const labelMap = {
    messenger: 'Messenger', chatgpt: 'ChatGPT', gemini: 'Gemini',
    git: 'Git Update', skills: 'Skill Sync', notes: 'Quick Notes',
    gitgui: 'Git GUI', discord: 'Discord', telegram: 'Telegram'
  };
  const ctx = getActiveContext();
  contextTag.textContent = labelMap[ctx.activeTab] || ctx.activeTab;
  if (ctx.extra) contextTag.title = ctx.extra.slice(0, 200);
}

// ──── Config ────
async function loadConfig() {
  try {
    config = await window.electronAPI.aiButlerGetConfig();
    document.getElementById('ai-settings-provider').value = config.provider || 'openai';
    document.getElementById('ai-settings-apikey').value = config.apiKey || '';
    document.getElementById('ai-settings-rules').value = config.rules || '';
    const skills = config.skills || {};
    document.getElementById('ai-skill-quicknotes').checked = skills.quickNotes !== false;
    document.getElementById('ai-skill-skillsync').checked = skills.skillSync !== false;
    document.getElementById('ai-skill-gitgui').checked = skills.gitGui !== false;
    document.getElementById('ai-skill-gitupdater').checked = skills.gitUpdater !== false;
    await loadModels(config.provider || 'openai');
    if (config.model) document.getElementById('ai-settings-model').value = config.model;
    updateModelTag();
    loadSessions();
    renderSessionList();
    renderMessages();
  } catch (e) {
    logRendererError('AI Butler Config Load', e);
    loadSessions();
    renderSessionList();
    renderMessages();
  }
}

async function loadModels(provider) {
  try {
    const models = await window.electronAPI.aiButlerGetModels(provider);
    const select = document.getElementById('ai-settings-model');
    select.innerHTML = '';
    models.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = m.name;
      select.appendChild(opt);
    });
  } catch (e) {
    logRendererError('AI Butler Models Load', e);
  }
}

async function saveConfig() {
  config = {
    provider: document.getElementById('ai-settings-provider').value,
    apiKey: document.getElementById('ai-settings-apikey').value,
    model: document.getElementById('ai-settings-model').value,
    rules: document.getElementById('ai-settings-rules').value,
    skills: {
      quickNotes: document.getElementById('ai-skill-quicknotes').checked,
      skillSync: document.getElementById('ai-skill-skillsync').checked,
      gitGui: document.getElementById('ai-skill-gitgui').checked,
      gitUpdater: document.getElementById('ai-skill-gitupdater').checked
    }
  };
  try {
    await window.electronAPI.aiButlerSaveConfig(config);
    updateModelTag();
    showToast('AI 大管家設定已儲存', 'success');
    settingsOpen = false;
    settingsPanel.classList.remove('active');
  } catch (e) {
    logRendererError('AI Butler Config Save', e);
    showToast('儲存失敗', 'error');
  }
}

function updateModelTag() {
  const providerLabel = config.provider === 'gemini' ? 'Gemini' : 'OpenAI';
  const modelShort = config.model ? config.model.split('/').pop().replace(/-preview.*$/, '') : '未設定';
  modelTag.textContent = config.apiKey ? `${providerLabel} · ${modelShort}` : '未設定';
}

function updateTokenDisplay() {
  const sess = activeSession();
  const tokens = sess ? sess.totalTokens : 0;
  document.getElementById('ai-butler-token-count').textContent = `Tokens: ${tokens.toLocaleString()}`;
}

// ──── Send Message ────
async function sendMessage() {
  const text = inputEl.value.trim();
  if (!text || isStreaming) return;

  const sess = activeSession();
  if (!sess) return;

  sess.messages.push({ role: 'user', content: text });
  // Auto-set title from first message
  if (sess.messages.filter(m => m.role === 'user').length === 1) {
    sess.title = sessionTitle(sess);
    renderSessionList();
  }

  inputEl.value = '';
  inputEl.style.height = 'auto';
  sendBtn.disabled = true;
  renderMessages();

  isStreaming = true;
  document.getElementById('ai-butler-status').textContent = '思考中...';
  const typingEl = document.createElement('div');
  typingEl.className = 'ai-typing';
  typingEl.innerHTML = '<span></span><span></span><span></span>';
  messagesEl.appendChild(typingEl);
  scrollToBottom();

  try {
    const context = getActiveContext();
    const result = await window.electronAPI.aiButlerChat({
      messages: sess.messages.map(m => ({ role: m.role, content: m.content })),
      context
    });

    typingEl.remove();

    if (result.error) {
      const errEl = document.createElement('div');
      errEl.className = 'ai-msg-error';
      errEl.textContent = result.error;
      messagesEl.appendChild(errEl);
    } else {
      sess.messages.push({ role: 'assistant', content: result.content });
      if (result.usage) {
        sess.totalTokens += result.usage.total_tokens || 0;
        updateTokenDisplay();
      }
      saveSessions();
      renderMessages();
      renderSessionList(); // update message count
    }
  } catch (err) {
    logRendererError('AI Butler Chat', err);
    typingEl.remove();
    const errEl = document.createElement('div');
    errEl.className = 'ai-msg-error';
    errEl.textContent = err.message;
    messagesEl.appendChild(errEl);
  } finally {
    isStreaming = false;
    sendBtn.disabled = false;
    document.getElementById('ai-butler-status').textContent = 'Ready';
    scrollToBottom();
  }
}

// ──── Render Messages ────
function renderMessages() {
  if (!messagesEl) return;
  messagesEl.innerHTML = '';

  const sess = activeSession();
  if (!sess || sess.messages.length === 0) {
    messagesEl.innerHTML = `
      <div class="ai-butler-welcome">
        <span class="welcome-icon">${ICONS.botLg}</span>
        <h3>AI 大管家</h3>
        <p>按 Alt+A 隨時呼叫我。<br>我可以協助你處理筆記、比對差異、Git 操作等各種任務。</p>
      </div>
    `;
    return;
  }

  sess.messages.forEach(msg => {
    const el = document.createElement('div');
    el.className = `ai-msg ${msg.role}`;
    const bubble = document.createElement('div');
    bubble.className = 'ai-msg-bubble';

    if (msg.role === 'assistant' && window.marked) {
      const html = window.marked.parse(msg.content || '', { breaks: true, gfm: true });
      Promise.resolve(html).then(h => {
        bubble.innerHTML = h;
        if (window.Prism) window.Prism.highlightAllUnder(bubble);
      });
    } else {
      bubble.textContent = msg.content;
    }

    el.appendChild(bubble);
    messagesEl.appendChild(el);
  });

  scrollToBottom();
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  });
}
