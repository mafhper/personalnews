#!/usr/bin/env node
/**
 * Quality Core CLI
 * Inicia automaticamente servidor local para auditorias Playwright,
 * executa audits e encerra o servidor ao final.
 */
const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');
const { spawn } = require('child_process');
const { runAudits } = require('../packages/core/runner.cjs');
const DEFAULT_THRESHOLDS = require('../packages/core/thresholds.cjs');
const UI = require('./ui-helpers.cjs');
const History = require('./history.cjs');
const { refreshDashboardCache } = require('./dashboard-cache.cjs');

// Import Presets
const GITHUB_PAGES_PRESET = require('../presets/github-pages.json');

// Import Audits
const AVAILABLE_AUDITS = {
    'build': require('../packages/audits/build.cjs'),
    'render': require('../packages/audits/render.cjs'),
    'ux': require('../packages/audits/ux.cjs'),
    'a11y': require('../packages/audits/a11y.cjs'),
    'seo': require('../packages/audits/seo.cjs')
};

const DEFAULT_LOCAL_PORT = 4173;
const SERVER_WAIT_TIMEOUT_MS = 60_000;
const SERVER_STOP_TIMEOUT_MS = 8_000;
const BUN_BIN_DEFAULT = process.platform === 'win32' ? 'bun.exe' : 'bun';

function normalizeBasePath(basePath) {
    if (!basePath) return '/';
    let value = String(basePath).trim();
    if (!value.startsWith('/')) value = `/${value}`;
    if (!value.endsWith('/')) value += '/';
    return value;
}

function joinUrl(baseUrl, basePath) {
    const normalized = normalizeBasePath(basePath);
    if (normalized === '/') return baseUrl;
    return `${baseUrl.replace(/\/$/, '')}${normalized}`;
}

function parsePortFromUrl(targetUrl) {
    const parsed = new URL(targetUrl);
    if (parsed.port) return Number.parseInt(parsed.port, 10);
    return parsed.protocol === 'https:' ? 443 : 80;
}

function isLocalUrl(targetUrl) {
    try {
        const parsed = new URL(targetUrl);
        return ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname);
    } catch {
        return false;
    }
}

function createLogBuffer(maxLines = 30) {
    const lines = [];
    return {
        push(data) {
            const chunk = data.toString();
            chunk.split('\n').forEach(line => {
                const trimmed = line.trim();
                if (!trimmed) return;
                lines.push(trimmed);
                if (lines.length > maxLines) lines.shift();
            });
        },
        toString() {
            return lines.join('\n');
        },
    };
}

function getHttpStatus(targetUrl, timeoutMs = 2000) {
    return new Promise(resolve => {
        try {
            const parsed = new URL(targetUrl);
            const client = parsed.protocol === 'https:' ? https : http;
            const req = client.get(parsed, res => {
                res.resume();
                resolve(res.statusCode || null);
            });
            req.setTimeout(timeoutMs, () => {
                req.destroy();
                resolve(null);
            });
            req.on('error', () => resolve(null));
        } catch {
            resolve(null);
        }
    });
}

function isSuccessStatus(status) {
    return Boolean(status && status >= 200 && status < 400);
}

async function isUrlReachable(targetUrl, timeoutMs = 2000) {
    const status = await getHttpStatus(targetUrl, timeoutMs);
    return Boolean(isSuccessStatus(status) || status === 404);
}

async function waitForServer(targetUrl, serverProcess, timeoutMs = SERVER_WAIT_TIMEOUT_MS) {
    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
        if (serverProcess && serverProcess.exitCode !== null) {
            return { ready: false, reason: 'exit', code: serverProcess.exitCode };
        }
        if (serverProcess && serverProcess._spawnError) {
            return { ready: false, reason: 'spawn', error: serverProcess._spawnError };
        }
        if (await isUrlReachable(targetUrl, 1500)) {
            return { ready: true };
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return { ready: false, reason: 'timeout' };
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function resolveBunBinary() {
    if (process.env.BUN_PATH) return process.env.BUN_PATH;
    if (process.versions && process.versions.bun && process.execPath) return process.execPath;

    const home = process.env.HOME || process.env.USERPROFILE || '';
    const fallbackUnix = path.join(home, '.bun', 'bin', 'bun');
    if (home && fs.existsSync(fallbackUnix)) {
        return fallbackUnix;
    }

    return BUN_BIN_DEFAULT;
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

function runDetached(cmd, cmdArgs) {
    return new Promise(resolve => {
        const killer = spawn(cmd, cmdArgs, {
            cwd: process.cwd(),
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
            cwd: process.cwd(),
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

async function killProcessTreeByPid(pid) {
    if (!pid) return;

    if (process.platform === 'win32') {
        await runDetached('taskkill', ['/PID', String(pid), '/T', '/F']);
        return;
    }

    const descendants = await collectDescendantPids(pid);
    const orderedDescendants = [...descendants].reverse();
    for (const childPid of orderedDescendants) {
        try {
            process.kill(childPid, 'SIGTERM');
        } catch {
            // process already terminated
        }
    }

    try {
        process.kill(pid, 'SIGTERM');
    } catch {
        return;
    }

    await wait(500);

    for (const childPid of orderedDescendants) {
        try {
            process.kill(childPid, 0);
            process.kill(childPid, 'SIGKILL');
        } catch {
            // process already terminated
        }
    }

    try {
        process.kill(pid, 0);
        process.kill(pid, 'SIGKILL');
    } catch {
        // process already terminated
    }
}

function closeServerStreams(serverProcess) {
    const streams = [serverProcess?.stdout, serverProcess?.stderr].filter(Boolean);
    for (const stream of streams) {
        try {
            stream.removeAllListeners('data');
            stream.removeAllListeners('error');
            stream.removeAllListeners('close');
            stream.pause?.();
            stream.destroy?.();
        } catch {
            // ignore stream cleanup errors
        }
    }
}

function startLocalServer({ projectRoot, port, host, logs }) {
    const bunBin = resolveBunBinary();
    const script = 'preview';
    const args = ['run', script, '--', '--port', String(port), '--strictPort', '--host', host];

    const child = spawn(bunBin, args, {
        cwd: projectRoot,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: false,
        detached: false,
        env: withBunPath(process.env, bunBin),
    });

    child.on('error', err => {
        child._spawnError = err;
        logs.stderr.push(err.message || String(err));
    });
    child.stdout?.on('data', data => logs.stdout.push(data));
    child.stderr?.on('data', data => logs.stderr.push(data));

    child._mode = script;
    return child;
}

async function ensureDistArtifacts({ projectRoot, isSilent, isQuiet }) {
    const distDir = path.join(projectRoot, 'dist');
    const distIndex = path.join(distDir, 'index.html');
    if (fs.existsSync(distIndex)) return;

    const bunBin = resolveBunBinary();
    const runArgs = ['run', 'build:app'];

    if (!isSilent && !isQuiet) {
        console.log(UI.info(`Dist não encontrado. Executando build automático ('bun run build:app')...`));
    }

    await new Promise((resolve, reject) => {
        const child = spawn(bunBin, runArgs, {
            cwd: projectRoot,
            shell: false,
            env: withBunPath(process.env, bunBin),
            stdio: isSilent || isQuiet ? ['ignore', 'pipe', 'pipe'] : 'inherit',
        });

        const logs = createLogBuffer(40);
        if (isSilent || isQuiet) {
            child.stdout?.on('data', data => logs.push(data));
            child.stderr?.on('data', data => logs.push(data));
        }

        child.on('error', err => reject(err));
        child.on('close', code => {
            if (code === 0) {
                if (fs.existsSync(distIndex)) {
                    resolve();
                    return;
                }
                reject(new Error(`Build concluído, mas dist não foi gerado em ${distDir}.`));
                return;
            }

            const details = logs.toString();
            const extra = details ? `\n\nÚltimos logs:\n${details}` : '';
            reject(new Error(`Falha no build automático (exit ${code ?? 'n/a'}).${extra}`));
        });
    });
}

async function stopServer(serverProcess) {
    if (!serverProcess || !serverProcess.pid) return;

    closeServerStreams(serverProcess);
    const pid = serverProcess.pid;

    await Promise.race([
        new Promise(resolve => {
            let done = false;
            const finish = () => {
                if (done) return;
                done = true;
                resolve();
            };

            serverProcess.once('exit', finish);
            serverProcess.once('close', finish);

            killProcessTreeByPid(pid)
                .catch(() => {})
                .finally(() => {
                    setTimeout(finish, 1200);
                });
        }),
        wait(SERVER_STOP_TIMEOUT_MS),
    ]);
}

function buildServerStartupError(targetUrl, serverReady, serverLogs, modeHint) {
    const reason =
        serverReady.reason === 'exit'
            ? `Servidor encerrou (code ${serverReady.code ?? 'n/a'})`
            : serverReady.reason === 'spawn'
                ? `Falha ao iniciar servidor: ${serverReady.error?.message || serverReady.error}`
                : `Timeout aguardando servidor (${SERVER_WAIT_TIMEOUT_MS}ms)`;

    const out = serverLogs.stdout.toString();
    const err = serverLogs.stderr.toString();
    const details = [out, err].filter(Boolean).join('\n');
    const extra = details ? `\n\nÚltimos logs do servidor:\n${details}` : '';

    return new Error(`Não foi possível iniciar servidor local (${modeHint}) para ${targetUrl}. ${reason}.${extra}`);
}

async function resolveLocalAuditUrl(targetUrl, isSilent, isQuiet) {
    let parsed;
    try {
        parsed = new URL(targetUrl);
    } catch {
        return targetUrl;
    }

    const preferredStatus = await getHttpStatus(targetUrl, 2000);
    if (isSuccessStatus(preferredStatus)) {
        return targetUrl;
    }

    const originRootUrl = `${parsed.origin}/`;
    const originStatus = await getHttpStatus(originRootUrl, 2000);
    if (isSuccessStatus(originStatus)) {
        if (!isSilent && !isQuiet && preferredStatus === 404) {
            console.log(UI.warning(`URL local ${targetUrl} retornou 404. Usando ${originRootUrl} para auditoria.`));
        }
        return originRootUrl;
    }

    return targetUrl;
}

async function main() {
    const args = process.argv.slice(2);
    const presetName = args.find(a => a.startsWith('--preset='))?.split('=')[1] || 'github-pages';
    const isQuick = args.includes('--quick');
    const isFailOnError = args.includes('--fail-on-error');
    const isQuiet = args.includes('--quiet');
    const isSilent = args.includes('--silent');
    const disableAutoServer = args.includes('--no-server');
    const hasExplicitUrl = args.some(a => a.startsWith('--url='));
    const modeLabel = [
        isQuick ? 'quick' : 'full',
        isSilent ? 'silent' : isQuiet ? 'quiet' : 'default',
    ].join('-');

    // Rastreamento em silent mode
    const executionLog = {
        startTime: Date.now(),
        errors: [],
        warnings: [],
        results: [],
    };

    let stopTimer = null;
    if (!isSilent) {
        UI.printHeader({
            title: 'QUALITY CORE CLI',
            modes: ['--quick', '--silent', '--quiet', '--no-server'],
            active: [
                isQuick ? 'quick' : null,
                isSilent ? 'silent' : null,
                isQuiet ? 'quiet' : null,
                disableAutoServer ? 'no-server' : null,
            ].filter(Boolean),
        });
        console.log(UI.info(`Preset: ${presetName}`));
        if (isQuick) {
            console.log(UI.warning(`Modo rápido: apenas build será executado`));
        }
        const avgHeader = History.getAverageDuration('quality-core', modeLabel);
        stopTimer = UI.printTimingHeader({
            avgLabel: avgHeader,
            modeLabel,
            live: UI.shouldLiveTimer() && !isQuiet,
        });
        if (!isQuiet) {
            UI.printWrapped('Legenda:', { level: 1, color: 'dim' });
            UI.printWrapped('✅ PASS: audit sem violações.', { level: 2, color: 'green' });
            UI.printWrapped('⚠️ WARN: violações não bloqueantes.', { level: 2, color: 'yellow' });
            UI.printWrapped('❌ FAIL: erro de execução ou threshold crítico.', { level: 2, color: 'red' });
            console.log('');
        }
    }

    // Preset Config
    const preset = presetName === 'github-pages' ? GITHUB_PAGES_PRESET : GITHUB_PAGES_PRESET;
    const urlArg = args.find(a => a.startsWith('--url='))?.split('=')[1];
    const defaultUrl = joinUrl(`http://localhost:${DEFAULT_LOCAL_PORT}`, preset.basePath || '/');
    const url = urlArg || defaultUrl;

    const context = {
        url: url,
        preset: presetName,
        device: preset.device || 'mobile',
        thresholds: DEFAULT_THRESHOLDS,
        projectRoot: process.cwd(),
        distDir: path.join(process.cwd(), 'dist')
    };

    // Select Audits
    const auditsToRun = [];
    if (isQuick) {
        auditsToRun.push(AVAILABLE_AUDITS.build);
    } else {
        auditsToRun.push(AVAILABLE_AUDITS.build);
        auditsToRun.push(AVAILABLE_AUDITS.render);
        auditsToRun.push(AVAILABLE_AUDITS.ux);
        auditsToRun.push(AVAILABLE_AUDITS.a11y);
        auditsToRun.push(AVAILABLE_AUDITS.seo);
    }

    // Filter out undefined if any audit implementation is missing
    const validAudits = auditsToRun.filter(Boolean);

    if (validAudits.length === 0) {
        console.error(UI.error("No valid audits found to run. Check your configuration or implementation."));
        process.exit(1);
    }

    if (!isSilent && !isQuiet) {
        UI.printScriptStart('quality core', 1, 1);
    } else if (isQuiet) {
        UI.printQuietStepStart('quality core', 1, 1);
    }

    const requiresPageAudits = validAudits.some(audit => audit.name !== 'build');
    const shouldManageServer = requiresPageAudits && !disableAutoServer && isLocalUrl(context.url);
    if (!isSilent && !isQuiet) {
        const planTasks = [
            ...(shouldManageServer ? [{ name: 'Server startup' }] : []),
            ...validAudits.map(audit => ({ name: `Audit: ${audit.name}` })),
            { name: 'Persist reports' },
        ];
        UI.printPlan(planTasks);
    }

    const serverLogs = {
        stdout: createLogBuffer(),
        stderr: createLogBuffer(),
    };
    let serverProcess = null;
    let result = null;
    let exitCode = 0;

    try {
        if (shouldManageServer) {
            await ensureDistArtifacts({
                projectRoot: context.projectRoot,
                isSilent,
                isQuiet,
            });

            const isReachable = await isUrlReachable(context.url, 1500);
            if (!isReachable) {
                const parsed = new URL(context.url);
                const host = parsed.hostname || 'localhost';
                const port = parsePortFromUrl(context.url);

                if (!isSilent) {
                    console.log(UI.info(`Servidor não encontrado em ${context.url}; iniciando automaticamente...`));
                }

                serverProcess = startLocalServer({
                    projectRoot: context.projectRoot,
                    port,
                    host,
                    logs: serverLogs,
                });

                const serverReady = await waitForServer(context.url, serverProcess);
                if (!serverReady.ready) {
                    throw buildServerStartupError(context.url, serverReady, serverLogs, serverProcess._mode || 'preview');
                }
            } else if (!isSilent && !isQuiet) {
                console.log(UI.info(`Servidor já disponível em ${context.url}; usando instância existente.`));
            }
        }

        // For local preview/dev, avoid auditing a basePath that returns 404 (common in local Vite preview).
        if (!hasExplicitUrl && isLocalUrl(context.url)) {
            context.url = await resolveLocalAuditUrl(context.url, isSilent, isQuiet);
        }

        // Run Audits
        result = await runAudits({ audits: validAudits, context });

        // Save Reports
        const reportDir = path.join(process.cwd(), 'performance-reports', 'quality');
        const filename = `quality-${Date.now()}`;

        // JSON
        const JsonReporter = require('../packages/reporters/json.cjs');
        const jsonPath = JsonReporter.save(result, reportDir, `${filename}.json`);
        if (!isSilent) {
            console.log(`\n${UI.info(`📄 JSON Report: ${jsonPath}`)}`);
        }

        // Latest JSON for Dashboard
        JsonReporter.save(result, reportDir, 'quality-latest.json');

        // Markdown
        const MarkdownReporter = require('../packages/reporters/markdown.cjs');
        const mdContent = MarkdownReporter.generate(result);
        const mdPath = path.join(reportDir, `${filename}.md`);
        fs.writeFileSync(mdPath, mdContent);
        if (!isSilent) {
            console.log(UI.info(`📄 Markdown Report: ${mdPath}`));
        }

        // Exit with appropriate code
        const durationMs = Date.now() - executionLog.startTime;
        History.saveExecutionTime('quality-core', durationMs, modeLabel);
        const avg = History.getAverageDuration('quality-core', modeLabel);
        const violations = result.violations || [];
        const warningLines = violations
            .filter(v => v.severity !== 'error')
            .map(v => `${v.area}.${v.metric}: ${v.value} (threshold: ${v.threshold ?? 'n/a'})`);
        const errorLines = violations
            .filter(v => v.severity === 'error')
            .map(v => `${v.area}.${v.metric}: ${v.value} (threshold: ${v.threshold ?? 'n/a'})`);
        const timingLines = (result.meta?.auditTimings || []).map((timing) => {
            const status = timing.status === 'pass' ? 'OK' : timing.status === 'warn' ? 'WARN' : 'FAIL';
            return `${timing.name}: ${(timing.durationMs / 1000).toFixed(2)}s [${status}]`;
        });

        if (!isSilent && !isQuiet) {
            UI.printScriptEnd('quality core', durationMs, avg, result.status !== 'fail');
            UI.printSummary({
                title: 'QUALITY CORE',
                status: result.status === 'fail' ? 'fail' : 'pass',
                warnings: warningLines,
                errors: errorLines,
                timings: timingLines,
                duration: (durationMs / 1000).toFixed(2),
                reportDir: reportDir,
                maxItems: 8,
            });
        } else if (isQuiet) {
            UI.printQuietStepEnd('quality core', 1, 1, durationMs, avg, result.status !== 'fail');
        }

        const shouldRefreshQuiet = isSilent || isQuiet;
        await refreshDashboardCache({ silent: shouldRefreshQuiet });

        if (result.status === 'fail') {
            if (isSilent) {
                const duration = (durationMs / 1000).toFixed(2);

                UI.printSummary({
                    title: 'QUALITY CORE',
                    status: 'fail',
                    warnings: warningLines,
                    errors: errorLines,
                    timings: timingLines,
                    duration,
                    reportDir: path.join(process.cwd(), 'performance-reports', 'quality'),
                });
            }
            exitCode = isFailOnError ? 1 : 0;
        } else {
            if (isSilent) {
                const duration = (durationMs / 1000).toFixed(2);

                UI.printSummary({
                    title: 'QUALITY CORE',
                    status: 'pass',
                    warnings: warningLines,
                    errors: errorLines,
                    timings: timingLines,
                    duration,
                    reportDir: path.join(process.cwd(), 'performance-reports', 'quality'),
                });
            }
            exitCode = 0;
        }
    } finally {
        if (serverProcess) {
            await stopServer(serverProcess);
        }
        if (stopTimer) stopTimer();
    }

    process.exit(exitCode);
}

main().catch(err => {
    console.error(UI.error("Fatal Error:"), err);
    process.exit(1);
});
