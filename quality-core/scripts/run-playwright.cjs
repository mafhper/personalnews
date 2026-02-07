#!/usr/bin/env node
/**
 * Playwright launcher hardened for mixed Bun/Node environments.
 * Avoids bunx preflight issues and always invokes the official CLI via runtime path.
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

function resolveNodeRuntime() {
  if (process.execPath && fs.existsSync(process.execPath)) {
    return process.execPath;
  }

  const localNode = path.join(process.env.HOME || process.env.USERPROFILE || '', '.local', 'node-v22', 'bin', 'node');
  if (fs.existsSync(localNode)) return localNode;

  return process.platform === 'win32' ? 'node.exe' : 'node';
}

function withRuntimePath(baseEnv, runtimeBin) {
  const env = { ...baseEnv };
  const runtimeDir = runtimeBin ? path.dirname(runtimeBin) : '';
  if (!runtimeDir) return env;

  const key = process.platform === 'win32' ? 'Path' : 'PATH';
  const current = env[key] || env.PATH || '';
  if (!current.split(path.delimiter).includes(runtimeDir)) {
    env[key] = current ? `${runtimeDir}${path.delimiter}${current}` : runtimeDir;
  }
  return env;
}

function resolvePlaywrightCli() {
  const fromRoot = path.resolve(__dirname, '../../node_modules/@playwright/test/cli.js');
  if (fs.existsSync(fromRoot)) return fromRoot;

  return require.resolve('@playwright/test/cli.js');
}

async function main() {
  const runtime = resolveNodeRuntime();
  const cliPath = resolvePlaywrightCli();
  const forwardedArgs = process.argv.slice(2);
  const child = spawn(runtime, [cliPath, ...forwardedArgs], {
    cwd: path.resolve(__dirname, '../..'),
    stdio: 'inherit',
    shell: false,
    env: withRuntimePath(process.env, runtime),
  });

  child.on('error', (err) => {
    console.error(`[playwright] Failed to start CLI: ${err.message}`);
    process.exit(1);
  });

  child.on('close', (code, signal) => {
    if (signal) process.exit(1);
    process.exit(code ?? 1);
  });
}

main().catch((err) => {
  console.error(`[playwright] Fatal launcher error: ${err.message}`);
  process.exit(1);
});
