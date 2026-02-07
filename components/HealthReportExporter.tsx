import React, { useState, useContext } from 'react';
import { Download, Copy, Check } from 'lucide-react';
import { proxyManager, ProxyManager } from '../services/proxyManager';
import { FeedContext } from '../contexts/FeedContextState';

interface FeedHealthData {
    title: string;
    url: string;
    status: string;
    lastFetch?: string;
    successRate?: number;
}

export const HealthReportExporter: React.FC<{
    feeds?: FeedHealthData[];
}> = ({ feeds: externalFeeds }) => {
    const feedContext = useContext(FeedContext);

    // Use contextual feeds if available, otherwise use external feeds
    const contextFeeds = feedContext?.feeds || [];
    const feeds = externalFeeds || (contextFeeds as unknown as FeedHealthData[]) || [];
    const [copied, setCopied] = useState(false);
    const [reportType, setReportType] = useState<'full' | 'summary'>('full');

    const generateMarkdownReport = (): string => {
        const now = new Date();
        const timestamp = now.toLocaleString('pt-BR');
        const isDev = import.meta.env.DEV;
        const apiKey = ProxyManager.getRss2jsonApiKey();
        const apiKeyOrigin = ProxyManager.getRss2jsonApiKeyOrigin();
        const prefersLocalProxy = ProxyManager.getPreferLocalProxy();

        // Proxy health
        const proxyStats = proxyManager.getProxyStats();
        const overallStats = proxyManager.getOverallStats();

        const proxySummary = Object.entries(proxyStats)
            .map(([name, stats]) => {
                const successRate = stats.totalRequests
                    ? Math.round((stats.success / stats.totalRequests) * 100)
                    : 0;
                return {
                    name,
                    stats,
                    successRate,
                };
            })
            .sort((a, b) => b.stats.healthScore - a.stats.healthScore);

        let markdown = `# 📊 Relatório de Saúde - Personal News\n\n`;
        markdown += `**Gerado em:** ${timestamp}\n`;
        markdown += `**Versão do Sistema:** ${isDev ? '🔧 Desenvolvimento' : '📦 Produção (GitHub Pages)'}\n`;
        markdown += `**Feeds Monitorados:** ${feeds.length}\n`;
        markdown += `**Proxies Configurados:** ${Object.keys(proxyStats).length}\n\n`;

        // System Configuration Section
        markdown += `## ⚙️ Configuração do Sistema\n\n`;
        markdown += `- **Ambiente:** ${isDev ? 'Desenvolvimento (localhost:5175)' : 'Produção'}\n`;

        // API Key Section with Origin
        if (apiKey) {
            const maskedKey = apiKey.substring(0, 8) + '...' + apiKey.substring(apiKey.length - 4);
            const originLabel = apiKeyOrigin === 'env.local' ? '📁 .env.local'
                : apiKeyOrigin === 'localStorage' ? '💾 localStorage (salva anterior)'
                    : '✋ Configurada manualmente';
            markdown += `- **API Key RSS2JSON:** ✅ Configurada\n`;
            markdown += `  - Chave: \`${maskedKey}\`\n`;
            markdown += `  - Origem: ${originLabel}\n`;
            markdown += `  - Status: Ativa e validada\n`;
            markdown += `  - Limite: 10.000 requisições/dia\n`;
        } else {
            markdown += `- **API Key RSS2JSON:** ❌ Não configurada\n`;
            markdown += `  - Limite atual: 50 requisições/dia\n`;
            markdown += `  - Para configurar:\n`;
            markdown += `    1. Crie um arquivo \`.env.local\` na raiz do projeto\n`;
            markdown += `    2. Adicione: \`VITE_RSS2JSON_API_KEY=sua-chave-aqui\`\n`;
            markdown += `    3. Reinicie o servidor\n`;
        }
        markdown += `- **Preferência de Proxy:** ${prefersLocalProxy ? '🏠 Local Proxy (dev)' : '☁️ Proxies em nuvem'}\n`;
        markdown += `- **Proxy Saudáveis:** ${overallStats.healthyProxies}/${overallStats.totalProxies}\n`;
        markdown += `- **Total de Requisições:** ${overallStats.totalRequests}\n`;
        markdown += `- **Taxa de Sucesso Geral:** ${overallStats.totalRequests > 0 ? Math.round((overallStats.totalSuccesses / overallStats.totalRequests) * 100) : 0}%\n`;
        markdown += `- **Tempo Médio de Resposta:** ${overallStats.averageResponseTime.toFixed(0)}ms\n\n`;

        // Feed Health Section
        markdown += `## 📰 Status dos Feeds (${feeds.length} feeds)\n\n`;

        if (feeds.length === 0) {
            markdown += `⚠️ Nenhum feed está sendo monitorado ainda. Adicione feeds para começar.\n\n`;
        } else {
            const feedsByStatus = {
                working: feeds.filter(f => f.status === 'working'),
                warning: feeds.filter(f => f.status === 'warning'),
                error: feeds.filter(f => f.status === 'error'),
            };

            if (feedsByStatus.working.length > 0) {
                markdown += `### ✅ Feeds Funcionando (${feedsByStatus.working.length})\n\n`;
                feedsByStatus.working.slice(0, 10).forEach(feed => {
                    markdown += `- **${feed.title}**\n`;
                    if (reportType === 'full') {
                        markdown += `  - URL: \`${feed.url}\`\n`;
                        markdown += `  - Taxa de Sucesso: ${feed.successRate ?? 'N/A'}%\n`;
                        markdown += `  - Última Consulta: ${feed.lastFetch || 'Nunca'}\n`;
                    }
                });
                if (feedsByStatus.working.length > 10) {
                    markdown += `\n_... e ${feedsByStatus.working.length - 10} feeds adicionais_\n`;
                }
                markdown += '\n';
            }

            if (feedsByStatus.warning.length > 0) {
                markdown += `### ⚠️ Feeds com Aviso (${feedsByStatus.warning.length})\n\n`;
                feedsByStatus.warning.forEach(feed => {
                    markdown += `- **${feed.title}**\n`;
                    if (reportType === 'full') {
                        markdown += `  - URL: \`${feed.url}\`\n`;
                        markdown += `  - Taxa de Sucesso: ${feed.successRate ?? 'N/A'}%\n`;
                        markdown += `  - Última Consulta: ${feed.lastFetch || 'Nunca'}\n`;
                        markdown += `  - Ação: Verifique a URL ou o serviço de proxy\n`;
                    }
                });
                markdown += '\n';
            }

            if (feedsByStatus.error.length > 0) {
                markdown += `### ❌ Feeds com Erro (${feedsByStatus.error.length})\n\n`;
                feedsByStatus.error.slice(0, 5).forEach(feed => {
                    markdown += `- **${feed.title}**\n`;
                    if (reportType === 'full') {
                        markdown += `  - URL: \`${feed.url}\`\n`;
                        markdown += `  - Taxa de Sucesso: ${feed.successRate ?? 'N/A'}%\n`;
                        markdown += `  - Última Consulta: ${feed.lastFetch || 'Nunca'}\n`;
                        markdown += `  - Ação Recomendada: Remover feed ou verificar URL\n`;
                    }
                });
                if (feedsByStatus.error.length > 5) {
                    markdown += `\n_... e ${feedsByStatus.error.length - 5} feeds com erro adicional_\n`;
                }
                markdown += '\n';
            }
        }

        // Proxy Performance Section
        markdown += `## 🔗 Performance dos Proxies\n\n`;
        markdown += `| Proxy | Status | Taxa Sucesso | Requisições | Tempo Médio | Falhas Consecutivas |\n`;
        markdown += `|-------|--------|--------------|-------------|-------------|---------------------|\n`;

        proxySummary.forEach(({ name, stats, successRate }) => {
            const status = stats.healthScore >= 0.8 ? '🟢' : stats.healthScore >= 0.5 ? '🟡' : '🔴';
            markdown += `| ${name} | ${status} | ${successRate}% | ${stats.totalRequests} | ${stats.avgResponseTime.toFixed(0)}ms | ${stats.consecutiveFailures} |\n`;
        });
        markdown += '\n';

        // Detailed Proxy Analysis
        if (reportType === 'full') {
            markdown += `### Análise Detalhada por Proxy\n\n`;
            proxySummary.forEach(({ name, stats, successRate }) => {
                markdown += `#### ${name}\n\n`;
                markdown += `- **Score de Saúde:** ${(stats.healthScore * 100).toFixed(1)}%\n`;
                markdown += `- **Requisições Totais:** ${stats.totalRequests}\n`;
                markdown += `- **Sucessos:** ${stats.success}\n`;
                markdown += `- **Falhas:** ${stats.failures}\n`;
                markdown += `- **Taxa de Sucesso:** ${successRate}%\n`;
                markdown += `- **Tempo Médio de Resposta:** ${stats.avgResponseTime.toFixed(0)}ms\n`;
                markdown += `- **Falhas Consecutivas:** ${stats.consecutiveFailures}\n`;
                markdown += `- **Última Tentativa:** ${new Date(stats.lastUsed).toLocaleString('pt-BR')}\n`;
                markdown += `- **Último Sucesso:** ${new Date(stats.lastSuccess).toLocaleString('pt-BR')}\n`;
                if (stats.lastFailure > 0) {
                    markdown += `- **Última Falha:** ${new Date(stats.lastFailure).toLocaleString('pt-BR')}\n`;
                }
                markdown += '\n';
            });
        }

        // Health Score Explanation
        markdown += `## 🔍 Entendendo os Scores de Saúde\n\n`;
        markdown += `O **Score de Saúde (0-100%)** indica quanto um proxy está funcionando bem:\n\n`;
        markdown += `- **🟢 Verde (80-100%):** Proxy saudável, use com confiança\n`;
        markdown += `- **🟡 Amarelo (50-80%):** Proxy com problemas ocasionais, monitorar\n`;
        markdown += `- **🔴 Vermelho (0-50%):** Proxy com problemas graves ou morto\n\n`;

        markdown += `### Por que os proxies podem estar em 0%?\n\n`;
        markdown += `1. **Nenhuma requisição ainda:** Se é a primeira execução, os proxies não fizeram nenhuma requisição\n`;
        markdown += `2. **Proxies realmente mortos:** Se todos falharam, pode estar sem internet ou o serviço está fora\n`;
        markdown += `3. **Taxa limite atingida:** Alguns proxies têm limite de requisições/dia\n`;
        markdown += `4. **CORS bloqueado:** O navegador pode bloquear requisições para certas URLs\n`;
        markdown += `5. **Firewall/VPN:** Sua rede pode estar bloqueando as requisições\n\n`;

        markdown += `**Dica:** Verifique o console do navegador (F12) para mensagens de erro detalhadas.\n\n`;

        // Summary Section
        const avgHealthScore = proxySummary.length > 0
            ? proxySummary.reduce((sum, { stats }) => sum + stats.healthScore, 0) / proxySummary.length
            : 0;

        markdown += `## 📈 Resumo Executivo\n\n`;
        markdown += `- **Saúde Geral dos Proxies:** ${(avgHealthScore * 100).toFixed(1)}%\n`;
        if (feeds.length > 0) {
            const feedsByStatus = {
                working: feeds.filter(f => f.status === 'working'),
                warning: feeds.filter(f => f.status === 'warning'),
                error: feeds.filter(f => f.status === 'error'),
            };
            markdown += `- **Feeds Funcionando:** ${feedsByStatus.working.length}/${feeds.length} (${feeds.length > 0 ? Math.round((feedsByStatus.working.length / feeds.length) * 100) : 0}%)\n`;
        } else {
            markdown += `- **Feeds Funcionando:** Nenhum feed cadastrado\n`;
        }
        markdown += `- **Requisições Bem-Sucedidas:** ${overallStats.totalSuccesses}/${overallStats.totalRequests}\n`;
        markdown += `- **Proxy Mais Rápido:** ${proxySummary[0]?.name || 'N/A'} (${proxySummary[0]?.stats.avgResponseTime.toFixed(0) || 0}ms)\n`;
        markdown += `- **Recomendação:** ${avgHealthScore >= 0.8 ? '✅ Sistema saudável - Nenhuma ação necessária' : avgHealthScore >= 0.5 ? '⚠️ Atenção necessária - Monitore a situação' : avgHealthScore > 0 ? '🔧 Problemas detectados - Verifique proxies' : '❌ Crítico - Nenhum proxy funcional'}\n\n`;

        // Footer
        markdown += `---\n\n`;
        markdown += `*Relatório gerado automaticamente pelo Personal News Dashboard*\n`;
        markdown += `*Dados capturados nesta sessão do navegador*\n`;

        return markdown;
    };

    const handleCopyReport = () => {
        const report = generateMarkdownReport();
        navigator.clipboard.writeText(report);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadReport = () => {
        const report = generateMarkdownReport();
        const element = document.createElement('a');
        const file = new Blob([report], { type: 'text/markdown;charset=utf-8' });
        element.href = URL.createObjectURL(file);
        element.download = `health-report-${new Date().toISOString().split('T')[0]}.md`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    return (
        <div className="space-y-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        Exportar Relatório
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        Gere um relatório detalhado em Markdown
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Tipo de Relatório:
                </label>
                <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value as 'full' | 'summary')}
                    className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="summary">Resumido</option>
                    <option value="full">Completo</option>
                </select>
            </div>

            <div className="flex gap-2">
                <button
                    onClick={handleCopyReport}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                >
                    {copied ? (
                        <>
                            <Check className="w-4 h-4" />
                            Copiado!
                        </>
                    ) : (
                        <>
                            <Copy className="w-4 h-4" />
                            Copiar Relatório
                        </>
                    )}
                </button>
                <button
                    onClick={handleDownloadReport}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 dark:bg-slate-600 dark:hover:bg-slate-500 text-white rounded-lg font-medium transition-colors"
                >
                    <Download className="w-4 h-4" />
                    Baixar (.md)
                </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
                💡 Use este relatório para documentar a saúde do seu sistema e monitorar tendências ao longo do tempo.
            </p>
        </div>
    );
};
