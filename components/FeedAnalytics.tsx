import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Layers3,
  ShieldAlert,
} from "lucide-react";
import { Article, FeedCategory, FeedSource } from "../types";
import { useProxyDashboard } from "../hooks/useProxyDashboard";
import {
  formatFeedRouteLabel,
  getFeedSummaryForCause,
  type FeedFailureCause,
} from "../services/feedDiagnostics";
import { type FeedValidationResult } from "../services/feedValidator";
import { HealthReportExporter } from "./HealthReportExporter";
import {
  managerControlSurfaceClass,
  managerInfoSurfaceClass,
  managerSecondaryButtonClass,
  managerSurfaceClass,
} from "./FeedManager/feedManagerStyles";
import { FeedManagerAccordionSection } from "./FeedManager/FeedManagerAccordionSection";
import { FeedManagerSectionHeader } from "./FeedManager/FeedManagerSectionHeader";
import { ProxySettings } from "./ProxySettings";

interface FeedAnalyticsProps {
  feeds: FeedSource[];
  articles: Article[];
  feedValidations: Map<string, FeedValidationResult>;
  view?: "overview" | "health" | "infra" | "reports" | "all";
  expandedSections?: Partial<Record<FeedAnalyticsOuterSection, boolean>>;
  onToggleSection?: (section: FeedAnalyticsOuterSection) => void;
  focusSection?: string;
  onFocusConsumed?: () => void;
  quarantineRecommendedUrls?: Set<string>;
  onQuarantineFeed?: (url: string) => void;
  categories?: FeedCategory[];
  onRetryFeeds?: (urls: string[]) => void | Promise<void>;
  onQuarantineFeeds?: (urls: string[]) => void | Promise<void>;
  onMoveFeedsCategory?: (
    urls: string[],
    categoryId: string,
  ) => void | Promise<void>;
  embedded?: boolean;
}

type AnalyticsAccordionSection =
  | "diagnosis"
  | "actions"
  | "affected"
  | "details";

type FeedAnalyticsOuterSection = "health" | "infra" | "reports";

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
  quarantineRecommended: boolean;
};

const SURFACE_CLASS = `${managerSurfaceClass} p-5`;
const INFO_SURFACE_CLASS = managerInfoSurfaceClass;
const MANAGER_CONTROL_CLASS = managerSecondaryButtonClass;
const MANAGER_SURFACE_CARD_CLASS = `${managerControlSurfaceClass} p-4`;

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

const statusLabels: Record<string, string> = {
  valid: "válido",
  invalid: "inválido",
  timeout: "tempo esgotado",
  network_error: "rede",
  parse_error: "conteúdo inválido",
  cors_error: "CORS",
  not_found: "não encontrado",
  server_error: "servidor",
  discovery_required: "revisar URL",
  checking: "verificando",
  unchecked: "pendente",
};

const formatStatusLabel = (status: string) =>
  statusLabels[status] || status.replace(/_/g, " ");

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
  proxy_exhausted: "Proxies indisponíveis",
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

const formatRuntimeWarningDetail = (
  runtime: ReturnType<typeof useProxyDashboard>["snapshot"]["runtime"],
) => {
  if (runtime.warningDetails) {
    return (
      runtime.warningDetails.warning ||
      `${runtime.warningDetails.summary}. ${runtime.warningDetails.action}`
    );
  }

  if (!runtime.lastWarning) return "Proxy em nuvem ativo após falha na rota local.";

  try {
    const parsed = JSON.parse(runtime.lastWarning) as {
      summary?: string;
      action?: string;
      warning?: string;
    };
    return (
      parsed.warning ||
      [parsed.summary, parsed.action].filter(Boolean).join(". ") ||
      runtime.lastWarning
    );
  } catch {
    return runtime.lastWarning;
  }
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
  view = "overview",
  expandedSections,
  onToggleSection,
  focusSection,
  onFocusConsumed,
  quarantineRecommendedUrls = new Set(),
  onQuarantineFeed,
  categories = [],
  onRetryFeeds,
  onQuarantineFeeds,
  onMoveFeedsCategory,
  embedded = false,
}) => {
  const { snapshot, refresh } = useProxyDashboard();
  const [showAllRows, setShowAllRows] = useState(false);
  const [selectedAttentionUrls, setSelectedAttentionUrls] = useState<Set<string>>(
    new Set(),
  );
  const [bulkCategoryId, setBulkCategoryId] = useState("");

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
          quarantineRecommended: quarantineRecommendedUrls.has(feed.url),
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
  }, [activityStats.countsByFeed, feedValidations, feeds, quarantineRecommendedUrls]);

  const visibleRows = showAllRows ? affectedRows : affectedRows.slice(0, 8);
  const visibleRowUrls = visibleRows.map((row) => row.url);
  const selectedRows = affectedRows.filter((row) =>
    selectedAttentionUrls.has(row.url),
  );
  const selectedUrls = selectedRows.map((row) => row.url);
  const selectedCount = selectedRows.length;
  const actionableCategories = categories.filter((category) => category.id !== "all");
  const allVisibleRowsSelected =
    visibleRows.length > 0 &&
    visibleRows.every((row) => selectedAttentionUrls.has(row.url));
  const canRunBulkActions = selectedCount > 0;
  const canMoveSelected =
    canRunBulkActions && Boolean(bulkCategoryId) && Boolean(onMoveFeedsCategory);
  const invalidRows = affectedRows.filter(
    (row) => !row.isValid && row.status !== "unchecked",
  );
  const uncheckedRows = affectedRows.filter(
    (row) => row.status === "unchecked",
  );
  const hasAttentionItems =
    invalidRows.length > 0 ||
    uncheckedRows.length > 0 ||
    quarantineRecommendedUrls.size > 0 ||
    snapshot.summary.fallbackActive;

  useEffect(() => {
    setSelectedAttentionUrls((current) => {
      if (current.size === 0) return current;
      const validUrls = new Set(affectedRows.map((row) => row.url));
      const next = new Set(
        Array.from(current).filter((url) => validUrls.has(url)),
      );
      return next.size === current.size ? current : next;
    });
  }, [affectedRows]);

  const diagnosis = useMemo(() => {
    if (snapshot.summary.fallbackActive && snapshot.runtime.warningDetails) {
      return {
        label: snapshot.runtime.warningDetails.summary,
        detail: formatRuntimeWarningDetail(snapshot.runtime),
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

    if (uncheckedRows.length > 0) {
      return {
        label: `${uncheckedRows.length} feeds pendentes`,
        detail: "Valide os feeds para atualizar a coleção.",
        action: `Revalidar ${uncheckedRows.length} feeds pendentes.`,
      };
    }

    return {
      label: "Tudo certo",
      detail: "",
      action: "",
    };
  }, [invalidRows, snapshot, uncheckedRows.length]);

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

    if (invalidRows.length > 0) {
      items.add(invalidRows[0].action);
    }

    if (quarantineRecommendedUrls.size > 0) {
      items.add(`${quarantineRecommendedUrls.size} feeds podem ir para quarentena.`);
    }

    if (uncheckedRows.length > 0) {
      items.add(`Revalidar ${uncheckedRows.length} feeds pendentes.`);
    }

    return Array.from(items).slice(0, 3);
  }, [diagnosis.action, invalidRows, quarantineRecommendedUrls.size, snapshot, uncheckedRows.length]);

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

  const infraStatusLabel = snapshot.summary.fallbackActive
    ? "Proxy em nuvem"
    : snapshot.backend.enabled && snapshot.backend.available
      ? "Backend local ativo"
      : snapshot.runtime.backendInitializing
        ? "Inicializando"
        : snapshot.backend.enabled
          ? "Backend indisponível"
          : "Modo web";

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

  const toggleAttentionUrl = (url: string) => {
    setSelectedAttentionUrls((current) => {
      const next = new Set(current);
      if (next.has(url)) {
        next.delete(url);
      } else {
        next.add(url);
      }
      return next;
    });
  };

  const toggleVisibleRows = () => {
    setSelectedAttentionUrls((current) => {
      const next = new Set(current);
      if (allVisibleRowsSelected) {
        visibleRowUrls.forEach((url) => next.delete(url));
      } else {
        visibleRowUrls.forEach((url) => next.add(url));
      }
      return next;
    });
  };

  const clearAttentionSelection = () => {
    setSelectedAttentionUrls(new Set());
    setBulkCategoryId("");
  };

  const handleRetrySelectedFeeds = () => {
    if (!canRunBulkActions || !onRetryFeeds) return;
    void onRetryFeeds(selectedUrls);
  };

  const handleQuarantineSelectedFeeds = () => {
    if (!canRunBulkActions || !onQuarantineFeeds) return;
    void onQuarantineFeeds(selectedUrls);
  };

  const handleMoveSelectedFeeds = () => {
    if (!canMoveSelected || !bulkCategoryId || !onMoveFeedsCategory) return;
    void onMoveFeedsCategory(selectedUrls, bulkCategoryId);
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
      const focusTarget =
        focusSection === "proxy-health"
          ? "feed-manager-section-diagnostics-infra"
          : focusSection === "feed-reports"
            ? "feed-manager-section-diagnostics-reports"
            : focusSection === "feed-status"
              ? "feed-manager-section-diagnostics-health"
              : focusSection;
      document.getElementById(focusTarget)?.scrollIntoView?.({
        behavior: "smooth",
        block: "start",
      });
      onFocusConsumed?.();
    }, 120);

    return () => window.clearTimeout(timer);
  }, [focusSection, onFocusConsumed]);

  const showAll = view === "all";
  const showOverview = showAll || view === "overview";
  const showHealth = showAll || view === "health";
  const showInfra = showAll || view === "infra";
  const showReports = showAll || view === "reports";
  const [localExpandedOuterSections, setLocalExpandedOuterSections] =
    useState<Record<FeedAnalyticsOuterSection, boolean>>({
      health: true,
      infra: true,
      reports: true,
    });
  const isOuterSectionOpen = (section: FeedAnalyticsOuterSection) =>
    expandedSections?.[section] ?? localExpandedOuterSections[section];
  const toggleOuterSection = (section: FeedAnalyticsOuterSection) => {
    if (onToggleSection) {
      onToggleSection(section);
      return;
    }

    setLocalExpandedOuterSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  };

  return (
    <div
      className={
        embedded
          ? "feed-manager-page collection-central-page collection-central-page--diagnostics"
          : "space-y-5"
      }
    >
      {showOverview && (
        <section
          id="feed-manager-section-diagnostics-overview"
          className={`${INFO_SURFACE_CLASS} feed-manager-anchor-section`}
        >
          <FeedManagerSectionHeader
            eyebrow="Síntese"
            title="Diagnóstico em camadas"
            description="Use esta área para escolher onde investigar: saúde das fontes, infraestrutura de carregamento ou relatório técnico."
            icon={<Layers3 className="h-5 w-5" />}
            action={
              <button
                type="button"
                onClick={() => void refresh()}
                className={MANAGER_CONTROL_CLASS}
              >
                Atualizar
              </button>
            }
          />

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <DiagnosticOverviewCard
              icon={<AlertCircle className="h-5 w-5" />}
              label="Saúde dos feeds"
              title="Investigar fontes"
              description="Revise falhas, impacto e lista de atenção das fontes que pedem cuidado."
              tone={hasAttentionItems ? "warning" : "success"}
            />
            <DiagnosticOverviewCard
              icon={<Layers3 className="h-5 w-5" />}
              label="Infraestrutura"
              title="Ver rotas de carregamento"
              description="Confira backend, proxies e configuração operacional apenas na seção detalhada."
            />
            <DiagnosticOverviewCard
              icon={<CheckCircle2 className="h-5 w-5" />}
              label="Relatórios"
              title="Exportar diagnóstico"
              description="Gere um recorte técnico quando precisar compartilhar o estado da coleção e da infraestrutura."
            />
          </div>
        </section>
      )}

      {showHealth && hasAttentionItems && (
        <FeedManagerAccordionSection
          id="feed-manager-section-diagnostics-health"
          className={SURFACE_CLASS}
          eyebrow="Saúde dos feeds"
          title={diagnosis.label}
          icon={<AlertCircle className="h-5 w-5" />}
          tone="warning"
          isOpen={isOuterSectionOpen("health")}
          onToggle={() => toggleOuterSection("health")}
        >

          <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <div className={`${managerControlSurfaceClass} p-5`}>
              <p className="text-sm leading-relaxed text-[rgb(var(--theme-text-secondary-readable))] opacity-78">
                {diagnosis.detail}
              </p>
            </div>

            <div className={`${managerControlSurfaceClass} p-5`}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[rgb(var(--color-success))]" />
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[rgb(var(--theme-text-secondary-readable))] opacity-58">
                  Ações
                </p>
              </div>
              <div className="mt-3 space-y-2">
                {actionItems.map((item, idx) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-xl bg-[rgb(var(--theme-manager-soft,var(--theme-control-bg,var(--color-surface))))] px-4 py-3 text-sm font-semibold text-[rgb(var(--theme-text-readable))]"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[rgba(var(--color-accent),0.12)] text-[10px] text-[rgb(var(--color-accent))]">
                      {idx + 1}
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <AccordionSection
            sectionId="feed-status"
            sectionClassName={`${managerControlSurfaceClass} mt-5 p-4`}
            title="Lista de atenção"
            description="Fontes com impacto detectado, organizadas dentro da saúde dos feeds."
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
            <div>
              {affectedRows.length > 0 && (
                <div className={`${managerControlSurfaceClass} mb-4 p-4`}>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <label className="flex items-center gap-3 text-sm font-bold text-[rgb(var(--theme-text-readable))]">
                      <input
                        type="checkbox"
                        checked={allVisibleRowsSelected}
                        onChange={toggleVisibleRows}
                        className="h-4 w-4 rounded border-[rgb(var(--color-border))] accent-[rgb(var(--color-accentSurface))]"
                        aria-label="Selecionar feeds visíveis"
                      />
                      Selecionar visíveis
                    </label>
                    <p className="text-xs font-bold text-[rgb(var(--theme-text-secondary-readable))] opacity-70">
                      {selectedCount} selecionado
                      {selectedCount === 1 ? "" : "s"}
                    </p>
                  </div>

                  <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-[auto_auto_minmax(12rem,1fr)_auto_auto]">
                    <button
                      type="button"
                      onClick={handleRetrySelectedFeeds}
                      disabled={!canRunBulkActions || !onRetryFeeds}
                      className={`${MANAGER_CONTROL_CLASS} justify-center px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-45`}
                    >
                      Testar selecionados
                    </button>
                    <button
                      type="button"
                      onClick={handleQuarantineSelectedFeeds}
                      disabled={!canRunBulkActions || !onQuarantineFeeds}
                      className="feed-manager-secondary-button justify-center px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      Quarentenar selecionados
                    </button>
                    <select
                      value={bulkCategoryId}
                      onChange={(event) => setBulkCategoryId(event.target.value)}
                      className="feed-manager-field h-10 w-full px-3 text-xs font-bold"
                      aria-label="Mover selecionados para categoria"
                    >
                      <option value="">Mover para categoria</option>
                      {actionableCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleMoveSelectedFeeds}
                      disabled={!canMoveSelected}
                      className={`${MANAGER_CONTROL_CLASS} justify-center px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-45`}
                    >
                      Mover selecionados
                    </button>
                    <button
                      type="button"
                      onClick={clearAttentionSelection}
                      disabled={selectedCount === 0}
                      className={`${MANAGER_CONTROL_CLASS} justify-center px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-45`}
                    >
                      Limpar seleção
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2 md:hidden">
                {visibleRows.map((row) => (
                  <div
                    key={row.url}
                    className={`${managerControlSurfaceClass} p-4`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedAttentionUrls.has(row.url)}
                          onChange={() => toggleAttentionUrl(row.url)}
                          className="mt-1 h-4 w-4 rounded border-[rgb(var(--color-border))] accent-[rgb(var(--color-accentSurface))]"
                          aria-label={`Selecionar ${row.title}`}
                        />
                        <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[rgb(var(--theme-text-readable))]">
                          {row.title}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] font-mono text-[rgb(var(--theme-text-secondary-readable))] opacity-55">
                          {row.host}
                        </p>
                        </div>
                      </div>
                      <div
                        className={`shrink-0 text-xs font-bold uppercase tracking-widest ${impactTone(row.impact)}`}
                      >
                        {row.impact}
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-xl bg-[rgb(var(--theme-manager-soft,var(--theme-control-bg,var(--color-surface))))] px-3 py-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[rgb(var(--theme-text-secondary-readable))] opacity-50">
                          Rota
                        </p>
                        <p className="mt-1 font-semibold text-[rgb(var(--theme-text-readable))]">
                          {row.route}
                        </p>
                      </div>
                      <div className="rounded-xl bg-[rgb(var(--theme-manager-soft,var(--theme-control-bg,var(--color-surface))))] px-3 py-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[rgb(var(--theme-text-secondary-readable))] opacity-50">
                          Status
                        </p>
                        <p className="mt-1 font-semibold text-[rgb(var(--theme-text-readable))]">
                          {formatStatusLabel(row.status)}
                        </p>
                      </div>
                    </div>

                    <p className="mt-3 text-xs leading-relaxed text-[rgb(var(--theme-text-secondary-readable))] opacity-72">
                      {row.error}
                    </p>
                    {row.quarantineRecommended && onQuarantineFeed && (
                      <button
                        type="button"
                        onClick={() => onQuarantineFeed(row.url)}
                        className="mt-3 inline-flex items-center gap-2 rounded-full bg-[rgba(var(--color-warning),0.12)] px-3 py-2 text-xs font-bold text-[rgb(var(--color-warning))]"
                      >
                        <ShieldAlert className="h-3.5 w-3.5" />
                        Quarentenar
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full border-separate border-spacing-y-1.5">
                <thead>
                  <tr className="text-left text-[10px] font-bold uppercase tracking-widest text-[rgb(var(--theme-text-secondary-readable))] opacity-40">
                    <th className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={allVisibleRowsSelected}
                        onChange={toggleVisibleRows}
                        className="h-4 w-4 rounded border-[rgb(var(--color-border))] accent-[rgb(var(--color-accentSurface))]"
                        aria-label="Selecionar feeds visíveis"
                      />
                    </th>
                    <th className="px-4 py-2">Feed</th>
                    <th className="px-4 py-2">Rota</th>
                    <th className="px-4 py-2">Status</th>
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
                        <input
                          type="checkbox"
                          checked={selectedAttentionUrls.has(row.url)}
                          onChange={() => toggleAttentionUrl(row.url)}
                          className="h-4 w-4 rounded border-[rgb(var(--color-border))] accent-[rgb(var(--color-accentSurface))]"
                          aria-label={`Selecionar ${row.title}`}
                        />
                      </td>
                      <td className="px-4 py-3">
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
                        {row.quarantineRecommended && onQuarantineFeed && (
                          <button
                            type="button"
                            onClick={() => onQuarantineFeed(row.url)}
                            className="mt-2 inline-flex items-center justify-end gap-1 rounded-full bg-[rgba(var(--color-warning),0.12)] px-2.5 py-1 text-[10px] font-bold text-[rgb(var(--color-warning))] transition hover:bg-[rgba(var(--color-warning),0.18)]"
                          >
                            <ShieldAlert className="h-3 w-3" />
                            Quarentena
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>

              {!showAllRows && affectedRows.length > 8 && (
                <div
                  onClick={() => setShowAllRows(true)}
                  className="mt-2 flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-[rgba(var(--color-border),0.15)] py-2 text-[10px] font-bold uppercase tracking-widest text-[rgb(var(--theme-text-secondary-readable))] opacity-40 hover:opacity-100 transition-opacity"
                >
                  Expandir lista
                </div>
              )}
            </div>
          </AccordionSection>
        </FeedManagerAccordionSection>
      )}

      {showHealth && !hasAttentionItems && (view === "health" || showAll) && (
        <FeedManagerAccordionSection
          id="feed-manager-section-diagnostics-health"
          className={SURFACE_CLASS}
          eyebrow="Saúde dos feeds"
          title="Nenhuma ação necessária"
          icon={<CheckCircle2 className="h-5 w-5" />}
          isOpen={isOuterSectionOpen("health")}
          onToggle={() => toggleOuterSection("health")}
        >
          <p className="mt-4 text-sm leading-relaxed text-[rgb(var(--theme-text-secondary-readable))] opacity-72">
            Os feeds validados não apresentam falhas no momento.
          </p>
        </FeedManagerAccordionSection>
      )}

      {showInfra && (
      <FeedManagerAccordionSection
        id="feed-manager-section-diagnostics-infra"
        className={SURFACE_CLASS}
        eyebrow="Infraestrutura"
        title="Backend, proxies e rotas"
        icon={<Layers3 className="h-5 w-5" />}
        isOpen={isOuterSectionOpen("infra")}
        onToggle={() => toggleOuterSection("infra")}
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Estado" value={infraStatusLabel} />
          <StatCard label="Sucesso" value={`${snapshot.summary.successRate}%`} />
          <StatCard
            label="Rotas saudáveis"
            value={`${snapshot.summary.healthyRoutes}/${Math.max(1, snapshot.summary.totalRoutes)}`}
          />
          <StatCard label="Requisições" value={snapshot.summary.totalRequests} />
        </div>

        <div id="proxy-settings" className="mt-5">
          <ProxySettings detailed embedded snapshot={snapshot} onRefresh={refresh} />
        </div>
      </FeedManagerAccordionSection>
      )}

      {showReports && (
      <FeedManagerAccordionSection
        id="feed-manager-section-diagnostics-reports"
        className={SURFACE_CLASS}
        eyebrow="Diagnóstico"
        title="Relatórios"
        description="Exporte um recorte técnico da saúde dos feeds e da infraestrutura atual."
        icon={<FileText className="h-5 w-5" />}
        isOpen={isOuterSectionOpen("reports")}
        onToggle={() => toggleOuterSection("reports")}
      >
        <div className="space-y-4">
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
        </div>
      </FeedManagerAccordionSection>
      )}
    </div>
  );
};

const AccordionSection: React.FC<{
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
  description?: string;
  actions?: React.ReactNode;
  sectionId?: string;
  sectionClassName?: string;
}> = ({
  title,
  isOpen,
  onToggle,
  children,
  icon,
  description,
  actions,
  sectionId,
  sectionClassName = INFO_SURFACE_CLASS,
}) => (
  <section id={sectionId} className={sectionClassName}>
    <FeedManagerSectionHeader
      eyebrow="Diagnóstico"
      title={title}
      description={description}
      icon={icon}
      action={
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={isOpen}
            className={managerSecondaryButtonClass}
          >
            {isOpen ? "Recolher" : "Expandir"}
          </button>
        </div>
      }
    />
    {isOpen && <div className="mt-4">{children}</div>}
  </section>
);

const DiagnosticOverviewCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  title: string;
  description: string;
  tone?: "default" | "success" | "warning";
}> = ({ icon, label, title, description, tone = "default" }) => {
  const iconTone =
    tone === "success"
      ? "bg-[rgba(var(--color-success),0.12)] text-[rgb(var(--color-success))]"
      : tone === "warning"
        ? "bg-[rgba(var(--color-warning),0.12)] text-[rgb(var(--color-warning))]"
        : "bg-[rgb(var(--theme-manager-bg,var(--color-background)))] text-[rgb(var(--theme-text-readable))]";

  return (
    <div className={`${managerControlSurfaceClass} p-5`}>
      <div className="flex items-start gap-4">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconTone}`}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[rgb(var(--theme-text-secondary-readable))] opacity-65">
            {label}
          </p>
          <h4 className="mt-1 text-base font-black text-[rgb(var(--theme-text-readable))]">
            {title}
          </h4>
        </div>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-[rgb(var(--theme-text-secondary-readable))] opacity-78">
        {description}
      </p>
    </div>
  );
};

const StatCard: React.FC<{
  label: string;
  value: React.ReactNode;
  tone?: "default" | "warning" | "danger";
}> = ({ label, value, tone = "default" }) => (
  <div
    className={`rounded-2xl p-4 ${
      tone === "danger"
        ? "bg-[rgba(var(--color-error),0.1)]"
        : tone === "warning"
          ? "bg-[rgba(var(--color-warning),0.1)]"
          : managerControlSurfaceClass
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
