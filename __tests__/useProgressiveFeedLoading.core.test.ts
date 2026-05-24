import { beforeEach, describe, expect, it, vi } from "vitest";
import { resolveFeedTimeoutMs } from "../hooks/useProgressiveFeedLoading";
import {
  buildFeedLoadScopeKey,
  resolveFeedLoadScope,
  resolveFeedVisibilityState,
} from "../services/feedLoadingStrategy";
import type { FeedSource } from "../types";

const {
  mockGetPreferLocalProxy,
  mockShouldUseClientProxyFallback,
} = vi.hoisted(() => ({
  mockGetPreferLocalProxy: vi.fn(),
  mockShouldUseClientProxyFallback: vi.fn(),
}));

vi.mock("../services/proxyManager", () => ({
  ProxyManager: {
    getPreferLocalProxy: mockGetPreferLocalProxy,
    shouldUseClientProxyFallback: mockShouldUseClientProxyFallback,
  },
}));

const feeds: FeedSource[] = [
  {
    url: "https://example.com/tech.xml",
    categoryId: "tech",
    customTitle: "Tech",
  },
  {
    url: "https://example.com/design.xml",
    categoryId: "design",
    customTitle: "Design",
  },
  {
    url: "https://example.com/games.xml",
    categoryId: "games",
    customTitle: "Games",
  },
  {
    url: "https://example.com/podcast.xml",
    categoryId: "podcasts",
    customTitle: "Podcast",
    hideFromAll: true,
  },
  {
    url: "https://example.com/quarantined.xml",
    categoryId: "tech",
    customTitle: "Quarantined",
    status: "quarantined",
    quarantine: {
      enteredAt: "2026-05-20T12:00:00.000Z",
      reason: "Falhas recorrentes",
      failureCountAtEntry: 3,
      recoverySuccesses: 0,
    },
  },
];

describe("feedLoadingStrategy", () => {
  beforeEach(() => {
    mockGetPreferLocalProxy.mockReturnValue(false);
    mockShouldUseClientProxyFallback.mockReturnValue(true);
  });

  describe("resolveFeedTimeoutMs", () => {
    it("keeps the short client timeout outside desktop local-only mode", () => {
      expect(resolveFeedTimeoutMs()).toBe(4000);
    });

    it("uses a longer timeout when desktop local backend is the only route", () => {
      mockGetPreferLocalProxy.mockReturnValue(true);
      mockShouldUseClientProxyFallback.mockReturnValue(false);

      expect(resolveFeedTimeoutMs()).toBe(30000);
    });
  });

  describe("resolveFeedLoadScope", () => {
    it("returns every All-visible feed for all mode", () => {
      expect(resolveFeedLoadScope(feeds, { mode: "all" })).toHaveLength(3);
      expect(resolveFeedLoadScope(feeds, { mode: "all" }).map((feed) => feed.url))
        .not.toContain("https://example.com/podcast.xml");
    });

    it("keeps quarantined feeds out of load scopes", () => {
      expect(resolveFeedLoadScope(feeds, { mode: "all" }).map((feed) => feed.url))
        .not.toContain("https://example.com/quarantined.xml");
      expect(
        resolveFeedLoadScope(feeds, {
          categoryId: "tech",
          mode: "category",
        }).map((feed) => feed.url),
      ).toEqual(["https://example.com/tech.xml"]);
    });

    it("filters feeds by category mode", () => {
      expect(
        resolveFeedLoadScope(feeds, {
          categoryId: "design",
          mode: "category",
        }),
      ).toEqual([feeds[1]]);
    });

    it("keeps feeds hidden from All available in their own category", () => {
      expect(
        resolveFeedLoadScope(feeds, {
          categoryId: "podcasts",
          mode: "category",
        }),
      ).toEqual([feeds[3]]);
    });

    it("loads only the selected feed in single-feed mode", () => {
      expect(
        resolveFeedLoadScope(feeds, {
          categoryId: "tech",
          feedUrl: "https://example.com/tech.xml",
          mode: "single-feed",
        }),
      ).toEqual([feeds[0]]);
    });
  });

  describe("buildFeedLoadScopeKey", () => {
    it("builds stable keys for every scope mode", () => {
      expect(buildFeedLoadScopeKey({ mode: "all" })).toBe("all");
      expect(
        buildFeedLoadScopeKey({ categoryId: "tech", mode: "category" }),
      ).toBe("category:tech");
      expect(
        buildFeedLoadScopeKey({
          feedUrl: "https://example.com/tech.xml",
          mode: "single-feed",
        }),
      ).toBe("single-feed:https://example.com/tech.xml");
    });
  });

  describe("resolveFeedVisibilityState", () => {
    it("treats scoped stale cache as immediately displayable and forces network revalidation", () => {
      expect(
        resolveFeedVisibilityState({
          forceRefresh: false,
          cachedArticlesCount: 4,
          previousArticlesCount: 0,
          previousScopeKey: "all",
          scopeKey: "category:tech",
        }),
      ).toMatchObject({
        hasScopedCache: true,
        isHoldingPreviousContent: false,
        shouldKeepVisibleContent: true,
        shouldBypassCache: true,
      });
    });

    it("clears visible content when switching scopes without target cache", () => {
      expect(
        resolveFeedVisibilityState({
          forceRefresh: false,
          cachedArticlesCount: 0,
          previousArticlesCount: 8,
          previousScopeKey: "category:tech",
          scopeKey: "category:design",
        }),
      ).toMatchObject({
        hasScopedCache: false,
        isDifferentScope: true,
        isHoldingPreviousContent: false,
        shouldKeepVisibleContent: false,
        preserveVisibleArticlesOnFailure: false,
        shouldBypassCache: false,
      });
    });

    it("keeps same-scope content visible while refreshing without scoped cache", () => {
      expect(
        resolveFeedVisibilityState({
          forceRefresh: true,
          cachedArticlesCount: 0,
          previousArticlesCount: 8,
          previousScopeKey: "category:tech",
          scopeKey: "category:tech",
        }),
      ).toMatchObject({
        hasScopedCache: false,
        isDifferentScope: false,
        isHoldingPreviousContent: true,
        shouldKeepVisibleContent: true,
        preserveVisibleArticlesOnFailure: true,
        shouldBypassCache: true,
      });
    });

    it("forces network revalidation on manual refresh without relying on cache", () => {
      expect(
        resolveFeedVisibilityState({
          forceRefresh: true,
          cachedArticlesCount: 3,
          previousArticlesCount: 3,
          previousScopeKey: "category:tech",
          scopeKey: "category:tech",
        }),
      ).toMatchObject({
        hasScopedCache: true,
        isHoldingPreviousContent: false,
        shouldKeepVisibleContent: true,
        preserveVisibleArticlesOnFailure: true,
        shouldBypassCache: true,
      });
    });
  });
});
