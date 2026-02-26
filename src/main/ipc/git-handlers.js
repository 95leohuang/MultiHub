'use strict';

const { ipcMain } = require('electron');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * 註冊 Git 操作相關 IPC handlers
 */
function registerGitHandlers() {
  //#region 搜尋 Git 儲存庫
  ipcMain.handle('search-repos', async (event, searchPath) => {
    const repos = [];
    const maxDepth = 3;

    function walk(currentPath, depth) {
      if (depth > maxDepth) return;
      try {
        const files = fs.readdirSync(currentPath);
        if (files.includes('.git')) {
          repos.push(currentPath);
          return;
        }
        for (const file of files) {
          const fullPath = path.join(currentPath, file);
          if (fs.statSync(fullPath).isDirectory()) walk(fullPath, depth + 1);
        }
      } catch (e) {
        console.error(`Error walking ${currentPath}:`, e);
      }
    }

    walk(searchPath, 0);
    return repos;
  });
  //#endregion

  //#region 更新單一儲存庫
  ipcMain.handle('update-repo', async (event, repoPath) => {
    const channel = `update-progress-${repoPath}`;
    const sendProgress = (progress, message) => event.sender.send(channel, progress, message);

    const runCommand = (cmd) => new Promise((resolve, reject) => {
      exec(cmd, { cwd: repoPath }, (error, stdout, stderr) => {
        if (error) { error.stderr = stderr; reject(error); return; }
        resolve(stdout);
      });
    });

    let stashed = false;

    try {
      sendProgress(10, 'Fetching...');
      await runCommand('git fetch --all');

      sendProgress(30, 'Checking branches...');
      const branchesOutput = await runCommand('git branch -vv');
      const branches = branchesOutput.split('\n');
      const currentBranchMatch = branches.find(b => b.startsWith('*'));
      const currentBranch = currentBranchMatch ? currentBranchMatch.split(/\s+/)[1] : 'main';

      sendProgress(50, 'Checking for updates...');
      const behindBranches = branches.filter(b => b.includes(': behind'));

      const smartCommand = async (cmd) => {
        try {
          await runCommand(cmd);
        } catch (err) {
          if (err.stderr && (
            err.stderr.includes('local changes to the following files would be overwritten') ||
            err.stderr.includes('Please commit your changes or stash them')
          )) {
            if (!stashed) {
              sendProgress(55, 'Conflict detected, stashing...');
              const stashResult = await runCommand('git stash');
              if (!stashResult.includes('No local changes to save')) {
                stashed = true;
                await runCommand(cmd);
                return;
              }
            }
          }
          throw err;
        }
      };

      for (const b of behindBranches) {
        const branchName = b.replace('*', '').trim().split(/\s+/)[0];
        sendProgress(70, `Updating ${branchName}...`);
        await smartCommand(`git checkout ${branchName}`);
        await smartCommand('git pull');
      }

      if (currentBranchMatch) await smartCommand(`git checkout ${currentBranch}`);

      const isCurrentBehind = behindBranches.some(b =>
        b.includes(` ${currentBranch} `) || (currentBranchMatch && currentBranchMatch.includes(': behind'))
      );
      if (isCurrentBehind) {
        sendProgress(90, `Updating ${currentBranch}...`);
        await smartCommand('git pull');
      }

      if (stashed) {
        sendProgress(95, 'Restoring changes...');
        await runCommand('git stash pop');
      }

      sendProgress(100, 'Finished');
      return { success: true };
    } catch (err) {
      if (stashed) {
        try { await runCommand('git stash pop'); } catch (e) { /* ignore */ }
      }
      return { success: false, error: err.stderr || err.message };
    }
  });
  //#endregion

  //#region 取得 Repo 分支資訊
  ipcMain.handle('get-repo-info', async (event, repoPath) => {
    const runCmd = (cmd) => new Promise((resolve) => {
      exec(cmd, { cwd: repoPath }, (error, stdout) => {
        resolve(error ? '' : stdout.trim());
      });
    });

    try {
      const [branch, statusOutput, remoteStatus] = await Promise.all([
        runCmd('git rev-parse --abbrev-ref HEAD'),
        runCmd('git status --porcelain'),
        runCmd('git rev-list --left-right --count HEAD...@{upstream} 2>/dev/null || echo "0\t0"')
      ]);

      const isDirty = statusOutput.length > 0;
      const changedFiles = statusOutput.split('\n').filter(l => l.trim()).length;
      const parts = remoteStatus.split('\t');
      const ahead = parseInt(parts[0]) || 0;
      const behind = parseInt(parts[1]) || 0;

      return { branch, isDirty, changedFiles, ahead, behind };
    } catch (err) {
      return { branch: 'unknown', isDirty: false, changedFiles: 0, ahead: 0, behind: 0 };
    }
  });
  //#endregion
}

module.exports = { registerGitHandlers };
