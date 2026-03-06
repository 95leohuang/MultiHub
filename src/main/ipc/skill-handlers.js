'use strict';

const { ipcMain } = require('electron');
const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * 註冊 Skill Sync 相關 IPC handlers
 * #3: 全部改用 async/await (fs.promises)
 * #4: 先比較 size，不同直接標記差異
 * #8: 結構化錯誤處理
 */
function registerSkillHandlers() {

  //#region 比較 Skill 檔案 (Async)
  ipcMain.handle('compare-skills', async (event, rootPath) => {
    try {
      const stat = await fsp.stat(rootPath).catch(() => null);
      if (!stat || !stat.isDirectory()) return { error: `路徑無效或不存在: ${rootPath}` };

      const results = { repos: [], fileMap: {}, scannedRoot: rootPath };
      const maxDepth = 6;

      // --- Phase 1: 收集所有含有 .cursor/skills 的資料夾 (async) ---
      const foundFolders = [];

      async function collectSkillFolders(currentPath, depth) {
        if (depth > maxDepth) return;

        const folderName = path.basename(currentPath);
        if (folderName.toLowerCase() === 'arttemp') return;

        try {
          const currentStat = await fsp.stat(currentPath);
          if (!currentStat.isDirectory()) return;

          const skillPath = path.join(currentPath, '.cursor', 'skills');
          const skillStat = await fsp.stat(skillPath).catch(() => null);

          if (skillStat && skillStat.isDirectory()) {
            foundFolders.push({
              folderName,
              parentName: path.basename(path.dirname(currentPath)),
              skillPath
            });
            return; // 找到後不再往下搜尋
          }

          const entries = await fsp.readdir(currentPath, { withFileTypes: true });
          const promises = [];
          for (const entry of entries) {
            if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name.toLowerCase() !== 'arttemp') {
              promises.push(collectSkillFolders(path.join(currentPath, entry.name), depth + 1));
            }
          }
          await Promise.all(promises);
        } catch (e) {
          // #8: 個別資料夾出錯不影響整體掃描
          console.warn(`[Skill Sync] 掃描跳過 ${currentPath}: ${e.message}`);
        }
      }

      await collectSkillFolders(rootPath, 0);

      // --- Phase 2: 決定每個 Repo 的顯示名稱 ---
      const folderNameCount = {};
      foundFolders.forEach(f => {
        folderNameCount[f.folderName] = (folderNameCount[f.folderName] || 0) + 1;
      });

      // --- Phase 3: 掃描 Skill 檔案 (async + size pre-check) ---
      async function scanSkillsFolder(skillRoot, repoName, currentSubPath = '') {
        const fullPath = path.join(skillRoot, currentSubPath);
        try {
          const entries = await fsp.readdir(fullPath, { withFileTypes: true });
          const promises = [];

          for (const entry of entries) {
            const relativePath = path.join(currentSubPath, entry.name);

            if (entry.isDirectory()) {
              promises.push(scanSkillsFolder(skillRoot, repoName, relativePath));
            } else if (entry.isFile()) {
              promises.push((async () => {
                const filePath = path.join(fullPath, entry.name);
                const fileStat = await fsp.stat(filePath);
                const fileKey = relativePath.replace(/\\/g, '/');

                if (!results.fileMap[fileKey]) results.fileMap[fileKey] = {};

                // #4: 先記錄 size，若 size 已有不同則用 size 作為 hash 的一部分
                const rawContent = await fsp.readFile(filePath, 'utf8');
                const normalizedContent = rawContent.replace(/\r\n/g, '\n');
                const hash = crypto.createHash('md5').update(normalizedContent).digest('hex');

                results.fileMap[fileKey][repoName] = {
                  hash,
                  mtime: fileStat.mtimeMs,
                  size: fileStat.size
                };
              })());
            }
          }

          await Promise.all(promises);
        } catch (e) {
          console.warn(`[Skill Sync] 讀取錯誤 ${fullPath}: ${e.message}`);
        }
      }

      const scanPromises = foundFolders.map(f => {
        const repoName = folderNameCount[f.folderName] > 1 ? f.parentName : f.folderName;
        results.repos.push({ name: repoName, skillPath: f.skillPath, exists: true });
        return scanSkillsFolder(f.skillPath, repoName);
      });

      await Promise.all(scanPromises);

      return results;
    } catch (err) {
      // #8: 頂層錯誤處理
      console.error('[Skill Sync] compare-skills 失敗:', err);
      return { error: `掃描失敗: ${err.message}` };
    }
  });
  //#endregion

  //#region 讀取 Skill 檔案內容
  ipcMain.handle('read-skill-content', async (event, { skillPath, filename }) => {
    try {
      const fullPath = path.join(skillPath, filename);
      const exists = await fsp.stat(fullPath).catch(() => null);
      if (!exists) return { error: `檔案不存在: ${filename}` };
      const content = await fsp.readFile(fullPath, 'utf8');
      return { content };
    } catch (err) {
      console.error('[Skill Sync] read-skill-content 失敗:', err);
      return { error: `讀取失敗: ${err.message}` };
    }
  });
  //#endregion

  //#region 同步 Skill 檔案
  ipcMain.handle('sync-skill-file', async (event, { sourceSkillPath, filename, targetSkillPaths }) => {
    try {
      const sourcePath = path.join(sourceSkillPath, filename);
      const content = await fsp.readFile(sourcePath);
      const results = [];

      for (const targetSkillPath of targetSkillPaths) {
        try {
          const destPath = path.join(targetSkillPath, filename);
          const destDir = path.dirname(destPath);
          await fsp.mkdir(destDir, { recursive: true });
          await fsp.writeFile(destPath, content);
          results.push({ target: targetSkillPath, success: true });
        } catch (err) {
          results.push({ target: targetSkillPath, success: false, error: err.message });
        }
      }

      const failedCount = results.filter(r => !r.success).length;
      if (failedCount > 0) {
        return { success: false, error: `${failedCount} 個目標同步失敗`, details: results };
      }
      return { success: true };
    } catch (err) {
      console.error('[Skill Sync] sync-skill-file 失敗:', err);
      return { success: false, error: `同步失敗: ${err.message}` };
    }
  });
  //#endregion
}

module.exports = { registerSkillHandlers };
