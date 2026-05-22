import { describe, expect, it } from "vitest";
import {
  CACHE_POLICY_V1,
  describeCachePolicyV1,
  HOUR_MS,
  MINUTE_MS,
} from "../services/cachePolicy";
import { ArticleCache } from "../services/articleCache";

describe("cachePolicy v1", () => {
  it("documents the current localStorage cache contract", () => {
    expect(CACHE_POLICY_V1).toMatchObject({
      version: 1,
      storage: "localStorage",
      keys: {
        smartFeedCache: "smart-feed-cache-v2",
        articleContentPrefix: "article_cache_v2_",
      },
      feeds: {
        freshTtlMs: 10 * MINUTE_MS,
        staleWhileRevalidateMs: 2 * HOUR_MS,
        maxEntries: 100,
        scopedFreshTtlMinutes: 10,
      },
      articles: {
        maxSize: 500,
        maxAgeMs: 24 * HOUR_MS,
        memoryLimitMb: 50,
        autoCleanupIntervalMs: 5 * MINUTE_MS,
      },
    });
  });

  it("keeps ArticleCache defaults aligned with the shared policy", () => {
    const cache = new ArticleCache({ autoCleanupInterval: 0 });

    expect(cache.getStats().maxSize).toBe(CACHE_POLICY_V1.articles.maxSize);
  });

  it("exposes a serializable summary for diagnostics", () => {
    expect(describeCachePolicyV1()).toEqual({
      version: 1,
      storage: "localStorage",
      feedFreshMinutes: 10,
      feedStaleHours: 2,
      maxFeedEntries: 100,
      articleMaxAgeHours: 24,
      articleMaxSize: 500,
    });
  });
});
