#!/usr/bin/env node
/**
 * Run Vitest in serial mode without relying on cross-env resolution.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const args = process.argv.slice(2);

function getFlagValue(flag, fallback = '') {
  const match = args.find((arg) => arg.startsWith(`${flag}=`));
  return match ? match.slice(flag.length + 1) : fallback;
}

function resolveBunBinary() {
  if (process.env.BUN_PATH) return process.env.BUN_PATH;
  if (process.versions && process.versions.bun && process.execPath) return process.execPath;

  const home = process.env.HOME || process.env.USERPROFILE || '';
  const fallbackUnix = path.join(home, '.bun', 'bin', 'bun');
  if (home && fs.existsSync(fallbackUnix)) {
    return fallbackUnix;
  }

  return process.platform === 'win32' ? 'bun.exe' : 'bun';
}

async function main() {
  const config = getFlagValue('--config', '');
  const testTimeout = getFlagValue('--test-timeout', '15000');
  const reporter = getFlagValue('--reporter', 'dot');

  if (!config) {
    console.error('Missing required --config=<path> flag.');
    process.exit(1);
  }

  const bunBin = resolveBunBinary();
  const vitestArgs = [
    'vitest',
    'run',
    '--environment',
    'jsdom',
    '--config',
    config,
  ];

  const child = spawn(bunBin, vitestArgs, {
    cwd: ROOT,
    shell: false,
    stdio: 'inherit',
    env: {
      ...process.env,
      VITEST_MAX_THREADS: '1',
      VITEST_TEST_TIMEOUT: String(testTimeout),
      VITEST_REPORTER: String(reporter),
    },
  });

  child.on('error', (err) => {
    console.error(`Failed to launch Vitest serial runner: ${err.message}`);
    process.exit(1);
  });

  child.on('close', (code) => {
    process.exit(code ?? 1);
  });
}

main().catch((err) => {
  console.error(`Fatal error in Vitest serial runner: ${err.message}`);
  process.exit(1);
});
