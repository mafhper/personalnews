import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AppContent from "../components/AppContent";
import type { Article, FeedSource } from "../types";

const techFeed: FeedSource = {
  url: "https://example.com/tech.xml",
  categoryId: "tech",
  customTitle: "Tech",
};

const designFeed: FeedSource = {
  url: "https://example.com/design.xml",
  categoryId: "design",
  customTitle: "Design",
};

const videoFeed: FeedSource = {
  url: "https://example.com/videos.xml",
  categoryId: "youtube",
  customTitle: "Videos",
};

const categories = [
  { id: "all", name: "All", color: "#fff", order: 0, isDefault: true },
  { id: "tech", name: "Tech", color: "#0ea5e9", order: 1, isDefault: true },
  {
    id: "design",
    name: "Design",
    color: "#f97316",
    order: 2,
    isDefault: true,
  },
  {
    id: "youtube",
    name: "Vídeos",
    color: "#ef4444",
    order: 3,
    isDefault: true,
    layoutMode: "brutalist",
    autoDiscovery: false,
  },
];

const makeArticle = (
  title: string,
  feed: FeedSource,
  category: string,
): Article => ({
  title,
  link: `${feed.url}/${title.toLowerCase().replace(/\s+/g, "-")}`,
  pubDate: new Date("2026-03-22T12:00:00.000Z"),
  sourceTitle: feed.customTitle || title,
  feedUrl: feed.url,
  categories: [category],
});

const techArticle = makeArticle("Tech One", techFeed, "tech");
const designArticle = makeArticle("Design One", designFeed, "design");
const videoArticle = makeArticle("Video One", videoFeed, "youtube");

const mockLoadFeeds = vi.fn(async () => {});
const mockRefreshFeeds = vi.fn();
const mockRetryFailedFeeds = vi.fn(async () => {});
const mockCancelLoading = vi.fn();
const mockSetFeeds = vi.fn();

type MockFeedState = {
  feeds: FeedSource[];
  articles: Article[];
  loadingState: {
    status: "idle" | "loading" | "success" | "error";
    progress: number;
    loadedFeeds: number;
    totalFeeds: number;
    errors: Array<{ url: string; error: string }>;
    isBackgroundRefresh: boolean;
    currentAction: string;
    isResolved: boolean;
    hasScopedCache?: boolean;
    isHoldingPreviousContent?: boolean;
    scopeKey?: string;
  };
  loadFeeds: typeof mockLoadFeeds;
  refreshFeeds: typeof mockRefreshFeeds;
  retryFailedFeeds: typeof mockRetryFailedFeeds;
  cancelLoading: typeof mockCancelLoading;
  setFeeds: typeof mockSetFeeds;
};

let mockFeedState: MockFeedState;
const mockApplyLayoutPreset = vi.fn();
const mockRefreshAppearance = vi.fn();
const mockResolveBaseLayoutMode = vi.fn();
const mockArticleLayoutSettings = {
  autoRefreshInterval: 0,
  articlesPerPage: 10,
  feedCacheTtlMinutes: 10 as 0 | 5 | 10,
};

const mockAppearanceState = {
  currentTheme: { id: "theme-dark" },
  themeSettings: { themeTransitions: false },
  backgroundConfig: {},
  applyLayoutPreset: mockApplyLayoutPreset,
  refreshAppearance: mockRefreshAppearance,
  resolveBaseLayoutMode: mockResolveBaseLayoutMode,
  contentConfig: {
    layoutMode: "modern",
    paginationType: "numbered",
  },
};

const createLoadingState = (
  overrides: Partial<MockFeedState["loadingState"]> = {},
): MockFeedState["loadingState"] => {
  const errors = overrides.errors || [];
  const status = overrides.status || "success";

  return {
    status,
    progress: 100,
    loadedFeeds: 2,
    totalFeeds: 2,
    errors,
    isBackgroundRefresh: false,
    currentAction:
      status === "loading"
        ? "Carregando..."
        : errors.length > 0
          ? `${errors.length} feeds falharam nesta atualização`
          : "done",
    isResolved: true,
    hasScopedCache: false,
    isHoldingPreviousContent: false,
    scopeKey: "all",
    ...overrides,
  };
};

vi.mock("../contexts/FeedContextState", () => ({
  useFeeds: () => mockFeedState,
}));

vi.mock("../hooks/useAppearance", () => ({
  useAppearance: () => mockAppearanceState,
}));

vi.mock("../hooks/useFeedCategories", () => ({
  useFeedCategories: () => ({
    categories,
    getCategorizedFeeds: (feeds: FeedSource[]) => ({
      all: feeds,
      tech: feeds.filter((feed) => feed.categoryId === "tech"),
      design: feeds.filter((feed) => feed.categoryId === "design"),
      youtube: feeds.filter((feed) => feed.categoryId === "youtube"),
    }),
  }),
}));

vi.mock("../hooks/usePagination", () => ({
  usePagination: (totalItems: number) => ({
    currentPage: 0,
    totalPages: Math.max(1, totalItems > 0 ? 1 : 1),
    articlesPerPage: totalItems || 10,
    isNavigating: false,
    setPage: vi.fn(),
    nextPage: vi.fn(),
    prevPage: vi.fn(),
    resetPagination: vi.fn(),
    canGoNext: false,
    canGoPrev: false,
    startIndex: 0,
    endIndex: totalItems,
  }),
}));

vi.mock("../hooks/useArticleLayout", () => ({
  useArticleLayout: () => ({
    settings: mockArticleLayoutSettings,
  }),
}));

vi.mock("../hooks/useLocalStorage", () => ({
  useLocalStorage: () => ["24h", vi.fn()],
}));

vi.mock("../hooks/useModal", () => ({
  useModal: () => ({
    isModalOpen: false,
  }),
}));

vi.mock("../hooks/useUI", () => ({
  useUI: () => ({
    isFeedManagerOpen: false,
    isSettingsOpen: false,
    isFavoritesOpen: false,
    isShortcutsOpen: false,
    openFeedManager: vi.fn(),
    openSettings: vi.fn(),
    openFavorites: vi.fn(),
    openShortcuts: vi.fn(),
    closeFeedManager: vi.fn(),
    closeSettings: vi.fn(),
    closeFavorites: vi.fn(),
    closeShortcuts: vi.fn(),
  }),
}));

vi.mock("../hooks/useKeyboardNavigation", () => ({
  useKeyboardNavigation: vi.fn(),
}));

vi.mock("../hooks/useSwipeGestures", () => ({
  useSwipeGestures: () => ({ current: null }),
}));

vi.mock("../services/logger", () => {
  const mockLogger = {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    debugTag: vi.fn(),
  };

  return {
    logger: mockLogger,
    getLogger: () => mockLogger,
    useLogger: () => mockLogger,
  };
});

vi.mock("../config/layoutPresets.config", () => ({
  BUILT_LAYOUT_PRESETS: [],
}));

vi.mock("../components/Header", () => ({
  default: (props: {
    onNavigation: (category: string) => void;
    onGoAll?: () => void;
    onRefreshClick?: () => void;
  }) => (
    <div data-testid="header">
      <button onClick={() => props.onNavigation("design")}>Go design</button>
      <button onClick={() => props.onNavigation("youtube")}>Go videos</button>
      <button onClick={() => props.onGoAll?.()}>Go all</button>
      <button onClick={() => props.onRefreshClick?.()}>Refresh</button>
    </div>
  ),
}));

vi.mock("../components/FeedContent", () => ({
  FeedContent: (props: {
    articles: Article[];
    selectedCategory?: string;
    layoutMode?: string;
    onMounted?: () => void;
  }) => {
    React.useEffect(() => {
      props.onMounted?.();
    }, [props]);

    return (
      <div data-testid="feed-content">
        <div>{props.selectedCategory}</div>
        <div>{props.layoutMode}</div>
        {props.articles.map((article) => (
          <div key={article.link}>{article.title}</div>
        ))}
      </div>
    );
  },
}));

vi.mock("../components/ui/FeedSkeleton", () => ({
  FeedSkeleton: (props: { layoutMode?: string }) => (
    <div data-testid="feed-skeleton">{props.layoutMode || "modern"}</div>
  ),
}));

vi.mock("../components/ProgressIndicator", () => ({
  FeedLoadingProgress: (props: {
    currentAction?: string;
    errors?: any[];
    onRetryErrors?: () => void;
    onCancel?: () => void;
  }) => (
    <div data-testid="loading-progress">
      {props.currentAction || "loading"}
      {props.errors && props.errors.length > 0 && (
        <div data-testid="error-actions">
          <button>Abrir diagnósticos</button>
          <button>Configurar proxies</button>
          {props.onRetryErrors && <button>Tentar novamente</button>}
        </div>
      )}
    </div>
  ),
  LoadingSpinner: () => <div data-testid="loading-spinner" />,
}));

vi.mock("../components/Modal", () => ({
  Modal: ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("../components/FeedManager", () => ({
  FeedManager: () => null,
}));

vi.mock("../components/SettingsSidebar", () => ({
  SettingsSidebar: () => null,
}));

vi.mock("../components/KeyboardShortcutsModal", () => ({
  KeyboardShortcutsModal: () => null,
}));

vi.mock("../components/FavoritesModal", () => ({
  FavoritesModal: () => null,
}));

vi.mock("../components/SkipLinks", () => ({
  SkipLinks: () => null,
}));

vi.mock("../components/PaginationControls", () => ({
  PaginationControls: () => null,
}));

vi.mock("../components/BackgroundLayer", () => ({
  BackgroundLayer: () => null,
}));

vi.mock("../components/PerformanceDebugger", () => ({
  default: () => null,
}));

describe("AppContent cache-first rendering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, "", "/?category=tech");
    mockAppearanceState.contentConfig.layoutMode = "modern";
    mockApplyLayoutPreset.mockImplementation((presetId: string) => {
      mockAppearanceState.contentConfig.layoutMode = presetId;
    });
    mockResolveBaseLayoutMode.mockImplementation(() => "modern");
    mockRefreshAppearance.mockImplementation(() => {
      mockAppearanceState.contentConfig.layoutMode = "modern";
    });

    mockFeedState = {
      feeds: [techFeed, designFeed, videoFeed],
      articles: [techArticle],
      loadingState: createLoadingState(),
      loadFeeds: mockLoadFeeds,
      refreshFeeds: mockRefreshFeeds,
      retryFailedFeeds: mockRetryFailedFeeds,
      cancelLoading: mockCancelLoading,
      setFeeds: mockSetFeeds,
    };
  });

  it("passes the configured cache TTL to category navigation requests", async () => {
    await act(async () => {
      render(<AppContent />);
      await Promise.resolve();
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Go design"));
      await Promise.resolve();
    });

    expect(mockLoadFeeds).toHaveBeenLastCalledWith(
      expect.objectContaining({
        categoryId: "design",
        mode: "category",
        forceRefresh: false,
        cacheTtlMinutes: 10,
      }),
    );
  });

  it("keeps manual refresh on the force-refresh context path", async () => {
    await act(async () => {
      render(<AppContent />);
      await Promise.resolve();
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Refresh"));
      await Promise.resolve();
    });

    expect(mockRefreshFeeds).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryId: "tech",
        mode: "category",
        cacheTtlMinutes: 10,
      }),
    );
    expect(mockLoadFeeds).not.toHaveBeenCalled();
  });

  it("shows the dominant skeleton on cold start without cache", async () => {
    mockFeedState.articles = [];
    mockFeedState.loadingState = createLoadingState({
      status: "loading",
      progress: 0,
      loadedFeeds: 0,
      isBackgroundRefresh: false,
      isResolved: false,
      hasScopedCache: false,
      currentAction: "Initializing feed engine...",
    });

    await act(async () => {
      render(<AppContent />);
      await Promise.resolve();
    });

    expect(screen.getByTestId("feed-skeleton")).toBeInTheDocument();
    expect(screen.queryByTestId("feed-content")).not.toBeInTheDocument();
  });

  it("renders scoped cached content immediately during navigation while refreshing in the background", async () => {
    mockLoadFeeds.mockImplementation(async () => {
      mockFeedState.articles = [designArticle];
      mockFeedState.loadingState = createLoadingState({
        status: "loading",
        progress: 25,
        loadedFeeds: 1,
        isBackgroundRefresh: true,
        isResolved: true,
        hasScopedCache: true,
        scopeKey: "category:design",
        currentAction: "Updating feeds in background...",
      });
    });

    let view!: ReturnType<typeof render>;
    await act(async () => {
      view = render(<AppContent />);
      await Promise.resolve();
    });

    expect(await screen.findByText("Tech One")).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByText("Go design"));
      view.rerender(<AppContent />);
      await Promise.resolve();
    });

    expect(screen.getByText("Design One")).toBeInTheDocument();
    expect(screen.queryByText("Tech One")).not.toBeInTheDocument();
    expect(screen.getByTestId("loading-progress")).toBeInTheDocument();
    expect(screen.queryByTestId("feed-skeleton")).not.toBeInTheDocument();
    expect(screen.getByText("design")).toBeInTheDocument();
  });

  it("shows a clean target-layout skeleton during a no-cache navigation and swaps when the new scope resolves", async () => {
    mockLoadFeeds.mockImplementation(
      async (_request?: { categoryId?: string }) => {
        mockFeedState.articles = [];
        mockFeedState.loadingState = createLoadingState({
          status: "loading",
          progress: 0,
          loadedFeeds: 0,
          totalFeeds: 1,
          isBackgroundRefresh: false,
          isResolved: false,
          hasScopedCache: false,
          isHoldingPreviousContent: false,
          scopeKey: "category:youtube",
          currentAction: "Loading selected category...",
        });
      },
    );

    let view!: ReturnType<typeof render>;
    await act(async () => {
      view = render(<AppContent />);
      await Promise.resolve();
    });

    expect(await screen.findByText("Tech One")).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByText("Go videos"));
      view.rerender(<AppContent />);
      await Promise.resolve();
    });

    expect(mockApplyLayoutPreset).toHaveBeenCalledWith("brutalist", false);
    expect(screen.queryByText("Tech One")).not.toBeInTheDocument();
    expect(screen.queryByTestId("feed-content")).not.toBeInTheDocument();
    expect(screen.getByTestId("feed-skeleton")).toHaveTextContent("brutalist");
    expect(screen.getByTestId("loading-progress")).toBeInTheDocument();

    mockFeedState.articles = [videoArticle];
    mockFeedState.loadingState = createLoadingState({
      status: "success",
      progress: 100,
      loadedFeeds: 1,
      totalFeeds: 1,
      scopeKey: "category:youtube",
    });

    await act(async () => {
      view.rerender(<AppContent />);
      await Promise.resolve();
    });

    expect(await screen.findByText("Video One")).toBeInTheDocument();
    expect(screen.queryByText("Tech One")).not.toBeInTheDocument();
  });

  it("restores the base layout when returning to all from a category-specific layout", async () => {
    window.history.replaceState({}, "", "/?category=youtube");
    mockFeedState.articles = [videoArticle];

    mockLoadFeeds.mockImplementation(async (request?: { mode?: string }) => {
      if (request?.mode === "all") {
        mockFeedState.articles = [techArticle, designArticle, videoArticle];
        mockFeedState.loadingState = createLoadingState({
          status: "loading",
          progress: 20,
          loadedFeeds: 1,
          totalFeeds: 3,
          isBackgroundRefresh: true,
          isResolved: true,
          hasScopedCache: true,
          scopeKey: "all",
          currentAction: "Updating feeds in background...",
        });
      }
    });

    let view!: ReturnType<typeof render>;
    await act(async () => {
      view = render(<AppContent />);
      await Promise.resolve();
    });

    expect(await screen.findByText("youtube")).toBeInTheDocument();
    expect(screen.getByText("brutalist")).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByText("Go all"));
      view.rerender(<AppContent />);
      await Promise.resolve();
    });

    expect(mockRefreshAppearance).toHaveBeenCalled();
    expect(await screen.findByText("all")).toBeInTheDocument();
    expect(screen.getByText("modern")).toBeInTheDocument();
    expect(screen.queryByText("brutalist")).not.toBeInTheDocument();
  });

  it("shows the public category name instead of the internal youtube id when video feeds are unavailable", async () => {
    window.history.replaceState({}, "", "/?category=youtube");
    mockFeedState.articles = [
      {
        title: "RSS Feed Temporarily Unavailable",
        link: videoFeed.url,
        pubDate: new Date("2026-03-22T12:00:00.000Z"),
        sourceTitle: "System Notice",
        feedUrl: videoFeed.url,
        categories: ["system", "unavailable"],
      },
    ];
    mockFeedState.loadingState = createLoadingState({
      errors: [
        {
          url: videoFeed.url,
          error: "Feed temporarily unavailable",
        },
      ],
    });

    await act(async () => {
      render(<AppContent />);
      await Promise.resolve();
    });

    expect(
      screen.getByText('Unable to load the feeds for "Vídeos" right now.'),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: "Abrir diagnósticos" }).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.queryByText(/No articles found for the category "youtube"\./),
    ).not.toBeInTheDocument();
  });

  it("keeps visible articles on partial failures and shows a diagnostics CTA", async () => {
    window.history.replaceState({}, "", "/?category=all");
    mockFeedState.articles = [techArticle];
    mockFeedState.loadingState = createLoadingState({
      errors: [
        {
          url: designFeed.url,
          error: "Network error occurred while fetching the feed",
        },
      ],
    });

    await act(async () => {
      render(<AppContent />);
      await Promise.resolve();
    });

    expect(screen.getByText("Tech One")).toBeInTheDocument();
    try {
      expect(
        screen.getByText(/falha(ram|u) (nesta|na) atualização/i),
      ).toBeInTheDocument();
    } catch (e) {
      console.log("--- SCREEN DEBUG ---");
      screen.debug();
      throw e;
    }
    expect(
      screen.getAllByRole("button", { name: "Abrir diagnósticos" }).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByRole("button", { name: "Configurar proxies" }),
    ).toBeInTheDocument();
  });

  it("auto-dismisses the partial failure warning after a short delay", async () => {
    vi.useFakeTimers();
    window.history.replaceState({}, "", "/?category=all");
    mockFeedState.articles = [techArticle];
    mockFeedState.loadingState = createLoadingState({
      errors: [
        {
          url: designFeed.url,
          error: "Network error occurred while fetching the feed",
        },
      ],
    });

    await act(async () => {
      render(<AppContent />);
      await Promise.resolve();
    });

    try {
      expect(
        screen.getByText(/falha(ram|u) (nesta|na) atualização/i),
      ).toBeInTheDocument();
    } catch (e) {
      console.log("--- SCREEN DEBUG ---");
      screen.debug();
      throw e;
    }

    await act(async () => {
      vi.advanceTimersByTime(10050);
      await Promise.resolve();
    });

    expect(
      screen.queryByText(/falha(ram|u) (nesta|na) atualização/i),
    ).not.toBeInTheDocument();

    vi.useRealTimers();
  });
});
