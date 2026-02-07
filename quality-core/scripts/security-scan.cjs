/**
 * security-scan.cjs - Verificação de Segurança
 * 
 * Detecta exposição de:
 * - API keys (Google, GitHub, AWS, etc.)
 * - Tokens e secrets
 * - Credenciais hardcoded
 * - URLs sensíveis
 * 
 * Deve ser executado como parte do quality gate.
 * 
 * Flags:
 * - --repo-wide / --repo / --full: inclui tests e arquivos normalmente ignorados
 */

const fs = require('fs');
const path = require('path');
const UI = require('../cli/ui-helpers.cjs');
const History = require('../cli/history.cjs');
const { refreshDashboardCache } = require('../cli/dashboard-cache.cjs');
const args = process.argv.slice(2);
const isSilent = args.includes('--silent') || args.includes('-s');
const isQuiet = args.includes('--quiet') || args.includes('-q');
const isRepoWide = args.includes('--repo-wide') || args.includes('--repo') || args.includes('--full');
const log = UI.createLogger({ tag: 'SECURITY', silent: isSilent, quiet: isQuiet });

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const BASE_CONFIG = {
    // Diretórios para escanear
    scanDirs: [
        'src',
        'services',
        'components',
        'pages',
        'website',
        'quality-core',
    ],

    // Extensões para verificar
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.cjs', '.mjs', '.json', '.env', '.html'],

    // Diretórios para ignorar
    ignoreDirs: ['node_modules', '.git', 'dist', 'build', 'coverage', '_dev', '.vite'],

    // Arquivos para ignorar (padrao)
    ignoreFiles: ['package-lock.json', 'yarn.lock', 'security-scan.core.test.ts', 'security-scan.core.test.tsx'],

    // Padrões de secrets (regex)
    secretPatterns: [
        // API Keys
        { name: 'Google API Key', pattern: /AIzaSy[0-9A-Za-z_-]{33}/g, severity: 'high' },
        { name: 'GitHub Token', pattern: /ghp_[0-9a-zA-Z]{36}/g, severity: 'critical' },
        { name: 'GitHub OAuth', pattern: /gho_[0-9a-zA-Z]{36}/g, severity: 'critical' },
        { name: 'AWS Access Key', pattern: /AKIA[0-9A-Z]{16}/g, severity: 'critical' },
        { name: 'AWS Secret Key', pattern: /[0-9a-zA-Z/+]{40}/g, severity: 'medium' },

        // Tokens genéricos
        { name: 'Bearer Token', pattern: /Bearer\s+[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, severity: 'high' },
        { name: 'JWT Token', pattern: /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, severity: 'high' },

        // Private Keys
        { name: 'RSA Private Key', pattern: /-----BEGIN RSA PRIVATE KEY-----/g, severity: 'critical' },
        { name: 'Private Key', pattern: /-----BEGIN PRIVATE KEY-----/g, severity: 'critical' },
        { name: 'EC Private Key', pattern: /-----BEGIN EC PRIVATE KEY-----/g, severity: 'critical' },

        // Credentials
        { name: 'Password in URL', pattern: /:\/\/[^:]+:[^@]+@/g, severity: 'high' },
        { name: 'Hardcoded Password', pattern: /password\s*[=:]\s*['"][^'"]{4,}['"]/gi, severity: 'medium' },
        { name: 'API Secret', pattern: /api[_-]?secret\s*[=:]\s*['"][^'"]+['"]/gi, severity: 'high' },

        // Database
        { name: 'MongoDB URI', pattern: /mongodb(\+srv)?:\/\/[^:]+:[^@]+@/g, severity: 'critical' },
        { name: 'PostgreSQL URI', pattern: /postgres(ql)?:\/\/[^:]+:[^@]+@/g, severity: 'critical' },

        // Slack/Discord
        { name: 'Slack Token', pattern: /xox[baprs]-[0-9]{10,13}-[0-9]{10,13}[a-zA-Z0-9-]*/g, severity: 'high' },
        { name: 'Discord Token', pattern: /[MN][A-Za-z\d]{23,}\.[\w-]{6}\.[\w-]{27}/g, severity: 'high' },

        // Generic secrets
        { name: 'Generic Secret', pattern: /['"](sk|pk)_(live|test)_[0-9a-zA-Z]{24,}['"]/g, severity: 'high' },
    ],

    // Padrões seguros (falsos positivos para ignorar)
    safePatterns: [
        /placeholder/i,
        /example/i,
        /your[_-]?api[_-]?key/i,
        /xxx+/i,
        /\*{3,}/,
        /process\.env\./,
        /import\.meta\.env\./,
        /getSettings\(\)/,
        /localStorage/,
        // Regras do próprio script de scan
        /pattern:\s*\/.*\/g,/,
        // URLs seguras sem credenciais
        /https?:\/\/(?!.*:.*@)[^'"\s]+/,
        // Caminhos locais do bundler (evita falso positivo em file://)
        /file:\/\/\//,
        // Protocolo customizado do terminal
        /terminal:\/\/rss-stream/,
        // Script tags de CDNs comuns
        /<script src=["']https:\/\/cdn\..*["']><\/script>/,
        /<script src=["']https:\/\/cdnjs\..*["']><\/script>/,
    ]
};

function buildConfig(options = {}) {
    const { repoWide = false } = options;
    const ignoreFiles = repoWide
        ? BASE_CONFIG.ignoreFiles.filter(name => !name.startsWith('security-scan.core.test.'))
        : BASE_CONFIG.ignoreFiles.slice();
    return {
        ...BASE_CONFIG,
        ignoreFiles,
        repoWide,
    };
}

const CONFIG = buildConfig({ repoWide: isRepoWide });

// ============================================================================
// FUNÇÕES
// ============================================================================

function getAllFiles(dir, files = []) {
    if (!fs.existsSync(dir)) return files;

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            if (!CONFIG.ignoreDirs.includes(entry.name)) {
                getAllFiles(fullPath, files);
            }
        } else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();
            if (entry.name.includes('.timestamp-')) continue;
            if (CONFIG.extensions.includes(ext) && !CONFIG.ignoreFiles.includes(entry.name)) {
                files.push(fullPath);
            }
        }
    }

    return files;
}

function isSafeMatch(line, match) {
    // Verifica se é um falso positivo
    for (const pattern of CONFIG.safePatterns) {
        if (pattern.test(line)) return true;
    }

    // Verifica se está em comentário
    if (line.trim().startsWith('//') || line.trim().startsWith('*') || line.trim().startsWith('#')) {
        return true;
    }

    return false;
}

function scanFile(filePath) {
    const findings = [];
    let content;

    try {
        content = fs.readFileSync(filePath, 'utf-8');
    } catch (err) {
        return findings;
    }

    const lines = content.split('\n');

    for (const { name, pattern, severity } of CONFIG.secretPatterns) {
        // Reset regex lastIndex
        pattern.lastIndex = 0;

        let match;
        while ((match = pattern.exec(content)) !== null) {
            // Encontrar linha
            let pos = 0;
            let lineNumber = 1;
            for (const line of lines) {
                if (pos + line.length >= match.index) {
                    // Verificar se é falso positivo
                    if (!isSafeMatch(line, match[0])) {
                        findings.push({
                            file: filePath,
                            line: lineNumber,
                            type: name,
                            severity,
                            preview: line.trim().substring(0, 80) + (line.length > 80 ? '...' : ''),
                            match: match[0].substring(0, 20) + '...'
                        });
                    }
                    break;
                }
                pos += line.length + 1;
                lineNumber++;
            }
        }
    }

    return findings;
}

function checkEnvFiles() {
    const findings = [];
    const envFiles = ['.env', '.env.local', '.env.production', '.env.development'];

    for (const envFile of envFiles) {
        const envPath = path.join(process.cwd(), envFile);
        if (fs.existsSync(envPath)) {
            // Verificar se está no .gitignore
            const gitignorePath = path.join(process.cwd(), '.gitignore');
            let isIgnored = false;

            if (fs.existsSync(gitignorePath)) {
                const gitignore = fs.readFileSync(gitignorePath, 'utf-8');
                isIgnored = gitignore.includes(envFile) || gitignore.includes('.env');
            }

            if (!isIgnored) {
                findings.push({
                    file: envFile,
                    line: 0,
                    type: 'Env file not in .gitignore',
                    severity: 'critical',
                    preview: `${envFile} exists but may not be ignored by git`,
                    match: envFile
                });
            }
        }
    }

    return findings;
}

function generateReport(findings, options = {}) {
    const { silent = false, quiet = false } = options;
    const critical = findings.filter(f => f.severity === 'critical');
    const high = findings.filter(f => f.severity === 'high');
    const medium = findings.filter(f => f.severity === 'medium');

    if (silent || quiet) {
        return {
            total: findings.length,
            critical: critical.length,
            high: high.length,
            medium: medium.length,
            passed: critical.length === 0,
        };
    }

    log.raw('\n╔══════════════════════════════════════════════════════════════╗');
    log.raw('║              🔒 SECURITY SCAN RESULTS                        ║');
    log.raw('╚══════════════════════════════════════════════════════════════╝\n');

    if (findings.length === 0) {
        log.success('No security issues detected!\n');
        return {
            total: 0,
            critical: 0,
            high: 0,
            medium: 0,
            passed: true,
        };
    }

    log.info(`Found ${findings.length} potential issue(s):\n`);
    log.info(`  🔴 Critical: ${critical.length}`);
    log.info(`  🟠 High:     ${high.length}`);
    log.info(`  🟡 Medium:   ${medium.length}\n`);

    if (critical.length > 0) {
        log.raw('━━━ CRITICAL ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        for (const f of critical) {
            log.raw(`\n  📁 ${f.file}:${f.line}`);
            log.raw(`  ⚠️  ${f.type}`);
            log.raw(`  📝 ${f.preview}`);
        }
        log.raw('');
    }

    if (high.length > 0) {
        log.raw('━━━ HIGH ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        for (const f of high) {
            log.raw(`\n  📁 ${f.file}:${f.line}`);
            log.raw(`  ⚠️  ${f.type}`);
            log.raw(`  📝 ${f.preview}`);
        }
        log.raw('');
    }

    if (medium.length > 0) {
        log.raw('━━━ MEDIUM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        for (const f of medium) {
            log.raw(`\n  📁 ${f.file}:${f.line}`);
            log.raw(`  ⚠️  ${f.type}`);
        }
        log.raw('');
    }

    // Fail on critical
    return {
        total: findings.length,
        critical: critical.length,
        high: high.length,
        medium: medium.length,
        passed: critical.length === 0,
    };
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
    const startTime = Date.now();
    let stopTimer = null;
    const modeLabel = [
        isSilent ? 'silent' : isQuiet ? 'quiet' : 'default',
    ].join('-');
    if (!isSilent) {
        UI.printHeader({
            title: 'QUALITY CORE - SECURITY SCAN',
            modes: ['--silent', '--quiet'],
            active: [
                isSilent ? 'silent' : null,
                isQuiet ? 'quiet' : null,
            ].filter(Boolean),
        });
        const avgHeader = History.getAverageDuration('security-scan', modeLabel);
        stopTimer = UI.printTimingHeader({
            avgLabel: avgHeader,
            modeLabel,
            live: UI.shouldLiveTimer() && !isQuiet,
        });
    }
    if (!isSilent && !isQuiet) {
        UI.printScriptStart('security scan', 1, 1);
    } else if (isQuiet) {
        UI.printQuietStepStart('security scan', 1, 1);
    }
    log.info('Starting security scan...');
    if (CONFIG.repoWide) {
        log.info('Repo-wide mode enabled (includes tests and normally ignored files).');
    }

    const allFindings = [];

    // Scan env files first
    allFindings.push(...checkEnvFiles());

    // Scan source directories
    for (const dir of CONFIG.scanDirs) {
        const dirPath = path.join(process.cwd(), dir);
        const files = getAllFiles(dirPath);

        for (const file of files) {
            const findings = scanFile(file);
            allFindings.push(...findings);
        }
    }

    const report = generateReport(allFindings, { silent: isSilent, quiet: isQuiet });
    const passed = report.passed;

    const duration = Date.now() - startTime;
    History.saveExecutionTime('security-scan', duration, modeLabel);
    const avg = History.getAverageDuration('security-scan', modeLabel);
    if (!isSilent && !isQuiet) {
        UI.printScriptEnd('security scan', duration, avg, passed);
    } else if (isQuiet) {
        UI.printQuietStepEnd('security scan', 1, 1, duration, avg, passed);
    }
    if (stopTimer) stopTimer();

    if (isSilent || isQuiet) {
        UI.printSummary({
            title: 'SECURITY SCAN',
            status: passed ? 'pass' : 'fail',
            metrics: [
                `Total: ${report.total}`,
                `Critical: ${report.critical}`,
                `High: ${report.high}`,
                `Medium: ${report.medium}`,
            ],
            duration: (duration / 1000).toFixed(2),
            reportDir: path.join(process.cwd(), 'performance-reports', 'reports'),
        });
    }

    try {
        const outDir = path.join(process.cwd(), 'performance-reports', 'security');
        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
        const MAX_FINDINGS = 200;
        const trimmedFindings = allFindings.slice(0, MAX_FINDINGS).map((finding, index) => ({
            id: `${index}-${finding.severity}-${finding.line}`,
            file: (path.isAbsolute(finding.file)
                ? path.relative(process.cwd(), finding.file)
                : finding.file).replace(/\\/g, '/'),
            line: finding.line,
            type: finding.type,
            severity: finding.severity,
            preview: finding.preview,
        }));
        const payload = {
            timestamp: new Date().toISOString(),
            total: report.total,
            critical: report.critical,
            high: report.high,
            medium: report.medium,
            passed: report.passed,
            findings: trimmedFindings,
            findingsTruncated: allFindings.length > trimmedFindings.length,
            findingsTotal: allFindings.length,
        };
        const filename = `security-${Date.now()}.json`;
        fs.writeFileSync(path.join(outDir, filename), JSON.stringify(payload, null, 2));
        fs.writeFileSync(path.join(outDir, 'security-latest.json'), JSON.stringify(payload, null, 2));
    } catch (err) {
        log.warn(`Nao foi possivel salvar relatorio de segurança: ${err.message}`);
    }

    refreshDashboardCache({ silent: isSilent || isQuiet });

    // Return result for integration
    return {
        success: passed,
        findings: report.total,
        critical: report.critical,
        high: report.high,
        medium: report.medium,
    };
}

// Run if called directly
if (require.main === module) {
    const result = main();
    process.exit(result.success ? 0 : 1);
}

module.exports = { main, scanFile, checkEnvFiles, buildConfig };
