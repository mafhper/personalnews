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
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const CONFIG = {
    // Diretórios para escanear
    scanDirs: ['src', 'scripts', 'services', 'components', 'pages', 'website'],

    // Extensões para verificar
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.cjs', '.mjs', '.json', '.env', '.html'],

    // Diretórios para ignorar
    ignoreDirs: ['node_modules', '.git', 'dist', 'build', 'coverage', '_dev'],

    // Arquivos para ignorar
    ignoreFiles: ['package-lock.json', 'yarn.lock'],

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
        // Protocolo customizado do terminal
        /terminal:\/\/rss-stream/,
        // Script tags de CDNs comuns
        /<script src=["']https:\/\/cdn\..*["']><\/script>/,
        /<script src=["']https:\/\/cdnjs\..*["']><\/script>/,
    ]
};

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

function generateReport(findings) {
    const critical = findings.filter(f => f.severity === 'critical');
    const high = findings.filter(f => f.severity === 'high');
    const medium = findings.filter(f => f.severity === 'medium');

    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║              🔒 SECURITY SCAN RESULTS                        ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    if (findings.length === 0) {
        console.log('✅ No security issues detected!\n');
        return true;
    }

    console.log(`Found ${findings.length} potential issue(s):\n`);
    console.log(`  🔴 Critical: ${critical.length}`);
    console.log(`  🟠 High:     ${high.length}`);
    console.log(`  🟡 Medium:   ${medium.length}\n`);

    if (critical.length > 0) {
        console.log('━━━ CRITICAL ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        for (const f of critical) {
            console.log(`\n  📁 ${f.file}:${f.line}`);
            console.log(`  ⚠️  ${f.type}`);
            console.log(`  📝 ${f.preview}`);
        }
        console.log('');
    }

    if (high.length > 0) {
        console.log('━━━ HIGH ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        for (const f of high) {
            console.log(`\n  📁 ${f.file}:${f.line}`);
            console.log(`  ⚠️  ${f.type}`);
            console.log(`  📝 ${f.preview}`);
        }
        console.log('');
    }

    if (medium.length > 0) {
        console.log('━━━ MEDIUM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        for (const f of medium) {
            console.log(`\n  📁 ${f.file}:${f.line}`);
            console.log(`  ⚠️  ${f.type}`);
        }
        console.log('');
    }

    // Fail on critical
    return critical.length === 0;
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
    console.log('🔍 Starting security scan...\n');

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

    const passed = generateReport(allFindings);

    // Return result for integration
    return {
        success: passed,
        findings: allFindings.length,
        critical: allFindings.filter(f => f.severity === 'critical').length,
        high: allFindings.filter(f => f.severity === 'high').length,
        medium: allFindings.filter(f => f.severity === 'medium').length,
    };
}

// Run if called directly
if (require.main === module) {
    const result = main();
    process.exit(result.success ? 0 : 1);
}

module.exports = { main, scanFile, checkEnvFiles };
