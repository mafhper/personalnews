import React, { useMemo, useEffect } from 'react';
import { Article, FeedSource } from '../types';
import { FeedValidationResult } from '../services/feedValidator';
import { Card } from './ui/Card';
import { ProxyHealthSummary } from './ProxyHealthSummary';
import { HealthReportExporter } from './HealthReportExporter';

interface FeedAnalyticsProps {
  feeds: FeedSource[];
  articles: Article[];
  feedValidations: Map<string, FeedValidationResult>;
  focusSection?: string;
  onFocusConsumed?: () => void;
}

export const FeedAnalytics: React.FC<FeedAnalyticsProps> = ({
  feeds,
  articles,
  feedValidations,
  focusSection,
  onFocusConsumed
}) => {
  // 1. Calculate Feed Activity
  const activityStats = useMemo(() => {
    const stats = new Map<string, number>();

    // Initialize all feeds with 0
    feeds.forEach(f => {
      const key = f.customTitle || f.url;
      stats.set(key, 0);
    });

    // Count articles per feed
    articles.forEach(article => {
      const key = article.sourceTitle || 'Unknown Source';
      // Only count if it matches a known feed (fuzzy match) or we add it directly
      // For simplicity, we use sourceTitle from article which usually matches
      if (stats.has(key)) {
        stats.set(key, (stats.get(key) || 0) + 1);
      } else {
        // Try to find by URL match
        const matchingFeed = feeds.find(f => article.link.includes(new URL(f.url).hostname));
        if (matchingFeed) {
          const feedKey = matchingFeed.customTitle || matchingFeed.url;
          stats.set(feedKey, (stats.get(feedKey) || 0) + 1);
        }
      }
    });

    const sorted = Array.from(stats.entries()).sort((a, b) => b[1] - a[1]);

    return {
      mostActive: sorted.slice(0, 5),
      leastActive: sorted.filter(x => x[1] === 0).slice(0, 5), // Feeds with 0 articles loaded
      totalArticles: articles.length
    };
  }, [feeds, articles]);

  // 2. Calculate Topic Trends
  const topicTrends = useMemo(() => {
    const counts = new Map<string, number>();

    articles.forEach(article => {
      if (article.categories && article.categories.length > 0) {
        article.categories.forEach(cat => {
          // Normalize tag
          const normalized = cat.trim().toLowerCase();
          if (normalized.length > 2 && !['uncategorized', 'general', 'news'].includes(normalized)) {
             counts.set(normalized, (counts.get(normalized) || 0) + 1);
          }
        });
      }
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10); // Top 10 topics
  }, [articles]);

  // 3. Health Analysis
  const healthStats = useMemo(() => {
    let valid = 0;
    let invalid = 0;
    let unchecked = 0;
    const issues: { url: string, error: string, title?: string }[] = [];

    feeds.forEach(feed => {
      const val = feedValidations.get(feed.url);
      if (!val) {
        unchecked++;
      } else if (val.isValid) {
        valid++;
      } else {
        invalid++;
        issues.push({
          url: feed.url,
          title: feed.customTitle,
          error: val.error || 'Erro desconhecido'
        });
      }
    });

    return { valid, invalid, unchecked, issues };
  }, [feeds, feedValidations]);

  const feedRows = useMemo(() => {
    const statusWeight: Record<string, number> = {
      invalid: 0,
      timeout: 1,
      network_error: 2,
      parse_error: 3,
      cors_error: 4,
      not_found: 5,
      server_error: 6,
      discovery_required: 7,
      discovery_in_progress: 8,
      checking: 9,
      unchecked: 10,
      valid: 11,
    };

    return feeds
      .map((feed) => {
        const validation = feedValidations.get(feed.url);
        const status = validation?.status || "unchecked";
        const lastAttempt = validation?.validationAttempts?.slice(-1)[0];

        return {
          url: feed.url,
          title: feed.customTitle || validation?.title || feed.url,
          status,
          statusWeight: statusWeight[status] ?? 99,
          lastChecked: validation?.lastChecked,
          responseTime: validation?.responseTime,
          method: validation?.finalMethod || (validation ? "direct" : "-"),
          proxyUsed: lastAttempt?.proxyUsed,
          error: validation?.error,
        };
      })
      .sort((a, b) => {
        if (a.statusWeight !== b.statusWeight) {
          return a.statusWeight - b.statusWeight;
        }
        return a.title.localeCompare(b.title);
      });
  }, [feeds, feedValidations]);

  useEffect(() => {
    if (!focusSection) return;
    const run = () => {
      const el = document.getElementById(focusSection);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      onFocusConsumed?.();
    };
    requestAnimationFrame(run);
  }, [focusSection, onFocusConsumed]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 p-2">

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="glass" className="p-4 flex items-center space-x-4">
          <div className="p-3 bg-blue-500/20 rounded-full">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
          </div>
          <div>
            <p className="text-sm text-gray-400">Artigos em Cache</p>
            <h3 className="text-2xl font-bold text-white">{activityStats.totalArticles}</h3>
            <span className="text-[10px] text-gray-500">Atualizado: {new Date().toLocaleTimeString()}</span>
          </div>
        </Card>

        <Card variant="glass" className="p-4 flex items-center space-x-4">
          <div className="p-3 bg-[rgb(var(--color-accent))]/20 rounded-full">
            <svg className="w-6 h-6 text-[rgb(var(--color-accent))]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5c7.18 0 13 5.82 13 13M6 11c3.866 0 7 3.134 7 7m-7-7v7" /></svg>
          </div>
          <div>
            <p className="text-sm text-gray-400">Feeds Monitorados</p>
            <h3 className="text-2xl font-bold text-white">{feeds.length}</h3>
          </div>
        </Card>

        <Card variant="glass" className="p-4 flex items-center space-x-4">
          <div className={`p-3 rounded-full ${healthStats.invalid > 0 ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
            <svg className={`w-6 h-6 ${healthStats.invalid > 0 ? 'text-red-400' : 'text-green-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <p className="text-sm text-gray-400">Saúde do Sistema</p>
            <h3 className="text-xl font-bold text-white">
              {healthStats.invalid > 0
                ? `${healthStats.invalid} com erro`
                : '100% Operacional'}
            </h3>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Activity & Trends */}
        <div className="space-y-6">
          {/* Feed Status */}
          <div id="feed-status" className="bg-gray-800/40 rounded-xl border border-white/10 p-5">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Status dos Feeds
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="bg-black/20 border border-white/5 rounded-lg p-3">
                <p className="text-[10px] uppercase tracking-widest text-gray-500">Válidos</p>
                <p className="text-lg font-bold text-emerald-300">{healthStats.valid}</p>
              </div>
              <div className="bg-black/20 border border-white/5 rounded-lg p-3">
                <p className="text-[10px] uppercase tracking-widest text-gray-500">Com erro</p>
                <p className="text-lg font-bold text-amber-300">{healthStats.invalid}</p>
              </div>
              <div className="bg-black/20 border border-white/5 rounded-lg p-3">
                <p className="text-[10px] uppercase tracking-widest text-gray-500">Pendentes</p>
                <p className="text-lg font-bold text-sky-300">{healthStats.unchecked}</p>
              </div>
              <div className="bg-black/20 border border-white/5 rounded-lg p-3">
                <p className="text-[10px] uppercase tracking-widest text-gray-500">Total</p>
                <p className="text-lg font-bold text-white">{feeds.length}</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-gray-500">
                    <th className="px-2 py-1">Feed</th>
                    <th className="px-2 py-1">Status</th>
                    <th className="px-2 py-1">Última verificação</th>
                    <th className="px-2 py-1">Latência</th>
                    <th className="px-2 py-1">Método</th>
                  </tr>
                </thead>
                <tbody>
                  {feedRows.map((row) => (
                    <tr key={row.url} className="bg-black/20 border border-white/5 rounded-lg">
                      <td className="px-2 py-2 max-w-[240px] truncate" title={row.title}>
                        {row.title}
                      </td>
                      <td className="px-2 py-2">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${
                          row.status === "valid"
                            ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                            : row.status === "unchecked"
                              ? "bg-sky-500/10 text-sky-300 border-sky-500/20"
                              : "bg-amber-500/10 text-amber-300 border-amber-500/20"
                        }`}>
                          {row.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-gray-400">
                        {row.lastChecked ? new Date(row.lastChecked).toLocaleString() : "-"}
                      </td>
                      <td className="px-2 py-2 text-gray-400">
                        {row.responseTime ? `${row.responseTime}ms` : "-"}
                      </td>
                      <td className="px-2 py-2 text-gray-400">
                        {row.proxyUsed ? `${row.method} • ${row.proxyUsed}` : row.method}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {feedRows.length === 0 && (
                <p className="text-xs text-gray-500 mt-3">Nenhum feed disponível.</p>
              )}
            </div>
          </div>

          {/* Popular Topics */}
          <div className="bg-gray-800/40 rounded-xl border border-white/10 p-5">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>
              Assuntos Populares
            </h3>
            <div className="flex flex-wrap gap-2">
              {topicTrends.length > 0 ? (
                topicTrends.map(([topic, count], idx) => (
                  <span
                    key={topic}
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      idx < 3
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                        : 'bg-gray-700/50 text-gray-300 border-white/5'
                    }`}
                  >
                    #{topic} <span className="opacity-50 ml-1">({count})</span>
                  </span>
                ))
              ) : (
                <p className="text-sm text-gray-500 italic">Não há dados suficientes para análise de tópicos ainda.</p>
              )}
            </div>
          </div>

          {/* Most Frequent Feeds */}
          <div className="bg-gray-800/40 rounded-xl border border-white/10 p-5">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              Maior Frequência
            </h3>
            <div className="space-y-3">
              {activityStats.mostActive.map(([name, count], idx) => (
                <div key={name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="w-5 text-xs text-gray-500 mr-2">#{idx + 1}</span>
                    <span className="text-sm text-gray-200 truncate max-w-[200px]">{name}</span>
                  </div>
                  <span className="text-xs font-mono bg-green-900/30 text-green-400 px-2 py-0.5 rounded">
                    {count} arts.
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Health & Issues */}
        <div className="space-y-6">
          {/* Health Overview */}
          <div className="bg-gray-800/40 rounded-xl border border-white/10 p-5">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              Status dos Feeds
            </h3>

            <div className="flex h-4 rounded-full overflow-hidden mb-4 bg-gray-700">
              <div className="bg-green-500 transition-all duration-500" style={{ width: `${(healthStats.valid / feeds.length) * 100}%` }} title="Válidos" />
              <div className="bg-red-500 transition-all duration-500" style={{ width: `${(healthStats.invalid / feeds.length) * 100}%` }} title="Com Erro" />
              <div className="bg-gray-500 transition-all duration-500" style={{ width: `${(healthStats.unchecked / feeds.length) * 100}%` }} title="Não Verificados" />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="text-green-400">
                <span className="block font-bold text-lg">{healthStats.valid}</span>
                Válidos
              </div>
              <div className="text-red-400">
                <span className="block font-bold text-lg">{healthStats.invalid}</span>
                Erros
              </div>
              <div className="text-gray-400">
                <span className="block font-bold text-lg">{healthStats.unchecked}</span>
                Pendentes
              </div>
            </div>
          </div>

          {/* Problematic Feeds List */}
          {healthStats.issues.length > 0 ? (
            <div className="bg-red-900/10 rounded-xl border border-red-500/20 p-5">
              <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Atenção Necessária
              </h3>
              <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                {healthStats.issues.map((issue, idx) => (
                  <div key={idx} className="bg-red-500/5 p-3 rounded-lg border border-red-500/10">
                    <p className="text-sm font-medium text-red-200 truncate">{issue.title || issue.url}</p>
                    <p className="text-xs text-red-400 mt-1 break-all">{issue.error}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-green-900/10 rounded-xl border border-green-500/20 p-5 text-center">
              <svg className="w-12 h-12 text-green-500/50 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-green-300 font-medium">Tudo Certo!</p>
              <p className="text-green-400/70 text-sm mt-1">Nenhum problema detectado nos seus feeds.</p>
            </div>
          )}
        </div>
      </div>

      {/* Proxy Health Summary Section */}
      <div id="proxy-health" className="mt-8 pt-8 border-t border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Saúde dos Proxies
        </h3>
        <ProxyHealthSummary />
      </div>

      <div id="feed-reports" className="mt-8 pt-8 border-t border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Relatórios de Saúde
        </h3>
        <HealthReportExporter />
      </div>

      {/* Generate Reports Section */}
      <div className="mt-8 pt-8 border-t border-gray-700 space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <svg className="w-5 h-5 mr-2 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Gerar Relatórios
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => {
              const report = {
                timestamp: new Date().toISOString(),
                feedCount: feeds.length,
                articleCount: articles.length,
                validFeeds: healthStats.valid,
                invalidFeeds: healthStats.invalid,
                topicTrends: topicTrends.slice(0, 5),
                mostActive: activityStats.mostActive.slice(0, 5)
              };
              const dataStr = JSON.stringify(report, null, 2);
              const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
              const link = document.createElement('a');
              link.setAttribute('href', dataUri);
              link.setAttribute('download', `feed-report-${Date.now()}.json`);
              link.click();
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Exportar JSON
          </button>
          <button
            onClick={() => {
              const report = `
# Relatório de Feeds - ${new Date().toLocaleString()}

## Resumo
- **Total de Feeds**: ${feeds.length}
- **Total de Artigos**: ${articles.length}
- **Feeds Válidos**: ${healthStats.valid}
- **Feeds com Erro**: ${healthStats.invalid}

## Tópicos Mais Frequentes
${topicTrends.slice(0, 5).map((t, i) => `${i + 1}. ${t[0]} (${t[1]} ocorrências)`).join('\n')}

## Feeds Mais Ativos
${activityStats.mostActive.slice(0, 5).map((f, i) => `${i + 1}. ${f[0]} (${f[1]} artigos)`).join('\n')}

## Feeds Sem Atividade
${activityStats.leastActive.slice(0, 5).map((f, i) => `${i + 1}. ${f[0]}`).join('\n')}

---
Relatório gerado automaticamente pelo Personal News
`;
              const dataUri = 'data:text/markdown;charset=utf-8,'+ encodeURIComponent(report);
              const link = document.createElement('a');
              link.setAttribute('href', dataUri);
              link.setAttribute('download', `feed-report-${Date.now()}.md`);
              link.click();
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Exportar Markdown
          </button>
        </div>
      </div>
    </div>
  );
};
