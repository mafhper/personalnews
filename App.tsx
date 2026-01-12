/**
 * App.tsx
 *
 * Componente principal do Personal News Dashboard.
 * Gerencia o estado global da aplicação, incluindo artigos, feeds, pesquisa,
 * paginação, categorias e preferências do usuário.
 *
 * @author Matheus Pereira
 * @version 2.2.0
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  Suspense,
  lazy,
} from "react";
// Lazy load components
const Header = lazy(() => import("./components/Header"));
const FeedContent = lazy(() => import("./components/FeedContent").then(module => ({ default: module.FeedContent })));
const Modal = lazy(() => import("./components/Modal").then(module => ({ default: module.Modal })));
const FeedManager = lazy(() => import("./components/FeedManager").then(module => ({ default: module.FeedManager })));
const SettingsSidebar = lazy(() => import("./components/SettingsSidebar").then(module => ({ default: module.SettingsSidebar })));
const KeyboardShortcutsModal = lazy(() => import("./components/KeyboardShortcutsModal").then(module => ({ default: module.KeyboardShortcutsModal })));
const FavoritesModal = lazy(() => import("./components/FavoritesModal").then(module => ({ default: module.FavoritesModal })));
const AuraWallpaperRenderer = lazy(() => import("./components/AuraWallpaperRenderer")); // Lazy load Aura
import { SkipLinks } from "./components/SkipLinks";
import { PaginationControls } from "./components/PaginationControls";
import { SearchFilters } from "./components/SearchBar";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { LanguageProvider } from "./contexts/LanguageContext";
import { useModal } from "./contexts/ModalContext";
import { useFeeds } from "./contexts/FeedContextState";
import { useUI } from "./contexts/UIContext";

import { useKeyboardNavigation } from "./hooks/useKeyboardNavigation";
import { useAppearance } from "./hooks/useAppearance";
import { useReadStatus } from "./hooks/useReadStatus";
import { useFeedCategories } from "./hooks/useFeedCategories";
import { usePagination } from "./hooks/usePagination";
import { useSwipeGestures } from "./hooks/useSwipeGestures";
import { useArticleLayout } from "./hooks/useArticleLayout";
import { withPerformanceTracking } from "./services/performanceUtils";
import { FeedLoadingProgress } from "./components/ProgressIndicator";
import { FeedSkeleton } from "./components/ui/FeedSkeleton";
import type { Article, BackgroundConfig, ExtendedTheme } from "./types";
import { INITIAL_APP_CONFIG } from "./constants/curatedFeeds";

// Lazy load non-critical components
const PerformanceDebugger = lazy(
  () => import("./components/PerformanceDebugger")
);

const BackgroundLayer = React.memo(({ backgroundConfig, currentTheme }: { backgroundConfig: BackgroundConfig, currentTheme: ExtendedTheme }) => (
  <div
    className={`fixed inset-0 z-[-1] transition-colors duration-500 ease-in-out ${backgroundConfig.type === 'solid' ? "bg-[rgb(var(--color-background))]" : ""}`}
    style={
      backgroundConfig.type === 'gradient' || backgroundConfig.type === 'image' || backgroundConfig.type === 'aura'
        ? {
          backgroundImage: backgroundConfig.value,
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: backgroundConfig.type === 'image' ? 'fixed' : 'scroll', // Only image gets fixed attachment
          backgroundColor: `rgb(${currentTheme.colors.background})`, // Fallback color
        }
        : { backgroundColor: backgroundConfig.value || `rgb(${currentTheme.colors.background})` } // Solid background
    }
  >
    {/* Aura Wallpaper Background Layer */}
    {backgroundConfig.type === 'aura' && backgroundConfig.auraSettings && (
      <div className="absolute inset-0">
        <Suspense fallback={null}>
          <AuraWallpaperRenderer
            config={{ ...backgroundConfig.auraSettings, width: window.innerWidth, height: window.innerHeight }}
            className="w-full h-full"
            lowQuality={false} // Always render high quality for main background
          />
        </Suspense>
      </div>
    )}
    {/* Overlay para melhorar a legibilidade - menos intenso para imagens */}
    {backgroundConfig.type !== 'solid' && (
      <div className={`absolute inset-0 ${backgroundConfig.type === 'image' ? 'bg-black/30' : 'bg-black/40'}`}></div>
    )}

    {/* Gradiente de transição para o fundo */}
    {backgroundConfig.type !== 'solid' && (
      <div
        className="absolute inset-x-0 bottom-0 h-[30vh]"
        style={{
          background: `linear-gradient(to bottom, transparent, rgb(var(--color-background)))`,
        }}
      ></div>
    )}
  </div>
));

declare global {
  interface Window {
    debugMigration: { run: () => void };
  }
}

const App: React.FC = () => {
  // Initialize logging system
  React.useEffect(() => {
    // Load debug tools in development
    if (process.env.NODE_ENV === 'development') {
      import('./utils/debugMigration').then(({ debugMigration }) => {
        window.debugMigration = debugMigration;
        console.log('🛠️ Debug migration tools loaded. Use window.debugMigration in console.');
      });
    }
  }, []);

  // Use FeedContext
  const {
    feeds,
    setFeeds,
    articles,
    loadingState,
    loadFeeds,
    refreshFeeds,
    retryFailedFeeds,
    cancelLoading
  } = useFeeds();

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
    closeShortcuts
  } = useUI();

  // State from ModalContext for global modal visibility (internal logic)
  const { isModalOpen: isAnyModalOpenGlobally } = useModal();

  // Legacy loading state for backward compatibility
  const isLoading =
    loadingState.status === "loading" && !loadingState.isBackgroundRefresh;

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedFeedUrl, setSelectedFeedUrl] = useState<string | null>(null);

  // Extended theme system
  const { currentTheme, themeSettings, backgroundConfig, applyLayoutPreset, updateHeaderConfig, refreshAppearance } = useAppearance();

  // Feed categories system
  const { categories, getCategorizedFeeds } = useFeedCategories();
  const categorizedFeeds = getCategorizedFeeds(feeds);

  // Legacy settings for backward compatibility
  const [timeFormat, setTimeFormat] = useLocalStorage<"12h" | "24h">(
    "time-format",
    INITIAL_APP_CONFIG.timeFormat as "12h" | "24h"
  );

  // Search state
  const [searchResults, setSearchResults] = useState<Article[]>([]);
  const [isSearchActive, setIsSearchActive] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});

  // Article layout settings
  const { settings: layoutSettings } = useArticleLayout();

  // Theme change animation
  const [isThemeChanging, setIsThemeChanging] = useState<boolean>(false);

  // Handle theme changes with animation
  useEffect(() => {
    if (themeSettings.themeTransitions) {
      setIsThemeChanging(true);
      const timer = setTimeout(() => setIsThemeChanging(false), 300);
      return () => clearTimeout(timer);
    }
  }, [currentTheme.id, themeSettings.themeTransitions]);

  // Auto-refresh logic (simplified using refreshFeeds from context)
  useEffect(() => {
    if (layoutSettings.autoRefreshInterval > 0 && feeds.length > 0) {
      const intervalMs = layoutSettings.autoRefreshInterval * 60 * 1000;
      console.log(`Setting up auto-refresh every ${layoutSettings.autoRefreshInterval} minutes`);

      const id = setInterval(() => {
        console.log('Triggering auto-refresh...');
        refreshFeeds();
      }, intervalMs);

      return () => clearInterval(id);
    }
  }, [layoutSettings.autoRefreshInterval, feeds.length, refreshFeeds]);

  // Pass selectedCategory to prioritize feeds from the current category
  const handleRefresh = useCallback(() => {
    refreshFeeds(selectedCategory);
  }, [refreshFeeds, selectedCategory]);

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
    [categories]
  );

  // Focus search input
  const focusSearch = useCallback(() => {
    const searchInput = document.querySelector(
      'input[type="search"], input[placeholder*="Search"]'
    ) as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
    }
  }, []);

  // Determine which articles to display based on search state and read status filter
  const displayArticles = useMemo(() => {
    let filteredArticles: Article[];

    if (selectedFeedUrl) {
      const selectedFeed = feeds.find(f => f.url === selectedFeedUrl);
      const feedHostname = (() => {
        try { return new URL(selectedFeedUrl).hostname.replace('www.', ''); }
        catch { return ''; }
      })();

      filteredArticles = articles.filter((article) => {
        if (selectedFeed?.customTitle && article.sourceTitle === selectedFeed.customTitle) {
          return true;
        }
        if (feedHostname && article.link?.includes(feedHostname)) {
          return true;
        }
        if (feedHostname && article.sourceTitle?.toLowerCase().includes(feedHostname.replace(/\..+$/, ''))) {
          return true;
        }
        return false;
      });
    } else if (isSearchActive && searchResults.length >= 0) {
      filteredArticles = searchResults;
    } else {
      if (selectedCategory === "all" || selectedCategory === "All") {
        const allowedFeeds = categorizedFeeds['all'] || [];
        // Optimization: Only filter if we actually have hidden feeds
        if (allowedFeeds.length === feeds.length) {
          filteredArticles = articles;
        } else {
          filteredArticles = articles.filter((article) =>
            allowedFeeds.some((feed) => {
              // Safe URL parsing
              let feedHostname = '';
              try {
                feedHostname = new URL(feed.url).hostname;
              } catch {
                // Invalid URL in feed, skip hostname check
              }

              return (
                (feed.customTitle && article.sourceTitle === feed.customTitle) ||
                (feedHostname && article.link?.includes(feedHostname))
              );
            })
          );
        }
      } else {
        const selectedCategoryObj = categories.find(
          (cat) => cat.id === selectedCategory
        );
        if (selectedCategoryObj) {
          const feedsInCategory = categorizedFeeds[selectedCategory] || [];

          filteredArticles = articles.filter((article) => {
            const isFromCategorizedFeed = feedsInCategory.some(
              (feed) =>
                article.sourceTitle === feed.customTitle ||
                article.link?.includes(new URL(feed.url).hostname)
            );

            const hasMatchingCategory = article.categories?.some(
              (cat) =>
                cat.toLowerCase() === selectedCategoryObj.name.toLowerCase()
            );

            return isFromCategorizedFeed || hasMatchingCategory;
          });
        } else {
          filteredArticles = articles.filter((article) =>
            article.categories?.some(
              (cat) => cat.toLowerCase() === selectedCategory.toLowerCase()
            )
          );
        }
      }
    }

    return filteredArticles;
  }, [
    isSearchActive,
    searchResults,
    articles,
    selectedCategory,
    categories,
    categorizedFeeds,
    feeds,
    selectedFeedUrl
  ]);

  // Enhanced pagination system with URL persistence and reset triggers
  const pagination = usePagination(displayArticles.length, layoutSettings.articlesPerPage, {
    persistInUrl: true,
    resetTriggers: [
      selectedCategory,
      isSearchActive,
      searchQuery,
    ],
  });

  const handleNavigation = useCallback((category: string, feedUrl?: string) => {
    refreshAppearance();
    setSelectedCategory(category);

    const categoryObj = categories.find(c => c.id === category);
    if (categoryObj) {
      if (categoryObj.layoutMode) {
        applyLayoutPreset(categoryObj.layoutMode, false);
      }
      if (categoryObj.headerPosition) {
        updateHeaderConfig({ position: categoryObj.headerPosition }, false);
      }
    }

    setSelectedFeedUrl(feedUrl || null);
    pagination.resetPagination();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [categories, pagination, applyLayoutPreset, updateHeaderConfig, refreshAppearance]);

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
    [focusSearch, handleRefresh, handleCategoryNavigation, openFeedManager, openSettings, openFavorites, openShortcuts]
  );

  useKeyboardNavigation({
    shortcuts: keyboardShortcuts,
    enableArrowNavigation: true,
    onArrowNavigation: (direction) => {
      if (direction === "up" || direction === "down") {
        const articles = document.querySelectorAll(
          'article a, [role="article"] a'
        );
        const currentFocused = document.activeElement;
        const currentIndex = Array.from(articles).findIndex(
          (article) => article === currentFocused
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

  const paginatedArticles = displayArticles.slice(
    pagination.startIndex,
    pagination.endIndex
  );

  // Swipe gestures for mobile category navigation
  const swipeRef = useSwipeGestures({
    onSwipeLeft: () => {
      const currentCategoryIndex = categories.findIndex(c => c.id === selectedCategory);
      if (currentCategoryIndex < categories.length - 1) {
        handleNavigation(categories[currentCategoryIndex + 1].id);
      }
    },
    onSwipeRight: () => {
      const currentCategoryIndex = categories.findIndex(c => c.id === selectedCategory);
      if (currentCategoryIndex > 0) {
        handleNavigation(categories[currentCategoryIndex - 1].id);
      }
    },
    threshold: 75,
  });

  return (
    <LanguageProvider>
      <BackgroundLayer backgroundConfig={backgroundConfig} currentTheme={currentTheme} />
      <div className={`text-[rgb(var(--color-text))] min-h-screen font-sans antialiased relative flex flex-col theme-transition-all ${isThemeChanging ? "theme-change-animation" : ""}`}>
        <SkipLinks />
        {!isAnyModalOpenGlobally && (
          <Suspense fallback={<div className="h-16 w-full bg-black/10 animate-pulse" />}>
            <Header
              onManageFeedsClick={openFeedManager}
              onRefreshClick={handleRefresh}
              selectedCategory={selectedCategory}
              onNavigation={handleNavigation}
              categorizedFeeds={categorizedFeeds}
              onOpenSettings={openSettings}
              onOpenFavorites={openFavorites}
              articles={articles}
              onSearch={handleSearch}
              onSearchResultsChange={handleSearchResultsChange}
              categories={categories}
              onGoHome={() => handleNavigation("all")}
            />
          </Suspense>
        )}
        <main
          ref={swipeRef}
          id="main-content"
          className="w-full min-h-screen relative z-10 flex-grow pt-8 pb-6 lg:pt-8 lg:pb-8"
          tabIndex={-1}
        >
          {loadingState.status === "loading" && (
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
              {loadingState.priorityFeedsLoaded ? (
                <FeedLoadingProgress
                  loadedFeeds={loadingState.loadedFeeds}
                  totalFeeds={loadingState.totalFeeds}
                  progress={loadingState.progress}
                  isBackgroundRefresh={loadingState.isBackgroundRefresh}
                  errors={loadingState.errors}
                  currentAction={loadingState.currentAction}
                  onCancel={cancelLoading}
                  onRetryErrors={retryFailedFeeds}
                  priorityFeedsLoaded={true}
                />
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[40vh] w-full max-w-2xl mx-auto">
                  <FeedLoadingProgress
                    loadedFeeds={loadingState.loadedFeeds}
                    totalFeeds={loadingState.totalFeeds}
                    progress={loadingState.progress}
                    isBackgroundRefresh={loadingState.isBackgroundRefresh}
                    errors={loadingState.errors}
                    currentAction={loadingState.currentAction}
                    onCancel={cancelLoading}
                    onRetryErrors={retryFailedFeeds}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          )}

          {isSearchActive && (
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
              <div className="mb-6 flex items-center justify-between bg-gray-800 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="text-[rgb(var(--color-accent))]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[rgb(var(--color-text))] font-medium">Search results for "{searchQuery}"</p>
                    <p className="text-[rgb(var(--color-textSecondary))] text-sm">
                      {displayArticles.length} article{displayArticles.length !== 1 ? "s" : ""} found
                      {Object.keys(searchFilters).length > 0 && " with filters applied"}
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

          {isLoading && articles.length === 0 && (
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
              <FeedSkeleton count={layoutSettings.articlesPerPage} />
            </div>
          )}

          {paginatedArticles.length > 0 && (
            <>
              <Suspense fallback={
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
                  <FeedSkeleton count={3} />
                </div>
              }>
                <FeedContent
                  articles={paginatedArticles}
                  timeFormat={timeFormat}
                  selectedCategory={selectedCategory}
                />
              </Suspense>

              {pagination.totalPages > 1 && (
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 mt-8 flex flex-col items-center space-y-4">
                  <PaginationControls
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    onPageChange={pagination.setPage}
                    isNavigating={pagination.isNavigating}
                    compact={false}
                  />
                  <div className="sm:hidden text-center text-[rgb(var(--color-textSecondary))] text-xs">
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                      </svg>
                      <span>Swipe to change category</span>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {!isLoading && loadingState.status !== "loading" && paginatedArticles.length === 0 && displayArticles.length === 0 && (
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
              {isSearchActive ? (
                <div className="text-center text-[rgb(var(--color-textSecondary))] py-20">
                  <div className="mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-[rgb(var(--color-textSecondary))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-[rgb(var(--color-text))]">No search results found</h3>
                  <p className="mb-4">No articles match your search for "{searchQuery}"</p>
                  <button onClick={openFeedManager} className="bg-[rgb(var(--color-accent))] hover:bg-[rgb(var(--color-accent-dark))] text-white font-bold py-2 px-4 rounded-lg transition-colors">Clear Search</button>
                </div>
              ) : articles.length > 0 ? (
                <p className="text-center text-[rgb(var(--color-textSecondary))]">No articles found for the category "{selectedCategory}".</p>
              ) : feeds.length > 0 ? (
                <p className="text-center text-[rgb(var(--color-textSecondary))]">No articles found from the provided feeds. Check your network or the feed URLs.</p>
              ) : (
                <div className="text-center text-[rgb(var(--color-textSecondary))] py-20">
                  <h2 className="text-2xl font-bold mb-4">Welcome to your News Dashboard!</h2>
                  <p className="mb-6">You don't have any RSS feeds yet.</p>
                  <button onClick={openFeedManager} className="bg-[rgb(var(--color-accent))] hover:bg-[rgb(var(--color-accent-dark))] text-white font-bold py-2 px-4 rounded-lg transition-colors">Add Your First Feed</button>
                </div>
              )}
            </div>
          )}
        </main>
        <Suspense fallback={null}>
          <Modal isOpen={isFeedManagerOpen} onClose={closeFeedManager} size="full">
            <FeedManager
              currentFeeds={feeds}
              setFeeds={setFeeds}
              closeModal={closeFeedManager}
              onRefreshFeeds={() => loadFeeds(true)}
            />
          </Modal>
          <SettingsSidebar
            isOpen={isSettingsOpen}
            onClose={closeSettings}
            timeFormat={timeFormat}
            setTimeFormat={setTimeFormat}
          />
          <FavoritesModal
            isOpen={isFavoritesOpen}
            onClose={closeFavorites}
          />
          <KeyboardShortcutsModal
            isOpen={isShortcutsOpen}
            onClose={closeShortcuts}
          />
        </Suspense>
        <Suspense fallback={null}>
          <PerformanceDebugger />
        </Suspense>
      </div>
    </LanguageProvider>
  );
};

export default withPerformanceTracking(App, "App");