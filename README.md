# Multi Hub

一個多功能整合的桌面應用程式，基於 Electron 開發。

---

## 專案簡介

Multi Hub 是一個輕量級的桌面應用程式，將常用的網路服務整合在同一個視窗中，無需開啟瀏覽器。透過右上角 Floating Dock 切換的方式，讓你可以快速存取 Messenger、ChatGPT、Gemini AI、YouTube、Discord 與 Telegram。

---

## 主要功能

- **六分頁介面** - 整合 Messenger、ChatGPT、Gemini AI、YouTube、Discord、Telegram
- **Floating Dock UI** - 右上角懸浮按鈕，點擊展開 Grid Popup 切換平台
- **系統匣常駐** - 關閉視窗後最小化至系統匣，不會完全退出
- **全域快捷鍵** - 使用 Alt+` 或 Ctrl+Shift+M 快速顯示/隱藏視窗
- **視窗記憶** - 自動記住視窗位置與大小
- **未讀訊息提示** - 系統匣圖示顯示未讀訊息數量
- **單一實例** - 防止重複開啟多個應用程式
- **右鍵選單** - 支援圖片儲存、複製等常用操作

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
| YouTube | youtube.com | 影音串流平台 |
| Discord | discord.com | 遊戲社群通訊 |
| Telegram | web.telegram.org | 加密即時通訊 |

---

## 專案結構

```
Multi_Hub/
├── src/                    # 原始碼目錄
│   ├── main.js             # Electron 主程序
│   ├── preload.js          # 預載腳本
│   ├── renderer.js         # 渲染程序
│   ├── index.html          # 主頁面（含分頁）
│   ├── tabs.js             # 分頁切換邏輯
│   ├── tabs.css            # 分頁樣式
│   ├── utils.js            # 工具函式
│   └── webview-preload.js  # Webview 預載腳本
├── assets/                 # 資源目錄
│   └── icon.ico            # 應用程式圖示（需自行放置）
├── dist/                   # 建置輸出目錄
├── build-portable.bat      # 建置腳本（英文版）
├── build-portable-cn.bat   # 建置腳本（中文版）
├── start.bat               # 開發啟動腳本
└── package.json            # 專案設定
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

或直接執行 `start.bat`

### 建置 Portable 版本

執行 `build-portable.bat` 或 `build-portable-cn.bat`

建置完成後，輸出檔案位於 `dist/` 目錄：
- `Multi Hub-2.1.0-Portable.exe` - 免安裝單檔執行版

---

## 自訂圖示

若要使用自訂圖示，請將圖示檔案放置於 `assets/` 目錄：

| 平台 | 檔案格式 | 建議尺寸 |
|------|----------|----------|
| Windows | icon.ico | 256x256 |
| macOS | icon.icns | 512x512 |
| Linux | icon.png | 512x512 |

---

## 快捷鍵

| 快捷鍵 | 功能 |
|--------|------|
| Alt+` | 顯示/隱藏視窗 |
| Ctrl+Shift+M | 顯示/隱藏視窗（備用） |
| Ctrl+1~6 | 切換到對應平台 |
| Ctrl+Tab | 切換下一個平台 |
| Ctrl+G | 開關 Grid Popup |
| Ctrl+R | 重新載入頁面 |
| Ctrl+Shift+R | 強制重新載入 |
| Ctrl+Plus | 放大 |
| Ctrl+Minus | 縮小 |
| Ctrl+0 | 重設縮放 |
| F11 | 全螢幕 |

---

## 授權

MIT License
