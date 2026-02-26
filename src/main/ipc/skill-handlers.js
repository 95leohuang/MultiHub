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

    let actualRoot = rootPath;
    const parts = rootPath.split(/[\\/]/);
    const vfcIndex = parts.indexOf('VegasFrenzyClient');
    if (vfcIndex !== -1) {
      if (vfcIndex > 1) actualRoot = parts.slice(0, vfcIndex - 1).join(path.sep);
      else if (vfcIndex > 0) actualRoot = parts.slice(0, vfcIndex).join(path.sep);
    }

    const results = { repos: [], fileMap: {}, scannedRoot: actualRoot };
    const maxDepth = 4;

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

    function findVFC(currentPath, depth) {
      if (depth > maxDepth) return;
      try {
        if (!fs.existsSync(currentPath) || !fs.statSync(currentPath).isDirectory()) return;
        const isVFC = path.basename(currentPath) === 'VegasFrenzyClient';
        if (isVFC) {
          const skillPath = path.join(currentPath, '.cursor', 'skills');
          const hasSkills = fs.existsSync(skillPath);
          const folderName = path.basename(path.dirname(currentPath));
          results.repos.push({ name: folderName, skillPath, exists: hasSkills });
          if (hasSkills) scanSkillsFolder(skillPath, folderName);
          return;
        }
        const entries = fs.readdirSync(currentPath, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) findVFC(path.join(currentPath, entry.name), depth + 1);
        }
      } catch (e) { console.error(e); }
    }

    findVFC(actualRoot, 0);
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
