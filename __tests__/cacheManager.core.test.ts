import { beforeEach, describe, expect, it, vi } from "vitest";
import { CACHE_POLICY_V1 } from "../services/cachePolicy";
import {
  clearManagedCache,
  getCacheStatsSnapshot,
  getEffectiveCachePolicy,
  getFeedValidators,
  PERMANENT_CACHE_CLEANUP_PRESERVED_KEYS,
  saveCachePolicy,
} from "../services/cacheManager";
import { articleCache } from "../services/articleCache";
import { smartCache } from "../services/smartCache";
import type { Article } from "../types";

const { mockDesktopBackendClient } = vi.hoisted(() => ({
  mockDesktopBackendClient: {
    isEnabled: vi.fn(() => false),
    getCacheStats: vi.fn(),
    clearCache: vi.fn(),
  },
}));

vi.mock("../services/desktopBackendClient", () => ({
  desktopBackendClient: mockDesktopBackendClient,
}));

const article: Article = {
  title: "Cached article",
  link: "https://example.com/article",
  pubDate: new Date("2026-05-24T12:00:00.000Z"),
  sourceTitle: "Example",
  description: "Cached description",
};

describe("cacheManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    articleCache.clear();
    smartCache.clear({ removeStorage: true });
    mockDesktopBackendClient.isEnabled.mockReturnValue(false);
  });

  it("saves and applies normalized cache policy overrides", () => {
    const saved = saveCachePolicy({
      feedFreshTtlMinutes: 30,
      staleWhileRevalidateMinutes: 90,
      maxFeedEntries: 250,
    });

    expect(saved).toMatchObject({
      feedFreshTtlMinutes: 30,
      staleWhileRevalidateMinutes: 90,
      maxFeedEntries: 250,
    });
    expect(getEffectiveCachePolicy()).toMatchObject(saved);
  });

  it("only exposes HTTP validators when the effective policy allows it", () => {
    const headers = new Headers({
      etag: '"feed-v1"',
      "last-modified": "Sun, 24 May 2026 12:00:00 GMT",
    });
    smartCache.set("https://example.com/rss.xml", [article], "Example", headers);

    expect(getFeedValidators("https://example.com/rss.xml")).toEqual({
      etag: '"feed-v1"',
      lastModified: "Sun, 24 May 2026 12:00:00 GMT",
    });

    saveCachePolicy({ respectHttpValidators: false });

    expect(getFeedValidators("https://example.com/rss.xml")).toEqual({});
  });

  it("reports real localStorage and in-memory cache statistics", async () => {
    smartCache.set("https://example.com/rss.xml", [article], "Example");
    articleCache.set(article);
    window.localStorage.setItem(
      `${CACHE_POLICY_V1.keys.articleContentPrefix}https://example.com/article`,
      JSON.stringify({ article }),
    );

    const snapshot = await getCacheStatsSnapshot();

    expect(snapshot.storageKind).toBe("localStorage");
    expect(snapshot.totalFeeds).toBe(1);
    expect(snapshot.totalArticles).toBeGreaterThanOrEqual(2);
    expect(snapshot.articleContentEntries).toBe(1);
    expect(snapshot.estimatedSizeBytes).toBeGreaterThan(0);
  });

  it("includes backend cache entries and payload size in the snapshot", async () => {
    mockDesktopBackendClient.isEnabled.mockReturnValue(true);
    mockDesktopBackendClient.getCacheStats.mockResolvedValue({
      entries: 50,
      expired: 2,
      avgPayloadBytes: 2048,
      totalHits: 12,
      oldestFetchedAt: "2026-05-24T10:00:00.000Z",
      newestFetchedAt: "2026-05-24T12:00:00.000Z",
    });

    const snapshot = await getCacheStatsSnapshot();

    expect(snapshot.storageKind).toBe("backend");
    expect(snapshot.backendEntries).toBe(50);
    expect(snapshot.totalFeeds).toBe(50);
    expect(snapshot.estimatedSizeBytes).toBe(50 * 2048);
    expect(snapshot.oldestEntryTimestamp).toBe(
      Date.parse("2026-05-24T10:00:00.000Z"),
    );
    expect(snapshot.newestEntryTimestamp).toBe(
      Date.parse("2026-05-24T12:00:00.000Z"),
    );
  });

  it("clears only managed cache keys and preserves permanent user data", async () => {
    window.localStorage.setItem("rss-feeds", "[{\"url\":\"feed\"}]");
    window.localStorage.setItem("feed-categories", "[{\"id\":\"tech\"}]");
    window.localStorage.setItem("favorites-data", "[]");
    window.localStorage.setItem("disabled_proxies", "[\"proxy\"]");
    window.localStorage.setItem(CACHE_POLICY_V1.keys.smartFeedCache, "{}");
    window.localStorage.setItem(
      `${CACHE_POLICY_V1.keys.articleContentPrefix}abc`,
      "{\"cached\":true}",
    );
    articleCache.set(article);
    smartCache.set("https://example.com/rss.xml", [article], "Example");

    const result = await clearManagedCache();

    expect(window.localStorage.getItem(CACHE_POLICY_V1.keys.smartFeedCache)).toBe(
      null,
    );
    expect(
      window.localStorage.getItem(`${CACHE_POLICY_V1.keys.articleContentPrefix}abc`),
    ).toBe(null);
    expect(window.localStorage.getItem("rss-feeds")).toBe("[{\"url\":\"feed\"}]");
    expect(window.localStorage.getItem("feed-categories")).toBe(
      "[{\"id\":\"tech\"}]",
    );
    expect(window.localStorage.getItem("favorites-data")).toBe("[]");
    expect(window.localStorage.getItem("disabled_proxies")).toBe("[\"proxy\"]");
    expect(window.localStorage.getItem(CACHE_POLICY_V1.keys.lastClearedAt)).toBe(
      String(result.clearedAt),
    );
    expect(result.articlesCacheRemoved).toBeGreaterThanOrEqual(2);
    expect(result.permanentDataPreserved).toEqual(
      PERMANENT_CACHE_CLEANUP_PRESERVED_KEYS,
    );
  });
});
