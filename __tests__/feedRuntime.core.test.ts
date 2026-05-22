import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockDetectEnvironment,
  mockIsEnabled,
  mockCheckHealth,
  mockFetchFeed,
  mockSetRuntimeState,
  mockParseRssUrlDetailed,
  mockGetPreferLocalProxy,
  mockShouldUseClientProxyFallback,
  mockGetRoutingMode,
  mockGetClientProxyOrder,
  mockDiscoverFromWebsite,
} = vi.hoisted(() => ({
  mockDetectEnvironment: vi.fn(),
  mockIsEnabled: vi.fn(),
  mockCheckHealth: vi.fn(),
  mockFetchFeed: vi.fn(),
  mockSetRuntimeState: vi.fn(),
  mockParseRssUrlDetailed: vi.fn(),
  mockGetPreferLocalProxy: vi.fn(),
  mockShouldUseClientProxyFallback: vi.fn(),
  mockGetRoutingMode: vi.fn(),
  mockGetClientProxyOrder: vi.fn(),
  mockDiscoverFromWebsite: vi.fn(),
}));

vi.mock("../services/environmentDetector", () => ({
  detectEnvironment: mockDetectEnvironment,
}));

vi.mock("../services/desktopBackendClient", () => ({
  desktopBackendClient: {
    isEnabled: mockIsEnabled,
    checkHealth: mockCheckHealth,
    fetchFeed: mockFetchFeed,
    setRuntimeState: mockSetRuntimeState,
  },
}));

vi.mock("../services/rssParser", () => ({
  parseRssUrlDetailed: mockParseRssUrlDetailed,
}));

vi.mock("../services/proxyManager", () => ({
  ProxyManager: {
    getPreferLocalProxy: mockGetPreferLocalProxy,
    shouldUseClientProxyFallback: mockShouldUseClientProxyFallback,
    getRoutingMode: mockGetRoutingMode,
  },
  proxyManager: {
    getClientProxyOrder: mockGetClientProxyOrder,
  },
}));

vi.mock("../services/feedDiscoveryService", () => ({
  feedDiscoveryService: {
    discoverFromWebsite: mockDiscoverFromWebsite,
  },
}));

import {
  loadFeedWithRuntime,
  loadFeedWithRuntimeAndDiscovery,
} from "../services/feedRuntime";

describe("feedRuntime", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsEnabled.mockReturnValue(true);
    mockGetPreferLocalProxy.mockReturnValue(true);
    mockShouldUseClientProxyFallback.mockReturnValue(false);
    mockGetRoutingMode.mockReturnValue("full-local");
    mockGetClientProxyOrder.mockReturnValue([
      "CorsProxy.io",
      "RSS2JSON",
      "CodeTabs",
      "AllOrigins",
    ]);
    mockDiscoverFromWebsite.mockResolvedValue({
      originalUrl: "https://example.com",
      discoveredFeeds: [],
      discoveryMethods: [],
      totalAttempts: 0,
      successfulAttempts: 0,
      discoveryTime: 0,
      suggestions: [],
    });
  });

  it("uses the desktop backend first when the backend is healthy", async () => {
    mockDetectEnvironment.mockReturnValue({
      isDevelopment: false,
      isProduction: true,
      isGitHubPages: false,
      isLocalhost: false,
      isTauri: true,
      proxyUrl: null,
      useProductionParser: false,
      corsMode: "public-apis",
    });
    mockCheckHealth.mockResolvedValue({
      available: true,
      checkedAt: Date.now(),
    });
    mockFetchFeed.mockResolvedValue({
      title: "Backend Feed",
      articles: [
        {
          title: "Article One",
          link: "https://example.com/article-one",
          pubDate: "2026-03-27T12:00:00.000Z",
          sourceTitle: "Backend Feed",
        },
      ],
      meta: {
        source: "backend",
        cached: false,
        fetchedAt: "2026-03-27T12:00:00.000Z",
        latencyMs: 42,
      },
    });

    const result = await loadFeedWithRuntime("https://example.com/rss.xml");

    expect(mockFetchFeed).toHaveBeenCalledWith("https://example.com/rss.xml", {
      forceRefresh: false,
      signal: undefined,
    });
    expect(mockParseRssUrlDetailed).not.toHaveBeenCalled();
    expect(result.source).toBe("backend");
    expect(result.route.routeKind).toBe("local-backend");
    expect(result.warning).toBeUndefined();
  });

  it("does not fall back to cloud proxies in desktop local mode when the backend is unavailable", async () => {
    mockDetectEnvironment.mockReturnValue({
      isDevelopment: false,
      isProduction: true,
      isGitHubPages: false,
      isLocalhost: false,
      isTauri: true,
      proxyUrl: null,
      useProductionParser: false,
      corsMode: "public-apis",
    });
    mockCheckHealth.mockResolvedValue({
      available: false,
      checkedAt: Date.now(),
      error: "connect ECONNREFUSED 127.0.0.1:3001",
    });

    await expect(
      loadFeedWithRuntime("https://example.com/rss.xml"),
    ).rejects.toThrow("Backend local indisponível");

    expect(mockParseRssUrlDetailed).not.toHaveBeenCalled();
    expect(mockSetRuntimeState).toHaveBeenCalledWith(
      expect.objectContaining({
        activeMode: "desktop-local",
        lastRoute: "LocalBackend",
        backendAvailable: false,
        lastError: "connect ECONNREFUSED 127.0.0.1:3001",
      }),
    );
  });

  it("uses client proxies in full external proxy mode", async () => {
    mockGetPreferLocalProxy.mockReturnValue(false);
    mockShouldUseClientProxyFallback.mockReturnValue(true);
    mockGetRoutingMode.mockReturnValue("full-external-proxies");
    mockDetectEnvironment.mockReturnValue({
      isDevelopment: false,
      isProduction: true,
      isGitHubPages: false,
      isLocalhost: false,
      isTauri: true,
      proxyUrl: null,
      useProductionParser: false,
      corsMode: "public-apis",
    });
    mockParseRssUrlDetailed.mockResolvedValue({
      title: "Fallback Feed",
      articles: [],
      route: {
        transport: "client",
        routeKind: "proxy",
        routeName: "CodeTabs",
        viaFallback: false,
        checkedAt: Date.now(),
      },
      cached: false,
      attempts: [],
    });

    const result = await loadFeedWithRuntime("https://example.com/rss.xml");

    expect(mockCheckHealth).not.toHaveBeenCalled();
    expect(mockParseRssUrlDetailed).toHaveBeenCalledWith(
      "https://example.com/rss.xml",
      expect.objectContaining({
        forceClientFallback: true,
        externalOnly: true,
        routeMode: "full-external-proxies",
      }),
    );
    expect(result.source).toBe("client");
    expect(result.route.routeName).toBe("CodeTabs");
    expect(result.route.viaFallback).toBe(false);
  });

  it("falls back to cloud proxies in mixed mode when the backend is unavailable", async () => {
    mockGetRoutingMode.mockReturnValue("mixed");
    mockDetectEnvironment.mockReturnValue({
      isDevelopment: false,
      isProduction: true,
      isGitHubPages: false,
      isLocalhost: false,
      isTauri: true,
      proxyUrl: null,
      useProductionParser: false,
      corsMode: "public-apis",
    });
    mockCheckHealth.mockResolvedValue({
      available: false,
      checkedAt: Date.now(),
      error: "connect ECONNREFUSED 127.0.0.1:3001",
    });
    mockParseRssUrlDetailed.mockResolvedValue({
      title: "Fallback Feed",
      articles: [],
      route: {
        transport: "client",
        routeKind: "proxy",
        routeName: "RSS2JSON",
        viaFallback: false,
        checkedAt: Date.now(),
      },
      cached: false,
      attempts: [],
    });

    const result = await loadFeedWithRuntime("https://example.com/rss.xml");

    expect(mockParseRssUrlDetailed).toHaveBeenCalledWith(
      "https://example.com/rss.xml",
      expect.objectContaining({
        forceClientFallback: true,
        externalOnly: true,
        routeMode: "full-external-proxies",
      }),
    );
    expect(result.source).toBe("client-fallback");
    expect(result.route.viaFallback).toBe(true);
    expect(mockSetRuntimeState).toHaveBeenCalledWith(
      expect.objectContaining({
        activeMode: "cloud-fallback",
        proxyRouteMode: "mixed",
        primaryRoute: "LocalBackend",
        fallbackOrder: ["CorsProxy.io", "RSS2JSON", "CodeTabs", "AllOrigins"],
      }),
    );
  });

  it("does not fall back to cloud proxies in desktop local mode when backend fetch loses reachability", async () => {
    mockDetectEnvironment.mockReturnValue({
      isDevelopment: false,
      isProduction: true,
      isGitHubPages: false,
      isLocalhost: false,
      isTauri: true,
      proxyUrl: null,
      useProductionParser: false,
      corsMode: "public-apis",
    });
    mockCheckHealth.mockResolvedValue({
      available: true,
      checkedAt: Date.now(),
    });
    mockFetchFeed.mockRejectedValue(new Error("Failed to fetch"));

    await expect(
      loadFeedWithRuntime("https://example.com/rss.xml"),
    ).rejects.toThrow("Backend local indisponível");

    expect(mockParseRssUrlDetailed).not.toHaveBeenCalled();
  });

  it("does not fall back to cloud proxies when the healthy backend reports a feed error", async () => {
    mockDetectEnvironment.mockReturnValue({
      isDevelopment: true,
      isProduction: false,
      isGitHubPages: false,
      isLocalhost: true,
      isTauri: false,
      proxyUrl: null,
      useProductionParser: false,
      corsMode: "mixed",
    });
    mockCheckHealth.mockResolvedValue({
      available: true,
      checkedAt: Date.now(),
    });
    const backendFeedError = new Error("Feed nao encontrado") as Error & {
      statusCode: number;
    };
    backendFeedError.statusCode = 404;
    mockFetchFeed.mockRejectedValue(backendFeedError);

    await expect(
      loadFeedWithRuntime("https://example.com/missing.xml"),
    ).rejects.toThrow("Feed nao encontrado");

    expect(mockParseRssUrlDetailed).not.toHaveBeenCalled();
    expect(mockSetRuntimeState).toHaveBeenCalledWith(
      expect.objectContaining({
        activeMode: "desktop-local",
        lastRoute: "LocalBackend",
        lastWarning: undefined,
        backendAvailable: true,
        lastError: "Feed nao encontrado",
      }),
    );
  });

  it("uses the local backend in web dev when the backend runtime is enabled", async () => {
    mockDetectEnvironment.mockReturnValue({
      isDevelopment: true,
      isProduction: false,
      isGitHubPages: false,
      isLocalhost: true,
      isTauri: false,
      proxyUrl: null,
      useProductionParser: false,
      corsMode: "mixed",
    });
    mockCheckHealth.mockResolvedValue({
      available: true,
      checkedAt: Date.now(),
    });
    mockFetchFeed.mockResolvedValue({
      title: "Local Backend Feed",
      articles: [],
      meta: {
        source: "backend",
        cached: false,
        fetchedAt: "2026-03-27T12:00:00.000Z",
        latencyMs: 17,
      },
    });

    const result = await loadFeedWithRuntime("https://example.com/rss.xml");

    expect(mockCheckHealth).toHaveBeenCalled();
    expect(mockFetchFeed).toHaveBeenCalled();
    expect(mockParseRssUrlDetailed).not.toHaveBeenCalled();
    expect(result.source).toBe("backend");
    expect(result.route.routeName).toBe("LocalBackend");
  });

  it("does not call the desktop backend when running on the web", async () => {
    mockIsEnabled.mockReturnValue(false);
    mockDetectEnvironment.mockReturnValue({
      isDevelopment: false,
      isProduction: true,
      isGitHubPages: true,
      isLocalhost: false,
      isTauri: false,
      proxyUrl: null,
      useProductionParser: true,
      corsMode: "public-apis",
    });
    mockParseRssUrlDetailed.mockResolvedValue({
      title: "Web Feed",
      articles: [],
      route: {
        transport: "client",
        routeKind: "direct",
        routeName: "DirectFetch",
        viaFallback: false,
        checkedAt: Date.now(),
      },
      cached: true,
      attempts: [],
    });

    const result = await loadFeedWithRuntime("https://example.com/rss.xml");

    expect(mockCheckHealth).not.toHaveBeenCalled();
    expect(mockFetchFeed).not.toHaveBeenCalled();
    expect(result.source).toBe("client");
    expect(result.route.routeKind).toBe("direct");
  });

  it("loads a discovered RSS URL when the saved URL responds like HTML", async () => {
    mockIsEnabled.mockReturnValue(false);
    mockDetectEnvironment.mockReturnValue({
      isDevelopment: false,
      isProduction: true,
      isGitHubPages: true,
      isLocalhost: false,
      isTauri: false,
      proxyUrl: null,
      useProductionParser: true,
      corsMode: "public-apis",
    });
    mockParseRssUrlDetailed
      .mockRejectedValueOnce(new Error("Invalid response format from proxy"))
      .mockResolvedValueOnce({
        title: "Discovered Feed",
        articles: [
          {
            title: "Article from discovered feed",
            link: "https://example.com/article",
            pubDate: new Date("2026-05-22T12:00:00.000Z"),
            sourceTitle: "Discovered Feed",
          },
        ],
        route: {
          transport: "client",
          routeKind: "proxy",
          routeName: "RSS2JSON",
          viaFallback: true,
          checkedAt: Date.now(),
        },
        cached: false,
        attempts: [],
      });
    mockDiscoverFromWebsite.mockResolvedValue({
      originalUrl: "https://example.com",
      discoveredFeeds: [
        {
          url: "https://example.com/feed.xml",
          title: "Discovered Feed",
          type: "rss",
          discoveryMethod: "link-tag",
          confidence: 0.95,
        },
      ],
      discoveryMethods: ["html-parsing"],
      totalAttempts: 1,
      successfulAttempts: 1,
      discoveryTime: 12,
      suggestions: ["Found one RSS feed on this website"],
    });

    const result = await loadFeedWithRuntimeAndDiscovery(
      "https://example.com",
      { discoverHtmlFallback: true },
    );

    expect(mockDiscoverFromWebsite).toHaveBeenCalledWith("https://example.com");
    expect(mockParseRssUrlDetailed).toHaveBeenNthCalledWith(
      1,
      "https://example.com",
      expect.any(Object),
    );
    expect(mockParseRssUrlDetailed).toHaveBeenNthCalledWith(
      2,
      "https://example.com/feed.xml",
      expect.any(Object),
    );
    expect(result.discovery).toMatchObject({
      originalUrl: "https://example.com",
      discoveredUrl: "https://example.com/feed.xml",
      status: "used",
    });
    expect(result.articles).toHaveLength(1);
  });

  it("tries multiple discovered feeds until one loads", async () => {
    mockIsEnabled.mockReturnValue(false);
    mockDetectEnvironment.mockReturnValue({
      isDevelopment: false,
      isProduction: true,
      isGitHubPages: true,
      isLocalhost: false,
      isTauri: false,
      proxyUrl: null,
      useProductionParser: true,
      corsMode: "public-apis",
    });
    mockParseRssUrlDetailed
      .mockRejectedValueOnce(new Error("Unsupported RSS format"))
      .mockRejectedValueOnce(new Error("XML parsing error"))
      .mockResolvedValueOnce({
        title: "Working Atom",
        articles: [
          {
            title: "Atom article",
            link: "https://example.com/atom-article",
            pubDate: new Date("2026-05-22T12:00:00.000Z"),
            sourceTitle: "Working Atom",
          },
        ],
        route: {
          transport: "client",
          routeKind: "direct",
          routeName: "DirectFetch",
          viaFallback: false,
          checkedAt: Date.now(),
        },
        cached: false,
        attempts: [],
      });
    mockDiscoverFromWebsite.mockResolvedValue({
      originalUrl: "https://example.com",
      discoveredFeeds: [
        {
          url: "https://example.com/weak.xml",
          type: "rss",
          discoveryMethod: "content-scan",
          confidence: 0.4,
        },
        {
          url: "https://example.com/atom.xml",
          title: "Working Atom",
          type: "atom",
          discoveryMethod: "link-tag",
          confidence: 0.9,
        },
      ],
      discoveryMethods: ["html-parsing"],
      totalAttempts: 1,
      successfulAttempts: 2,
      discoveryTime: 14,
      suggestions: ["Found 2 RSS feeds on this website"],
    });

    const result = await loadFeedWithRuntimeAndDiscovery(
      "https://example.com",
      { discoverHtmlFallback: true },
    );

    expect(mockParseRssUrlDetailed).toHaveBeenNthCalledWith(
      2,
      "https://example.com/atom.xml",
      expect.any(Object),
    );
    expect(mockParseRssUrlDetailed).toHaveBeenNthCalledWith(
      3,
      "https://example.com/weak.xml",
      expect.any(Object),
    );
    expect(result.discovery?.discoveredUrl).toBe("https://example.com/weak.xml");
    expect(result.title).toBe("Working Atom");
  });

  it("reports a clear discovery failure when HTML has no feed candidates", async () => {
    mockIsEnabled.mockReturnValue(false);
    mockDetectEnvironment.mockReturnValue({
      isDevelopment: false,
      isProduction: true,
      isGitHubPages: true,
      isLocalhost: false,
      isTauri: false,
      proxyUrl: null,
      useProductionParser: true,
      corsMode: "public-apis",
    });
    mockParseRssUrlDetailed.mockRejectedValue(
      new Error("Invalid response format from proxy"),
    );

    await expect(
      loadFeedWithRuntimeAndDiscovery("https://example.com", {
        discoverHtmlFallback: true,
      }),
    ).rejects.toThrow("nenhum feed RSS/Atom");
  });

  it("does not attempt discovery for normal RSS loads, including feeds served as text/html", async () => {
    mockIsEnabled.mockReturnValue(false);
    mockDetectEnvironment.mockReturnValue({
      isDevelopment: false,
      isProduction: true,
      isGitHubPages: true,
      isLocalhost: false,
      isTauri: false,
      proxyUrl: null,
      useProductionParser: true,
      corsMode: "public-apis",
    });
    mockParseRssUrlDetailed.mockResolvedValue({
      title: "Valid Feed",
      articles: [],
      route: {
        transport: "client",
        routeKind: "direct",
        routeName: "DirectFetch",
        viaFallback: false,
        checkedAt: Date.now(),
      },
      cached: false,
      attempts: [],
    });

    await loadFeedWithRuntimeAndDiscovery("https://example.com/feed.xml", {
      discoverHtmlFallback: true,
    });

    expect(mockDiscoverFromWebsite).not.toHaveBeenCalled();
  });

  it("keeps non-discovery network failures on the original error path", async () => {
    mockIsEnabled.mockReturnValue(false);
    mockDetectEnvironment.mockReturnValue({
      isDevelopment: false,
      isProduction: true,
      isGitHubPages: true,
      isLocalhost: false,
      isTauri: false,
      proxyUrl: null,
      useProductionParser: true,
      corsMode: "public-apis",
    });
    mockParseRssUrlDetailed.mockRejectedValue(new Error("404 not found"));

    await expect(
      loadFeedWithRuntimeAndDiscovery("https://example.com/missing.xml", {
        discoverHtmlFallback: true,
      }),
    ).rejects.toThrow("404 not found");
    expect(mockDiscoverFromWebsite).not.toHaveBeenCalled();
  });
});
