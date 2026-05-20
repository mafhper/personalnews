/**
 * Cross-platform dashboard build helper
 * Ensures dashboard build runs reliably on Windows and WSL.
 */
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const UI = require('../cli/ui-helpers.cjs');
const History = require('../cli/history.cjs');

const args = process.argv.slice(2);
const isSilent = args.includes('--silent') || args.includes('-s');
const isQuiet = args.includes('--quiet') || args.includes('-q') || (!isSilent && process.env.CI === 'true');
const modeLabel = isSilent ? 'silent' : isQuiet ? 'quiet' : 'default';
const dashboardRoot = path.join(process.cwd(), 'quality-core', 'dashboard');
const distDir = path.join(dashboardRoot, 'dist');
const isWindows = process.platform === 'win32';
const bunCmd = isWindows ? 'bun.exe' : 'bun';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';
const pnpmCmd = isWindows ? 'pnpm.cmd' : 'pnpm';
const supportedRuntimes = new Set(['bun', 'npm', 'pnpm']);

function resolveBuildOrder() {
  const forced = (process.env.DASHBOARD_BUILD_RUNTIME || '').trim().toLowerCase();
  if (forced) {
    if (!supportedRuntimes.has(forced)) {
      throw new Error(`DASHBOARD_BUILD_RUNTIME invalido: ${forced}. Use bun, npm ou pnpm.`);
    }
    return [forced];
  }
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
      stdio: isSilent ? ['ignore', 'ignore', 'inherit'] : 'inherit',
      shell: false,
    });
  }

  if (runtime === 'npm') {
    return spawn(npmCmd, ['run', 'build'], { cwd: dashboardRoot, stdio: isSilent ? ['ignore', 'ignore', 'inherit'] : 'inherit', shell: false });
  }
  if (runtime === 'pnpm') {
    return spawn(pnpmCmd, ['run', 'build'], { cwd: dashboardRoot, stdio: isSilent ? ['ignore', 'ignore', 'inherit'] : 'inherit', shell: false });
  }
  return spawn(bunCmd, ['run', 'build'], { cwd: dashboardRoot, stdio: isSilent ? ['ignore', 'ignore', 'inherit'] : 'inherit', shell: false });
}

async function run() {
  const startTime = Date.now();
  let stopTimer = null;
  if (!isSilent) {
    UI.printHeader({
      title: 'QUALITY CORE - DASHBOARD BUILD',
      modes: ['--silent', '--quiet', 'DASHBOARD_BUILD_RUNTIME'],
      active: [
        isSilent ? 'silent' : null,
        isQuiet ? 'quiet' : null,
      ].filter(Boolean),
    });
    const avgHeader = History.getAverageDuration('build-dashboard', modeLabel);
    stopTimer = UI.printTimingHeader({
      avgLabel: avgHeader,
      modeLabel,
      live: UI.shouldLiveTimer() && !isQuiet,
    });
  }

  let order;
  try {
    order = resolveBuildOrder();
  } catch (err) {
    if (stopTimer) stopTimer();
    console.error(UI.error(err.message || String(err)));
    process.exit(1);
  }
  if (!isSilent && !isQuiet) {
    UI.printPlan(order.map(name => ({ name: `Build via ${name.toUpperCase()}` })));
  }

  for (let i = 0; i < order.length; i += 1) {
    const runtime = order[i];
    if (!isSilent && !isQuiet) {
      UI.printScriptStart(`build (${runtime})`, i + 1, order.length);
    } else if (isQuiet) {
      UI.printQuietStepStart(`build (${runtime})`, i + 1, order.length);
    }

    const child = spawnBuild(runtime);
    const exitCode = await new Promise((resolve) => {
      child.on('error', () => resolve(1));
      child.on('close', (code) => resolve(code ?? 1));
    });

    const validation = validateDist();
    const success = exitCode === 0 && validation.ok;
    const duration = Date.now() - startTime;
    History.saveExecutionTime(`build-dashboard:${runtime}`, duration, modeLabel);
    const avg = History.getAverageDuration(`build-dashboard:${runtime}`, modeLabel);
    if (!isSilent && !isQuiet) {
      UI.printScriptEnd(`build (${runtime})`, duration, avg, success);
    } else if (isQuiet) {
      UI.printQuietStepEnd(`build (${runtime})`, i + 1, order.length, duration, avg, success);
    }

    if (success) {
      History.saveExecutionTime('build-dashboard', duration, modeLabel);
      const totalAvg = History.getAverageDuration('build-dashboard', modeLabel);
      if (!validation.ok) {
        if (!isSilent) console.warn(UI.warning(`Build completou, mas dist inválido: ${validation.reason}`));
      }
      if (totalAvg) {
        if (!isSilent && !isQuiet) console.log(UI.info(`Avg build total: ${totalAvg}`));
      }
      if (stopTimer) stopTimer();
      if (isSilent || isQuiet) {
        UI.printSummary({
          title: 'DASHBOARD BUILD',
          status: 'pass',
          duration: (duration / 1000).toFixed(2),
          reportDir: distDir,
        });
      }
      process.exit(0);
    }

    if (!isSilent) {
      console.warn(UI.warning(`Build via ${runtime} falhou ou dist inválido: ${validation.reason || 'unknown'}`));
    }
  }

  const duration = Date.now() - startTime;
  History.saveExecutionTime('build-dashboard', duration, modeLabel);
  const avg = History.getAverageDuration('build-dashboard', modeLabel);
  if (!isSilent && !isQuiet) {
    UI.printScriptEnd('dashboard build', duration, avg, false);
  } else if (isQuiet) {
    UI.printQuietStepEnd('dashboard build', order.length, order.length, duration, avg, false);
  }
  if (stopTimer) stopTimer();
  console.error(UI.error('Falha ao gerar build válido do dashboard. Verifique dependências e tente npm run build dentro de quality-core/dashboard.'));
  process.exit(1);
}

run();
