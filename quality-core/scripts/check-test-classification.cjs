#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');

const IGNORED_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  '.dev',
  '_dev',
  'coverage',
  'performance-reports',
  'logs',
  'docs',
  'tmp',
  'temp',
  '.bun',
  '.cache',
  '.parcel-cache',
  '.git',
  '.idea',
  '.vscode',
  '__tests_unused',
]);

const TEST_CANDIDATE_RE = /\.(test|spec)\.(ts|tsx)$/;
const CORE_RE = /\.core\.test\.(ts|tsx)$/;
const SMOKE_RE = /\.smoke\.test\.(ts|tsx)$/;
const PLAIN_RE = /\.test\.(ts|tsx)$/;

function walk(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
      continue;
    }

    files.push(fullPath);
  }

  return files;
}

function toRelative(file) {
  return path.relative(ROOT, file).replace(/\\/g, '/');
}

function main() {
  const allFiles = walk(ROOT);
  const testFiles = allFiles.filter((file) => TEST_CANDIDATE_RE.test(file));

  const orphaned = [];
  const summary = {
    core: [],
    smoke: [],
    broad: [],
  };

  for (const file of testFiles) {
    const relative = toRelative(file);

    if (relative.startsWith('e2e/')) continue;

    if (CORE_RE.test(relative)) {
      summary.core.push(relative);
      continue;
    }

    if (SMOKE_RE.test(relative)) {
      summary.smoke.push(relative);
      continue;
    }

    if (PLAIN_RE.test(relative) && !relative.includes('.core.test.') && !relative.includes('.smoke.test.')) {
      summary.broad.push(relative);
      continue;
    }

    orphaned.push(relative);
  }

  const hasProblems = orphaned.length > 0 || summary.smoke.length === 0;

  console.log('[test:drift] core:', summary.core.length);
  console.log('[test:drift] smoke:', summary.smoke.length);
  console.log('[test:drift] broad:', summary.broad.length);

  if (summary.smoke.length === 0) {
    console.error('[test:drift] No smoke tests found. Add at least one `*.smoke.test.ts[x]` file.');
  }

  if (orphaned.length > 0) {
    console.error('[test:drift] Found test files outside the naming contract:');
    orphaned.forEach((file) => console.error(` - ${file}`));
  }

  if (hasProblems) {
    process.exit(1);
  }
}

main();
