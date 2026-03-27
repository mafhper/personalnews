import React, { useMemo, useState } from "react";
import { useLanguage } from "../../hooks/useLanguage";
import { FeedItem } from "../FeedItem";
import type { FeedSource, FeedCategory } from "../../types";
import type { FeedValidationResult } from "../../services/feedValidator";

interface FeedListTabProps {
  feeds: FeedSource[];
  validations: Map<string, FeedValidationResult>;
  categories: FeedCategory[];
  onRemove: (url: string) => void;
  onRetry: (url: string) => void;
  onEdit: (url: string) => void;
  onShowError: (url: string, validation?: FeedValidationResult) => void;
  onMoveCategory: (feedUrl: string, categoryId: string) => void;
  onToggleHideFromAll?: (url: string) => void;
  onRefreshAll?: () => void;
  onConfirmRefreshAll?: () => void | Promise<void>;
  newFeedUrl?: string;
  setNewFeedUrl?: (url: string) => void;
  newFeedCategory?: string;
  setNewFeedCategory?: (id: string) => void;
  processingUrl?: string | null;
  onSubmit?: (e: React.FormEvent) => void;
  discoveryProgress?: Map<string, { status: string; progress: number }>;
}

const SURFACE_CLASS =
  "rounded-[24px] bg-[rgb(var(--theme-manager-surface,var(--theme-surface-readable,var(--color-surface))))] p-5 shadow-[0_24px_52px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.025)]";

const CONTROL_CLASS =
  "w-full rounded-[18px] bg-[rgb(var(--theme-manager-control,var(--theme-control-bg,var(--color-surface))))] px-4 py-3 text-sm text-[rgb(var(--theme-control-text,var(--theme-text-on-surface,var(--color-text))))] shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] outline-none transition-all placeholder:text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))] focus:bg-[rgb(var(--theme-manager-soft,var(--theme-control-bg,var(--color-surface))))] focus:ring-1 focus:ring-[rgba(var(--color-accent),0.35)]";

export const FeedListTab: React.FC<FeedListTabProps> = ({
  feeds,
  validations,
  categories,
  onRemove,
  onRetry,
  onEdit,
  onShowError,
  onMoveCategory,
  onToggleHideFromAll,
  onRefreshAll,
  onConfirmRefreshAll,
  newFeedUrl,
  setNewFeedUrl,
  newFeedCategory,
  setNewFeedCategory,
  processingUrl,
  onSubmit,
  discoveryProgress,
}) => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showHealthyFeeds, setShowHealthyFeeds] = useState(false);
  const [showPendingFeeds, setShowPendingFeeds] = useState(
    () => feeds.length > 0 && validations.size === 0,
  );

  const filteredFeeds = useMemo(() => {
    return feeds.filter((feed) => {
      const validation = validations.get(feed.url);
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        feed.url.toLowerCase().includes(searchLower) ||
        (feed.customTitle?.toLowerCase().includes(searchLower) ?? false) ||
        (validation?.title?.toLowerCase().includes(searchLower) ?? false) ||
        (validation?.description?.toLowerCase().includes(searchLower) ?? false);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "valid" && validation?.status === "valid") ||
        (statusFilter === "invalid" &&
          !!validation?.status &&
          validation.status !== "valid") ||
        (statusFilter === "unchecked" && !validation);

      return matchesSearch && matchesStatus;
    });
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

  const collectionCount = validFeeds.length + uncheckedFeeds.length;

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-4 sm:p-6">
      <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-5">
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
          {typeof onSubmit === "function" &&
            setNewFeedUrl &&
            setNewFeedCategory && (
              <section className={SURFACE_CLASS}>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-[rgb(var(--theme-text-readable))]">
                      Adicionar feed
                    </h3>
                  </div>
                  <span className="rounded-full bg-[rgba(var(--color-accent),0.12)] px-3 py-1.5 text-xs font-semibold text-[rgb(var(--color-accent))] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                    Novo
                  </span>
                </div>

                <form
                  onSubmit={onSubmit}
                  className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_16rem]"
                >
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))]">
                      URL
                    </span>
                    <input
                      type="url"
                      placeholder="https://site.com/rss"
                      value={newFeedUrl || ""}
                      onChange={(e) => setNewFeedUrl(e.target.value)}
                      disabled={processingUrl !== null}
                      className={CONTROL_CLASS}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))]">
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

                  <div className="lg:col-span-2 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    {processingUrl && discoveryProgress?.get(processingUrl) ? (
                      <div className="text-sm text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))]">
                        {discoveryProgress.get(processingUrl)?.status}{" "}
                        <span className="font-semibold text-[rgb(var(--theme-text-readable))]">
                          {discoveryProgress.get(processingUrl)?.progress}%
                        </span>
                      </div>
                    ) : (
                      <div className="text-sm text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))]">
                        {totalFeeds} feeds na coleção
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={processingUrl !== null}
                      className="inline-flex items-center justify-center rounded-[18px] bg-[rgba(var(--color-accent),0.18)] px-5 py-3 text-sm font-semibold text-[rgb(var(--color-accent))] shadow-[0_14px_34px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.03)] transition-all hover:bg-[rgba(var(--color-accent),0.24)] disabled:cursor-wait disabled:opacity-60"
                    >
                      {processingUrl ? "Processando..." : "Adicionar feed"}
                    </button>
                  </div>
                </form>
              </section>
            )}

          <section className={SURFACE_CLASS}>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {toolbarStats.map((stat) => (
                <MetricTile
                  key={stat.label}
                  label={stat.label}
                  value={stat.value}
                  tone={stat.tone}
                />
              ))}
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
                    placeholder="Buscar feeds"
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
                  <option value="all">Todos</option>
                  <option value="invalid">
                    {t("analytics.issues") || "Com erro"}
                  </option>
                  <option value="valid">
                    {t("analytics.valid") || "Válidos"}
                  </option>
                  <option value="unchecked">
                    {t("analytics.pending") || "Pendentes"}
                  </option>
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
                  className="inline-flex items-center justify-center rounded-[18px] bg-[rgb(var(--theme-manager-control,var(--theme-control-bg,var(--color-surface))))] px-4 py-3 text-sm font-semibold text-[rgb(var(--theme-manager-text,var(--theme-text-readable)))] shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] transition-all hover:bg-[rgb(var(--theme-manager-soft,var(--theme-control-bg,var(--color-surface))))]"
                >
                  Revalidar coleção
                </button>
              )}
            </div>
          </section>
        </section>

        {filteredFeeds.length === 0 ? (
          <section className={SURFACE_CLASS}>
            <div className="px-2 py-10 text-center">
              <h3 className="text-base font-semibold text-[rgb(var(--theme-text-readable))]">
                Nenhum feed encontrado
              </h3>
            </div>
          </section>
        ) : (
          <>
            {issueFeeds.length > 0 && (
              <FeedGroup title={`Com erro (${issueFeeds.length})`}>
                {issueFeeds.map((feed, index) => (
                  <FeedItem
                    key={`${feed.url}-issues-${index}`}
                    feed={feed}
                    validation={validations.get(feed.url)}
                    onRemove={onRemove}
                    onRetry={onRetry}
                    onEdit={onEdit}
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

            {collectionCount > 0 && (
              <section className={SURFACE_CLASS}>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-[rgb(var(--theme-text-readable))]">
                    Coleção
                  </h3>
                  <span className="rounded-full bg-[rgba(var(--color-background),0.48)] px-3 py-1.5 text-xs font-semibold text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))] shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]">
                    {collectionCount}
                  </span>
                </div>

                <div className="space-y-3">
                  {uncheckedFeeds.length > 0 && (
                    <Subgroup
                      title={`Pendentes de validação (${uncheckedFeeds.length})`}
                      open={showPendingFeeds}
                      onToggle={() =>
                        setShowPendingFeeds((current) => !current)
                      }
                    >
                      {uncheckedFeeds.map((feed, index) => (
                        <FeedItem
                          key={`${feed.url}-unchecked-${index}`}
                          feed={feed}
                          validation={validations.get(feed.url)}
                          onRemove={onRemove}
                          onRetry={onRetry}
                          onEdit={onEdit}
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
                    </Subgroup>
                  )}

                  {validFeeds.length > 0 && (
                    <Subgroup
                      title={`Válidos (${validFeeds.length})`}
                      open={showHealthyFeeds}
                      onToggle={() =>
                        setShowHealthyFeeds((current) => !current)
                      }
                    >
                      {validFeeds.map((feed, index) => (
                        <FeedItem
                          key={`${feed.url}-valid-${index}`}
                          feed={feed}
                          validation={validations.get(feed.url)}
                          onRemove={onRemove}
                          onRetry={onRetry}
                          onEdit={onEdit}
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
                    </Subgroup>
                  )}
                </div>
              </section>
            )}
          </>
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
  children: React.ReactNode;
}> = ({ title, children }) => (
  <section className="rounded-[24px] bg-[rgba(var(--color-error),0.08)] p-5 shadow-[0_24px_52px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.025)]">
    <div className="mb-4 flex items-center justify-between gap-3">
      <h3 className="text-lg font-semibold text-[rgb(var(--theme-text-readable))]">
        {title}
      </h3>
    </div>
    <div className="space-y-3">{children}</div>
  </section>
);

const Subgroup: React.FC<{
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}> = ({ title, open, onToggle, children }) => (
  <div className="rounded-[20px] bg-[rgb(var(--theme-manager-elevated,var(--theme-surface-elevated,var(--color-surface))))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-4 rounded-[16px] px-2 py-1 text-left"
    >
      <span className="text-sm font-semibold text-[rgb(var(--theme-text-readable))]">
        {title}
      </span>
      <span className="text-xs font-semibold text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))]">
        {open ? "Ocultar" : "Mostrar"}
      </span>
    </button>
    {open && <div className="mt-3 space-y-3">{children}</div>}
  </div>
);
