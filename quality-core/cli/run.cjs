/**
 * Quality Gate - Orquestrador Principal
 *
 * Executa verificacoes de qualidade antes de commit/push
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const config = require('./config.cjs');
const UI = require('./ui-helpers.cjs');
const History = require('./history.cjs');
const { refreshDashboardCache } = require('./dashboard-cache.cjs');

// Flags
const args = process.argv.slice(2);
const BUN_BIN = process.env.BUN_PATH || 'bun';
const isQuiet = args.includes('--quiet') || args.includes('-q');
const isSilent = args.includes('--silent') || args.includes('-s');
const isQuick = args.includes('--quick');
const isLocal = args.includes('--local');
const skipLint = args.includes('--no-lint');
const modeLabel = [
  isQuick ? 'quick' : isLocal ? 'local' : 'full',
  isSilent ? 'silent' : isQuiet ? 'quiet' : 'default',
].join('-');

// Constants
const c = UI.colors;
const symbols = UI.symbols;

// Global State
const results = [];
const startTime = Date.now();

/**
 * Format duration helper
 */
function formatDuration(ms) {
  return (ms / 1000).toFixed(2) + 's';
}

/**
 * Get timestamp helper
 */
function getTimestamp() {
  const now = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}_${p(now.getHours())}-${p(now.getMinutes())}`;
}

function getCategoryScore(categories, key) {
  const raw = categories?.[key]?.score;
  if (typeof raw !== 'number' || Number.isNaN(raw)) return null;
  return Math.round(raw * 100);
}

function validateLighthouseReport(report) {
  const runtimeError = report?.runtimeError || report?.lhr?.runtimeError;
  if (runtimeError) {
    const code = runtimeError.code || runtimeError.message || 'UNKNOWN_RUNTIME_ERROR';
    return {
      valid: false,
      reason: `runtimeError=${code}`,
      scores: null,
    };
  }

  const categories = report?.categories || report?.lhr?.categories || {};
  const performance = getCategoryScore(categories, 'performance');
  const accessibility = getCategoryScore(categories, 'accessibility');
  const bestPractices = getCategoryScore(categories, 'best-practices');
  const seo = getCategoryScore(categories, 'seo');

  if ([performance, accessibility, bestPractices, seo].some(value => value === null)) {
    return {
      valid: false,
      reason: 'invalid_score',
      scores: null,
    };
  }

  return {
    valid: true,
    reason: null,
    scores: {
      performance,
      accessibility,
      bestPractices,
      seo,
    },
  };
}

/**
 * Run a command and capture output
 */
function runCommand(command, args = [], options = {}) {
  return new Promise(resolve => {
    const start = Date.now();
    let output = '';
    let error = '';

    const isWindows = process.platform === 'win32';
    let finalCommand = command;
    let finalArgs = args;

    if (isWindows) {
      finalCommand = process.env.ComSpec || 'cmd.exe';
      finalArgs = ['/c', command, ...args];
    }

    const child = spawn(finalCommand, finalArgs, {
      cwd: config.paths.root,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
      ...options,
    });

    child.stdout?.on('data', data => {
      output += data.toString();
    });

    child.stderr?.on('data', data => {
      error += data.toString();
    });

    child.on('error', err => {
      resolve({
        success: false,
        duration: Date.now() - start,
        output,
        error: err.message,
      });
    });

    child.on('close', code => {
      resolve({
        success: code === 0,
        exitCode: code,
        duration: Date.now() - start,
        output,
        error,
      });
    });
  });
}

/**
 * Task Definitions
 */
const TASKS = [
  {
    name: 'Integridade',
    id: 'integrity',
    run: async () => {
      const issues = [];
      config.requiredDirs.forEach(d => {
        if (!fs.existsSync(path.join(config.paths.root, d)))
          issues.push(`Pasta faltando: ${d}`);
      });
      config.requiredFiles.forEach(f => {
        if (!fs.existsSync(path.join(config.paths.root, f)))
          issues.push(`Arquivo faltando: ${f}`);
      });
      return {
        success: issues.length === 0,
        issues,
        message:
          issues.length === 0 ? 'Estrutura OK' : `${issues.length} issues`,
      };
    },
  },
  {
    name: 'i18n',
    id: 'i18n',
    run: async () => {
      if (
        !fs.existsSync(
          path.join(config.paths.scripts, 'i18n-audit.cjs')
        )
      )
        return { success: true, skipped: true, message: 'Script missing' };

      const res = await runCommand('node', [
        path.relative(config.paths.root, path.join(config.paths.scripts, 'i18n-audit.cjs'))
      ]);
      const totalMatch = res.output.match(/Total de problemas: (\d+)/);
      const criticalMatch = res.output.match(/Problemas críticos: (\d+)/);
      const totalCount = totalMatch ? parseInt(totalMatch[1], 10) : 0;
      const criticalCount = criticalMatch ? parseInt(criticalMatch[1], 10) : totalCount;
      return {
        success: true,
        warning: criticalCount > 0,
        message:
          criticalCount > 0
            ? `${criticalCount} críticos (total ${totalCount})`
            : totalCount > 0
              ? `OK (info: ${totalCount})`
              : 'OK',
        output: res.output,
      };
    },
  },
  {
    name: 'Segurança (Audit)',
    id: 'security',
    run: async () => {
      const res = await runCommand('npm', ['audit', '--audit-level=high']);
      const hasIssue =
        res.output.includes('high') || res.output.includes('critical');
      return {
        success: !hasIssue,
        message: hasIssue ? 'Vulnerabilities found' : 'OK',
        output: res.output,
      };
    },
  },
  {
    name: 'Secrets Scan',
    id: 'secrets',
    run: async () => {
      if (
        !fs.existsSync(
          path.join(config.paths.scripts, 'security-scan.cjs')
        )
      )
        return { success: true, skipped: true, message: 'Script missing' };

      const res = await runCommand('node', [
        path.relative(config.paths.root, path.join(config.paths.scripts, 'security-scan.cjs'))
      ]);
      const crit = res.output.includes('CRITICAL') && res.exitCode !== 0;
      const high = res.output.includes('HIGH');
      return {
        success: !crit,
        warning: high && !crit,
        message: crit ? 'Secrets exposed!' : high ? 'Possible leaks' : 'OK',
        output: res.output,
      };
    },
  },
  {
    name: 'Linting',
    id: 'lint',
    run: async () => {
      if (skipLint) {
        return { success: true, skipped: true, message: 'Skipped (--no-lint)' };
      }
      const res = await runCommand(BUN_BIN, ['run', 'lint']);
      // Simple error check based on exit code or common error strings
      const hasError = res.exitCode !== 0;
      return {
        success: !hasError,
        message: hasError ? 'Linting failed' : 'OK',
        output: res.output,
      };
    },
  },
  {
    name: 'Build',
    id: 'build',
    run: async () => {
      if (isQuick || isLocal)
        return { success: true, skipped: true, message: isLocal ? 'Skipped (--local)' : 'Skipped (--quick)' };
      const res = await runCommand(BUN_BIN, ['run', 'build']);
      return {
        success: res.success,
        message: res.success ? 'OK' : 'Build failed',
        output: res.success ? '' : res.error + res.output, // Full output on fail
      };
    },
  },
  {
    name: 'Performance',
    id: 'performance',
    run: async () => {
      if (isQuick || isLocal)
        return { success: true, skipped: true, message: isLocal ? 'Skipped (--local)' : 'Skipped (--quick)' };
      const lhDir = config.paths.lighthouse;
      if (!fs.existsSync(lhDir))
        return { success: true, skipped: true, message: 'No reports' };

      const files = fs
        .readdirSync(lhDir)
        .filter(f => f.endsWith('.json'))
        .map(file => ({
          file,
          fullPath: path.join(lhDir, file),
          mtimeMs: fs.statSync(path.join(lhDir, file)).mtimeMs,
        }))
        .sort((a, b) => b.mtimeMs - a.mtimeMs);

      if (files.length === 0)
        return { success: true, skipped: true, message: 'No JSON reports' };

      const preferredDesktopPrefixes = [
        'lighthouse_feed_desktop_',
        'lighthouse_home_desktop_',
        'lighthouse_desktop_',
      ];
      const desktopCandidates = files.filter(entry =>
        preferredDesktopPrefixes.some(prefix => entry.file.startsWith(prefix))
      );
      const pool = desktopCandidates.length > 0 ? desktopCandidates : files;
      const invalidReasons = [];

      for (const entry of pool) {
        try {
          const report = JSON.parse(fs.readFileSync(entry.fullPath, 'utf8'));
          const validation = validateLighthouseReport(report);
          if (!validation.valid) {
            invalidReasons.push(`${entry.file}: ${validation.reason}`);
            continue;
          }

          const perf = validation.scores.performance;
          const a11y = validation.scores.accessibility;
          return {
            success: perf >= 30,
            warning: perf > 0 && perf < 70,
            message: `Perf: ${perf} | A11y: ${a11y}`,
            report: entry.file,
          };
        } catch (e) {
          invalidReasons.push(`${entry.file}: parse_error=${e.message}`);
        }
      }

      const actionHint = 'Execute: bun run quality:lighthouse:home ou bun run quality:lighthouse:feed';
      const reasonHint = invalidReasons.slice(0, 2).join(' | ') || 'no_valid_desktop_lighthouse_report';
      return {
        success: true,
        warning: true,
        skipped: true,
        message: `Sem Lighthouse desktop valido (${reasonHint}). ${actionHint}`,
      };
    },
  },
];

/**
 * Main Orchestrator
 */
async function main() {
  // 1. Setup UI
  let stopTimer = null;
  if (!isSilent) {
    if (!isQuiet) {
      console.clear();
    }
    UI.printHeader({
      title: 'QUALITY GATE',
      modes: ['--quick', '--local', '--no-lint', '--silent', '--quiet'],
      active: [
        isQuick ? 'quick' : null,
        isLocal ? 'local' : null,
        isSilent ? 'silent' : null,
        isQuiet ? 'quiet' : null,
      ].filter(Boolean),
    });
    const avgHeader = History.getAverageDuration('quality-gate', modeLabel);
    stopTimer = UI.printTimingHeader({
      avgLabel: avgHeader,
      modeLabel,
      live: UI.shouldLiveTimer() && !isQuiet,
    });

    if (!isQuiet) {
      // Print Execution Plan with averages
      const planTasks = TASKS.map(task => ({
        name: task.name,
        avg: History.getAverageDuration(task.id, modeLabel),
      }));
      UI.printPlan(planTasks);
    }
  }

  // 2. Execute Tasks
  for (let i = 0; i < TASKS.length; i++) {
    const task = TASKS[i];
    const taskStart = Date.now();

    // Show Start
    if (!isSilent && !isQuiet) {
      UI.printScriptStart(task.name, i + 1, TASKS.length);
    } else if (isQuiet) {
      UI.printQuietStepStart(task.name, i + 1, TASKS.length);
    }

    // Run Logic
    let result;
    try {
      result = await task.run();
    } catch (e) {
      result = { success: false, message: e.message, output: e.stack };
    }

    const taskDuration = Date.now() - taskStart;

    // Save History
    if (!task.skipped) {
      History.saveExecutionTime(task.id, taskDuration, modeLabel);
    }
    const avg = History.getAverageDuration(task.id, modeLabel);

    // Store Result
    results.push({
      ...task,
      ...result,
      duration: taskDuration,
      avg,
    });

    // Show End & Output
    if (!isSilent) {
      // Print truncated output if present and not silent
      if (!isQuiet && result.output && (result.warning || !result.success)) {
        // Show output only when it matters (warnings/failures)
        const maxLines = result.success ? 8 : 50;
        console.log(
          c.dim +
            UI.truncateOutput(result.output.trim(), maxLines) +
            c.reset +
            '\n'
        );
      }

      if (!isQuiet) {
        UI.printScriptEnd(task.name, taskDuration, avg, result.success);
      } else {
        UI.printQuietStepEnd(task.name, i + 1, TASKS.length, taskDuration, avg, result.success);
      }
    }
  }

  // 3. Generate Report & Summary
  const totalDuration = Date.now() - startTime;
  History.saveExecutionTime('quality-gate', totalDuration, modeLabel);
  const failed = results.filter(r => !r.success && !r.skipped);
  const warnings = results.filter(r => r.warning);
  const status = failed.length === 0 ? 'pass' : 'fail';

  if (isSilent) {
    // Standardized Silent Summary
    const metrics = [
      `Tasks: ${results.length}`,
      `Passed: ${results.filter(r => r.success).length}`,
      `Failed: ${failed.length}`,
      `Skipped: ${results.filter(r => r.skipped).length}`,
    ];
    const timings = results.map(r => {
      const duration = formatDuration(r.duration);
      const avgText = r.avg ? ` | Avg: ${r.avg}` : '';
      const status = r.skipped ? ' (skipped)' : r.success ? '' : ' (fail)';
      return `${r.name}: ${duration}${avgText}${status}`;
    });

    UI.printSummary({
      title: 'QUALITY GATE',
      status,
      metrics,
      timings,
      errors: failed.map(f => `${f.name}: ${f.message}`),
      warnings: warnings.map(w => `${w.name}: ${w.message}`),
      duration: (totalDuration / 1000).toFixed(2),
      reportDir: config.paths.logs,
    });
  } else {
    // Normal Summary
    console.log(UI.separator(50, '='));
    console.log(`${c.bold}📊 FINAL RESULTS${c.reset}`);
    console.log(UI.separator(50, '-'));

    results.forEach(r => {
      const icon = r.skipped
        ? symbols.arrow
        : r.success
          ? r.warning
            ? symbols.warning
            : symbols.success
          : symbols.error;
      console.log(`${icon} ${r.name.padEnd(20)} ${r.message}`);
    });

    console.log(
      '\n' + UI.metric('Total Time', (totalDuration / 1000).toFixed(2), 's')
    );
    console.log(UI.separator(50, '=') + '\n');
  }

  // 4. Save Markdown Log
  saveMarkdownReport(results, totalDuration, status);

  if (stopTimer) stopTimer();
  await refreshDashboardCache({ silent: isSilent || isQuiet });
  process.exit(status === 'pass' ? 0 : 1);
}

function saveMarkdownReport(results, duration, status) {
  const logsDir = config.paths.logs;
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

  const timestamp = getTimestamp();
  const reportPath = path.join(
    logsDir,
    `Quality-Gate_${status.toUpperCase()}_${timestamp}.md`
  );

  let md = `# Quality Gate Report\n\n`;
  md += `**Date:** ${new Date().toLocaleString()}\n`;
  md += `**Status:** ${status.toUpperCase()}\n`;
  md += `**Duration:** ${formatDuration(duration)}\n\n`;

  md += `| Task | Status | Duration | Message |\n|---|---|---|---|\n`;
  results.forEach(r => {
    const s = r.skipped
      ? 'Skipped'
      : r.success
        ? r.warning
          ? 'Warn'
          : 'Pass'
        : 'Fail';
    md += `| ${r.name} | ${s} | ${formatDuration(r.duration)} | ${r.message} |\n`;
  });

  // Add detailed failures
  const failed = results.filter(r => !r.success);
  if (failed.length > 0) {
    md += `\n## Failures\n`;
    failed.forEach(f => {
      md += `### ${f.name}\n\`\`\`\n${f.output || 'No output'}\n\`\`\`\n`;
    });
  }

  fs.writeFileSync(reportPath, md);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
