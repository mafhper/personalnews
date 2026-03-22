/**
 * FeedCategoryManager.tsx
 *
 * Componente para gerenciamento de categorias de feeds no Personal News Dashboard.
 * Permite criar, editar, excluir e reorganizar categorias, além de arrastar feeds entre categorias.
 * Suporta importação e exportação de configurações de categorias.
 *
 * @author Matheus Pereira
 * @version 2.1.0
 */

import React, { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { useFeedCategories } from "../hooks/useFeedCategories";
import { useLogger } from "../services/logger";
import type { FeedSource, FeedCategory } from "../types";
import { sanitizeHtmlContent } from "../utils/sanitization";
import { useNotificationReplacements } from "../hooks/useNotificationReplacements";
import { useLanguage } from "../hooks/useLanguage";
import { useAppearance } from "../hooks/useAppearance";
import { OPMLExportService } from "../services/opmlExportService";
import { parseOpml } from "../services/rssParser";
import { Switch } from "./ui/Switch";

interface FeedCategoryManagerProps {
  feeds: FeedSource[];
  setFeeds: React.Dispatch<React.SetStateAction<FeedSource[]>>;
  onClose: () => void;
}

interface DragState {
  draggedItem: {
    type: "feed" | "category";
    id: string;
    data: FeedSource | FeedCategory;
  } | null;
  dragOverCategory: string | null;
}

export const FeedCategoryManager: React.FC<FeedCategoryManagerProps> = ({
  feeds,
  setFeeds,
}) => {
  const logger = useLogger("FeedCategoryManager");
  const { t } = useLanguage();
  const { refreshAppearance } = useAppearance();
  const {
    categories,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    getCategorizedFeeds,
    moveFeedToCategory,
    importCategories,
    resetToDefaults,
  } = useFeedCategories();

  // Hook para notificações integradas
  const { alertSuccess, alertError, confirmDanger } =
    useNotificationReplacements();

  const [dragState, setDragState] = useState<DragState>({
    draggedItem: null,
    dragOverCategory: null,
  });
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingCategoryForm, setEditingCategoryForm] = useState<{
    name: string;
    color: string;
    description: string;
    layoutMode?: FeedCategory["layoutMode"];
    autoDiscovery?: boolean;
  }>({
    name: "",
    color: "#3B82F6",
    description: "",
    layoutMode: undefined,
    autoDiscovery: true,
  });
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});
  const [newCategoryForm, setNewCategoryForm] = useState<{
    name: string;
    color: string;
    description: string;
    layoutMode?: FeedCategory["layoutMode"];
    autoDiscovery?: boolean;
  }>({
    name: "",
    color: "#3B82F6",
    description: "",
    layoutMode: undefined,
    autoDiscovery: true,
  });
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false); // Show only first 2 categories by default
  const fileInputRef = useRef<HTMLInputElement>(null);
  const opmlFileInputRef = useRef<HTMLInputElement>(null);
  const [importTargetCategory, setImportTargetCategory] = useState<
    string | null
  >(null);

  const categorizedFeeds = getCategorizedFeeds(feeds);

  // Filter categories to show (first 2 if not showAllCategories)
  const visibleCategories = showAllCategories
    ? categories
    : categories.slice(0, 2);
  const hiddenCategoriesCount = categories.length - visibleCategories.length;

  // Layout options for dropdown
  const layoutOptions: {
    value: FeedCategory["layoutMode"] | "";
    label: string;
  }[] = [
    { value: "", label: "Default (Use Global Setting)" },
    { value: "bento", label: "Bento" },
    { value: "brutalist", label: "Brutalist" },
    { value: "compact", label: "Compact" },
    { value: "cyberpunk", label: "Cyberpunk" },
    { value: "focus", label: "Focus" },
    { value: "gallery", label: "Gallery" },
    { value: "immersive", label: "Immersive" },
    { value: "list", label: "List" },
    { value: "magazine", label: "Magazine" },
    { value: "masonry", label: "Masonry" },
    { value: "minimal", label: "Minimal" },
    { value: "modern", label: "Modern" },
    { value: "newspaper", label: "Newspaper" },
    { value: "pocketfeeds", label: "PocketFeeds" },
    { value: "split", label: "Split" },
    { value: "terminal", label: "Terminal" },
    { value: "timeline", label: "Timeline" },
  ];

  const secondaryActionClass =
    "inline-flex items-center justify-center gap-2 rounded-2xl border border-white/8 bg-white/5 px-4 py-2.5 text-sm font-medium text-[rgb(var(--theme-text-readable))] transition-all hover:bg-white/9 hover:text-white";

  const handleDragStart = useCallback(
    (
      e: React.DragEvent,
      type: "feed" | "category",
      id: string,
      data: FeedSource | FeedCategory,
    ) => {
      setDragState((prev) => ({
        ...prev,
        draggedItem: { type, id, data },
      }));
      e.dataTransfer.effectAllowed = "move";
    },
    [],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, categoryId: string) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDragState((prev) => ({
        ...prev,
        dragOverCategory: categoryId,
      }));
    },
    [],
  );

  const handleExportOPML = async () => {
    // Generate OPML with category structure
    const opml = await OPMLExportService.generateOPML(feeds, categories);
    const blob = new Blob([opml], { type: "text/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `personal_news_with_categories_${new Date().toISOString().split("T")[0]}.opml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDragLeave = useCallback(() => {
    setDragState((prev) => ({
      ...prev,
      dragOverCategory: null,
    }));
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetCategoryId: string) => {
      e.preventDefault();

      if (!dragState.draggedItem) return;

      const { type, id, data } = dragState.draggedItem;

      if (type === "feed") {
        const feedData = data as FeedSource;
        moveFeedToCategory(feedData.url, targetCategoryId, feeds, setFeeds);
      } else if (type === "category") {
        // Handle category reordering
        const targetCategory = categories.find(
          (c) => c.id === targetCategoryId,
        );
        const draggedCategory = categories.find((c) => c.id === id);

        if (targetCategory && draggedCategory) {
          const newOrder = [...categories]
            .sort((a, b) => a.order - b.order)
            .map((c) => c.id);

          const draggedIndex = newOrder.indexOf(id);
          const targetIndex = newOrder.indexOf(targetCategoryId);

          newOrder.splice(draggedIndex, 1);
          newOrder.splice(targetIndex, 0, id);

          reorderCategories(newOrder);
        }
      }

      setDragState({
        draggedItem: null,
        dragOverCategory: null,
      });
    },
    [
      dragState.draggedItem,
      categories,
      feeds,
      setFeeds,
      moveFeedToCategory,
      reorderCategories,
    ],
  );

  // ... (handlers)

  // Update handleCreateCategory
  const handleCreateCategory = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (newCategoryForm.name.trim()) {
        createCategory(
          newCategoryForm.name.trim(),
          newCategoryForm.color,
          newCategoryForm.description.trim() || undefined,
          newCategoryForm.layoutMode,
          newCategoryForm.autoDiscovery,
        );
        setNewCategoryForm({
          name: "",
          color: "#3B82F6",
          description: "",
          layoutMode: undefined,
          autoDiscovery: true,
        });
        setShowNewCategoryForm(false);
      }
    },
    [newCategoryForm, createCategory],
  );

  const handleStartEditCategory = useCallback((category: FeedCategory) => {
    setEditingCategory(category.id);
    setEditingCategoryForm({
      name: category.name,
      color: category.color,
      description: category.description || "",
      layoutMode: category.layoutMode,
      autoDiscovery: category.autoDiscovery ?? true,
    });
  }, []);

  const handleSaveEditCategory = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (editingCategory && editingCategoryForm.name.trim()) {
        updateCategory(editingCategory, {
          name: editingCategoryForm.name.trim(),
          color: editingCategoryForm.color,
          description: editingCategoryForm.description.trim() || undefined,
          layoutMode: editingCategoryForm.layoutMode,
          autoDiscovery: editingCategoryForm.autoDiscovery,
        });
        setEditingCategory(null);
        setEditingCategoryForm({
          name: "",
          color: "#3B82F6",
          description: "",
          layoutMode: undefined,
          autoDiscovery: true,
        });
      }
    },
    [editingCategory, editingCategoryForm, updateCategory],
  );

  const handleCancelEditCategory = useCallback(() => {
    setEditingCategory(null);
    setEditingCategoryForm({
      name: "",
      color: "#3B82F6",
      description: "",
      layoutMode: undefined,
      autoDiscovery: true,
    });
  }, []);

  const handleDeleteCategory = useCallback(
    async (categoryId: string) => {
      const category = categories.find((c) => c.id === categoryId);
      const feedsInCategory = categorizedFeeds[categoryId] || [];
      const feedCount = feedsInCategory.length;

      let confirmMessage = `Tem certeza que deseja excluir a categoria "${category?.name}"?`;

      if (feedCount > 0) {
        confirmMessage += `\n\nEsta ação irá mover ${feedCount} feed${
          feedCount > 1 ? "s" : ""
        } para "Não categorizados":`;
        feedsInCategory.slice(0, 3).forEach((feed) => {
          confirmMessage += `\n• ${feed.customTitle || feed.url}`;
        });
        if (feedCount > 3) {
          confirmMessage += `\n• ... e mais ${feedCount - 3} feed${
            feedCount - 3 > 1 ? "s" : ""
          }`;
        }
      }

      if (await confirmDanger(confirmMessage)) {
        // Move feeds from deleted category to uncategorized
        feedsInCategory.forEach((feed) => {
          moveFeedToCategory(feed.url, "uncategorized", feeds, setFeeds);
        });

        deleteCategory(categoryId);

        // Show success message
        const successMessage =
          feedCount > 0
            ? `Categoria "${
                category?.name
              }" excluída com sucesso. ${feedCount} feed${
                feedCount > 1 ? "s foram movidos" : " foi movido"
              } para "Não categorizados".`
            : `Categoria "${category?.name}" excluída com sucesso.`;

        // Use a timeout to show the message after the UI updates
        setTimeout(async () => {
          await alertSuccess(successMessage);
        }, 100);
      }
    },
    [
      categories,
      categorizedFeeds,
      feeds,
      setFeeds,
      moveFeedToCategory,
      deleteCategory,
      confirmDanger,
      alertSuccess,
    ],
  );

  const handleImportCategories = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        try {
          const content = await file.text();
          const success = importCategories(content);
          if (success) {
            await alertSuccess("Categories imported successfully!");
          } else {
            await alertError(
              "Failed to import categories. Please check the file format.",
            );
          }
        } catch (error) {
          await alertError("Failed to read the file.");
          logger.error(
            "Failed to read categories import file",
            error as Error,
            {
              additionalData: {
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
              },
            },
          );
        }
      }
      // Reset the input
      if (e.target) {
        e.target.value = "";
      }
    },
    [importCategories, alertSuccess, alertError, logger],
  );

  // Handler para importar feeds OPML para uma categoria específica
  const handleImportOPML = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const content = await file.text();
        // Note: We don't sanitize OPML with DOMPurify as it removes xmlUrl attributes
        // parseOpml safely extracts only URL strings from the XML structure
        const opmlFeeds = parseOpml(content);

        if (opmlFeeds.length === 0) {
          await alertError("No feeds found in this OPML file.");
          return;
        }

        // Process feeds and add to the target category
        const newFeeds: FeedSource[] = [];
        const existingUrls = new Set(feeds.map((f) => f.url.toLowerCase()));
        const targetCategoryId = importTargetCategory || undefined;

        opmlFeeds.forEach((opmlFeed) => {
          const normalizedUrl = opmlFeed.url.toLowerCase().trim();
          if (!existingUrls.has(normalizedUrl)) {
            existingUrls.add(normalizedUrl);
            newFeeds.push({
              url: opmlFeed.url,
              customTitle: opmlFeed.title,
              categoryId: targetCategoryId,
            });
          }
        });

        if (newFeeds.length > 0) {
          setFeeds((prev) => [...prev, ...newFeeds]);
          const categoryName = targetCategoryId
            ? categories.find((c) => c.id === targetCategoryId)?.name ||
              "selected category"
            : "Uncategorized";
          await alertSuccess(
            `${newFeeds.length} feeds imported successfully to ${categoryName}!`,
          );
        } else {
          await alertSuccess(
            "All feeds from this file are already in your collection.",
          );
        }

        logger.info("OPML feeds imported", {
          additionalData: {
            totalInFile: opmlFeeds.length,
            newFeedsAdded: newFeeds.length,
            targetCategory: targetCategoryId,
          },
        });
      } catch (error) {
        await alertError(
          "Failed to parse OPML file. Please check the file format.",
        );
        logger.error("Failed to import OPML feeds", error as Error, {
          additionalData: {
            fileName: file.name,
            fileSize: file.size,
          },
        });
      }

      // Reset input and state
      if (e.target) {
        e.target.value = "";
      }
      setImportTargetCategory(null);
    },
    [
      feeds,
      setFeeds,
      importTargetCategory,
      categories,
      alertSuccess,
      alertError,
      logger,
    ],
  );

  const handleResetToDefaults = useCallback(async () => {
    if (
      await confirmDanger(
        "Are you sure you want to reset to default categories? This will remove all custom categories and reset feed assignments.",
      )
    ) {
      resetToDefaults();
      refreshAppearance(); // Reset appearance overrides
      // Reset all feed categories
      const resetFeeds = feeds.map((feed) => ({
        ...feed,
        categoryId: undefined,
      }));
      setFeeds(resetFeeds);
    }
  }, [resetToDefaults, feeds, setFeeds, confirmDanger, refreshAppearance]);

  const handleDeleteFeed = useCallback(
    async (feedUrl: string, feedTitle?: string) => {
      if (
        await confirmDanger(
          `Tem certeza que deseja remover o feed "${feedTitle || feedUrl}"?`,
        )
      ) {
        setFeeds(feeds.filter((f) => f.url !== feedUrl));
        await alertSuccess("Feed removido com sucesso.");
      }
    },
    [feeds, setFeeds, confirmDanger, alertSuccess],
  );

  const [editingFeedId, setEditingFeedId] = useState<string | null>(null);
  const [editFeedTitle, setEditFeedTitle] = useState("");

  const startEditingFeed = (feed: FeedSource) => {
    setEditingFeedId(feed.url);
    setEditFeedTitle(feed.customTitle || "");
  };

  const saveFeedEdit = () => {
    if (!editingFeedId) return;
    setFeeds(
      feeds.map((f: FeedSource) => {
        if (f.url === editingFeedId) {
          return { ...f, customTitle: editFeedTitle };
        }
        return f;
      }),
    );
    setEditingFeedId(null);
    alertSuccess("Feed atualizado.");
  };

  const cancelFeedEdit = () => {
    setEditingFeedId(null);
    setEditFeedTitle("");
  };

  const [openLayoutDropdownFor, setOpenLayoutDropdownFor] = useState<
    string | null
  >(null);
  const [dropdownPos, setDropdownPos] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const layoutDropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close any open layout dropdown if click is outside
      if (
        openLayoutDropdownFor &&
        layoutDropdownRefs.current[openLayoutDropdownFor]
      ) {
        if (
          !layoutDropdownRefs.current[openLayoutDropdownFor]?.contains(
            event.target as Node,
          )
        ) {
          setOpenLayoutDropdownFor(null);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openLayoutDropdownFor]);

  return (
    <div
      className="h-full flex flex-col"
      role="dialog"
      aria-labelledby="category-manager-title"
    >
      {/* Title handled by parent Modal - this component is embedded */}

      <div className="mb-8 rounded-[26px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[rgb(var(--theme-text-secondary-readable))]">
              Curadoria de Categorias
            </div>
            <h3 className="text-xl font-semibold text-[rgb(var(--theme-text-readable))]">
              Organize seus feeds por superfícies, não por divisões duras.
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--theme-text-secondary-readable))]">
              Cada categoria funciona como um bloco editorial com identidade própria. Agrupe, reordene e ajuste layouts mantendo a leitura clara.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 lg:max-w-[52%] lg:justify-end">
            <button
              onClick={() => setShowNewCategoryForm(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[rgb(var(--color-accent))] px-4 py-2.5 text-sm font-semibold text-[rgb(var(--theme-text-readable))] shadow-[0_18px_40px_rgba(var(--color-accent),0.22)] transition-all hover:translate-y-[-1px] hover:bg-[rgb(var(--color-accent))]/92"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              {t("action.add")}
            </button>
            <button onClick={handleExportOPML} className={secondaryActionClass}>
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              {t("action.export")} OPML
            </button>
            <button
              onClick={() => {
                setImportTargetCategory(null);
                opmlFileInputRef.current?.click();
              }}
              className={secondaryActionClass}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              {t("action.import")} OPML
            </button>
            <button
              onClick={handleResetToDefaults}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-300 transition-all hover:bg-red-500/16"
            >
              <svg
                className="h-5 w-5"
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
              {t("action.reset")}
            </button>
          </div>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportCategories}
        accept=".json"
        className="hidden"
      />
      <input
        type="file"
        ref={opmlFileInputRef}
        onChange={handleImportOPML}
        accept=".opml,.xml"
        className="hidden"
      />

      {/* New category form */}
      {showNewCategoryForm && (
        <div className="bg-[rgb(var(--theme-surface-readable))]/40 backdrop-blur-md border border-[rgba(var(--color-border),0.1)] rounded-xl p-6 mb-8 animate-in slide-in-from-top-4">
          <div className="flex items-center mb-6">
            <span className="p-2 rounded-lg bg-[rgb(var(--color-accent))]/10 mr-3">
              <svg
                className="w-5 h-5 text-[rgb(var(--color-accent))]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </span>
            <h3 className="text-lg font-semibold text-[rgb(var(--theme-text-readable))]">
              Create New Category
            </h3>
          </div>
          <form onSubmit={handleCreateCategory} className="space-y-6">
            <div>
              <label
                htmlFor="category-name"
                className="block text-sm font-medium text-[rgb(var(--color-textSecondary))] mb-2"
              >
                Category Name
              </label>
              <input
                id="category-name"
                type="text"
                value={newCategoryForm.name}
                onChange={(e) =>
                  setNewCategoryForm((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="Enter category name"
                className="w-full bg-[rgba(var(--color-text),0.05)] text-[rgb(var(--theme-text-readable))] rounded-lg px-4 py-3 border border-[rgba(var(--color-border),0.15)] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent))] focus:border-transparent transition-all"
                required
              />
            </div>
            <div>
              <label
                htmlFor="category-color"
                className="block text-sm font-medium text-[rgb(var(--color-textSecondary))] mb-2"
              >
                Color Tag
              </label>
              <div className="flex items-center space-x-4">
                <input
                  id="category-color"
                  type="color"
                  value={newCategoryForm.color}
                  onChange={(e) =>
                    setNewCategoryForm((prev) => ({
                      ...prev,
                      color: e.target.value,
                    }))
                  }
                  className="w-14 h-14 bg-transparent rounded-lg cursor-pointer border-0 p-0"
                />
                <div className="flex items-center space-x-3 bg-[rgba(var(--color-text),0.05)] px-4 py-2 rounded-lg border border-[rgba(var(--color-border),0.1)]">
                  <div
                    className="w-6 h-6 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.3)]"
                    style={{ backgroundColor: newCategoryForm.color }}
                  />
                  <span className="text-sm text-[rgba(var(--color-textSecondary),0.8)] font-mono">
                    {newCategoryForm.color}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <label
                htmlFor="category-layout"
                className="block text-sm font-medium text-[rgb(var(--color-textSecondary))] mb-2"
              >
                Default Layout
              </label>
              <select
                id="category-layout"
                value={newCategoryForm.layoutMode || ""}
                onChange={(e) =>
                  setNewCategoryForm((prev) => ({
                    ...prev,
                    layoutMode: e.target.value
                      ? (e.target.value as FeedCategory["layoutMode"])
                      : undefined,
                  }))
                }
                className="w-full bg-[rgba(var(--color-text),0.05)] text-[rgb(var(--theme-text-readable))] rounded-lg px-4 py-3 border border-[rgba(var(--color-border),0.15)] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent))] focus:border-transparent transition-all"
              >
                {layoutOptions.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between bg-[rgba(var(--color-text),0.05)] p-4 rounded-lg border border-[rgba(var(--color-border),0.1)]">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-[rgb(var(--color-textSecondary))]">
                  Auto-Descoberta
                </span>
                <span className="text-xs text-gray-500">
                  Agrega artigos de outros feeds com temas relacionados
                </span>
              </div>
              <Switch
                checked={newCategoryForm.autoDiscovery ?? true}
                onChange={(checked) =>
                  setNewCategoryForm((prev) => ({
                    ...prev,
                    autoDiscovery: checked,
                  }))
                }
              />
            </div>
            <div>
              <label
                htmlFor="category-description"
                className="block text-sm font-medium text-[rgb(var(--color-textSecondary))] mb-2"
              >
                Description (optional)
              </label>
              <textarea
                id="category-description"
                value={newCategoryForm.description}
                onChange={(e) =>
                  setNewCategoryForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="w-full bg-[rgba(var(--color-text),0.05)] text-[rgb(var(--theme-text-readable))] rounded-lg px-4 py-3 border border-[rgba(var(--color-border),0.15)] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent))] focus:border-transparent transition-all resize-none"
                rows={3}
                placeholder="Enter a description for this category..."
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="bg-[rgb(var(--color-accent))] hover:bg-[rgb(var(--color-accent))]/90 text-[rgb(var(--theme-text-readable))] font-medium px-6 py-2.5 rounded-lg transition-all shadow-lg shadow-[rgb(var(--color-accent))]/20"
              >
                Create Category
              </button>
              <button
                type="button"
                onClick={() => setShowNewCategoryForm(false)}
                className="bg-[rgba(var(--color-border),0.4)] hover:bg-gray-600 text-[rgb(var(--theme-text-readable))] font-medium px-6 py-2.5 rounded-lg transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit category form */}
      {editingCategory && (
        <div className="bg-[rgb(var(--theme-surface-readable))]/40 backdrop-blur-md border border-[rgb(var(--color-accent))]/30 rounded-xl p-6 mb-8 animate-in slide-in-from-top-4 shadow-[0_0_30px_rgba(var(--color-accent),0.1)]">
          <div className="flex items-center mb-6">
            <span className="p-2 rounded-lg bg-[rgb(var(--color-accent))]/10 mr-3">
              <svg
                className="w-5 h-5 text-[rgb(var(--color-accent))]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </span>
            <h3 className="text-lg font-semibold text-[rgb(var(--theme-text-readable))]">Edit Category</h3>
          </div>
          <form onSubmit={handleSaveEditCategory} className="space-y-6">
            <div>
              <label
                htmlFor="edit-category-name"
                className="block text-sm font-medium text-[rgb(var(--color-textSecondary))] mb-2"
              >
                Category Name
              </label>
              <input
                id="edit-category-name"
                type="text"
                value={editingCategoryForm.name}
                onChange={(e) =>
                  setEditingCategoryForm((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                className="w-full bg-[rgba(var(--color-text),0.05)] text-[rgb(var(--theme-text-readable))] rounded-lg px-4 py-3 border border-[rgba(var(--color-border),0.15)] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent))] focus:border-transparent transition-all"
                required
                autoFocus
              />
            </div>
            <div>
              <label
                htmlFor="edit-category-color"
                className="block text-sm font-medium text-[rgb(var(--color-textSecondary))] mb-2"
              >
                Color Tag
              </label>
              <div className="flex items-center space-x-4">
                <input
                  id="edit-category-color"
                  type="color"
                  value={editingCategoryForm.color}
                  onChange={(e) =>
                    setEditingCategoryForm((prev) => ({
                      ...prev,
                      color: e.target.value,
                    }))
                  }
                  className="w-14 h-14 bg-transparent rounded-lg cursor-pointer border-0 p-0"
                />
                <div className="flex items-center space-x-3 bg-[rgba(var(--color-text),0.05)] px-4 py-2 rounded-lg border border-[rgba(var(--color-border),0.1)]">
                  <div
                    className="w-6 h-6 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.3)]"
                    style={{ backgroundColor: editingCategoryForm.color }}
                  />
                  <span className="text-sm text-[rgba(var(--color-textSecondary),0.8)] font-mono">
                    {editingCategoryForm.color}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <label
                htmlFor="edit-category-layout"
                className="block text-sm font-medium text-[rgb(var(--color-textSecondary))] mb-2"
              >
                Default Layout
              </label>
              <select
                id="edit-category-layout"
                value={editingCategoryForm.layoutMode || ""}
                onChange={(e) =>
                  setEditingCategoryForm((prev) => ({
                    ...prev,
                    layoutMode: e.target.value
                      ? (e.target.value as FeedCategory["layoutMode"])
                      : undefined,
                  }))
                }
                className="w-full bg-[rgba(var(--color-text),0.05)] text-[rgb(var(--theme-text-readable))] rounded-lg px-4 py-3 border border-[rgba(var(--color-border),0.15)] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent))] focus:border-transparent transition-all"
              >
                {layoutOptions.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between bg-[rgba(var(--color-text),0.05)] p-4 rounded-lg border border-[rgba(var(--color-border),0.1)]">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-[rgb(var(--color-textSecondary))]">
                  Auto-Descoberta
                </span>
                <span className="text-xs text-gray-500">
                  Agrega artigos de outros feeds com temas relacionados
                </span>
              </div>
              <Switch
                checked={editingCategoryForm.autoDiscovery ?? true}
                onChange={(checked) =>
                  setEditingCategoryForm((prev) => ({
                    ...prev,
                    autoDiscovery: checked,
                  }))
                }
              />
            </div>
            <div>
              <label
                htmlFor="edit-category-description"
                className="block text-sm font-medium text-[rgb(var(--color-textSecondary))] mb-2"
              >
                Description (optional)
              </label>
              <textarea
                id="edit-category-description"
                value={editingCategoryForm.description}
                onChange={(e) =>
                  setEditingCategoryForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="w-full bg-[rgba(var(--color-text),0.05)] text-[rgb(var(--theme-text-readable))] rounded-lg px-4 py-3 border border-[rgba(var(--color-border),0.15)] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent))] focus:border-transparent transition-all resize-none"
                rows={3}
                placeholder="Enter a description for this category..."
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="bg-[rgb(var(--color-accent))] hover:bg-[rgb(var(--color-accent))]/90 text-[rgb(var(--theme-text-readable))] font-medium px-6 py-2.5 rounded-lg transition-all shadow-lg shadow-[rgb(var(--color-accent))]/20"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={handleCancelEditCategory}
                className="bg-[rgba(var(--color-border),0.4)] hover:bg-gray-600 text-[rgb(var(--theme-text-readable))] font-medium px-6 py-2.5 rounded-lg transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 overflow-y-auto custom-scrollbar pb-6 pr-2 lg:grid-cols-2 xl:grid-cols-3 flex-grow">
        {visibleCategories.map((category) => {
          return (
            <div
              key={category.id}
              className={`flex h-full flex-col rounded-[26px] border p-5 transition-all duration-300 ${
                dragState.dragOverCategory === category.id
                  ? "border-[rgb(var(--color-accent))]/45 bg-[linear-gradient(180deg,rgba(var(--color-accent),0.12),rgba(255,255,255,0.04))] shadow-[0_24px_54px_rgba(var(--color-accent),0.16)]"
                  : "border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] shadow-[0_18px_50px_rgba(0,0,0,0.2)] hover:border-white/12 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.024))]"
              }`}
              onDragOver={(e) => handleDragOver(e, category.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, category.id)}
            >
              {/* Category header */}
              <div
                className="flex items-center justify-between mb-4 cursor-move group"
                draggable={true}
                onDragStart={(e) =>
                  handleDragStart(e, "category", category.id, category)
                }
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                    style={{ backgroundColor: category.color }}
                  />
                  <h3 className="font-bold text-[rgb(var(--theme-text-readable))] text-lg tracking-tight group-hover:text-[rgb(var(--color-accent))] transition-colors">
                    {category.name}
                  </h3>
                  {category.isDefault && (
                    <span className="text-[10px] uppercase tracking-wider font-bold bg-[rgba(var(--color-text),0.05)] text-[rgb(var(--theme-text-secondary-readable))] px-2 py-0.5 rounded-md">
                      Padrão
                    </span>
                  )}
                </div>

                <div className="flex space-x-1 transition-opacity">
                  {/* Layout Quick Switcher */}
                  <div
                    className="relative"
                    key={category.id + "-layout-switcher"}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (openLayoutDropdownFor === category.id) {
                          setOpenLayoutDropdownFor(null);
                        } else {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setDropdownPos({
                            top: rect.bottom + 5,
                            left: rect.left,
                          });
                          setOpenLayoutDropdownFor(category.id);
                        }
                      }}
                      className={`p-1.5 rounded-lg transition-colors ${
                        category.layoutMode
                          ? "text-[rgb(var(--color-accent))] bg-[rgb(var(--color-accent))]/10 hover:bg-[rgb(var(--color-accent))]/20"
                          : "text-[rgba(var(--color-textSecondary),0.8)] hover:text-[rgb(var(--theme-text-readable))] hover:bg-[rgba(var(--color-text),0.08)]"
                      }`}
                      title={`Layout: ${layoutOptions.find((o) => o.value === (category.layoutMode || ""))?.label || "Default"}`}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                        />
                      </svg>
                    </button>

                    {openLayoutDropdownFor === category.id &&
                      dropdownPos &&
                      createPortal(
                        <div
                          ref={(el) => {
                            layoutDropdownRefs.current[category.id] = el;
                          }}
                          className="fixed w-48 bg-[#0a0a0c] border border-[rgba(var(--color-border),0.15)] rounded-lg shadow-2xl py-1 z-[9999] animate-in fade-in zoom-in-95 duration-100 max-h-[300px] overflow-y-auto custom-scrollbar"
                          style={{
                            top: dropdownPos.top,
                            left: dropdownPos.left,
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {layoutOptions.map((option) => (
                            <button
                              key={option.label}
                              onClick={() => {
                                updateCategory(category.id, {
                                  layoutMode:
                                    option.value as FeedCategory["layoutMode"],
                                });
                                setOpenLayoutDropdownFor(null);
                              }}
                              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                                (category.layoutMode || "") === option.value
                                  ? "text-[rgb(var(--color-accent))] bg-[rgba(var(--color-text),0.05)] font-medium"
                                  : "text-[rgb(var(--color-textSecondary))] hover:bg-[rgba(var(--color-text),0.08)] hover:text-[rgb(var(--theme-text-readable))]"
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>,
                        document.body,
                      )}
                  </div>

                  <button
                    onClick={() =>
                      updateCategory(category.id, {
                        isPinned: !category.isPinned,
                      })
                    }
                    className={`p-1.5 rounded-lg transition-colors ${
                      category.isPinned
                        ? "text-[rgb(var(--color-accent))] bg-[rgb(var(--color-accent))]/10 hover:bg-[rgb(var(--color-accent))]/20"
                        : "text-[rgba(var(--color-textSecondary),0.8)] hover:text-[rgb(var(--theme-text-readable))] hover:bg-[rgba(var(--color-text),0.08)]"
                    }`}
                    title={
                      category.isPinned
                        ? `Unpin ${category.name}`
                        : `Pin ${category.name}`
                    }
                  >
                    <svg
                      className="w-4 h-4"
                      fill={category.isPinned ? "currentColor" : "none"}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      setImportTargetCategory(category.id);
                      opmlFileInputRef.current?.click();
                    }}
                    className="p-1.5 text-[rgba(var(--color-textSecondary),0.8)] hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                    title={`Import OPML to ${category.name}`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleStartEditCategory(category)}
                    className="p-1.5 text-[rgba(var(--color-textSecondary),0.8)] hover:text-[rgb(var(--theme-text-readable))] hover:bg-[rgba(var(--color-text),0.08)] rounded-lg transition-colors"
                    title={`Edit ${category.name}`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="p-1.5 text-[rgba(var(--color-textSecondary),0.8)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title={`Delete ${category.name}`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {category.description && (
                <p className="mb-4 text-sm leading-relaxed text-[rgba(var(--color-textSecondary),0.84)] line-clamp-2">
                  {sanitizeHtmlContent(category.description)}
                </p>
              )}

              {/* Feeds in category */}
              <div className="min-h-[100px] flex-grow space-y-2 rounded-[22px] bg-black/10 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-xs font-medium uppercase tracking-wider text-[rgb(var(--theme-text-secondary-readable))] opacity-72">
                    {categorizedFeeds[category.id]?.length || 0} feeds
                  </span>
                  {(categorizedFeeds[category.id]?.length || 0) > 0 && (
                    <span className="flex items-center text-[10px] text-[rgb(var(--theme-text-secondary-readable))] opacity-78">
                      <svg
                        className="w-3 h-3 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                        />
                      </svg>
                      Arraste para reordenar
                    </span>
                  )}
                </div>

                {(expandedCategories[category.id]
                  ? categorizedFeeds[category.id] || []
                  : (categorizedFeeds[category.id] || []).slice(0, 2)
                ).map((feed, index) => (
                  <div
                    key={`${feed.url}-${category.id}-${index}`}
                    className={`group cursor-move rounded-[18px] p-3 transition-all duration-200 ${
                      editingFeedId === feed.url
                        ? "ring-2 ring-[rgb(var(--color-accent))]"
                        : "bg-white/5 hover:bg-white/8"
                    }`}
                    draggable={editingFeedId !== feed.url}
                    onDragStart={(e) =>
                      !editingFeedId &&
                      handleDragStart(e, "feed", feed.url, feed)
                    }
                  >
                    {editingFeedId === feed.url ? (
                      <div
                        className="flex flex-col gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          value={editFeedTitle}
                          onChange={(e) => setEditFeedTitle(e.target.value)}
                          className="w-full bg-[rgba(var(--color-text),0.05)] text-[rgb(var(--theme-text-readable))] rounded px-2 py-1 text-sm border border-[rgba(var(--color-border),0.15)] focus:outline-none focus:border-[rgb(var(--color-accent))]"
                          placeholder="Nome do feed"
                          autoFocus
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={saveFeedEdit}
                            className="text-xs bg-[rgb(var(--color-accent))] text-[rgb(var(--theme-text-readable))] px-2 py-1 rounded hover:opacity-90"
                          >
                            Salvar
                          </button>
                          <button
                            onClick={cancelFeedEdit}
                            className="text-xs bg-[rgba(var(--color-border),0.4)] text-[rgb(var(--color-textSecondary))] px-2 py-1 rounded hover:bg-gray-600"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <div
                          className="h-10 w-1.5 rounded-full transition-colors"
                          style={{ backgroundColor: category.color }}
                        />
                        <div className="flex-grow min-w-0">
                          <div
                            className="text-sm text-[rgb(var(--theme-text-readable))] font-medium truncate mb-0.5 group-hover:text-[rgb(var(--color-accent))] transition-colors"
                            title={feed.customTitle || feed.url}
                          >
                            {feed.customTitle || feed.url}
                          </div>
                          <div className="text-xs text-[rgb(var(--theme-text-secondary-readable))] opacity-70 truncate font-mono opacity-60">
                            {feed.url}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-1 transition-opacity">
                          <button
                            onClick={() => startEditingFeed(feed)}
                            className="p-1 text-[rgba(var(--color-textSecondary),0.8)] hover:text-[rgb(var(--theme-text-readable))] hover:bg-[rgba(var(--color-text),0.08)] rounded"
                            title="Editar nome"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteFeed(feed.url, feed.customTitle)
                            }
                            className="p-1 text-[rgba(var(--color-textSecondary),0.8)] hover:text-red-400 hover:bg-red-500/10 rounded"
                            title="Excluir feed"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                          <div className="cursor-move p-1 text-[rgb(var(--theme-text-secondary-readable))] opacity-80 hover:text-[rgba(var(--color-textSecondary),0.8)]">
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 6h16M4 12h16M4 18h16"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Show More / Show Less Button */}
                {(categorizedFeeds[category.id]?.length || 0) > 2 && (
                  <button
                    onClick={() =>
                      setExpandedCategories((prev) => ({
                        ...prev,
                        [category.id]: !prev[category.id],
                      }))
                    }
                    className="w-full py-2 text-xs text-center text-[rgb(var(--theme-text-secondary-readable))] opacity-70 hover:text-[rgb(var(--theme-text-readable))] hover:bg-[rgba(var(--color-text),0.05)] rounded-lg transition-colors mt-2 flex items-center justify-center gap-1"
                  >
                    {expandedCategories[category.id] ? (
                      <>
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 15l7-7 7 7"
                          />
                        </svg>
                        Mostrar Menos
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-3 h-3"
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
                        Mostrar mais{" "}
                        {(categorizedFeeds[category.id]?.length || 0) - 2}
                      </>
                    )}
                  </button>
                )}

                {(categorizedFeeds[category.id] || []).length === 0 && (
                  <div className="flex h-full flex-col items-center justify-center rounded-[18px] bg-white/4 py-8 text-xs text-[rgb(var(--theme-text-secondary-readable))]/72">
                    <span className="mb-1">Categoria Vazia</span>
                    <span>Arraste feeds aqui</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Show more categories button */}
        {hiddenCategoriesCount > 0 && !showAllCategories && (
          <button
            onClick={() => setShowAllCategories(true)}
            className="flex items-center justify-center gap-2 rounded-[22px] border border-white/8 bg-white/4 p-4 text-[rgba(var(--color-textSecondary),0.84)] transition-all hover:bg-white/7 hover:text-[rgb(var(--theme-text-readable))]"
          >
            <svg
              className="w-4 h-4"
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
            Ver mais {hiddenCategoriesCount} categorias
          </button>
        )}

        {/* Show less categories button */}
        {showAllCategories && categories.length > 2 && (
          <button
            onClick={() => setShowAllCategories(false)}
            className="flex items-center justify-center gap-2 rounded-[22px] border border-white/8 bg-white/4 p-4 text-[rgba(var(--color-textSecondary),0.84)] transition-all hover:bg-white/7 hover:text-[rgb(var(--theme-text-readable))]"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 15l7-7 7 7"
              />
            </svg>
            Mostrar menos
          </button>
        )}

        {/* Uncategorized feeds */}
        {(categorizedFeeds.uncategorized || []).length > 0 && (
          <div
            className={`flex h-full flex-col rounded-[26px] p-5 transition-all duration-300 ${
              dragState.dragOverCategory === "uncategorized"
                ? "border border-[rgb(var(--color-accent))]/45 bg-[linear-gradient(180deg,rgba(var(--color-accent),0.12),rgba(255,255,255,0.04))] shadow-[0_24px_54px_rgba(var(--color-accent),0.16)]"
                : "border border-yellow-500/18 bg-[linear-gradient(180deg,rgba(234,179,8,0.08),rgba(255,255,255,0.02))] shadow-[0_18px_50px_rgba(0,0,0,0.2)]"
            }`}
            onDragOver={(e) => handleDragOver(e, "uncategorized")}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, "uncategorized")}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-4 h-4 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)]" />
              <h3 className="font-bold text-[rgb(var(--theme-text-readable))] text-lg tracking-tight">
                Sem Categoria
              </h3>
              <span className="text-[10px] uppercase tracking-wider font-semibold bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-500/20">
                Organizar
              </span>
            </div>

            <div className="min-h-[100px] flex-grow space-y-2 rounded-[22px] bg-black/10 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {categorizedFeeds.uncategorized?.length || 0} feeds
                </span>
              </div>

              {(categorizedFeeds.uncategorized || []).map((feed, index) => (
                <div
                  key={`${feed.url}-uncategorized-${index}`}
                  className={`group cursor-move rounded-[18px] p-3 transition-all duration-200 ${
                    editingFeedId === feed.url
                      ? "ring-2 ring-[rgb(var(--color-accent))]"
                      : "bg-white/5 hover:bg-white/8"
                  }`}
                  draggable={editingFeedId !== feed.url}
                  onDragStart={(e) =>
                    !editingFeedId && handleDragStart(e, "feed", feed.url, feed)
                  }
                >
                  {editingFeedId === feed.url ? (
                    <div
                      className="flex flex-col gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={editFeedTitle}
                        onChange={(e) => setEditFeedTitle(e.target.value)}
                        className="w-full bg-[rgba(var(--color-text),0.05)] text-[rgb(var(--theme-text-readable))] rounded px-2 py-1 text-sm border border-[rgba(var(--color-border),0.15)] focus:outline-none focus:border-[rgb(var(--color-accent))]"
                        placeholder="Nome do feed"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={saveFeedEdit}
                          className="text-xs bg-[rgb(var(--color-accent))] text-[rgb(var(--theme-text-readable))] px-2 py-1 rounded hover:opacity-90"
                        >
                          Salvar
                        </button>
                        <button
                          onClick={cancelFeedEdit}
                          className="text-xs bg-[rgba(var(--color-border),0.4)] text-[rgb(var(--color-textSecondary))] px-2 py-1 rounded hover:bg-gray-600"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <div className="w-1 h-8 rounded-full bg-yellow-500/50 group-hover:bg-yellow-500 transition-colors"></div>
                      <div className="flex-grow min-w-0">
                        <div
                          className="text-sm text-[rgb(var(--theme-text-readable))] font-medium truncate mb-0.5 group-hover:text-yellow-400 transition-colors"
                          title={feed.customTitle || feed.url}
                        >
                          {feed.customTitle || feed.url}
                        </div>
                        <div className="text-xs text-gray-500 truncate font-mono opacity-60">
                          {feed.url}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-1 transition-opacity">
                        <button
                          onClick={() => startEditingFeed(feed)}
                          className="p-1 text-[rgba(var(--color-textSecondary),0.8)] hover:text-[rgb(var(--theme-text-readable))] hover:bg-[rgba(var(--color-text),0.08)] rounded"
                          title="Editar nome"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteFeed(feed.url, feed.customTitle)
                          }
                          className="p-1 text-[rgba(var(--color-textSecondary),0.8)] hover:text-red-400 hover:bg-red-500/10 rounded"
                          title="Excluir feed"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                        <div className="cursor-move p-1 text-gray-600 hover:text-[rgba(var(--color-textSecondary),0.8)]">
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 6h16M4 12h16M4 18h16"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Show More / Show Less Button */}
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-8 flex items-start space-x-4 rounded-[26px] border border-white/8 bg-[linear-gradient(180deg,rgba(var(--color-primary),0.08),rgba(255,255,255,0.02))] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
        <div className="p-2.5 bg-[rgba(var(--color-primary),0.1)] rounded-xl text-[rgb(var(--color-primary))] mt-0.5">
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
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="flex-grow">
          <h4 className="font-bold text-[rgb(var(--theme-text-readable))] text-base mb-2">Dicas de Uso</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm text-[rgb(var(--theme-text-secondary-readable))]">
            <div className="flex items-center space-x-3 group">
              <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--color-primary))] opacity-60 group-hover:scale-125 transition-transform"></span>
              <span className="group-hover:text-[rgb(var(--theme-text-readable))] transition-colors">Arraste feeds entre categorias para organizá-los</span>
            </div>
            <div className="flex items-center space-x-3 group">
              <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--color-primary))] opacity-60 group-hover:scale-125 transition-transform"></span>
              <span className="group-hover:text-[rgb(var(--theme-text-readable))] transition-colors">
                Arraste categorias para reordená-las (apenas customizadas)
              </span>
            </div>
            <div className="flex items-center space-x-3 group">
              <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--color-primary))] opacity-60 group-hover:scale-125 transition-transform"></span>
              <span className="group-hover:text-[rgb(var(--theme-text-readable))] transition-colors">Use cores para distinguir categorias visualmente</span>
            </div>
            <div className="flex items-center space-x-3 group">
              <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--color-primary))] opacity-60 group-hover:scale-125 transition-transform"></span>
              <span className="group-hover:text-[rgb(var(--theme-text-readable))] transition-colors">Exporte seu setup para compartilhar com outros</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
