import React, { useEffect, useMemo, useState } from "react";
import { Article, FeedSource } from "../types";
import { FeedValidationResult } from "../services/feedValidator";
import { ProxyHealthSummary } from "./ProxyHealthSummary";
import { HealthReportExporter } from "./HealthReportExporter";

interface FeedAnalyticsProps {
  feeds: FeedSource[];
  articles: Article[];
  feedValidations: Map<string, FeedValidationResult>;
  focusSection?: string;
  onFocusConsumed?: () => void;
}

type AccordionSection = "validation" | "insights" | "health" | "tools";

const SURFACE_CLASS =
  "overflow-hidden rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.022))] shadow-[0_24px_70px_rgba(0,0,0,0.2)] backdrop-blur-xl";
const PANEL_CLASS =
  "rounded-[22px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.018))] transition-all duration-300 shadow-[0_18px_46px_rgba(0,0,0,0.14)] hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.026))]";
const MUTED_TEXT_CLASS =
  "text-[rgb(var(--theme-text-secondary-readable))] opacity-90";
const TITLE_TEXT_CLASS =
  "text-[rgb(var(--theme-text-readable))] font-bold";

const normalizeLabel = (value?: string) =>
  (value || "").trim().toLowerCase().replace(/\s+/g, " ");

const normalizeUrlKey = (value?: string) => {
  if (!value) return "";
  try {
    const parsed = new URL(value);
    parsed.hash = "";
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return value.trim().replace(/\/$/, "");
  }
};

const safeHostname = (value?: string) => {
  if (!value) return null;
  try {
    return new URL(value).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
};

const formatStatusLabel = (status: string) => status.replace(/_/g, " ");

const getStatusTone = (status: string) => {
  if (status === "valid") return "border-[rgba(var(--color-success),0.2)] bg-[rgba(var(--color-success),0.1)] text-[rgb(var(--color-success))]";
  if (status === "unchecked") return "border-[rgba(var(--color-primary),0.2)] bg-[rgba(var(--color-primary),0.1)] text-[rgb(var(--color-primary))]";
  return "border-[rgba(var(--color-warning),0.2)] bg-[rgba(var(--color-warning),0.1)] text-[rgb(var(--color-warning))]";
};

const downloadTextFile = (content: string, mimeType: string, filename: string) => {
  const link = document.createElement("a");
  link.setAttribute("href", `data:${mimeType};charset=utf-8,${encodeURIComponent(content)}`);
  link.setAttribute("download", filename);
  link.click();
};

const Accordion: React.FC<{
  section: AccordionSection;
  expandedSection: AccordionSection | null;
  onToggle: (section: AccordionSection) => void;
  title: string;
  description: string;
  badge?: string;
  children: React.ReactNode;
}> = ({ section, expandedSection, onToggle, title, description, badge, children }) => {
  const isExpanded = expandedSection === section;

  return (
    <section className={SURFACE_CLASS}>
      <button
        type="button"
        onClick={() => onToggle(section)}
        className="flex w-full items-start justify-between gap-4 px-5 py-5 text-left sm:px-6"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className={`text-lg font-semibold ${TITLE_TEXT_CLASS}`}>{title}</h3>
            {badge && (
              <span className="rounded-full border border-white/8 bg-white/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))]">
                {badge}
              </span>
            )}
          </div>
          <p className={`mt-2 text-sm leading-relaxed ${MUTED_TEXT_CLASS}`}>{description}</p>
        </div>
        <span className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/8 bg-white/5 text-[rgb(var(--theme-text-secondary-readable))] transition-all hover:bg-white/8">
          <svg
            className={`h-5 w-5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      {isExpanded && (
        <div className="border-t border-white/8 px-5 py-5 sm:px-6">
          {children}
        </div>
      )}
    </section>
  );
};

const MetricCard: React.FC<{
  label: string;
  value: string | number;
  hint?: string;
  tone?: "neutral" | "success" | "warning" | "danger";
}> = ({ label, value, hint, tone = "neutral" }) => {
  const toneClass =
    tone === "success"
      ? "text-[rgb(var(--color-success))]"
      : tone === "warning"
        ? "text-[rgb(var(--color-warning))]"
        : tone === "danger"
          ? "text-[rgb(var(--color-error))]"
          : TITLE_TEXT_CLASS;

  return (
    <div className={`${PANEL_CLASS} flex h-full flex-col justify-between p-6 group`}>
      <div className="flex items-center justify-between gap-3">
        <div className={`text-[10px] uppercase tracking-[0.25em] font-black ${MUTED_TEXT_CLASS} opacity-60 group-hover:opacity-100 transition-opacity`}>
          {label}
        </div>
        <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
      </div>
      <div className="mt-4">
        <div className={`text-4xl font-extrabold tracking-tight ${toneClass}`}>{value}</div>
        {hint && <div className={`mt-2 text-[11px] ${MUTED_TEXT_CLASS} font-medium`}>{hint}</div>}
      </div>
    </div>
  );
};

export const FeedAnalytics: React.FC<FeedAnalyticsProps> = ({
  feeds,
  articles,
  feedValidations,
  focusSection,
  onFocusConsumed,
}) => {
  const [expandedSection, setExpandedSection] = useState<AccordionSection | null>("validation");
  const [showAllRows, setShowAllRows] = useState(false);
  const [showAllIssues, setShowAllIssues] = useState(false);

  const activityStats = useMemo(() => {
    const countByFeed = new Map<string, number>();
    const labelByFeed = new Map<string, string>();
    const sourceTitleIndex = new Map<string, Set<string>>();
    const hostIndex = new Map<string, Set<string>>();

    feeds.forEach((feed) => {
      const feedKey = normalizeUrlKey(feed.url);
      const validation = feedValidations.get(feed.url);
      const displayLabel = feed.customTitle || validation?.title || feed.url;

      countByFeed.set(feedKey, 0);
      labelByFeed.set(feedKey, displayLabel);

      [feed.customTitle, validation?.title, safeHostname(feed.url)]
        .map((label) => normalizeLabel(label || undefined))
        .filter(Boolean)
        .forEach((label) => {
          const next = sourceTitleIndex.get(label) || new Set<string>();
          next.add(feedKey);
          sourceTitleIndex.set(label, next);
        });

      const host = safeHostname(feed.url);
      if (host) {
        const next = hostIndex.get(host) || new Set<string>();
        next.add(feedKey);
        hostIndex.set(host, next);
      }
    });

    let unmatchedArticles = 0;

    const resolveFeedForArticle = (article: Article) => {
      const directFeedKey = normalizeUrlKey(article.feedUrl);
      if (directFeedKey && countByFeed.has(directFeedKey)) return directFeedKey;

      const sourceLabel = normalizeLabel(article.sourceTitle);
      const titleMatches = sourceTitleIndex.get(sourceLabel);
      if (titleMatches?.size === 1) return Array.from(titleMatches)[0];

      const articleHost = safeHostname(article.feedUrl || article.link);
      const hostMatches = articleHost ? hostIndex.get(articleHost) : null;
      if (hostMatches?.size === 1) return Array.from(hostMatches)[0];

      return null;
    };

    articles.forEach((article) => {
      const resolvedFeedKey = resolveFeedForArticle(article);
      if (!resolvedFeedKey) {
        unmatchedArticles += 1;
        return;
      }

      countByFeed.set(resolvedFeedKey, (countByFeed.get(resolvedFeedKey) || 0) + 1);
    });

    const sorted = Array.from(countByFeed.entries())
      .map(([feedKey, count]) => ({
        feedKey,
        count,
        label: labelByFeed.get(feedKey) || feedKey,
      }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.label.localeCompare(b.label);
      });

    return {
      countsByFeed: countByFeed,
      totalArticles: articles.length,
      matchedArticles: articles.length - unmatchedArticles,
      unmatchedArticles,
      mostActive: sorted.slice(0, 6),
      leastActive: sorted.filter((item) => item.count === 0).slice(0, 6),
    };
  }, [articles, feedValidations, feeds]);

  const topicTrends = useMemo(() => {
    const counts = new Map<string, number>();

    articles.forEach((article) => {
      article.categories?.forEach((category) => {
        const normalized = category.trim().toLowerCase();
        if (normalized.length > 2 && !["uncategorized", "general", "news"].includes(normalized)) {
          counts.set(normalized, (counts.get(normalized) || 0) + 1);
        }
      });
    });

    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 12);
  }, [articles]);

  const healthStats = useMemo(() => {
    let valid = 0;
    let invalid = 0;
    let unchecked = 0;
    const issues: Array<{
      url: string;
      title: string;
      error: string;
      status: string;
      articleCount: number;
    }> = [];

    feeds.forEach((feed) => {
      const validation = feedValidations.get(feed.url);
      const articleCount = activityStats.countsByFeed.get(normalizeUrlKey(feed.url)) || 0;

      if (!validation) {
        unchecked += 1;
        return;
      }

      if (validation.isValid) {
        valid += 1;
        return;
      }

      invalid += 1;
      issues.push({
        url: feed.url,
        title: feed.customTitle || validation.title || feed.url,
        error: validation.error || "Erro desconhecido",
        status: validation.status || "invalid",
        articleCount,
      });
    });

    return { valid, invalid, unchecked, issues };
  }, [activityStats.countsByFeed, feedValidations, feeds]);

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
          articleCount: activityStats.countsByFeed.get(normalizeUrlKey(feed.url)) || 0,
        };
      })
      .sort((a, b) => {
        if (a.statusWeight !== b.statusWeight) return a.statusWeight - b.statusWeight;
        if (b.articleCount !== a.articleCount) return b.articleCount - a.articleCount;
        return a.title.localeCompare(b.title);
      });
  }, [activityStats.countsByFeed, feedValidations, feeds]);

  const visibleRows = showAllRows ? feedRows : feedRows.slice(0, 8);
  const visibleIssues = showAllIssues ? healthStats.issues : healthStats.issues.slice(0, 6);
  const totalFeedsSafe = Math.max(feeds.length, 1);

  useEffect(() => {
    if (!focusSection) return;

    const focusMap: Partial<Record<string, AccordionSection>> = {
      "feed-status": "validation",
      "proxy-health": "tools",
      "feed-reports": "tools",
    };

    const timer = window.setTimeout(() => {
      const sectionToOpen = focusMap[focusSection];
      if (sectionToOpen) {
        setExpandedSection(sectionToOpen);
      }

      document.getElementById(focusSection)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      onFocusConsumed?.();
    }, 180);

    return () => window.clearTimeout(timer);
  }, [focusSection, onFocusConsumed]);

  const toggleSection = (section: AccordionSection) => {
    setExpandedSection((current) => (current === section ? null : section));
  };

  const exportJsonReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      feedCount: feeds.length,
      articleCount: articles.length,
      matchedArticles: activityStats.matchedArticles,
      unmatchedArticles: activityStats.unmatchedArticles,
      validFeeds: healthStats.valid,
      invalidFeeds: healthStats.invalid,
      uncheckedFeeds: healthStats.unchecked,
      topicTrends: topicTrends.slice(0, 6),
      mostActive: activityStats.mostActive.slice(0, 6),
    };

    downloadTextFile(JSON.stringify(report, null, 2), "application/json", `feed-report-${Date.now()}.json`);
  };

  const exportMarkdownReport = () => {
    const report = `# Relatório de Feeds - ${new Date().toLocaleString()}

## Resumo
- Total de feeds: ${feeds.length}
- Total de artigos no cache: ${articles.length}
- Artigos associados com segurança: ${activityStats.matchedArticles}
- Artigos sem vínculo confiável: ${activityStats.unmatchedArticles}
- Feeds válidos: ${healthStats.valid}
- Feeds com erro: ${healthStats.invalid}
- Feeds pendentes: ${healthStats.unchecked}

## Tópicos mais frequentes
${topicTrends.slice(0, 6).map((topic, index) => `${index + 1}. ${topic[0]} (${topic[1]})`).join("\n")}

## Feeds mais ativos
${activityStats.mostActive.slice(0, 6).map((feed, index) => `${index + 1}. ${feed.label} (${feed.count} artigos)`).join("\n")}

## Feeds sem atividade
${activityStats.leastActive.slice(0, 6).map((feed, index) => `${index + 1}. ${feed.label}`).join("\n")}
`;

    downloadTextFile(report, "text/markdown", `feed-report-${Date.now()}.md`);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5 shadow-[0_24px_72px_rgba(0,0,0,0.18)]">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[rgb(var(--theme-text-secondary-readable))]">
              Panorama Operacional
            </div>
            <h3 className={`text-xl font-semibold ${TITLE_TEXT_CLASS}`}>Leitura rápida da saúde e da atividade do seu ecossistema de feeds.</h3>
            <p className={`mt-2 text-sm leading-relaxed ${MUTED_TEXT_CLASS}`}>
              Esta aba resume validação, volume de conteúdo, temas recorrentes e ferramentas de diagnóstico sem transformar tudo em uma parede de métricas.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-white/8 bg-white/6 px-3 py-1.5 text-xs font-medium text-[rgb(var(--theme-text-readable))]/92">
              {feeds.length} feeds monitorados
            </span>
            <span className="rounded-full border border-white/8 bg-black/10 px-3 py-1.5 text-xs text-[rgb(var(--color-textSecondary))]">
              {articles.length} artigos no cache
            </span>
            {healthStats.invalid > 0 && (
              <span className="rounded-full border border-rose-500/20 bg-rose-500/12 px-3 py-1.5 text-xs font-medium text-rose-200">
                {healthStats.invalid} com atenção
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Feeds monitorados" value={feeds.length} hint="Base total cadastrada" />
        <MetricCard
          label="Artigos associados"
          value={activityStats.matchedArticles}
          hint={`${activityStats.totalArticles} no cache`}
          tone="success"
        />
        <MetricCard
          label="Feeds com erro"
          value={healthStats.invalid}
          hint="Precisam de revisão"
          tone={healthStats.invalid > 0 ? "danger" : "success"}
        />
        <MetricCard
          label="Pendentes"
          value={healthStats.unchecked}
          hint="Ainda não verificados"
          tone={healthStats.unchecked > 0 ? "warning" : "neutral"}
        />
        </div>
      </div>

      <Accordion
        section="validation"
        expandedSection={expandedSection}
        onToggle={toggleSection}
        title="Validação dos feeds"
        description="Visão operacional do que está saudável, do que precisa de ação e do que ainda não foi verificado."
        badge={`${feedRows.length} feeds`}
      >
        <div id="feed-status" className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard label="Válidos" value={healthStats.valid} tone="success" />
            <MetricCard label="Com erro" value={healthStats.invalid} tone="danger" />
            <MetricCard label="Pendentes" value={healthStats.unchecked} tone="warning" />
            <MetricCard label="Sem atividade" value={activityStats.leastActive.length} hint="Entre os exibidos" />
          </div>

          <div className={`${PANEL_CLASS} p-5`}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h4 className={`text-sm font-semibold ${TITLE_TEXT_CLASS}`}>Distribuição de status</h4>
                <p className={`mt-1 text-xs ${MUTED_TEXT_CLASS}`}>Uma barra composta para leitura rápida, sem espalhar números em excesso.</p>
              </div>
            </div>
            <div className="flex h-3 overflow-hidden rounded-full bg-[rgba(var(--color-text),0.1)]">
              <div className="bg-[rgb(var(--color-success))] transition-all duration-500" style={{ width: `${(healthStats.valid / totalFeedsSafe) * 100}%` }} title="Válidos" />
              <div className="bg-[rgb(var(--color-warning))] transition-all duration-500" style={{ width: `${(healthStats.invalid / totalFeedsSafe) * 100}%` }} title="Com erro" />
              <div className="bg-[rgb(var(--color-primary))] transition-all duration-500" style={{ width: `${(healthStats.unchecked / totalFeedsSafe) * 100}%` }} title="Pendentes" />
            </div>
            <div className={`mt-3 flex flex-wrap gap-3 text-xs ${MUTED_TEXT_CLASS}`}>
              <span>Válidos: {healthStats.valid}</span>
              <span>Com erro: {healthStats.invalid}</span>
              <span>Pendentes: {healthStats.unchecked}</span>
            </div>
          </div>

          <div className="space-y-3">
            {visibleRows.map((row) => (
              <div key={row.url} className={`${PANEL_CLASS} flex flex-col gap-3 p-5 lg:flex-row lg:items-start lg:justify-between`}>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className={`truncate text-sm font-semibold ${TITLE_TEXT_CLASS}`}>{row.title}</h4>
                    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${getStatusTone(row.status)}`}>
                      {formatStatusLabel(row.status)}
                    </span>
                  </div>
                  <p className={`mt-1 break-all text-xs ${MUTED_TEXT_CLASS}`}>{row.url}</p>
                  {row.error && <p className="mt-2 text-xs text-[rgba(var(--color-warning),0.9)]">{row.error}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4 lg:min-w-[24rem]">
                  <div>
                    <div className={MUTED_TEXT_CLASS}>Artigos</div>
                    <div className={`mt-1 font-semibold ${TITLE_TEXT_CLASS}`}>{row.articleCount}</div>
                  </div>
                  <div>
                    <div className={MUTED_TEXT_CLASS}>Latência</div>
                    <div className={`mt-1 font-semibold ${TITLE_TEXT_CLASS}`}>
                      {row.responseTime !== undefined && row.responseTime !== null ? `${row.responseTime} ms` : "-"}
                    </div>
                  </div>
                  <div>
                    <div className={MUTED_TEXT_CLASS}>Método</div>
                    <div className={`mt-1 font-semibold ${TITLE_TEXT_CLASS}`}>
                      {row.proxyUsed ? `${row.method} • ${row.proxyUsed}` : row.method}
                    </div>
                  </div>
                  <div>
                    <div className={MUTED_TEXT_CLASS}>Última verificação</div>
                    <div className={`mt-1 font-semibold ${TITLE_TEXT_CLASS}`}>
                      {row.lastChecked ? new Date(row.lastChecked).toLocaleString() : "-"}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {feedRows.length > 8 && (
            <button
              type="button"
              onClick={() => setShowAllRows((current) => !current)}
              className="rounded-full border border-white/8 bg-white/5 px-4 py-2 text-sm font-medium text-[rgb(var(--theme-text-readable))] transition-all hover:bg-white/9"
            >
              {showAllRows ? "Mostrar menos" : `Mostrar todos os ${feedRows.length} feeds`}
            </button>
          )}
        </div>
      </Accordion>

      <Accordion
        section="insights"
        expandedSection={expandedSection}
        onToggle={toggleSection}
        title="Conteúdo e atividade"
        description="Tópicos recorrentes e frequência real por feed, usando vínculo conservador para evitar contagens infladas."
        badge={`${activityStats.matchedArticles} artigos associados`}
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)]">
          <div className="space-y-4">
            <div className={`${PANEL_CLASS} p-5`}>
              <div className="flex items-center justify-between gap-3">
                <h4 className={`text-sm font-semibold ${TITLE_TEXT_CLASS}`}>Assuntos mais frequentes</h4>
                <span className={`text-xs ${MUTED_TEXT_CLASS}`}>{topicTrends.length} tópicos</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {topicTrends.length > 0 ? (
                  topicTrends.map(([topic, count], index) => (
                    <span
                      key={topic}
                      className={`rounded-full border px-3 py-1 text-xs ${
                        index < 3
                          ? "border-[rgba(var(--color-accent),0.24)] bg-[rgba(var(--color-accent),0.12)] text-[rgb(var(--theme-text-on-surface,var(--color-text)))]"
                          : "border-[rgb(var(--color-border))]/20 bg-[rgba(var(--color-text),0.05)] text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))]"
                      }`}
                    >
                      #{topic} <span className="opacity-70">({count})</span>
                    </span>
                  ))
                ) : (
                  <p className={`text-sm italic ${MUTED_TEXT_CLASS}`}>Ainda não há dados suficientes para extrair tendências.</p>
                )}
              </div>
            </div>

            <div className={`${PANEL_CLASS} p-5`}>
              <div className="flex items-center justify-between gap-3">
                <h4 className={`text-sm font-semibold ${TITLE_TEXT_CLASS}`}>Feeds mais ativos</h4>
                <span className={`text-xs ${MUTED_TEXT_CLASS}`}>Top 6</span>
              </div>
              <div className="mt-4 space-y-3">
                {activityStats.mostActive.map((feed, index) => (
                  <div key={feed.feedKey} className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className={`text-xs ${MUTED_TEXT_CLASS}`}>#{index + 1}</div>
                      <div className={`truncate text-sm font-medium ${TITLE_TEXT_CLASS}`}>{feed.label}</div>
                    </div>
                    <span className="rounded-full border border-[rgba(var(--color-success),0.2)] bg-[rgba(var(--color-success),0.1)] px-3 py-1 text-xs font-semibold text-[rgb(var(--color-success))] shadow-sm">
                      {feed.count} artigos
                    </span>
                  </div>
                ))}
                {activityStats.mostActive.length === 0 && (
                  <p className={`text-sm italic ${MUTED_TEXT_CLASS}`}>Nenhuma atividade consolidada ainda.</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className={`${PANEL_CLASS} p-5`}>
              <h4 className={`text-sm font-semibold ${TITLE_TEXT_CLASS}`}>Qualidade da contagem</h4>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <MetricCard label="Associados com segurança" value={activityStats.matchedArticles} tone="success" />
                <MetricCard
                  label="Sem vínculo confiável"
                  value={activityStats.unmatchedArticles}
                  tone={activityStats.unmatchedArticles > 0 ? "warning" : "neutral"}
                />
              </div>
              <p className={`mt-4 text-sm leading-relaxed ${MUTED_TEXT_CLASS}`}>
                Para reduzir falsos positivos, a contagem prioriza `feedUrl` exato, depois títulos exclusivos e só então hostname exato quando ele aponta para um único feed.
              </p>
            </div>

            <div className={`${PANEL_CLASS} p-5`}>
              <div className="flex items-center justify-between gap-3">
                <h4 className={`text-sm font-semibold ${TITLE_TEXT_CLASS}`}>Sem atividade</h4>
                <span className={`text-xs ${MUTED_TEXT_CLASS}`}>Top 6</span>
              </div>
              <div className="mt-4 space-y-3">
                {activityStats.leastActive.map((feed) => (
                  <div key={feed.feedKey} className="flex items-center justify-between gap-4">
                    <span className={`truncate text-sm ${TITLE_TEXT_CLASS}`}>{feed.label}</span>
                    <span className="rounded-full border border-[rgb(var(--color-border))]/20 bg-[rgba(var(--color-text),0.05)] px-3 py-1 text-xs font-semibold text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))]">
                      0 artigos
                    </span>
                  </div>
                ))}
                {activityStats.leastActive.length === 0 && (
                  <p className={`text-sm italic ${MUTED_TEXT_CLASS}`}>Todos os feeds exibidos tiveram alguma atividade recente.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </Accordion>

      <Accordion
        section="health"
        expandedSection={expandedSection}
        onToggle={toggleSection}
        title="Alertas e revisão"
        description="Lista curta e priorizada dos feeds com falha para facilitar triagem, em vez de uma parede de erros."
        badge={healthStats.issues.length > 0 ? `${healthStats.issues.length} alertas` : "sem alertas"}
      >
        <div className="space-y-4">
          {healthStats.issues.length > 0 ? (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <MetricCard label="Falhas" value={healthStats.invalid} hint="Feeds com erro ativo" tone="danger" />
                <MetricCard label="Pendentes" value={healthStats.unchecked} hint="Ainda sem validação" tone="warning" />
                <MetricCard label="Saudáveis" value={healthStats.valid} hint="Feeds válidos" tone="success" />
              </div>

              <div className="space-y-3">
                {visibleIssues.map((issue) => (
                  <div key={issue.url} className={`${PANEL_CLASS} p-5`}>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className={`text-sm font-semibold ${TITLE_TEXT_CLASS}`}>{issue.title}</h4>
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${getStatusTone(issue.status)}`}>
                        {formatStatusLabel(issue.status)}
                      </span>
                    </div>
                    <p className={`mt-1 break-all text-xs ${MUTED_TEXT_CLASS}`}>{issue.url}</p>
                    <p className="mt-3 text-sm text-[rgba(var(--color-warning),0.9)]">{issue.error}</p>
                    <div className={`mt-3 text-xs ${MUTED_TEXT_CLASS}`}>Artigos associados: {issue.articleCount}</div>
                  </div>
                ))}
              </div>

              {healthStats.issues.length > 6 && (
                <button
                  type="button"
                  onClick={() => setShowAllIssues((current) => !current)}
                  className="rounded-full border border-white/8 bg-white/5 px-4 py-2 text-sm font-medium text-[rgb(var(--theme-text-readable))] transition-all hover:bg-white/9"
                >
                  {showAllIssues ? "Mostrar menos alertas" : `Mostrar todos os ${healthStats.issues.length} alertas`}
                </button>
              )}
            </>
          ) : (
            <div className="rounded-[2rem] border border-[rgba(var(--color-success),0.18)] bg-[linear-gradient(180deg,rgba(var(--color-success),0.06),rgba(255,255,255,0.02))] px-8 py-10 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[rgba(var(--color-success),0.3)] bg-[rgba(var(--color-success),0.1)] text-[rgb(var(--color-success))] shadow-lg">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-[rgb(var(--color-success))]">Saúde Impecável</h4>
              <p className="mt-3 text-sm text-[rgb(var(--theme-text-secondary-readable))] max-w-sm mx-auto">A validação atual não encontrou feeds quebrados ou pendentes na sua coleção.</p>
            </div>
          )}
        </div>
      </Accordion>

      <Accordion
        section="tools"
        expandedSection={expandedSection}
        onToggle={toggleSection}
        title="Proxy e relatórios"
        description="Ferramentas operacionais agrupadas numa única seção recolhível para reduzir ruído visual na guia."
        badge="utilitários"
      >
        <div className="space-y-6">
          <div id="proxy-health" className="space-y-3">
            <div>
              <h4 className={`text-sm font-semibold ${TITLE_TEXT_CLASS}`}>Saúde dos proxies</h4>
              <p className={`mt-1 text-sm ${MUTED_TEXT_CLASS}`}>
                Status, latência e taxa de sucesso dos caminhos de fetch configurados.
              </p>
            </div>
            <div className={PANEL_CLASS}>
              <div className="p-5">
                <ProxyHealthSummary />
              </div>
            </div>
          </div>

          <div id="feed-reports" className="space-y-3">
            <div>
              <h4 className={`text-sm font-semibold ${TITLE_TEXT_CLASS}`}>Relatórios de saúde</h4>
              <p className={`mt-1 text-sm ${MUTED_TEXT_CLASS}`}>
                Exporte o estado atual da sua base sem espalhar esses controles pelo restante da tela.
              </p>
            </div>
            <div className={`${PANEL_CLASS} p-5`}>
              <HealthReportExporter />
            </div>
          </div>

          <div className={`${PANEL_CLASS} p-5`}>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={exportJsonReport}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[rgba(var(--color-primary),0.3)] bg-[rgba(var(--color-primary),0.1)] px-5 py-2 text-sm font-semibold text-[rgb(var(--color-primary))] transition-all hover:bg-[rgba(var(--color-primary),0.18)]"
              >
                Exportar JSON
              </button>
              <button
                type="button"
                onClick={exportMarkdownReport}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[rgba(var(--color-success),0.3)] bg-[rgba(var(--color-success),0.1)] px-5 py-2 text-sm font-semibold text-[rgb(var(--color-success))] transition-all hover:bg-[rgba(var(--color-success),0.18)]"
              >
                Exportar Markdown
              </button>
            </div>
          </div>
        </div>
      </Accordion>
    </div>
  );
};
