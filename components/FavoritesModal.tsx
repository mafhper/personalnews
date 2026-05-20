import React, { useState, useMemo, useCallback } from "react";
import { Modal } from "./Modal";
import { LazyImage } from "./LazyImage";
import type { FavoriteArticle, FavoriteMediaType } from "../hooks/useFavorites";
import {
  favoriteToArticle,
  inferFavoriteMediaType,
  useFavorites,
} from "../hooks/useFavorites";
import { useNotificationReplacements } from "../hooks/useNotificationReplacements";
import { ActionIcons, StatusIcons } from "./icons";
import { sanitizeArticleDescription } from "../utils/sanitization";

interface FavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FavoritesModal: React.FC<FavoritesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    favorites,
    removeFromFavorites,
    clearAllFavorites,
    exportFavorites,
    importFavorites,
  } = useFavorites();

  // Hook para notificações integradas
  const { alertSuccess, alertError } = useNotificationReplacements();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedSource, setSelectedSource] = useState<string>("All");
  const [selectedMediaType, setSelectedMediaType] = useState<
    "all" | FavoriteMediaType
  >("all");
  const [sortBy, setSortBy] = useState<"recent" | "title" | "source">("recent");
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  // Get unique categories and sources from favorites
  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    favorites.forEach((fav) => {
      fav.categories?.forEach((cat) => categories.add(cat));
    });
    return ["All", ...Array.from(categories).sort()];
  }, [favorites]);

  const availableSources = useMemo(() => {
    const sources = new Set<string>();
    favorites.forEach((fav) => {
      sources.add(fav.sourceTitle);
      if (fav.author) sources.add(fav.author);
    });
    return ["All", ...Array.from(sources).sort()];
  }, [favorites]);

  // Filter and sort favorites
  const filteredFavorites = useMemo(() => {
    let filtered = favorites;

    // Apply category filter
    if (selectedCategory !== "All") {
      filtered = filtered.filter((fav) =>
        fav.categories?.some(
          (cat) => cat.toLowerCase() === selectedCategory.toLowerCase(),
        ),
      );
    }

    // Apply source filter
    if (selectedSource && selectedSource !== "All") {
      filtered = filtered.filter(
        (fav) =>
          fav.sourceTitle.toLowerCase().includes(selectedSource.toLowerCase()) ||
          fav.author?.toLowerCase().includes(selectedSource.toLowerCase()),
      );
    }

    if (selectedMediaType !== "all") {
      filtered = filtered.filter(
        (fav) => (fav.mediaType || inferFavoriteMediaType(fav)) === selectedMediaType,
      );
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (fav) =>
          fav.title.toLowerCase().includes(query) ||
          fav.sourceTitle.toLowerCase().includes(query) ||
          fav.author?.toLowerCase().includes(query) ||
          fav.description?.toLowerCase().includes(query)
      );
    }

    // Sort results
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "title":
          return a.title.localeCompare(b.title);
        case "source":
          return a.sourceTitle.localeCompare(b.sourceTitle);
        case "recent":
        default:
          return (
            new Date(b.favoritedAt).getTime() -
            new Date(a.favoritedAt).getTime()
          );
      }
    });

    return sorted;
  }, [
    favorites,
    selectedCategory,
    selectedSource,
    selectedMediaType,
    searchQuery,
    sortBy,
  ]);

  const handleExport = useCallback(() => {
    const data = exportFavorites();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `favorites-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [exportFavorites]);

  const handleImport = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        const success = importFavorites(content);
        if (success) {
          await alertSuccess("Favoritos importados.");
        } else {
          await alertError(
            "Não foi possível importar os favoritos."
          );
        }
      };
      reader.readAsText(file);

      // Reset the input
      event.target.value = "";
    },
    [importFavorites, alertSuccess, alertError]
  );

  const handleRemoveFavorite = useCallback(
    (favorite: FavoriteArticle) => {
      const article = favoriteToArticle(favorite);
      removeFromFavorites(article);
    },
    [removeFromFavorites]
  );

  const handleClearAll = useCallback(() => {
    clearAllFavorites();
    setShowConfirmClear(false);
  }, [clearAllFavorites]);

  const timeSince = (dateString: string): string => {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval >= 1) return `há ${Math.floor(interval)} ano${Math.floor(interval) === 1 ? "" : "s"}`;
    interval = seconds / 2592000;
    if (interval >= 1) return `há ${Math.floor(interval)} mês${Math.floor(interval) === 1 ? "" : "es"}`;
    interval = seconds / 86400;
    if (interval >= 1) return `há ${Math.floor(interval)} dia${Math.floor(interval) === 1 ? "" : "s"}`;
    interval = seconds / 3600;
    if (interval >= 1) return `há ${Math.floor(interval)} hora${Math.floor(interval) === 1 ? "" : "s"}`;
    interval = seconds / 60;
    if (interval >= 1) return `há ${Math.floor(interval)} minuto${Math.floor(interval) === 1 ? "" : "s"}`;
    return "agora";
  };

  const controlClass =
    "h-10 rounded-xl border-0 bg-[rgb(var(--theme-manager-control,var(--theme-control-bg,var(--color-surface))))] px-3 text-sm text-[rgb(var(--theme-manager-text,var(--color-text)))] shadow-[inset_0_0_0_1px_rgb(var(--color-text)/0.07)] outline-none transition focus:ring-2 focus:ring-[rgb(var(--color-accent))]/25";
  const actionClass =
    "inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-[rgb(var(--theme-manager-control,var(--theme-control-bg,var(--color-surface))))] px-3 text-sm font-bold text-[rgb(var(--theme-manager-text,var(--color-text)))] shadow-[inset_0_0_0_1px_rgb(var(--color-text)/0.07)] transition hover:bg-[rgb(var(--theme-manager-soft,var(--theme-control-bg,var(--color-surface))))] disabled:cursor-not-allowed disabled:opacity-45";
  const metaPillClass =
    "rounded-full bg-[rgb(var(--theme-manager-control,var(--theme-control-bg,var(--color-surface))))] px-3 py-1.5 text-xs font-bold text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))] shadow-[inset_0_0_0_1px_rgb(var(--color-text)/0.06)]";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="6xl"
      title="Favoritos"
      description={`${favorites.length} artigo${favorites.length === 1 ? "" : "s"} salvo${favorites.length === 1 ? "" : "s"}`}
      tone="selection"
      bodyClassName="p-0"
      contentClassName="w-[min(96vw,72rem)]"
    >
      <div className="relative flex max-h-[calc(90vh-7rem)] flex-col overflow-hidden bg-[rgb(var(--theme-manager-surface,var(--color-surface)))]">
        <div className="space-y-4 border-b border-[rgb(var(--color-text))]/10 p-4 sm:p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-2">
              <span className={metaPillClass}>{favorites.length} salvos</span>
              <span className={metaPillClass}>
                {Math.max(availableSources.length - 1, 0)} fontes
              </span>
              <span className={metaPillClass}>
                {filteredFavorites.length} visíveis
              </span>
            </div>

            <div className="flex flex-wrap gap-2 xl:justify-end">
              <button type="button" onClick={handleExport} className={actionClass}>
                <ActionIcons.Export />
                Exportar
              </button>
              <label className={actionClass}>
                <ActionIcons.Import />
                Importar
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
              <button
                type="button"
                onClick={() => setShowConfirmClear(true)}
                className={`${actionClass} bg-[rgb(var(--color-error))]/12 text-[rgb(var(--color-error))] hover:bg-[rgb(var(--color-error))]/18`}
                disabled={favorites.length === 0}
              >
                <ActionIcons.Delete />
                Limpar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(14rem,1.35fr)_1fr_1fr_1fr_1fr]">
            <label className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-textSecondary))]">
                <ActionIcons.Search />
              </span>
              <input
                type="text"
                placeholder="Buscar favoritos"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${controlClass} w-full pl-10`}
              />
            </label>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={controlClass}
            >
              {availableCategories.map((category) => (
                <option key={category} value={category}>
                  {category === "All" ? "Todas as categorias" : category}
                </option>
              ))}
            </select>

            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className={controlClass}
            >
              {availableSources.map((source) => (
                <option key={source} value={source}>
                  {source === "All" ? "Todas as fontes" : source}
                </option>
              ))}
            </select>

            <select
              value={selectedMediaType}
              onChange={(e) =>
                setSelectedMediaType(e.target.value as "all" | FavoriteMediaType)
              }
              className={controlClass}
              aria-label="Tipo de favorito"
            >
              <option value="all">Todos os tipos</option>
              <option value="article">Artigos</option>
              <option value="podcast">Podcasts</option>
              <option value="video">Vídeos</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "recent" | "title" | "source")
              }
              className={controlClass}
            >
              <option value="recent">Mais recentes</option>
              <option value="title">Título A-Z</option>
              <option value="source">Fonte A-Z</option>
            </select>
          </div>
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto p-3 sm:p-4">
          {filteredFavorites.length === 0 ? (
            <div className="flex min-h-[18rem] flex-col items-center justify-center rounded-[1.05rem] bg-[rgb(var(--theme-manager-control,var(--theme-control-bg,var(--color-surface))))] p-8 text-center shadow-[inset_0_0_0_1px_rgb(var(--color-text)/0.07)]">
              <StatusIcons.Success className="mb-5 h-12 w-12 text-[rgb(var(--color-accent))]" />
              <h3 className="text-lg font-black text-[rgb(var(--theme-manager-text,var(--color-text)))]">
                {favorites.length === 0
                  ? "Nenhum favorito ainda"
                  : "Nenhum favorito encontrado"}
              </h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))]">
                {favorites.length === 0
                  ? "Os artigos salvos ficam reunidos aqui."
                  : "Ajuste a busca ou os filtros para ver outros artigos salvos."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredFavorites.map((favorite) => (
                <article
                  key={favorite.id}
                  className="group rounded-[1.05rem] bg-[rgb(var(--theme-manager-control,var(--theme-control-bg,var(--color-surface))))] p-3 shadow-[inset_0_0_0_1px_rgb(var(--color-text)/0.07)] transition hover:bg-[rgb(var(--theme-manager-soft,var(--theme-control-bg,var(--color-surface))))]"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                    <LazyImage
                      src={
                        favorite.imageUrl ||
                        `https://picsum.photos/seed/${favorite.link}/160/120`
                      }
                      alt={`Imagem de ${favorite.title}`}
                      className="h-32 w-full flex-shrink-0 rounded-xl object-cover shadow-[inset_0_0_0_1px_rgb(var(--color-text)/0.08)] sm:h-20 sm:w-28"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex gap-3">
                        <div className="min-w-0 flex-1">
                          <a
                            href={favorite.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="line-clamp-2 text-base font-black leading-tight text-[rgb(var(--theme-manager-text,var(--color-text)))] transition group-hover:text-[rgb(var(--color-accent))]"
                          >
                            {favorite.title}
                          </a>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))]">
                            <span className="max-w-[14rem] truncate rounded-full bg-[rgb(var(--color-accent))]/10 px-2.5 py-1 font-bold text-[rgb(var(--theme-manager-text,var(--color-text)))]">
                              {favorite.author || favorite.sourceTitle}
                            </span>
                            <span>{timeSince(favorite.pubDate)}</span>
                            <span>Salvo {timeSince(favorite.favoritedAt)}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFavorite(favorite)}
                          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[rgb(var(--color-error))]/10 text-[rgb(var(--color-error))] transition hover:bg-[rgb(var(--color-error))]/20"
                          title="Remover dos favoritos"
                          aria-label="Remover dos favoritos"
                        >
                          <StatusIcons.Success className="h-4 w-4" />
                        </button>
                      </div>
                      {favorite.description && (
                        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))]">
                          {sanitizeArticleDescription(favorite.description)}
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {showConfirmClear && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/62 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-[1.05rem] bg-[rgb(var(--theme-manager-surface,var(--color-surface)))] p-5 text-[rgb(var(--theme-manager-text,var(--color-text)))] shadow-[0_24px_60px_rgba(0,0,0,0.34),inset_0_0_0_1px_rgb(var(--color-text)/0.08)]">
              <div className="mb-4 flex items-center gap-3">
                <StatusIcons.Warning className="h-6 w-6 text-[rgb(var(--color-warning))]" />
                <h3 className="text-lg font-black">Limpar favoritos?</h3>
              </div>
              <p className="mb-6 leading-relaxed text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))]">
                Isso remove permanentemente <strong>{favorites.length}</strong>{" "}
                artigo{favorites.length === 1 ? "" : "s"} salvo
                {favorites.length === 1 ? "" : "s"}.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-[rgb(var(--color-error))] px-4 text-sm font-black text-white transition hover:brightness-110"
                >
                  <ActionIcons.Delete />
                  Limpar
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmClear(false)}
                  className="inline-flex h-10 flex-1 items-center justify-center rounded-xl bg-[rgb(var(--theme-manager-control,var(--theme-control-bg,var(--color-surface))))] px-4 text-sm font-black text-[rgb(var(--theme-manager-text,var(--color-text)))] shadow-[inset_0_0_0_1px_rgb(var(--color-text)/0.08)] transition hover:bg-[rgb(var(--color-accent))]/10"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
