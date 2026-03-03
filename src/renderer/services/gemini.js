export const gemini = {
  id: 'gemini',
  label: 'Gemini',
  favicon: 'https://www.gstatic.com/lamda/images/gemini_favicon_f069958c85030456e93de685481c559f160ea06b.png',
  homeUrl: 'https://gemini.google.com',
  color: '#8b5cf6',
  type: 'webview',
  partition: false, // Use the default Electron partition to retain user login info
  allowpopups: true,
  preload: './webview-preload.js'
};
