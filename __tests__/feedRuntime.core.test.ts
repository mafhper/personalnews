import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockDetectEnvironment,
  mockIsEnabled,
  mockCheckHealth,
  mockFetchFeed,
  mockSetRuntimeState,
  mockParseRssUrlDetailed,
  mockGetPreferLocalProxy,
} = vi.hoisted(() => ({
  mockDetectEnvironment: vi.fn(),
  mockIsEnabled: vi.fn(),
  mockCheckHealth: vi.fn(),
  mockFetchFeed: vi.fn(),
  mockSetRuntimeState: vi.fn(),
  mockParseRssUrlDetailed: vi.fn(),
  mockGetPreferLocalProxy: vi.fn(),
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
  },
}));

import { loadFeedWithRuntime } from "../services/feedRuntime";

describe("feedRuntime", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsEnabled.mockReturnValue(true);
    mockGetPreferLocalProxy.mockReturnValue(true);
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

  it("falls back to client proxies and exposes a warning when the backend is unavailable", async () => {
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
        routeName: "CodeTabs",
        viaFallback: false,
        checkedAt: Date.now(),
      },
      cached: false,
      attempts: [],
    });

    const result = await loadFeedWithRuntime("https://example.com/rss.xml");

    expect(mockParseRssUrlDetailed).toHaveBeenCalled();
    expect(result.source).toBe("client-fallback");
    expect(result.route.routeName).toBe("CodeTabs");
    expect(result.route.viaFallback).toBe(true);
    expect(result.warning?.cause).toBe("backend_unavailable");
    expect(result.warning?.action).toContain("backend local");
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
});
