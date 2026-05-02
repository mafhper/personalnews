import { useCallback, useMemo, useEffect, useRef } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { FeedCategory, FeedSource } from '../types';
import { DEFAULT_CATEGORIES } from '../constants/curatedFeeds';
import { getFeedSortKey } from '../utils/feedDisplay';
import { desktopBackendClient } from '../services/desktopBackendClient';
import type { FeedCategoryItem } from '../shared/contracts/backend';

export interface UseFeedCategoriesReturn {
  categories: FeedCategory[];
  createCategory: (name: string, color: string, description?: string, layoutMode?: FeedCategory['layoutMode'], autoDiscovery?: boolean) => FeedCategory;
  updateCategory: (id: string, updates: Partial<FeedCategory>) => void;
  deleteCategory: (id: string) => void;
  reorderCategories: (categoryIds: string[]) => void;
  getCategoryById: (id: string) => FeedCategory | undefined;
  getCategorizedFeeds: (feeds: FeedSource[]) => Record<string, FeedSource[]>;
  moveFeedToCategory: (feedUrl: string, categoryId: string, feeds: FeedSource[], setFeeds: (feeds: FeedSource[]) => void) => void;
  exportCategories: () => string;
  importCategories: (data: string) => boolean;
  resetToDefaults: () => void;
  resetCategoryLayouts: () => void;
}

const categoryToBackendItem = (category: FeedCategory): FeedCategoryItem => ({
  id: category.id,
  name: category.name,
  color: category.color,
  order: category.order,
  isDefault: category.isDefault,
  isPinned: category.isPinned,
  description: category.description,
  layoutMode: category.layoutMode,
  autoDiscovery: category.autoDiscovery,
  hideFromAll: category.hideFromAll,
});

const backendItemToCategory = (category: FeedCategoryItem): FeedCategory => ({
  id: category.id,
  name: category.name,
  color: category.color || '#6B7280',
  order: category.order ?? 0,
  isDefault: category.isDefault,
  isPinned: category.isPinned,
  description: category.description,
  layoutMode: category.layoutMode as FeedCategory['layoutMode'],
  autoDiscovery: category.autoDiscovery,
  hideFromAll: category.hideFromAll,
});

const buildCategorySignature = (categories: FeedCategory[]) =>
  JSON.stringify(
    categories.map((category) => ({
      id: category.id,
      name: category.name,
      color: category.color,
      order: category.order,
      isDefault: Boolean(category.isDefault),
      isPinned: Boolean(category.isPinned),
      description: category.description || null,
      layoutMode: category.layoutMode || null,
      autoDiscovery: category.autoDiscovery ?? null,
      hideFromAll: Boolean(category.hideFromAll),
    })),
  );

export const useFeedCategories = (): UseFeedCategoriesReturn => {
  const [categories, setCategories] = useLocalStorage<FeedCategory[]>('feed-categories', DEFAULT_CATEGORIES);
  const usesBackendCollection = desktopBackendClient.isDesktopRuntime();
  const backendReadyRef = useRef(!usesBackendCollection);
  const applyingBackendCategoriesRef = useRef(false);
  const backendCategorySignatureRef = useRef<string | null>(null);

  // Ensure all default categories exist (migration for existing users)
  useEffect(() => {
    setCategories(prev => {
      const existingIds = new Set(prev.map(c => c.id));
      const missingDefaults = DEFAULT_CATEGORIES.filter(d => !existingIds.has(d.id));
      
      let hasChanges = missingDefaults.length > 0;
      
      // Also sync properties for existing default categories (like autoDiscovery)
      const updatedExisting = prev.map(cat => {
        const legacyLayoutMode = cat.layoutMode as string | undefined;

        if (legacyLayoutMode === "grid") {
          hasChanges = true;
          return {
            ...cat,
            layoutMode: "modern" as FeedCategory["layoutMode"],
          };
        }
        if (cat.isDefault) {
          const defaultCat = DEFAULT_CATEGORIES.find(d => d.id === cat.id);
          if (defaultCat && cat.autoDiscovery !== defaultCat.autoDiscovery && defaultCat.autoDiscovery !== undefined) {
            hasChanges = true;
            return { ...cat, autoDiscovery: defaultCat.autoDiscovery };
          }
        }
        // Migration: Remove headerPosition from all categories (now global only)
        if ('headerPosition' in cat) {
          hasChanges = true;
          const { headerPosition: _, ...rest } = cat as FeedCategory & { headerPosition?: unknown };
          return rest;
        }
        return cat;
      });

      if (hasChanges) {
        // Add missing defaults while preserving existing order/customizations
        return [...updatedExisting, ...missingDefaults].sort((a, b) => {
          // Keep defaults at the top in their defined order, customs after
          const orderA = a.isDefault ? (DEFAULT_CATEGORIES.find(d => d.id === a.id)?.order ?? 999) : 999;
          const orderB = b.isDefault ? (DEFAULT_CATEGORIES.find(d => d.id === b.id)?.order ?? 999) : 999;

          if (orderA !== orderB) return orderA - orderB;
          return a.order - b.order;
        });
      }
      return prev;
    });
  }, [setCategories]);

  useEffect(() => {
    if (!usesBackendCollection) return;
    let cancelled = false;

    const syncBackendCategories = async () => {
      try {
        const health = await desktopBackendClient.waitUntilReady({
          timeoutMs: 12_000,
        });

        if (!health.available || cancelled) {
          backendReadyRef.current = true;
          return;
        }

        await desktopBackendClient.importLocalFeedCollection([], {
          categories: categories.map(categoryToBackendItem),
        });
        const collection = await desktopBackendClient.getFeedCollection();
        if (cancelled) return;

        const nextCategories = collection.categories.map(backendItemToCategory);
        backendCategorySignatureRef.current =
          buildCategorySignature(nextCategories);
        if (
          nextCategories.length > 0 &&
          backendCategorySignatureRef.current !==
            buildCategorySignature(categories)
        ) {
          applyingBackendCategoriesRef.current = true;
          setCategories(nextCategories);
          window.setTimeout(() => {
            applyingBackendCategoriesRef.current = false;
          }, 0);
        }

        backendReadyRef.current = true;
      } catch {
        backendReadyRef.current = true;
      }
    };

    void syncBackendCategories();

    return () => {
      cancelled = true;
    };
    // Run only once with the startup localStorage snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!usesBackendCollection || !backendReadyRef.current) return;
    if (applyingBackendCategoriesRef.current) return;

    const signature = buildCategorySignature(categories);
    if (signature === backendCategorySignatureRef.current) return;
    backendCategorySignatureRef.current = signature;

    void desktopBackendClient
      .replaceFeedCategories(categories.map(categoryToBackendItem))
      .catch(() => {
        backendCategorySignatureRef.current = null;
      });
  }, [categories, usesBackendCollection]);

  const createCategory = useCallback((name: string, color: string, description?: string, layoutMode?: FeedCategory['layoutMode'], autoDiscovery?: boolean): FeedCategory => {
    const newCategory: FeedCategory = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      color,
      description,
      order: 0, // Will be updated in the setter function
      isDefault: false,
      layoutMode,
      // headerPosition is no longer stored - global setting only
      autoDiscovery: autoDiscovery ?? true, // Default to true
    };

    setCategories(prev => {
      const maxOrder = Math.max(...prev.map(c => c.order));
      const categoryWithOrder = { ...newCategory, order: maxOrder + 1 };
      return [...prev, categoryWithOrder];
    });

    return newCategory;
  }, [setCategories]);

  const updateCategory = useCallback((id: string, updates: Partial<FeedCategory>) => {
    setCategories(prev => prev.map(category =>
      category.id === id ? { ...category, ...updates } : category
    ));
  }, [setCategories]);

  const deleteCategory = useCallback((id: string) => {
    setCategories(prev => {
      return prev.filter(category => category.id !== id);
    });
  }, [setCategories]);

  const reorderCategories = useCallback((categoryIds: string[]) => {
    setCategories(prev => {
      const reordered = categoryIds.map((id, index) => {
        const category = prev.find(c => c.id === id);
        return category ? { ...category, order: index } : null;
      }).filter(Boolean) as FeedCategory[];

      // Add any categories that weren't in the reorder list
      const missingCategories = prev.filter(c => !categoryIds.includes(c.id));
      return [...reordered, ...missingCategories];
    });
  }, [setCategories]);

  const getCategoryById = useCallback((id: string): FeedCategory | undefined => {
    return categories.find(category => category.id === id);
  }, [categories]);

  const getCategorizedFeeds = useCallback((feeds: FeedSource[]): Record<string, FeedSource[]> => {
    const result: Record<string, FeedSource[]> = {};

    // Initialize all categories with empty arrays
    categories.forEach(category => {
      result[category.id] = [];
    });

    // Add uncategorized feeds to 'all' category
    result['uncategorized'] = [];

    feeds.forEach(feed => {
      if (feed.categoryId && result[feed.categoryId]) {
        result[feed.categoryId].push(feed);
      } else {
        result['uncategorized'].push(feed);
      }

      // All feeds also go to 'all' category, UNLESS hidden
      if (result['all'] && !feed.hideFromAll) {
        result['all'].push(feed);
      }
    });

    // Sort feeds in each category alphabetically
    Object.keys(result).forEach(categoryId => {
      result[categoryId].sort((a, b) => {
        return getFeedSortKey(a).localeCompare(getFeedSortKey(b), 'pt-BR');
      });
    });

    return result;
  }, [categories]);

  const moveFeedToCategory = useCallback((
    feedUrl: string,
    categoryId: string,
    feeds: FeedSource[],
    setFeeds: (feeds: FeedSource[]) => void
  ) => {
    const updatedFeeds = feeds.map(feed =>
      feed.url === feedUrl
        ? { ...feed, categoryId: categoryId === 'uncategorized' ? undefined : categoryId }
        : feed
    );
    setFeeds(updatedFeeds);
  }, []);

  const exportCategories = useCallback((): string => {
    const exportData = {
      categories: categories.filter(c => !c.isDefault),
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    return JSON.stringify(exportData, null, 2);
  }, [categories]);

  const importCategories = useCallback((data: string): boolean => {
    try {
      const importData = JSON.parse(data);

      if (!importData.categories || !Array.isArray(importData.categories)) {
        return false;
      }

      const validCategories = importData.categories.filter((cat: Record<string, unknown>) =>
        cat.id && cat.name && cat.color && typeof cat.order === 'number'
      );

      if (validCategories.length === 0) {
        return false;
      }

      // Merge with existing categories, avoiding duplicates
      setCategories(prev => {
        const existingIds = new Set(prev.map(c => c.id));
        const newCategories = validCategories.filter((cat: FeedCategory) => !existingIds.has(cat.id));

        // Adjust order to avoid conflicts
        const maxOrder = Math.max(...prev.map(c => c.order));
        const adjustedCategories = newCategories.map((cat: FeedCategory, index: number) => ({
          ...cat,
          order: maxOrder + index + 1,
          isDefault: false
        }));

        return [...prev, ...adjustedCategories];
      });

      return true;
    } catch (error) {
      console.error('Failed to import categories:', error);
      return false;
    }
  }, [setCategories]);

  const resetToDefaults = useCallback(() => {
    setCategories(DEFAULT_CATEGORIES);
  }, [setCategories]);

  // Clear all category-specific layout overrides
  const resetCategoryLayouts = useCallback(() => {
    setCategories(prev => prev.map(category => ({
      ...category,
      layoutMode: undefined // Remove the layout override
    })));
  }, [setCategories]);

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => a.order - b.order);
  }, [categories]);

  return {
    categories: sortedCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    getCategoryById,
    getCategorizedFeeds,
    moveFeedToCategory,
    exportCategories,
    importCategories,
    resetToDefaults,
    resetCategoryLayouts,
  };
};
