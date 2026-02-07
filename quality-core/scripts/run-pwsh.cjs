/**
 * PowerShell runner with auto-detection (pwsh -> powershell).
 * Usage: node quality-core/scripts/run-pwsh.cjs <script.ps1> [args...]
 */
const path = require('path');
const { spawn } = require('child_process');

const script = process.argv[2];
if (!script) {
  console.error('Usage: run-pwsh.cjs <script.ps1> [args...]');
  process.exit(1);
}

const scriptPath = path.resolve(process.cwd(), script);
const scriptArgs = process.argv.slice(3);

const candidates = ['pwsh', 'powershell'];

function tryRun(index) {
  if (index >= candidates.length) {
    console.error('PowerShell not found. Install PowerShell 7 (pwsh) or Windows PowerShell.');
    process.exit(1);
  }

  const cmd = candidates[index];
  const child = spawn(cmd, ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath, ...scriptArgs], {
    stdio: 'inherit',
    shell: false,
  });

  child.on('error', (err) => {
    if (err.code === 'ENOENT') {
      return tryRun(index + 1);
    }
    console.error(`Failed to start ${cmd}: ${err.message}`);
    process.exit(1);
  });

  child.on('close', (code) => {
    process.exit(code ?? 1);
  });
}

tryRun(0);
