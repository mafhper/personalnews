/**
 * Lint only changed files to speed up local feedback.
 * Falls back to full lint if git is unavailable or no files match.
 */
const { spawnSync } = require('child_process');
const path = require('path');

const ROOT = process.cwd();
const VALID_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const MAX_CMD_LENGTH_WIN = 7000;
const ESLINT_COMMON_ARGS = ['--ext', '.ts,.tsx', '--cache', '--cache-location', 'performance-reports/.eslintcache'];

function run(cmd, args, opts = {}) {
  return spawnSync(cmd, args, {
    stdio: 'inherit',
    cwd: ROOT,
    shell: process.platform === 'win32',
    ...opts,
  });
}

function capture(cmd, args) {
  const res = spawnSync(cmd, args, {
    cwd: ROOT,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  if (res.error || res.status !== 0) return null;
  return res.stdout.trim();
}

function listChangedFiles() {
  const diff = capture('git', ['diff', '--name-only', '--diff-filter=ACMRTUXB']);
  const staged = capture('git', ['diff', '--name-only', '--cached', '--diff-filter=ACMRTUXB']);
  const untracked = capture('git', ['ls-files', '--others', '--exclude-standard']);
  if (diff === null && staged === null && untracked === null) return null;

  const files = new Set();
  [diff, staged, untracked].forEach((block) => {
    if (!block) return;
    block.split(/\r?\n/).forEach((line) => {
      if (!line) return;
      files.add(line.trim());
    });
  });

  return Array.from(files);
}

function filterLintFiles(files) {
  return files.filter((file) => VALID_EXTS.has(path.extname(file)));
}

function splitFilesIntoChunks(fileList, maxLength) {
  if (process.platform !== 'win32') return [fileList];
  const chunks = [];
  let current = [];
  let currentLength = 0;

  for (const file of fileList) {
    const nextCost = file.length + 4;
    if (current.length > 0 && currentLength + nextCost > maxLength) {
      chunks.push(current);
      current = [];
      currentLength = 0;
    }
    current.push(file);
    currentLength += nextCost;
  }

  if (current.length > 0) {
    chunks.push(current);
  }

  return chunks;
}

function runEslintWithCmd(cmd, chunks) {
  for (let idx = 0; idx < chunks.length; idx += 1) {
    const chunk = chunks[idx];
    const eslintArgs = ['eslint', ...chunk, ...ESLINT_COMMON_ARGS];
    if (chunks.length > 1) {
      console.log(`[lint:fast] Lote ${idx + 1}/${chunks.length} (${chunk.length} arquivos)`);
    }
    const result = run(cmd, eslintArgs);
    if (result.error || result.status === 127) {
      return 127;
    }
    if (result.status && result.status !== 0) {
      return result.status;
    }
  }
  return 0;
}

function runEslint(fileList) {
  const chunks = splitFilesIntoChunks(fileList, MAX_CMD_LENGTH_WIN);
  if (chunks.length > 1) {
    console.log(`[lint:fast] Dividido em ${chunks.length} lotes para evitar limite de comando no Windows.`);
  }

  let status = runEslintWithCmd('bunx', chunks);
  if (status === 127) {
    status = runEslintWithCmd('npx', chunks);
  }
  return status || 0;
}

function runFullLint() {
  const BUN_BIN = process.env.BUN_PATH || 'bun';
  const result = run(BUN_BIN, ['run', 'lint']);
  return result.status || 0;
}

const changedFiles = listChangedFiles();
if (changedFiles === null) {
  console.log('[lint:fast] Git indisponível. Executando lint completo.');
  process.exit(runFullLint());
}

const lintFiles = filterLintFiles(changedFiles);
if (lintFiles.length === 0) {
  console.log('[lint:fast] Nenhum arquivo relevante alterado.');
  process.exit(0);
}

console.log(`[lint:fast] Arquivos analisados: ${lintFiles.length}`);
process.exit(runEslint(lintFiles));
