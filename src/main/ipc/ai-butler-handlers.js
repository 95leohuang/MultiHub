'use strict';

const { ipcMain, net } = require('electron');
const Store = require('electron-store');
const fs = require('fs');
const path = require('path');

const store = new Store();

// 預設設定
const DEFAULT_CONFIG = {
  provider: 'openai',
  apiKey: '',
  model: '',
  rules: '你是 Multi Hub 的 AI 大管家。\n請用繁體中文回答。\n回答簡潔精準、有條理。\n當你需要資訊時，使用工具取得。\n當用戶要求你修改筆記或同步檔案時，先說明你會做什麼，再呼叫工具執行。',
  skills: { quickNotes: true, skillSync: true, gitGui: true, gitUpdater: true }
};

// 模型選項（僅列出適合文字聊天的模型）
const MODEL_OPTIONS = {
  openai: [
    { id: 'gpt-5.4', name: 'GPT-5.4' },
    { id: 'gpt-5.4-pro', name: 'GPT-5.4 Pro' },
    { id: 'gpt-5-mini', name: 'GPT-5 Mini' },
    { id: 'gpt-5-nano', name: 'GPT-5 Nano' },
    { id: 'gpt-5', name: 'GPT-5' },
    { id: 'gpt-4.1', name: 'GPT-4.1' },
    { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini' },
    { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano' },
    { id: 'gpt-4o', name: 'GPT-4o' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
    { id: 'o3-mini', name: 'o3-mini' }
  ],
  gemini: [
    { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro (Preview)' },
    { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash (Preview)' },
    { id: 'gemini-3.1-flash-lite-preview', name: 'Gemini 3.1 Flash-Lite (Preview)' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
    { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash-Lite' }
  ]
};

// ======= P2: Tool Definitions =======

const TOOL_DEFINITIONS_OPENAI = [
  {
    type: 'function',
    function: {
      name: 'update_note',
      description: '修改目前正在編輯的 Quick Notes 筆記的標題或內容',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: '新的標題（不傳則不改）' },
          body: { type: 'string', description: '新的完整內容（不傳則不改）' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_note',
      description: '建立一篇新的 Quick Notes 筆記',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: '筆記標題' },
          body: { type: 'string', description: '筆記內容' }
        },
        required: ['title']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_skill_diff_summary',
      description: '取得 Skill Sync 的差異摘要，列出哪些檔案有差異',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_git_status',
      description: '取得 Git GUI 目前 repo 的狀態，包含 branch 和未 commit 的檔案',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'generate_commit_message',
      description: '根據目前 staged 的 diff 內容生成 commit message',
      parameters: { type: 'object', properties: {} }
    }
  }
];

// Gemini 格式的工具定義
const TOOL_DEFINITIONS_GEMINI = [{
  functionDeclarations: TOOL_DEFINITIONS_OPENAI.map(t => ({
    name: t.function.name,
    description: t.function.description,
    parameters: t.function.parameters
  }))
}];

// ======= Tool Execution (Main Process side) =======

function executeToolCall(name, args, mainWindow) {
  switch (name) {
    case 'update_note':
    case 'create_note':
    case 'get_skill_diff_summary':
    case 'get_git_status':
    case 'generate_commit_message':
      // 這些工具需要在 renderer 端執行（存取 DOM/localStorage）
      // 透過 IPC 發送到 renderer，renderer 執行後回傳結果
      return new Promise((resolve) => {
        const channel = `ai-butler-tool-result-${Date.now()}`;
        ipcMain.once(channel, (event, result) => {
          resolve(result);
        });
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('ai-butler-execute-tool', { name, args, responseChannel: channel });
        } else {
          resolve({ error: '找不到主視窗' });
        }
        // Timeout 安全網
        setTimeout(() => resolve({ error: '工具執行逾時' }), 15000);
      });
    default:
      return Promise.resolve({ error: `未知工具: ${name}` });
  }
}

// ======= API Callers =======

async function callOpenAI(apiKey, model, messages, systemPrompt, tools) {
  const allMessages = [
    { role: 'system', content: systemPrompt },
    ...messages
  ];

  const body = {
    model: model || 'gpt-4o-mini',
    messages: allMessages,
    max_tokens: 4096
  };

  if (tools && tools.length > 0) {
    body.tools = tools;
    body.tool_choice = 'auto';
  }

  const res = await net.fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `OpenAI API Error: ${res.status}`);
  }

  const data = await res.json();
  const choice = data.choices[0];

  return {
    message: choice.message,
    finish_reason: choice.finish_reason,
    usage: data.usage
  };
}

async function callGemini(apiKey, model, messages, systemPrompt, tools) {
  const modelId = model || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

  const contents = messages
    .filter(m => m.role !== 'system')
    .map(msg => {
      // Gemini: functionResponse 必須用 role: 'user'
      if (msg.role === 'tool') {
        return {
          role: 'user',
          parts: [{
            functionResponse: {
              name: msg.tool_call_id || msg.name || 'unknown',
              response: JSON.parse(msg.content || '{}')
            }
          }]
        };
      }
      // 如果有原始 Gemini parts（含 thoughtSignature），直接回放
      if (msg._geminiRawParts) {
        return {
          role: 'model',
          parts: msg._geminiRawParts
        };
      }
      if (msg.tool_calls) {
        return {
          role: 'model',
          parts: msg.tool_calls.map(tc => ({
            functionCall: {
              name: tc.function.name,
              args: JSON.parse(tc.function.arguments || '{}')
            }
          }))
        };
      }
      return {
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content || '' }]
      };
    });

  const reqBody = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: { maxOutputTokens: 4096 }
  };

  if (tools && tools.length > 0) {
    reqBody.tools = tools;
  }

  const res = await net.fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reqBody)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gemini API Error: ${res.status}`);
  }

  const data = await res.json();
  const candidate = data.candidates?.[0];
  const parts = candidate?.content?.parts || [];

  // 檢查是否有 function call
  const functionCalls = parts.filter(p => p.functionCall);
  if (functionCalls.length > 0) {
    return {
      message: {
        role: 'assistant',
        content: null,
        // 保留原始 parts（含 thought_signature）以便回放
        _geminiRawParts: parts,
        tool_calls: functionCalls.map((fc, i) => ({
          id: `call_${Date.now()}_${i}`,
          type: 'function',
          function: {
            name: fc.functionCall.name,
            arguments: JSON.stringify(fc.functionCall.args || {})
          }
        }))
      },
      finish_reason: 'tool_calls',
      usage: data.usageMetadata ? {
        prompt_tokens: data.usageMetadata.promptTokenCount || 0,
        completion_tokens: data.usageMetadata.candidatesTokenCount || 0,
        total_tokens: data.usageMetadata.totalTokenCount || 0
      } : null
    };
  }

  const text = parts.map(p => p.text || '').join('');
  return {
    message: { role: 'assistant', content: text },
    finish_reason: 'stop',
    usage: data.usageMetadata ? {
      prompt_tokens: data.usageMetadata.promptTokenCount || 0,
      completion_tokens: data.usageMetadata.candidatesTokenCount || 0,
      total_tokens: data.usageMetadata.totalTokenCount || 0
    } : null
  };
}

// ======= Register Handlers =======

function registerAiButlerHandlers() {
  const { getMainWindow } = require('../window');

  ipcMain.handle('ai-butler-get-config', () => {
    const saved = store.get('aiButlerConfig', {});
    return { ...DEFAULT_CONFIG, ...saved };
  });

  ipcMain.handle('ai-butler-save-config', (event, config) => {
    store.set('aiButlerConfig', config);
    return { success: true };
  });

  ipcMain.handle('ai-butler-get-models', (event, provider) => {
    return MODEL_OPTIONS[provider] || [];
  });

  // 主聊天 Handler（含 Function Calling 迴圈）
  ipcMain.handle('ai-butler-chat', async (event, { messages, context }) => {
    try {
      const config = { ...DEFAULT_CONFIG, ...store.get('aiButlerConfig', {}) };

      if (!config.apiKey) {
        return { error: '請先設定 API Key（點擊右上角 ⚙ 按鈕）' };
      }

      let systemPrompt = config.rules || DEFAULT_CONFIG.rules;
      if (context) {
        systemPrompt += `\n\n--- 當前上下文 ---\n使用者目前在 [${context.activeTab}] 分頁。`;
        if (context.extra) systemPrompt += `\n${context.extra}`;
      }

      // 選擇工具定義
      const isGemini = config.provider === 'gemini';
      const tools = isGemini ? TOOL_DEFINITIONS_GEMINI : TOOL_DEFINITIONS_OPENAI;

      // Function calling 迴圈（最多 5 輪）
      let currentMessages = [...messages];
      let totalUsage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
      let finalContent = '';

      for (let round = 0; round < 5; round++) {
        let result;
        if (isGemini) {
          result = await callGemini(config.apiKey, config.model, currentMessages, systemPrompt, tools);
        } else {
          result = await callOpenAI(config.apiKey, config.model, currentMessages, systemPrompt, tools);
        }

        // 累計 token
        if (result.usage) {
          totalUsage.prompt_tokens += result.usage.prompt_tokens || 0;
          totalUsage.completion_tokens += result.usage.completion_tokens || 0;
          totalUsage.total_tokens += result.usage.total_tokens || 0;
        }

        // 有 tool_calls → 執行工具，把結果加回 messages 再跑一輪
        const msg = result.message;
        if (msg.tool_calls && msg.tool_calls.length > 0) {
          currentMessages.push(msg);

          for (const tc of msg.tool_calls) {
            const fnName = tc.function.name;
            const fnArgs = JSON.parse(tc.function.arguments || '{}');
            const mainWindow = getMainWindow();
            const toolResult = await executeToolCall(fnName, fnArgs, mainWindow);

            currentMessages.push({
              role: 'tool',
              tool_call_id: tc.id || fnName,
              name: fnName,
              content: JSON.stringify(toolResult)
            });
          }
          continue; // 下一輪讓 AI 根據工具結果回覆
        }

        // 無 tool_calls → 最終回覆
        finalContent = msg.content || '';
        break;
      }

      return {
        content: finalContent,
        usage: totalUsage
      };
    } catch (err) {
      console.error('[AI Butler] Chat error:', err);
      return { error: err.message };
    }
  });
}

module.exports = { registerAiButlerHandlers };
