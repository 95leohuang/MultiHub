# Multi Hub

一個多功能整合的桌面應用程式，基於 Electron 開發。

---

## 專案簡介

Multi Hub 是一個輕量級的桌面應用程式，將常用的網路服務整合在同一個視窗中，無需開啟瀏覽器。透過左側邊欄與右上角 Floating Dock 切換的方式，讓你可以快速存取 Messenger、ChatGPT、Gemini AI、Git Updater、Skill Sync、Quick Notes、Discord 與 Telegram。

---

## 主要功能

- **多服務整合** - 側邊欄 Tab 導航，含 favicon、未讀徽章、hover tooltip
- **Floating Dock UI** - 右上角懸浮按鈕，點擊展開 Grid Popup 切換平台（支援多服務輪播）
- **Webview 導航列** - 上一頁 / 下一頁 / 重整 / 首頁 / 在外部開啟 / 載入狀態指示
- **未讀徽章系統** - Messenger / Discord / Telegram 未讀數同步至側邊欄、Grid Popup、Dock 三層
- **Toast 通知系統** - 支援 info / success / warning / error 四種類型
- **深色 / 淺色主題** - 一鍵切換，偏好自動持久化
- **Quick Notes** - 內建筆記功能，支援新增、編輯、自動儲存、複製、刪除
- **Git Repo Updater** - 批次更新本地 Git 儲存庫，顯示分支 / dirty / behind 狀態
- **Skill Sync** - 跨專案 `.cursor/skills` 技能檔案比較與同步
- **系統匣常駐** - 關閉視窗後最小化至系統匣
- **快捷鍵設定** - Alt+1~7 自訂綁定服務，支援多服務輪播
- **視窗記憶** - 自動記住視窗位置與大小
- **單一實例** - 防止重複開啟

---

## 技術架構

| 項目 | 說明 |
|------|------|
| 框架 | Electron 27.x |
| 語言 | JavaScript (ES6+) |
| 儲存 | electron-store |
| 打包 | electron-builder |

---

## 整合服務

| 服務 | 網址 | 說明 |
|------|------|------|
| Messenger | messenger.com | Facebook 即時通訊 |
| ChatGPT | chatgpt.com | OpenAI 對話式 AI |
| Gemini | gemini.google.com | Google AI 助理 |
| Git Update | — | 本地 Git Repo 批次更新工具 |
| Skill Sync | — | 跨專案技能檔案同步工具 |
| Quick Notes | — | 輕量內建筆記 |
| Discord | discord.com | 遊戲社群通訊 |
| Telegram | web.telegram.org | 加密即時通訊 |

---

## 專案結構

```
Multi Hub/
├── src/
│   ├── main/                       # Electron 主程序（模組化）
│   │   ├── index.js                # 主程序入口
│   │   ├── window.js               # BrowserWindow 建立與管理
│   │   ├── tray.js                 # 系統匣與未讀徽章
│   │   ├── menu.js                 # 應用程式選單
│   │   ├── shortcuts.js            # 全域快捷鍵
│   │   └── ipc/
│   │       ├── store-handlers.js   # 設定儲存、路徑、Toast IPC
│   │       ├── git-handlers.js     # Git 操作 IPC
│   │       └── skill-handlers.js  # Skill Sync IPC
│   ├── renderer/                   # 渲染程序（模組化）
│   │   ├── app.js                  # 渲染程序主入口
│   │   ├── platform-config.js      # 平台設定資料
│   │   ├── toast.js                # Toast 通知系統
│   │   ├── sidebar.js              # 側邊欄渲染與徽章
│   │   ├── nav-bar.js              # 導航列
│   │   ├── tab-manager.js          # Tab 切換與 Webview 管理
│   │   ├── grid-popup.js           # Grid Popup
│   │   ├── shortcut-settings.js    # 快捷鍵設定 Modal
│   │   ├── theme.js                # 主題切換
│   │   ├── quick-notes.js          # Quick Notes 功能
│   │   ├── css/                    # 樣式模組
│   │   │   ├── base.css            # CSS 變數 & 全域重置
│   │   │   ├── layout.css          # 主佈局、側邊欄、導航列、Webview
│   │   │   ├── components.css      # Dock、Grid Popup、Modal、快捷鍵列
│   │   │   ├── utils.css           # 動畫、Toast、Loading、徽章、捲動條
│   │   │   ├── themes.css          # 淺色主題覆寫
│   │   │   └── features/
│   │   │       ├── skill-sync.css  # Skill Sync 樣式
│   │   │       ├── git-updater.css # Git Updater 樣式
│   │   │       └── quick-notes.css # Quick Notes 樣式
│   │   └── features/
│   │       ├── git-updater-ui.js   # Git Updater 渲染邏輯
│   │       └── skill-sync-ui.js    # Skill Sync 渲染邏輯
│   ├── index.html                  # 主頁面
│   ├── preload.js                  # 預載腳本（contextBridge）
│   └── webview-preload.js          # Webview 注入腳本
├── assets/                         # 應用程式圖示
├── dist/                           # 建置輸出
├── package.json
└── start.bat
```

---

## 快速開始

### 環境需求

- Node.js 18.x 或更高版本
- npm 9.x 或更高版本

### 安裝依賴

```bash
npm install
```

### 開發模式

```bash
npm start
```

### 建置 Portable 版本

```bash
npm run build:win
```

建置完成後，輸出檔案位於 `dist/` 目錄。

---

## 快捷鍵

| 快捷鍵 | 功能 |
|--------|------|
| `Alt+\`` | 顯示/隱藏視窗 |
| `Ctrl+Shift+M` | 顯示/隱藏視窗（備用） |
| `Alt+1~7` | 切換對應平台（支援多服務輪播） |
| `Ctrl+Tab` | 切換下一個平台 |
| `Ctrl+G` | 開關 Grid Popup |
| `Ctrl+R` | 重新載入目前 Webview |
| `Ctrl+Shift+R` | 強制重新載入 |
| `Ctrl+Plus` | 放大 |
| `Ctrl+Minus` | 縮小 |
| `Ctrl+0` | 重設縮放 |
| `F11` | 全螢幕 |
| `Esc` | 關閉 Popup / Modal |

---

## 自訂圖示

| 平台 | 檔案格式 | 建議尺寸 |
|------|----------|----------|
| Windows | icon.ico | 256x256 |
| macOS | icon.icns | 512x512 |
| Linux | icon.png | 512x512 |

---

## 授權

MIT License
