/**
 * Quality Gate - Orquestrador Principal
 * 
 * Executa verificacoes de qualidade antes de commit/push
 * 
 * Uso:
 *   node scripts/quality-gate/run.cjs          # Todas as verificacoes
 *   node scripts/quality-gate/run.cjs --quick  # Modo rapido (pula build)
 * 
 * Exit codes:
 *   0 = Aprovado
 *   1 = Falhou
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const config = require('./config.cjs');

// ANSI Colors
const c = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
};

// Estado global
const results = [];
let startTime;

// Helpers
function log(msg, type = 'info') {
    const icons = { info: 'ℹ️ ', success: '✅', error: '❌', warn: '⚠️ ', header: '🚀', check: '🔍' };
    const colors = { info: c.cyan, success: c.green, error: c.red, warn: c.yellow, header: c.magenta + c.bold, check: c.blue };
    console.log(`${colors[type] || c.reset}${icons[type] || ''} ${msg}${c.reset}`);
}

function hr() {
    console.log(`${c.dim}${'─'.repeat(50)}${c.reset}`);
}

function formatDuration(ms) {
    return (ms / 1000).toFixed(2) + 's';
}

function getTimestamp() {
    const now = new Date();
    const p = n => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}_${p(now.getHours())}-${p(now.getMinutes())}`;
}

// Executa comando e retorna resultado
function runCommand(command, args = [], options = {}) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        let output = '';
        let error = '';

        const child = spawn(command, args, {
            cwd: config.paths.root,
            shell: true,
            stdio: ['ignore', 'pipe', 'pipe'],
            ...options,
        });

        child.stdout?.on('data', (data) => {
            output += data.toString();
            if (options.stream) process.stdout.write(data);
        });

        child.stderr?.on('data', (data) => {
            error += data.toString();
            if (options.stream) process.stderr.write(data);
        });

        child.on('error', (err) => {
            resolve({
                success: false,
                duration: Date.now() - startTime,
                output,
                error: err.message,
            });
        });

        child.on('close', (code) => {
            resolve({
                success: code === 0,
                exitCode: code,
                duration: Date.now() - startTime,
                output,
                error,
            });
        });
    });
}

// Modulos de verificacao
async function checkIntegrity() {
    const issues = [];

    // Verificar pastas obrigatorias
    for (const dir of config.requiredDirs) {
        const fullPath = path.join(config.paths.root, dir);
        if (!fs.existsSync(fullPath)) {
            issues.push(`Pasta faltando: ${dir}`);
        }
    }

    // Verificar arquivos obrigatorios
    for (const file of config.requiredFiles) {
        const fullPath = path.join(config.paths.root, file);
        if (!fs.existsSync(fullPath)) {
            issues.push(`Arquivo faltando: ${file}`);
        }
    }

    return {
        name: 'Integridade',
        success: issues.length === 0,
        issues,
        message: issues.length === 0 ? 'Estrutura OK' : `${issues.length} problema(s)`,
    };
}

async function checkI18n() {
    // Executar script de auditoria i18n se existir
    const i18nScript = path.join(config.paths.root, 'scripts', 'i18n-audit.cjs');

    if (!fs.existsSync(i18nScript)) {
        return {
            name: 'i18n',
            success: true,
            skipped: true,
            message: 'Script nao encontrado (skipped)',
        };
    }

    const result = await runCommand('node', ['scripts/i18n-audit.cjs']);

    // Extrair resumo do output
    const match = result.output.match(/Total de problemas: (\d+)/);
    const problemCount = match ? parseInt(match[1]) : 0;

    return {
        name: 'i18n',
        success: true, // i18n sempre passa, mas reporta warnings
        warning: problemCount > 0,
        issues: problemCount > 0 ? [`${problemCount} problemas de i18n`] : [],
        message: problemCount === 0 ? 'OK' : `${problemCount} problemas`,
    };
}

async function checkSecurity() {
    const result = await runCommand('npm', ['audit', '--audit-level=high']);

    const hasHighVuln = result.output.includes('high') || result.output.includes('critical');

    return {
        name: 'Seguranca',
        success: !hasHighVuln,
        warning: result.exitCode !== 0 && !hasHighVuln,
        message: hasHighVuln ? 'Vulnerabilidades criticas' : (result.exitCode !== 0 ? 'Vulnerabilidades low/moderate' : 'OK'),
    };
}

async function checkLint() {
    const result = await runCommand('npm', ['run', 'lint']);

    // Contar warnings e errors no output
    const errorMatch = result.output.match(/(\d+)\s+error/);
    const warnMatch = result.output.match(/(\d+)\s+warning/);

    const errors = errorMatch ? parseInt(errorMatch[1]) : 0;
    const warnings = warnMatch ? parseInt(warnMatch[1]) : 0;

    return {
        name: 'Lint',
        success: errors === 0,
        warning: warnings > 0,
        issues: errors > 0 ? [`${errors} erro(s), ${warnings} aviso(s)`] : [],
        message: errors === 0 ? (warnings > 0 ? `${warnings} avisos` : 'OK') : `${errors} erros`,
    };
}

async function checkBuild() {
    log('Executando build...', 'check');
    const result = await runCommand('npm', ['run', 'build'], { stream: false });

    return {
        name: 'Build',
        success: result.success,
        duration: result.duration,
        message: result.success ? 'OK' : 'Falhou',
        error: result.success ? null : result.error.slice(0, 500),
    };
}

async function checkPerformance() {
    const lighthouseDir = config.paths.lighthouse;

    if (!fs.existsSync(lighthouseDir)) {
        return {
            name: 'Performance',
            success: true,
            skipped: true,
            message: 'Sem reports (skipped)',
        };
    }

    // Encontrar ultimo report JSON
    const files = fs.readdirSync(lighthouseDir)
        .filter(f => f.endsWith('.json'))
        .sort()
        .reverse();

    if (files.length === 0) {
        return {
            name: 'Performance',
            success: true,
            skipped: true,
            message: 'Sem reports JSON',
        };
    }

    try {
        const latestReport = JSON.parse(fs.readFileSync(path.join(lighthouseDir, files[0]), 'utf8'));

        // Extrair scores
        const categories = latestReport.categories || {};
        const scores = {
            performance: Math.round((categories.performance?.score || 0) * 100),
            accessibility: Math.round((categories.accessibility?.score || 0) * 100),
            bestPractices: Math.round((categories['best-practices']?.score || 0) * 100),
            seo: Math.round((categories.seo?.score || 0) * 100),
        };

        const passed = scores.performance >= 70;

        return {
            name: 'Performance',
            success: passed,
            warning: scores.performance >= 50 && scores.performance < 70,
            message: `Perf: ${scores.performance}%, A11y: ${scores.accessibility}%`,
            scores,
            reportFile: files[0],
        };
    } catch (err) {
        return {
            name: 'Performance',
            success: true,
            warning: true,
            message: `Erro ao ler report: ${err.message}`,
        };
    }
}

// Gera relatorio Markdown
function generateReport() {
    const totalDuration = Date.now() - startTime;
    const failed = results.filter(r => !r.success && !r.skipped);
    const warnings = results.filter(r => r.warning);
    const passed = results.filter(r => r.success && !r.skipped);

    let status = 'OK';
    if (failed.length > 0) status = 'FAIL';
    else if (warnings.length > 0) status = 'WARN';

    let md = `# Quality Gate Report\n\n`;
    md += `**Data:** ${new Date().toLocaleString('pt-BR')}\n`;
    md += `**Status:** ${status === 'OK' ? '✅ Aprovado' : (status === 'WARN' ? '⚠️ Avisos' : '❌ Reprovado')}\n`;
    md += `**Duracao:** ${formatDuration(totalDuration)}\n\n`;

    md += `## Resumo\n\n`;
    md += `| Verificacao | Status | Detalhes |\n`;
    md += `|-------------|--------|----------|\n`;

    for (const r of results) {
        const icon = r.skipped ? '⏭️' : (r.success ? (r.warning ? '⚠️' : '✅') : '❌');
        md += `| ${r.name} | ${icon} | ${r.message} |\n`;
    }

    if (failed.length > 0) {
        md += `\n## Falhas\n\n`;
        for (const r of failed) {
            md += `### ${r.name}\n`;
            if (r.issues) {
                for (const issue of r.issues) {
                    md += `- ${issue}\n`;
                }
            }
            if (r.error) {
                md += `\`\`\`\n${r.error}\n\`\`\`\n`;
            }
            md += `\n`;
        }
    }

    md += `\n---\n*Gerado pelo Quality Gate*\n`;

    return md;
}

// Main
async function main() {
    const args = process.argv.slice(2);
    const isQuick = args.includes('--quick') || args.includes('-q');

    console.clear();
    console.log(`${c.cyan}${c.bold}
╔═════════════════════════════════════════════╗
║           QUALITY GATE                      ║
║   Sistema de Verificacao Pre-Commit         ║
╚═════════════════════════════════════════════╝${c.reset}`);

    if (isQuick) {
        log('Modo rapido: Build sera pulado', 'warn');
    }

    startTime = Date.now();
    hr();

    // Executar verificacoes
    log('Verificando integridade...', 'check');
    results.push(await checkIntegrity());

    log('Verificando i18n...', 'check');
    results.push(await checkI18n());

    log('Verificando seguranca...', 'check');
    results.push(await checkSecurity());

    log('Verificando lint...', 'check');
    results.push(await checkLint());

    if (!isQuick) {
        results.push(await checkBuild());
    } else {
        results.push({ name: 'Build', success: true, skipped: true, message: 'Pulado (modo rapido)' });
    }

    log('Verificando performance...', 'check');
    results.push(await checkPerformance());

    hr();

    // Resumo
    const failed = results.filter(r => !r.success && !r.skipped);
    const warnings = results.filter(r => r.warning);
    const totalDuration = Date.now() - startTime;

    console.log(`\n${c.bold}RESULTADOS:${c.reset}\n`);

    for (const r of results) {
        const icon = r.skipped ? '⏭️' : (r.success ? (r.warning ? '⚠️' : '✅') : '❌');
        const color = r.skipped ? c.dim : (r.success ? (r.warning ? c.yellow : c.green) : c.red);
        console.log(`${color}${icon} ${r.name}: ${r.message}${c.reset}`);
    }

    hr();

    // Status final
    const overallSuccess = failed.length === 0;
    const statusMsg = overallSuccess
        ? (warnings.length > 0 ? 'APROVADO COM AVISOS' : 'APROVADO')
        : 'REPROVADO';
    const statusColor = overallSuccess ? (warnings.length > 0 ? c.yellow : c.green) : c.red;

    console.log(`\n${statusColor}${c.bold}${statusMsg}${c.reset}`);
    console.log(`${c.dim}Duracao total: ${formatDuration(totalDuration)}${c.reset}\n`);

    // Salvar relatorio
    const logsDir = config.paths.logs;
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
    }

    const reportName = `Quality-Gate_${overallSuccess ? 'OK' : 'FAIL'}_${getTimestamp()}.md`;
    const reportPath = path.join(logsDir, reportName);
    fs.writeFileSync(reportPath, generateReport(), 'utf8');
    log(`Relatorio salvo: ${reportPath}`, 'info');

    process.exit(overallSuccess ? 0 : 1);
}

main().catch(err => {
    console.error(`${c.red}Erro fatal: ${err.message}${c.reset}`);
    process.exit(1);
});
