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
    const branch = options.branch || null;     // 指定分支（覆寫 showAll）
    // %P=父節點（空格分隔）
    const format = '%H%x00%h%x00%s%x00%an%x00%ai%x00%D%x00%P';
    const args = ['log'];
    if (branch) {
      args.push(branch); // 只顯示指定分支
    } else if (showAll) {
      args.push('--all');
    }
    args.push(`--pretty=format:${format}`, `--max-count=${limit}`);
    try {
      const out = await runGitArgs(args, repoPath);
      if (!out.trim()) return [];
      return out.trim().split(/\r?\n/).map(line => {
        const parts = line.split('\x00');
        const [hash, shortHash, subject, authorName, authorDate, refs, parentsStr] = parts;
        if (!hash || !hash.trim()) return null;
        const refList = refs ? refs.split(',').map(r => r.trim()).filter(Boolean) : [];
        const parents = parentsStr ? parentsStr.trim().split(/\s+/).filter(Boolean) : [];
        return { hash: hash.trim(), shortHash: (shortHash || '').trim(), subject: (subject || '').trim(), authorName: (authorName || '').trim(), authorDate: (authorDate || '').trim(), refs: refList, parents };
      }).filter(Boolean);
    } catch (err) {
      return [];
    }
  });
  //#endregion

  //#region 取得單一 Commit 的 Diff
  ipcMain.handle('git-gui-commit-diff', async (event, repoPath, hash) => {
    try {
      // -m 旗標使 merge commit 也能正確列出相對於第一個 parent 的變更
      const statOut = await runGitSilent(`git diff-tree -m --no-commit-id -r --name-status ${hash}`, repoPath);
      // 去重複（-m 可能輸出重複行）
      const seen = new Set();
      const files = statOut.trim().split('\n').filter(Boolean)
        .map(line => {
          const parts = line.split('\t');
          return { status: parts[0], path: parts[parts.length - 1] };
        })
        .filter(f => {
          if (seen.has(f.path)) return false;
          seen.add(f.path);
          return true;
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
      // 先取得 parents，若是 merge commit 則 diff 第一個 parent
      const parentsOut = await runGitSilent(`git log -1 --pretty=format:%P ${hash}`, repoPath);
      const parents = parentsOut.trim().split(/\s+/).filter(Boolean);
      let out;
      if (parents.length >= 2) {
        // merge commit：與第一個 parent diff
        out = await runGitArgs(['diff', parents[0], hash, '--', filePath], repoPath);
      } else {
        out = await runGitSilent(`git show ${hash} -- "${filePath}"`, repoPath);
      }
      return out;
    } catch (err) {
      return '';
    }
  });
  //#endregion

  //#region 取得 Commit 中某檔案的原始內容（base64）
  ipcMain.handle('git-gui-file-blob', async (event, repoPath, hash, filePath) => {
    try {
      // 取得 blob hash
      const treeOut = await runGitSilent(`git ls-tree ${hash} -- "${filePath}"`, repoPath);
      if (!treeOut.trim()) return { found: false };
      const blobHash = treeOut.trim().split(/\s+/)[2];
      if (!blobHash) return { found: false };

      // 以 Buffer 讀取 blob 內容
      const buf = await new Promise((resolve, reject) => {
        const { execFile } = require('child_process');
        execFile('git', ['cat-file', 'blob', blobHash], { cwd: repoPath, maxBuffer: 1024 * 1024 * 20, encoding: 'buffer' }, (err, stdout) => {
          if (err) reject(err); else resolve(stdout);
        });
      });

      // 偵測是否為二進制（前 8000 bytes 中有 null byte）
      const sample = buf.slice(0, 8000);
      let isBinary = false;
      for (let i = 0; i < sample.length; i++) {
        if (sample[i] === 0) { isBinary = true; break; }
      }

      const ext = filePath.split('.').pop().toLowerCase();
      const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'ico', 'tiff', 'tga'];
      const isImage = imageExts.includes(ext);

      if (isImage) {
        const mimeMap = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', bmp: 'image/bmp', svg: 'image/svg+xml', ico: 'image/x-icon', tiff: 'image/tiff', tga: 'image/x-tga' };
        return { found: true, type: 'image', mime: mimeMap[ext] || 'image/png', base64: buf.toString('base64') };
      }
      if (isBinary) {
        return { found: true, type: 'binary', size: buf.length };
      }
      return { found: true, type: 'text', content: buf.toString('utf8') };
    } catch (err) {
      return { found: false, error: err.message };
    }
  });
  //#endregion

  //#region 取得 Working Tree 中某檔案的原始內容（圖片 base64 / 文字）
  ipcMain.handle('git-gui-workdir-blob', async (event, repoPath, filePath) => {
    try {
      const path = require('path');
      const fs = require('fs');
      const fullPath = path.join(repoPath, filePath);
      if (!fs.existsSync(fullPath)) return { found: false };

      const buf = fs.readFileSync(fullPath);
      const ext = filePath.split('.').pop().toLowerCase();
      const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'ico', 'tiff', 'tga'];
      const isImage = imageExts.includes(ext);

      // 偵測二進制
      const sample = buf.slice(0, 8000);
      let isBinary = false;
      for (let i = 0; i < sample.length; i++) {
        if (sample[i] === 0) { isBinary = true; break; }
      }

      if (isImage) {
        const mimeMap = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', bmp: 'image/bmp', svg: 'image/svg+xml', ico: 'image/x-icon', tiff: 'image/tiff', tga: 'image/x-tga' };
        return { found: true, type: 'image', mime: mimeMap[ext] || 'image/png', base64: buf.toString('base64') };
      }
      if (isBinary) return { found: true, type: 'binary', size: buf.length };
      return { found: true, type: 'text', content: buf.toString('utf8') };
    } catch (err) {
      return { found: false, error: err.message };
    }
  });
  //#endregion

  //#region 取得 Working Tree Diff（未提交變更）
  ipcMain.handle('git-gui-workdir-diff', async (event, repoPath, filePath, staged) => {
    try {
      if (staged) {
        // Staged diff（Index vs HEAD）
        const out = await runGitSilent(`git diff --cached -- "${filePath}"`, repoPath);
        return out;
      }
      // Unstaged diff（Working tree vs Index）
      let out = await runGitSilent(`git diff -- "${filePath}"`, repoPath);
      // untracked 檔案：直接讀取內容回傳空（由前端 ShowFileBlob 處理）
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

      // Tags
      const tagOut = await runGitArgs(
        ['for-each-ref', '--sort=-creatordate', '--format=%(refname:short)|%(objectname:short)', 'refs/tags/'],
        repoPath
      );
      const tags = tagOut.trim().split('\n').filter(Boolean).map(line => {
        const [name, hash] = line.split('|');
        return { name: name.trim(), hash: hash?.trim() };
      });

      return { local, remote, tags, currentBranch: current };
    } catch (err) {
      return { local: [], remote: [], tags: [], currentBranch: '' };
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
      const out = await runGitSilent('git status --porcelain=v1 -u', repoPath);
      const stagedEntries = [];
      const unstagedEntries = [];

      out.trim().split('\n').filter(Boolean).forEach(line => {
        const x = line[0]; // Index (staged) status
        const y = line[1]; // Working tree (unstaged) status
        // 處理 rename: 'old -> new'
        let filePath = line.substring(3).trim().replace(/^"|"$/g, '');
        if (filePath.includes(' -> ')) filePath = filePath.split(' -> ')[1];

        const isUntracked = x === '?' && y === '?';
        const isIgnored = x === '!' && y === '!';
        if (isIgnored) return;

        // Staged 區（Index 有變更）
        if (!isUntracked && x !== ' ') {
          stagedEntries.push({ path: filePath, xy: x + y, statusChar: x, staged: true, untracked: false });
        }
        // Unstaged 區（Working tree 有變更）or untracked
        if (y !== ' ') {
          unstagedEntries.push({ path: filePath, xy: x + y, statusChar: y, staged: false, untracked: isUntracked });
        }
      });

      return [...unstagedEntries, ...stagedEntries];
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

  //#region Discard 檔案變更
  ipcMain.handle('git-gui-discard', async (event, repoPath, filePath, staged) => {
    try {
      if (staged) {
        await runGit(`git restore --staged -- "${filePath}"`, repoPath);
      }
      // 恢復工作區
      await runGit(`git restore -- "${filePath}"`, repoPath);
      return { success: true };
    } catch (err) {
      // 如果是 untracked 則刪除檔案
      try {
        const path = require('path');
        const fs = require('fs');
        const fullPath = path.join(repoPath, filePath);
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
        return { success: true };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }
  });
  //#endregion

  //#region 開啟檔案（系統預設程式）
  ipcMain.handle('git-gui-open-file', async (event, repoPath, filePath) => {
    try {
      const path = require('path');
      const { shell } = require('electron');
      const fullPath = path.join(repoPath, filePath);
      await shell.openPath(fullPath);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  //#endregion

  //#region 在檔案總管開啟檔案位置
  ipcMain.handle('git-gui-reveal-file', async (event, repoPath, filePath) => {
    try {
      const path = require('path');
      const { shell } = require('electron');
      const fullPath = path.join(repoPath, filePath);
      shell.showItemInFolder(fullPath);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
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

  ipcMain.handle('git-gui-stash-apply', async (event, repoPath, ref) => {
    try {
      await runGit(ref ? `git stash apply ${ref}` : 'git stash apply', repoPath);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.stderr || err.message };
    }
  });

  ipcMain.handle('git-gui-stash-clear', async (event, repoPath) => {
    try {
      await runGit('git stash clear', repoPath);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.stderr || err.message };
    }
  });

  ipcMain.handle('git-gui-stash-files', async (event, repoPath, ref) => {
    try {
      const out = await runGitArgs(['stash', 'show', '--name-status', ref], repoPath);
      return out.trim().split('\n').filter(Boolean).map(line => {
        const parts = line.split('\t');
        const xy = parts[0] || ' ';
        const path = parts[1] || parts[0];
        return { xy: xy + ' ', path, staged: false, untracked: false };
      });
    } catch (err) {
      return [];
    }
  });

  ipcMain.handle('git-gui-stash-file-diff', async (event, repoPath, ref, filePath) => {
    try {
      const out = await runGitArgs(['stash', 'show', '-p', '--', filePath, ref], repoPath);
      return out;
    } catch (err) {
      return '';
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
