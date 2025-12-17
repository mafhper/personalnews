/**
 * Performance Test - Lighthouse CLI Runner (Autonomo)
 * 
 * 1. Inicia servidor de desenvolvimento se necessario
 * 2. Executa Lighthouse para Mobile e Desktop
 * 3. Salva reports JSON
 * 4. Encerra servidor se foi iniciado pelo script
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

// Configuracao
const CONFIG = {
    port: 5173,
    getUrl: () => `http://localhost:${CONFIG.port}`,
    outputDir: path.resolve(__dirname, '../../performance-reports/lighthouse'),
    categories: ['performance', 'accessibility', 'best-practices', 'seo'],
    maxWaitTime: 60000, // 60s timeout para iniciar server
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

// Aguarda URL ficar disponivel
async function waitForServer(url) {
    const start = Date.now();
    while (Date.now() - start < CONFIG.maxWaitTime) {
        try {
            await new Promise((resolve, reject) => {
                http.get(url, (res) => {
                    if ((res.statusCode >= 200 && res.statusCode < 300) || res.statusCode === 404) resolve();
                    else reject();
                }).on('error', reject);
            });
            return true;
        } catch {
            await new Promise(r => setTimeout(r, 1000));
            process.stdout.write('.');
        }
    }
    return false;
}

// Inicia servidor
function startServer() {
    log(`Iniciando servidor na porta ${CONFIG.port}...`, 'wait');
    // Usar npm run dev com host explicito para evitar abrir browser ou mudar porta silenciosamente
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const child = spawn(npmCmd, ['run', 'dev', '--', '--port', String(CONFIG.port), '--strictPort'], {
        cwd: path.resolve(__dirname, '../../'),
        stdio: 'ignore', // nao poluir output
        shell: true,
        detached: false,
    });
    return child;
}

// Executa Lighthouse
function runLighthouse(url, formFactor) {
    return new Promise((resolve) => {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `lighthouse_${formFactor}_${timestamp}.json`;
        const outputPath = path.join(CONFIG.outputDir, filename);

        console.log(`\n${c.cyan}🔦 Executando Lighthouse (${formFactor})...${c.reset}`);

        const args = [
            url,
            '--output=json',
            `--output-path=${outputPath}`,
            `--form-factor=${formFactor}`,
            '--chrome-flags="--headless --no-sandbox"',
            '--only-categories=' + CONFIG.categories.join(','),
            '--quiet',
        ];

        if (formFactor === 'mobile') {
            args.push('--preset=perf');
        } else {
            args.push('--screenEmulation.disabled');
            args.push('--throttling.cpuSlowdownMultiplier=1');
        }

        let stderr = '';
        const child = spawn(/^win/.test(process.platform) ? 'lighthouse.cmd' : 'lighthouse', args, {
            shell: true,
            stdio: ['ignore', 'ignore', 'pipe'], // Capture stderr
        });

        // Progress animation
        const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        let i = 0;
        const spinner = setInterval(() => {
            process.stdout.write(`\r   ${frames[i++ % frames.length]} Analisando...`);
        }, 100);

        child.stderr?.on('data', (data) => {
            stderr += data.toString();
        });

        child.on('close', (code) => {
            clearInterval(spinner);
            process.stdout.write('\r                    \r'); // Clear line

            if (code === 0 && fs.existsSync(outputPath)) {
                try {
                    const report = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
                    const scores = CONFIG.categories.reduce((acc, cat) => {
                        acc[cat] = Math.round((report.categories[cat]?.score || 0) * 100);
                        return acc;
                    }, {});
                    resolve({ success: true, path: outputPath, scores });
                } catch (e) {
                    resolve({ success: false, error: 'JSON invalido: ' + e.message });
                }
            } else {
                // Extract error from stderr
                let errorMsg = 'Processo falhou (code: ' + code + ')';
                if (stderr.includes('Chrome')) {
                    errorMsg = 'Chrome nao encontrado ou falhou';
                } else if (stderr.includes('ERR_CONNECTION_REFUSED')) {
                    errorMsg = 'Servidor nao acessivel';
                } else if (stderr.includes('ENOENT')) {
                    errorMsg = 'Lighthouse CLI nao instalado (npm i -g lighthouse)';
                } else if (stderr.length > 0) {
                    // Get last meaningful line
                    const lines = stderr.split('\n').filter(l => l.trim());
                    errorMsg = lines[lines.length - 1]?.substring(0, 100) || errorMsg;
                }
                resolve({ success: false, error: errorMsg });
            }
        });

        child.on('error', (err) => {
            clearInterval(spinner);
            resolve({ success: false, error: err.message });
        });
    });
}

async function main() {
    console.log(`${c.bold}🚀 Performance Automation${c.reset}\n`);

    // Ensure output dir
    if (!fs.existsSync(CONFIG.outputDir)) fs.mkdirSync(CONFIG.outputDir, { recursive: true });

    let serverProcess = null;
    const portInUse = await isPortInUse(CONFIG.port);

    if (!portInUse) {
        serverProcess = startServer();
    } else {
        log(`Servidor ja esta rodando na porta ${CONFIG.port}.`, 'info');
    }

    log('Aguardando servidor...', 'wait');
    const serverReady = await waitForServer(CONFIG.getUrl());

    if (!serverReady) {
        log('Timeout: Servidor nao respondeu.', 'error');
        if (serverProcess) serverProcess.kill();
        process.exit(1);
    }

    log('Servidor pronto!', 'success');

    const results = [];
    for (const factor of ['mobile', 'desktop']) {
        const res = await runLighthouse(CONFIG.getUrl(), factor);
        results.push({ factor, ...res });

        if (res.success) {
            log(`${factor.toUpperCase()}: Perf ${res.scores.performance} | A11y ${res.scores.accessibility}`, 'success');
        } else {
            log(`${factor.toUpperCase()}: Falhou - ${res.error}`, 'error');
        }
    }

    // Cleanup
    if (serverProcess) {
        log('Encerrando servidor temporario...', 'info');
        try {
            // Check if process is still alive before killing
            process.kill(serverProcess.pid, 0); // Signal 0 tests if process exists
            process.kill(serverProcess.pid, 'SIGTERM');
            // Give it a moment, then force kill if needed
            await new Promise(r => setTimeout(r, 500));
            try { process.kill(serverProcess.pid, 'SIGKILL'); } catch { /* Already dead */ }
        } catch (err) {
            // ESRCH means process already exited - that's OK
            if (err.code !== 'ESRCH') {
                log(`Aviso ao encerrar servidor: ${err.message}`, 'warn');
            }
        }
    }

    const successCount = results.filter(r => r.success).length;
    if (successCount < results.length) process.exit(1);
    process.exit(0);
}

main();
