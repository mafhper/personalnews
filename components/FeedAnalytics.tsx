import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Layers3 } from "lucide-react";
import { Article, FeedSource } from "../types";
import { useProxyDashboard } from "../hooks/useProxyDashboard";
import {
  formatFeedRouteLabel,
  getFeedSummaryForCause,
  type FeedFailureCause,
} from "../services/feedDiagnostics";
import { type FeedValidationResult } from "../services/feedValidator";
import { HealthReportExporter } from "./HealthReportExporter";
import { ProxyHealthSummary } from "./ProxyHealthSummary";

interface FeedAnalyticsProps {
  feeds: FeedSource[];
  articles: Article[];
  feedValidations: Map<string, FeedValidationResult>;
  focusSection?: string;
  onFocusConsumed?: () => void;
}

type AnalyticsAccordionSection =
  | "diagnosis"
  | "actions"
  | "affected"
  | "details";

type AffectedFeedRow = {
  url: string;
  title: string;
  host: string;
  status: string;
  articleCount: number;
  route: string;
  error: string;
  action: string;
  cause: FeedFailureCause | "unchecked" | "healthy";
  lastChecked?: number;
  impact: "alto" | "médio" | "baixo";
  isValid: boolean;
};

const SURFACE_CLASS =
  "rounded-[24px] bg-[rgb(var(--theme-manager-surface,var(--theme-surface-readable,var(--color-surface))))] p-5 shadow-[0_24px_52px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.025)]";
const INFO_SURFACE_CLASS =
  "rounded-[24px] border border-[rgb(var(--color-border))]/10 bg-[rgb(var(--theme-manager-bg,var(--color-background)))] p-5 shadow-[0_12px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.025)]";
const MANAGER_CONTROL_CLASS =
  "rounded-full border border-[rgb(var(--color-border))]/14 bg-[rgb(var(--theme-manager-control,var(--theme-control-bg,var(--color-surface))))] px-4 py-2 text-sm font-semibold text-[rgb(var(--theme-manager-text,var(--theme-text-on-surface,var(--color-text))))] transition-all hover:bg-[rgb(var(--theme-manager-soft,var(--theme-control-bg,var(--color-surface))))]";
const MANAGER_SURFACE_CARD_CLASS =
  "rounded-[18px] border border-[rgb(var(--color-border))]/12 bg-[rgb(var(--theme-manager-elevated,var(--theme-surface-elevated,var(--color-surface))))] p-4";

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
  if (!value) return "desconhecido";
  try {
    return new URL(value).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "desconhecido";
  }
};

const formatStatusLabel = (status: string) => status.replace(/_/g, " ");

const formatDateTime = (timestamp?: number) => {
  if (!timestamp) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(timestamp));
};

const statusTone = (status: string) => {
  if (status === "valid") {
    return "border-[rgba(var(--color-success),0.22)] bg-[rgba(var(--color-success),0.12)] text-[rgb(var(--color-success))]";
  }
  if (status === "unchecked") {
    return "border-[rgb(var(--color-border))]/18 bg-[rgb(var(--theme-manager-control,var(--theme-control-bg,var(--color-surface))))] text-[rgb(var(--theme-manager-text-secondary,var(--theme-text-secondary-on-surface,var(--color-textSecondary))))]";
  }
  return "border-[rgba(var(--color-error),0.22)] bg-[rgba(var(--color-error),0.12)] text-[rgb(var(--color-error))]";
};

const impactTone = (impact: AffectedFeedRow["impact"]) => {
  if (impact === "alto") return "text-[rgb(var(--color-error))]";
  if (impact === "médio") return "text-[rgb(var(--color-warning))]";
  return "text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))]";
};

const causeLabels: Record<AffectedFeedRow["cause"], string> = {
  backend_unavailable: "Backend local indisponível",
  proxy_exhausted: "Fallback em nuvem esgotado",
  rate_limited: "Limite de requisições",
  upstream_error: "Servidor do feed com erro",
  parse_error: "Conteúdo inválido para feed",
  network_error: "Erro de rede",
  not_found: "Feed não encontrado",
  timeout: "Tempo limite excedido",
  cors_error: "Bloqueio de CORS",
  invalid_feed: "Feed inválido",
  unknown: "Falha sem classificação",
  unchecked: "Ainda não validado",
  healthy: "Sem problema ativo",
};

const getImpact = (
  articleCount: number,
  isValid: boolean,
): AffectedFeedRow["impact"] => {
  if (isValid) return "baixo";
  if (articleCount >= 5) return "alto";
  if (articleCount > 0) return "médio";
  return "baixo";
};

export const FeedAnalytics: React.FC<FeedAnalyticsProps> = ({
  feeds,
  articles,
  feedValidations,
  focusSection,
  onFocusConsumed,
}) => {
  const { snapshot, refresh } = useProxyDashboard();
  const [showAllRows, setShowAllRows] = useState(false);

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
        .map((label) => normalizeLabel(label))
        .filter(Boolean)
        .forEach((label) => {
          const next = sourceTitleIndex.get(label) || new Set<string>();
          next.add(feedKey);
          sourceTitleIndex.set(label, next);
        });

      const host = safeHostname(feed.url);
      const next = hostIndex.get(host) || new Set<string>();
      next.add(feedKey);
      hostIndex.set(host, next);
    });

    let unmatchedArticles = 0;

    const resolveFeedForArticle = (article: Article) => {
      const directFeedKey = normalizeUrlKey(article.feedUrl);
      if (directFeedKey && countByFeed.has(directFeedKey)) return directFeedKey;

      const sourceLabel = normalizeLabel(article.sourceTitle);
      const titleMatches = sourceTitleIndex.get(sourceLabel);
      if (titleMatches?.size === 1) return Array.from(titleMatches)[0];

      const hostMatches = hostIndex.get(
        safeHostname(article.feedUrl || article.link),
      );
      if (hostMatches?.size === 1) return Array.from(hostMatches)[0];

      return null;
    };

    articles.forEach((article) => {
      const feedKey = resolveFeedForArticle(article);
      if (!feedKey) {
        unmatchedArticles += 1;
        return;
      }
      countByFeed.set(feedKey, (countByFeed.get(feedKey) || 0) + 1);
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

    const topicCounts = new Map<string, number>();
    articles.forEach((article) => {
      article.categories?.forEach((category) => {
        const normalized = category.trim().toLowerCase();
        if (
          normalized.length > 2 &&
          !["uncategorized", "general", "news"].includes(normalized)
        ) {
          topicCounts.set(normalized, (topicCounts.get(normalized) || 0) + 1);
        }
      });
    });

    return {
      countsByFeed: countByFeed,
      matchedArticles: articles.length - unmatchedArticles,
      unmatchedArticles,
      mostActive: sorted.slice(0, 6),
      quietFeeds: sorted.filter((item) => item.count === 0).slice(0, 6),
      topicTrends: Array.from(topicCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8),
    };
  }, [articles, feedValidations, feeds]);

  const affectedRows = useMemo<AffectedFeedRow[]>(() => {
    const statusWeight: Record<string, number> = {
      invalid: 0,
      timeout: 1,
      network_error: 2,
      parse_error: 3,
      cors_error: 4,
      not_found: 5,
      server_error: 6,
      discovery_required: 7,
      checking: 8,
      unchecked: 9,
      valid: 10,
    };

    return feeds
      .map((feed) => {
        const validation = feedValidations.get(feed.url);
        const articleCount =
          activityStats.countsByFeed.get(normalizeUrlKey(feed.url)) || 0;
        const isValid = validation?.isValid ?? false;
        const cause: AffectedFeedRow["cause"] = validation?.diagnostics?.cause
          ? validation.diagnostics.cause
          : validation
            ? isValid
              ? "healthy"
              : "unknown"
            : "unchecked";

        return {
          url: feed.url,
          title: feed.customTitle || validation?.title || feed.url,
          host: safeHostname(feed.url),
          status: validation?.status || "unchecked",
          articleCount,
          route: validation?.route
            ? formatFeedRouteLabel(validation.route)
            : validation?.finalMethod || "Rota não registrada",
          error:
            validation?.diagnostics?.summary ||
            validation?.error ||
            (validation ? "Falha sem detalhe adicional" : "Ainda não validado"),
          action:
            validation?.diagnostics?.action ||
            (validation?.isValid
              ? "Nenhuma ação necessária."
              : "Revalidar o feed e revisar a URL."),
          cause,
          lastChecked: validation?.lastChecked,
          impact: getImpact(articleCount, isValid),
          isValid,
        };
      })
      .sort((a, b) => {
        const weightA = statusWeight[a.status] ?? 99;
        const weightB = statusWeight[b.status] ?? 99;
        if (weightA !== weightB) return weightA - weightB;
        if (a.impact !== b.impact) {
          const impactScore = { alto: 0, médio: 1, baixo: 2 };
          return impactScore[a.impact] - impactScore[b.impact];
        }
        return a.title.localeCompare(b.title);
      });
  }, [activityStats.countsByFeed, feedValidations, feeds]);

  const visibleRows = showAllRows ? affectedRows : affectedRows.slice(0, 8);
  const invalidRows = affectedRows.filter(
    (row) => !row.isValid && row.status !== "unchecked",
  );
  const uncheckedRows = affectedRows.filter(
    (row) => row.status === "unchecked",
  );
  const hasAttentionItems =
    invalidRows.length > 0 ||
    uncheckedRows.length > 0 ||
    snapshot.summary.fallbackActive ||
    snapshot.summary.missingApiKeys.length > 0;

  const diagnosis = useMemo(() => {
    if (snapshot.summary.fallbackActive && snapshot.runtime.warningDetails) {
      return {
        label: snapshot.runtime.warningDetails.summary,
        detail:
          snapshot.runtime.lastWarning ||
          "Fallback em nuvem ativo após falha na rota local.",
        action:
          snapshot.runtime.warningDetails.action ||
          "Verifique o backend local e revalide os feeds afetados.",
      };
    }

    if (invalidRows.length > 0) {
      const counts = invalidRows.reduce<Record<string, number>>((acc, row) => {
        acc[row.cause] = (acc[row.cause] || 0) + 1;
        return acc;
      }, {});
      const topCause = Object.entries(counts).sort(
        (a, b) => b[1] - a[1],
      )[0]?.[0] as FeedFailureCause | undefined;

      if (topCause) {
        const topRow = invalidRows.find((row) => row.cause === topCause);
        return {
          label: causeLabels[topCause],
          detail: topRow?.error || getFeedSummaryForCause(topCause),
          action:
            topRow?.action || "Revalidar os feeds afetados e revisar proxies.",
        };
      }
    }

    if (snapshot.summary.missingApiKeys.length > 0) {
      return {
        label: "Chaves recomendadas ausentes",
        detail: `Configure ${snapshot.summary.missingApiKeys.join(" e ")}.`,
        action: "Abrir Proxies.",
      };
    }

    return {
      label: "Sem falha dominante",
      detail: "Nenhum grupo de erro domina a coleção neste momento.",
      action: "Revalidar se precisar atualizar o status.",
    };
  }, [invalidRows, snapshot]);

  const actionItems = useMemo(() => {
    const items = new Set<string>();

    // Add the main diagnosis action if it exists
    if (diagnosis.action) {
      items.add(diagnosis.action);
    }

    if (snapshot.summary.fallbackActive) {
      items.add(
        snapshot.runtime.warningDetails?.action || "Verificar backend local.",
      );
    }

    if (snapshot.summary.missingApiKeys.length > 0) {
      items.add(`Configurar ${snapshot.summary.missingApiKeys.join(" e ")}.`);
    }

    if (invalidRows.length > 0) {
      items.add(invalidRows[0].action);
    }

    if (uncheckedRows.length > 0) {
      items.add(`Revalidar ${uncheckedRows.length} feeds pendentes.`);
    }

    if (items.size === 0) {
      items.add("Nenhuma ação urgente.");
    }

    return Array.from(items).slice(0, 3);
  }, [diagnosis.action, invalidRows, snapshot, uncheckedRows.length]);

  const exportFeeds = useMemo(
    () =>
      affectedRows.map((row) => ({
        title: row.title,
        url: row.url,
        status: row.status,
        route: row.route,
        error: row.error,
        action: row.action,
        lastFetch: row.lastChecked
          ? new Date(row.lastChecked).toISOString()
          : undefined,
        impact: row.impact,
      })),
    [affectedRows],
  );

  const [openSections, setOpenSections] = useState<
    Record<AnalyticsAccordionSection, boolean>
  >(() => ({
    diagnosis: hasAttentionItems,
    actions: hasAttentionItems,
    affected: hasAttentionItems,
    details: focusSection === "proxy-health" || focusSection === "feed-reports",
  }));

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setOpenSections((current) => ({
        diagnosis: hasAttentionItems ? current.diagnosis || true : false,
        actions: hasAttentionItems ? current.actions || true : false,
        affected: hasAttentionItems ? current.affected || true : false,
        details: current.details,
      }));
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [hasAttentionItems]);

  const toggleSection = (section: AnalyticsAccordionSection) => {
    setOpenSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  };

  useEffect(() => {
    if (!focusSection) return;

    const timer = window.setTimeout(() => {
      setOpenSections((current) => ({
        ...current,
        affected: focusSection === "feed-status" ? true : current.affected,
        details:
          focusSection === "proxy-health" || focusSection === "feed-reports"
            ? true
            : current.details,
      }));
      document.getElementById(focusSection)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      onFocusConsumed?.();
    }, 120);

    return () => window.clearTimeout(timer);
  }, [focusSection, onFocusConsumed]);

  return (
    <div className="space-y-4">
      <section id="diagnostics-overview" className={INFO_SURFACE_CLASS}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-[rgb(var(--theme-text-readable))]">
              Diagnóstico
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusBadge
                label={
                  snapshot.summary.fallbackActive
                    ? "Fallback ativo"
                    : snapshot.backend.enabled
                      ? "Backend local ativo"
                      : "Modo web"
                }
              />
              <StatusBadge
                label={`${invalidRows.length} com erro`}
                tone="danger"
              />
              <StatusBadge
                label={`${uncheckedRows.length} pendentes`}
                tone="warning"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => void refresh()}
            className={MANAGER_CONTROL_CLASS}
          >
            Atualizar
          </button>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-4">
          <StatCard label="Feeds" value={feeds.length} />
          <StatCard label="Com erro" value={invalidRows.length} tone="danger" />
          <StatCard
            label="Pendentes"
            value={uncheckedRows.length}
            tone="warning"
          />
          <StatCard label="Artigos" value={activityStats.matchedArticles} />
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <AccordionSection
          sectionId="diagnosis"
          title="Status da Coleção"
          isOpen={openSections.diagnosis}
          onToggle={() => toggleSection("diagnosis")}
          icon={
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(var(--color-warning),0.1)] text-[rgb(var(--color-warning))]">
              <AlertCircle className="h-4 w-4" />
            </div>
          }
        >
          <div className="rounded-2xl bg-[rgb(var(--theme-manager-control))] p-5 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[rgb(var(--theme-text-secondary-readable))] opacity-50">Problema Dominante</h4>
            <p className="mt-3 text-lg font-bold text-[rgb(var(--theme-text-readable))]">
              {diagnosis.label}
            </p>
            <p className="mt-2 text-sm text-[rgb(var(--theme-text-secondary-readable))] opacity-70">
              {diagnosis.detail}
            </p>
          </div>
        </AccordionSection>

        <AccordionSection
          sectionId="actions"
          title="Próximos Passos"
          isOpen={openSections.actions}
          onToggle={() => toggleSection("actions")}
          icon={
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(var(--color-success),0.1)] text-[rgb(var(--color-success))]">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          }
        >
          <div className="space-y-2.5">
            {actionItems.map((item, idx) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-xl bg-[rgb(var(--theme-manager-control))] px-4 py-3 text-sm font-semibold text-[rgb(var(--theme-text-readable))] shadow-sm"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[rgba(var(--color-accent),0.1)] text-[10px] text-[rgb(var(--color-accent))]">
                  {idx + 1}
                </span>
                {item}
              </div>
            ))}
          </div>
        </AccordionSection>
      </div>

      <AccordionSection
        sectionId="feed-status"
        sectionClassName={SURFACE_CLASS}
        title="Feeds e Impacto"
        isOpen={openSections.affected}
        onToggle={() => toggleSection("affected")}
        icon={
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(var(--color-accent),0.1)] text-[rgb(var(--color-accent))]">
            <Layers3 className="h-4 w-4" />
          </div>
        }
        actions={
          affectedRows.length > 8 && openSections.affected ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setShowAllRows((current) => !current);
              }}
              className="text-xs font-bold text-[rgb(var(--color-accent))] hover:underline"
            >
              {showAllRows ? "Mostrar menos" : `Ver todos (+${affectedRows.length - 8})`}
            </button>
          ) : null
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-y-1.5">
            <thead>
              <tr className="text-left text-[10px] font-bold uppercase tracking-widest text-[rgb(var(--theme-text-secondary-readable))] opacity-40">
                <th className="px-4 py-2">Feed</th>
                <th className="px-4 py-2">Infra / Rota</th>
                <th className="px-4 py-2">Status / Erro</th>
                <th className="px-4 py-2 text-right">Impacto</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr
                  key={row.url}
                  className="group rounded-xl bg-[rgb(var(--theme-manager-control))] transition-all hover:bg-[rgb(var(--theme-manager-soft))]"
                >
                  <td className="rounded-l-xl px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-[rgb(var(--theme-text-readable))] truncate max-w-[180px]">
                        {row.title}
                      </span>
                      <span className="text-[10px] font-mono text-[rgb(var(--theme-text-secondary-readable))] opacity-50 truncate max-w-[180px]">
                        {row.host}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-[rgb(var(--theme-text-readable))]">
                        {row.route}
                      </span>
                      <span className="text-[10px] text-[rgb(var(--theme-text-secondary-readable))] opacity-50">
                        {formatDateTime(row.lastChecked)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusTone(
                          row.status,
                        )}`}
                      >
                        {formatStatusLabel(row.status)}
                      </span>
                      <span className="max-w-[14rem] truncate text-xs text-[rgb(var(--theme-text-secondary-readable))] opacity-70">
                        {row.error}
                      </span>
                    </div>
                  </td>
                  <td className="rounded-r-xl px-4 py-3 text-right">
                    <div
                      className={`text-xs font-bold uppercase tracking-widest ${impactTone(row.impact)}`}
                    >
                      {row.impact}
                    </div>
                    <div className="text-[10px] font-bold text-[rgb(var(--theme-text-secondary-readable))] opacity-40">
                      {row.articleCount} arts.
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!showAllRows && affectedRows.length > 8 && (
            <div
              onClick={() => setShowAllRows(true)}
              className="mt-2 flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-[rgba(var(--color-border),0.15)] py-2 text-[10px] font-bold uppercase tracking-widest text-[rgb(var(--theme-text-secondary-readable))] opacity-40 hover:opacity-100 transition-opacity"
            >
              Expandir Tabela de Impacto
            </div>
          )}
        </div>
      </AccordionSection>

      <AccordionSection
        title="Detalhes"
        isOpen={openSections.details}
        onToggle={() => toggleSection("details")}
      >
        <div className="space-y-4">
          <section id="proxy-health" className={MANAGER_SURFACE_CARD_CLASS}>
            <div className="mb-4 flex items-center gap-2">
              <Layers3 className="h-5 w-5 text-[rgb(var(--color-primary))]" />
              <h5 className="text-sm font-semibold text-[rgb(var(--theme-text-readable))]">
                Proxies
              </h5>
            </div>
            <ProxyHealthSummary snapshot={snapshot} />
          </section>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
            <section id="feed-reports" className={MANAGER_SURFACE_CARD_CLASS}>
              <h5 className="text-sm font-semibold text-[rgb(var(--theme-text-readable))]">
                Exportar relatório
              </h5>
              <div className="mt-4">
                <HealthReportExporter
                  feeds={exportFeeds}
                  feedValidations={feedValidations}
                  snapshot={snapshot}
                />
              </div>
            </section>

            <section className={MANAGER_SURFACE_CARD_CLASS}>
              <h5 className="text-sm font-semibold text-[rgb(var(--theme-text-readable))]">
                Atividade
              </h5>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <MiniStat
                  label="Associados"
                  value={activityStats.matchedArticles}
                />
                <MiniStat
                  label="Sem vínculo"
                  value={activityStats.unmatchedArticles}
                />
              </div>

              {activityStats.topicTrends.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {activityStats.topicTrends.map(([topic, count]) => (
                    <span
                      key={topic}
                      className="rounded-full border border-[rgb(var(--color-border))]/12 bg-[rgb(var(--theme-manager-control,var(--theme-control-bg,var(--color-surface))))] px-3 py-1 text-xs text-[rgb(var(--theme-manager-text-secondary,var(--theme-text-secondary-on-surface,var(--color-textSecondary))))]"
                    >
                      #{topic} ({count})
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-4 space-y-2">
                {activityStats.quietFeeds.slice(0, 4).map((feed) => (
                  <div
                    key={feed.feedKey}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="truncate text-[rgb(var(--theme-text-readable))]">
                      {feed.label}
                    </span>
                    <span className="text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))]">
                      0 artigos
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </AccordionSection>
    </div>
  );
};

const AccordionSection: React.FC<{
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  sectionId?: string;
  sectionClassName?: string;
}> = ({
  title,
  isOpen,
  onToggle,
  children,
  icon,
  actions,
  sectionId,
  sectionClassName = INFO_SURFACE_CLASS,
}) => (
  <section id={sectionId} className={sectionClassName}>
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex items-center justify-between gap-3 text-left"
      >
        <span className="flex items-center gap-2">
          {icon}
          <span className="text-base font-semibold text-[rgb(var(--theme-text-readable))]">
            {title}
          </span>
        </span>
        <span
          aria-hidden="true"
          className={`text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))] transition-transform ${isOpen ? "rotate-180" : ""}`}
        >
          ▾
        </span>
      </button>
      {actions}
    </div>

    {isOpen && <div className="mt-4">{children}</div>}
  </section>
);

const StatusBadge: React.FC<{
  label: string;
  tone?: "default" | "warning" | "danger";
}> = ({ label, tone = "default" }) => (
  <span
    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
      tone === "danger"
        ? "bg-[rgba(var(--color-error),0.1)] text-[rgb(var(--color-error))]"
        : tone === "warning"
          ? "bg-[rgba(var(--color-warning),0.12)] text-[rgb(var(--color-warning))]"
          : "bg-[rgb(var(--theme-manager-control,var(--theme-control-bg,var(--color-surface))))] text-[rgb(var(--theme-manager-text-secondary,var(--theme-text-secondary-on-surface,var(--color-textSecondary))))]"
    }`}
  >
    {label}
  </span>
);

const StatCard: React.FC<{
  label: string;
  value: number;
  tone?: "default" | "warning" | "danger";
}> = ({ label, value, tone = "default" }) => (
  <div
    className={`rounded-[18px] p-4 ${
      tone === "danger"
        ? "bg-[rgba(var(--color-error),0.1)]"
        : tone === "warning"
          ? "bg-[rgba(var(--color-warning),0.1)]"
          : "bg-[rgb(var(--theme-manager-control,var(--theme-control-bg,var(--color-surface))))]"
    }`}
  >
    <p className="text-[11px] uppercase tracking-[0.16em] text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))]">
      {label}
    </p>
    <p className="mt-2 text-xl font-semibold text-[rgb(var(--theme-text-readable))]">
      {value}
    </p>
  </div>
);

const MiniStat: React.FC<{
  label: string;
  value: number;
}> = ({ label, value }) => (
  <div className="rounded-[16px] border border-[rgb(var(--color-border))]/12 bg-[rgb(var(--theme-manager-control,var(--theme-control-bg,var(--color-surface))))] p-4">
    <p className="text-[11px] uppercase tracking-[0.14em] text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))]">
      {label}
    </p>
    <p className="mt-2 text-lg font-semibold text-[rgb(var(--theme-text-readable))]">
      {value}
    </p>
  </div>
);
