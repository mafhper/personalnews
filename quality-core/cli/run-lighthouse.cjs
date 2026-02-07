/**
 * Performance Test - Lighthouse CLI Runner (Autonomo)
 * 
 * 1. Inicia servidor de desenvolvimento se necessario
 * 2. Executa Lighthouse para Mobile e Desktop
 * 3. Salva reports JSON
 * 4. Encerra servidor se foi iniciado pelo script
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const os = require('os');
const UI = require('./ui-helpers.cjs');
const History = require('./history.cjs');
const { refreshDashboardCache } = require('./dashboard-cache.cjs');

const args = process.argv.slice(2);
const isQuiet = args.includes('--quiet') || args.includes('-q');
const isSilent = args.includes('--silent') || args.includes('-s');
const targetArgIndex = args.indexOf('--target');
const targetArgValue =
    targetArgIndex >= 0 ? args[targetArgIndex + 1] : null;
const targetInline = args.find(arg => arg.startsWith('--target='));
const explicitTargetArg = targetInline ? targetInline.split('=')[1] : targetArgValue;
const targetFlag =
    args.includes('--home') ? 'home' :
    args.includes('--feed') ? 'feed' :
    null;
const mobileThrottling = process.env.LH_MOBILE_THROTTLING || 'simulate';
const desktopThrottling = process.env.LH_DESKTOP_THROTTLING || 'provided';
const headlessMode =
    process.env.LH_HEADLESS ||
    process.env.LIGHTHOUSE_HEADLESS ||
    'new';
const extraChromeFlags =
    process.env.LH_CHROME_FLAGS ||
    process.env.LIGHTHOUSE_CHROME_FLAGS ||
    '';
const serverHost =
    process.env.LH_HOST ||
    process.env.LIGHTHOUSE_HOST ||
    '127.0.0.1';
const serverWaitOverride = Number.parseInt(
    process.env.LH_SERVER_WAIT_MS ||
    process.env.LIGHTHOUSE_SERVER_WAIT_MS ||
    '',
    10
);
const retryCount = Number.parseInt(
    process.env.LH_RETRY_COUNT ||
    process.env.LIGHTHOUSE_RETRY_COUNT ||
    '1',
    10
);
const retryTransientOnlyRaw =
    process.env.LH_RETRY_TRANSIENT_ONLY ||
    process.env.LIGHTHOUSE_RETRY_TRANSIENT_ONLY ||
    'true';
const retryBackoffMs = Number.parseInt(
    process.env.LH_RETRY_BACKOFF_MS ||
    process.env.LIGHTHOUSE_RETRY_BACKOFF_MS ||
    '1200',
    10
);
const SERVER_STOP_TIMEOUT_MS = 8000;
const SOFT_KILL_GRACE_MS = 800;
const TRANSIENT_REASON_CODES = new Set([
    'runtime_error',
    'chrome_connect',
    'server_unreachable',
    'protocol_timeout',
    'page_timeout',
    'unknown_timeout',
]);

function parseBooleanEnv(value, fallback = true) {
    if (value === undefined || value === null || value === '') return fallback;
    const normalized = String(value).trim().toLowerCase();
    if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) return false;
    return fallback;
}

function resolveBunBinary() {
    if (process.env.BUN_PATH) return process.env.BUN_PATH;
    if (process.versions && process.versions.bun && process.execPath) return process.execPath;

    const home = process.env.HOME || process.env.USERPROFILE || '';
    const fallbackUnix = path.join(home, '.bun', 'bin', 'bun');
    if (home && fs.existsSync(fallbackUnix)) {
        return fallbackUnix;
    }

    return process.platform === 'win32' ? 'bun.exe' : 'bun';
}

function resolveBunxBinary(bunBin) {
    if (process.env.BUNX_PATH) return process.env.BUNX_PATH;

    const binName = process.platform === 'win32' ? 'bunx.exe' : 'bunx';
    const bunDir = bunBin ? path.dirname(bunBin) : '';
    if (bunDir) {
        const sibling = path.join(bunDir, binName);
        if (fs.existsSync(sibling)) return sibling;
    }

    return binName;
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

const bunCmd = resolveBunBinary();
const bunxCmd = resolveBunxBinary(bunCmd);

function normalizeTarget(input) {
    if (!input) return null;
    const value = String(input).toLowerCase();
    if (['home', 'landing', 'root', 'homepage'].includes(value)) return 'home';
    if (['feed', 'app', 'reader'].includes(value)) return 'feed';
    return null;
}

const targetScope = normalizeTarget(
    targetFlag ||
    explicitTargetArg ||
    process.env.LH_TARGET ||
    process.env.LIGHTHOUSE_TARGET
) || 'feed';
const retryTransientOnly = parseBooleanEnv(retryTransientOnlyRaw, true);

function resolveChromePath() {
    const envPath = process.env.CHROME_PATH || process.env.CHROMIUM_PATH;
    if (envPath && fs.existsSync(envPath)) return envPath;

    const candidates = [
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
        '/snap/bin/chromium',
    ];

    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) return candidate;
    }

    return null;
}

function normalizeBasePath(input) {
    if (!input) return '/';
    let base = input.trim();
    if (!base.startsWith('/')) base = `/${base}`;
    if (!base.endsWith('/')) base += '/';
    return base;
}

function resolveBasePath(projectRoot) {
    const envBase =
        process.env.LIGHTHOUSE_BASE_PATH ||
        process.env.LH_BASE_PATH ||
        process.env.BASE_PATH;
    if (envBase) return normalizeBasePath(envBase);

    const indexPath = path.join(projectRoot, 'dist', 'index.html');
    if (!fs.existsSync(indexPath)) return '/';

    try {
        const html = fs.readFileSync(indexPath, 'utf8');
        const assetMatch = html.match(/(?:src|href)=["'](\/[^"']+?\/assets\/[^"']+)["']/);
        if (assetMatch?.[1]) {
            const assetPath = assetMatch[1];
            const idx = assetPath.indexOf('/assets/');
            if (idx >= 0) return assetPath.slice(0, idx + 1);
        }
    } catch {
        // Ignore parsing errors; fallback to root
    }

    return '/';
}

function joinUrl(baseUrl, basePath) {
    if (!basePath || basePath === '/') return baseUrl;
    return baseUrl.replace(/\/$/, '') + '/' + basePath.replace(/^\/+/, '');
}

function applyTarget(url, target) {
    const base = url.split('#')[0];
    if (target === 'feed') return `${base}#feed`;
    return base;
}

function getHttpStatus(url) {
    return new Promise(resolve => {
        try {
            const req = http.get(url, res => {
                res.resume();
                resolve(res.statusCode || null);
            });
            req.on('error', () => resolve(null));
        } catch {
            resolve(null);
        }
    });
}

function createLogBuffer(maxLines = 20) {
    const lines = [];
    return {
        push(data) {
            const chunk = data.toString();
            chunk.split('\n').forEach(line => {
                if (!line.trim()) return;
                lines.push(line.trim());
                if (lines.length > maxLines) lines.shift();
            });
        },
        toString() {
            return lines.join('\n');
        },
    };
}

async function resolveTargetUrl(baseUrl, basePath, isSilent) {
    const envUrl = process.env.LH_URL || process.env.LIGHTHOUSE_URL;
    if (envUrl) return envUrl;

    const candidate = joinUrl(baseUrl, basePath);
    const status = await getHttpStatus(candidate);
    if (status && status >= 200 && status < 400) return candidate;

    const rootStatus = await getHttpStatus(baseUrl);
    if (rootStatus && rootStatus >= 200 && rootStatus < 400) {
        if (!isSilent && basePath !== '/') {
            console.log(UI.warning(`Base path ${basePath} indisponível (status ${status}). Usando "/"`));
        }
        return baseUrl;
    }

    return candidate;
}

// Configuracao
const CONFIG = {
    port: 5173,
    host: serverHost,
    outputDir: path.resolve(__dirname, '../../performance-reports/lighthouse'),
    categories: ['performance', 'accessibility', 'best-practices', 'seo'],
    maxWaitTime: Number.isFinite(serverWaitOverride) && serverWaitOverride > 0 ? serverWaitOverride : 60000, // 60s timeout para iniciar server
};

// Cores
const c = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    dim: '\x1b[2m',
};

function log(msg, type = 'info') {
    if (isSilent) return;
    if (isQuiet && type === 'info') return;
    const icons = { info: 'ℹ️', success: '✅', error: '❌', warn: '⚠️', wait: '⏳' };
    console.log(`${icons[type]} ${msg}`);
}

// Verifica se porta esta em uso
function isPortInUse(port) {
    return new Promise((resolve) => {
        const server = http.createServer();
        server.once('error', (err) => {
            if (err.code === 'EADDRINUSE') resolve(true);
            else resolve(false);
        });
        server.once('listening', () => {
            server.close();
            resolve(false);
        });
        server.listen(port);
    });
}

async function findAvailablePort(startPort, attempts = 10) {
    for (let i = 0; i < attempts; i++) {
        const port = startPort + i;
        const inUse = await isPortInUse(port);
        if (!inUse) return port;
    }
    return startPort;
}

// Aguarda URL ficar disponivel
async function waitForServer(url, serverProcess) {
    const start = Date.now();
    while (Date.now() - start < CONFIG.maxWaitTime) {
        if (serverProcess && serverProcess.exitCode !== null) {
            return { ready: false, reason: 'exit', code: serverProcess.exitCode };
        }
        if (serverProcess && serverProcess._spawnError) {
            return { ready: false, reason: 'spawn', error: serverProcess._spawnError };
        }
        try {
            await new Promise((resolve, reject) => {
                http.get(url, (res) => {
                    if ((res.statusCode >= 200 && res.statusCode < 400) || res.statusCode === 404) resolve();
                    else reject();
                }).on('error', reject);
            });
            return { ready: true };
        } catch {
            await new Promise(r => setTimeout(r, 1000));
            if (!isSilent && !isQuiet) {
                process.stdout.write('.');
            }
        }
    }
    return { ready: false, reason: 'timeout' };
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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

    await wait(SOFT_KILL_GRACE_MS);

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

// Inicia servidor
function startServer(port, logs) {
    log(`Iniciando servidor na porta ${port}...`, 'wait');

    const projectRoot = path.resolve(__dirname, '../../');
    const distDir = path.resolve(projectRoot, 'dist');
    const usePreview = fs.existsSync(distDir);
    const script = usePreview ? 'preview' : 'dev';
    const args = [
        'run',
        script,
        '--',
        '--port',
        String(port),
        '--strictPort',
        '--host',
        CONFIG.host,
    ];

    const child = spawn(bunCmd, args, {
        cwd: projectRoot,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: false,
        detached: false,
        env: withBunPath(process.env, bunCmd),
    });
    child.on('error', (err) => {
        child._spawnError = err;
        logs?.stderr?.push?.(String(err.message || err));
    });
    if (logs) {
        child.stdout?.on('data', data => logs.stdout.push(data));
        child.stderr?.on('data', data => logs.stderr.push(data));
    }
    return child;
}

function validateLighthouseReport(report) {
    const runtimeError = report?.runtimeError || report?.lhr?.runtimeError;
    if (runtimeError) {
        const reason = runtimeError.code || runtimeError.message || 'UNKNOWN_RUNTIME_ERROR';
        return {
            valid: false,
            reasonCode: 'runtime_error',
            reason: `runtimeError=${reason}`,
            scores: null,
        };
    }

    const categories = report?.categories || report?.lhr?.categories || {};
    const scores = {};
    for (const category of CONFIG.categories) {
        const rawScore = categories?.[category]?.score;
        if (typeof rawScore !== 'number' || Number.isNaN(rawScore)) {
            return {
                valid: false,
                reasonCode: 'invalid_score',
                reason: `category_${category}_score_invalid`,
                scores: null,
            };
        }
        scores[category] = Math.round(rawScore * 100);
    }

    return {
        valid: true,
        reasonCode: null,
        reason: null,
        scores,
    };
}

function getLastMeaningfulLine(stderr) {
    const lines = String(stderr || '')
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);
    return lines.length > 0 ? lines[lines.length - 1].slice(0, 200) : null;
}

function classifyStderrFailure(stderr, code, chromePath) {
    const normalized = String(stderr || '');
    const lastLine = getLastMeaningfulLine(normalized);
    let reasonCode = 'lighthouse_cli_error';
    let reason = `exit_code=${code ?? 'unknown'}`;

    const runtimeMatch = normalized.match(/runtimeError(?:=|:)\s*([A-Z_]+)/i);
    if (runtimeMatch?.[1]) {
        reasonCode = 'runtime_error';
        reason = `runtimeError=${runtimeMatch[1].toUpperCase()}`;
    } else if (normalized.includes('NO_FCP')) {
        reasonCode = 'runtime_error';
        reason = 'runtimeError=NO_FCP';
    } else if (normalized.includes('PROTOCOL_TIMEOUT')) {
        reasonCode = 'protocol_timeout';
        reason = 'protocol_timeout';
    } else if (normalized.includes('Unable to connect to Chrome') || normalized.includes('DevToolsActivePort')) {
        reasonCode = 'chrome_connect';
        reason = 'chrome_connect';
    } else if (normalized.includes('ERR_CONNECTION_REFUSED')) {
        reasonCode = 'server_unreachable';
        reason = 'server_unreachable';
    } else if (normalized.includes('Timeout') || normalized.includes('timed out')) {
        reasonCode = 'page_timeout';
        reason = 'page_timeout';
    } else if (normalized.includes('ENOENT')) {
        reasonCode = 'lighthouse_missing';
        reason = 'lighthouse_cli_missing';
    }

    let message = `[${reasonCode}] ${reason}`;
    if (!chromePath && reasonCode.startsWith('chrome')) {
        message += ' | Defina CHROME_PATH para o binario do Chrome/Chromium';
    }
    if (lastLine && !message.includes(lastLine)) {
        message += ` | ${lastLine}`;
    }

    return {
        reasonCode,
        reason,
        message,
    };
}

function isTransientRuntimeReason(reason) {
    const match = String(reason || '').match(/^runtimeError=([A-Z_]+)/);
    if (!match?.[1]) return false;
    return ['NO_FCP', 'PROTOCOL_TIMEOUT', 'TARGET_CRASHED', 'NO_NAVSTART'].includes(match[1]);
}

function shouldRetryFailure(failure) {
    if (!failure || failure.success) return false;
    if (!retryTransientOnly) return true;
    if (TRANSIENT_REASON_CODES.has(failure.reasonCode)) return true;
    if (isTransientRuntimeReason(failure.reason)) return true;
    return false;
}

function runLighthouseOnce(url, formFactor, target, attempt, totalAttempts) {
    return new Promise((resolve) => {
        const start = Date.now();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `lighthouse_${target}_${formFactor}_${timestamp}.json`;
        const outputPath = path.join(CONFIG.outputDir, filename);

        if (!isSilent) {
            console.log(`\n${c.cyan}🔦 Executando Lighthouse (${formFactor} • ${target}) [tentativa ${attempt}/${totalAttempts}]...${c.reset}`);
        }

        const userDataDir = path.join(os.tmpdir(), `lighthouse-profile-${process.pid}-${formFactor}-${Date.now()}`);
        const headlessFlag =
            headlessMode === 'legacy' || headlessMode === 'old'
                ? '--headless'
                : '--headless=new';
        const chromeFlags = `${headlessFlag} --no-sandbox --disable-dev-shm-usage --disable-gpu --disable-backgrounding-occluded-windows --disable-renderer-backgrounding --disable-background-timer-throttling --disable-features=Translate,BackForwardCache --no-first-run --no-default-browser-check ${extraChromeFlags}`.trim();
        const chromeFlagsWithProfile = `${chromeFlags} --user-data-dir=${userDataDir}`;
        const chromePath = resolveChromePath();
        const lhArgs = [
            'lighthouse',
            url,
            '--output=json',
            `--output-path=${outputPath}`,
            `--form-factor=${formFactor}`,
            `--chrome-flags=${chromeFlagsWithProfile}`,
            '--only-categories=' + CONFIG.categories.join(','),
            '--quiet',
        ];
        const maxWait = process.env.LH_MAX_WAIT_MS || process.env.LIGHTHOUSE_MAX_WAIT_MS || 120000;
        lhArgs.push(`--max-wait-for-load=${maxWait}`);
        if (chromePath) {
            lhArgs.push(`--chrome-path=${chromePath}`);
        }

        if (formFactor === 'mobile') {
            lhArgs.push(`--throttling-method=${mobileThrottling}`);
        } else {
            lhArgs.push('--screenEmulation.disabled');
            lhArgs.push(`--throttling-method=${desktopThrottling}`);
            lhArgs.push('--throttling.cpuSlowdownMultiplier=1');
        }

        let stderr = '';
        const child = spawn(bunxCmd, lhArgs, {
            shell: false,
            stdio: ['ignore', 'ignore', 'pipe'], // Capture stderr
            env: withBunPath(process.env, bunCmd),
        });

        // Progress animation
        const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        let i = 0;
        const spinner = (!isSilent && !isQuiet)
            ? setInterval(() => {
                process.stdout.write(`\r   ${frames[i++ % frames.length]} Analisando...`);
              }, 100)
            : null;

        child.stderr?.on('data', (data) => {
            stderr += data.toString();
        });

        child.on('close', (code) => {
            if (spinner) {
                clearInterval(spinner);
                process.stdout.write('\r                    \r'); // Clear line
            }

            if (fs.existsSync(outputPath)) {
                try {
                    const report = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
                    const validation = validateLighthouseReport(report);
                    if (!validation.valid) {
                        resolve({
                            success: false,
                            reasonCode: validation.reasonCode || 'invalid_report',
                            reason: validation.reason || 'invalid_report',
                            error: `[${validation.reasonCode || 'invalid_report'}] ${validation.reason || 'invalid_report'}`,
                            path: outputPath,
                            code,
                            duration: Date.now() - start,
                        });
                        return;
                    }

                    resolve({
                        success: true,
                        path: outputPath,
                        scores: validation.scores,
                        reasonCode: null,
                        reason: null,
                        code,
                        duration: Date.now() - start,
                    });
                    return;
                } catch (e) {
                    resolve({
                        success: false,
                        reasonCode: 'invalid_json',
                        reason: 'invalid_json',
                        error: `[invalid_json] ${e.message}`,
                        path: outputPath,
                        code,
                        duration: Date.now() - start,
                    });
                    return;
                }
            }

            const failure = classifyStderrFailure(stderr, code, chromePath);
            resolve({
                success: false,
                reasonCode: failure.reasonCode,
                reason: failure.reason,
                error: failure.message,
                path: null,
                code,
                duration: Date.now() - start,
            });
        });

        child.on('error', (err) => {
            if (spinner) clearInterval(spinner);
            resolve({
                success: false,
                reasonCode: 'spawn_error',
                reason: 'spawn_error',
                error: `[spawn_error] ${err.message}`,
                path: null,
                code: null,
                duration: Date.now() - start,
            });
        });
    });
}

// Executa Lighthouse com retry controlado
async function runLighthouse(url, formFactor, target) {
    const safeRetryCount = Number.isFinite(retryCount) && retryCount >= 0 ? retryCount : 1;
    const maxAttempts = 1 + safeRetryCount;
    let lastFailure = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        const outcome = await runLighthouseOnce(url, formFactor, target, attempt, maxAttempts);
        if (outcome.success) {
            return {
                ...outcome,
                attempt,
                attempts: maxAttempts,
            };
        }

        lastFailure = {
            ...outcome,
            attempt,
            attempts: maxAttempts,
        };

        if (attempt >= maxAttempts || !shouldRetryFailure(outcome)) {
            break;
        }

        if (!isSilent) {
            const mode = retryTransientOnly ? 'transient-only' : 'all-failures';
            console.log(UI.warning(`Retry ${attempt}/${safeRetryCount} para ${formFactor}: ${outcome.error} | mode=${mode}`));
        }
        const safeBackoff = Number.isFinite(retryBackoffMs) && retryBackoffMs > 0 ? retryBackoffMs : 1200;
        await wait(safeBackoff * attempt);
    }

    return lastFailure || {
        success: false,
        reasonCode: 'unknown_failure',
        reason: 'unknown_failure',
        error: '[unknown_failure] sem detalhes',
        duration: 0,
        attempt: maxAttempts,
        attempts: maxAttempts,
    };
}

async function main() {
    const startTime = Date.now();
    const modeLabel = [
        isSilent ? 'silent' : isQuiet ? 'quiet' : 'default',
    ].join('-');
    const historyBase = `lighthouse-${targetScope}`;
    let stopTimer = null;
    if (!isSilent) {
        UI.printHeader({
            title: 'QUALITY CORE - LIGHTHOUSE',
            modes: ['--silent', '--quiet', '--home', '--feed', '--target'],
            active: [
                isSilent ? 'silent' : null,
                isQuiet ? 'quiet' : null,
                targetScope ? `target:${targetScope}` : null,
            ].filter(Boolean),
        });
        const avgHeader = History.getAverageDuration(historyBase, modeLabel);
        stopTimer = UI.printTimingHeader({
            avgLabel: avgHeader,
            modeLabel,
            live: UI.shouldLiveTimer() && !isQuiet,
        });
        if (!isQuiet) {
            UI.printWrapped('Legenda:', { level: 1, color: 'dim' });
            UI.printWrapped('✅ OK: auditoria do fator concluída com relatório válido.', { level: 2, color: 'green' });
            UI.printWrapped('❌ FAIL: erro de execução, timeout, runtimeError ou score inválido.', { level: 2, color: 'red' });
            UI.printWrapped('⏱️ Inclui tempos por etapa e média histórica por fator.', { level: 2, color: 'dim' });
            console.log('');
            const planTasks = [
                { name: 'Server startup' },
                { name: 'Warm-up' },
                { name: `Mobile audit (${targetScope})`, avg: History.getAverageDuration(`${historyBase}-mobile`, modeLabel) },
                { name: `Desktop audit (${targetScope})`, avg: History.getAverageDuration(`${historyBase}-desktop`, modeLabel) },
            ];
            UI.printPlan(planTasks);
        }
    }

    // Ensure output dir
    if (!fs.existsSync(CONFIG.outputDir)) fs.mkdirSync(CONFIG.outputDir, { recursive: true });

    const totalSteps = 4;
    let stepCounter = 0;
    const beginStep = (name) => {
        stepCounter += 1;
        const step = { name, index: stepCounter, start: Date.now() };
        if (!isSilent && !isQuiet) {
            UI.printScriptStart(name, step.index, totalSteps);
        } else if (isQuiet) {
            UI.printQuietStepStart(name, step.index, totalSteps);
        }
        return step;
    };
    const finishStep = (step, success, avgDuration) => {
        const durationMs = Date.now() - step.start;
        if (!isSilent && !isQuiet) {
            UI.printScriptEnd(step.name, durationMs, avgDuration, success);
        } else if (isQuiet) {
            UI.printQuietStepEnd(step.name, step.index, totalSteps, durationMs, avgDuration, success);
        }
    };

    let serverProcess = null;
    const projectRoot = path.resolve(__dirname, '../../');
    const basePath = resolveBasePath(projectRoot);

    const port = await findAvailablePort(CONFIG.port, 5);
    const baseUrl = `http://${CONFIG.host}:${port}`;

    if (port !== CONFIG.port) {
        log(`Porta ${CONFIG.port} em uso. Usando ${port}.`, 'warn');
    }

    const serverLogs = {
        stdout: createLogBuffer(),
        stderr: createLogBuffer(),
    };
    const serverStep = beginStep('server startup');
    serverProcess = startServer(port, serverLogs);

    log('Aguardando servidor...', 'wait');
    const serverReady = await waitForServer(baseUrl, serverProcess);

    if (!serverReady.ready) {
        const reason =
            serverReady.reason === 'exit'
                ? `Servidor encerrou (code ${serverReady.code ?? 'n/a'})`
                : serverReady.reason === 'spawn'
                    ? `Falha ao iniciar servidor: ${serverReady.error?.message || serverReady.error}`
                    : 'Timeout: Servidor nao respondeu.';
        log(reason, 'error');
        if (!isSilent) {
            const out = serverLogs.stdout.toString();
            const err = serverLogs.stderr.toString();
            if (out) {
                console.log(UI.warning('Últimas linhas (stdout):'));
                console.log(c.dim + out + c.reset);
            }
            if (err) {
                console.log(UI.warning('Últimas linhas (stderr):'));
                console.log(c.dim + err + c.reset);
            }
        }
        finishStep(serverStep, false, null);
        if (serverProcess) await stopServer(serverProcess);
        process.exit(1);
    }

    log('Servidor pronto!', 'success');
    History.saveExecutionTime(`${historyBase}-server`, Date.now() - serverStep.start, modeLabel);
    finishStep(serverStep, true, null);

    const results = [];
    const resolvedBaseUrl = await resolveTargetUrl(baseUrl, basePath, isSilent);
    const targetUrl = applyTarget(resolvedBaseUrl, targetScope);
    if (!isSilent && basePath !== '/') {
        UI.printWrapped(`Base path detectado: ${basePath}`, { level: 1, color: 'blue' });
    }
    if (!isSilent && resolvedBaseUrl !== joinUrl(baseUrl, basePath)) {
        UI.printWrapped(`URL base ajustada: ${resolvedBaseUrl}`, { level: 1, color: 'blue' });
    }
    if (!isSilent) {
        UI.printWrapped(`Target: ${targetScope}`, { level: 1, color: 'blue' });
        UI.printWrapped(`URL alvo: ${targetUrl}`, { level: 1, color: 'blue' });
    }
    if (!isSilent) {
        const chromePath = resolveChromePath();
        UI.printWrapped(`Chrome: ${chromePath || 'auto'}`, { level: 1, color: 'blue' });
    }
    if (!isSilent) {
        UI.printWrapped(`Throttling: mobile=${mobileThrottling} | desktop=${desktopThrottling}`, { level: 1, color: 'blue' });
        UI.printWrapped(`Headless: ${headlessMode}`, { level: 1, color: 'blue' });
        console.log('');
    }

    // Warm-up request to reduce first-load flakiness
    const warmupStep = beginStep('warm-up');
    await getHttpStatus(resolvedBaseUrl);
    History.saveExecutionTime(`${historyBase}-warmup`, Date.now() - warmupStep.start, modeLabel);
    finishStep(warmupStep, true, null);

    for (const factor of ['mobile', 'desktop']) {
        const auditStep = beginStep(`${factor} audit`);
        const res = await runLighthouse(targetUrl, factor, targetScope);
        results.push({ factor, ...res });

        if (res.success) {
            History.saveExecutionTime(`${historyBase}-${factor}`, res.duration, modeLabel);
            const avg = History.getAverageDuration(`${historyBase}-${factor}`, modeLabel);
            results[results.length - 1].avg = avg;
            const avgLabel = avg ? ` (avg ${avg})` : '';
            if (!isQuiet) {
                log(`${factor.toUpperCase()}: Perf ${res.scores.performance} | A11y ${res.scores.accessibility}${avgLabel}`, 'success');
            }
            finishStep(auditStep, true, avg);
        } else {
            History.saveExecutionTime(`${historyBase}-${factor}`, res.duration, modeLabel);
            const avg = History.getAverageDuration(`${historyBase}-${factor}`, modeLabel);
            results[results.length - 1].avg = avg;
            const avgLabel = avg ? ` (avg ${avg})` : '';
            log(`${factor.toUpperCase()}: Falhou - ${res.error}${avgLabel}`, 'error');
            finishStep(auditStep, false, avg);
        }

        if (!isSilent && !isQuiet) {
            const okCount = results.filter((item) => item.success).length;
            const failCount = results.length - okCount;
            console.log(UI.info(`Parcial Lighthouse: ${okCount} OK | ${failCount} FAIL`));
        }
    }

    // Cleanup
    if (serverProcess) {
        log('Encerrando servidor temporario...', 'info');
        await stopServer(serverProcess);
    }

    const successCount = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success);
    const metrics = results
        .filter(r => r.success)
        .map(r => `${targetScope.toUpperCase()} ${r.factor.toUpperCase()}: Perf ${r.scores.performance} | A11y ${r.scores.accessibility}`);
    const errors = failed.map(r => `${targetScope.toUpperCase()} ${r.factor.toUpperCase()}: ${r.error}`);
    const timings = results.map(r => {
        const durationSec = ((r.duration || 0) / 1000).toFixed(2);
        const avgText = r.avg ? ` (avg ${r.avg})` : '';
        return `${r.factor.toUpperCase()}: ${durationSec}s${avgText}`;
    });
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    if (isSilent || !isQuiet) {
        UI.printSummary({
            title: 'LIGHTHOUSE',
            status: failed.length === 0 ? 'pass' : 'fail',
            metrics,
            timings,
            errors,
            duration,
            reportDir: CONFIG.outputDir,
            maxItems: 8,
        });
    }

    History.saveExecutionTime(historyBase, Date.now() - startTime, modeLabel);
    if (stopTimer) stopTimer();
    await refreshDashboardCache({ silent: isSilent || isQuiet });
    if (successCount < results.length) process.exit(1);
    process.exit(0);
}

main();
