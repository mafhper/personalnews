import {
  favoriteToArticle,
  inferFavoriteMediaType,
  type FavoriteArticle,
  type FavoriteMediaType,
} from "../hooks/useFavorites";
import type { Article } from "../types";
import {
  buildFavoriteSourceKey,
  matchesFavoriteSourceKey,
} from "./favoriteSource";

export type FavoriteReadFilter = "all" | "unread" | "read";
export type FavoriteMediaFilter = "all" | FavoriteMediaType;
export type FavoriteSortMode = "saved-desc" | "published-desc" | "source-asc";

export interface FavoriteToolbarOption {
  value: string;
  label: string;
}

export interface FavoriteToolbarOptions {
  categories: FavoriteToolbarOption[];
  sources: FavoriteToolbarOption[];
}

export interface FilterAndSortFavoritesOptions {
  readFilter: FavoriteReadFilter;
  mediaFilter: FavoriteMediaFilter;
  categoryFilter: string;
  sourceKey: string | null;
  sortMode: FavoriteSortMode;
  isArticleRead: (article: Article) => boolean;
}

const ALL_OPTION: FavoriteToolbarOption = {
  value: "all",
  label: "Todas",
};

const getTime = (value: string) => {
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
};

const compareText = (left: string | undefined, right: string | undefined) =>
  (left || "").localeCompare(right || "", "pt-BR", {
    sensitivity: "base",
  });

export const getFavoriteToolbarOptions = (
  favorites: FavoriteArticle[],
): FavoriteToolbarOptions => {
  const categories = new Map<string, string>();
  const sources = new Map<string, string>();

  favorites.forEach((favorite) => {
    favorite.categories?.forEach((category) => {
      const label = category.trim();
      if (!label) return;
      categories.set(label.toLowerCase(), label);
    });

    const sourceKey = buildFavoriteSourceKey(favorite);
    if (!sourceKey) return;

    const sourceLabel =
      favorite.sourceTitle?.trim() || favorite.feedUrl?.trim() || sourceKey;
    sources.set(sourceKey, sourceLabel);
  });

  return {
    categories: [
      { ...ALL_OPTION, label: "Todas as categorias" },
      ...Array.from(categories.values())
        .sort((a, b) => compareText(a, b))
        .map((label) => ({ value: label, label })),
    ],
    sources: [
      { ...ALL_OPTION, label: "Todas as fontes" },
      ...Array.from(sources.entries())
        .sort((a, b) => compareText(a[1], b[1]))
        .map(([value, label]) => ({ value, label })),
    ],
  };
};

export const filterAndSortFavorites = (
  favorites: FavoriteArticle[],
  options: FilterAndSortFavoritesOptions,
): FavoriteArticle[] => {
  const {
    readFilter,
    mediaFilter,
    categoryFilter,
    sourceKey,
    sortMode,
    isArticleRead,
  } = options;

  const filtered = favorites.filter((favorite) => {
    if (
      sourceKey &&
      sourceKey !== "all" &&
      !matchesFavoriteSourceKey(favorite, sourceKey)
    ) {
      return false;
    }

    if (
      categoryFilter !== "all" &&
      !favorite.categories?.some(
        (category) =>
          category.trim().toLowerCase() === categoryFilter.toLowerCase(),
      )
    ) {
      return false;
    }

    if (
      mediaFilter !== "all" &&
      (favorite.mediaType || inferFavoriteMediaType(favorite)) !== mediaFilter
    ) {
      return false;
    }

    if (readFilter !== "all") {
      const isRead = isArticleRead(favoriteToArticle(favorite));
      if (readFilter === "read" && !isRead) return false;
      if (readFilter === "unread" && isRead) return false;
    }

    return true;
  });

  return [...filtered].sort((a, b) => {
    if (sortMode === "published-desc") {
      return getTime(b.pubDate) - getTime(a.pubDate);
    }

    if (sortMode === "source-asc") {
      return (
        compareText(a.sourceTitle, b.sourceTitle) ||
        compareText(a.title, b.title)
      );
    }

    return getTime(b.favoritedAt) - getTime(a.favoritedAt);
  });
};
