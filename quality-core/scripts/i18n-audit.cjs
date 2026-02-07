/**
 * i18n-audit.cjs - Sistema de Auditoria de Internacionalizacao
 * 
 * Verifica:
 * 1. Paridade entre idiomas (chaves faltantes/extras)
 * 2. Strings hardcoded em arquivos JSX/TSX
 * 3. Traducoes vazias ou placeholders
 * 4. Chaves usadas no codigo mas nao definidas
 */

const fs = require('fs');
const path = require('path');
const UI = require('../cli/ui-helpers.cjs');
const History = require('../cli/history.cjs');
const args = process.argv.slice(2);
const isSilent = args.includes('--silent') || args.includes('-s');
const isQuiet = args.includes('--quiet') || args.includes('-q');
const modeLabel = [
    isSilent ? 'silent' : isQuiet ? 'quiet' : 'default',
].join('-');
const isStrict = args.includes('--strict');
const log = UI.createLogger({ tag: 'I18N', silent: isSilent, quiet: isQuiet });

// Configuracao
const CONFIG = {
    componentsDir: path.resolve(__dirname, '../../components'),
    translationsFile: path.resolve(__dirname, '../../constants/translations.ts'),
    baseLocale: 'pt-BR',
    outputFile: path.resolve(__dirname, '../../performance-reports/logs/i18n-audit-report.md'),
};

// Palavras em portugues que indicam string hardcoded
const PT_WORDS = [
    'Voltar', 'Salvar', 'Carregar', 'Cancelar', 'Erro', 'Sucesso',
    'Excluir', 'Editar', 'Adicionar', 'Remover', 'Fechar', 'Abrir',
    'Enviar', 'Confirmar', 'Nenhum', 'Todos', 'Filtrar', 'Buscar',
    'Carregando', 'Aguarde', 'Processando', 'Erro ao', 'Falha',
];

// Palavras em ingles que indicam string hardcoded
const EN_WORDS = [
    'Click here', 'Submit', 'Cancel', 'Delete', 'Edit', 'Add',
    'Remove', 'Close', 'Open', 'Save', 'Loading', 'Error',
    'Success', 'Failed', 'No results', 'All', 'Filter', 'Search',
];

// Regex para detectar texto em JSX
const JSX_TEXT_REGEX = />\s*([A-Za-zÀ-ÿ][^<{]*[A-Za-zÀ-ÿ])\s*</g;

// Regex para detectar uso de t('key')
const T_FUNCTION_REGEX = /\bt\(['"]([^'"]+)['"]\)/g;

/**
 * Extrai traducoes do LanguageContext.tsx
 */
function extractTranslations() {
    const content = fs.readFileSync(CONFIG.translationsFile, 'utf8');
    const locales = {};

    // Regex para encontrar cada bloco de locale
    const localeBlockRegex = /'([a-z]{2}(?:-[A-Z]{2})?)':\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/gs;

    let match;
    while ((match = localeBlockRegex.exec(content)) !== null) {
        const localeName = match[1];
        const localeContent = match[2];

        locales[localeName] = {};

        // Extrair chaves e valores
        const keyValueRegex = /'([^']+)':\s*['"]([^'"]*)['"]/g;
        let kvMatch;
        while ((kvMatch = keyValueRegex.exec(localeContent)) !== null) {
            locales[localeName][kvMatch[1]] = kvMatch[2];
        }
    }

    return locales;
}

/**
 * Verifica paridade entre idiomas
 */
function checkTranslationParity(translations) {
    const issues = [];
    const baseKeys = Object.keys(translations[CONFIG.baseLocale] || {});
    const locales = Object.keys(translations);

    for (const locale of locales) {
        if (locale === CONFIG.baseLocale) continue;

        const localeKeys = Object.keys(translations[locale] || {});

        // Chaves faltantes
        for (const key of baseKeys) {
            if (!localeKeys.includes(key)) {
                issues.push({
                    type: 'MISSING_KEY',
                    locale,
                    key,
                    message: `Chave "${key}" faltando em ${locale}`,
                });
            }
        }

        // Chaves extras (nao existe no base)
        for (const key of localeKeys) {
            if (!baseKeys.includes(key)) {
                issues.push({
                    type: 'EXTRA_KEY',
                    locale,
                    key,
                    message: `Chave "${key}" existe em ${locale} mas nao em ${CONFIG.baseLocale}`,
                });
            }
        }
    }

    // Traducoes vazias (inclui locale base)
    for (const locale of locales) {
        for (const [key, value] of Object.entries(translations[locale] || {})) {
            if (!value || value.trim() === '') {
                issues.push({
                    type: 'EMPTY_TRANSLATION',
                    locale,
                    key,
                    message: `Traducao vazia para "${key}" em ${locale}`,
                });
            }
        }
    }

    return issues;
}

/**
 * Escaneia arquivos JSX/TSX por strings hardcoded
 */
function scanForHardcodedStrings(dir) {
    const issues = [];

    function walk(folder) {
        if (!fs.existsSync(folder)) return;

        for (const file of fs.readdirSync(folder)) {
            const fullPath = path.join(folder, file);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                // Ignorar node_modules
                if (file !== 'node_modules') {
                    walk(fullPath);
                }
                continue;
            }

            if (!file.endsWith('.tsx') && !file.endsWith('.jsx')) continue;

            const content = fs.readFileSync(fullPath, 'utf8');
            const relativePath = path.relative(process.cwd(), fullPath);

            // Detectar texto em JSX
            let match;
            while ((match = JSX_TEXT_REGEX.exec(content)) !== null) {
                const text = match[1].trim();
                if (!text || text.length < 3) continue;

                // Ignorar numeros e simbolos
                if (/^[\d\s.,;:!?@#$%^&*()_+=\-[\]{}|\\/<>]+$/.test(text)) continue;

                // Verificar palavras em portugues
                if (PT_WORDS.some(w => text.toLowerCase().includes(w.toLowerCase()))) {
                    issues.push({
                        type: 'HARDCODED_PT',
                        file: relativePath,
                        text,
                        message: `Texto PT hardcoded: "${text.substring(0, 50)}..."`,
                    });
                }

                // Verificar palavras em ingles
                if (EN_WORDS.some(w => text.toLowerCase().includes(w.toLowerCase()))) {
                    issues.push({
                        type: 'HARDCODED_EN',
                        file: relativePath,
                        text,
                        message: `Texto EN hardcoded: "${text.substring(0, 50)}..."`,
                    });
                }
            }
        }
    }

    walk(dir);
    return issues;
}

/**
 * Verifica chaves usadas no codigo mas nao definidas
 */
function scanForUndefinedKeys(dir, translations) {
    const issues = [];
    const definedKeys = new Set(Object.keys(translations[CONFIG.baseLocale] || {}));
    const usedKeys = new Set();

    function walk(folder) {
        if (!fs.existsSync(folder)) return;

        for (const file of fs.readdirSync(folder)) {
            const fullPath = path.join(folder, file);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                if (file !== 'node_modules') {
                    walk(fullPath);
                }
                continue;
            }

            if (!file.endsWith('.tsx') && !file.endsWith('.jsx') && !file.endsWith('.ts')) continue;

            const content = fs.readFileSync(fullPath, 'utf8');
            const relativePath = path.relative(process.cwd(), fullPath);

            let match;
            while ((match = T_FUNCTION_REGEX.exec(content)) !== null) {
                const key = match[1];
                usedKeys.add(key);

                if (!definedKeys.has(key)) {
                    issues.push({
                        type: 'UNDEFINED_KEY',
                        file: relativePath,
                        key,
                        message: `Chave "${key}" usada mas nao definida`,
                    });
                }
            }
        }
    }

    walk(dir);

    // Chaves definidas mas nao usadas
    for (const key of definedKeys) {
        if (!usedKeys.has(key)) {
            issues.push({
                type: 'UNUSED_KEY',
                key,
                message: `Chave "${key}" definida mas nao usada no codigo`,
            });
        }
    }

    return issues;
}

/**
 * Gera relatorio em Markdown
 */
function generateReport(parityIssues, hardcodedIssues, keyIssues) {
    const now = new Date().toLocaleString('pt-BR');

    let report = `# Relatorio de Auditoria i18n\n\n`;
    report += `> Gerado em: ${now}\n\n`;

    // Resumo
    const totalIssues = parityIssues.length + hardcodedIssues.length + keyIssues.length;
    report += `## Resumo\n\n`;
    report += `| Categoria | Problemas |\n`;
    report += `|-----------|----------|\n`;
    report += `| Paridade de Idiomas | ${parityIssues.length} |\n`;
    report += `| Strings Hardcoded | ${hardcodedIssues.length} |\n`;
    report += `| Chaves Indefinidas/Nao Usadas | ${keyIssues.length} |\n`;
    report += `| **Total** | **${totalIssues}** |\n\n`;

    // Paridade
    if (parityIssues.length > 0) {
        report += `## Paridade de Idiomas\n\n`;

        const byType = {};
        for (const issue of parityIssues) {
            byType[issue.type] = byType[issue.type] || [];
            byType[issue.type].push(issue);
        }

        for (const [type, issues] of Object.entries(byType)) {
            report += `### ${type}\n\n`;
            for (const issue of issues.slice(0, 20)) {
                report += `- ${issue.message}\n`;
            }
            if (issues.length > 20) {
                report += `- ... e mais ${issues.length - 20} problemas\n`;
            }
            report += `\n`;
        }
    }

    // Hardcoded
    if (hardcodedIssues.length > 0) {
        report += `## Strings Hardcoded\n\n`;

        const byFile = {};
        for (const issue of hardcodedIssues) {
            byFile[issue.file] = byFile[issue.file] || [];
            byFile[issue.file].push(issue);
        }

        for (const [file, issues] of Object.entries(byFile)) {
            report += `### ${file}\n\n`;
            for (const issue of issues.slice(0, 10)) {
                report += `- \`${issue.text.substring(0, 60)}${issue.text.length > 60 ? '...' : ''}\`\n`;
            }
            if (issues.length > 10) {
                report += `- ... e mais ${issues.length - 10} strings\n`;
            }
            report += `\n`;
        }
    }

    // Chaves
    if (keyIssues.length > 0) {
        report += `## Problemas de Chaves\n\n`;

        const undefined_keys = keyIssues.filter(i => i.type === 'UNDEFINED_KEY');
        const unused_keys = keyIssues.filter(i => i.type === 'UNUSED_KEY');

        if (undefined_keys.length > 0) {
            report += `### Chaves Indefinidas (usadas mas nao existem)\n\n`;
            for (const issue of undefined_keys.slice(0, 20)) {
                report += `- \`${issue.key}\` em ${issue.file}\n`;
            }
            report += `\n`;
        }

        if (unused_keys.length > 0) {
            report += `### Chaves Nao Usadas (definidas mas sem uso)\n\n`;
            report += `> Nota: Algumas podem ser usadas dinamicamente\n\n`;
            for (const issue of unused_keys.slice(0, 30)) {
                report += `- \`${issue.key}\`\n`;
            }
            if (unused_keys.length > 30) {
                report += `- ... e mais ${unused_keys.length - 30} chaves\n`;
            }
            report += `\n`;
        }
    }

    // Status final
    if (totalIssues === 0) {
        report += `## Status: APROVADO\n\n`;
        report += `Nenhum problema de i18n encontrado.\n`;
    } else {
        report += `## Status: ATENCAO\n\n`;
        report += `${totalIssues} problema(s) encontrado(s). Recomenda-se revisao.\n`;
    }

    return report;
}

/**
 * Main
 */
function main() {
    const startTime = Date.now();
    let stopTimer = null;
    if (!isSilent) {
        UI.printHeader({
            title: 'QUALITY CORE - I18N AUDIT',
            modes: ['--silent', '--quiet', '--strict'],
            active: [
                isSilent ? 'silent' : null,
                isQuiet ? 'quiet' : null,
                isStrict ? 'strict' : null,
            ].filter(Boolean),
        });
        const avgHeader = History.getAverageDuration('i18n-audit', modeLabel);
        stopTimer = UI.printTimingHeader({
            avgLabel: avgHeader,
            modeLabel,
            live: UI.shouldLiveTimer() && !isQuiet,
        });
    }
    if (!isSilent && !isQuiet) {
        UI.printScriptStart('i18n audit', 1, 1);
    } else if (isQuiet) {
        UI.printQuietStepStart('i18n audit', 1, 1);
    }
    log.info('Iniciando auditoria i18n...');

    // Extrair traducoes
    log.info('Extraindo traducoes...');
    const translations = extractTranslations();
    const locales = Object.keys(translations);
    log.info(`Idiomas encontrados: ${locales.join(', ')}`);
    log.info(`Chaves no ${CONFIG.baseLocale}: ${Object.keys(translations[CONFIG.baseLocale] || {}).length}`);

    // Verificar paridade
    log.info('Verificando paridade entre idiomas...');
    const parityIssues = checkTranslationParity(translations);
    log.info(`Problemas encontrados: ${parityIssues.length}`);

    // Escanear strings hardcoded
    log.info('Escaneando strings hardcoded...');
    const hardcodedIssues = scanForHardcodedStrings(CONFIG.componentsDir);
    log.info(`Strings suspeitas: ${hardcodedIssues.length}`);

    // Verificar chaves
    log.info('Verificando uso de chaves...');
    const keyIssues = scanForUndefinedKeys(CONFIG.componentsDir, translations);
    log.info(`Problemas de chaves: ${keyIssues.length}`);

    // Gerar relatorio
    log.info('Gerando relatorio...');
    const report = generateReport(parityIssues, hardcodedIssues, keyIssues);

    // Salvar relatorio
    const logsDir = path.dirname(CONFIG.outputFile);
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
    }
    fs.writeFileSync(CONFIG.outputFile, report, 'utf8');
    log.success(`Relatorio salvo em: ${CONFIG.outputFile}`);

    // Resumo final
    const totalIssues = parityIssues.length + hardcodedIssues.length + keyIssues.length;
    const criticalTypes = new Set([
        'MISSING_KEY',
        'EXTRA_KEY',
        'EMPTY_TRANSLATION',
        'UNDEFINED_KEY',
    ]);
    const criticalIssues = [
        ...parityIssues,
        ...keyIssues,
    ].filter(i => criticalTypes.has(i.type)).length;
    const infoIssues = totalIssues - criticalIssues;

    const success = !(isStrict && totalIssues > 0);

    const duration = Date.now() - startTime;
    History.saveExecutionTime('i18n-audit', duration, modeLabel);
    const avg = History.getAverageDuration('i18n-audit', modeLabel);
    if (!isSilent && !isQuiet) {
        log.info(`Total de problemas: ${totalIssues}`);
        log.info(`Problemas críticos: ${criticalIssues}`);
        log.info(`Problemas informativos: ${infoIssues}`);
        UI.printScriptEnd('i18n audit', duration, avg, success);
    } else if (isQuiet) {
        UI.printQuietStepEnd('i18n audit', 1, 1, duration, avg, success);
    }
    if (stopTimer) stopTimer();

    if (isSilent || isQuiet) {
        UI.printSummary({
            title: 'I18N AUDIT',
            status: success ? 'pass' : 'fail',
            metrics: [
                `Total: ${totalIssues}`,
                `Críticos: ${criticalIssues}`,
                `Informativos: ${infoIssues}`,
            ],
            duration: (duration / 1000).toFixed(2),
            reportDir: path.dirname(CONFIG.outputFile),
        });
    }

    // Exit code
    if (!success) {
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = {
    CONFIG,
    extractTranslations,
    checkTranslationParity,
    scanForHardcodedStrings,
    scanForUndefinedKeys,
    generateReport,
    main,
};
