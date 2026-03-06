/**
 * AI Butler — 大管家 UI 模組
 * 浮動 Drawer 面板，支援聊天 + 設定
 */

import { showToast } from '../toast.js';
import { getActiveContext, initToolListener } from './ai-butler-tools.js';

let drawerOpen = false;
let settingsOpen = false;
let messages = [];
let totalTokens = 0;
let isStreaming = false;
let config = {};

// DOM refs (lazy init)
let drawer, backdrop, messagesEl, inputEl, sendBtn;
let settingsPanel, chatPanel, modelTag, contextTag;

export function initAiButler() {
  injectDrawerHTML();
  bindEvents();
  loadConfig();
  initToolListener();
}

function injectDrawerHTML() {
  // Backdrop
  backdrop = document.createElement('div');
  backdrop.className = 'ai-butler-backdrop';
  backdrop.addEventListener('click', toggleDrawer);
  document.body.appendChild(backdrop);

  // Drawer
  drawer = document.createElement('div');
  drawer.className = 'ai-butler-drawer';
  drawer.id = 'ai-butler-drawer';
  drawer.innerHTML = `
    <div class="ai-butler-header">
      <div class="ai-butler-title">
        <span class="butler-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg></span>
        <span>AI 大管家</span>
        <span class="ai-butler-model-tag" id="ai-butler-model-tag">未設定</span>
      </div>
      <div class="ai-butler-header-actions">
        <button class="ai-butler-header-btn" id="ai-butler-clear-btn" title="清除對話"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
        <button class="ai-butler-header-btn" id="ai-butler-settings-btn" title="設定"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></button>
        <button class="ai-butler-header-btn" id="ai-butler-close-btn" title="關閉 (Alt+A)"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
      </div>
    </div>

    <!-- Chat Panel -->
    <div class="ai-butler-messages" id="ai-butler-messages">
      <div class="ai-butler-welcome">
        <span class="welcome-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg></span>
        <h3>AI 大管家</h3>
        <p>按 Alt+A 隨時呼叫我。<br>我可以協助你處理筆記、比對差異、Git 操作等各種任務。</p>
      </div>
    </div>

    <!-- Settings Panel -->
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
        <textarea class="ai-settings-textarea" id="ai-settings-rules" rows="6"
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
        <button class="ai-settings-clear-btn" id="ai-settings-clear-history">清除對話紀錄</button>
      </div>
    </div>

    <!-- Context + Input -->
    <div class="ai-butler-context" id="ai-butler-context">
      <span>當前分頁：</span>
      <span class="ai-butler-context-tag" id="ai-butler-context-tag">—</span>
    </div>
    <div class="ai-butler-input-area" id="ai-butler-input-area">
      <textarea class="ai-butler-input" id="ai-butler-input"
        placeholder="問我任何事... (Enter 送出, Shift+Enter 換行)"
        rows="1"></textarea>
      <button class="ai-butler-send-btn" id="ai-butler-send" disabled><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button>
    </div>
    <div class="ai-butler-footer-info" id="ai-butler-footer">
      <span id="ai-butler-token-count">Tokens: 0</span>
      <span id="ai-butler-status">Ready</span>
    </div>
  `;
  document.body.appendChild(drawer);

  // Cache refs
  messagesEl = document.getElementById('ai-butler-messages');
  inputEl = document.getElementById('ai-butler-input');
  sendBtn = document.getElementById('ai-butler-send');
  settingsPanel = document.getElementById('ai-butler-settings');
  chatPanel = messagesEl;
  modelTag = document.getElementById('ai-butler-model-tag');
  contextTag = document.getElementById('ai-butler-context-tag');
}

function bindEvents() {
  // Close
  document.getElementById('ai-butler-close-btn').addEventListener('click', toggleDrawer);

  // Clear
  document.getElementById('ai-butler-clear-btn').addEventListener('click', () => {
    messages = [];
    totalTokens = 0;
    saveHistory();
    renderMessages();
    document.getElementById('ai-butler-token-count').textContent = 'Tokens: 0';
  });

  // Clear history from settings
  document.getElementById('ai-settings-clear-history').addEventListener('click', () => {
    messages = [];
    totalTokens = 0;
    saveHistory();
    renderMessages();
    document.getElementById('ai-butler-token-count').textContent = 'Tokens: 0';
    showToast('對話紀錄已清除', 'info');
  });

  // Settings toggle
  document.getElementById('ai-butler-settings-btn').addEventListener('click', () => {
    settingsOpen = !settingsOpen;
    settingsPanel.classList.toggle('active', settingsOpen);
    chatPanel.style.display = settingsOpen ? 'none' : 'flex';
    document.getElementById('ai-butler-input-area').style.display = settingsOpen ? 'none' : 'flex';
    document.getElementById('ai-butler-context').style.display = settingsOpen ? 'none' : 'flex';
  });

  // Provider change → update model list
  document.getElementById('ai-settings-provider').addEventListener('change', async (e) => {
    await loadModels(e.target.value);
  });

  // Save settings
  document.getElementById('ai-settings-save').addEventListener('click', saveConfig);

  // Send
  sendBtn.addEventListener('click', sendMessage);

  // Input handling
  inputEl.addEventListener('input', () => {
    // Auto-resize
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

export function toggleDrawer() {
  drawerOpen = !drawerOpen;
  drawer.classList.toggle('open', drawerOpen);
  backdrop.classList.toggle('open', drawerOpen);

  if (drawerOpen) {
    updateContext();
    inputEl.focus();
    // Exit settings view if open
    if (settingsOpen) {
      settingsOpen = false;
      settingsPanel.classList.remove('active');
      chatPanel.style.display = 'flex';
      document.getElementById('ai-butler-input-area').style.display = 'flex';
      document.getElementById('ai-butler-context').style.display = 'flex';
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
  // 顯示上下文摘要的前 30 字元
  const hint = ctx.extra ? ctx.extra.split('\n')[0].slice(0, 40) : '';
  if (hint) contextTag.title = ctx.extra.slice(0, 200);
}

async function loadConfig() {
  try {
    config = await window.electronAPI.aiButlerGetConfig();
    // Populate settings form
    document.getElementById('ai-settings-provider').value = config.provider || 'openai';
    document.getElementById('ai-settings-apikey').value = config.apiKey || '';
    document.getElementById('ai-settings-rules').value = config.rules || '';
    // Skill toggles
    const skills = config.skills || {};
    document.getElementById('ai-skill-quicknotes').checked = skills.quickNotes !== false;
    document.getElementById('ai-skill-skillsync').checked = skills.skillSync !== false;
    document.getElementById('ai-skill-gitgui').checked = skills.gitGui !== false;
    document.getElementById('ai-skill-gitupdater').checked = skills.gitUpdater !== false;
    await loadModels(config.provider || 'openai');
    if (config.model) {
      document.getElementById('ai-settings-model').value = config.model;
    }
    updateModelTag();
    // Load conversation history
    loadHistory();
  } catch (e) {
    console.error('[AI Butler] Failed to load config:', e);
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
    console.error('[AI Butler] Failed to load models:', e);
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
    // Switch back to chat
    settingsOpen = false;
    settingsPanel.classList.remove('active');
    chatPanel.style.display = 'flex';
    document.getElementById('ai-butler-input-area').style.display = 'flex';
    document.getElementById('ai-butler-context').style.display = 'flex';
  } catch (e) {
    showToast('儲存失敗', 'error');
  }
}

function updateModelTag() {
  const providerLabel = config.provider === 'gemini' ? 'Gemini' : 'OpenAI';
  const modelShort = config.model ? config.model.split('/').pop().replace(/-preview.*$/, '') : '未設定';
  modelTag.textContent = config.apiKey ? `${providerLabel} · ${modelShort}` : '未設定';
}

async function sendMessage() {
  const text = inputEl.value.trim();
  if (!text || isStreaming) return;

  // Add user message
  messages.push({ role: 'user', content: text });
  inputEl.value = '';
  inputEl.style.height = 'auto';
  sendBtn.disabled = true;
  renderMessages();

  // Show typing indicator
  isStreaming = true;
  document.getElementById('ai-butler-status').textContent = '思考中...';
  const typingEl = document.createElement('div');
  typingEl.className = 'ai-typing';
  typingEl.innerHTML = '<span></span><span></span><span></span>';
  messagesEl.appendChild(typingEl);
  scrollToBottom();

  try {
    // P1: 使用 getActiveContext 取得當前分頁的完整上下文
    const context = getActiveContext();
    const result = await window.electronAPI.aiButlerChat({
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      context
    });

    // Remove typing
    typingEl.remove();

    if (result.error) {
      const errEl = document.createElement('div');
      errEl.className = 'ai-msg-error';
      errEl.textContent = result.error;
      messagesEl.appendChild(errEl);
    } else {
      messages.push({ role: 'assistant', content: result.content });
      if (result.usage) {
        totalTokens += result.usage.total_tokens || 0;
        document.getElementById('ai-butler-token-count').textContent = `Tokens: ${totalTokens.toLocaleString()}`;
      }
      saveHistory();
      renderMessages();
    }
  } catch (err) {
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

function renderMessages() {
  messagesEl.innerHTML = '';

  if (messages.length === 0) {
    messagesEl.innerHTML = `
      <div class="ai-butler-welcome">
        <span class="welcome-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg></span>
        <h3>AI 大管家</h3>
        <p>按 Alt+A 隨時呼叫我。<br>我可以協助你處理筆記、比對差異、Git 操作等各種任務。</p>
      </div>
    `;
    return;
  }

  messages.forEach((msg, i) => {
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

// ======= Conversation History Persistence =======

function saveHistory() {
  try {
    const data = { messages, totalTokens };
    localStorage.setItem('aiButlerHistory', JSON.stringify(data));
  } catch (e) { /* quota exceeded — silently ignore */ }
}

function loadHistory() {
  try {
    const raw = localStorage.getItem('aiButlerHistory');
    if (raw) {
      const data = JSON.parse(raw);
      messages = data.messages || [];
      totalTokens = data.totalTokens || 0;
      document.getElementById('ai-butler-token-count').textContent = `Tokens: ${totalTokens.toLocaleString()}`;
      renderMessages();
    }
  } catch (e) { /* corrupted — start fresh */ }
}
