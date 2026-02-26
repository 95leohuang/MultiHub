'use strict';

const { ipcMain } = require('electron');
const { exec, execFile } = require('child_process');

//#region 工具函式
/**
 * 執行 git 指令並回傳 stdout 字串
 * @param {string} cmd
 * @param {string} cwd
 * @returns {Promise<string>}
 */
function runGit(cmd, cwd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { cwd, maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) { error.stderr = stderr; reject(error); return; }
      resolve(stdout);
    });
  });
}

/**
 * 執行 git 指令，失敗時回傳空字串（靜默版）
 * @param {string} cmd
 * @param {string} cwd
 * @returns {Promise<string>}
 */
function runGitSilent(cmd, cwd) {
  return new Promise((resolve) => {
    exec(cmd, { cwd, maxBuffer: 1024 * 1024 * 10 }, (error, stdout) => {
      resolve(error ? '' : stdout);
    });
  });
}

/**
 * 以陣列參數執行 git（避免 Windows shell 展開 % 字元）
 * @param {string[]} args
 * @param {string} cwd
 * @returns {Promise<string>}
 */
function runGitArgs(args, cwd) {
  return new Promise((resolve) => {
    execFile('git', args, { cwd, maxBuffer: 1024 * 1024 * 10 }, (error, stdout) => {
      resolve(error ? '' : stdout);
    });
  });
}
//#endregion

/**
 * 註冊 Git GUI 相關 IPC handlers
 */
function registerGitGuiHandlers() {

  //#region 取得 Commit Log 列表
  ipcMain.handle('git-gui-log', async (event, repoPath, options = {}) => {
    const limit = options.limit || 300;
    const showAll = options.showAll !== false; // 預設 true
    // %P=父節點（空格分隔）
    const format = '%H%x00%h%x00%s%x00%an%x00%ai%x00%D%x00%P';
    const args = ['log'];
    if (showAll) args.push('--all');
    args.push(`--pretty=format:${format}`, `--max-count=${limit}`);
    try {
      const out = await runGitArgs(args, repoPath);
      if (!out.trim()) return [];
      return out.trim().split('\n').map(line => {
        const parts = line.split('\x00');
        const [hash, shortHash, subject, authorName, authorDate, refs, parentsStr] = parts;
        const refList = refs ? refs.split(',').map(r => r.trim()).filter(Boolean) : [];
        const parents = parentsStr ? parentsStr.trim().split(' ').filter(Boolean) : [];
        return { hash, shortHash, subject, authorName, authorDate, refs: refList, parents };
      });
    } catch (err) {
      return [];
    }
  });
  //#endregion

  //#region 取得單一 Commit 的 Diff
  ipcMain.handle('git-gui-commit-diff', async (event, repoPath, hash) => {
    try {
      // 取得變更的檔案列表
      const statOut = await runGitSilent(`git diff-tree --no-commit-id -r --name-status ${hash}`, repoPath);
      const files = statOut.trim().split('\n').filter(Boolean).map(line => {
        const parts = line.split('\t');
        return { status: parts[0], path: parts[parts.length - 1] };
      });
      return { files };
    } catch (err) {
      return { files: [] };
    }
  });
  //#endregion

  //#region 取得單一 Commit 中某檔案的 Diff 內容
  ipcMain.handle('git-gui-file-diff', async (event, repoPath, hash, filePath) => {
    try {
      const out = await runGitSilent(`git show ${hash} -- "${filePath}"`, repoPath);
      return out;
    } catch (err) {
      return '';
    }
  });
  //#endregion

  //#region 取得 Working Tree Diff（未提交變更）
  ipcMain.handle('git-gui-workdir-diff', async (event, repoPath, filePath) => {
    try {
      // 嘗試取得 staged diff，若無則取 unstaged diff
      let out = await runGitSilent(`git diff --cached -- "${filePath}"`, repoPath);
      if (!out.trim()) {
        out = await runGitSilent(`git diff -- "${filePath}"`, repoPath);
      }
      return out;
    } catch (err) {
      return '';
    }
  });
  //#endregion

  //#region 取得所有分支列表
  ipcMain.handle('git-gui-branches', async (event, repoPath) => {
    try {
      const currentOut = await runGitSilent('git rev-parse --abbrev-ref HEAD', repoPath);
      const current = currentOut.trim();

      // 使用 for-each-ref + execFile 避免 Windows % 展開問題
      const localOut = await runGitArgs(
        ['for-each-ref', '--format=%(refname:short)|%(objectname:short)|%(upstream:short)|%(upstream:track)', 'refs/heads/'],
        repoPath
      );
      const local = localOut.trim().split('\n').filter(Boolean).map(line => {
        const [name, hash, upstream, track] = line.split('|');
        return { name: name.trim(), hash: hash?.trim(), upstream: upstream?.trim(), track: track?.trim(), isCurrent: name.trim() === current };
      });

      const remoteOut = await runGitArgs(
        ['for-each-ref', '--format=%(refname:short)|%(objectname:short)', 'refs/remotes/'],
        repoPath
      );
      const remote = remoteOut.trim().split('\n').filter(Boolean)
        .filter(l => !l.includes('/HEAD'))
        .map(line => {
          const [name, hash] = line.split('|');
          return { name: name.trim(), hash: hash?.trim() };
        });

      return { local, remote, current };
    } catch (err) {
      return { local: [], remote: [], current: '' };
    }
  });
  //#endregion

  //#region 切換分支
  ipcMain.handle('git-gui-checkout', async (event, repoPath, branchName) => {
    try {
      await runGit(`git checkout "${branchName}"`, repoPath);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.stderr || err.message };
    }
  });
  //#endregion

  //#region 新增本地分支
  ipcMain.handle('git-gui-create-branch', async (event, repoPath, branchName, fromRef) => {
    try {
      const from = fromRef || 'HEAD';
      await runGit(`git checkout -b "${branchName}" ${from}`, repoPath);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.stderr || err.message };
    }
  });
  //#endregion

  //#region 刪除本地分支
  ipcMain.handle('git-gui-delete-branch', async (event, repoPath, branchName, force) => {
    try {
      const flag = force ? '-D' : '-d';
      await runGit(`git branch ${flag} "${branchName}"`, repoPath);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.stderr || err.message };
    }
  });
  //#endregion

  //#region 取得本地變更（Working Tree + Staged）
  ipcMain.handle('git-gui-status', async (event, repoPath) => {
    try {
      const out = await runGitSilent('git status --porcelain -u', repoPath);
      const files = out.trim().split('\n').filter(Boolean).map(line => {
        const xy = line.substring(0, 2);
        const filePath = line.substring(3).trim().replace(/^"|"$/g, '');
        const staged = xy[0] !== ' ' && xy[0] !== '?';
        const unstaged = xy[1] !== ' ';
        const untracked = xy === '??';
        return { path: filePath, xy, staged, unstaged, untracked };
      });
      return files;
    } catch (err) {
      return [];
    }
  });
  //#endregion

  //#region Stage / Unstage 檔案
  ipcMain.handle('git-gui-stage', async (event, repoPath, filePath) => {
    try {
      await runGit(`git add -- "${filePath}"`, repoPath);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.stderr || err.message };
    }
  });

  ipcMain.handle('git-gui-unstage', async (event, repoPath, filePath) => {
    try {
      await runGit(`git restore --staged -- "${filePath}"`, repoPath);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.stderr || err.message };
    }
  });

  ipcMain.handle('git-gui-stage-all', async (event, repoPath) => {
    try {
      await runGit('git add -A', repoPath);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.stderr || err.message };
    }
  });

  ipcMain.handle('git-gui-unstage-all', async (event, repoPath) => {
    try {
      await runGit('git restore --staged .', repoPath);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.stderr || err.message };
    }
  });
  //#endregion

  //#region Commit
  ipcMain.handle('git-gui-commit', async (event, repoPath, message) => {
    try {
      await runGit(`git commit -m "${message.replace(/"/g, '\\"')}"`, repoPath);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.stderr || err.message };
    }
  });
  //#endregion

  //#region Fetch / Pull / Push
  ipcMain.handle('git-gui-fetch', async (event, repoPath) => {
    try {
      const out = await runGit('git fetch --all --prune', repoPath);
      return { success: true, output: out };
    } catch (err) {
      return { success: false, error: err.stderr || err.message };
    }
  });

  ipcMain.handle('git-gui-pull', async (event, repoPath) => {
    try {
      const out = await runGit('git pull', repoPath);
      return { success: true, output: out };
    } catch (err) {
      return { success: false, error: err.stderr || err.message };
    }
  });

  ipcMain.handle('git-gui-push', async (event, repoPath, force) => {
    try {
      const cmd = force ? 'git push --force-with-lease' : 'git push';
      const out = await runGit(cmd, repoPath);
      return { success: true, output: out };
    } catch (err) {
      return { success: false, error: err.stderr || err.message };
    }
  });
  //#endregion

  //#region 取得 Commit 詳細資訊
  ipcMain.handle('git-gui-commit-detail', async (event, repoPath, hash) => {
    try {
      const format = '%H%x00%h%x00%s%x00%b%x00%an%x00%ae%x00%ai%x00%cn%x00%ci%x00%D';
      const out = await runGitSilent(`git show -s --pretty=format:"${format}" ${hash}`, repoPath);
      const clean = out.replace(/^"|"$/g, '').trim();
      const [fullHash, shortHash, subject, body, authorName, authorEmail, authorDate, committerName, committerDate, refs] = clean.split('\x00');
      return { fullHash, shortHash, subject, body, authorName, authorEmail, authorDate, committerName, committerDate, refs };
    } catch (err) {
      return null;
    }
  });
  //#endregion

  //#region 取得 Stash 列表
  ipcMain.handle('git-gui-stashes', async (event, repoPath) => {
    try {
      const out = await runGitSilent('git stash list --pretty=format:%gd|%s|%ai', repoPath);
      return out.trim().split('\n').filter(Boolean).map(line => {
        const [ref, message, date] = line.split('|');
        return { ref, message, date };
      });
    } catch (err) {
      return [];
    }
  });
  //#endregion

  //#region Stash Push / Pop / Drop
  ipcMain.handle('git-gui-stash-push', async (event, repoPath, message) => {
    try {
      const cmd = message ? `git stash push -m "${message.replace(/"/g, '\\"')}"` : 'git stash push';
      await runGit(cmd, repoPath);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.stderr || err.message };
    }
  });

  ipcMain.handle('git-gui-stash-pop', async (event, repoPath, ref) => {
    try {
      await runGit(ref ? `git stash pop ${ref}` : 'git stash pop', repoPath);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.stderr || err.message };
    }
  });

  ipcMain.handle('git-gui-stash-drop', async (event, repoPath, ref) => {
    try {
      await runGit(`git stash drop ${ref}`, repoPath);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.stderr || err.message };
    }
  });
  //#endregion

  //#region 取得 Tag 列表
  ipcMain.handle('git-gui-tags', async (event, repoPath) => {
    try {
      const out = await runGitSilent('git tag --sort=-creatordate --format=%(refname:short)|%(creatordate:short)|%(subject)', repoPath);
      return out.trim().split('\n').filter(Boolean).map(line => {
        const [name, date, message] = line.split('|');
        return { name, date, message };
      });
    } catch (err) {
      return [];
    }
  });
  //#endregion
}

module.exports = { registerGitGuiHandlers };
