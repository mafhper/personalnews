import React, { useMemo } from 'react';
import { Article, FeedSource } from '../types';
import { FeedValidationResult } from '../services/feedValidator';
import { Card } from './ui/Card';

interface FeedAnalyticsProps {
  feeds: FeedSource[];
  articles: Article[];
  feedValidations: Map<string, FeedValidationResult>;
}

export const FeedAnalytics: React.FC<FeedAnalyticsProps> = ({
  feeds,
  articles,
  feedValidations
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
    </div>
  );
};
