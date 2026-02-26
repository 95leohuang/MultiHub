/**
 * 平台設定資料
 * 所有服務的 label、favicon、homeUrl、色彩定義
 */

/** @type {Record<string, { label: string, favicon: string, homeUrl: string|null, color: string }>} */
const platformConfig = {
  messenger: {
    label: 'Messenger',
    favicon: 'https://static.xx.fbcdn.net/rsrc.php/yO/r/qa11ER6rke_.ico',
    homeUrl: 'https://www.messenger.com',
    color: '#0084ff'
  },
  chatgpt: {
    label: 'ChatGPT',
    favicon: 'https://chatgpt.com/favicon.ico',
    homeUrl: 'https://chatgpt.com',
    color: '#10a37f'
  },
  gemini: {
    label: 'Gemini',
    favicon: 'https://www.gstatic.com/lamda/images/gemini_favicon_f069958c85030456e93de685481c559f160ea06b.png',
    homeUrl: 'https://gemini.google.com',
    color: '#8b5cf6'
  },
  git: {
    label: 'Git Update',
    favicon: '../assets/git-icon.png',
    homeUrl: null,
    color: '#f97316'
  },
  skills: {
    label: 'Skill Sync',
    favicon: 'https://cdn-icons-png.flaticon.com/512/2103/2103633.png',
    homeUrl: null,
    color: '#06b6d4'
  },
  notes: {
    label: 'Quick Notes',
    favicon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23f59e0b" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
    homeUrl: null,
    color: '#f59e0b'
  },
  discord: {
    label: 'Discord',
    favicon: 'https://cdn.prod.website-files.com/6257adef93867e50d84d30e2/6266bc493fb42d4e27bb8393_847541504914fd33810e70a0ea73177e.ico',
    homeUrl: 'https://discord.com/app',
    color: '#5865f2'
  },
  telegram: {
    label: 'Telegram',
    favicon: 'https://web.telegram.org/favicon.ico',
    homeUrl: 'https://web.telegram.org',
    color: '#0088cc'
  }
};

/** 預設 Tab 順序 */
const tabOrder = ['messenger', 'chatgpt', 'gemini', 'git', 'skills', 'notes', 'discord', 'telegram'];
