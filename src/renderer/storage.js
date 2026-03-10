export const STORAGE_KEYS = {
  ACTIVE_TAB: 'activeTab',
  THEME: 'theme',
  QUICK_NOTES: 'quickNotes',
  ACTIVE_NOTE_ID: 'activeNoteId',
  AI_BUTLER_SESSIONS: 'aiButlerSessions',
  AI_BUTLER_ACTIVE_SESSION: 'aiButlerActiveSession',
  AI_BUTLER_HISTORY: 'aiButlerHistory'
};

export function getStorageItem(key, fallback = null) {
  const value = localStorage.getItem(key);
  return value === null ? fallback : value;
}

export function setStorageItem(key, value) {
  localStorage.setItem(key, value);
}

export function getActiveTab() {
  return getStorageItem(STORAGE_KEYS.ACTIVE_TAB, 'messenger');
}
