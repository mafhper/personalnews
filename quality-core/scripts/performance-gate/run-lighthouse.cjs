#!/usr/bin/env node
/**
 * Compatibility entrypoint for performance-gate Lighthouse.
 * Delegates to the unified CLI runner to keep behavior and TUI consistent.
 */

const { spawn } = require('child_process');
const path = require('path');

const targetScript = path.resolve(__dirname, '../../cli/run-lighthouse.cjs');
const forwardedArgs = process.argv.slice(2);

const child = spawn(process.execPath, [targetScript, ...forwardedArgs], {
  stdio: 'inherit',
  shell: false,
  env: process.env,
});

child.on('error', (err) => {
  console.error(`[perf:lighthouse] Failed to start delegated runner: ${err.message}`);
  process.exit(1);
});

child.on('close', (code, signal) => {
  if (signal) {
    process.exit(1);
  }
  process.exit(code ?? 1);
});
