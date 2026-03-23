// 靜態 Release Notes 資料庫
// 資料來源：依據 Git 歷史自動彙整
export const releaseNotes = [
  {
    version: '2.7.0',
    date: '2026-03-23',
    title: '新增系統更新日誌功能與穩定性提升',
    changes: [
      { type: 'feat', text: '新增系統更新日誌 (Release Notes) 佈局與功能，支援時間軸與版本歷史預覽' },
      { type: 'fix', text: '修復 Git Updater 在 Windows 路徑下因反斜線導致的標籤重複及解析錯誤問題' },
      { type: 'chore', text: '發布可攜帶版本 (Portable EXE)' }
    ]
  },
  {
    version: '2.6.1',
    date: '2026-03-12',
    title: '進階 Git GUI 管理功能',
    changes: [
      { type: 'feat', text: '全面補齊 Git GUI 先進管理功能，包含進度追蹤、LFS 支援與分支操作優化' }
    ]
  },
  {
    version: '2.6.0',
    date: '2026-03-10',
    title: '核心 Renderer 引擎重構',
    changes: [
      { type: 'refactor', text: '全模組化 App 架構，徹底分離 Storage 與 Logger 模組' },
      { type: 'refactor', text: '移除冗餘舊檔與 store-handlers，優化記憶體佔用與啟動速度' }
    ]
  },
  {
    version: '2.5.0',
    date: '2026-03-06',
    title: 'AI Butler 智慧管家與全新升級',
    changes: [
      { type: 'feat', text: '全新的 AI Butler 側邊欄抽屜功能，管理程式歷史對話、文件解析無縫銜接' },
      { type: 'feat', text: '升級支援最新的 OpenAI GPT-5.x 與 Gemini 3.x 預覽版模型' },
      { type: 'perf', text: '整體效能優化：實裝非同步掃描、分離 IPC 處理程序與例外處理機制' },
      { type: 'ui', text: '將所有系統 Emoji 替換為高質感的 Lucide Inline SVG 圖示' }
    ]
  },
  {
    version: '2.4.0',
    date: '2026-03-05',
    title: 'Quick Notes 進階功能與自訂捷徑',
    changes: [
      { type: 'feat', text: 'Quick Notes 導入 Markdown 渲染引擎、Mermaid 圖表、Prism 高亮處理及圖片預覽功能' },
      { type: 'feat', text: 'Quick Notes 增加斜線指令 (slash commands)、提示小抄並支援互動待辦清單 (checkboxes)' },
      { type: 'feat', text: '重新設計 Shortcut Settings 使用者體驗：開始支援自訂熱鍵配置及拖曳排序功能 (Drag-and-drop)' },
      { type: 'refactor', text: 'Renderer 遷移至 ES modules (ESM) 原生模組架構，大幅增強專案可維護性' },
      { type: 'fix', text: '修復並恢復受重構影響的 Git Icon 顯示及分頁快速鍵失效問題' }
    ]
  },
  {
    version: '2.3.0',
    date: '2026-02-26',
    title: 'Git GUI 視覺與功能大躍進',
    changes: [
      { type: 'feat', text: '新增全新的 Git GUI Tab，完美整合版本控制操作' },
      { type: 'feat', text: '實作 Commit Graph 視覺化功能，精準呈現分支關係與節點' },
      { type: 'feat', text: '重構 Commit Log 為 SourceGit 風格的欄位式佈局，提升資訊閱讀體驗' },
      { type: 'feat', text: 'Changes / Stash 面板全新升級，支援右鍵選單、圖片預覽與擴展檢視' },
      { type: 'feat', text: '實作 Branch sidebar、Changes 列表多選功能 (Shift/Ctrl) 及右鍵多檔操作' },
      { type: 'refactor', text: '完成 main.js 與 tabs 模組化拆分，大幅清理與重構舊有架構' },
      { type: 'fix', text: '修正大量佈局與交互 Bug，包含過長標籤、SVG 佔滿問題與 Windows CRLF 斷行處理' }
    ]
  },
  {
    version: '2.0.0',
    date: '2026-02-25',
    title: '基礎介面大革新',
    changes: [
      { type: 'feat', text: '新增側邊欄 (Sidebar) 與導航列 (Navbar)，奠定應用程式佈局基礎' },
      { type: 'feat', text: '新增 Toast 通知系統與 Git 分支資訊整合' },
      { type: 'feat', text: '全新設計的 Quick Notes 基礎模組上線' }
    ]
  },
  {
    version: '1.0.0',
    date: '2026-02-11',
    title: '核心框架與首發釋出',
    changes: [
      { type: 'feat', text: '專案啟動 (Initial commit)' },
      { type: 'feat', text: '實作可高度客製化的快捷鍵系統 (Customizable shortcut system) 與輪播式網格 UI' },
      { type: 'feat', text: '實作 Skill Sync 同步模組及視窗狀態持久化 (Window state persistence)' }
    ]
  }
];
