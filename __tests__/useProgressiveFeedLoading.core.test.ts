import { describe, expect, it } from "vitest";
import {
  buildFeedLoadScopeKey,
  resolveFeedLoadScope,
  resolveFeedVisibilityState,
} from "../services/feedLoadingStrategy";
import type { FeedSource } from "../types";

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
];

describe("feedLoadingStrategy", () => {
  describe("resolveFeedLoadScope", () => {
    it("returns every feed for all mode", () => {
      expect(resolveFeedLoadScope(feeds, { mode: "all" })).toHaveLength(3);
    });

    it("filters feeds by category mode", () => {
      expect(
        resolveFeedLoadScope(feeds, {
          categoryId: "design",
          mode: "category",
        }),
      ).toEqual([feeds[1]]);
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

    it("holds the previous content when switching scopes without target cache", () => {
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
        isHoldingPreviousContent: true,
        shouldKeepVisibleContent: true,
        preserveVisibleArticlesOnFailure: false,
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
