/**
 * Master Quality Orchestrator & Reporter
 * 
 * Executa toda a suíte de qualidade, classifica impactos e gera relatório consolidado.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const UI = require('../cli/ui-helpers.cjs');

const REPORT_DIR = path.join(process.cwd(), 'performance-reports/reports');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');
const REPORT_FILE = path.join(REPORT_DIR, `audit_report_${TIMESTAMP}.md`);

const STYLES = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

const auditResults = {
  summary: { total: 0, passed: 0, failed: 0, warnings: 0 },
  details: [],
  metrics: {
    coverage: '0%',
    bundleSize: '0 KB'
  }
};

function stripAnsi(str) {
  return str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
}

function runStep(name, command, impact, description) {
  process.stdout.write(`${STYLES.cyan}START: ${name}...${STYLES.reset}`);
  auditResults.summary.total++;
  
  const start = Date.now();
  let status = 'PASSED';
  let output = '';
  let error = null;

  try {
    output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    const cleanOutput = stripAnsi(output);
    
    if (name === 'Build & Bundle') {
      const match = cleanOutput.match(/index-.*\.js\s+([\d.]+)\s+kB/i);
      if (match) {
        const size = parseFloat(match[1]);
        auditResults.metrics.bundleSize = `${size} KB`;
      }
    }
    if (name === 'Cobertura') {
      const match = cleanOutput.match(/Lines\s+:\s+([\d.]+)%/i);
      if (match) {
        auditResults.metrics.coverage = `${match[1]}%`;
      }
    }
  } catch (e) {
    status = (impact === 'Baixo' || impact === 'Médio') ? 'WARNING' : 'FAILED';
    output = (e.stdout || '') + (e.stderr || '');
    error = e.message;
  }

  const duration = ((Date.now() - start) / 1000).toFixed(2);
  
  if (status === 'FAILED') {
    auditResults.summary.failed++;
    console.log(` ${STYLES.red}FAILED (${duration}s)${STYLES.reset}`);
  } else if (status === 'WARNING') {
    auditResults.summary.warnings++;
    console.log(` ${STYLES.yellow}WARNING (${duration}s)${STYLES.reset}`);
  } else {
    auditResults.summary.passed++;
    console.log(` ${STYLES.green}SUCCESS (${duration}s)${STYLES.reset}`);
  }

  auditResults.details.push({ name, status, impact, duration, description, output, error });
}

async function main() {
  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
  }

  console.clear();
  UI.printHeader({
    title: 'QUALITY CORE - FULL AUDIT',
    modes: [],
    active: [],
  });
  console.log(`${STYLES.bright}${STYLES.magenta}STARTING FULL QUALITY AUDIT${STYLES.reset}\n`);

  // 1. CRÍTICOS (Bloqueantes)
  runStep('Testes Core', 'bun run test', 'BLOQUEANTE', 'Validação da lógica fundamental e resiliência.');
  runStep('Type Check', 'bunx tsc --noEmit', 'BLOQUEANTE', 'Verificação de integridade de tipos TypeScript.');
  runStep('Linting', 'bun run lint', 'BLOQUEANTE', 'Padronização de código e detecção de code smells.');
  runStep('Build & Bundle', 'bun run build', 'BLOQUEANTE', 'Verificação de sucesso do build e tamanho do bundle.');

  // 2. ALTO IMPACTO
  runStep('Segurança (Secrets)', 'node quality-core/scripts/security-scan.cjs --repo-wide', 'ALTO RISCO', 'Busca por API Keys e segredos expostos.');
  runStep('Segurança (Audit)', 'npm audit --audit-level=high', 'ALTO RISCO', 'Vulnerabilidades conhecidas em dependências.');
  runStep('Cobertura', 'bun vitest run --environment jsdom --config quality-core/config/vitest.config.core.ts --coverage.enabled=true --coverage.reporter=text-summary --coverage.reportsDirectory=performance-reports/coverage --passWithNoTests', 'ALTO RISCO', 'Percentual de código testado.');

  // 3. MÉDIO IMPACTO
  runStep('Performance', 'bun vitest run --environment jsdom __tests__/performanceRegression.core.test.ts', 'DEGRADAÇÃO', 'Verificação de orçamentos de tempo de execução.');
  runStep('Regressão de Estado', 'bun vitest run --environment jsdom __tests__/stateRegression.core.test.tsx', 'DEGRADAÇÃO', 'Validação de limpeza de estado global.');

  // 4. BAIXO IMPACTO
  runStep('Visual Snapshots', 'bun vitest run --environment jsdom __tests__/Logo.snapshot.test.tsx', 'CONSISTÊNCIA', 'Regressões visuais em componentes estáveis.');

  // GERAR RELATÓRIO
  let reportMd = `# Quality Audit Report\n\n`;
  reportMd += `**Date:** ${new Date().toLocaleString('pt-BR')}\n`;
  reportMd += `**Status:** ${auditResults.summary.failed > 0 ? 'FAILED' : 'PASSED'}\n`;
  reportMd += `**Coverage:** ${auditResults.metrics.coverage}\n`;
  reportMd += `**Bundle Size:** ${auditResults.metrics.bundleSize}\n\n`;

  reportMd += `<!-- METRICS_START
  coverage: ${auditResults.metrics.coverage}
  bundle_total_kb: ${parseFloat(auditResults.metrics.bundleSize) || 0}
  METRICS_END -->\n\n`;

  reportMd += `## Executive Summary\n\n`;
  reportMd += `| Metric | Value |\n| :--- | :--- |\n`;
  reportMd += `| Total Steps | ${auditResults.summary.total} |\n`;
  reportMd += `| Passed | ${auditResults.summary.passed} |\n`;
  reportMd += `| Failed | ${auditResults.summary.failed} |\n`;
  reportMd += `| Warnings | ${auditResults.summary.warnings} |\n\n`;

  reportMd += `## Detail by Impact\n\n`;
  reportMd += `| Step | Status | Impact | Duration | Description |\n`;
  reportMd += `| :--- | :--- | :--- | :--- | :--- |\n`;

  auditResults.details.forEach(d => {
    reportMd += `| ${d.name} | ${d.status} | **${d.impact}** | ${d.duration}s | ${d.description} |\n`;
  });

  if (auditResults.summary.failed > 0 || auditResults.summary.warnings > 0) {
    reportMd += `\n## Detected Issues\n\n`;
    auditResults.details.filter(d => d.status !== 'PASSED').forEach(d => {
      reportMd += `### [${d.status}] ${d.name} (Impact: ${d.impact})\n`;
      reportMd += `**Error:** ${d.error || 'Check output below'}\n\n`;
      reportMd += `**Related Logs:**\n\n${d.output.slice(-1000)}\n\n\n\n`;
    });
  }

  reportMd += `\n---\n*Report generated automatically via Master Orchestrator*`;

  fs.writeFileSync(REPORT_FILE, reportMd);
  console.log(`\n${STYLES.bright}Audit Finished. Report saved to:${STYLES.reset}`);
  console.log(`${STYLES.cyan}${REPORT_FILE}${STYLES.reset}`);

  process.exit(auditResults.summary.failed > 0 ? 1 : 0);
}

main();
