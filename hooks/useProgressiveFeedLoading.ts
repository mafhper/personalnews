/**
 * useProgressiveFeedLoading.ts
 *
 * Custom hook for progressive RSS feed loading with enhanced performance features:
 * - Immediate cache display with background refresh
 * - Individual feed timeout and error handling
 * - Loading state management with progress tracking
 * - Stale-while-revalidate strategy
 *
 * @author Matheus Pereira
 * @version 1.0.0
 */

import { useState, useCallback, useRef, useEffect } from "react";
import type { Article, FeedLoadRequest, FeedSource } from "../types";
import { getCachedArticles } from "../services/smartCache";
import { useLogger } from "../services/logger";
import { categorizeFeedError } from "../services/feedErrorCategorization";
import { loadFeedWithRuntime } from "../services/feedRuntime";
import { ProxyManager } from "../services/proxyManager";
import type {
  FeedDiagnosticInfo,
  FeedFailureCause,
  FeedRouteInfo,
} from "../services/feedDiagnostics";
import {
  buildFeedLoadScopeKey,
  resolveFeedLoadScope,
  resolveFeedVisibilityState,
  resolveScopeMode,
} from "../services/feedLoadingStrategy";
import {
  getFeedDisplayName,
  resolveFeedSourceTitle,
} from "../utils/feedDisplay";
// import { schedulePreload } from '../services/feedPreloader';

export interface FeedLoadingState {
  status: "idle" | "loading" | "success" | "error";
  progress: number;
  loadedFeeds: number;
  totalFeeds: number;
  errors: FeedError[];
  isBackgroundRefresh: boolean;
  currentAction?: string;
  priorityFeedsLoaded?: boolean; // True when priority feeds (category + healthy) are loaded
  isResolved: boolean; // NEW: True when data is consistent and ready for UI filtering
  hasScopedCache?: boolean;
  isHoldingPreviousContent?: boolean;
  scopeKey?: string;
}

export interface FeedError {
  url: string;
  error: string;
  timestamp: number;
  feedTitle?: string;
  errorType?: FeedFailureCause;
}

interface FeedResult {
  url: string;
  articles: Article[];
  title: string;
  success: boolean;
  error?: string;
  route?: FeedRouteInfo;
  warning?: FeedDiagnosticInfo;
  source?: "backend" | "client-fallback" | "client";
}

const FEED_TIMEOUT_MS = 4000; // 4 seconds per feed (reduzido para mais velocidade inicial)
const DESKTOP_LOCAL_FEED_TIMEOUT_MS = 30_000;
const BATCH_SIZE = 8; // Aumentado para 8 feeds por batch
const BATCH_DELAY_MS = 500; // Reduzido para 500ms entre batches
const BATCH_DELAY_BACKGROUND_MS = 50; // Delay menor em abas inativas (o navegador vai limitar a 1s de qualquer forma)

export const resolveFeedTimeoutMs = (): number => {
  if (
    ProxyManager.getPreferLocalProxy() &&
    !ProxyManager.shouldUseClientProxyFallback()
  ) {
    return DESKTOP_LOCAL_FEED_TIMEOUT_MS;
  }

  return FEED_TIMEOUT_MS;
};

/**
 * Helper function to wait for batch delay with visibility awareness
 * In background tabs, setTimeout is throttled to 1 second, so we use a shorter delay
 * to avoid additional delays on top of the browser's throttling
 */
const waitForBatchDelay = (
  delayMs: number,
  backgroundDelayMs: number,
): Promise<void> => {
  return new Promise((resolve) => {
    const isVisible = !document.hidden;
    const actualDelay = isVisible ? delayMs : backgroundDelayMs;

    // Listen for visibility changes to resolve early when tab becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible, resolve immediately
        clearTimeout(timeoutId);
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange,
        );
        resolve();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    const timeoutId = setTimeout(() => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      resolve();
    }, actualDelay);
  });
};

const isSystemNoticeArticle = (article: Article): boolean => {
  const title = (article.title || "").toLowerCase();
  const sourceTitle = (article.sourceTitle || "").toLowerCase();

  return (
    sourceTitle === "system notice" ||
    title.includes("rss feed temporarily unavailable") ||
    title.includes("feed temporarily unavailable") ||
    title.includes("feed unavailable")
  );
};

const isUnavailablePayload = (articles: Article[]): boolean => {
  if (articles.length === 0) return true;
  return articles.every(isSystemNoticeArticle);
};

/**
 * Custom hook for progressive feed loading with enhanced performance
 */
export const useProgressiveFeedLoading = (feeds: FeedSource[]) => {
  const logger = useLogger("useProgressiveFeedLoading");
  const abortControllerRef = useRef<AbortController | null>(null);
  const feedsRef = useRef<FeedSource[]>(feeds);
  const articlesRef = useRef<Article[]>([]);
  const visibleScopeKeyRef = useRef<string>("all");
  const scopedFreshCacheRef = useRef<
    Map<
      string,
      {
        loadedAt: number;
        articles: Article[];
        feedResults: Map<string, FeedResult>;
      }
    >
  >(new Map());

  const [loadingState, setLoadingState] = useState<FeedLoadingState>({
    status: "idle",
    progress: 0,
    loadedFeeds: 0,
    totalFeeds: feeds.length,
    errors: [],
    isBackgroundRefresh: false,
    currentAction: "", // New field for granular status
    isResolved: false,
  });

  const [articles, setArticles] = useState<Article[]>([]);
  const [feedResults, setFeedResults] = useState<Map<string, FeedResult>>(
    new Map(),
  );

  const normalizeArticleForFeed = useCallback(
    (feed: FeedSource, article: Article): Article => ({
      ...article,
      feedUrl: article.feedUrl || feed.url,
      sourceTitle: resolveFeedSourceTitle(
        feed,
        article.sourceTitle,
        article.feedUrl || article.link || feed.url,
      ),
    }),
    [],
  );

  const collectArticlesFromFeedResults = useCallback(
    (results: Map<string, FeedResult>): Article[] => {
      const allArticles: Article[] = [];

      results.forEach((result) => {
        if (result.success && result.articles.length > 0) {
          const feed = feedsRef.current.find((item) => item.url === result.url);
          const articlesWithFeedUrl = result.articles.map((article) =>
            feed ? normalizeArticleForFeed(feed, article) : article,
          );
          allArticles.push(...articlesWithFeedUrl);
        }
      });

      return allArticles.sort(
        (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime(),
      );
    },
    [normalizeArticleForFeed],
  );

  /**
   * Get cached articles for immediate display using smart cache
   */
  const getCachedArticlesFromSmartCache = useCallback(
    (targetFeeds: FeedSource[]): Article[] => {
      try {
        const allCachedArticles: Article[] = [];

        targetFeeds.forEach((feed) => {
          const cachedArticles = getCachedArticles(feed.url);
          if (cachedArticles && cachedArticles.length > 0) {
            const articlesWithUrl = cachedArticles.map((article) =>
              normalizeArticleForFeed(feed, article),
            );
            allCachedArticles.push(...articlesWithUrl);
          }
        });

        // Sort by publication date (newest first)
        return allCachedArticles.sort(
          (a, b) =>
            new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime(),
        );
      } catch (error) {
        logger.error(
          "Error retrieving cached articles from smart cache",
          error as Error,
        );
        return [];
      }
    },
    [logger, normalizeArticleForFeed],
  );

  const getCachedFeedResultsFromSmartCache = useCallback(
    (targetFeeds: FeedSource[]): Map<string, FeedResult> => {
      const cachedResults = new Map<string, FeedResult>();

      try {
        targetFeeds.forEach((feed) => {
          const cachedArticles = getCachedArticles(feed.url);
          if (!cachedArticles || cachedArticles.length === 0) return;

          const normalizedArticles = cachedArticles.map((article) =>
            normalizeArticleForFeed(feed, article),
          );

          cachedResults.set(feed.url, {
            url: feed.url,
            articles: normalizedArticles,
            title:
              normalizedArticles[0]?.sourceTitle ||
              feed.customTitle ||
              feed.url,
            success: true,
          });
        });
      } catch (error) {
        logger.error(
          "Error building cached feed results from smart cache",
          error as Error,
        );
      }

      return cachedResults;
    },
    [logger, normalizeArticleForFeed],
  );

  /**
   * Load a single feed with timeout and error handling
   */
  const loadSingleFeedWithTimeout = useCallback(
    async (
      feed: FeedSource,
      signal?: AbortSignal,
      skipCache: boolean = false,
    ): Promise<FeedResult> => {
      const timeoutController = new AbortController();
      const cachedSnapshot = skipCache ? getCachedArticles(feed.url) : null;
      const timeoutMs = resolveFeedTimeoutMs();

      // Set timeout
      const timeoutId = setTimeout(
        () => timeoutController.abort(),
        timeoutMs,
      );

      try {
        logger.debug(`Loading feed: ${feed.url}`);

        const result = await loadFeedWithRuntime(feed.url, {
          signal: signal
            ? AbortSignal.any([signal, timeoutController.signal])
            : timeoutController.signal,
          skipCache,
          forceRefresh: skipCache,
        });

        clearTimeout(timeoutId);
        const normalizedFetchedArticles = result.articles.map((article) =>
          normalizeArticleForFeed(feed, article),
        );

        if (isUnavailablePayload(result.articles)) {
          if (cachedSnapshot && cachedSnapshot.length > 0) {
            const normalizedCachedSnapshot = cachedSnapshot.map((article) =>
              normalizeArticleForFeed(feed, article),
            );
            logger.warn(
              `Revalidation failed; preserving cached articles for ${feed.url}`,
              {
                additionalData: {
                  feedUrl: feed.url,
                  cachedArticles: cachedSnapshot.length,
                },
              },
            );

            return {
              url: feed.url,
              articles: normalizedCachedSnapshot,
              title: getFeedDisplayName(
                feed,
                normalizedCachedSnapshot[0]?.sourceTitle,
              ),
              success: true,
              route: result.route,
              warning: result.warning,
              source: result.source,
            };
          }

          logger.warn(`Feed returned unavailable payload for ${feed.url}`, {
            additionalData: {
              feedUrl: feed.url,
              parserTitle: result.title,
            },
          });

          return {
            url: feed.url,
            articles: [],
            title: getFeedDisplayName(feed, result.title),
            success: false,
            error: "Feed temporarily unavailable",
            route: result.route,
            warning: result.warning,
            source: result.source,
          };
        }

        // Cache is handled by the RSS parser now with smart cache
        // No need to manually cache here

        return {
          url: feed.url,
          articles: normalizedFetchedArticles,
          title: getFeedDisplayName(
            feed,
            normalizedFetchedArticles[0]?.sourceTitle || result.title,
          ),
          success: true,
          route: result.route,
          warning: result.warning,
          source: result.source,
        };
      } catch (error) {
        clearTimeout(timeoutId);

        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        const isTimeout =
          errorMessage.includes("abort") || errorMessage.includes("timeout");

        logger.warn(`Failed to load feed: ${feed.url}`, {
          additionalData: {
            feedUrl: feed.url,
            error: errorMessage,
            isTimeout,
          },
        });

        return {
          url: feed.url,
          articles: [],
          title: getFeedDisplayName(feed),
          success: false,
          error: isTimeout
            ? `Feed timeout after ${timeoutMs}ms`
            : errorMessage,
        };
      }
    },
    [logger, normalizeArticleForFeed],
  );

  /**
   * Update articles from feed results
   */
  const updateArticlesFromFeedResults = useCallback(
    (results: Map<string, FeedResult>) => {
      const sortedArticles = collectArticlesFromFeedResults(results);

      setArticles(sortedArticles);
      articlesRef.current = sortedArticles;

      logger.info(`Updated articles from ${results.size} feeds`, {
        additionalData: {
          totalArticles: sortedArticles.length,
          successfulFeeds: Array.from(results.values()).filter((r) => r.success)
            .length,
          failedFeeds: Array.from(results.values()).filter((r) => !r.success)
            .length,
        },
      });
    },
    [collectArticlesFromFeedResults, logger],
  );

  /**
   * Load feeds progressively with scoped loading.
   * Single-feed navigation loads only the chosen feed.
   */
  const loadFeedsProgressively = useCallback(
    async (request: FeedLoadRequest = {}) => {
      const currentFeeds = feedsRef.current;
      const scopedFeeds = resolveFeedLoadScope(currentFeeds, request);
      const mode = resolveScopeMode(request);
      const scopeKey = buildFeedLoadScopeKey(request);
      const priorityCategoryId =
        mode === "category" ? request.categoryId : undefined;
      const forceRefresh = request.forceRefresh ?? false;
      const cacheTtlMinutes = request.cacheTtlMinutes ?? 10;
      const cacheTtlMs = cacheTtlMinutes * 60 * 1000;
      const previousArticles = articlesRef.current;
      const previousScopeKey = visibleScopeKeyRef.current;

      if (scopedFeeds.length === 0) {
        setArticles([]);
        articlesRef.current = [];
        visibleScopeKeyRef.current = scopeKey;
        setFeedResults(new Map());
        setLoadingState({
          status: "success",
          progress: 100,
          loadedFeeds: 0,
          totalFeeds: 0,
          errors: [],
          isBackgroundRefresh: false,
          currentAction:
            currentFeeds.length === 0
              ? "No feeds configured"
              : "No feeds matched the selected scope",
          isResolved: true,
          hasScopedCache: false,
          isHoldingPreviousContent: false,
          scopeKey,
        });
        return;
      }

      // Cancel any ongoing requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const cachedArticles = getCachedArticlesFromSmartCache(scopedFeeds);
      const cachedFeedResults = getCachedFeedResultsFromSmartCache(scopedFeeds);
      const freshScopeCache = scopedFreshCacheRef.current.get(scopeKey);
      const hasFreshScopeCache =
        !forceRefresh &&
        cacheTtlMs > 0 &&
        freshScopeCache !== undefined &&
        Date.now() - freshScopeCache.loadedAt <= cacheTtlMs;

      if (hasFreshScopeCache) {
        setArticles(freshScopeCache.articles);
        articlesRef.current = freshScopeCache.articles;
        visibleScopeKeyRef.current = scopeKey;
        setFeedResults(new Map(freshScopeCache.feedResults));
        setLoadingState({
          status: "success",
          progress: 100,
          loadedFeeds: scopedFeeds.length,
          totalFeeds: scopedFeeds.length,
          errors: [],
          isBackgroundRefresh: false,
          currentAction:
            mode === "single-feed"
              ? "Feed selecionado carregado do cache recente"
              : "Feeds carregados do cache recente",
          priorityFeedsLoaded: true,
          isResolved: true,
          hasScopedCache: true,
          isHoldingPreviousContent: false,
          scopeKey,
        });

        logger.info("Using fresh scoped feed cache without network refresh", {
          additionalData: {
            mode,
            scopeKey,
            cacheTtlMinutes,
            articlesCount: freshScopeCache.articles.length,
          },
        });
        return;
      }

      const {
        hasScopedCache,
        isHoldingPreviousContent,
        shouldKeepVisibleContent,
        preserveVisibleArticlesOnFailure,
        shouldBypassCache,
      } = resolveFeedVisibilityState({
        forceRefresh,
        cachedArticlesCount: cachedArticles.length,
        previousArticlesCount: previousArticles.length,
        previousScopeKey,
        scopeKey,
      });

      if (hasScopedCache) {
        setArticles(cachedArticles);
        articlesRef.current = cachedArticles;
        visibleScopeKeyRef.current = scopeKey;
        setFeedResults(new Map(cachedFeedResults));
        setLoadingState({
          status: "loading",
          progress: 0,
          loadedFeeds: 0,
          totalFeeds: scopedFeeds.length,
          errors: [],
          isBackgroundRefresh: true,
          currentAction:
            mode === "single-feed"
              ? "Atualizando feed selecionado..."
              : "Atualizando feeds em segundo plano...",
          isResolved: true,
          hasScopedCache: true,
          isHoldingPreviousContent: false,
          scopeKey,
        });

        logger.info(
          `Displaying ${cachedArticles.length} cached articles while refreshing`,
          {
            additionalData: {
              feedsCount: scopedFeeds.length,
              mode,
              feedUrl: request.feedUrl,
              scopeKey,
            },
          },
        );
      } else if (!shouldKeepVisibleContent) {
        setArticles([]);
        articlesRef.current = [];
        visibleScopeKeyRef.current = scopeKey;
        setLoadingState({
          status: "loading",
          progress: 0,
          loadedFeeds: 0,
          totalFeeds: scopedFeeds.length,
          errors: [],
          isBackgroundRefresh: false,
          currentAction:
            mode === "single-feed"
              ? "Carregando feed selecionado..."
              : "Iniciando motor de feeds...",
          isResolved: false,
          hasScopedCache: false,
          isHoldingPreviousContent: false,
          scopeKey,
        });
      } else {
        visibleScopeKeyRef.current = scopeKey;
        setLoadingState({
          status: "loading",
          progress: 0,
          loadedFeeds: 0,
          totalFeeds: scopedFeeds.length,
          errors: [],
          isBackgroundRefresh: true,
          currentAction:
            mode === "single-feed"
              ? "Atualizando feed selecionado..."
              : "Atualizando feeds em segundo plano...",
          isResolved: true,
          hasScopedCache: false,
          isHoldingPreviousContent,
          scopeKey,
        });
      }

      if (!hasScopedCache) {
        setFeedResults(new Map());
      }

      const newFeedResults = new Map<string, FeedResult>(cachedFeedResults);
      const errors: FeedError[] = [];
      let loadedCount = 0;

      // Get problematic feeds from localStorage (feeds that failed in previous sessions)
      const problematicFeedsKey = "feed-error-history";
      const problematicUrls: Set<string> = new Set();
      const errorHistory: Map<
        string,
        { failures: number; lastError: number; lastErrorType: string }
      > = new Map();

      try {
        const stored = localStorage.getItem(problematicFeedsKey);
        if (stored) {
          const parsed = JSON.parse(stored);

          // Handle migration from old format array of objects to new format
          if (Array.isArray(parsed)) {
            parsed.forEach(
              (item: {
                url: string;
                failures?: number;
                lastError: number;
                lastErrorType?: string;
              }) => {
                // New format check: has failures property
                if (item.failures !== undefined) {
                  errorHistory.set(item.url, {
                    failures: item.failures,
                    lastError: item.lastError,
                    lastErrorType: item.lastErrorType || "unknown",
                  });
                } else {
                  // Old format fallback: treat as 1 failure
                  errorHistory.set(item.url, {
                    failures: 1,
                    lastError: item.lastError,
                    lastErrorType: "unknown",
                  });
                }
              },
            );
          }

          // Consider feeds problematic if they failed recently (last 7 days) to keep history
          // But for ordering, we can prioritize those with multiple failures
          const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;

          errorHistory.forEach((data, url) => {
            if (data.lastError > cutoff) {
              problematicUrls.add(url);
            }
          });
        }
      } catch {
        // Ignore parse errors
      }

      // Reorder feeds: prioritize selected category, then healthy feeds, then problematic feeds
      const isPriority = (feed: FeedSource) =>
        priorityCategoryId &&
        priorityCategoryId !== "all" &&
        feed.categoryId === priorityCategoryId;

      const getHealthScore = (feed: FeedSource) => {
        const history = errorHistory.get(feed.url);
        if (!history) return 0;
        const hoursSinceLastError =
          (Date.now() - history.lastError) / (1000 * 60 * 60);
        const recencyPenalty = Math.max(0, 48 - hoursSinceLastError); // errors in last 2 days are more costly
        return history.failures * 10 + recencyPenalty;
      };

      const priorityFeeds = scopedFeeds.filter((f) => isPriority(f));
      const otherFeeds = scopedFeeds.filter((f) => !isPriority(f));

      const sortByHealth = (a: FeedSource, b: FeedSource) =>
        getHealthScore(a) - getHealthScore(b);

      const prioritySorted = priorityFeeds.slice().sort(sortByHealth);
      const otherSorted = otherFeeds.slice().sort(sortByHealth);

      const orderedFeeds =
        prioritySorted.length > 0
          ? [...prioritySorted, ...otherSorted]
          : otherSorted;

      const priorityFeedCount = prioritySorted.length;

      if (problematicUrls.size > 0) {
        logger.info(
          `Feed ordering: ${prioritySorted.length} priority, ${otherSorted.length} other (sorted by health)`,
          {
            additionalData: {
              priorityCategory: priorityCategoryId,
              problematicCount: problematicUrls.size,
            },
          },
        );
      }

      const hasPriorityPhase =
        mode !== "single-feed" &&
        prioritySorted.length > 0 &&
        priorityCategoryId &&
        priorityCategoryId !== "all";

      const feedPhases: {
        name: "priority" | "secondary" | "default";
        feeds: FeedSource[];
      }[] = hasPriorityPhase
        ? [
            { name: "priority", feeds: prioritySorted },
            { name: "secondary", feeds: otherSorted },
          ]
        : [{ name: "default", feeds: orderedFeeds }];

      const totalBatches = feedPhases.reduce(
        (sum, phase) => sum + Math.ceil(phase.feeds.length / BATCH_SIZE),
        0,
      );

      logger.info(
        `Loading ${scopedFeeds.length} feeds in ${totalBatches} batches of ${BATCH_SIZE}`,
        {
          additionalData: {
            totalFeeds: scopedFeeds.length,
            batchCount: totalBatches,
            mode,
          },
        },
      );

      const allResults: Promise<FeedResult>[] = [];
      let batchCounter = 0;

      // Process phases sequentially with delay
      for (const phase of feedPhases) {
        const phaseBatches: FeedSource[][] = [];
        for (let i = 0; i < phase.feeds.length; i += BATCH_SIZE) {
          phaseBatches.push(phase.feeds.slice(i, i + BATCH_SIZE));
        }

        for (
          let batchIndex = 0;
          batchIndex < phaseBatches.length;
          batchIndex++
        ) {
          const batch = phaseBatches[batchIndex];
          batchCounter += 1;

          logger.debug(
            `Processing batch ${batchCounter}/${totalBatches} with ${batch.length} feeds`,
            {
              phase: phase.name,
            },
          );

          // Update status for user
          setLoadingState((prev) => ({
            ...prev,
            currentAction:
              mode === "single-feed"
                ? `Loading ${batch[0] ? getFeedDisplayName(batch[0]) : "feed"}...`
                : phase.name === "priority"
                  ? `Carregando feeds da categoria atual (${batchIndex + 1}/${phaseBatches.length})...`
                  : `Carregando lote ${batchCounter} de ${totalBatches}...`,
          }));

          // Process feeds in current batch concurrently
          const batchPromises = batch.map(async (feed) => {
            try {
              // Update granular status for single feed start (optional, might flicker too fast)
              // setLoadingState(prev => ({ ...prev, currentAction: `Contacting ${new URL(feed.url).hostname}...` }));

              const result = await loadSingleFeedWithTimeout(
                feed,
                abortControllerRef.current?.signal,
                shouldBypassCache,
              );

              // Update progress immediately when each feed completes
              loadedCount++;
              const progress = (loadedCount / scopedFeeds.length) * 100;

              // Check if all priority feeds have been loaded
              const priorityComplete =
                priorityFeedCount === 0
                  ? true
                  : loadedCount >= priorityFeedCount;

              setLoadingState((prev) => ({
                ...prev,
                loadedFeeds: loadedCount,
                progress,
                scopeKey,
                priorityFeedsLoaded: priorityComplete,
                // Show what we just finished or generic progress
                currentAction:
                  mode === "single-feed"
                    ? `Processado: ${getFeedDisplayName(feed)}`
                    : priorityComplete && loadedCount < scopedFeeds.length
                      ? `Carregando feeds restantes... (${scopedFeeds.length - loadedCount} faltam)`
                      : `Processado: ${getFeedDisplayName(feed)}`,
              }));

              // Add result to map
              if (!result.success) {
                // Track error with categorization
                const errorMessage = result.error || "Unknown error";
                const errorType = categorizeFeedError(errorMessage);
                errors.push({
                  url: feed.url,
                  error: errorMessage,
                  timestamp: Date.now(),
                  feedTitle: result.title,
                  errorType: errorType,
                });

                const cachedResult = cachedFeedResults.get(feed.url);
                if (!cachedResult) {
                  newFeedResults.set(feed.url, result);
                }
              } else {
                newFeedResults.set(feed.url, result);
              }

              return result;
            } catch (error) {
              loadedCount++;
              const progress = (loadedCount / scopedFeeds.length) * 100;

              setLoadingState((prev) => ({
                ...prev,
                loadedFeeds: loadedCount,
                progress,
                scopeKey,
                currentAction: `Erro ao processar ${getFeedDisplayName(feed)}`,
              }));

              const errorMessage =
                error instanceof Error ? error.message : "Unknown error";
              errors.push({
                url: feed.url,
                error: errorMessage,
                timestamp: Date.now(),
              });

              return {
                url: feed.url,
                articles: [],
                title: getFeedDisplayName(feed),
                success: false,
                error: errorMessage,
              };
            }
          });

          // Add batch promises to all results
          allResults.push(...batchPromises);

          // Wait for current batch to complete before starting next batch
          await Promise.allSettled(batchPromises);

          // Update articles AFTER the batch completes to reduce re-renders and layout shifts
          setFeedResults((prev) => {
            const updated =
              batchCounter === 1
                ? new Map<string, FeedResult>()
                : new Map(prev);
            // Merge new results from this batch into the map
            newFeedResults.forEach((result, url) => {
              updated.set(url, result);
            });
            // Update the articles state with the accumulated results
            if (!hasScopedCache && !isHoldingPreviousContent) {
              const nextArticles = collectArticlesFromFeedResults(updated);

              if (
                nextArticles.length > 0 ||
                !preserveVisibleArticlesOnFailure
              ) {
                setArticles(nextArticles);
                articlesRef.current = nextArticles;
                visibleScopeKeyRef.current = scopeKey;
              }
            }
            return updated;
          });

          // Add delay between batches (except for the last batch)
          const isLastBatch = batchCounter >= totalBatches;
          if (!isLastBatch) {
            const delayMs = phase.name === "priority" ? 0 : BATCH_DELAY_MS;
            if (delayMs > 0) {
              const isVisible = !document.hidden;
              logger.debugTag("PERF", `Waiting before next batch`, {
                batchIndex,
                isPageVisible: isVisible,
                delayMs: isVisible ? delayMs : BATCH_DELAY_BACKGROUND_MS,
              });
              await waitForBatchDelay(delayMs, BATCH_DELAY_BACKGROUND_MS);
            }
          }
        }
      }

      const feedPromises = allResults;

      try {
        // Wait for all feeds to complete
        const results = await Promise.allSettled(feedPromises);

        // Update final state
        const successfulFeeds = results.filter(
          (r) => r.status === "fulfilled" && r.value.success,
        ).length;
        const resolvedArticles = collectArticlesFromFeedResults(newFeedResults);

        setFeedResults(newFeedResults);

        if (
          resolvedArticles.length > 0 ||
          successfulFeeds > 0 ||
          !preserveVisibleArticlesOnFailure
        ) {
          setArticles(resolvedArticles);
          articlesRef.current = resolvedArticles;
          visibleScopeKeyRef.current = scopeKey;
        }

        if (successfulFeeds > 0 || resolvedArticles.length > 0) {
          scopedFreshCacheRef.current.set(scopeKey, {
            loadedAt: Date.now(),
            articles: resolvedArticles,
            feedResults: new Map(newFeedResults),
          });
        }

        setLoadingState({
          status: "success",
          progress: 100,
          loadedFeeds: scopedFeeds.length,
          totalFeeds: scopedFeeds.length,
          errors,
          isBackgroundRefresh: false,
          currentAction:
            errors.length > 0
              ? errors.length === 1
                ? "1 feed falhou nesta atualização"
                : `${errors.length} feeds falharam nesta atualização`
              : mode === "single-feed"
                ? "Feed selecionado carregado"
                : "Todos os feeds carregados",
          priorityFeedsLoaded: true,
          isResolved: true,
          hasScopedCache,
          isHoldingPreviousContent: false,
          scopeKey,
        });

        // Persist error history to localStorage for future prioritization
        // Persist error history to localStorage for future prioritization
        // We update the errorHistory map based on this run's results
        try {
          // 1. Process successes: Remove from error history (reset count)
          results.forEach((r) => {
            if (r.status === "fulfilled" && r.value.success) {
              errorHistory.delete(r.value.url);
            }
          });

          // 2. Process failures: Increment or add to error history
          errors.forEach((e) => {
            const existing = errorHistory.get(e.url);
            errorHistory.set(e.url, {
              failures: (existing?.failures || 0) + 1,
              lastError: Date.now(),
              lastErrorType: e.errorType || "unknown",
            });
          });

          // 3. Serialize and save map to array
          const historyArray = Array.from(errorHistory.entries()).map(
            ([url, data]) => ({
              url,
              ...data,
            }),
          );

          localStorage.setItem(
            problematicFeedsKey,
            JSON.stringify(historyArray),
          );
          logger.debug(
            `Persisted error history for ${historyArray.length} feeds`,
          );
        } catch (err) {
          logger.warn("Failed to save feed error history", err as Error);
        }

        logger.info(`Feed loading completed`, {
          additionalData: {
            totalFeeds: scopedFeeds.length,
            successfulFeeds,
            failedFeeds: scopedFeeds.length - successfulFeeds,
            errorsCount: errors.length,
            forceRefresh,
            hadScopedCache: hasScopedCache,
            mode,
            scopeKey,
          },
        });
      } catch (error) {
        logger.error("Error during progressive feed loading", error as Error);

        setLoadingState({
          status: "error",
          progress: 100,
          loadedFeeds: scopedFeeds.length,
          totalFeeds: scopedFeeds.length,
          errors,
          isBackgroundRefresh: false,
          currentAction: "Erro durante o processo de carregamento",
          isResolved: true,
          hasScopedCache,
          isHoldingPreviousContent: false,
          scopeKey,
        });
      }
    },
    [
      collectArticlesFromFeedResults,
      getCachedArticlesFromSmartCache,
      getCachedFeedResultsFromSmartCache,
      loadSingleFeedWithTimeout,
      logger,
    ],
  );

  /**
   * Retry failed feeds
   */
  const retryFailedFeeds = useCallback(async () => {
    const failedUrls = loadingState.errors.map((error) => error.url);
    const failedFeeds = feedsRef.current.filter((feed) =>
      failedUrls.includes(feed.url),
    );

    if (failedFeeds.length === 0) return;

    logger.info(`Retrying ${failedFeeds.length} failed feeds`);

    // Calculate initial state for retry
    let localLoadedCount = 0;
    setLoadingState((prev) => {
      localLoadedCount = Math.max(0, prev.totalFeeds - failedFeeds.length);
      const initialProgress =
        prev.totalFeeds > 0 ? (localLoadedCount / prev.totalFeeds) * 100 : 0;

      return {
        ...prev,
        errors: prev.errors.filter((error) => !failedUrls.includes(error.url)),
        status: "loading",
        loadedFeeds: localLoadedCount,
        progress: initialProgress,
        currentAction: "Tentando novamente feeds que falharam...",
      };
    });

    // Load failed feeds
    const retryPromises = failedFeeds.map(async (feed) => {
      const result = await loadSingleFeedWithTimeout(feed, undefined, true);

      localLoadedCount++;
      const currentProgress =
        loadingState.totalFeeds > 0
          ? (localLoadedCount / loadingState.totalFeeds) * 100
          : 100;

      if (result.success) {
        setFeedResults((prev) => {
          const updated = new Map(prev);
          updated.set(feed.url, result);
          updateArticlesFromFeedResults(updated);
          return updated;
        });

        setLoadingState((prev) => ({
          ...prev,
          loadedFeeds: localLoadedCount,
          progress: currentProgress,
        }));
      } else {
        const errorMessage = result.error || "Retry failed";
        setLoadingState((prev) => ({
          ...prev,
          loadedFeeds: localLoadedCount,
          progress: currentProgress,
          errors: [
            ...prev.errors,
            {
              url: feed.url,
              error: errorMessage,
              timestamp: Date.now(),
              feedTitle: result.title,
              errorType: categorizeFeedError(errorMessage),
            },
          ],
        }));
      }

      return result;
    });

    await Promise.allSettled(retryPromises);

    setLoadingState((prev) => ({
      ...prev,
      status: "success",
      loadedFeeds: prev.totalFeeds,
      progress: 100,
      currentAction: "Tentativa de recuperação concluída",
    }));
  }, [
    loadingState.errors,
    loadingState.totalFeeds,
    loadSingleFeedWithTimeout,
    updateArticlesFromFeedResults,
    logger,
  ]);

  /**
   * Retry specific feeds by URLs
   */
  const retrySelectedFeeds = useCallback(
    async (urls: string[]) => {
      const selectedFeeds = feedsRef.current.filter((feed) =>
        urls.includes(feed.url),
      );

      if (selectedFeeds.length === 0) return;

      logger.info(`Retrying ${selectedFeeds.length} selected feeds`);

      // Calculate initial state for retry
      let localLoadedCount = 0;
      setLoadingState((prev) => {
        localLoadedCount = Math.max(0, prev.totalFeeds - selectedFeeds.length);
        const initialProgress =
          prev.totalFeeds > 0 ? (localLoadedCount / prev.totalFeeds) * 100 : 0;

        return {
          ...prev,
          errors: prev.errors.filter((error) => !urls.includes(error.url)),
          status: "loading",
          loadedFeeds: localLoadedCount,
          progress: initialProgress,
          currentAction: "Tentando carregar feeds selecionados...",
        };
      });

      // Load selected feeds
      const retryPromises = selectedFeeds.map(async (feed) => {
        const result = await loadSingleFeedWithTimeout(feed, undefined, true);

        localLoadedCount++;
        const currentProgress =
          loadingState.totalFeeds > 0
            ? (localLoadedCount / loadingState.totalFeeds) * 100
            : 100;

        if (result.success) {
          setFeedResults((prev) => {
            const updated = new Map(prev);
            updated.set(feed.url, result);
            updateArticlesFromFeedResults(updated);
            return updated;
          });

          setLoadingState((prev) => ({
            ...prev,
            loadedFeeds: localLoadedCount,
            progress: currentProgress,
          }));
        } else {
          const errorMessage = result.error || "Retry failed";
          setLoadingState((prev) => ({
            ...prev,
            loadedFeeds: localLoadedCount,
            progress: currentProgress,
            errors: [
              ...prev.errors,
              {
                url: feed.url,
                error: errorMessage,
                timestamp: Date.now(),
                feedTitle: result.title,
                errorType: categorizeFeedError(errorMessage),
              },
            ],
          }));
        }

        return result;
      });

      await Promise.allSettled(retryPromises);

      setLoadingState((prev) => ({
        ...prev,
        status: "success",
        loadedFeeds: prev.totalFeeds,
        progress: 100,
        currentAction: "Carga selecionada concluída",
      }));
    },
    [
      loadingState.totalFeeds,
      loadSingleFeedWithTimeout,
      updateArticlesFromFeedResults,
      logger,
    ],
  );

  /**
   * Cancel ongoing loading
   */
  const cancelLoading = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setLoadingState((prev) => ({
      ...prev,
      status: "idle",
      currentAction: "Cancelado pelo usuário",
    }));

    logger.info("Feed loading cancelled");
  }, [logger]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Update feeds ref and total feeds when feeds array changes
  useEffect(() => {
    feedsRef.current = feeds;
    setLoadingState((prev) => ({
      ...prev,
      totalFeeds: feeds.length,
    }));

    // TODO: Implementar pré-carregamento inteligente
    // if (feeds.length > 0) {
    //   schedulePreload(feeds);
    // }
  }, [feeds]);

  useEffect(() => {
    articlesRef.current = articles;
  }, [articles]);

  return {
    articles,
    loadingState,
    feedResults,
    loadFeeds: loadFeedsProgressively,
    retryFailedFeeds,
    retrySelectedFeeds,
    cancelLoading,
  };
};
