export const MINUTE_MS = 60 * 1000;
export const HOUR_MS = 60 * MINUTE_MS;

export const CACHE_POLICY_V1 = {
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
    scopedFreshTtlMinutes: 10 as 0 | 5 | 10,
  },
  articles: {
    maxSize: 500,
    maxAgeMs: 24 * HOUR_MS,
    memoryLimitMb: 50,
    autoCleanupIntervalMs: 5 * MINUTE_MS,
  },
} as const;

export type CachePolicyV1 = typeof CACHE_POLICY_V1;

export const getCachePolicyV1 = (): CachePolicyV1 => CACHE_POLICY_V1;

export const describeCachePolicyV1 = () => ({
  version: CACHE_POLICY_V1.version,
  storage: CACHE_POLICY_V1.storage,
  feedFreshMinutes: CACHE_POLICY_V1.feeds.freshTtlMs / MINUTE_MS,
  feedStaleHours: CACHE_POLICY_V1.feeds.staleWhileRevalidateMs / HOUR_MS,
  maxFeedEntries: CACHE_POLICY_V1.feeds.maxEntries,
  articleMaxAgeHours: CACHE_POLICY_V1.articles.maxAgeMs / HOUR_MS,
  articleMaxSize: CACHE_POLICY_V1.articles.maxSize,
});
