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
    <section
      className="favorites-toolbar-frame"
      aria-label="Filtros de favoritos"
    >
      <div className="favorites-toolbar">
        <div className="favorites-toolbar__summary">
          <span className="favorites-toolbar__chip">
            <ActionIcons.Filter className="h-3.5 w-3.5" />
            <span>
              Favoritos
            </span>
          </span>
          <span>{visibleCount} de {totalCount} visíveis</span>
          <span>{unreadCount} não lidos</span>
        </div>

        <div className="favorites-toolbar__controls">
          <div className="favorites-toolbar__segmented" aria-label="Filtro de leitura">
            {readOptions.map((option) => {
              const isActive = option.value === readFilter;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => onReadFilterChange(option.value)}
                  className={`favorites-toolbar__segment ${
                    isActive ? "favorites-toolbar__segment--active" : ""
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <select
            aria-label="Tipo de favorito"
            className="favorites-toolbar__select"
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
            className="favorites-toolbar__select"
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
            className="favorites-toolbar__select"
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

          <label className="favorites-toolbar__sort">
            <ActionIcons.SortDesc className="h-3.5 w-3.5" />
            <select
              aria-label="Ordenação de favoritos"
              className="favorites-toolbar__sort-select"
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
              className="favorites-toolbar__clear"
            >
              <ActionIcons.Refresh className="h-3.5 w-3.5" />
              Limpar
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
