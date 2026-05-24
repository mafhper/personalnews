import { describe, expect, it } from "vitest";
import {
  CACHE_POLICY_V1,
  DEFAULT_CACHE_POLICY_SETTINGS_V1,
  describeCachePolicyV1,
  HOUR_MS,
  MINUTE_MS,
  normalizeCachePolicySettingsV1,
  readCachePolicySettingsV1,
  writeCachePolicySettingsV1,
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

  it("normalizes editable policy settings into the supported operating range", () => {
    expect(
      normalizeCachePolicySettingsV1({
        version: 99,
        feedFreshTtlMinutes: -10,
        staleWhileRevalidateMinutes: 2000,
        respectHttpValidators: "yes",
        offlineFallback: false,
        maxStorageMb: 1,
        maxFeedEntries: 9999,
        articleMaxAgeHours: 0,
        articleMaxEntries: 20,
      }),
    ).toEqual({
      ...DEFAULT_CACHE_POLICY_SETTINGS_V1,
      feedFreshTtlMinutes: 1,
      staleWhileRevalidateMinutes: 1440,
      offlineFallback: false,
      maxStorageMb: 10,
      maxFeedEntries: 1000,
      articleMaxAgeHours: 1,
      articleMaxEntries: 50,
    });
  });

  it("persists normalized overrides without losing existing settings", () => {
    window.localStorage.clear();

    const first = writeCachePolicySettingsV1({
      feedFreshTtlMinutes: 45,
      respectHttpValidators: false,
    });
    const second = writeCachePolicySettingsV1({
      maxFeedEntries: 250,
    });

    expect(first.feedFreshTtlMinutes).toBe(45);
    expect(readCachePolicySettingsV1()).toMatchObject({
      feedFreshTtlMinutes: 45,
      maxFeedEntries: 250,
      respectHttpValidators: false,
    });
    expect(second).toMatchObject({
      feedFreshTtlMinutes: 45,
      maxFeedEntries: 250,
      respectHttpValidators: false,
    });
  });

  it("falls back to defaults when persisted policy JSON is invalid", () => {
    window.localStorage.setItem(CACHE_POLICY_V1.keys.policySettings, "{");

    expect(readCachePolicySettingsV1()).toEqual(
      DEFAULT_CACHE_POLICY_SETTINGS_V1,
    );
  });
});
