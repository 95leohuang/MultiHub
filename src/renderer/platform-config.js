// 註冊中心：負責匯集所有外部服務
import { messenger } from './services/messenger.js';
import { chatgpt } from './services/chatgpt.js';
import { gemini } from './services/gemini.js';
import { discord } from './services/discord.js';
import { telegram } from './services/telegram.js';

// 外部網頁服務註冊表
export const externalServices = {
  messenger,
  chatgpt,
  gemini,
  discord,
  telegram
};

// 本地服務設定 (Features)
export const localFeatures = {
  git: { label: 'Git Update', favicon: '../../assets/git-icon.png', color: '#f97316', type: 'local' },
  skills: { label: 'Skill Sync', favicon: 'https://cdn-icons-png.flaticon.com/512/2103/2103633.png', color: '#06b6d4', type: 'local' },
  notes: { label: 'Quick Notes', favicon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23f59e0b" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>', color: '#f59e0b', type: 'local' },
  gitgui: { label: 'Git GUI', favicon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23ef4444" stroke-width="2"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>', color: '#ef4444', type: 'local' }
};

// 合併所有平台設定 (相容舊有架構)
export const platformConfig = {
  ...externalServices,
  ...localFeatures
};

// 預設 Tab 順序
export const tabOrder = Object.keys(platformConfig);
