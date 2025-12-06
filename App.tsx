/**
 * App.tsx
 *
 * Componente principal do Personal News Dashboard.
 * Gerencia o estado global da aplicação, incluindo artigos, feeds, pesquisa,
 * paginação, categorias e preferências do usuário.
 *
 * @author Matheus Pereira
 * @version 2.0.0
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  Suspense,
  lazy,
} from "react";
import Header from "./components/Header";
import { FeedContent } from "./components/FeedContent";
import { Modal } from "./components/Modal";
import { FeedManager } from "./components/FeedManager";
import { SettingsSidebar } from "./components/SettingsSidebar";
import { KeyboardShortcutsModal } from "./components/KeyboardShortcutsModal";
import { FavoritesModal } from "./components/FavoritesModal";
import { SkipLinks } from "./components/SkipLinks";
import { PaginationControls } from "./components/PaginationControls";
import { SearchFilters } from "./components/SearchBar";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useNotification } from "./contexts/NotificationContext";
import { LanguageProvider } from "./contexts/LanguageContext";

import { useKeyboardNavigation } from "./hooks/useKeyboardNavigation";
import { useAppearance } from "./hooks/useAppearance";
import { useReadStatus } from "./hooks/useReadStatus";
import { useFeedCategories } from "./hooks/useFeedCategories";
import { usePagination } from "./hooks/usePagination";
import { useProgressiveFeedLoading } from "./hooks/useProgressiveFeedLoading";
import { useSwipeGestures } from "./hooks/useSwipeGestures";
import { useArticleLayout } from "./hooks/useArticleLayout";
import { withPerformanceTracking } from "./services/performanceUtils";
import { FeedLoadingProgress } from "./components/ProgressIndicator";
import { ArticleListSkeleton } from "./components/SkeletonLoader";
import { getDefaultFeeds, migrateFeeds } from "./utils/feedMigration";
import type { Article, FeedSource } from "./types";
import AuraWallpaperRenderer from "./components/AuraWallpaperRenderer"; // Import AuraWallpaperRenderer

// Lazy load non-critical components
const PerformanceDebugger = lazy(
  () => import("./components/PerformanceDebugger")
);

// ARTICLES_PER_PAGE will be dynamic based on user settings

const BackgroundLayer = React.memo(({ backgroundConfig, currentTheme }: { backgroundConfig: any, currentTheme: any }) => (
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
        <AuraWallpaperRenderer
          config={{ ...backgroundConfig.auraSettings, width: window.innerWidth, height: window.innerHeight }}
          className="w-full h-full"
          lowQuality={false} // Always render high quality for main background
        />
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

const App: React.FC = () => {
  // Initialize logging system
  React.useEffect(() => {

    // Load debug tools in development
    if (process.env.NODE_ENV === 'development') {
      import('./utils/debugMigration').then(({ debugMigration }) => {
        (window as any).debugMigration = debugMigration;
        console.log('🛠️ Debug migration tools loaded. Use window.debugMigration in console.');
      });
    }
  }, []);

  const { showNotification } = useNotification();

  // Handle feed migration on app startup
  React.useEffect(() => {
    const migrationResult = migrateFeeds(feeds);
    if (migrationResult.migrated) {
      console.log('Feed migration:', migrationResult.reason);
      setFeeds(migrationResult.feeds);

      // Show notification to user about the migration
      if (migrationResult.reason?.includes('Upgraded from legacy')) {
        showNotification(
          '🎉 Feeds atualizados! Agora você tem 16 feeds organizados por categoria.',
          {
            type: 'success',
            duration: 8000
          }
        );
      } else if (migrationResult.reason?.includes('categorization')) {
        showNotification(
          '✨ Seus feeds foram organizados automaticamente por categoria.',
          {
            type: 'info',
            duration: 6000
          }
        );
      }
    }
  }, []); // Run only once on mount

  const [feeds, setFeeds] = useLocalStorage<FeedSource[]>("rss-feeds", getDefaultFeeds());
  // Progressive feed loading system
  const { articles, loadingState, loadFeeds, retryFailedFeeds, cancelLoading } =
    useProgressiveFeedLoading(feeds);

  // Legacy loading state for backward compatibility
  const isLoading =
    loadingState.status === "loading" && !loadingState.isBackgroundRefresh;
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] =
    useState<boolean>(false); // New state for settings modal
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] =
    useState<boolean>(false); // New state for favorites modal
  const [isKeyboardShortcutsOpen, setIsKeyboardShortcutsOpen] =
    useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedFeedUrl, setSelectedFeedUrl] = useState<string | null>(null);



  // Extended theme system
  const { currentTheme, themeSettings, backgroundConfig, applyLayoutPreset } = useAppearance();

  // Feed categories system
  const { categories, getCategorizedFeeds } = useFeedCategories();
  const categorizedFeeds = getCategorizedFeeds(feeds);

  // Read status functionality
  const { isArticleRead } = useReadStatus();

  // Legacy settings for backward compatibility
  const [timeFormat, setTimeFormat] = useLocalStorage<"12h" | "24h">(
    "time-format",
    "24h"
  ); // Default to 24h format

  // Search state
  const [searchResults, setSearchResults] = useState<Article[]>([]);
  const [isSearchActive, setIsSearchActive] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});

  // Read status filtering removed - functionality no longer needed

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

  // Initialize progressive loading on mount and when feeds change
  useEffect(() => {
    if (feeds.length > 0) {
      loadFeeds();
    }
  }, [feeds]); // Only depend on feeds, loadFeeds is stable from the hook

  // Auto-refresh logic
  useEffect(() => {
    if (layoutSettings.autoRefreshInterval > 0 && feeds.length > 0) {
      const intervalMs = layoutSettings.autoRefreshInterval * 60 * 1000;
      console.log(`Setting up auto-refresh every ${layoutSettings.autoRefreshInterval} minutes`);
      
      const id = setInterval(() => {
        console.log('Triggering auto-refresh...');
        loadFeeds(true); // true = isBackgroundRefresh
      }, intervalMs);
      
      return () => clearInterval(id);
    }
  }, [layoutSettings.autoRefreshInterval, feeds.length, loadFeeds]);

  const handleRefresh = useCallback(() => {
    loadFeeds(true);
  }, [loadFeeds]);

  // Search handlers
  const handleSearch = useCallback((query: string, filters: SearchFilters) => {
    setSearchQuery(query);
    setSearchFilters(filters);
    setIsSearchActive(!!query.trim());
    // Pagination will be reset automatically by resetTriggers
  }, []);

  const handleSearchResultsChange = useCallback((results: Article[]) => {
    setSearchResults(results);
    // Pagination will be reset automatically by resetTriggers
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchFilters({});
    setIsSearchActive(false);
    setSearchResults([]);
    // Pagination will be reset automatically by resetTriggers
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
      // Find the feed configuration to get its custom title
      const selectedFeed = feeds.find(f => f.url === selectedFeedUrl);
      const feedHostname = (() => {
        try { return new URL(selectedFeedUrl).hostname.replace('www.', ''); } 
        catch { return ''; }
      })();
      
      filteredArticles = articles.filter((article) => {
        // Match by custom title if available
        if (selectedFeed?.customTitle && article.sourceTitle === selectedFeed.customTitle) {
          return true;
        }
        // Match by hostname in article link
        if (feedHostname && article.link?.includes(feedHostname)) {
          return true;
        }
        // Match by hostname in sourceTitle (some feeds use domain as title)
        if (feedHostname && article.sourceTitle?.toLowerCase().includes(feedHostname.replace(/\..+$/, ''))) {
          return true;
        }
        return false;
      });
    } else if (isSearchActive && searchResults.length >= 0) {
      // When search is active, show search results
      filteredArticles = searchResults;
    } else {
      // When search is not active, show filtered articles by category
      if (selectedCategory === "all" || selectedCategory === "All") {
        filteredArticles = articles;
      } else {
        // Filter articles based on feed category or article categories
        const selectedCategoryObj = categories.find(
          (cat) => cat.id === selectedCategory
        );
        if (selectedCategoryObj) {
          // First try to filter by feed category
          const feedsInCategory = categorizedFeeds[selectedCategory] || [];

          filteredArticles = articles.filter((article) => {
            // Check if article is from a feed in this category
            const isFromCategorizedFeed = feedsInCategory.some(
              (feed) =>
                article.sourceTitle === feed.customTitle ||
                article.link?.includes(new URL(feed.url).hostname)
            );

            // Also check article's own categories (legacy support)
            const hasMatchingCategory = article.categories?.some(
              (cat) =>
                cat.toLowerCase() === selectedCategoryObj.name.toLowerCase()
            );

            return isFromCategorizedFeed || hasMatchingCategory;
          });
        } else {
          // Fallback to legacy category filtering
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
    isArticleRead,
    categories,
    categorizedFeeds,
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
    setSelectedCategory(category);

    // Apply layout preset if category has one
    const categoryObj = categories.find(c => c.id === category);
    if (categoryObj?.layoutMode) {
      console.log(`Applying layout preset for category ${category}: ${categoryObj.layoutMode}`);
      applyLayoutPreset(categoryObj.layoutMode);
    }

    setSelectedFeedUrl(feedUrl || null);
    pagination.resetPagination();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [categories, pagination, applyLayoutPreset]);

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
        action: () => setIsModalOpen(true),
        description: "Manage feeds",
      },
      {
        key: "s",
        ctrlKey: true,
        action: () => setIsSettingsModalOpen(true),
        description: "Open settings",
      },
      {
        key: "f",
        ctrlKey: true,
        action: () => setIsFavoritesModalOpen(true),
        description: "Open favorites",
      },
      {
        key: "h",
        ctrlKey: true,
        action: () => setIsKeyboardShortcutsOpen(true),
        description: "Show keyboard shortcuts",
      },
      {
        key: "?",
        action: () => setIsKeyboardShortcutsOpen(true),
        description: "Show keyboard shortcuts",
      },
      // Number keys for category selection
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
      // Page navigation - handled by usePagination hook's keyboard navigation
    ],
    [focusSearch, handleRefresh, handleCategoryNavigation]
  );

  // Set up keyboard navigation
  useKeyboardNavigation({
    shortcuts: keyboardShortcuts,
    enableArrowNavigation: true,
    onArrowNavigation: (direction) => {
      // Handle arrow navigation for articles
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

  // Pagination reset is now handled automatically by the usePagination hook's resetTriggers

  // Page navigation functions
  // const goToNextPage = useCallback(() => {
  //   if (currentPage < totalPages - 1) {
  //     setCurrentPage(currentPage + 1);
  //   }
  // }, [currentPage, totalPages]);

  // const goToPrevPage = useCallback(() => {
  //   if (currentPage > 0) {
  //     setCurrentPage(currentPage - 1);
  //   }
  // }, [currentPage]);

  // Get the current page of articles using the new pagination system
  const paginatedArticles = displayArticles.slice(
    pagination.startIndex,
    pagination.endIndex
  );

  // Swipe gestures for mobile navigation
  const swipeRef = useSwipeGestures({
    onSwipeLeft: () => {
      // Swipe left = next page
      if (pagination.currentPage < pagination.totalPages - 1) {
        pagination.setPage(pagination.currentPage + 1);
      }
    },
    onSwipeRight: () => {
      // Swipe right = previous page
      if (pagination.currentPage > 0) {
        pagination.setPage(pagination.currentPage - 1);
      }
    },
    threshold: 50, // Minimum swipe distance
  });

  return (
    <LanguageProvider>
    <BackgroundLayer backgroundConfig={backgroundConfig} currentTheme={currentTheme} />
    <div className={`text-[rgb(var(--color-text))] min-h-screen font-sans antialiased relative flex flex-col theme-transition-all ${isThemeChanging ? "theme-change-animation" : ""}`}>
      <SkipLinks />
      <Header
        onManageFeedsClick={() => setIsModalOpen(true)}
        onRefreshClick={handleRefresh}
        selectedCategory={selectedCategory}
        onNavigation={handleNavigation}
        categorizedFeeds={categorizedFeeds}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenFavorites={() => setIsFavoritesModalOpen(true)}

        articles={articles}
        onSearch={handleSearch}
        onSearchResultsChange={handleSearchResultsChange}



        categories={categories}
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        onPageChange={pagination.setPage}
        onGoHome={() => {
          handleNavigation("all");
        }}
      />
      <main
        ref={swipeRef}
        id="main-content"
        className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pt-2 pb-6 lg:pt-4 lg:pb-8 relative z-10 flex-grow"
        tabIndex={-1}
      >
        {/* Progressive loading indicators */}
        {loadingState.status === "loading" && (
            <div className="flex flex-col items-center justify-center min-h-[40vh] w-full max-w-2xl mx-auto px-4">
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

        {/* Search active indicator */}
        {isSearchActive && (
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
        )}

        {/* Show skeleton loading when initially loading and no articles yet */}
        {isLoading && articles.length === 0 && (
          <ArticleListSkeleton count={layoutSettings.articlesPerPage} />
        )}

        {/* Show content when we have articles, even if still loading (progressive rendering) */}
        {paginatedArticles.length > 0 && (
          <>
            <FeedContent 
              articles={paginatedArticles} 
              timeFormat={timeFormat} 
              selectedCategory={selectedCategory}
            />

            {/* Pagination at bottom using enhanced PaginationControls */}
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex flex-col items-center space-y-4">
                <PaginationControls
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  onPageChange={pagination.setPage}
                  isNavigating={pagination.isNavigating}
                  compact={false}
                />

                {/* Mobile swipe hint */}
                <div className="sm:hidden text-center text-[rgb(var(--color-textSecondary))] text-xs">
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
                    <span>Swipe to navigate</span>
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

        {/* No results messaging - only show when strictly not loading and no articles */}
        {!isLoading &&
          loadingState.status !== "loading" &&
          paginatedArticles.length === 0 &&
          displayArticles.length === 0 && (
            <>
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
                <p className="text-center text-[rgb(var(--color-textSecondary))]">
                  No articles found for the category "{selectedCategory}".
                </p>
              ) : feeds.length > 0 ? (
                <p className="text-center text-[rgb(var(--color-textSecondary))]">
                  No articles found from the provided feeds. Check your network
                  or the feed URLs.
                </p>
              ) : (
                <div className="text-center text-[rgb(var(--color-textSecondary))] py-20">
                  <h2 className="text-2xl font-bold mb-4">
                    Welcome to your News Dashboard!
                  </h2>
                  <p className="mb-6">You don't have any RSS feeds yet.</p>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-[rgb(var(--color-accent))] hover:bg-[rgb(var(--color-accent-dark))] text-white font-bold py-2 px-4 rounded-lg transition-colors"
                  >
                    Add Your First Feed
                  </button>
                </div>
              )}
            </>
          )}
      </main>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <FeedManager
          currentFeeds={feeds}
          setFeeds={setFeeds}
          closeModal={() => setIsModalOpen(false)}
        />
      </Modal>
      <SettingsSidebar
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        timeFormat={timeFormat}
        setTimeFormat={setTimeFormat}
      />
      <FavoritesModal
        isOpen={isFavoritesModalOpen}
        onClose={() => setIsFavoritesModalOpen(false)}
      />
      <KeyboardShortcutsModal
        isOpen={isKeyboardShortcutsOpen}
        onClose={() => setIsKeyboardShortcutsOpen(false)}
      />
      <Suspense fallback={null}>
        <PerformanceDebugger />
      </Suspense>
    </div>
    </LanguageProvider>
  );
};

// Wrap the App component with performance monitoring
export default withPerformanceTracking(App, "App");
