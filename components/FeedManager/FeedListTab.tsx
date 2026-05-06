import React, { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { FeedItem } from "../FeedItem";
import type { Article, FeedSource, FeedCategory } from "../../types";
import type { FeedValidationResult } from "../../services/feedValidator";
import { getFeedSortKey } from "../../utils/feedDisplay";

interface FeedListTabProps {
  feeds: FeedSource[];
  validations: Map<string, FeedValidationResult>;
  categories: FeedCategory[];
  onRemove: (url: string) => void;
  onRetry: (url: string) => void;
  onEdit: (url: string) => void;
  onEditTitle?: (url: string) => void;
  onShowError: (url: string, validation?: FeedValidationResult) => void;
  onMoveCategory: (feedUrl: string, categoryId: string) => void;
  onToggleHideFromAll?: (url: string) => void;
  onRefreshAll?: () => void;
  onConfirmRefreshAll?: () => void | Promise<void>;
  articles?: Article[];
}

const INFO_SURFACE_CLASS =
  "rounded-[26px] bg-[rgb(var(--theme-manager-surface,var(--color-surface)))] p-5 shadow-[0_18px_42px_rgba(0,0,0,0.14),inset_0_1px_0_rgba(255,255,255,0.025)]";

const CONTROL_CLASS =
  "w-full rounded-[18px] bg-[rgb(var(--theme-manager-control,var(--theme-control-bg,var(--color-surface))))] px-4 py-3 text-sm text-[rgb(var(--theme-control-text,var(--theme-text-on-surface,var(--color-text))))] shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] outline-none transition-all placeholder:text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))] focus:bg-[rgb(var(--theme-manager-soft,var(--theme-control-bg,var(--color-surface))))] focus:ring-1 focus:ring-[rgba(var(--color-accent),0.35)]";

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
  if (!value) return "";
  try {
    return new URL(value).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
};

export const FeedListTab: React.FC<FeedListTabProps> = ({
  feeds,
  validations,
  categories,
  onRemove,
  onRetry,
  onEdit,
  onEditTitle,
  onShowError,
  onMoveCategory,
  onToggleHideFromAll,
  onRefreshAll,
  onConfirmRefreshAll,
  articles = [],
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    issues: false,
    pending: false,
    healthy: false
  });

  const filteredFeeds = useMemo(() => {
    return feeds
      .filter((feed) => {
        const validation = validations.get(feed.url);
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          !searchTerm ||
          feed.url.toLowerCase().includes(searchLower) ||
          (feed.customTitle?.toLowerCase().includes(searchLower) ?? false) ||
          (validation?.title?.toLowerCase().includes(searchLower) ?? false) ||
          (validation?.description?.toLowerCase().includes(searchLower) ??
            false);

        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "valid" && validation?.status === "valid") ||
          (statusFilter === "invalid" &&
            !!validation?.status &&
            validation.status !== "valid") ||
          (statusFilter === "unchecked" && !validation);

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) =>
        getFeedSortKey(a, validations.get(a.url)?.title).localeCompare(
          getFeedSortKey(b, validations.get(b.url)?.title),
          "pt-BR",
        ),
      );
  }, [feeds, searchTerm, statusFilter, validations]);

  const issueFeeds = filteredFeeds.filter((feed) => {
    const validation = validations.get(feed.url);
    return validation && !validation.isValid;
  });

  const validFeeds = filteredFeeds.filter(
    (feed) => validations.get(feed.url)?.isValid,
  );
  const uncheckedFeeds = filteredFeeds.filter(
    (feed) => !validations.has(feed.url),
  );

  const activityStats = useMemo(() => {
    const countByFeed = new Map<string, number>();
    const labelByFeed = new Map<string, string>();
    const sourceTitleIndex = new Map<string, Set<string>>();
    const hostIndex = new Map<string, Set<string>>();

    feeds.forEach((feed) => {
      const feedKey = normalizeUrlKey(feed.url);
      const validation = validations.get(feed.url);
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

    const sortedFeeds = Array.from(countByFeed.entries())
      .map(([feedKey, count]) => ({
        feedKey,
        count,
        label: labelByFeed.get(feedKey) || feedKey,
      }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.label.localeCompare(b.label, "pt-BR");
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
      matchedArticles: articles.length - unmatchedArticles,
      unmatchedArticles,
      mostActive: sortedFeeds.filter((item) => item.count > 0).slice(0, 4),
      quietFeeds: sortedFeeds.filter((item) => item.count === 0).slice(0, 4),
      topicTrends: Array.from(topicCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6),
    };
  }, [articles, feeds, validations]);

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-4 sm:p-6">
      <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-5">
        <section className="flex flex-col gap-4">
          <section className={INFO_SURFACE_CLASS}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="grid flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_13rem]">
                <div className="relative">
                  <svg
                    className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="Buscar nos feeds..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`${CONTROL_CLASS} pl-11`}
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={CONTROL_CLASS}
                >
                  <option value="all">Filtrar por Status</option>
                  <option value="invalid">Com erro</option>
                  <option value="valid">Válidos</option>
                  <option value="unchecked">Pendentes</option>
                </select>
              </div>

              {onRefreshAll && (
                <button
                  type="button"
                  onClick={() => {
                    if (onConfirmRefreshAll) {
                      void onConfirmRefreshAll();
                      return;
                    }
                    onRefreshAll();
                  }}
                  title="Revalidar coleção"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[rgb(var(--theme-manager-control))] text-[rgb(var(--theme-text-readable))] shadow-md transition-all hover:bg-[rgb(var(--theme-manager-soft))] active:scale-90"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              )}
            </div>
          </section>

          {articles.length > 0 && (
            <section className={INFO_SURFACE_CLASS}>
              <div className="grid gap-4 xl:grid-cols-[minmax(0,0.65fr)_minmax(0,1.35fr)]">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[rgb(var(--theme-text-secondary-readable))] opacity-60">
                    Atividade
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <ActivityTile
                      label="Associados"
                      value={activityStats.matchedArticles}
                    />
                    <ActivityTile
                      label="Sem vínculo"
                      value={activityStats.unmatchedArticles}
                    />
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  {activityStats.topicTrends.length > 0 && (
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[rgb(var(--theme-text-secondary-readable))] opacity-60">
                        Assuntos
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {activityStats.topicTrends.map(([topic, count]) => (
                          <span
                            key={topic}
                            className="rounded-full bg-[rgb(var(--theme-manager-control,var(--theme-control-bg,var(--color-surface))))] px-3 py-1 text-xs font-semibold text-[rgb(var(--theme-manager-text-secondary,var(--theme-text-secondary-on-surface,var(--color-textSecondary))))]"
                          >
                            #{topic} ({count})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {(activityStats.mostActive.length > 0 ||
                    activityStats.quietFeeds.length > 0) && (
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[rgb(var(--theme-text-secondary-readable))] opacity-60">
                        Fontes
                      </p>
                      <div className="mt-3 space-y-2">
                        {activityStats.mostActive.slice(0, 2).map((feed) => (
                          <ActivityRow
                            key={feed.feedKey}
                            label={feed.label}
                            value={`${feed.count} artigos`}
                          />
                        ))}
                        {activityStats.quietFeeds.slice(0, 2).map((feed) => (
                          <ActivityRow
                            key={feed.feedKey}
                            label={feed.label}
                            value="0 artigos"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}
        </section>

        {filteredFeeds.length === 0 ? (
          <section className={INFO_SURFACE_CLASS}>
            <div className="px-2 py-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[rgb(var(--theme-manager-control))] opacity-40">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-[rgb(var(--theme-text-readable))]">
                Nenhum feed corresponde aos filtros
              </h3>
              <p className="mt-2 text-sm text-[rgb(var(--theme-text-secondary-readable))]">
                Tente ajustar sua busca ou mudar o filtro de status.
              </p>
            </div>
          </section>
        ) : (
          <div className="space-y-6">
            {issueFeeds.length > 0 && (
              <FeedGroup 
                title="Atenção Necessária" 
                count={issueFeeds.length}
                tone="danger"
                expanded={expandedGroups.issues}
                onToggle={() => toggleGroup("issues")}
              >
                {(expandedGroups.issues ? issueFeeds : issueFeeds.slice(0, 5)).map((feed, index) => (
                  <FeedItem
                    key={`${feed.url}-issues-${index}`}
                    feed={feed}
                    validation={validations.get(feed.url)}
                    onRemove={onRemove}
                    onRetry={onRetry}
                    onEdit={onEdit}
                    onEditTitle={onEditTitle}
                    onShowError={(url) =>
                      onShowError(url, validations.get(url))
                    }
                    categories={categories}
                    onMoveCategory={(catId) => onMoveCategory(feed.url, catId)}
                    onToggleHideFromAll={onToggleHideFromAll}
                  />
                ))}
              </FeedGroup>
            )}

            {uncheckedFeeds.length > 0 && (
              <FeedGroup 
                title="Pendentes de Validação" 
                count={uncheckedFeeds.length}
                tone="warning"
                expanded={expandedGroups.pending}
                onToggle={() => toggleGroup("pending")}
              >
                {(expandedGroups.pending ? uncheckedFeeds : uncheckedFeeds.slice(0, 5)).map((feed, index) => (
                  <FeedItem
                    key={`${feed.url}-unchecked-${index}`}
                    feed={feed}
                    validation={validations.get(feed.url)}
                    onRemove={onRemove}
                    onRetry={onRetry}
                    onEdit={onEdit}
                    onEditTitle={onEditTitle}
                    onShowError={(url) =>
                      onShowError(url, validations.get(url))
                    }
                    categories={categories}
                    onMoveCategory={(catId) =>
                      onMoveCategory(feed.url, catId)
                    }
                    onToggleHideFromAll={onToggleHideFromAll}
                  />
                ))}
              </FeedGroup>
            )}

            {validFeeds.length > 0 && (
              <FeedGroup 
                title="Coleção Válida" 
                count={validFeeds.length}
                tone="success"
                expanded={expandedGroups.healthy}
                onToggle={() => toggleGroup("healthy")}
              >
                {(expandedGroups.healthy ? validFeeds : validFeeds.slice(0, 5)).map((feed, index) => (
                  <FeedItem
                    key={`${feed.url}-valid-${index}`}
                    feed={feed}
                    validation={validations.get(feed.url)}
                    onRemove={onRemove}
                    onRetry={onRetry}
                    onEdit={onEdit}
                    onEditTitle={onEditTitle}
                    onShowError={(url) =>
                      onShowError(url, validations.get(url))
                    }
                    categories={categories}
                    onMoveCategory={(catId) =>
                      onMoveCategory(feed.url, catId)
                    }
                    onToggleHideFromAll={onToggleHideFromAll}
                  />
                ))}
              </FeedGroup>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const ActivityTile: React.FC<{
  label: string;
  value: number;
}> = ({ label, value }) => (
  <div className="rounded-[18px] bg-[rgb(var(--theme-manager-control,var(--theme-control-bg,var(--color-surface))))] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]">
    <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--theme-text-secondary-readable))] opacity-72">
      {label}
    </div>
    <div className="mt-1 text-lg font-semibold text-[rgb(var(--theme-text-readable))]">
      {value}
    </div>
  </div>
);

const ActivityRow: React.FC<{
  label: string;
  value: string;
}> = ({ label, value }) => (
  <div className="flex items-center justify-between gap-3 rounded-[14px] bg-[rgb(var(--theme-manager-control,var(--theme-control-bg,var(--color-surface))))] px-3 py-2 text-sm">
    <span className="truncate font-semibold text-[rgb(var(--theme-text-readable))]">
      {label}
    </span>
    <span className="shrink-0 text-xs font-semibold text-[rgb(var(--theme-text-secondary-readable))] opacity-72">
      {value}
    </span>
  </div>
);

const FeedGroup: React.FC<{
  title: string;
  count: number;
  children: React.ReactNode;
  tone: "success" | "warning" | "danger";
  expanded: boolean;
  onToggle: () => void;
}> = ({ title, count, children, tone, expanded, onToggle }) => {
  const toneStyles = {
    success: "bg-[rgba(var(--color-success),0.035)]",
    warning: "bg-[rgba(var(--color-warning),0.045)]",
    danger: "bg-[rgba(var(--color-error),0.045)]"
  };

  return (
    <section className={`rounded-[26px] p-5 shadow-[0_14px_36px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.025)] transition-all ${toneStyles[tone]}`}>
      <div className="mb-4 flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-bold text-[rgb(var(--theme-text-readable))]">
            {title}
          </h3>
          <span className="rounded-full bg-[rgb(var(--theme-manager-control))] px-2.5 py-1 text-[10px] font-bold text-[rgb(var(--theme-text-secondary-readable))] shadow-sm">
            {count}
          </span>
        </div>
        
        {count > 5 && (
          <button
            type="button"
            onClick={onToggle}
            className="text-xs font-bold text-[rgb(var(--color-accent))] hover:underline"
          >
            {expanded ? "Ver menos" : `Ver todos (+${count - 5})`}
          </button>
        )}
      </div>
      <div className="space-y-2.5">{children}</div>
      
      {!expanded && count > 5 && (
        <div 
          onClick={onToggle}
          className="mt-3 flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-[rgba(var(--color-border),0.15)] py-2 text-[10px] font-bold uppercase tracking-widest text-[rgb(var(--theme-text-secondary-readable))] opacity-60 hover:opacity-100 transition-opacity"
        >
          Expandir Coleção
        </div>
      )}
    </section>
  );
};
