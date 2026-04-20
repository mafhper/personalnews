import React, { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useLanguage } from "../../hooks/useLanguage";
import { FeedItem } from "../FeedItem";
import type { FeedSource, FeedCategory } from "../../types";
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
  newFeedUrl?: string;
  setNewFeedUrl?: (url: string) => void;
  newFeedTitle?: string;
  setNewFeedTitle?: (title: string) => void;
  newFeedCategory?: string;
  setNewFeedCategory?: (id: string) => void;
  processingUrl?: string | null;
  onSubmit?: (e: React.FormEvent) => void;
}

const SURFACE_CLASS =
  "rounded-[24px] bg-[rgb(var(--theme-manager-surface,var(--theme-surface-readable,var(--color-surface))))] p-5 shadow-[0_24px_52px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.025)]";

const INFO_SURFACE_CLASS =
  "rounded-[24px] border border-[rgb(var(--color-border))]/10 bg-[rgb(var(--theme-manager-bg,var(--color-background)))] p-5 shadow-[0_12px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.025)]";

const CONTROL_CLASS =
  "w-full rounded-[18px] bg-[rgb(var(--theme-manager-control,var(--theme-control-bg,var(--color-surface))))] px-4 py-3 text-sm text-[rgb(var(--theme-control-text,var(--theme-text-on-surface,var(--color-text))))] shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] outline-none transition-all placeholder:text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))] focus:bg-[rgb(var(--theme-manager-soft,var(--theme-control-bg,var(--color-surface))))] focus:ring-1 focus:ring-[rgba(var(--color-accent),0.35)]";

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
  newFeedUrl,
  setNewFeedUrl,
  newFeedTitle,
  setNewFeedTitle,
  newFeedCategory,
  setNewFeedCategory,
  processingUrl,
  onSubmit,
}) => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAddForm, setShowAddForm] = useState(false);
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

  const totalFeeds = feeds.length;
  const validCount = feeds.filter(
    (feed) => validations.get(feed.url)?.isValid,
  ).length;
  const invalidCount = feeds.filter((feed) => {
    const validation = validations.get(feed.url);
    return validation && !validation.isValid;
  }).length;
  const pendingCount = feeds.filter(
    (feed) => !validations.has(feed.url),
  ).length;

  const toolbarStats = [
    { label: "Total", value: totalFeeds, tone: "neutral" as const },
    {
      label: t("analytics.valid") || "Válidos",
      value: validCount,
      tone: "success" as const,
    },
    {
      label: t("analytics.issues") || "Com erro",
      value: invalidCount,
      tone: "danger" as const,
    },
    {
      label: t("analytics.pending") || "Pendentes",
      value: pendingCount,
      tone: "warning" as const,
    },
  ];

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-4 sm:p-6">
      <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-5">
        <section className="flex flex-col gap-4">
          {/* Unified Management Bar */}
          <section className={INFO_SURFACE_CLASS}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                {toolbarStats.map((stat) => (
                  <MetricTile
                    key={stat.label}
                    label={stat.label}
                    value={stat.value}
                    tone={stat.tone}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                {typeof onSubmit === "function" && (
                  <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold shadow-lg transition-all ${
                      showAddForm
                        ? "bg-[rgb(var(--theme-manager-control))] text-[rgb(var(--theme-text-readable))]"
                        : "bg-[rgb(var(--color-accentSurface))] text-[rgb(var(--color-onAccent))] hover:scale-105 active:scale-95"
                    }`}
                  >
                    {showAddForm ? "Fechar" : "Novo Feed"}
                    {!showAddForm && <span>+</span>}
                  </button>
                )}
                
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
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgb(var(--theme-manager-control))] text-[rgb(var(--theme-text-readable))] shadow-md transition-all hover:bg-[rgb(var(--theme-manager-soft))] active:scale-90"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
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
            </div>
          </section>

          {/* Collapsible Add Feed Form */}
          {showAddForm && onSubmit && setNewFeedUrl && setNewFeedTitle && setNewFeedCategory && (
            <section className={`${SURFACE_CLASS} animate-in slide-in-from-top-4 duration-300`}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-[rgb(var(--theme-text-readable))]">
                  Configurar Novo Feed
                </h3>
              </div>

              <form
                onSubmit={(e) => {
                  onSubmit(e);
                  setShowAddForm(false);
                }}
                className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr]"
              >
                <label className="block">
                  <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-[rgb(var(--theme-text-secondary-readable))]">
                    URL do Feed RSS
                  </span>
                  <input
                    type="url"
                    required
                    placeholder="https://exemplo.com/rss"
                    value={newFeedUrl || ""}
                    onChange={(e) => setNewFeedUrl(e.target.value)}
                    disabled={processingUrl !== null}
                    className={CONTROL_CLASS}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-[rgb(var(--theme-text-secondary-readable))]">
                    Nome de Exibição (Opcional)
                  </span>
                  <input
                    type="text"
                    placeholder="Ex: Meu Blog Favorito"
                    value={newFeedTitle || ""}
                    onChange={(e) => setNewFeedTitle(e.target.value)}
                    disabled={processingUrl !== null}
                    className={CONTROL_CLASS}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-[rgb(var(--theme-text-secondary-readable))]">
                    Categoria
                  </span>
                  <select
                    value={newFeedCategory || ""}
                    onChange={(e) => setNewFeedCategory(e.target.value)}
                    disabled={processingUrl !== null}
                    className={CONTROL_CLASS}
                  >
                    <option value="">Sem categoria</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="lg:col-span-3 flex justify-end gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="rounded-full px-6 py-2.5 text-sm font-bold text-[rgb(var(--theme-text-secondary-readable))] hover:bg-[rgb(var(--theme-manager-soft))]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={processingUrl !== null}
                    className="inline-flex items-center justify-center rounded-full bg-[rgb(var(--color-accentSurface))] px-8 py-2.5 text-sm font-bold text-[rgb(var(--color-onAccent))] shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50"
                  >
                    {processingUrl ? "Validando..." : "Salvar Feed"}
                  </button>
                </div>
              </form>
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

const MetricTile: React.FC<{
  label: string;
  value: number;
  tone: "neutral" | "success" | "warning" | "danger";
}> = ({ label, value, tone }) => {
  const toneClass =
    tone === "success"
      ? "text-[rgb(var(--color-success))] bg-[rgba(var(--color-success),0.1)]"
      : tone === "warning"
        ? "text-[rgb(var(--color-warning))] bg-[rgba(var(--color-warning),0.1)]"
        : tone === "danger"
          ? "text-[rgb(var(--color-error))] bg-[rgba(var(--color-error),0.1)]"
          : "text-[rgb(var(--theme-manager-text,var(--theme-text-readable)))] bg-[rgb(var(--theme-manager-control,var(--theme-control-bg,var(--color-surface))))]";

  return (
    <div
      className={`rounded-[18px] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] ${toneClass}`}
    >
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-80">
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
};

const FeedGroup: React.FC<{
  title: string;
  count: number;
  children: React.ReactNode;
  tone: "success" | "warning" | "danger";
  expanded: boolean;
  onToggle: () => void;
}> = ({ title, count, children, tone, expanded, onToggle }) => {
  const toneStyles = {
    success: "border-[rgba(var(--color-success),0.2)] bg-[rgba(var(--color-success),0.02)]",
    warning: "border-[rgba(var(--color-warning),0.2)] bg-[rgba(var(--color-warning),0.02)]",
    danger: "border-[rgba(var(--color-error),0.2)] bg-[rgba(var(--color-error),0.02)]"
  };

  return (
    <section className={`rounded-[28px] border p-5 transition-all ${toneStyles[tone]}`}>
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
