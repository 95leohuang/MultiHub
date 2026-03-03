/**
 * Webview 預載腳本
 * 用於注入自訂樣式與功能到 webview 中
 */

// 注入自訂樣式
function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    /* 優化滾動條樣式 */
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    ::-webkit-scrollbar-track {
      background: #f1f1f1;
    }

    ::-webkit-scrollbar-thumb {
      background: #888;
      border-radius: 4px;
    }

    ::-webkit-scrollbar-thumb:hover {
      background: #555;
    }

    /* 深色模式支援 */
    @media (prefers-color-scheme: dark) {
      ::-webkit-scrollbar-track {
        background: #2c2c2c;
      }

      ::-webkit-scrollbar-thumb {
        background: #666;
      }

      ::-webkit-scrollbar-thumb:hover {
        background: #888;
      }
    }

    /* 選取文字高亮 */
    ::selection {
      background-color: rgba(0, 132, 255, 0.3);
    }
  `;
  document.head.appendChild(style);
}

//#endregion

// 頁面載入完成後執行
window.addEventListener('DOMContentLoaded', () => {
  injectStyles();
  console.log('Webview preload script loaded');
});

// 錯誤處理
window.addEventListener('error', (event) => {
  console.error('Webview error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Webview unhandled promise rejection:', event.reason);
});
