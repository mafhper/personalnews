/**
 * Master Quality Orchestrator & Reporter
 * 
 * Executa toda a suíte de qualidade, classifica impactos e gera relatório consolidado.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPORT_DIR = path.join(process.cwd(), '_dev/reports');
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
  details: []
};

function runStep(name, command, impact, description) {
  process.stdout.write(`${STYLES.cyan}⏳ Rodando: ${name}...${STYLES.reset}`);
  auditResults.summary.total++;
  
  const start = Date.now();
  let status = 'PASSED';
  let output = '';
  let error = null;

  try {
    output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
  } catch (e) {
    status = 'FAILED';
    status = (impact === 'Baixo' || impact === 'Médio') ? 'WARNING' : 'FAILED';
    output = e.stdout + e.stderr;
    error = e.message;
  }

  const duration = ((Date.now() - start) / 1000).toFixed(2);
  
  if (status === 'FAILED') {
    auditResults.summary.failed++;
    console.log(` ${STYLES.red}❌ FALHOU (${duration}s)${STYLES.reset}`);
  } else if (status === 'WARNING') {
    auditResults.summary.warnings++;
    console.log(` ${STYLES.yellow}⚠️  AVISO (${duration}s)${STYLES.reset}`);
  } else {
    auditResults.summary.passed++;
    console.log(` ${STYLES.green}✅ OK (${duration}s)${STYLES.reset}`);
  }

  auditResults.details.push({ name, status, impact, duration, description, output, error });
}

async function main() {
  console.clear();
  console.log(`${STYLES.bright}${STYLES.magenta}🚀 INICIANDO AUDITORIA COMPLETA DE QUALIDADE${STYLES.reset}\n`);

  // 1. CRÍTICOS (Bloqueantes)
  runStep('Testes Core', 'bun run test', 'BLOQUEANTE', 'Validação da lógica fundamental e resiliência.');
  runStep('Type Check', 'bunx tsc --noEmit', 'BLOQUEANTE', 'Verificação de integridade de tipos TypeScript.');
  runStep('Linting', 'bun run lint', 'BLOQUEANTE', 'Padronização de código e detecção de code smells.');

  // 2. ALTO IMPACTO
  runStep('Segurança (Secrets)', 'node scripts/security-scan.cjs', 'ALTO RISCO', 'Busca por API Keys e segredos expostos.');
  runStep('Segurança (Audit)', 'npm audit --audit-level=high', 'ALTO RISCO', 'Vulnerabilidades conhecidas em dependências.');

  // 3. MÉDIO IMPACTO
  runStep('Performance', 'bun vitest run __tests__/performanceRegression.core.test.ts', 'DEGRADAÇÃO', 'Verificação de orçamentos de tempo de execução.');
  runStep('Regressão de Estado', 'bun vitest run __tests__/stateRegression.core.test.tsx', 'DEGRADAÇÃO', 'Validação de limpeza de estado global.');

  // 4. BAIXO IMPACTO
  runStep('Visual Snapshots', 'bun vitest run __tests__/Logo.snapshot.test.tsx', 'CONSISTÊNCIA', 'Regressões visuais em componentes estáveis.');

  // GERAR RELATÓRIO
  let reportMd = `# 📊 Relatório de Auditoria de Qualidade\n\n`;
  reportMd += `**Data:** ${new Date().toLocaleString('pt-BR')}\n`;
  reportMd += `**Status Geral:** ${auditResults.summary.failed > 0 ? '❌ REPROVADO' : '✅ APROVADO'}\n\n`;

  reportMd += `## 📈 Resumo Executivo\n\n`;
  reportMd += `| Métrica | Valor |\n| :--- | :--- |\n`;
  reportMd += `| Total de Etapas | ${auditResults.summary.total} |\n`;
  reportMd += `| Sucesso | ${auditResults.summary.passed} |\n`;
  reportMd += `| Falhas | ${auditResults.summary.failed} |\n`;
  reportMd += `| Avisos | ${auditResults.summary.warnings} |\n\n`;

  reportMd += `## 🔍 Detalhamento por Impacto\n\n`;
  reportMd += `| Etapa | Status | Impacto | Duração | Descrição |\n`;
  reportMd += `| :--- | :--- | :--- | :--- | :--- |\n`;

  auditResults.details.forEach(d => {
    const icon = d.status === 'PASSED' ? '✅' : (d.status === 'WARNING' ? '⚠️' : '❌');
    reportMd += `| ${d.name} | ${icon} ${d.status} | **${d.impact}** | ${d.duration}s | ${d.description} |\n`;
  });

  if (auditResults.summary.failed > 0 || auditResults.summary.warnings > 0) {
    reportMd += `\n## 🛠️ Problemas Detectados\n\n`;
    auditResults.details.filter(d => d.status !== 'PASSED').forEach(d => {
      reportMd += `### ❌ ${d.name} (Impacto: ${d.impact})\n`;
      reportMd += `**Erro:** ${d.error || 'Ver output abaixo'}\n\n`;
      reportMd += `**Logs Relacionados:**\n\
\
${d.output.slice(-1000)}
\
\
\
`;
    });
  }

  reportMd += `\n---\n*Relatório gerado automaticamente via Master Orchestrator*`;

  fs.writeFileSync(REPORT_FILE, reportMd);
  console.log(`\n${STYLES.bright}✨ Auditoria Finalizada! Relatório salvo em:${STYLES.reset}`);
  console.log(`${STYLES.cyan}${REPORT_FILE}${STYLES.reset}`);

  process.exit(auditResults.summary.failed > 0 ? 1 : 0);
}

main();
