import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

const isWin = process.platform === 'win32';

// Resolve target triple the same way Tauri does (rustc --print host-tuple)
// so the sidecar name matches bundle expectations: binaries/personalnews-backend-{TARGET_TRIPLE}
let target = '';
const rustcResult = spawnSync('rustc', ['--print', 'host-tuple'], { encoding: 'utf8' });
if (rustcResult.status === 0 && rustcResult.stdout?.trim()) {
  target = rustcResult.stdout.trim();
} else {
  const arch = os.arch();
  if (isWin) target = 'x86_64-pc-windows-msvc';
  else if (process.platform === 'darwin') target = arch === 'arm64' ? 'aarch64-apple-darwin' : 'x86_64-apple-darwin';
  else target = 'x86_64-unknown-linux-gnu';
}

// Resolve binaries dir relative to this script so it works regardless of cwd (e.g. when run by Tauri beforeBuildCommand)
const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, '..');
const binDir = join(repoRoot, 'apps', 'desktop', 'src-tauri', 'binaries');
if (!existsSync(binDir)) {
  mkdirSync(binDir, { recursive: true });
}

const exeName = `personalnews-backend-${target}${isWin ? '.exe' : ''}`;

console.log(`[prepare:backend] Compilando backend para sidecar: ${exeName}`);

// Use relative paths and cwd=repoRoot so Bun resolves node_modules from monorepo root (xmldom etc.)
const entryRelative = 'apps/backend/src/server.ts';
const outfileRelative = join('apps', 'desktop', 'src-tauri', 'binaries', exeName);
const result = spawnSync('bun', [
  'build',
  '--compile',
  entryRelative,
  '--outfile',
  outfileRelative
], { stdio: 'inherit', cwd: repoRoot });

if (result.status !== 0) {
  console.error('[prepare:backend] Erro ao compilar backend');
  process.exit(1);
}

// Cria dummies vazios para os outros sidecars esperados pelo tauri.conf.json
// Isso evita que o bundler falhe ao não encontrar os binários de outras plataformas
const expectedTargets = [
  'x86_64-apple-darwin',
  'aarch64-apple-darwin',
  'x86_64-unknown-linux-gnu',
  'x86_64-pc-windows-msvc'
];

import { writeFileSync } from 'node:fs';
for (const t of expectedTargets) {
  const dummyName = `personalnews-backend-${t}${t.includes('windows') ? '.exe' : ''}`;
  const dummyPath = join(repoRoot, 'apps', 'desktop', 'src-tauri', 'binaries', dummyName);
  
  if (dummyName !== exeName && !existsSync(dummyPath)) {
    console.log(`[prepare:backend] Criando dummy para ${dummyName}`);
    writeFileSync(dummyPath, '');
  }
}

console.log('[prepare:backend] Backend pronto!');
