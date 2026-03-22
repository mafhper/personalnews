import React, { useState } from "react";
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
  // Add integration props
  newFeedUrl?: string;
  setNewFeedUrl?: (url: string) => void;
  newFeedCategory?: string;
  setNewFeedCategory?: (id: string) => void;
  processingUrl?: string | null;
  onSubmit?: (e: React.FormEvent) => void;
  discoveryProgress?: Map<string, { status: string; progress: number }>;
}

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
  newFeedUrl,
  setNewFeedUrl,
  newFeedCategory,
  setNewFeedCategory,
  processingUrl,
  onSubmit,
  discoveryProgress,
}) => {
  const { t } = useLanguage();

  // Local state for filtering and display
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedSection, setExpandedSection] = useState<
    "valid" | "issues" | "unchecked" | null
  >("issues");

  const totalFeeds = feeds.length;
  const validCount = feeds.filter((f) => validations.get(f.url)?.isValid).length;
  const invalidCount = feeds.filter((f) => {
    const val = validations.get(f.url);
    return val && !val.isValid;
  }).length;
  const pendingCount = feeds.filter((f) => !validations.has(f.url)).length;

  const toggleSection = (section: "valid" | "issues" | "unchecked") => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Filter Logic
  const filteredFeeds = feeds.filter((feed) => {
    const validation = validations.get(feed.url);

    // Search filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      feed.url.toLowerCase().includes(searchLower) ||
      (validation?.title &&
        validation.title.toLowerCase().includes(searchLower)) ||
      (validation?.description &&
        validation.description.toLowerCase().includes(searchLower)) ||
      (feed.customTitle &&
        feed.customTitle.toLowerCase().includes(searchLower));

    // Status filter
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "valid" && validation?.status === "valid") ||
      (statusFilter === "invalid" &&
        validation?.status &&
        validation.status !== "valid") ||
      (statusFilter === "unchecked" && !validation);

    return matchesSearch && matchesStatus;
  });

  // Grouping
  const validFeeds = filteredFeeds.filter((f) => {
    const val = validations.get(f.url);
    return !val || val.isValid;
  });
  const issueFeeds = filteredFeeds.filter((f) => {
    const val = validations.get(f.url);
    return val && !val.isValid;
  });
  const uncheckedFeeds = filteredFeeds.filter((f) => !validations.has(f.url));

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto w-full">
      {/* Summary Row */}
      <div className="px-3 pb-3 pt-4 sm:px-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <SummaryCard label="Total" value={totalFeeds} tone="neutral" />
          <SummaryCard label={t("analytics.valid") || "Válidos"} value={validCount} tone="success" />
          <SummaryCard label={t("analytics.issues") || "Com erro"} value={invalidCount} tone="danger" />
          <SummaryCard label={t("analytics.pending") || "Pendentes"} value={pendingCount} tone="warning" />
        </div>
      </div>
      {/* Add Feed - Primary Action */}
      {typeof onSubmit === "function" &&
        setNewFeedUrl &&
        setNewFeedCategory && (
          <div className="px-3 pb-3 sm:px-4">
            <div className="rounded-[22px] border border-white/8 bg-[linear-gradient(180deg,rgba(var(--color-accent),0.08),rgba(255,255,255,0.02))] p-4 shadow-[0_18px_48px_rgba(0,0,0,0.16)]">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--theme-text-secondary-readable))]">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-[rgba(var(--color-accent),0.14)] text-[rgba(var(--color-accent),0.92)]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </span>
              <span className="font-semibold text-[rgb(var(--theme-text-readable))]">Adicionar novo feed</span>
              <span className="text-[10px] text-[rgba(var(--color-textSecondary),0.72)]">Cole a URL, categorize e deixe o sistema validar em seguida.</span>
            </div>
            <form onSubmit={onSubmit} className="flex flex-col sm:flex-row items-stretch gap-2">
              <input
                type="url"
                placeholder="https://site.com/rss"
                value={newFeedUrl || ""}
                onChange={(e) => setNewFeedUrl(e.target.value)}
                disabled={processingUrl !== null}
                className="flex-1 rounded-2xl border border-white/8 bg-black/12 px-3 py-2.5 text-sm text-[rgb(var(--theme-control-text))] transition-colors focus:border-[rgba(var(--color-accent),0.5)] focus:bg-black/18 focus:outline-none disabled:opacity-50"
              />
              <select
                value={newFeedCategory || ""}
                onChange={(e) => setNewFeedCategory(e.target.value)}
                disabled={processingUrl !== null}
                className="rounded-2xl border border-white/8 bg-black/12 px-3 py-2.5 text-sm text-[rgb(var(--theme-control-text))] transition-colors focus:border-[rgba(var(--color-accent),0.5)] focus:bg-black/18 focus:outline-none disabled:opacity-50 sm:w-44"
              >
                <option value="">Sem categoria</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={processingUrl !== null}
                className="rounded-2xl border border-[rgba(var(--color-accent),0.24)] bg-[rgba(var(--color-accent),0.14)] px-4 py-2.5 text-sm font-semibold text-[rgba(var(--color-accent),0.98)] transition-colors hover:bg-[rgba(var(--color-accent),0.2)] disabled:opacity-50"
              >
                {processingUrl ? "Processando..." : "Adicionar"}
              </button>
            </form>
            {processingUrl && discoveryProgress?.get(processingUrl) && (
              <div className="mt-3 text-xs text-[rgb(var(--color-textSecondary))]">
                {discoveryProgress.get(processingUrl)?.status} (
                {discoveryProgress.get(processingUrl)?.progress}%)
              </div>
            )}
            </div>
          </div>
        )}

      {/* Search and Filter Bar */}
      <div className="px-3 pb-3 sm:px-4">
        <div className="flex flex-col gap-3 rounded-[22px] border border-white/8 bg-white/4 p-3.5 animate-in fade-in shadow-[0_16px_42px_rgba(0,0,0,0.14)] sm:flex-row sm:gap-4">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[rgb(var(--color-textSecondary))]/70"
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
            placeholder={t("search.placeholder") || "Buscar..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl border border-white/8 bg-black/10 py-2.5 pl-10 pr-4 text-[rgb(var(--theme-control-text))] transition-colors focus:border-[rgba(var(--color-accent),0.45)] focus:bg-black/16 focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 rounded-2xl border border-white/8 bg-black/10 px-4 py-2.5 text-[rgb(var(--theme-control-text))] transition-colors focus:border-[rgba(var(--color-accent),0.45)] focus:bg-black/16 focus:outline-none sm:flex-none"
          >
            <option value="all">Todos</option>
            <option value="valid">{t("analytics.valid")}</option>
            <option value="invalid">{t("analytics.issues")}</option>
            <option value="unchecked">{t("analytics.pending")}</option>
          </select>

          {onRefreshAll && (
            <button
              onClick={() => {
                if (
                  window.confirm(
                    "Deseja forçar a revalidação de todos os feeds? Isso pode levar alguns instantes.",
                  )
                ) {
                  onRefreshAll();
                }
              }}
              className="rounded-2xl border border-white/8 bg-black/10 p-2.5 text-sky-200/80 transition-colors hover:bg-black/16"
              title="Forçar Revalidação"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          )}
        </div>
        </div>
      </div>

      {/* Lists */}
      <div
        className="flex-1 overflow-y-auto pr-1 sm:pr-2 custom-scrollbar p-3 sm:p-4 space-y-3"
        role="list"
      >
        {/* Empty State */}
        {filteredFeeds.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-[rgb(var(--color-textSecondary))]/70">
            <svg
              className="w-16 h-16 mb-4 opacity-20"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <p>Nenhum feed encontrado com os filtros atuais.</p>
          </div>
        )}

        {/* Issues Section */}
        {issueFeeds.length > 0 && (
          <div className="overflow-hidden rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] animate-in fade-in slide-in-from-left-2 shadow-[0_18px_46px_rgba(0,0,0,0.16)]">
            <button
              onClick={() => toggleSection("issues")}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-[rgba(255,80,80,0.12)] via-[rgba(255,255,255,0.02)] to-transparent hover:from-[rgba(255,80,80,0.18)] transition-colors"
            >
              <div className="flex items-center space-x-2 text-[rgba(var(--color-error),0.9)]">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <span className="font-medium">
                  {t("analytics.attention")} ({issueFeeds.length})
                </span>
              </div>
              <svg
                className={`w-5 h-5 text-[rgba(var(--color-error),0.8)] transform transition-transform ${expandedSection === "issues" ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {expandedSection === "issues" && (
              <div className="space-y-2 bg-black/8 p-4">
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
                    onMoveCategory={(catId: string) =>
                      onMoveCategory(feed.url, catId)
                    }
                    onToggleHideFromAll={onToggleHideFromAll}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Valid Section */}
        {validFeeds.length > 0 && (
          <div className="overflow-hidden rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] animate-in fade-in slide-in-from-left-2 delay-75 shadow-[0_18px_46px_rgba(0,0,0,0.16)]">
            <button
              onClick={() => toggleSection("valid")}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-[rgba(16,185,129,0.12)] via-[rgba(255,255,255,0.02)] to-transparent hover:from-[rgba(16,185,129,0.18)] transition-colors"
            >
              <div className="flex items-center space-x-2 text-[rgba(var(--color-success),0.9)]">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="font-medium">
                  {t("analytics.valid")} ({validFeeds.length})
                </span>
              </div>
              <svg
                className={`w-5 h-5 text-[rgba(var(--color-success),0.8)] transform transition-transform ${expandedSection === "valid" ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {expandedSection === "valid" && (
              <div className="space-y-2 bg-black/8 p-4">
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
                    onMoveCategory={(catId: string) =>
                      onMoveCategory(feed.url, catId)
                    }
                    onToggleHideFromAll={onToggleHideFromAll}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Unchecked Section */}
        {uncheckedFeeds.length > 0 && (
          <div className="overflow-hidden rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] animate-in fade-in slide-in-from-left-2 delay-100 shadow-[0_18px_46px_rgba(0,0,0,0.16)]">
            <button
              onClick={() => toggleSection("unchecked")}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-[rgba(148,163,184,0.12)] via-[rgba(255,255,255,0.02)] to-transparent hover:from-[rgba(148,163,184,0.2)] transition-colors"
            >
              <div className="flex items-center space-x-2 text-[rgba(var(--color-text),0.9)]">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="font-medium">
                  {t("analytics.pending")} ({uncheckedFeeds.length})
                </span>
              </div>
              <svg
                className={`w-5 h-5 text-[rgb(var(--theme-text-secondary-readable))] transform transition-transform ${expandedSection === "unchecked" ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {expandedSection === "unchecked" && (
              <div className="space-y-2 bg-black/8 p-4">
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
                    onMoveCategory={(catId: string) =>
                      onMoveCategory(feed.url, catId)
                    }
                    onToggleHideFromAll={onToggleHideFromAll}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const SummaryCard: React.FC<{
  label: string;
  value: number;
  tone: "neutral" | "success" | "warning" | "danger";
}> = ({ label, value, tone }) => {
  const toneClasses = {
    neutral: "from-[rgba(var(--color-text),0.05)] to-transparent text-[rgb(var(--theme-text-readable))] border-white/8",
    success: "from-[rgba(var(--color-success),0.08)] to-transparent text-[rgb(var(--color-success))] border-[rgba(var(--color-success),0.15)]",
    warning: "from-[rgba(var(--color-warning),0.08)] to-transparent text-[rgb(var(--color-warning))] border-[rgba(var(--color-warning),0.15)]",
    danger: "from-[rgba(var(--color-error),0.08)] to-transparent text-[rgb(var(--color-error))] border-[rgba(var(--color-error),0.15)]",
  } as const;

  return (
    <div
      className={`flex items-center justify-between rounded-[18px] border bg-gradient-to-br px-3 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.12)] ${toneClasses[tone]}`}
    >
      <span className="text-[10px] uppercase tracking-widest font-semibold">
        {label}
      </span>
      <span className="text-lg font-bold">{value}</span>
    </div>
  );
};
