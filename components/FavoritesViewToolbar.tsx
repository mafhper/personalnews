import React from "react";
import { ActionIcons } from "./icons";
import type {
  FavoriteMediaFilter,
  FavoriteReadFilter,
  FavoriteSortMode,
  FavoriteToolbarOption,
} from "../utils/favoriteViewFilters";

interface FavoritesViewToolbarProps {
  totalCount: number;
  visibleCount: number;
  unreadCount: number;
  readFilter: FavoriteReadFilter;
  mediaFilter: FavoriteMediaFilter;
  categoryFilter: string;
  sourceKey: string | null;
  sortMode: FavoriteSortMode;
  categoryOptions: FavoriteToolbarOption[];
  sourceOptions: FavoriteToolbarOption[];
  hasActiveFilters: boolean;
  onReadFilterChange: (filter: FavoriteReadFilter) => void;
  onMediaFilterChange: (filter: FavoriteMediaFilter) => void;
  onCategoryFilterChange: (category: string) => void;
  onSourceKeyChange: (sourceKey: string | null) => void;
  onSortModeChange: (mode: FavoriteSortMode) => void;
  onClearFilters: () => void;
}

const readOptions: Array<{ value: FavoriteReadFilter; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "unread", label: "Não lidos" },
  { value: "read", label: "Lidos" },
];

const mediaOptions: Array<{ value: FavoriteMediaFilter; label: string }> = [
  { value: "all", label: "Todos os tipos" },
  { value: "article", label: "Artigos" },
  { value: "podcast", label: "Podcasts" },
  { value: "video", label: "Vídeos" },
  { value: "unknown", label: "Outros" },
];

const sortOptions: Array<{ value: FavoriteSortMode; label: string }> = [
  { value: "saved-desc", label: "Salvos recentemente" },
  { value: "published-desc", label: "Publicados recentemente" },
  { value: "source-asc", label: "Fonte A-Z" },
];

const selectClassName =
  "h-9 min-w-0 rounded-lg border border-[rgb(var(--color-border))]/20 bg-[rgb(var(--theme-surface-elevated,var(--color-surface)))] px-3 text-xs font-semibold text-[rgb(var(--color-text))] outline-none transition focus:border-[rgb(var(--color-accent))]/55 focus:ring-2 focus:ring-[rgb(var(--color-accent))]/20";

export const FavoritesViewToolbar: React.FC<FavoritesViewToolbarProps> = ({
  totalCount,
  visibleCount,
  unreadCount,
  readFilter,
  mediaFilter,
  categoryFilter,
  sourceKey,
  sortMode,
  categoryOptions,
  sourceOptions,
  hasActiveFilters,
  onReadFilterChange,
  onMediaFilterChange,
  onCategoryFilterChange,
  onSourceKeyChange,
  onSortModeChange,
  onClearFilters,
}) => {
  return (
    <section className="feed-page-frame mb-5" aria-label="Filtros de favoritos">
      <div className="rounded-xl border border-[rgb(var(--color-border))]/16 bg-[rgb(var(--theme-surface-readable,var(--color-surface)))]/78 px-3 py-3 shadow-[0_18px_44px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.025)] backdrop-blur-xl sm:px-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[rgb(var(--color-textSecondary))]">
            <span className="inline-flex items-center gap-2 rounded-lg border border-[rgb(var(--color-border))]/14 bg-[rgb(var(--theme-surface-elevated,var(--color-surface)))] px-3 py-2 text-[rgb(var(--color-text))]">
              <ActionIcons.Filter className="h-3.5 w-3.5 text-[rgb(var(--color-accent))]" />
              Favoritos
            </span>
            <span>{visibleCount} de {totalCount} visíveis</span>
            <span>{unreadCount} não lidos</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              className="inline-flex h-9 rounded-lg border border-[rgb(var(--color-border))]/18 bg-[rgb(var(--theme-surface-elevated,var(--color-surface)))] p-1"
              aria-label="Filtro de leitura"
            >
              {readOptions.map((option) => {
                const isActive = option.value === readFilter;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => onReadFilterChange(option.value)}
                    className={`rounded-md px-3 text-xs font-bold transition ${
                      isActive
                        ? "bg-[rgb(var(--color-accent))]/18 text-[rgb(var(--color-text))] shadow-[inset_0_0_0_1px_rgb(var(--color-accent)/0.28)]"
                        : "text-[rgb(var(--color-textSecondary))] hover:text-[rgb(var(--color-text))]"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            <select
              aria-label="Tipo de favorito"
              className={selectClassName}
              value={mediaFilter}
              onChange={(event) =>
                onMediaFilterChange(event.target.value as FavoriteMediaFilter)
              }
            >
              {mediaOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              aria-label="Categoria de favorito"
              className={selectClassName}
              value={categoryFilter}
              onChange={(event) => onCategoryFilterChange(event.target.value)}
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              aria-label="Fonte de favorito"
              className={selectClassName}
              value={sourceKey || "all"}
              onChange={(event) =>
                onSourceKeyChange(
                  event.target.value === "all" ? null : event.target.value,
                )
              }
            >
              {sourceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <label className="inline-flex items-center gap-2 rounded-lg border border-[rgb(var(--color-border))]/18 bg-[rgb(var(--theme-surface-elevated,var(--color-surface)))] px-2">
              <ActionIcons.SortDesc className="h-3.5 w-3.5 text-[rgb(var(--color-textSecondary))]" />
              <select
                aria-label="Ordenação de favoritos"
                className="h-9 min-w-0 bg-transparent text-xs font-semibold text-[rgb(var(--color-text))] outline-none"
                value={sortMode}
                onChange={(event) =>
                  onSortModeChange(event.target.value as FavoriteSortMode)
                }
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={onClearFilters}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-[rgb(var(--color-border))]/18 bg-[rgb(var(--theme-surface-elevated,var(--color-surface)))] px-3 text-xs font-bold text-[rgb(var(--color-text))] transition hover:border-[rgb(var(--color-accent))]/38 hover:bg-[rgb(var(--color-accent))]/10"
              >
                <ActionIcons.Refresh className="h-3.5 w-3.5" />
                Limpar
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
