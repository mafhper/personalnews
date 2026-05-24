import { articleCache } from "./articleCache";
import {
  CACHE_POLICY_V1,
  DEFAULT_CACHE_POLICY_SETTINGS_V1,
  type CachePolicyOverridesV1,
  type CachePolicySettingsV1,
  readCachePolicySettingsV1,
  writeCachePolicySettingsV1,
} from "./cachePolicy";
import { desktopBackendClient } from "./desktopBackendClient";
import {
  clearIndexedDbCacheRecords,
  estimateIndexedDbCacheSize,
  isIndexedDbCacheAvailable,
  listIndexedDbCacheRecords,
  migrateSmartFeedCacheToIndexedDb,
  type IndexedDbMigrationResult,
} from "./indexedDbCache";
import {
  getCacheStats,
  getCacheValidators,
  smartCache,
} from "./smartCache";

export type CacheStorageKind =
  | "localStorage"
  | "indexedDB"
  | "mixed"
  | "backend"
  | "fallback";

export interface CacheStatsSnapshot {
  policy: CachePolicySettingsV1;
  totalFeeds: number;
  totalArticles: number;
  estimatedSizeBytes: number;
  oldestEntryTimestamp: number | null;
  newestEntryTimestamp: number | null;
  hitCount: number;
  missCount: number;
  staleServedCount: number;
  revalidatedCount: number;
  notModifiedCount: number;
  storageKind: CacheStorageKind;
  lastClearedAt: number | null;
  articleContentEntries: number;
  backendEntries: number;
  indexedDbEntries: number;
  partialErrors: string[];
}

export interface CacheCleanupResult {
  feedsCacheRemoved: number;
  articlesCacheRemoved: number;
  indexedDbEntriesRemoved: number;
  backendEntriesRemoved: number;
  bytesEstimatedFreed: number;
  partialErrors: string[];
  permanentDataPreserved: string[];
  clearedAt: number;
}

export interface CacheMigrationStatus {
  phase: "not-started" | "in-progress" | "completed" | "failed" | "unavailable";
  migratedEntries: number;
  totalEntries: number;
  lastError?: string;
}

export interface FeedValidators {
  etag?: string;
  lastModified?: string;
}

export const PERMANENT_CACHE_CLEANUP_PRESERVED_KEYS = [
  "rss-feeds",
  "feed-sources",
  "feed-categories",
  "favorites-data",
  "article-read-status",
  "appearance-header",
  "appearance-content",
  "appearance-background",
  "appearance-active-layout",
  "appearance-overrides",
  "article-layout-settings",
  "theme-settings",
  "extended-theme-settings",
  "extended-theme-current",
  "extended-theme-custom",
  "personalnews-primary-view",
  "personalnews_weather_city",
  "searchHistory",
  "disabled_proxies",
  "proxy_route_mode_v1",
  "proxy_route_order_v1",
  "preferred_proxy_by_host",
  "rss2json_api_key",
  "rss2json_api_key_origin",
  "corsproxy_cio_api_key",
  "corsproxy_cio_api_key_origin",
  CACHE_POLICY_V1.keys.policySettings,
];

const getStorage = (): Storage | null =>
  typeof window === "undefined" ? null : window.localStorage;

const estimateStringBytes = (value: string): number => value.length * 2;

const parseSmartFeedCacheSummary = (raw: string | null) => {
  if (!raw) {
    return {
      entries: 0,
      articles: 0,
      oldest: null as number | null,
      newest: null as number | null,
    };
  }

  try {
    const parsed = JSON.parse(raw);
    const entries = Array.isArray(parsed.entries) ? parsed.entries : [];
    const timestamps: number[] = [];
    const articleCount = entries.reduce((total: number, item: unknown) => {
      if (!Array.isArray(item)) return total;
      const entry = item[1] as { timestamp?: unknown; articles?: unknown };
      if (typeof entry?.timestamp === "number") {
        timestamps.push(entry.timestamp);
      }
      return total + (Array.isArray(entry?.articles) ? entry.articles.length : 0);
    }, 0);

    return {
      entries: entries.length,
      articles: articleCount,
      oldest: timestamps.length > 0 ? Math.min(...timestamps) : null,
      newest: timestamps.length > 0 ? Math.max(...timestamps) : null,
    };
  } catch {
    return {
      entries: 0,
      articles: 0,
      oldest: null,
      newest: null,
    };
  }
};

const getArticleCacheLocalStorageKeys = (storage: Storage): string[] => {
  const keys: string[] = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key?.startsWith(CACHE_POLICY_V1.keys.articleContentPrefix)) {
      keys.push(key);
    }
  }
  return keys;
};

const getLastClearedAt = (storage: Storage | null): number | null => {
  if (!storage) return null;
  const raw = storage.getItem(CACHE_POLICY_V1.keys.lastClearedAt);
  const parsed = raw ? Number(raw) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
};

export const getEffectiveCachePolicy = (): CachePolicySettingsV1 =>
  readCachePolicySettingsV1(getStorage() ?? undefined);

export const applyEffectiveCachePolicyToRuntime = (
  policy = getEffectiveCachePolicy(),
): CachePolicySettingsV1 => {
  smartCache.applyPolicy(policy);
  return policy;
};

export const saveCachePolicy = (
  overrides: CachePolicyOverridesV1,
): CachePolicySettingsV1 => {
  const policy = writeCachePolicySettingsV1(overrides, getStorage() ?? undefined);
  applyEffectiveCachePolicyToRuntime(policy);
  return policy;
};

export const resetCachePolicy = (): CachePolicySettingsV1 => {
  const storage = getStorage();
  storage?.removeItem(CACHE_POLICY_V1.keys.policySettings);
  applyEffectiveCachePolicyToRuntime(DEFAULT_CACHE_POLICY_SETTINGS_V1);
  return DEFAULT_CACHE_POLICY_SETTINGS_V1;
};

export const getFeedValidators = (feedUrl: string): FeedValidators => {
  const policy = applyEffectiveCachePolicyToRuntime();
  if (!policy.respectHttpValidators) return {};
  return getCacheValidators(feedUrl);
};

export const recordFeedValidators = (
  feedUrl: string,
  headers?: Headers,
): void => {
  if (!headers) return;
  smartCache.recordRevalidation(feedUrl, headers);
};

export const getCacheStatsSnapshot = async (): Promise<CacheStatsSnapshot> => {
  const partialErrors: string[] = [];
  const policy = applyEffectiveCachePolicyToRuntime();
  const storage = getStorage();
  const smartStats = getCacheStats();
  const rawSmartCache = storage?.getItem(CACHE_POLICY_V1.keys.smartFeedCache) ?? null;
  const persistedSmartSummary = parseSmartFeedCacheSummary(rawSmartCache);
  const articleKeys = storage ? getArticleCacheLocalStorageKeys(storage) : [];
  const articleBytes = storage
    ? articleKeys.reduce(
        (total, key) => total + estimateStringBytes(storage.getItem(key) ?? ""),
        0,
      )
    : 0;
  const smartBytes = rawSmartCache ? estimateStringBytes(rawSmartCache) : 0;

  let indexedDbEntries = 0;
  let indexedDbBytes = 0;
  if (isIndexedDbCacheAvailable()) {
    try {
      const records = await listIndexedDbCacheRecords();
      indexedDbEntries = records.length;
      indexedDbBytes = await estimateIndexedDbCacheSize();
    } catch (error) {
      partialErrors.push(
        error instanceof Error ? error.message : "Falha ao ler IndexedDB",
      );
    }
  }

  let backendEntries = 0;
  let backendBytes = 0;
  let backendOldestEntry: number | null = null;
  let backendNewestEntry: number | null = null;
  if (desktopBackendClient.isEnabled()) {
    try {
      const backendStats = await desktopBackendClient.getCacheStats();
      backendEntries = backendStats.entries;
      backendBytes = Math.round(backendStats.entries * backendStats.avgPayloadBytes);
      backendOldestEntry = backendStats.oldestFetchedAt
        ? Date.parse(backendStats.oldestFetchedAt)
        : null;
      backendNewestEntry = backendStats.newestFetchedAt
        ? Date.parse(backendStats.newestFetchedAt)
        : null;
    } catch (error) {
      partialErrors.push(
        error instanceof Error ? error.message : "Falha ao ler cache do backend",
      );
    }
  }

  const hasLocalStorageCache =
    smartStats.totalEntries > 0 || articleKeys.length > 0 || Boolean(rawSmartCache);
  const storageKind: CacheStorageKind =
    backendEntries > 0
      ? indexedDbEntries > 0 || hasLocalStorageCache
        ? "mixed"
        : "backend"
      : indexedDbEntries > 0 && hasLocalStorageCache
        ? "mixed"
        : indexedDbEntries > 0
          ? "indexedDB"
          : hasLocalStorageCache
            ? "localStorage"
            : "fallback";

  const oldestEntries = [
    smartStats.oldestEntry || null,
    persistedSmartSummary.oldest,
    Number.isFinite(backendOldestEntry) ? backendOldestEntry : null,
  ].filter((value): value is number => typeof value === "number" && value > 0);
  const newestEntries = [
    smartStats.newestEntry || null,
    persistedSmartSummary.newest,
    Number.isFinite(backendNewestEntry) ? backendNewestEntry : null,
  ].filter((value): value is number => typeof value === "number" && value > 0);

  return {
    policy,
    totalFeeds: Math.max(
      smartStats.totalEntries,
      persistedSmartSummary.entries,
      indexedDbEntries,
      backendEntries,
    ),
    totalArticles:
      Math.max(smartStats.totalArticles, persistedSmartSummary.articles) +
      articleCache.size(),
    estimatedSizeBytes:
      smartStats.cacheSize +
      smartBytes +
      articleBytes +
      indexedDbBytes +
      backendBytes,
    oldestEntryTimestamp:
      oldestEntries.length > 0 ? Math.min(...oldestEntries) : null,
    newestEntryTimestamp:
      newestEntries.length > 0 ? Math.max(...newestEntries) : null,
    hitCount: smartStats.hits,
    missCount: smartStats.misses,
    staleServedCount: smartStats.staleHits,
    revalidatedCount: smartStats.revalidations,
    notModifiedCount: smartStats.notModified,
    storageKind,
    lastClearedAt: getLastClearedAt(storage),
    articleContentEntries: articleKeys.length,
    backendEntries,
    indexedDbEntries,
    partialErrors,
  };
};

export const clearManagedCache = async (): Promise<CacheCleanupResult> => {
  const before = await getCacheStatsSnapshot();
  const partialErrors: string[] = [];
  const storage = getStorage();
  const articleKeys = storage ? getArticleCacheLocalStorageKeys(storage) : [];
  const memoryArticleEntries = articleCache.size();
  const rawSmartCache = storage?.getItem(CACHE_POLICY_V1.keys.smartFeedCache);
  const smartSummary = parseSmartFeedCacheSummary(rawSmartCache ?? null);

  try {
    smartCache.clear({ removeStorage: true });
  } catch (error) {
    partialErrors.push(
      error instanceof Error ? error.message : "Falha ao limpar smart cache",
    );
  }

  try {
    articleCache.clear();
  } catch (error) {
    partialErrors.push(
      error instanceof Error ? error.message : "Falha ao limpar cache de artigos",
    );
  }

  if (storage) {
    for (const key of articleKeys) {
      storage.removeItem(key);
    }
  }

  let indexedDbEntriesRemoved = 0;
  if (isIndexedDbCacheAvailable()) {
    try {
      indexedDbEntriesRemoved = await clearIndexedDbCacheRecords();
    } catch (error) {
      partialErrors.push(
        error instanceof Error ? error.message : "Falha ao limpar IndexedDB",
      );
    }
  }

  let backendEntriesRemoved = 0;
  if (desktopBackendClient.isEnabled()) {
    try {
      backendEntriesRemoved = await desktopBackendClient.clearCache();
    } catch (error) {
      partialErrors.push(
        error instanceof Error ? error.message : "Falha ao limpar cache do backend",
      );
    }
  }

  const clearedAt = Date.now();
  storage?.setItem(CACHE_POLICY_V1.keys.lastClearedAt, String(clearedAt));

  return {
    feedsCacheRemoved: Math.max(before.totalFeeds, smartSummary.entries),
    articlesCacheRemoved: articleKeys.length + memoryArticleEntries,
    indexedDbEntriesRemoved,
    backendEntriesRemoved,
    bytesEstimatedFreed: before.estimatedSizeBytes,
    partialErrors,
    permanentDataPreserved: PERMANENT_CACHE_CLEANUP_PRESERVED_KEYS,
    clearedAt,
  };
};

export const getCacheMigrationStatus =
  async (): Promise<CacheMigrationStatus> => {
    if (!isIndexedDbCacheAvailable()) {
      return {
        phase: "unavailable",
        migratedEntries: 0,
        totalEntries: 0,
      };
    }

    try {
      const records = await listIndexedDbCacheRecords();
      return {
        phase: records.length > 0 ? "completed" : "not-started",
        migratedEntries: records.length,
        totalEntries: records.length,
      };
    } catch (error) {
      return {
        phase: "failed",
        migratedEntries: 0,
        totalEntries: 0,
        lastError:
          error instanceof Error ? error.message : "Falha ao ler migração",
      };
    }
  };

export const migrateManagedCacheToIndexedDb = async (
  options: { removeLegacy?: boolean } = {},
): Promise<IndexedDbMigrationResult> => {
  return migrateSmartFeedCacheToIndexedDb(options);
};
