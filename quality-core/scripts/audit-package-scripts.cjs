#!/usr/bin/env node
/**
 * Script Audit Runner
 *
 * Executa scripts do package.json por area, sem interromper em falhas,
 * priorizando variantes silenciosas e gerando relatorio consolidado.
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const UI = require('../cli/ui-helpers.cjs');
const History = require('../cli/history.cjs');

const ROOT = path.resolve(__dirname, '../..');
const PACKAGE_JSON_PATH = path.join(ROOT, 'package.json');
const OUTPUT_DIR = path.join(ROOT, 'performance-reports', 'scripts-audit');
const DEFAULT_CONFIG_PATH = path.join(ROOT, 'quality-core', 'config', 'scripts-audit.config.json');
const DIST_DIR = path.join(ROOT, 'dist');
const DIST_INDEX = path.join(DIST_DIR, 'index.html');
const SCRIPT_HISTORY_KEY = 'scripts-audit-script';
const FORCE_TIMEOUT_RESOLVE_MS = 5000;
const SOFT_KILL_GRACE_MS = 800;
const DEFAULT_POLICY_PREPARE_SCRIPT = 'build:app';
const FALLBACK_CONFIG = {
  defaultExcludes: [],
  areaOrder: ['misc'],
  areas: {},
  scriptPolicies: {},
};

const args = process.argv.slice(2);

function hasFlag(flag) {
  return args.includes(flag);
}

function getFlagValue(flag, fallback = '') {
  const arg = args.find((entry) => entry.startsWith(`${flag}=`));
  if (!arg) return fallback;
  return arg.slice(flag.length + 1);
}

function parseCsvFlag(flag) {
  const value = getFlagValue(flag, '');
  if (!value) return [];
  return value
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);
}

function parseIntFlag(flag, fallback) {
  const value = Number.parseInt(getFlagValue(flag, String(fallback)), 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function formatOrder(index, total) {
  return `[${index}/${total}]`;
}

function loadAuditConfig(configPath) {
  const resolvedPath = path.resolve(configPath || DEFAULT_CONFIG_PATH);
  if (!fs.existsSync(resolvedPath)) {
    return {
      path: resolvedPath,
      config: FALLBACK_CONFIG,
      exists: false,
    };
  }

  const parsed = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
  const config = {
    defaultExcludes: Array.isArray(parsed.defaultExcludes) ? parsed.defaultExcludes : [],
    areaOrder: Array.isArray(parsed.areaOrder) && parsed.areaOrder.length > 0 ? parsed.areaOrder : ['misc'],
    areas: typeof parsed.areas === 'object' && parsed.areas ? parsed.areas : {},
    scriptPolicies: normalizeScriptPolicies(parsed.scriptPolicies),
  };

  return {
    path: resolvedPath,
    config,
    exists: true,
  };
}

function normalizeScriptPolicies(rawPolicies) {
  if (!rawPolicies || typeof rawPolicies !== 'object' || Array.isArray(rawPolicies)) {
    return {};
  }

  return Object.entries(rawPolicies).reduce((acc, [script, raw]) => {
    if (typeof raw !== 'object' || !raw || Array.isArray(raw)) return acc;
    const timeoutValue = Number.parseInt(raw.timeoutMs, 10);
    const timeoutMs = Number.isFinite(timeoutValue) && timeoutValue > 0 ? timeoutValue : null;
    const args = Array.isArray(raw.args) ? raw.args.map(String).filter(Boolean) : [];
    const requiresDist = Boolean(raw.requiresDist);
    const prepareScript = typeof raw.prepareScript === 'string' && raw.prepareScript.trim()
      ? raw.prepareScript.trim()
      : (requiresDist ? DEFAULT_POLICY_PREPARE_SCRIPT : null);
    const env = raw.env && typeof raw.env === 'object' && !Array.isArray(raw.env)
      ? Object.fromEntries(
        Object.entries(raw.env)
          .filter(([key, value]) => Boolean(key) && value !== undefined && value !== null)
          .map(([key, value]) => [String(key), String(value)])
      )
      : {};

    acc[script] = {
      timeoutMs,
      args,
      env,
      requiresDist,
      prepareScript,
    };
    return acc;
  }, {});
}

function resolveScriptPolicy(item, scriptPolicies) {
  if (!scriptPolicies || typeof scriptPolicies !== 'object') {
    return null;
  }

  const byExecuted = scriptPolicies[item.executed];
  if (byExecuted) {
    return { ...byExecuted, source: item.executed };
  }

  const byRequested = scriptPolicies[item.requested];
  if (byRequested) {
    return { ...byRequested, source: item.requested };
  }

  return null;
}

function resolveBunBinary() {
  if (process.env.BUN_PATH) return process.env.BUN_PATH;

  // If this script is already running through Bun, reuse current executable.
  if (process.versions && process.versions.bun && process.execPath) {
    return process.execPath;
  }

  const home = process.env.HOME || process.env.USERPROFILE || '';
  const fallbackUnix = path.join(home, '.bun', 'bin', 'bun');
  if (home && fs.existsSync(fallbackUnix)) {
    return fallbackUnix;
  }

  return process.platform === 'win32' ? 'bun.exe' : 'bun';
}

function withBunPath(baseEnv, bunBin) {
  const env = { ...baseEnv };
  const bunDir = bunBin ? path.dirname(bunBin) : '';
  if (!bunDir) return env;

  const key = process.platform === 'win32' ? 'Path' : 'PATH';
  const current = env[key] || env.PATH || '';
  if (!current.split(path.delimiter).includes(bunDir)) {
    env[key] = current ? `${bunDir}${path.delimiter}${current}` : bunDir;
  }

  return env;
}

function formatTimestamp(date = new Date()) {
  const pad = n => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;
}

function createTailBuffer(limit) {
  const lines = [];
  return {
    push(data) {
      const chunk = String(data);
      chunk.split('\n').forEach(line => {
        const trimmed = line.trimEnd();
        if (!trimmed) return;
        lines.push(trimmed);
        if (lines.length > limit) lines.shift();
      });
    },
    toString() {
      return lines.join('\n');
    },
  };
}

function inferArea(scriptName, auditConfig) {
  const order = Array.isArray(auditConfig.areaOrder) ? auditConfig.areaOrder : [];

  for (const area of order) {
    const rules = auditConfig.areas?.[area] || {};
    const exact = Array.isArray(rules.exact) ? rules.exact : [];
    const prefix = Array.isArray(rules.prefix) ? rules.prefix : [];
    const suffix = Array.isArray(rules.suffix) ? rules.suffix : [];

    if (exact.includes(scriptName)) return area;
    if (prefix.some(p => scriptName.startsWith(p))) return area;
    if (suffix.some(s => scriptName.endsWith(s))) return area;
  }

  return 'misc';
}

function resolveSilentVariant(scriptName, allScripts, preferSilent) {
  if (!preferSilent) {
    return { requested: scriptName, executed: scriptName, substituted: false };
  }

  if (!allScripts[scriptName]) {
    return { requested: scriptName, executed: scriptName, substituted: false };
  }

  const candidates = [];
  if (scriptName.endsWith(':quick')) {
    candidates.push(scriptName.replace(/:quick$/, ':quick-silent'));
  }
  candidates.push(`${scriptName}:silent`);
  candidates.push(`${scriptName}:quiet`);

  if (scriptName === 'analysis' || scriptName === 'analysis:bundle') {
    candidates.push('analysis:silent');
  }

  const uniqueCandidates = [...new Set(candidates)];
  for (const candidate of uniqueCandidates) {
    if (allScripts[candidate]) {
      return {
        requested: scriptName,
        executed: candidate,
        substituted: candidate !== scriptName,
      };
    }
  }

  return { requested: scriptName, executed: scriptName, substituted: false };
}

function getSummary(results) {
  const counts = {
    total: results.length,
    passed: 0,
    failed: 0,
    timedOut: 0,
    skipped: 0,
  };

  for (const result of results) {
    if (result.status === 'passed') counts.passed += 1;
    if (result.status === 'failed') counts.failed += 1;
    if (result.status === 'timed_out') counts.timedOut += 1;
    if (result.status === 'skipped') counts.skipped += 1;
  }

  return counts;
}

function sortByAreaAndName(items, areaOrder) {
  const areaRank = new Map((areaOrder || []).map((area, idx) => [area, idx]));
  return [...items].sort((a, b) => {
    const areaA = areaRank.has(a.area) ? areaRank.get(a.area) : 999;
    const areaB = areaRank.has(b.area) ? areaRank.get(b.area) : 999;
    if (areaA !== areaB) return areaA - areaB;
    return a.requested.localeCompare(b.requested);
  });
}

function dedupeExecutionPlan(items) {
  const seen = new Map();
  for (const item of items) {
    const key = item.executed;
    if (!seen.has(key)) {
      seen.set(key, { ...item, requestedAliases: [item.requested] });
      continue;
    }
    const existing = seen.get(key);
    if (!existing.requestedAliases.includes(item.requested)) {
      existing.requestedAliases.push(item.requested);
    }
  }
  return [...seen.values()];
}

function statusIcon(status) {
  if (status === 'passed') return 'OK';
  if (status === 'failed') return 'FAIL';
  if (status === 'timed_out') return 'TIMEOUT';
  if (status === 'skipped') return 'SKIP';
  return status.toUpperCase();
}

function formatMs(ms) {
  return `${(ms / 1000).toFixed(2)}s`;
}

function parseDurationMs(label) {
  if (!label) return null;
  const match = String(label).match(/([\d.]+)s/);
  if (!match) return null;
  const seconds = Number.parseFloat(match[1]);
  return Number.isFinite(seconds) ? Math.max(0, Math.round(seconds * 1000)) : null;
}

function formatEta(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return 'n/a';
  const totalSec = Math.round(ms / 1000);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  if (minutes <= 0) return `${seconds}s`;
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
}

function estimateRemainingMs(executionPlan, startIndex, observedAvgMs, timeoutMs) {
  if (!Array.isArray(executionPlan) || startIndex >= executionPlan.length - 1) return 0;

  let knownMs = 0;
  let unknownCount = 0;

  for (let idx = startIndex + 1; idx < executionPlan.length; idx += 1) {
    const key = `${SCRIPT_HISTORY_KEY}:${executionPlan[idx].executed}`;
    const avgMs = parseDurationMs(History.getAverageDuration(key));
    if (avgMs && avgMs > 0) {
      knownMs += avgMs;
    } else {
      unknownCount += 1;
    }
  }

  const fallbackMs = Number.isFinite(observedAvgMs) && observedAvgMs > 0
    ? observedAvgMs
    : Math.max(10_000, Math.round(timeoutMs * 0.2));
  return knownMs + unknownCount * fallbackMs;
}

function pickProblemSummary(outcome) {
  if (outcome.status === 'timed_out') {
    return outcome.error || 'Tempo limite excedido';
  }
  if (outcome.error) {
    return outcome.error;
  }

  const combined = `${outcome.stderrTail || ''}\n${outcome.stdoutTail || ''}`.split('\n');
  const isGenericExitLine = (line) => /^error:\s*script\s+".+"\s+exited with code/i.test(line);

  const structured = combined
    .map(line => line.trim())
    .filter(Boolean)
    .filter(line => !line.startsWith('$ '))
    .filter(line => !isGenericExitLine(line))
    .filter(line =>
      /\[(runtime_error|chrome_connect|server_unreachable|invalid_score|protocol_timeout|page_timeout|lighthouse_cli_error)\]/i.test(line) ||
      /runtimeerror=|no_fcp|devtoolsactiveport|err_connection_refused|invalid_score|protocol_timeout/i.test(line)
    );
  if (structured.length > 0) {
    return structured[0].slice(0, 180);
  }

  const strongest = combined
    .map(line => line.trim())
    .filter(Boolean)
    .filter(line => !line.startsWith('$ '))
    .filter(line => !isGenericExitLine(line))
    .filter(line =>
      /^(error|fail|failed|fatal|exception)\b/i.test(line) ||
      /\b(command not found|not found|cannot|invalid|timeout|exited with code)\b/i.test(line)
    );
  if (strongest.length > 0) {
    return strongest[0].slice(0, 180);
  }

  const candidates = combined
    .map(line => line.trim())
    .filter(Boolean)
    .filter(line => !line.startsWith('$ '))
    .filter(line => !isGenericExitLine(line))
    .filter(line =>
      /(error|fail|failed|failing|timeout|not found|cannot|invalid|exception|fatal|segfault|exit code)/i.test(line)
    );

  if (candidates.length > 0) {
    return candidates[0].slice(0, 180);
  }

  if (outcome.status === 'failed' && outcome.exitCode !== null && outcome.exitCode !== undefined) {
    return `Processo encerrou com exit code ${outcome.exitCode}.`;
  }

  return 'Falha sem resumo detectado (consulte o relatorio).';
}

function classifyRootCause(result) {
  const summary = pickProblemSummary(result);
  const lower = String(summary || '').toLowerCase();
  const combined = `${result.stdoutTail || ''}\n${result.stderrTail || ''}`.toLowerCase();

  if (result.status === 'timed_out') {
    return {
      key: 'script_timeout',
      label: 'Timeout de execucao',
      hint: 'Aumentar timeout por script ou aplicar cap de escopo para scripts longos.',
      summary,
    };
  }

  if (combined.includes('logo.snapshot.test.tsx') || lower.includes('snapshot')) {
    return {
      key: 'coverage_snapshot_mismatch',
      label: 'Snapshot desatualizado',
      hint: 'Atualizar snapshot do componente (ou ajustar componente se a mudanca nao for esperada).',
      summary,
    };
  }

  if (
    lower.includes('runtimeerror=') ||
    lower.includes('no_fcp') ||
    lower.includes('devtoolsactiveport') ||
    lower.includes('chrome') ||
    lower.includes('lighthouse/cli') ||
    lower.includes('server_unreachable') ||
    lower.includes('protocol_timeout')
  ) {
    return {
      key: 'lighthouse_runtime',
      label: 'Falha de runtime do Lighthouse',
      hint: 'Verificar causa estruturada (runtime/chrome/servidor) no resumo do Lighthouse e repetir com retry.',
      summary,
    };
  }

  if (lower.includes('dist directory not found') || lower.includes('preflight')) {
    return {
      key: 'dist_precondition',
      label: 'Pre-condicao de dist nao atendida',
      hint: 'Garantir build/preflight antes da etapa que exige artefatos de dist.',
      summary,
    };
  }

  return {
    key: 'generic_failure',
    label: 'Falha generica',
    hint: 'Consultar stdout/stderr no relatorio para detalhamento da causa primaria.',
    summary,
  };
}

function buildRootCauseCandidates(results) {
  const problematic = results.filter(item => item.status === 'failed' || item.status === 'timed_out');
  const groups = new Map();

  for (const result of problematic) {
    const classification = classifyRootCause(result);
    if (!groups.has(classification.key)) {
      groups.set(classification.key, {
        key: classification.key,
        label: classification.label,
        hint: classification.hint,
        count: 0,
        scripts: [],
        samples: [],
      });
    }
    const group = groups.get(classification.key);
    group.count += 1;
    group.scripts.push(result.executed);
    if (classification.summary && group.samples.length < 3) {
      group.samples.push(classification.summary);
    }
  }

  return [...groups.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function formatAppliedPolicy(policy, fallbackTimeoutMs) {
  if (!policy) return '-';

  const timeout = policy.timeoutMs || fallbackTimeoutMs;
  const segments = [`timeout=${timeout}ms`];

  if (policy.args && policy.args.length > 0) {
    segments.push(`args:${policy.args.join(' ')}`);
  }

  if (policy.env && Object.keys(policy.env).length > 0) {
    const envText = Object.entries(policy.env).map(([key, value]) => `${key}=${value}`).join(',');
    segments.push(`env:${envText}`);
  }

  if (policy.requiresDist) {
    const prep = policy.prepareScript || DEFAULT_POLICY_PREPARE_SCRIPT;
    segments.push(`dist:auto(${prep})`);
  }

  segments.push(`src:${policy.source}`);
  return segments.join('; ');
}

function formatPreflight(preflight) {
  if (!preflight || preflight.skipped) return '-';
  const label = preflight.script || '-';
  const status = preflight.status ? statusIcon(preflight.status) : 'N/A';
  const duration = Number.isFinite(preflight.durationMs) ? formatMs(preflight.durationMs) : '-';
  return `${label} (${status}, ${duration})`;
}

function hasDistArtifacts() {
  return fs.existsSync(DIST_DIR) && fs.existsSync(DIST_INDEX);
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function runDetached(cmd, cmdArgs) {
  return new Promise(resolve => {
    const killer = spawn(cmd, cmdArgs, {
      cwd: ROOT,
      shell: false,
      stdio: 'ignore',
    });

    killer.on('error', () => resolve(false));
    killer.on('close', () => resolve(true));
  });
}

function captureOutput(cmd, cmdArgs) {
  return new Promise(resolve => {
    const reader = spawn(cmd, cmdArgs, {
      cwd: ROOT,
      shell: false,
      stdio: ['ignore', 'pipe', 'ignore'],
    });

    let stdout = '';
    reader.stdout?.on('data', chunk => {
      stdout += String(chunk);
    });
    reader.on('error', () => resolve(''));
    reader.on('close', () => resolve(stdout));
  });
}

async function collectDescendantPids(rootPid) {
  const descendants = [];
  const queue = [rootPid];
  const seen = new Set([rootPid]);

  while (queue.length > 0) {
    const currentPid = queue.shift();
    const output = await captureOutput('ps', ['-o', 'pid=', '--ppid', String(currentPid)]);
    const children = output
      .split(/\s+/)
      .map(value => Number.parseInt(value, 10))
      .filter(pid => Number.isFinite(pid) && pid > 0);

    for (const childPid of children) {
      if (seen.has(childPid)) continue;
      seen.add(childPid);
      descendants.push(childPid);
      queue.push(childPid);
    }
  }

  return descendants;
}

async function killProcessTree(child) {
  if (!child || !child.pid) return;

  if (process.platform === 'win32') {
    await runDetached('taskkill', ['/PID', String(child.pid), '/T', '/F']);
    return;
  }

  const descendants = await collectDescendantPids(child.pid);
  const orderedDescendants = [...descendants].reverse();
  for (const pid of orderedDescendants) {
    try {
      process.kill(pid, 'SIGTERM');
    } catch {
      // process already terminated
    }
  }

  try {
    process.kill(child.pid, 'SIGTERM');
  } catch {
    return;
  }

  await wait(SOFT_KILL_GRACE_MS);

  for (const pid of orderedDescendants) {
    try {
      process.kill(pid, 0);
      process.kill(pid, 'SIGKILL');
    } catch {
      // process already terminated
    }
  }

  try {
    process.kill(child.pid, 0);
    process.kill(child.pid, 'SIGKILL');
  } catch {
    // process already terminated
  }
}

function generateMarkdown(report) {
  const lines = [];
  lines.push('# Script Audit Report');
  lines.push('');
  lines.push(`- Gerado em: ${report.meta.generatedAt}`);
  lines.push(`- Projeto: ${report.meta.project}`);
  lines.push(`- Preferir silencioso: ${report.meta.preferSilent ? 'sim' : 'nao'}`);
  lines.push(`- Dedupe de scripts: ${report.meta.dedupe ? 'sim' : 'nao'}`);
  lines.push(`- Timeout por script: ${report.meta.timeoutMs}ms`);
  lines.push(`- Heartbeat: ${report.meta.heartbeatSec}s`);
  lines.push(`- Configuracao: ${report.meta.configPath}`);
  lines.push(`- Config encontrada: ${report.meta.configFound ? 'sim' : 'nao (fallback interno)'}`);
  lines.push(`- Script policies configuradas: ${report.meta.scriptPoliciesConfigured}`);
  lines.push(`- Script policies aplicadas: ${report.meta.scriptPoliciesApplied}`);
  lines.push(`- Preflights aplicados: ${report.meta.preflightsApplied}`);
  lines.push(`- Preflights com falha: ${report.meta.preflightsFailed}`);
  lines.push(`- Excluidos: ${report.meta.excluded.join(', ') || '(nenhum)'}`);
  lines.push('');
  lines.push('## Resumo');
  lines.push('');
  lines.push(`- Total: ${report.summary.total}`);
  lines.push(`- Passou: ${report.summary.passed}`);
  lines.push(`- Falhou: ${report.summary.failed}`);
  lines.push(`- Timeout: ${report.summary.timedOut}`);
  lines.push(`- Pulado: ${report.summary.skipped}`);
  lines.push(`- Duracao total: ${formatMs(report.meta.totalDurationMs)}`);
  lines.push('');
  lines.push('## Resultado por script');
  lines.push('');
  lines.push('| Area | Script solicitado | Script executado | Policy | Preflight | Status | Duracao | Exit |');
  lines.push('|---|---|---|---|---|---|---:|---:|');

  for (const result of report.results) {
    const aliases = result.requestedAliases && result.requestedAliases.length > 1
      ? `${result.requested} (+${result.requestedAliases.length - 1})`
      : result.requested;
    lines.push(
      `| ${result.area} | \`${aliases}\` | \`${result.executed}\` | ${formatAppliedPolicy(result.appliedPolicy, report.meta.timeoutMs)} | ${formatPreflight(result.preflight)} | ${statusIcon(result.status)} | ${formatMs(result.durationMs)} | ${result.exitCode ?? '-'} |`
    );
  }

  const failedOrTimedOut = report.results.filter(
    result => result.status === 'failed' || result.status === 'timed_out'
  );

  if (failedOrTimedOut.length > 0) {
    lines.push('');
    lines.push('## Falhas e Timeouts');
    lines.push('');

    for (const result of failedOrTimedOut) {
      lines.push(`### ${result.requested} (${statusIcon(result.status)})`);
      lines.push('');
      lines.push(`- Problema resumido: ${pickProblemSummary(result)}`);
      if (result.error) lines.push(`- Erro: ${result.error}`);
      lines.push(`- Area: ${result.area}`);
      lines.push(`- Duracao: ${formatMs(result.durationMs)}`);
      if (result.preflight && !result.preflight.skipped) {
        lines.push(`- Preflight: ${formatPreflight(result.preflight)}`);
      }
      lines.push('');

      if (result.stdoutTail) {
        lines.push('`stdout` (ultimas linhas):');
        lines.push('```text');
        lines.push(result.stdoutTail);
        lines.push('```');
      }
      if (result.stderrTail) {
        lines.push('`stderr` (ultimas linhas):');
        lines.push('```text');
        lines.push(result.stderrTail);
        lines.push('```');
      }
      lines.push('');
    }
  }

  if (Array.isArray(report.rootCauseCandidates) && report.rootCauseCandidates.length > 0) {
    lines.push('');
    lines.push('## Root cause candidates');
    lines.push('');
    for (const cause of report.rootCauseCandidates) {
      lines.push(`### ${cause.label} (${cause.count})`);
      lines.push('');
      lines.push(`- Scripts: ${cause.scripts.join(', ')}`);
      lines.push(`- Hint: ${cause.hint}`);
      if (Array.isArray(cause.samples) && cause.samples.length > 0) {
        lines.push('- Exemplos:');
        for (const sample of cause.samples) {
          lines.push(`  - ${sample}`);
        }
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

function runScript({
  scriptName,
  timeoutMs,
  tailLines,
  heartbeatMs,
  envOverrides = {},
  extraArgs = [],
  onHeartbeat,
}) {
  const bunBin = resolveBunBinary();
  const stdoutBuffer = createTailBuffer(tailLines);
  const stderrBuffer = createTailBuffer(tailLines);
  const runArgs = ['run', scriptName];
  if (Array.isArray(extraArgs) && extraArgs.length > 0) {
    runArgs.push('--', ...extraArgs);
  }

  return new Promise(resolve => {
    const startedAt = Date.now();
    let settled = false;
    let timedOut = false;
    let heartbeat = null;
    let timer = null;
    let timeoutForceTimer = null;
    let timeoutError = null;

    const finalizeOnce = (outcome) => {
      if (settled) return;
      settled = true;
      if (heartbeat) clearInterval(heartbeat);
      if (timeoutForceTimer) clearTimeout(timeoutForceTimer);
      clearTimeout(timer);
      resolve({
        ...outcome,
        durationMs: Date.now() - startedAt,
        stdoutTail: stdoutBuffer.toString(),
        stderrTail: stderrBuffer.toString(),
      });
    };

    const child = spawn(bunBin, runArgs, {
      cwd: ROOT,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...withBunPath(process.env, bunBin),
        ...envOverrides,
      },
    });

    if (typeof onHeartbeat === 'function' && heartbeatMs > 0) {
      heartbeat = setInterval(() => {
        onHeartbeat(Date.now() - startedAt);
      }, heartbeatMs);
    }

    timer = setTimeout(() => {
      timedOut = true;
      timeoutError = `Timeout excedido (${timeoutMs}ms)`;
      timeoutForceTimer = setTimeout(() => {
        finalizeOnce({
          status: 'timed_out',
          exitCode: null,
          error: timeoutError,
        });
      }, FORCE_TIMEOUT_RESOLVE_MS);

      killProcessTree(child).catch(() => {
        // ignore kill errors
      });
    }, timeoutMs);

    child.stdout?.on('data', data => stdoutBuffer.push(data));
    child.stderr?.on('data', data => stderrBuffer.push(data));

    child.on('error', err => {
      finalizeOnce({
        status: timedOut ? 'timed_out' : 'failed',
        exitCode: null,
        error: timedOut ? timeoutError : err.message,
      });
    });

    const onExit = (code) => {
      if (timedOut) {
        finalizeOnce({
          status: 'timed_out',
          exitCode: code,
          error: timeoutError || `Timeout excedido (${timeoutMs}ms)`,
        });
        return;
      }

      finalizeOnce({
        status: code === 0 ? 'passed' : 'failed',
        exitCode: code,
        error: null,
      });
    };

    child.on('exit', onExit);
    child.on('close', onExit);
  });
}

async function main() {
  const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
  const scripts = packageJson.scripts || {};
  const configPathArg = getFlagValue('--config', DEFAULT_CONFIG_PATH);
  const loaded = loadAuditConfig(configPathArg);
  const auditConfig = loaded.config;

  const include = parseCsvFlag('--include');
  const exclude = new Set([
    ...auditConfig.defaultExcludes,
    ...parseCsvFlag('--exclude'),
  ]);
  const areaFilter = new Set(parseCsvFlag('--areas'));
  const isSilent = hasFlag('--silent');
  const isQuiet = hasFlag('--quiet');
  const preferSilent = !hasFlag('--no-prefer-silent');
  const dedupe = !hasFlag('--no-dedupe');
  const failOnError = hasFlag('--fail-on-error');
  const timeoutMs = parseIntFlag('--timeout-ms', 1200000);
  const tailLines = parseIntFlag('--tail-lines', 30);
  const heartbeatSec = parseIntFlag('--heartbeat-sec', 30);
  const heartbeatMs = heartbeatSec * 1000;

  let selected = Object.keys(scripts).filter(name => !exclude.has(name));

  if (include.length > 0) {
    selected = include.filter(name => scripts[name]);
  }

  let executionPlan = selected.map(scriptName => {
    const resolved = resolveSilentVariant(scriptName, scripts, preferSilent);
    return {
      requested: resolved.requested,
      executed: resolved.executed,
      substituted: resolved.substituted,
      area: inferArea(scriptName, auditConfig),
      command: scripts[resolved.executed] || '',
    };
  });

  if (dedupe) {
    executionPlan = dedupeExecutionPlan(executionPlan);
  }

  if (areaFilter.size > 0) {
    executionPlan = executionPlan.filter(item => areaFilter.has(item.area));
  }

  executionPlan = executionPlan.map(item => ({
    ...item,
    appliedPolicy: resolveScriptPolicy(item, auditConfig.scriptPolicies),
  }));

  executionPlan = sortByAreaAndName(executionPlan, auditConfig.areaOrder);

  if (executionPlan.length === 0) {
    console.log('Nenhum script selecionado para auditoria.');
    return;
  }

  const modeLabel = [
    preferSilent ? 'prefer-silent' : 'raw',
    dedupe ? 'dedupe' : 'no-dedupe',
    areaFilter.size > 0 ? `areas:${[...areaFilter].join(',')}` : 'all',
  ].join('|');
  const avgAudit = History.getAverageDuration('scripts-audit', modeLabel);
  let stopTimer = null;

  if (!isSilent) {
    UI.printHeader({
      title: 'SCRIPTS AUDIT',
      modes: [
        '--include=',
        '--exclude=',
        '--areas=',
        '--fail-on-error',
        '--no-prefer-silent',
        '--no-dedupe',
        '--heartbeat-sec=',
        '--timeout-ms=',
        '--silent',
        '--quiet',
      ],
      active: [
        preferSilent ? 'prefer-silent' : 'raw',
        dedupe ? 'dedupe' : 'no-dedupe',
        areaFilter.size > 0 ? `areas(${[...areaFilter].join(',')})` : null,
        isQuiet ? 'quiet' : null,
      ].filter(Boolean),
    });
    stopTimer = UI.printTimingHeader({
      avgLabel: avgAudit,
      modeLabel,
      live: false,
    });
    if (!isQuiet) {
      if (process.stdout.isTTY) {
        UI.clearLine();
      }
      console.log('');
      console.log(UI.hierarchy('Legenda:', { level: 1, color: 'dim' }));
      console.log(UI.hierarchy('✅ OK', { level: 2, color: 'green' }));
      console.log(UI.hierarchy('❌ FAIL', { level: 2, color: 'red' }));
      console.log(UI.hierarchy('⏱️ TIMEOUT', { level: 2, color: 'yellow' }));
      console.log(UI.hierarchy('Avg por script + ETA restante', { level: 2, color: 'dim' }));
      console.log('');
    }
    console.log(UI.info(`Iniciando auditoria de scripts (${executionPlan.length} scripts)...`));
  } else {
    console.log(`Iniciando auditoria de scripts (${executionPlan.length} scripts)...`);
  }

  const results = [];
  const partial = { passed: 0, failed: 0, timedOut: 0 };
  const total = executionPlan.length;
  const areaRollups = new Map();
  let currentArea = null;

  const ensureAreaRollup = (area) => {
    if (!areaRollups.has(area)) {
      areaRollups.set(area, {
        total: 0,
        passed: 0,
        failed: 0,
        timedOut: 0,
        durationMs: 0,
      });
    }
    return areaRollups.get(area);
  };

  const printAreaRollup = (area, rollup) => {
    if (!rollup) return;
    const icon = rollup.failed > 0 || rollup.timedOut > 0 ? '⚠️' : '✅';
    console.log(UI.hierarchy(
      `${icon} Área ${area}: ${rollup.passed} OK | ${rollup.failed} FAIL | ${rollup.timedOut} TIMEOUT | ${formatMs(rollup.durationMs)}`,
      { level: 1, color: rollup.failed > 0 || rollup.timedOut > 0 ? 'yellow' : 'green' }
    ));
  };

  for (let i = 0; i < total; i += 1) {
    const item = executionPlan[i];
    const order = formatOrder(i + 1, total);
    const label = `${item.area} :: ${item.executed}`;
    const perScriptHistoryKey = `${SCRIPT_HISTORY_KEY}:${item.executed}`;
    const avgScriptBefore = History.getAverageDuration(perScriptHistoryKey);
    const avgScriptBeforeMs = parseDurationMs(avgScriptBefore);
    const observedAvgMs = results.length > 0
      ? Math.round(results.reduce((acc, result) => acc + result.durationMs, 0) / results.length)
      : null;
    const etaRemainingMs = estimateRemainingMs(executionPlan, i, observedAvgMs, timeoutMs);
    const aliasesInfo =
      item.requestedAliases && item.requestedAliases.length > 1
        ? ` | aliases: ${item.requestedAliases.join(', ')}`
        : '';

    if (!isSilent && !isQuiet && item.area !== currentArea) {
      if (currentArea) {
        printAreaRollup(currentArea, areaRollups.get(currentArea));
      }
      currentArea = item.area;
      console.log(UI.section(`Área: ${item.area}`, 2));
    }

    if (!isSilent && !isQuiet) {
      UI.printScriptStart(label, i + 1, total);
      const etaLabel = formatEta(etaRemainingMs);
      const avgLabel = avgScriptBefore || (avgScriptBeforeMs ? formatMs(avgScriptBeforeMs) : 'n/a');
      console.log(UI.info(`${order} Avg: ${avgLabel} | ETA restante: ${etaLabel}${aliasesInfo}`));
    } else if (isQuiet) {
      UI.printQuietStepStart(label, i + 1, total);
    } else {
      process.stdout.write(`${order} ${label} ... `);
    }

    const effectiveTimeoutMs = item.appliedPolicy?.timeoutMs || timeoutMs;
    let preflight = { skipped: true };
    let outcome = null;

    if (item.appliedPolicy?.requiresDist && !hasDistArtifacts()) {
      const prepareScript = item.appliedPolicy.prepareScript || DEFAULT_POLICY_PREPARE_SCRIPT;
      preflight = {
        skipped: false,
        script: prepareScript,
        required: 'dist',
      };

      if (!isSilent) {
        console.log(UI.info(`${order} Preflight: preparando dist com '${prepareScript}'...`));
      }

      const prepOutcome = await runScript({
        scriptName: prepareScript,
        timeoutMs: Math.max(effectiveTimeoutMs, timeoutMs),
        tailLines,
        heartbeatMs,
        envOverrides: {},
        extraArgs: [],
        onHeartbeat: (elapsedMs) => {
          if (isSilent) return;
          const elapsed = formatMs(elapsedMs);
          console.log(UI.info(`${order} Preflight em execução: ${prepareScript} | Elapsed: ${elapsed} | Progresso: ${i + 1}/${total}`));
        },
      });

      preflight = {
        ...preflight,
        ...prepOutcome,
      };

      if (prepOutcome.status !== 'passed') {
        const preflightProblem = pickProblemSummary(prepOutcome);
        outcome = {
          status: 'failed',
          exitCode: prepOutcome.exitCode,
          error: `Preflight ${prepareScript} falhou: ${preflightProblem}`,
          durationMs: 0,
          stdoutTail: prepOutcome.stdoutTail,
          stderrTail: prepOutcome.stderrTail,
        };
      } else if (!isSilent) {
        console.log(UI.success(`${order} Preflight concluído: ${prepareScript} (${formatMs(prepOutcome.durationMs)})`));
      }
    }

    if (!outcome) {
      outcome = await runScript({
        scriptName: item.executed,
        timeoutMs: effectiveTimeoutMs,
        tailLines,
        heartbeatMs,
        envOverrides: item.appliedPolicy?.env || {},
        extraArgs: item.appliedPolicy?.args || [],
        onHeartbeat: (elapsedMs) => {
          if (isSilent) return;
          const elapsed = formatMs(elapsedMs);
          const avgText = avgScriptBefore ? ` | Avg: ${avgScriptBefore}` : '';
          console.log(UI.info(`${order} Em execução: ${item.executed} | Elapsed: ${elapsed}${avgText} | Progresso: ${i + 1}/${total}`));
        },
      });
    }

    const combinedDurationMs = outcome.durationMs + (!preflight.skipped && Number.isFinite(preflight.durationMs) ? preflight.durationMs : 0);
    History.saveExecutionTime(perScriptHistoryKey, combinedDurationMs);
    const avgScriptAfter = History.getAverageDuration(perScriptHistoryKey);
    const success = outcome.status === 'passed';

    if (!isSilent && !isQuiet) {
      UI.printScriptEnd(label, combinedDurationMs, avgScriptAfter, success);
    } else if (isQuiet) {
      UI.printQuietStepEnd(label, i + 1, total, combinedDurationMs, avgScriptAfter, success);
    } else {
      console.log(statusIcon(outcome.status));
    }

    if (!success && !isSilent) {
      console.log(UI.warning(`Problema detectado: ${pickProblemSummary(outcome)}`));
      const argsHint = item.appliedPolicy?.args?.length ? ` -- ${item.appliedPolicy.args.join(' ')}` : '';
      if (preflight && !preflight.skipped) {
        console.log(UI.info(`Preflight aplicado: bun run ${preflight.script} (${statusIcon(preflight.status)})`));
      }
      console.log(UI.info(`Reproduzir: bun run ${item.executed}${argsHint}`));
    }

    const areaRollup = ensureAreaRollup(item.area);
    areaRollup.total += 1;
    areaRollup.durationMs += combinedDurationMs;
    if (outcome.status === 'passed') areaRollup.passed += 1;
    if (outcome.status === 'failed') areaRollup.failed += 1;
    if (outcome.status === 'timed_out') areaRollup.timedOut += 1;
    if (outcome.status === 'passed') partial.passed += 1;
    if (outcome.status === 'failed') partial.failed += 1;
    if (outcome.status === 'timed_out') partial.timedOut += 1;

    if (!isSilent && !isQuiet) {
      console.log(
        UI.info(
          `Parcial: ${partial.passed} OK | ${partial.failed} FAIL | ${partial.timedOut} TIMEOUT`
        )
      );
    }

    results.push({
      ...item,
      ...outcome,
      durationMs: combinedDurationMs,
      appliedPolicy: item.appliedPolicy,
      effectiveTimeoutMs,
      preflight,
    });
  }

  if (!isSilent && !isQuiet && currentArea) {
    printAreaRollup(currentArea, areaRollups.get(currentArea));
  }

  const startedAt = new Date();
  const summary = getSummary(results);
  const totalDurationMs = results.reduce((acc, item) => acc + item.durationMs, 0);
  History.saveExecutionTime('scripts-audit', totalDurationMs, modeLabel);
  const report = {
    meta: {
      generatedAt: startedAt.toISOString(),
      timestamp: Date.now(),
      project: packageJson.name || 'unknown',
      totalDurationMs,
      preferSilent,
      dedupe,
      timeoutMs,
      heartbeatSec,
      modeLabel,
      configPath: loaded.path,
      configFound: loaded.exists,
      scriptPoliciesConfigured: Object.keys(auditConfig.scriptPolicies || {}).length,
      scriptPoliciesApplied: results.filter(item => Boolean(item.appliedPolicy)).length,
      preflightsApplied: results.filter(item => item.preflight && !item.preflight.skipped).length,
      preflightsFailed: results.filter(item => item.preflight && !item.preflight.skipped && item.preflight.status !== 'passed').length,
      excluded: [...exclude].sort(),
      include,
      areas: [...areaFilter],
    },
    summary,
    results,
    rootCauseCandidates: buildRootCauseCandidates(results),
  };

  ensureDir(OUTPUT_DIR);

  const stamp = formatTimestamp(startedAt);
  const jsonPath = path.join(OUTPUT_DIR, `scripts-audit-${stamp}.json`);
  const mdPath = path.join(OUTPUT_DIR, `scripts-audit-${stamp}.md`);
  const latestJsonPath = path.join(OUTPUT_DIR, 'scripts-audit-latest.json');
  const latestMdPath = path.join(OUTPUT_DIR, 'scripts-audit-latest.md');

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  fs.writeFileSync(mdPath, generateMarkdown(report), 'utf8');
  fs.writeFileSync(latestJsonPath, JSON.stringify(report, null, 2), 'utf8');
  fs.writeFileSync(latestMdPath, generateMarkdown(report), 'utf8');

  console.log('');
  console.log(UI.hierarchy('Resumo da auditoria de scripts', { level: 0, color: 'white', bold: true }));
  console.log(UI.hierarchy(`Total: ${summary.total}`, { level: 1, color: 'dim' }));
  console.log(UI.hierarchy(`Passou: ${summary.passed}`, { level: 1, color: 'green' }));
  console.log(UI.hierarchy(`Falhou: ${summary.failed}`, { level: 1, color: summary.failed > 0 ? 'red' : 'dim' }));
  console.log(UI.hierarchy(`Timeout: ${summary.timedOut}`, { level: 1, color: summary.timedOut > 0 ? 'yellow' : 'dim' }));
  console.log(UI.hierarchy(`Pulado: ${summary.skipped}`, { level: 1, color: 'dim' }));
  console.log(UI.hierarchy(`Relatorio JSON: ${jsonPath}`, { level: 1, color: 'dim' }));
  console.log(UI.hierarchy(`Relatorio MD: ${mdPath}`, { level: 1, color: 'dim' }));
  console.log(UI.hierarchy(`Relatorio latest JSON: ${latestJsonPath}`, { level: 1, color: 'dim' }));
  console.log(UI.hierarchy(`Relatorio latest MD: ${latestMdPath}`, { level: 1, color: 'dim' }));

  if (!isSilent && areaRollups.size > 0) {
    const orderedAreas = [
      ...auditConfig.areaOrder.filter(area => areaRollups.has(area)),
      ...[...areaRollups.keys()].filter(area => !auditConfig.areaOrder.includes(area)).sort(),
    ];
    console.log(`\n${UI.hierarchy('Resumo por área', { level: 0, color: 'white', bold: true })}`);
    for (const area of orderedAreas) {
      printAreaRollup(area, areaRollups.get(area));
    }
  }

  const slowest = [...results].sort((a, b) => b.durationMs - a.durationMs).slice(0, 5);
  if (slowest.length > 0) {
    console.log(`\n${UI.hierarchy('Scripts mais lentos', { level: 0, color: 'white', bold: true })}`);
    for (const item of slowest) {
      console.log(UI.hierarchy(`${item.executed}: ${formatMs(item.durationMs)} [${statusIcon(item.status)}]`, { level: 1, color: 'dim' }));
    }
  }

  const problematic = results.filter(item => item.status === 'failed' || item.status === 'timed_out');
  if (problematic.length > 0) {
    console.log(`\n${UI.hierarchy('Problemas encontrados', { level: 0, color: 'yellow', bold: true })}`);
    for (const item of problematic) {
      console.log(UI.hierarchy(`${item.executed} [${statusIcon(item.status)}]: ${pickProblemSummary(item)}`, { level: 1, color: 'yellow' }));
    }
  }

  if (Array.isArray(report.rootCauseCandidates) && report.rootCauseCandidates.length > 0) {
    console.log(`\n${UI.hierarchy('Root cause candidates', { level: 0, color: 'yellow', bold: true })}`);
    for (const cause of report.rootCauseCandidates) {
      console.log(UI.hierarchy(`${cause.label}: ${cause.count} script(s)`, { level: 1, color: 'yellow' }));
      console.log(UI.hierarchy(`Hint: ${cause.hint}`, { level: 2, color: 'dim' }));
    }
  }
  if (stopTimer) stopTimer();

  if (failOnError && (summary.failed > 0 || summary.timedOut > 0)) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error(`Erro fatal na auditoria de scripts: ${err.message}`);
  process.exit(1);
});
