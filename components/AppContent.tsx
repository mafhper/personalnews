import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  Suspense,
  lazy,
} from "react";
// Lazy load components - reduces initial bundle size
const Header = lazy(() => import("./Header"));
const FeedContent = lazy(() =>
  import("./FeedContent").then((m) => ({ default: m.FeedContent })),
);
const Modal = lazy(() =>
  import("./Modal").then((module) => ({ default: module.Modal })),
);
const FeedManager = lazy(() =>
  import("./FeedManager").then((module) => ({ default: module.FeedManager })),
);
const SettingsSidebar = lazy(() =>
  import("./SettingsSidebar").then((module) => ({
    default: module.SettingsSidebar,
  })),
);
const KeyboardShortcutsModal = lazy(() =>
  import("./KeyboardShortcutsModal").then((module) => ({
    default: module.KeyboardShortcutsModal,
  })),
);
const FavoritesModal = lazy(() =>
  import("./FavoritesModal").then((module) => ({
    default: module.FavoritesModal,
  })),
);
const SkipLinks = lazy(() =>
  import("./SkipLinks").then((m) => ({ default: m.SkipLinks })),
);
const PaginationControls = lazy(() =>
  import("./PaginationControls").then((m) => ({
    default: m.PaginationControls,
  })),
);
// Keep critical components synchronous (skeleton, progress, search)
import { FeedLoadingProgress } from "./ProgressIndicator";
import { FeedSkeleton } from "./ui/FeedSkeleton";
import { SearchFilters } from "./SearchBar";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useModal } from "../hooks/useModal";
import { useUI } from "../hooks/useUI";

import { useKeyboardNavigation } from "../hooks/useKeyboardNavigation";
import { useAppearance } from "../hooks/useAppearance";
import { useFeedCategories } from "../hooks/useFeedCategories";
import { usePagination } from "../hooks/usePagination";
import { useSwipeGestures } from "../hooks/useSwipeGestures";
import { useArticleLayout } from "../hooks/useArticleLayout";
import type { Article } from "../types";
import { INITIAL_APP_CONFIG } from "../constants/curatedFeeds";
const BackgroundLayer = lazy(() =>
  import("./BackgroundLayer").then((m) => ({ default: m.BackgroundLayer })),
);
import { useLogger } from "../services/logger";
import { areUrlsEqual } from "../utils/urlUtils";
import type { FeedLoadRequest } from "../types";

// Lazy load non-critical components
const PerformanceDebugger = lazy(() => import("./PerformanceDebugger"));

import { useFeeds } from "../contexts/FeedContextState";
import { LoadingSpinner } from "./ProgressIndicator";

// AppContent component doesn't require props for now
const AppContent: React.FC = () => {
  // Removed isFirstPaint from destructuring
  const logger = useLogger("AppContent");
  // Use FeedContext
  const {
    feeds,
    setFeeds,
    articles,
    loadingState,
    loadFeeds,
    refreshFeeds,
    retryFailedFeeds,
    cancelLoading: _cancelLoading,
  } = useFeeds();
  const { settings: layoutSettings } = useArticleLayout();

  const buildLoadRequest = useCallback(
    (
      categoryId: string,
      feedUrl?: string | null,
      forceRefresh: boolean = false,
    ): FeedLoadRequest => {
      if (feedUrl) {
        return {
          forceRefresh,
          categoryId,
          feedUrl,
          mode: "single-feed",
          cacheTtlMinutes: forceRefresh
            ? 0
            : layoutSettings.feedCacheTtlMinutes,
        };
      }

      if (!categoryId || categoryId === "all") {
        return {
          forceRefresh,
          mode: "all",
          cacheTtlMinutes: forceRefresh
            ? 0
            : layoutSettings.feedCacheTtlMinutes,
        };
      }

      return {
        forceRefresh,
        categoryId,
        mode: "category",
        cacheTtlMinutes: forceRefresh
          ? 0
          : layoutSettings.feedCacheTtlMinutes,
      };
    },
    [layoutSettings.feedCacheTtlMinutes],
  );

  // App Shell removal logic
  useEffect(() => {
    const removeShell = () => {
      const shell = document.getElementById("app-shell");
      if (shell) {
        shell.style.opacity = "0";
        setTimeout(() => shell.remove(), 400);
      }
    };

    if (loadingState.isResolved) {
      removeShell();
    } else {
      // Fallback: original timer if resolution takes too long
      const timer = setTimeout(removeShell, 2000);
      return () => clearTimeout(timer);
    }
  }, [loadingState.isResolved]);

  // Use UIContext
  const {
    isFeedManagerOpen,
    isSettingsOpen,
    isFavoritesOpen,
    isShortcutsOpen,
    openFeedManager,
    openSettings,
    openFavorites,
    openShortcuts,
    closeFeedManager,
    closeSettings,
    closeFavorites,
    closeShortcuts,
  } = useUI();

  // State from ModalContext for global modal visibility (internal logic)
  const { isModalOpen: isAnyModalOpenGlobally } = useModal();

  // T35: Atomic Layout Lock - frozen layout during transition
  const [activeTransitionLayout, setActiveTransitionLayout] = useState<
    string | null
  >(null);

  const [selectedCategory, setSelectedCategory] = useState<string>(
    () => new URLSearchParams(window.location.search).get("category") || "all",
  );
  const [selectedFeedUrl, setSelectedFeedUrl] = useState<string | null>(null);

  // Extended theme system
  const {
    currentTheme,
    themeSettings,
    backgroundConfig,
    applyLayoutPreset,
    refreshAppearance,
    resolveBaseLayoutMode,
    contentConfig,
  } = useAppearance();

  // Feed categories system
  const { categories, getCategorizedFeeds } = useFeedCategories();
  const categorizedFeeds = getCategorizedFeeds(feeds);

  // T35: SMART LAYOUT DETECTION - ATOMIC & EQUALITARIAN
  const currentLayoutMode = useMemo(() => {
    // 1. HIGHEST PRIORITY: The Lock (Frozen during transition)
    if (activeTransitionLayout) {
      return activeTransitionLayout;
    }

    // 2. Category Priority (from Context)
    const categoryId = selectedCategory || "all";
    const activeCatObj = categories.find((c) => c.id === categoryId);
    if (activeCatObj?.layoutMode) {
      return activeCatObj.layoutMode;
    }

    // 3. Base appearance fallback (manual override, persisted preset, or default)
    return resolveBaseLayoutMode();
  }, [
    activeTransitionLayout,
    selectedCategory,
    categories,
    resolveBaseLayoutMode,
  ]);

  // Legacy settings for backward compatibility
  const [timeFormat, setTimeFormat] = useLocalStorage<"12h" | "24h">(
    "time-format",
    INITIAL_APP_CONFIG.timeFormat as "12h" | "24h",
  );

  // Search state
  const [searchResults, setSearchResults] = useState<Article[]>([]);
  const [isSearchActive, setIsSearchActive] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  // Theme change animation
  const [isThemeChanging, setIsThemeChanging] = useState<boolean>(false);

  const contentContainerClass =
    "mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10 xl:px-12";
  const headerPaddingClass = "pt-0";

  // Handle theme changes with animation
  useEffect(() => {
    if (themeSettings.themeTransitions) {
      // Defer state update to avoid synchronous render warning
      const raf = requestAnimationFrame(() => {
        setIsThemeChanging(true);
      });
      const timer = setTimeout(() => setIsThemeChanging(false), 300);
      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(timer);
      };
    }
  }, [currentTheme.id, themeSettings.themeTransitions]);

  // Auto-refresh logic (simplified using refreshFeeds from context)
  useEffect(() => {
    if (layoutSettings.autoRefreshInterval > 0 && feeds.length > 0) {
      const intervalMs = layoutSettings.autoRefreshInterval * 60 * 1000;
      logger.debugTag(
        "SYSTEM",
        `Setting up auto-refresh every ${layoutSettings.autoRefreshInterval} minutes`,
      );

      const id = setInterval(() => {
        logger.debugTag("SYSTEM", "Triggering auto-refresh...");
        refreshFeeds(buildLoadRequest(selectedCategory, selectedFeedUrl));
      }, intervalMs);

      return () => clearInterval(id);
    }
  }, [
    buildLoadRequest,
    feeds.length,
    layoutSettings.autoRefreshInterval,
    logger,
    refreshFeeds,
    selectedCategory,
    selectedFeedUrl,
  ]);

  // Pass selectedCategory to prioritize feeds from the current category
  const handleRefresh = useCallback(() => {
    refreshFeeds(buildLoadRequest(selectedCategory, selectedFeedUrl));
  }, [buildLoadRequest, refreshFeeds, selectedCategory, selectedFeedUrl]);

  // T36: Release the lock once content is confirmed to be on screen
  const handleContentMounted = useCallback(() => {
    logger.debugTag("APPEARANCE", "Handshake Received: Releasing layout lock");
    setActiveTransitionLayout(null);
  }, [logger]);

  // Search handlers
  const handleSearch = useCallback((query: string, filters: SearchFilters) => {
    setSearchQuery(query);
    setSearchFilters(filters);
    setIsSearchActive(!!query.trim());
  }, []);

  const handleSearchResultsChange = useCallback((results: Article[]) => {
    setSearchResults(results);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchFilters({});
    setIsSearchActive(false);
    setSearchResults([]);
  }, []);

  const handleCategoryNavigation = useCallback(
    (categoryIndex: number) => {
      if (categoryIndex >= 0 && categoryIndex < categories.length) {
        setSelectedCategory(categories[categoryIndex].id);
      }
    },
    [categories],
  );

  // Focus search input
  const focusSearch = useCallback(() => {
    const searchInput = document.querySelector(
      'input[type="search"], input[placeholder*="Search"]',
    ) as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
    }
  }, []);

  // Determine which articles to display based on search state and read status filter
  const displayArticles = useMemo(() => {
    const sourceArticles = articles;
    const isSystemNotice = (article: Article) => {
      const title = (article.title || "").toLowerCase();
      if (title.includes("rss feed temporarily unavailable")) return true;
      if (title.includes("feed temporarily unavailable")) return true;
      if (title.includes("feed unavailable")) return true;
      if ((article.sourceTitle || "").toLowerCase() === "system notice")
        return true;
      if (
        article.categories?.some((cat) =>
          ["system", "unavailable"].includes(cat.toLowerCase()),
        )
      )
        return true;
      return false;
    };

    if (sourceArticles.length === 0) {
      return [];
    }

    // DEBUG: Track incoming data volume
    logger.debugTag(
      "FEED",
      `Component processing ${sourceArticles.length} articles for category: ${selectedCategory}`,
    );

    let filteredArticles: Article[];

    if (selectedFeedUrl) {
      filteredArticles = sourceArticles.filter(
        (article) =>
          (article.feedUrl && areUrlsEqual(article.feedUrl, selectedFeedUrl)) ||
          article.sourceTitle === selectedFeedUrl,
      );
    } else if (isSearchActive && searchResults.length >= 0) {
      filteredArticles = searchResults;
    } else {
      if (selectedCategory === "all" || selectedCategory === "All") {
        // "All" category logic: show all feeds unless they are explicitly hidden from all
        filteredArticles = sourceArticles.filter((a: Article) => {
          const feed = feeds.find(
            (f) =>
              (a.feedUrl && areUrlsEqual(f.url, a.feedUrl)) ||
              (a.sourceTitle && f.customTitle === a.sourceTitle),
          );
          // If no feed found, show it anyway in 'all' to avoid blackout
          if (!feed) return true;
          return !feed.hideFromAll;
        });
      } else {
        const selectedCategoryObj = categories.find(
          (cat) => cat.id === selectedCategory,
        );
        if (selectedCategoryObj) {
          filteredArticles = sourceArticles.filter((article) => {
            // 1. Try to find the originating feed
            const feed = feeds.find(
              (f) =>
                (article.feedUrl && areUrlsEqual(f.url, article.feedUrl)) ||
                (article.sourceTitle && f.customTitle === article.sourceTitle),
            );

            if (feed) {
              return feed.categoryId === selectedCategory;
            }

            if (selectedCategoryObj.autoDiscovery === false) {
              return false;
            }

            // 2. Fallback: check article tags if feed metadata is missing
            return article.categories?.some(
              (cat) =>
                cat.toLowerCase() === selectedCategoryObj.name.toLowerCase(),
            );
          });
        } else {
          // Fallback matching by category name if ID not found (e.g. for legacy or external categories)
          filteredArticles = sourceArticles.filter((article) =>
            article.categories?.some(
              (cat) => cat.toLowerCase() === selectedCategory.toLowerCase(),
            ),
          );
        }
      }
    }

    const filtered = filteredArticles.filter(
      (article) => !isSystemNotice(article),
    );
    if (filtered.length > 0) {
      logger.debugTag(
        "FEED",
        `FILTER SUCCESS: Displaying ${filtered.length} articles for ${selectedCategory}`,
      );
    } else if (sourceArticles.length > 0) {
      logger.debugTag("FEED", `FILTER BLACKOUT: 0 articles after filter`, {
        selectedCategory,
        sourceCount: sourceArticles.length,
        firstArticle: {
          title: sourceArticles[0].title,
          feedUrl: sourceArticles[0].feedUrl,
          sourceTitle: sourceArticles[0].sourceTitle,
        },
        feedsInCategory:
          categories.find((c) => c.id === selectedCategory)?.name || "none",
      });
    }

    return filtered;
  }, [
    isSearchActive,
    searchResults,
    articles,
    selectedCategory,
    categories,
    feeds,
    selectedFeedUrl,
    logger,
  ]);

  const currentErrorKey = useMemo(() => {
    if (loadingState.status !== "success" || loadingState.errors.length === 0) {
      return null;
    }

    return loadingState.errors
      .map((error) => `${error.url}:${error.error}`)
      .join("|");
  }, [loadingState.errors, loadingState.status]);
  const [dismissedErrorKey, setDismissedErrorKey] = useState<string | null>(
    null,
  );
  const errorVisible =
    currentErrorKey !== null && dismissedErrorKey !== currentErrorKey;
  const dismissCurrentError = useCallback(() => {
    if (currentErrorKey) {
      setDismissedErrorKey(currentErrorKey);
    }
  }, [currentErrorKey]);

  // Auto-dismiss logic for partial error warning
  useEffect(() => {
    if (!currentErrorKey || dismissedErrorKey === currentErrorKey) {
      return;
    }

    const timer = setTimeout(
      () => setDismissedErrorKey(currentErrorKey),
      10000,
    );
    return () => clearTimeout(timer);
  }, [currentErrorKey, dismissedErrorKey]);

  const selectedCategoryDisplayName = useMemo(() => {
    return (
      categories.find((category) => category.id === selectedCategory)?.name ||
      selectedCategory
    );
  }, [categories, selectedCategory]);

  const openFeedManagerFocus = useCallback(
    (payload: {
      tab?: "operations" | "feeds" | "categories";
      section?: string;
      openProxySettings?: boolean;
    }) => {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(
          "feed-manager-focus",
          JSON.stringify(payload),
        );
      }
      openFeedManager();
    },
    [openFeedManager],
  );

  const handleManageFeedsHeaderClick = useCallback(() => {
    openFeedManager();
  }, [openFeedManager]);

  // Global event listeners for ProgressIndicator
  useEffect(() => {
    const handleOpenDiagnostics = () => {
      openFeedManagerFocus({
        tab: "operations",
        section: "feed-status",
      });
    };

    const handleOpenProxySettings = () => {
      openFeedManagerFocus({
        tab: "operations",
        openProxySettings: true,
      });
    };

    window.addEventListener("open-diagnostics", handleOpenDiagnostics);
    window.addEventListener("open-proxy-settings", handleOpenProxySettings);

    return () => {
      window.removeEventListener("open-diagnostics", handleOpenDiagnostics);
      window.removeEventListener(
        "open-proxy-settings",
        handleOpenProxySettings,
      );
    };
  }, [openFeedManagerFocus]);

  const scopedFeedUrls = useMemo(() => {
    if (selectedFeedUrl) return [selectedFeedUrl];
    if (
      !selectedCategory ||
      selectedCategory === "all" ||
      selectedCategory === "All"
    ) {
      return feeds.map((feed) => feed.url);
    }

    return feeds
      .filter((feed) => feed.categoryId === selectedCategory)
      .map((feed) => feed.url);
  }, [feeds, selectedCategory, selectedFeedUrl]);

  const scopedLoadErrors = useMemo(() => {
    const scopedSet = new Set(scopedFeedUrls);
    return loadingState.errors.filter((error) => scopedSet.has(error.url));
  }, [loadingState.errors, scopedFeedUrls]);

  const showSkeleton =
    feeds.length > 0 &&
    !loadingState.hasScopedCache &&
    (!loadingState.isResolved ||
      (loadingState.status === "loading" && !loadingState.isBackgroundRefresh));

  useEffect(() => {
    if (!showSkeleton || !activeTransitionLayout) return;
    logger.debugTag(
      "APPEARANCE",
      "Skeleton rendered for target scope: releasing layout lock",
    );
    const frameId = window.requestAnimationFrame(() => {
      setActiveTransitionLayout(null);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [activeTransitionLayout, logger, showSkeleton]);

  // Enhanced pagination system with URL persistence and reset triggers
  const pagination = usePagination(
    displayArticles.length,
    Math.max(12, layoutSettings.articlesPerPage || 21),
    {
      persistInUrl: true,
      resetTriggers: [
        selectedCategory,
        isSearchActive,
        searchQuery,
        contentConfig.paginationType,
      ],
    },
  );

  // T12 & T36: Progressive pagination support
  const paginatedArticles = useMemo(() => {
    if (contentConfig.paginationType === "loadMore") {
      return displayArticles.slice(
        0,
        (pagination.currentPage + 1) * layoutSettings.articlesPerPage,
      );
    }
    return displayArticles.slice(pagination.startIndex, pagination.endIndex);
  }, [
    displayArticles,
    pagination.startIndex,
    pagination.endIndex,
    pagination.currentPage,
    layoutSettings.articlesPerPage,
    contentConfig.paginationType,
  ]);

  const renderedArticles = paginatedArticles;
  const renderedCategory = selectedCategory;
  const renderedLayoutMode = currentLayoutMode as string;

  const shouldShowCategoryUnavailableMessage =
    !isSearchActive &&
    selectedCategory !== "all" &&
    selectedCategory !== "All" &&
    scopedFeedUrls.length > 0 &&
    scopedLoadErrors.length >= scopedFeedUrls.length &&
    renderedArticles.length === 0 &&
    !loadingState.isHoldingPreviousContent;

  const handleNavigation = useCallback(
    (category: string, feedUrl?: string) => {
      const nextFeedUrl = feedUrl || null;
      const isSameFeedSelection =
        (selectedFeedUrl === null && nextFeedUrl === null) ||
        (!!selectedFeedUrl &&
          !!nextFeedUrl &&
          areUrlsEqual(selectedFeedUrl, nextFeedUrl));

      if (selectedCategory === category && isSameFeedSelection) {
        pagination.resetPagination();
        window.scrollTo({ top: 0, behavior: "auto" });
        return;
      }

      logger.debugTag("APPEARANCE", "handleNavigation called", {
        toCategory: category,
      });

      // T37: ATOMIC LOCK - Find target layout FIRST
      const categoryObj = categories.find((c) => c.id === category);
      let targetMode: string = resolveBaseLayoutMode();

      if (categoryObj?.layoutMode) {
        targetMode = categoryObj.layoutMode;
      }

      // T37: Apply lock BEFORE changing category or loading
      setActiveTransitionLayout(targetMode);

      setSelectedCategory(category);
      setSelectedFeedUrl(nextFeedUrl);

      // TRIGGER CONTENT LOAD
      loadFeeds(buildLoadRequest(category, feedUrl));

      // Apply visual updates through context
      if (categoryObj && categoryObj.layoutMode) {
        applyLayoutPreset(categoryObj.layoutMode, false);
      } else {
        refreshAppearance();
      }

      pagination.resetPagination();
      window.scrollTo({ top: 0, behavior: "auto" });

      // Backup timer to release lock if mount fails
      const timer = setTimeout(() => {
        setActiveTransitionLayout(null);
      }, 2000);
      return () => clearTimeout(timer);
    },
    [
      categories,
      pagination,
      applyLayoutPreset,
      buildLoadRequest,
      refreshAppearance,
      resolveBaseLayoutMode,
      loadFeeds,
      logger,
      selectedCategory,
      selectedFeedUrl,
    ],
  );

  const handleTitleNavigation = useCallback(() => {
    const category = "all";
    if (selectedCategory === category && !selectedFeedUrl) {
      pagination.resetPagination();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const categoryObj = categories.find((c) => c.id === category);
    let targetMode: string = resolveBaseLayoutMode();

    if (categoryObj?.layoutMode) {
      targetMode = categoryObj.layoutMode;
    }

    setActiveTransitionLayout(targetMode);
    setSelectedCategory(category);
    setSelectedFeedUrl(null);
    loadFeeds(buildLoadRequest(category));

    if (categoryObj && categoryObj.layoutMode) {
      applyLayoutPreset(categoryObj.layoutMode, false);
    } else {
      refreshAppearance();
    }

    pagination.resetPagination();
    window.scrollTo({ top: 0, behavior: "smooth" });

    const timer = setTimeout(() => {
      setActiveTransitionLayout(null);
    }, 1200);
    return () => clearTimeout(timer);
  }, [
    categories,
    pagination,
    applyLayoutPreset,
    buildLoadRequest,
    loadFeeds,
    refreshAppearance,
    resolveBaseLayoutMode,
    selectedCategory,
    selectedFeedUrl,
  ]);

  const handleLogoToLanding = useCallback(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash) {
      window.location.hash = "";
    } else {
      window.location.hash = "";
    }
  }, []);

  // Keyboard shortcuts configuration
  const keyboardShortcuts = useMemo(
    () => [
      {
        key: "k",
        ctrlKey: true,
        action: focusSearch,
        description: "Open search",
      },
      {
        key: "r",
        ctrlKey: true,
        action: handleRefresh,
        description: "Refresh articles",
      },
      {
        key: "m",
        ctrlKey: true,
        action: openFeedManager,
        description: "Manage feeds",
      },
      {
        key: "s",
        ctrlKey: true,
        action: openSettings,
        description: "Open settings",
      },
      {
        key: "f",
        ctrlKey: true,
        action: openFavorites,
        description: "Open favorites",
      },
      {
        key: "h",
        ctrlKey: true,
        action: openShortcuts,
        description: "Show keyboard shortcuts",
      },
      {
        key: "?",
        action: openShortcuts,
        description: "Show keyboard shortcuts",
      },
      {
        key: "1",
        action: () => handleCategoryNavigation(0),
        description: "Select All category",
      },
      {
        key: "2",
        action: () => handleCategoryNavigation(1),
        description: "Select Tech category",
      },
      {
        key: "3",
        action: () => handleCategoryNavigation(2),
        description: "Select Reviews category",
      },
      {
        key: "4",
        action: () => handleCategoryNavigation(3),
        description: "Select Science category",
      },
      {
        key: "5",
        action: () => handleCategoryNavigation(4),
        description: "Select Entertainment category",
      },
      {
        key: "6",
        action: () => handleCategoryNavigation(5),
        description: "Select AI category",
      },
    ],
    [
      focusSearch,
      handleRefresh,
      handleCategoryNavigation,
      openFeedManager,
      openSettings,
      openFavorites,
      openShortcuts,
    ],
  );

  useKeyboardNavigation({
    shortcuts: keyboardShortcuts,
    enableArrowNavigation: true,
    onArrowNavigation: (direction) => {
      if (direction === "up" || direction === "down") {
        const articles = document.querySelectorAll(
          'article a, [role="article"] a',
        );
        const currentFocused = document.activeElement;
        const currentIndex = Array.from(articles).findIndex(
          (article) => article === currentFocused,
        );

        let nextIndex: number;
        if (direction === "down") {
          nextIndex = currentIndex < articles.length - 1 ? currentIndex + 1 : 0;
        } else {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : articles.length - 1;
        }

        if (articles[nextIndex]) {
          (articles[nextIndex] as HTMLElement).focus();
        }
      }
    },
  });

  // Swipe gestures for mobile category navigation
  const swipeRef = useSwipeGestures({
    onSwipeLeft: () => {
      const currentCategoryIndex = categories.findIndex(
        (c) => c.id === selectedCategory,
      );
      if (currentCategoryIndex < categories.length - 1) {
        handleNavigation(categories[currentCategoryIndex + 1].id);
      }
    },
    onSwipeRight: () => {
      const currentCategoryIndex = categories.findIndex(
        (c) => c.id === selectedCategory,
      );
      if (currentCategoryIndex > 0) {
        handleNavigation(categories[currentCategoryIndex - 1].id);
      }
    },
    threshold: 75,
  });

  return (
    <>
      <Suspense fallback={null}>
        <BackgroundLayer
          backgroundConfig={backgroundConfig}
          currentTheme={currentTheme}
        />
      </Suspense>
      <div
        className={`text-[rgb(var(--color-text))] min-h-screen font-sans antialiased relative flex flex-col theme-transition-all ${isThemeChanging ? "theme-change-animation" : ""}`}
      >
        <Suspense fallback={null}>
          <SkipLinks />
        </Suspense>
        {!isAnyModalOpenGlobally && (
          <Suspense
            fallback={<div className="h-16 w-full bg-black/10 animate-pulse" />}
          >
            <Header
              onManageFeedsClick={openFeedManager}
              onManageFeedsIconClick={handleManageFeedsHeaderClick}
              onRefreshClick={handleRefresh}
              feedIssueCount={loadingState.errors.length}
              selectedCategory={selectedCategory}
              onNavigation={handleNavigation}
              categorizedFeeds={categorizedFeeds}
              onOpenSettings={openSettings}
              onOpenFavorites={openFavorites}
              articles={articles}
              onSearch={handleSearch}
              onSearchResultsChange={handleSearchResultsChange}
              categories={categories}
              onGoAll={handleTitleNavigation}
              onGoLanding={handleLogoToLanding}
            />
          </Suspense>
        )}
        <main
          ref={swipeRef}
          id="main-content"
          className={`w-full min-h-screen relative z-10 flex-grow ${headerPaddingClass} pb-6 lg:pb-8 transition-[padding] duration-300`}
          style={{
            paddingTop:
              "calc(var(--feed-header-offset, 0px) + var(--feed-header-gap, 0px))",
          }}
          tabIndex={-1}
        >
          {(loadingState.status === "loading" ||
            (errorVisible && loadingState.errors.length > 0)) && (
            <FeedLoadingProgress
              loadedFeeds={loadingState.loadedFeeds}
              totalFeeds={loadingState.totalFeeds}
              progress={loadingState.progress}
              isBackgroundRefresh={loadingState.isBackgroundRefresh}
              errors={loadingState.errors}
              currentAction={loadingState.currentAction}
              onCancel={dismissCurrentError}
              onRetryErrors={retryFailedFeeds}
              onOpenDiagnostics={() =>
                openFeedManagerFocus({
                  tab: "operations",
                  section: "feed-status",
                })
              }
              onOpenProxySettings={() =>
                openFeedManagerFocus({
                  tab: "operations",
                  openProxySettings: true,
                })
              }
              mode="overlay"
            />
          )}

          {isSearchActive && (
            <div className={contentContainerClass}>
              <div className="mb-6 flex items-center justify-between bg-gray-800 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="text-[rgb(var(--color-accent))]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[rgb(var(--color-text))] font-medium">
                      Search results for "{searchQuery}"
                    </p>
                    <p className="text-[rgb(var(--color-textSecondary))] text-sm">
                      {displayArticles.length} article
                      {displayArticles.length !== 1 ? "s" : ""} found
                      {Object.keys(searchFilters).length > 0 &&
                        " with filters applied"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={clearSearch}
                  className="text-[rgb(var(--color-textSecondary))] hover:text-[rgb(var(--color-text))] transition-colors px-3 py-1 rounded border border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-text))]"
                >
                  Clear Search
                </button>
              </div>
            </div>
          )}

          {showSkeleton ? (
            <div className={contentContainerClass}>
              <FeedSkeleton
                count={layoutSettings.articlesPerPage}
                layoutMode={currentLayoutMode as string}
              />
            </div>
          ) : (
            <>
              {renderedArticles.length > 0 ? (
                <>
                  <Suspense
                    fallback={
                      <div className="feed-page-frame">
                        <FeedSkeleton
                          count={layoutSettings.articlesPerPage}
                          layoutMode={renderedLayoutMode}
                        />
                      </div>
                    }
                  >
                    <FeedContent
                      key={`${renderedCategory}-${selectedFeedUrl || "all"}-${renderedLayoutMode}`}
                      articles={renderedArticles}
                      timeFormat={timeFormat}
                      selectedCategory={renderedCategory}
                      layoutMode={renderedLayoutMode}
                      onMounted={handleContentMounted}
                    />
                  </Suspense>
                </>
              ) : (
                <div className="feed-page-frame">
                  {isSearchActive ? (
                    <div className="text-center text-[rgb(var(--color-textSecondary))] py-20">
                      <div className="mb-4">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-16 w-16 mx-auto text-[rgb(var(--color-textSecondary))]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold mb-2 text-[rgb(var(--color-text))]">
                        No search results found
                      </h3>
                      <p className="mb-4">
                        No articles match your search for "{searchQuery}"
                      </p>
                      <button
                        onClick={clearSearch}
                        className="bg-[rgb(var(--color-accent))] hover:bg-[rgb(var(--color-accent-dark))] text-white font-bold py-2 px-4 rounded-lg transition-colors"
                      >
                        Clear Search
                      </button>
                    </div>
                  ) : articles.length > 0 ? (
                    errorVisible && shouldShowCategoryUnavailableMessage ? (
                      <div className="mx-auto max-w-2xl rounded-[24px] border border-[rgba(var(--color-warning),0.24)] bg-[rgba(var(--color-warning),0.1)] px-6 py-8 text-center">
                        <p className="text-lg font-semibold text-[rgb(var(--theme-text-readable))]">
                          Unable to load the feeds for "
                          {selectedCategoryDisplayName}" right now.
                        </p>
                        <p className="mt-3 text-sm text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))]">
                          Todas as fontes deste escopo falharam na atualização
                          atual. Abra os diagnósticos para ver a rota usada e a
                          ação recomendada.
                        </p>
                        <div className="mt-5 flex flex-wrap justify-center gap-2">
                          <button
                            onClick={() =>
                              openFeedManagerFocus({
                                tab: "operations",
                                section: "feed-status",
                              })
                            }
                            className="rounded-full border border-[rgba(var(--color-primary),0.28)] bg-[rgba(var(--color-primary),0.12)] px-4 py-2 text-sm font-semibold text-[rgb(var(--color-primary))]"
                          >
                            Abrir diagnósticos
                          </button>
                          <button
                            onClick={() =>
                              openFeedManagerFocus({
                                tab: "operations",
                                openProxySettings: true,
                              })
                            }
                            className="rounded-full border border-[rgb(var(--color-border))]/16 bg-[rgba(var(--color-text),0.05)] px-4 py-2 text-sm font-semibold text-[rgb(var(--theme-text-readable))]"
                          >
                            Configurar proxies
                          </button>
                          <button
                            onClick={dismissCurrentError}
                            aria-label="Fechar aviso de falha total"
                            className="rounded-full border border-[rgb(var(--color-border))]/16 bg-[rgba(var(--color-text),0.05)] px-4 py-2 text-sm font-semibold text-[rgb(var(--theme-text-readable))]"
                            title="Fechar"
                          >
                            Fechar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-center text-[rgb(var(--color-textSecondary))]">
                        No articles found for the category "
                        {selectedCategoryDisplayName}".
                      </p>
                    )
                  ) : feeds.length > 0 ? (
                    errorVisible && shouldShowCategoryUnavailableMessage ? (
                      <div className="mx-auto max-w-2xl rounded-[24px] border border-[rgba(var(--color-warning),0.24)] bg-[rgba(var(--color-warning),0.1)] px-6 py-8 text-center">
                        <p className="text-lg font-semibold text-[rgb(var(--theme-text-readable))]">
                          Unable to load the feeds for "
                          {selectedCategoryDisplayName}" right now.
                        </p>
                        <p className="mt-3 text-sm text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))]">
                          Todas as fontes deste escopo falharam na atualização
                          atual. Abra os diagnósticos para ver a rota usada e a
                          ação recomendada.
                        </p>
                        <div className="mt-5 flex flex-wrap justify-center gap-2">
                          <button
                            onClick={() =>
                              openFeedManagerFocus({
                                tab: "operations",
                                section: "feed-status",
                              })
                            }
                            className="rounded-full border border-[rgba(var(--color-primary),0.28)] bg-[rgba(var(--color-primary),0.12)] px-4 py-2 text-sm font-semibold text-[rgb(var(--color-primary))]"
                          >
                            Abrir diagnósticos
                          </button>
                          <button
                            onClick={() =>
                              openFeedManagerFocus({
                                tab: "operations",
                                openProxySettings: true,
                              })
                            }
                            className="rounded-full border border-[rgb(var(--color-border))]/16 bg-[rgba(var(--color-text),0.05)] px-4 py-2 text-sm font-semibold text-[rgb(var(--theme-text-readable))]"
                          >
                            Configurar proxies
                          </button>
                          <button
                            onClick={dismissCurrentError}
                            aria-label="Fechar aviso de falha total"
                            className="rounded-full border border-[rgb(var(--color-border))]/16 bg-[rgba(var(--color-text),0.05)] px-4 py-2 text-sm font-semibold text-[rgb(var(--theme-text-readable))]"
                            title="Fechar"
                          >
                            Fechar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-center text-[rgb(var(--color-textSecondary))]">
                        No articles found from the provided feeds. Check your
                        network or the feed URLs.
                      </p>
                    )
                  ) : (
                    <div className="text-center text-[rgb(var(--color-textSecondary))] py-20">
                      <h2 className="text-2xl font-bold mb-4">
                        Welcome to your News Dashboard!
                      </h2>
                      <p className="mb-6">You don't have any RSS feeds yet.</p>
                      <button
                        onClick={openFeedManager}
                        className="bg-[rgb(var(--color-accent))] hover:bg-[rgb(var(--color-accent-dark))] text-white font-bold py-2 px-4 rounded-lg transition-colors"
                      >
                        Add Your First Feed
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Pagination Area */}
              {!showSkeleton && (
                <div className="feed-page-frame mt-12 pb-12 flex flex-col items-center space-y-6">
                  {contentConfig.paginationType === "loadMore"
                    ? // Load More Button
                      pagination.currentPage < pagination.totalPages - 1 && (
                        <button
                          onClick={() =>
                            pagination.setPage(pagination.currentPage + 1)
                          }
                          className={`px-8 py-3 bg-[rgb(var(--theme-surface-elevated,var(--color-surface)))] border border-[rgb(var(--color-border))]/30 rounded-full text-[rgb(var(--color-text))] font-bold shadow-lg hover:shadow-xl hover:bg-[rgb(var(--color-accent))]/10 transition-all active:scale-95 ${pagination.isNavigating ? "opacity-50 cursor-not-allowed" : ""}`}
                          disabled={pagination.isNavigating}
                        >
                          {pagination.isNavigating ? (
                            <span className="flex items-center gap-2">
                              <LoadingSpinner size="sm" /> Carregando...
                            </span>
                          ) : (
                            "Carregar mais artigos"
                          )}
                        </button>
                      )
                    : // Numbered Pagination
                      pagination.totalPages > 1 && (
                        <Suspense
                          fallback={
                            <div className="h-10 w-48 bg-gray-800/50 rounded-full animate-pulse" />
                          }
                        >
                          <PaginationControls
                            currentPage={pagination.currentPage}
                            totalPages={pagination.totalPages}
                            onPageChange={pagination.setPage}
                            isNavigating={pagination.isNavigating}
                            compact={false}
                          />
                        </Suspense>
                      )}

                  {/* Mobile gesture hint */}
                  <div className="sm:hidden text-center text-[rgb(var(--color-textSecondary))] text-xs opacity-60">
                    <div className="flex items-center justify-center space-x-2">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16l-4-4m0 0l4-4m-4 4h18"
                        />
                      </svg>
                      <span>Deslize para trocar de categoria</span>
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 8l4 4m0 0l-4 4m4-4H3"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
        <Suspense fallback={null}>
          <Modal
            isOpen={isFeedManagerOpen}
            onClose={closeFeedManager}
            size="full"
          >
            <FeedManager
              currentFeeds={feeds}
              setFeeds={setFeeds}
              closeModal={closeFeedManager}
              articles={articles}
              onRefreshFeeds={() =>
                loadFeeds(
                  buildLoadRequest(selectedCategory, selectedFeedUrl, true),
                )
              }
            />
          </Modal>
          <SettingsSidebar
            isOpen={isSettingsOpen}
            onClose={closeSettings}
            timeFormat={timeFormat}
            setTimeFormat={setTimeFormat}
          />
          <FavoritesModal isOpen={isFavoritesOpen} onClose={closeFavorites} />
          <KeyboardShortcutsModal
            isOpen={isShortcutsOpen}
            onClose={closeShortcuts}
          />
        </Suspense>
        <Suspense fallback={null}>
          <PerformanceDebugger />
        </Suspense>
      </div>
    </>
  );
};

export default AppContent;
