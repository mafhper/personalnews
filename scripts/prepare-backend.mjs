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
const outputPath = join(binDir, exeName);

console.log(`[prepare:backend] Compilando backend para sidecar: ${exeName}`);

const result = spawnSync('bun', [
  'build',
  '--compile',
  join(repoRoot, 'apps', 'backend', 'src', 'server.ts'),
  '--outfile',
  outputPath
], { stdio: 'inherit', shell: isWin, cwd: repoRoot });

if (result.status !== 0) {
  console.error('[prepare:backend] Erro ao compilar backend');
  process.exit(1);
}

console.log('[prepare:backend] Backend pronto!');
