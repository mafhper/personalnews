/**
 * Cross-platform dashboard build helper
 * Ensures dashboard build runs reliably on Windows and WSL.
 */
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const UI = require('../cli/ui-helpers.cjs');
const History = require('../cli/history.cjs');

const dashboardRoot = path.join(process.cwd(), 'quality-core', 'dashboard');
const distDir = path.join(dashboardRoot, 'dist');
const isWindows = process.platform === 'win32';
const bunCmd = isWindows ? 'bun.exe' : 'bun';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';
const pnpmCmd = isWindows ? 'pnpm.cmd' : 'pnpm';

function resolveBuildOrder() {
  const forced = (process.env.DASHBOARD_BUILD_RUNTIME || '').trim().toLowerCase();
  if (forced) return [forced];
  if (process.platform === 'win32') return ['npm', 'bun'];
  return ['bun', 'npm'];
}

function validateDist() {
  try {
    const indexPath = path.join(distDir, 'index.html');
    if (!fs.existsSync(indexPath)) return { ok: false, reason: 'index.html missing' };
    const html = fs.readFileSync(indexPath, 'utf8');
    const match = html.match(/<script[^>]+src=["']([^"']+)["'][^>]*><\/script>/i);
    if (!match?.[1]) return { ok: false, reason: 'entry script not found in index.html' };
    const entryRel = match[1].replace(/^\/+/, '');
    const entryPath = path.join(distDir, entryRel);
    if (!fs.existsSync(entryPath)) return { ok: false, reason: `entry script missing: ${entryRel}` };
    const entrySize = fs.statSync(entryPath).size;
    if (entrySize < 1024) return { ok: false, reason: `entry script too small (${entrySize} bytes)` };

    const assetsDir = path.join(distDir, 'assets');
    if (!fs.existsSync(assetsDir)) return { ok: false, reason: 'assets folder missing' };
    const jsFiles = fs.readdirSync(assetsDir).filter(f => f.endsWith('.js'));
    if (jsFiles.length === 0) return { ok: false, reason: 'no js assets found' };
    const zeroFiles = jsFiles.filter(f => fs.statSync(path.join(assetsDir, f)).size === 0);
    if (zeroFiles.length > 0) return { ok: false, reason: `zero-byte assets: ${zeroFiles.slice(0, 3).join(', ')}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err.message || 'validation failed' };
  }
}

function spawnBuild(runtime) {
  if (isWindows) {
    const cmd =
      runtime === 'npm'
        ? 'npm run build'
        : runtime === 'pnpm'
          ? 'pnpm run build'
          : 'bun run build';
    const shell = process.env.ComSpec || 'cmd.exe';
    return spawn(shell, ['/d', '/s', '/c', cmd], {
      cwd: dashboardRoot,
      stdio: 'inherit',
      shell: false,
    });
  }

  if (runtime === 'npm') {
    return spawn(npmCmd, ['run', 'build'], { cwd: dashboardRoot, stdio: 'inherit', shell: false });
  }
  if (runtime === 'pnpm') {
    return spawn(pnpmCmd, ['run', 'build'], { cwd: dashboardRoot, stdio: 'inherit', shell: false });
  }
  return spawn(bunCmd, ['run', 'build'], { cwd: dashboardRoot, stdio: 'inherit', shell: false });
}

async function run() {
  const startTime = Date.now();
  let stopTimer = null;
  UI.printHeader({
    title: 'QUALITY CORE - DASHBOARD BUILD',
    modes: ['DASHBOARD_BUILD_RUNTIME'],
    active: [],
  });
  const avgHeader = History.getAverageDuration('build-dashboard');
  stopTimer = UI.startElapsedTimer({ avgLabel: avgHeader });

  const order = resolveBuildOrder();
  UI.printPlan(order.map(name => ({ name: `Build via ${name.toUpperCase()}` })));

  for (let i = 0; i < order.length; i += 1) {
    const runtime = order[i];
    UI.printScriptStart(`build (${runtime})`, i + 1, order.length);

    const child = spawnBuild(runtime);
    const exitCode = await new Promise((resolve) => {
      child.on('error', () => resolve(1));
      child.on('close', (code) => resolve(code ?? 1));
    });

    const validation = validateDist();
    const success = exitCode === 0 && validation.ok;
    const duration = Date.now() - startTime;
    History.saveExecutionTime(`build-dashboard:${runtime}`, duration);
    const avg = History.getAverageDuration(`build-dashboard:${runtime}`);
    UI.printScriptEnd(`build (${runtime})`, duration, avg, success);

    if (success) {
      History.saveExecutionTime('build-dashboard', duration);
      const totalAvg = History.getAverageDuration('build-dashboard');
      if (!validation.ok) {
        console.warn(UI.warning(`Build completou, mas dist inválido: ${validation.reason}`));
      }
      if (totalAvg) {
        console.log(UI.info(`Avg build total: ${totalAvg}`));
      }
      if (stopTimer) stopTimer();
      process.exit(0);
    }

    console.warn(UI.warning(`Build via ${runtime} falhou ou dist inválido: ${validation.reason || 'unknown'}`));
  }

  const duration = Date.now() - startTime;
  History.saveExecutionTime('build-dashboard', duration);
  const avg = History.getAverageDuration('build-dashboard');
  UI.printScriptEnd('dashboard build', duration, avg, false);
  if (stopTimer) stopTimer();
  console.error(UI.error('Falha ao gerar build válido do dashboard. Verifique dependências e tente npm run build dentro de quality-core/dashboard.'));
  process.exit(1);
}

run();
