'use strict';

const { ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * 註冊 Skill Sync 相關 IPC handlers
 */
function registerSkillHandlers() {
  //#region 比較 Skill 檔案
  ipcMain.handle('compare-skills', async (event, rootPath) => {
    if (!fs.existsSync(rootPath)) return { error: 'Invalid root path' };

    const results = { repos: [], fileMap: {}, scannedRoot: rootPath };
    const maxDepth = 6;

    function scanSkillsFolder(skillRoot, repoName, currentSubPath = '') {
      const fullPath = path.join(skillRoot, currentSubPath);
      try {
        const entries = fs.readdirSync(fullPath, { withFileTypes: true });
        entries.forEach(entry => {
          const relativePath = path.join(currentSubPath, entry.name);
          if (entry.isDirectory()) {
            scanSkillsFolder(skillRoot, repoName, relativePath);
          } else if (entry.isFile()) {
            const filePath = path.join(fullPath, entry.name);
            const content = fs.readFileSync(filePath);
            const hash = crypto.createHash('md5').update(content).digest('hex');
            const stat = fs.statSync(filePath);
            const fileKey = relativePath.replace(/\\/g, '/');
            if (!results.fileMap[fileKey]) results.fileMap[fileKey] = {};
            results.fileMap[fileKey][repoName] = { hash, mtime: stat.mtimeMs, size: stat.size };
          }
        });
      } catch (e) { console.error(e); }
    }

    // 第一階段：收集所有含有 .cursor/skills 的資料夾
    const foundFolders = [];

    function collectSkillFolders(currentPath, depth) {
      if (depth > maxDepth) return;

      const folderName = path.basename(currentPath);
      // 強制忽略 ArtTemp 資料夾 (不分大小寫)
      if (folderName.toLowerCase() === 'arttemp') return;

      try {
        if (!fs.existsSync(currentPath) || !fs.statSync(currentPath).isDirectory()) return;

        const skillPath = path.join(currentPath, '.cursor', 'skills');
        if (fs.existsSync(skillPath) && fs.statSync(skillPath).isDirectory()) {
          foundFolders.push({
            folderName: folderName,
            parentName: path.basename(path.dirname(currentPath)),
            skillPath: skillPath
          });
          return; // 找到後不再往下搜尋
        }

        const entries = fs.readdirSync(currentPath, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name.toLowerCase() !== 'arttemp') {
            collectSkillFolders(path.join(currentPath, entry.name), depth + 1);
          }
        }
      } catch (e) { console.error(e); }
    }

    collectSkillFolders(rootPath, 0);

    // 第二階段：決定每個 Repo 的顯示名稱
    // 檢查 folderName 是否有重複，若有則改用 parentName
    const folderNameCount = {};
    foundFolders.forEach(f => {
      folderNameCount[f.folderName] = (folderNameCount[f.folderName] || 0) + 1;
    });

    foundFolders.forEach(f => {
      // 如果同名的資料夾超過一個，使用上層資料夾名稱（與原始邏輯一致）
      const repoName = folderNameCount[f.folderName] > 1 ? f.parentName : f.folderName;
      results.repos.push({ name: repoName, skillPath: f.skillPath, exists: true });
      scanSkillsFolder(f.skillPath, repoName);
    });

    return results;
  });
  //#endregion

  //#region 讀取 Skill 檔案內容
  ipcMain.handle('read-skill-content', async (event, { skillPath, filename }) => {
    try {
      const fullPath = path.join(skillPath, filename);
      if (!fs.existsSync(fullPath)) return { error: 'File not found' };
      return { content: fs.readFileSync(fullPath, 'utf8') };
    } catch (err) {
      return { error: err.message };
    }
  });
  //#endregion

  //#region 同步 Skill 檔案
  ipcMain.handle('sync-skill-file', async (event, { sourceSkillPath, filename, targetSkillPaths }) => {
    try {
      const sourcePath = path.join(sourceSkillPath, filename);
      const content = fs.readFileSync(sourcePath);
      for (const targetSkillPath of targetSkillPaths) {
        const destPath = path.join(targetSkillPath, filename);
        const destDir = path.dirname(destPath);
        if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
        fs.writeFileSync(destPath, content);
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  //#endregion
}

module.exports = { registerSkillHandlers };
