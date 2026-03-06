'use strict';

const { ipcMain, net } = require('electron');
const Store = require('electron-store');

const store = new Store();

// 預設設定
const DEFAULT_CONFIG = {
  provider: 'openai',       // 'openai' | 'gemini'
  apiKey: '',
  model: '',
  rules: '你是 Multi Hub 的 AI 大管家。\n請用繁體中文回答。\n回答簡潔精準、有條理。',
  skills: {
    quickNotes: true,
    skillSync: true,
    gitGui: true,
    gitUpdater: true
  }
};

// 模型選項
const MODEL_OPTIONS = {
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
    { id: 'gpt-4.1', name: 'GPT-4.1' },
    { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini' },
    { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano' },
    { id: 'o3-mini', name: 'o3-mini' }
  ],
  gemini: [
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
    { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash-Lite' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Legacy)' }
  ]
};

/**
 * 呼叫 OpenAI API
 */
async function callOpenAI(apiKey, model, messages, systemPrompt) {
  const allMessages = [
    { role: 'system', content: systemPrompt },
    ...messages
  ];

  const res = await net.fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model || 'gpt-4o-mini',
      messages: allMessages,
      max_tokens: 4096
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `OpenAI API Error: ${res.status}`);
  }

  const data = await res.json();
  return {
    content: data.choices[0]?.message?.content || '',
    usage: data.usage
  };
}

/**
 * 呼叫 Gemini API
 */
async function callGemini(apiKey, model, messages, systemPrompt) {
  const modelId = model || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

  // 轉換訊息格式
  const contents = messages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  const res = await net.fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: { maxOutputTokens: 4096 }
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gemini API Error: ${res.status}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return {
    content: text,
    usage: data.usageMetadata ? {
      prompt_tokens: data.usageMetadata.promptTokenCount || 0,
      completion_tokens: data.usageMetadata.candidatesTokenCount || 0,
      total_tokens: data.usageMetadata.totalTokenCount || 0
    } : null
  };
}

/**
 * 註冊 AI Butler IPC handlers
 */
function registerAiButlerHandlers() {
  // 取得設定
  ipcMain.handle('ai-butler-get-config', () => {
    const saved = store.get('aiButlerConfig', {});
    return { ...DEFAULT_CONFIG, ...saved };
  });

  // 儲存設定
  ipcMain.handle('ai-butler-save-config', (event, config) => {
    store.set('aiButlerConfig', config);
    return { success: true };
  });

  // 取得模型選項
  ipcMain.handle('ai-butler-get-models', (event, provider) => {
    return MODEL_OPTIONS[provider] || [];
  });

  // 聊天
  ipcMain.handle('ai-butler-chat', async (event, { messages, context }) => {
    try {
      const config = { ...DEFAULT_CONFIG, ...store.get('aiButlerConfig', {}) };

      if (!config.apiKey) {
        return { error: '請先設定 API Key（點擊右上角 ⚙ 按鈕）' };
      }

      // 構建系統提示（含上下文）
      let systemPrompt = config.rules || DEFAULT_CONFIG.rules;
      if (context) {
        systemPrompt += `\n\n--- 當前上下文 ---\n使用者目前在 [${context.activeTab}] 分頁。`;
        if (context.extra) systemPrompt += `\n${context.extra}`;
      }

      let result;
      if (config.provider === 'gemini') {
        result = await callGemini(config.apiKey, config.model, messages, systemPrompt);
      } else {
        result = await callOpenAI(config.apiKey, config.model, messages, systemPrompt);
      }

      return {
        content: result.content,
        usage: result.usage
      };
    } catch (err) {
      console.error('[AI Butler] Chat error:', err);
      return { error: err.message };
    }
  });
}

module.exports = { registerAiButlerHandlers };
