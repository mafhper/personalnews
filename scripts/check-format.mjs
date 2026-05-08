import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const TEXT_EXTENSIONS = new Set([
  '.cjs',
  '.css',
  '.html',
  '.js',
  '.json',
  '.jsx',
  '.md',
  '.mjs',
  '.ps1',
  '.rs',
  '.sh',
  '.toml',
  '.ts',
  '.tsx',
  '.txt',
  '.yaml',
  '.yml',
]);

const TEXT_BASENAMES = new Set([
  '.env.example',
  '.gitignore',
  'AGENTS.md',
  'bun.lock',
  'Dockerfile',
]);

const IGNORED_PREFIXES = [
  '.git/',
  '.dev/',
  '.codex/',
  '.agents/',
  '.gemini/',
  '.gemini-clipboard/',
  '_dev/',
  'apps/desktop/src-tauri/target/',
  'coverage/',
  'dist/',
  'node_modules/',
  'performance-reports/',
  'public/',
  'test-results/',
  'tmp/',
];

const checkAll = process.argv.includes('--all');

function git(args, options = {}) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', options.silent ? 'ignore' : 'inherit'],
  }).trim();
}

function splitLines(output) {
  return output ? output.split(/\r?\n/u).filter(Boolean) : [];
}

function findMergeBase() {
  for (const ref of ['origin/main', 'main']) {
    try {
      return git(['merge-base', ref, 'HEAD'], { silent: true });
    } catch {
      // Try the next available ref.
    }
  }
  return null;
}

function collectFiles() {
  const files = new Set();

  if (checkAll) {
    for (const file of splitLines(git(['ls-files'], { silent: true }))) {
      files.add(file);
    }
    return files;
  }

  const mergeBase = findMergeBase();
  if (mergeBase) {
    for (const file of splitLines(
      git(['diff', '--name-only', '--diff-filter=ACMRTUXB', `${mergeBase}...HEAD`], {
        silent: true,
      }),
    )) {
      files.add(file);
    }
  }

  for (const args of [
    ['diff', '--name-only', '--diff-filter=ACMRTUXB'],
    ['diff', '--cached', '--name-only', '--diff-filter=ACMRTUXB'],
    ['ls-files', '--others', '--exclude-standard'],
  ]) {
    for (const file of splitLines(git(args, { silent: true }))) {
      files.add(file);
    }
  }

  return files;
}

function normalizePath(file) {
  return file.replaceAll('\\', '/');
}

function isIgnored(file) {
  const normalized = normalizePath(file);
  return IGNORED_PREFIXES.some((prefix) => normalized === prefix.slice(0, -1) || normalized.startsWith(prefix));
}

function isTextFile(file) {
  const basename = path.basename(file);
  const extension = path.extname(file).toLowerCase();
  return TEXT_BASENAMES.has(basename) || TEXT_EXTENSIONS.has(extension);
}

function checkFile(file) {
  const errors = [];
  const buffer = readFileSync(file);

  if (buffer.includes(0)) {
    return errors;
  }

  const text = buffer.toString('utf8');

  if (text.length > 0 && !text.endsWith('\n')) {
    errors.push('missing final newline');
  }

  const lines = text.split(/\n/u);
  lines.forEach((line, index) => {
    const cleanLine = line.endsWith('\r') ? line.slice(0, -1) : line;
    if (/[ \t]+$/u.test(cleanLine)) {
      errors.push(`trailing whitespace at line ${index + 1}`);
    }
    if (/^(<<<<<<<|=======|>>>>>>>)(?:\s|$)/u.test(cleanLine)) {
      errors.push(`merge conflict marker at line ${index + 1}`);
    }
  });

  const basename = path.basename(file).toLowerCase();
  if (path.extname(file).toLowerCase() === '.json' && !basename.startsWith('tsconfig')) {
    try {
      JSON.parse(text);
    } catch (error) {
      errors.push(`invalid JSON: ${error.message}`);
    }
  }

  return errors;
}

const files = [...collectFiles()]
  .map(normalizePath)
  .filter((file) => !isIgnored(file))
  .filter(isTextFile)
  .filter((file) => existsSync(file))
  .sort();

const failures = [];

for (const file of files) {
  const errors = checkFile(file);
  for (const error of errors) {
    failures.push(`${file}: ${error}`);
  }
}

if (failures.length > 0) {
  console.error('[format:check] Formatting issues found:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

const scope = checkAll ? 'tracked text files' : 'changed text files';
console.log(`[format:check] OK (${files.length} ${scope} checked)`);
