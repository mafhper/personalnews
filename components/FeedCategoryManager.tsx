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
import { useLanguage } from "../contexts/LanguageContext";
import { OPMLExportService } from "../services/opmlExportService";

interface FeedCategoryManagerProps {
  feeds: FeedSource[];
  setFeeds: React.Dispatch<React.SetStateAction<FeedSource[]>>;
  onClose: () => void;
}

interface DragState {
  draggedItem: { type: "feed" | "category"; id: string; data: any } | null;
  dragOverCategory: string | null;
}

export const FeedCategoryManager: React.FC<FeedCategoryManagerProps> = ({
  feeds,
  setFeeds,
}) => {
  const logger = useLogger("FeedCategoryManager");
  const { t } = useLanguage();
  const {
    categories,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    getCategorizedFeeds,
    moveFeedToCategory,
    exportCategories,
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
    layoutMode?: FeedCategory['layoutMode'];
  }>({
    name: "",
    color: "#3B82F6",
    description: "",
    layoutMode: undefined,
  });
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [newCategoryForm, setNewCategoryForm] = useState<{
    name: string;
    color: string;
    description: string;
    layoutMode?: FeedCategory['layoutMode'];
  }>({
    name: "",
    color: "#3B82F6",
    description: "",
    layoutMode: undefined,
  });
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categorizedFeeds = getCategorizedFeeds(feeds);

  // Layout options for dropdown
  const layoutOptions: { value: FeedCategory['layoutMode'] | '', label: string }[] = [
    { value: '', label: 'Default (Use Global Setting)' },
    { value: 'bento', label: 'Bento Grid' },
    { value: 'brutalist', label: 'Brutalist' },
    { value: 'compact', label: 'Compact (Data)' },
    { value: 'cyberpunk', label: 'Cyberpunk' },
    { value: 'focus', label: 'Focus (Single)' },
    { value: 'gallery', label: 'Gallery (Image)' },
    { value: 'immersive', label: 'Immersive / Netflix' },
    { value: 'list', label: 'List / Portal' },
    { value: 'grid', label: 'Magazine Grid' },
    { value: 'masonry', label: 'Masonry Cards' },
    { value: 'minimal', label: 'Minimal Text' },
    { value: 'modern', label: 'Modern Portal' },
    { value: 'newspaper', label: 'Newspaper (Classic)' },
    { value: 'polaroid', label: 'Polaroid' },
    { value: 'split', label: 'Split (ZigZag)' },
    { value: 'terminal', label: 'Terminal' },
    { value: 'timeline', label: 'Timeline' },
  ];

  const handleDragStart = useCallback(
    (e: React.DragEvent, type: "feed" | "category", id: string, data: any) => {
      setDragState((prev) => ({
        ...prev,
        draggedItem: { type, id, data },
      }));
      e.dataTransfer.effectAllowed = "move";
    },
    []
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
    []
  );

  const handleExportOPML = async () => {
    // Generate OPML with category structure
    const opml = await OPMLExportService.generateOPML(feeds, categories);
    const blob = new Blob([opml], { type: "text/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `personal_news_with_categories_${new Date().toISOString().split('T')[0]}.opml`;
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
        moveFeedToCategory(data.url, targetCategoryId, feeds, setFeeds);
      } else if (type === "category") {
        // Handle category reordering
        const targetCategory = categories.find(
          (c) => c.id === targetCategoryId
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
    ]
  );

  const handleCreateCategory = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (newCategoryForm.name.trim()) {
        createCategory(
          newCategoryForm.name.trim(),
          newCategoryForm.color,
          newCategoryForm.description.trim() || undefined,
          newCategoryForm.layoutMode
        );
        setNewCategoryForm({ name: "", color: "#3B82F6", description: "", layoutMode: undefined });
        setShowNewCategoryForm(false);
      }
    },
    [newCategoryForm, createCategory]
  );

  const handleStartEditCategory = useCallback((category: FeedCategory) => {
    setEditingCategory(category.id);
    setEditingCategoryForm({
      name: category.name,
      color: category.color,
      description: category.description || "",
      layoutMode: category.layoutMode,
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
        });
        setEditingCategory(null);
        setEditingCategoryForm({ name: "", color: "#3B82F6", description: "", layoutMode: undefined });
      }
    },
    [editingCategory, editingCategoryForm, updateCategory]
  );

  const handleCancelEditCategory = useCallback(() => {
    setEditingCategory(null);
    setEditingCategoryForm({ name: "", color: "#3B82F6", description: "", layoutMode: undefined });
  }, []);

  const handleDeleteCategory = useCallback(
    async (categoryId: string) => {
      const category = categories.find((c) => c.id === categoryId);
      const feedsInCategory = categorizedFeeds[categoryId] || [];
      const feedCount = feedsInCategory.length;

      let confirmMessage = `Tem certeza que deseja excluir a categoria "${category?.name}"?`;

      if (feedCount > 0) {
        confirmMessage += `\n\nEsta ação irá mover ${feedCount} feed${feedCount > 1 ? "s" : ""
          } para "Não categorizados":`;
        feedsInCategory.slice(0, 3).forEach((feed) => {
          confirmMessage += `\n• ${feed.customTitle || feed.url}`;
        });
        if (feedCount > 3) {
          confirmMessage += `\n• ... e mais ${feedCount - 3} feed${feedCount - 3 > 1 ? "s" : ""
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
            ? `Categoria "${category?.name
            }" excluída com sucesso. ${feedCount} feed${feedCount > 1 ? "s foram movidos" : " foi movido"
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
    ]
  );

  const handleExportCategories = useCallback(() => {
    const data = exportCategories();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `feed-categories-${new Date().toISOString().split("T")[0]
      }.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [exportCategories]);

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
              "Failed to import categories. Please check the file format."
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
            }
          );
        }
      }
    },
    [importCategories]
  );

  const handleResetToDefaults = useCallback(async () => {
    if (
      await confirmDanger(
        "Are you sure you want to reset to default categories? This will remove all custom categories and reset feed assignments."
      )
    ) {
      resetToDefaults();
      // Reset all feed categories
      const resetFeeds = feeds.map((feed) => ({
        ...feed,
        categoryId: undefined,
      }));
      setFeeds(resetFeeds);
    }
  }, [resetToDefaults, feeds, setFeeds]);

  const handleDeleteFeed = useCallback(async (feedUrl: string, feedTitle?: string) => {
    if (await confirmDanger(`Tem certeza que deseja remover o feed "${feedTitle || feedUrl}"?`)) {
      setFeeds(feeds.filter(f => f.url !== feedUrl));
      await alertSuccess("Feed removido com sucesso.");
    }
  }, [feeds, setFeeds, confirmDanger, alertSuccess]);

  const [editingFeedId, setEditingFeedId] = useState<string | null>(null);
  const [editFeedTitle, setEditFeedTitle] = useState("");

  const startEditingFeed = (feed: FeedSource) => {
    setEditingFeedId(feed.url);
    setEditFeedTitle(feed.customTitle || "");
  };

  const saveFeedEdit = () => {
    if (!editingFeedId) return;
    setFeeds(feeds.map((f: FeedSource) => {
      if (f.url === editingFeedId) {
        return { ...f, customTitle: editFeedTitle };
      }
      return f;
    }));
    setEditingFeedId(null);
    alertSuccess("Feed atualizado.");
  };

  const cancelFeedEdit = () => {
    setEditingFeedId(null);
    setEditFeedTitle("");
  };

  const [openLayoutDropdownFor, setOpenLayoutDropdownFor] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const layoutDropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close any open layout dropdown if click is outside
      if (openLayoutDropdownFor && layoutDropdownRefs.current[openLayoutDropdownFor]) {
        if (!layoutDropdownRefs.current[openLayoutDropdownFor]?.contains(event.target as Node)) {
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
      <div className="flex justify-between items-center mb-6">
        <h2
          id="category-manager-title"
          className="text-3xl font-bold text-white tracking-tight"
        >
          Manage Categories
        </h2>
        {/* Close button handled by parent Modal */}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 mb-8">
        <button
          onClick={() => setShowNewCategoryForm(true)}
          className="bg-[rgb(var(--color-accent))] hover:bg-[rgb(var(--color-accent))]/90 text-white font-medium px-4 py-2 rounded-lg transition-all shadow-lg shadow-[rgb(var(--color-accent))]/20 hover:shadow-[rgb(var(--color-accent))]/40 flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          {t('action.add')}
        </button>
        <button
          onClick={handleExportOPML}
          className="bg-gray-800 hover:bg-gray-700 text-white font-medium px-4 py-2 rounded-lg transition-all border border-white/10 hover:border-white/20 flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Export OPML
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-gray-800 hover:bg-gray-700 text-white font-medium px-4 py-2 rounded-lg transition-all border border-white/10 hover:border-white/20 flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {t('action.import')}
        </button>
        <button
          onClick={handleResetToDefaults}
          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 font-medium px-4 py-2 rounded-lg transition-all border border-red-500/20 flex items-center ml-auto"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {t('action.reset')}
        </button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportCategories}
        accept=".json"
        className="hidden"
      />

      {/* New category form */}
      {showNewCategoryForm && (
        <div className="bg-gray-800/40 backdrop-blur-md border border-white/5 rounded-xl p-6 mb-8 animate-in slide-in-from-top-4">
          <div className="flex items-center mb-6">
            <span className="p-2 rounded-lg bg-[rgb(var(--color-accent))]/10 mr-3">
              <svg className="w-5 h-5 text-[rgb(var(--color-accent))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </span>
            <h3 className="text-lg font-semibold text-white">
              Create New Category
            </h3>
          </div>
          <form onSubmit={handleCreateCategory} className="space-y-6">
            <div>
              <label
                htmlFor="category-name"
                className="block text-sm font-medium text-gray-300 mb-2"
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
                className="w-full bg-black/30 text-white rounded-lg px-4 py-3 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent))] focus:border-transparent transition-all"
                required
              />
            </div>
            <div>
              <label
                htmlFor="category-color"
                className="block text-sm font-medium text-gray-300 mb-2"
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
                <div className="flex items-center space-x-3 bg-black/20 px-4 py-2 rounded-lg border border-white/5">
                  <div
                    className="w-6 h-6 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.3)]"
                    style={{ backgroundColor: newCategoryForm.color }}
                  />
                  <span className="text-sm text-gray-400 font-mono">{newCategoryForm.color}</span>
                </div>
              </div>
            </div>
            <div>
              <label
                htmlFor="category-layout"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Default Layout
              </label>
              <select
                id="category-layout"
                value={newCategoryForm.layoutMode || ''}
                onChange={(e) =>
                  setNewCategoryForm((prev) => ({
                    ...prev,
                    layoutMode: e.target.value ? (e.target.value as FeedCategory['layoutMode']) : undefined,
                  }))
                }
                className="w-full bg-black/30 text-white rounded-lg px-4 py-3 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent))] focus:border-transparent transition-all"
              >
                {layoutOptions.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="category-description"
                className="block text-sm font-medium text-gray-300 mb-2"
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
                className="w-full bg-black/30 text-white rounded-lg px-4 py-3 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent))] focus:border-transparent transition-all resize-none"
                rows={3}
                placeholder="Enter a description for this category..."
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="bg-[rgb(var(--color-accent))] hover:bg-[rgb(var(--color-accent))]/90 text-white font-medium px-6 py-2.5 rounded-lg transition-all shadow-lg shadow-[rgb(var(--color-accent))]/20"
              >
                Create Category
              </button>
              <button
                type="button"
                onClick={() => setShowNewCategoryForm(false)}
                className="bg-gray-700 hover:bg-gray-600 text-white font-medium px-6 py-2.5 rounded-lg transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit category form */}
      {editingCategory && (
        <div className="bg-gray-800/40 backdrop-blur-md border border-[rgb(var(--color-accent))]/30 rounded-xl p-6 mb-8 animate-in slide-in-from-top-4 shadow-[0_0_30px_rgba(var(--color-accent),0.1)]">
          <div className="flex items-center mb-6">
            <span className="p-2 rounded-lg bg-[rgb(var(--color-accent))]/10 mr-3">
              <svg className="w-5 h-5 text-[rgb(var(--color-accent))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </span>
            <h3 className="text-lg font-semibold text-white">Edit Category</h3>
          </div>
          <form onSubmit={handleSaveEditCategory} className="space-y-6">
            <div>
              <label
                htmlFor="edit-category-name"
                className="block text-sm font-medium text-gray-300 mb-2"
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
                className="w-full bg-black/30 text-white rounded-lg px-4 py-3 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent))] focus:border-transparent transition-all"
                required
                autoFocus
              />
            </div>
            <div>
              <label
                htmlFor="edit-category-color"
                className="block text-sm font-medium text-gray-300 mb-2"
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
                <div className="flex items-center space-x-3 bg-black/20 px-4 py-2 rounded-lg border border-white/5">
                  <div
                    className="w-6 h-6 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.3)]"
                    style={{ backgroundColor: editingCategoryForm.color }}
                  />
                  <span className="text-sm text-gray-400 font-mono">{editingCategoryForm.color}</span>
                </div>
              </div>
            </div>
            <div>
              <label
                htmlFor="edit-category-layout"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Default Layout
              </label>
              <select
                id="edit-category-layout"
                value={editingCategoryForm.layoutMode || ''}
                onChange={(e) =>
                  setEditingCategoryForm((prev) => ({
                    ...prev,
                    layoutMode: e.target.value ? (e.target.value as FeedCategory['layoutMode']) : undefined,
                  }))
                }
                className="w-full bg-black/30 text-white rounded-lg px-4 py-3 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent))] focus:border-transparent transition-all"
              >
                {layoutOptions.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="edit-category-description"
                className="block text-sm font-medium text-gray-300 mb-2"
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
                className="w-full bg-black/30 text-white rounded-lg px-4 py-3 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent))] focus:border-transparent transition-all resize-none"
                rows={3}
                placeholder="Enter a description for this category..."
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="bg-[rgb(var(--color-accent))] hover:bg-[rgb(var(--color-accent))]/90 text-white font-medium px-6 py-2.5 rounded-lg transition-all shadow-lg shadow-[rgb(var(--color-accent))]/20"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={handleCancelEditCategory}
                className="bg-gray-700 hover:bg-gray-600 text-white font-medium px-6 py-2.5 rounded-lg transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories and feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pr-2 pb-6 flex-grow">
        {categories.map((category) => (
          <div
            key={category.id}
            className={`bg-gray-800/40 backdrop-blur-sm border rounded-xl p-4 transition-all duration-300 flex flex-col h-full ${dragState.dragOverCategory === category.id
                ? "border-[rgb(var(--color-accent))] bg-[rgb(var(--color-accent))]/10 shadow-[0_0_30px_rgba(var(--color-accent),0.1)] scale-[1.02]"
                : "border-white/5 hover:border-white/10 hover:bg-gray-800/60"
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
                  className="w-4 h-4 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.3)] ring-2 ring-white/10"
                  style={{ backgroundColor: category.color }}
                />
                <h3 className="font-bold text-white text-lg tracking-tight group-hover:text-[rgb(var(--color-accent))] transition-colors">
                  {category.name}
                </h3>
                {category.isDefault && (
                  <span className="text-[10px] uppercase tracking-wider font-semibold bg-white/10 text-gray-400 px-2 py-0.5 rounded-full">
                    Default
                  </span>
                )}
              </div>

              <div className="flex space-x-1 transition-opacity">
                {/* Layout Quick Switcher */}
                <div className="relative" key={category.id + '-layout-switcher'}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (openLayoutDropdownFor === category.id) {
                        setOpenLayoutDropdownFor(null);
                      } else {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setDropdownPos({ top: rect.bottom + 5, left: rect.left });
                        setOpenLayoutDropdownFor(category.id);
                      }
                    }}
                    className={`p-1.5 rounded-lg transition-colors ${
                      category.layoutMode
                        ? "text-[rgb(var(--color-accent))] bg-[rgb(var(--color-accent))]/10 hover:bg-[rgb(var(--color-accent))]/20"
                        : "text-gray-400 hover:text-white hover:bg-white/10"
                    }`}
                    title={`Layout: ${layoutOptions.find(o => o.value === (category.layoutMode || ''))?.label || 'Default'}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                    </svg>
                  </button>

                  {openLayoutDropdownFor === category.id && dropdownPos && createPortal(
                    <div
                      ref={(el) => { layoutDropdownRefs.current[category.id] = el; }}
                      className="fixed w-48 bg-[#0a0a0c] border border-white/10 rounded-lg shadow-2xl py-1 z-[9999] animate-in fade-in zoom-in-95 duration-100 max-h-[300px] overflow-y-auto custom-scrollbar"
                      style={{ top: dropdownPos.top, left: dropdownPos.left }}
                      onClick={(e) => e.stopPropagation()} 
                    >
                      {layoutOptions.map((option) => (
                        <button
                          key={option.label}
                          onClick={() => {
                            updateCategory(category.id, { layoutMode: option.value as any });
                            setOpenLayoutDropdownFor(null);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                            (category.layoutMode || '') === option.value
                              ? 'text-[rgb(var(--color-accent))] bg-white/5 font-medium'
                              : 'text-gray-300 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>,
                    document.body
                  )}
                </div>

                <button
                  onClick={() => updateCategory(category.id, { isPinned: !category.isPinned })}
                  className={`p-1.5 rounded-lg transition-colors ${
                    category.isPinned
                      ? "text-[rgb(var(--color-accent))] bg-[rgb(var(--color-accent))]/10 hover:bg-[rgb(var(--color-accent))]/20"
                      : "text-gray-400 hover:text-white hover:bg-white/10"
                  }`}
                  title={category.isPinned ? `Unpin ${category.name}` : `Pin ${category.name}`}
                >
                  <svg className="w-4 h-4" fill={category.isPinned ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleStartEditCategory(category)}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title={`Edit ${category.name}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDeleteCategory(category.id)}
                  className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  title={`Delete ${category.name}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            {category.description && (
              <p className="text-gray-400 text-sm mb-4 leading-relaxed line-clamp-2">
                {sanitizeHtmlContent(category.description)}
              </p>
            )}

            {/* Feeds in category */}
            <div className="space-y-2 min-h-[100px] flex-grow bg-black/20 rounded-xl p-3 border border-white/5">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {categorizedFeeds[category.id]?.length || 0} feeds
                </span>
                {(categorizedFeeds[category.id]?.length || 0) > 0 && (
                  <span className="text-[10px] text-gray-600 flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                    Drag to reorder
                  </span>
                )}
              </div>

              {(expandedCategories[category.id] ? (categorizedFeeds[category.id] || []) : (categorizedFeeds[category.id] || []).slice(0, 5)).map((feed) => (
                <div
                  key={feed.url}
                  className={`bg-gray-800/50 p-3 rounded-lg cursor-move transition-all duration-200 border border-white/5 group ${
                    editingFeedId === feed.url ? 'ring-2 ring-[rgb(var(--color-accent))]' : 'hover:bg-gray-700 hover:border-[rgb(var(--color-accent))]/50'
                  }`}
                  draggable={editingFeedId !== feed.url}
                  onDragStart={(e) =>
                    !editingFeedId && handleDragStart(e, "feed", feed.url, feed)
                  }
                >
                  {editingFeedId === feed.url ? (
                    <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editFeedTitle}
                        onChange={(e) => setEditFeedTitle(e.target.value)}
                        className="w-full bg-black/30 text-white rounded px-2 py-1 text-sm border border-white/10 focus:outline-none focus:border-[rgb(var(--color-accent))]"
                        placeholder="Nome do feed"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={saveFeedEdit}
                          className="text-xs bg-[rgb(var(--color-accent))] text-white px-2 py-1 rounded hover:opacity-90"
                        >
                          Salvar
                        </button>
                        <button 
                          onClick={cancelFeedEdit}
                          className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded hover:bg-gray-600"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <div className="w-1 h-8 rounded-full bg-gray-700 group-hover:bg-[rgb(var(--color-accent))] transition-colors"></div>
                      <div className="flex-grow min-w-0">
                        <div
                          className="text-sm text-white font-medium truncate mb-0.5 group-hover:text-[rgb(var(--color-accent))] transition-colors"
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
                          className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded"
                          title="Editar nome"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteFeed(feed.url, feed.customTitle)}
                          className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded"
                          title="Excluir feed"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                        <div className="cursor-move p-1 text-gray-600 hover:text-gray-400">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Show More / Show Less Button */}
              {(categorizedFeeds[category.id]?.length || 0) > 5 && (
                <button
                  onClick={() => setExpandedCategories(prev => ({ ...prev, [category.id]: !prev[category.id] }))}
                  className="w-full py-2 text-xs text-center text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors mt-2 flex items-center justify-center gap-1"
                >
                    {expandedCategories[category.id] ? (
                        <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                            Show Less
                        </>
                    ) : (
                        <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            Show { (categorizedFeeds[category.id]?.length || 0) - 5 } More
                        </>
                    )}
                </button>
              )}

              {(categorizedFeeds[category.id] || []).length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-gray-600 text-xs py-8 border-2 border-dashed border-white/5 rounded-lg">
                  <span className="mb-1">Empty Category</span>
                  <span>Drop feeds here</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Uncategorized feeds */}
        {(categorizedFeeds.uncategorized || []).length > 0 && (
          <div
            className={`bg-gray-800/40 backdrop-blur-sm border-2 border-dashed rounded-xl p-4 transition-all duration-300 flex flex-col h-full ${dragState.dragOverCategory === "uncategorized"
                ? "border-[rgb(var(--color-accent))] bg-[rgb(var(--color-accent))]/10 shadow-[0_0_30px_rgba(var(--color-accent),0.1)] scale-[1.02]"
                : "border-yellow-500/30 hover:border-yellow-500/50 hover:bg-gray-800/60"
              }`}
            onDragOver={(e) => handleDragOver(e, "uncategorized")}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, "uncategorized")}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-4 h-4 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)]" />
              <h3 className="font-bold text-white text-lg tracking-tight">
                Uncategorized
              </h3>
              <span className="text-[10px] uppercase tracking-wider font-semibold bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-500/20">
                Needs Organization
              </span>
            </div>

            <div className="space-y-2 min-h-[100px] flex-grow bg-black/20 rounded-xl p-3 border border-white/5">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {categorizedFeeds.uncategorized?.length || 0} feeds
                </span>
              </div>

              {(categorizedFeeds.uncategorized || []).map((feed) => (
                <div
                  key={feed.url}
                  className={`bg-gray-800/50 p-3 rounded-lg cursor-move transition-all duration-200 border border-white/5 group ${
                    editingFeedId === feed.url ? 'ring-2 ring-[rgb(var(--color-accent))]' : 'hover:bg-gray-700 hover:border-yellow-500/50'
                  }`}
                  draggable={editingFeedId !== feed.url}
                  onDragStart={(e) =>
                    !editingFeedId && handleDragStart(e, "feed", feed.url, feed)
                  }
                >
                  {editingFeedId === feed.url ? (
                    <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editFeedTitle}
                        onChange={(e) => setEditFeedTitle(e.target.value)}
                        className="w-full bg-black/30 text-white rounded px-2 py-1 text-sm border border-white/10 focus:outline-none focus:border-[rgb(var(--color-accent))]"
                        placeholder="Nome do feed"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={saveFeedEdit}
                          className="text-xs bg-[rgb(var(--color-accent))] text-white px-2 py-1 rounded hover:opacity-90"
                        >
                          Salvar
                        </button>
                        <button 
                          onClick={cancelFeedEdit}
                          className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded hover:bg-gray-600"
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
                          className="text-sm text-white font-medium truncate mb-0.5 group-hover:text-yellow-400 transition-colors"
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
                          className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded"
                          title="Editar nome"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteFeed(feed.url, feed.customTitle)}
                          className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded"
                          title="Excluir feed"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                        <div className="cursor-move p-1 text-gray-600 hover:text-gray-400">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
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
      <div className="mt-6 bg-blue-900/10 border border-blue-500/20 rounded-xl p-4 flex items-start space-x-4">
        <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400 mt-1">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-grow">
          <h4 className="font-semibold text-blue-100 mb-2">Dicas</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm text-blue-200/70">
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              <span>Arraste feeds entre categorias para organizá-los</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              <span>Arraste categorias para reordená-las (apenas customizadas)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              <span>Use cores para distinguir categorias visualmente</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              <span>Exporte seu setup para compartilhar com outros</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
