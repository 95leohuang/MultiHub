/**
 * AI Butler — 大管家 UI 模組
 * 浮動 Drawer 面板，支援聊天 + 設定
 */

import { showToast } from '../toast.js';
import { getActiveContext } from './ai-butler-tools.js';

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
        <span class="butler-icon">🤖</span>
        <span>AI 大管家</span>
        <span class="ai-butler-model-tag" id="ai-butler-model-tag">未設定</span>
      </div>
      <div class="ai-butler-header-actions">
        <button class="ai-butler-header-btn" id="ai-butler-clear-btn" title="清除對話">🗑</button>
        <button class="ai-butler-header-btn" id="ai-butler-settings-btn" title="設定">⚙</button>
        <button class="ai-butler-header-btn" id="ai-butler-close-btn" title="關閉 (Alt+A)">✕</button>
      </div>
    </div>

    <!-- Chat Panel -->
    <div class="ai-butler-messages" id="ai-butler-messages">
      <div class="ai-butler-welcome">
        <span class="welcome-icon">🤖</span>
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
      <button class="ai-settings-save-btn" id="ai-settings-save">儲存設定</button>
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
      <button class="ai-butler-send-btn" id="ai-butler-send" disabled>➤</button>
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
    renderMessages();
    document.getElementById('ai-butler-token-count').textContent = 'Tokens: 0';
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
    await loadModels(config.provider || 'openai');
    if (config.model) {
      document.getElementById('ai-settings-model').value = config.model;
    }
    updateModelTag();
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
    skills: config.skills || { quickNotes: true, skillSync: true, gitGui: true, gitUpdater: true }
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
      errEl.textContent = `❌ ${result.error}`;
      messagesEl.appendChild(errEl);
    } else {
      messages.push({ role: 'assistant', content: result.content });
      if (result.usage) {
        totalTokens += result.usage.total_tokens || 0;
        document.getElementById('ai-butler-token-count').textContent = `Tokens: ${totalTokens.toLocaleString()}`;
      }
      renderMessages();
    }
  } catch (err) {
    typingEl.remove();
    const errEl = document.createElement('div');
    errEl.className = 'ai-msg-error';
    errEl.textContent = `❌ ${err.message}`;
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
        <span class="welcome-icon">🤖</span>
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
    bubble.textContent = msg.content;

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
