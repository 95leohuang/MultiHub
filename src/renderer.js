// 渲染进程脚本（如果需要的话）
// 由于我们直接加载 messenger.com，大部分功能由预加载脚本处理

// 监听来自主进程的事件
if (window.electronAPI) {
  // 新对话快捷键
  window.electronAPI.onNewConversation(() => {
    const newMessageButton = document.querySelector('[aria-label*="新消息"], [aria-label*="New message"]');
    if (newMessageButton) {
      newMessageButton.click();
    }
  });

  // 显示设置
  window.electronAPI.onShowSettings(() => {
    const settingsButton = document.querySelector('[aria-label*="设置"], [aria-label*="Settings"]');
    if (settingsButton) {
      settingsButton.click();
    }
  });
}

// 页面加载完成后的初始化
document.addEventListener('DOMContentLoaded', () => {
  console.log('Multi Hub Renderer - Ready');
});





