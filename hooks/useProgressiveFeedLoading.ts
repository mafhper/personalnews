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

import { useState, useCallback, useRef, useEffect } from 'react';
import type { Article, FeedSource } from '../types';
import { parseRssUrl } from '../services/rssParser';
import { getCachedArticles, isCacheFresh } from '../services/smartCache';
import { useLogger } from '../services/logger';
import { categorizeError } from '../components/ErrorRecovery';
// import { schedulePreload } from '../services/feedPreloader';

export interface FeedLoadingState {
  status: 'idle' | 'loading' | 'success' | 'error';
  progress: number;
  loadedFeeds: number;
  totalFeeds: number;
  errors: FeedError[];
  isBackgroundRefresh: boolean;
  currentAction?: string;
  priorityFeedsLoaded?: boolean;  // True when priority feeds (category + healthy) are loaded
}

export interface FeedError {
  url: string;
  error: string;
  timestamp: number;
  feedTitle?: string;
  errorType?: 'timeout' | 'network' | 'parse' | 'cors' | 'unknown';
}

interface FeedResult {
  url: string;
  articles: Article[];
  title: string;
  success: boolean;
  error?: string;
}

const FEED_TIMEOUT_MS = 6000; // 6 seconds per feed (reduzido para mais velocidade)
const BATCH_SIZE = 8; // Aumentado para 8 feeds por batch
const BATCH_DELAY_MS = 500; // Reduzido para 500ms entre batches

/**
 * Custom hook for progressive feed loading with enhanced performance
 */
export const useProgressiveFeedLoading = (feeds: FeedSource[]) => {
  const logger = useLogger('useProgressiveFeedLoading');
  const abortControllerRef = useRef<AbortController | null>(null);
  const feedsRef = useRef<FeedSource[]>(feeds);

  const [loadingState, setLoadingState] = useState<FeedLoadingState>({
    status: 'idle',
    progress: 0,
    loadedFeeds: 0,
    totalFeeds: feeds.length,
    errors: [],
    isBackgroundRefresh: false,
    currentAction: '', // New field for granular status
  });

  const [articles, setArticles] = useState<Article[]>([]);
  const [feedResults, setFeedResults] = useState<Map<string, FeedResult>>(new Map());

  /**
   * Get cached articles for immediate display using smart cache
   */
  const getCachedArticlesFromSmartCache = useCallback((): Article[] => {
    try {
      const allCachedArticles: Article[] = [];

      feedsRef.current.forEach(feed => {
        const cachedArticles = getCachedArticles(feed.url);
        if (cachedArticles && cachedArticles.length > 0) {
          allCachedArticles.push(...cachedArticles);
        }
      });

      // Sort by publication date (newest first)
      return allCachedArticles.sort(
        (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
      );
    } catch (error) {
      logger.error('Error retrieving cached articles from smart cache', error as Error);
      return [];
    }
  }, [logger]);

  /**
   * Load a single feed with timeout and error handling
   */
  const loadSingleFeedWithTimeout = useCallback(async (
    feed: FeedSource,
    signal?: AbortSignal
  ): Promise<FeedResult> => {
    const timeoutController = new AbortController();

    // Set timeout
    const timeoutId = setTimeout(() => timeoutController.abort(), FEED_TIMEOUT_MS);

    try {
      logger.debug(`Loading feed: ${feed.url}`);

      const result = await parseRssUrl(feed.url, {
        signal: signal ? AbortSignal.any([signal, timeoutController.signal]) : timeoutController.signal
      });

      clearTimeout(timeoutId);

      // Cache is handled by the RSS parser now with smart cache
      // No need to manually cache here

      return {
        url: feed.url,
        articles: result.articles,
        title: result.title,
        success: true,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isTimeout = errorMessage.includes('abort') || errorMessage.includes('timeout');

      logger.warn(`Failed to load feed: ${feed.url}`, {
        additionalData: {
          feedUrl: feed.url,
          error: errorMessage,
          isTimeout,
        }
      });

      return {
        url: feed.url,
        articles: [],
        title: feed.customTitle || feed.url,
        success: false,
        error: isTimeout ? `Feed timeout after ${FEED_TIMEOUT_MS}ms` : errorMessage,
      };
    }
  }, [logger]);

  /**
   * Update articles from feed results
   */
  const updateArticlesFromFeedResults = useCallback((results: Map<string, FeedResult>) => {
    const allArticles: Article[] = [];

    results.forEach((result) => {
      if (result.success && result.articles.length > 0) {
        allArticles.push(...result.articles);
      }
    });

    // Sort by publication date (newest first)
    const sortedArticles = allArticles.sort(
      (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
    );

    setArticles(sortedArticles);

    logger.info(`Updated articles from ${results.size} feeds`, {
      additionalData: {
        totalArticles: sortedArticles.length,
        successfulFeeds: Array.from(results.values()).filter(r => r.success).length,
        failedFeeds: Array.from(results.values()).filter(r => !r.success).length,
      }
    });
  }, [logger]);

  /**
   * Load feeds progressively with immediate cache display
   * @param forceRefresh - If true, bypass cache checks
   * @param priorityCategoryId - If provided, feeds from this category will be loaded first
   */
  const loadFeedsProgressively = useCallback(async (forceRefresh = false, priorityCategoryId?: string) => {
    const currentFeeds = feedsRef.current;
    if (currentFeeds.length === 0) {
      setArticles([]);
      setLoadingState({
        status: 'success',
        progress: 100,
        loadedFeeds: 0,
        totalFeeds: 0,
        errors: [],
        isBackgroundRefresh: false,
        currentAction: 'No feeds configured',
      });
      return;
    }

    // Cancel any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Check cache first for immediate display
    let hasValidCache = false;
    if (!forceRefresh) {
      const cachedArticles = getCachedArticlesFromSmartCache();
      if (cachedArticles.length > 0) {
        // Check if at least some feeds have valid cache
        hasValidCache = currentFeeds.some(feed => isCacheFresh(feed.url));

        if (hasValidCache) {
          setArticles(cachedArticles);
          setLoadingState({
            status: 'loading',
            progress: 0,
            loadedFeeds: 0,
            totalFeeds: currentFeeds.length,
            errors: [],
            isBackgroundRefresh: true,
            currentAction: 'Updating feeds in background...',
          });

          logger.info(`Displaying ${cachedArticles.length} cached articles while refreshing`, {
            additionalData: { feedsCount: currentFeeds.length }
          });
        }
      }
    }

    // If no valid cache, show loading state
    if (!hasValidCache) {
      setLoadingState({
        status: 'loading',
        progress: 0,
        loadedFeeds: 0,
        totalFeeds: currentFeeds.length,
        errors: [],
        isBackgroundRefresh: false,
        currentAction: 'Initializing feed engine...',
      });
    }

    const newFeedResults = new Map<string, FeedResult>();
    const errors: FeedError[] = [];
    let loadedCount = 0;

    // Get problematic feeds from localStorage (feeds that failed in previous sessions)
    const problematicFeedsKey = 'feed-error-history';
    const problematicUrls: Set<string> = new Set();
    const errorHistory: Map<string, { failures: number; lastError: number; lastErrorType: string }> = new Map();

    try {
      const stored = localStorage.getItem(problematicFeedsKey);
      if (stored) {
        const parsed = JSON.parse(stored);

        // Handle migration from old format array of objects to new format
        if (Array.isArray(parsed)) {
          parsed.forEach((item: { url: string; failures?: number; lastError: number; lastErrorType?: string }) => {
            // New format check: has failures property
            if (item.failures !== undefined) {
              errorHistory.set(item.url, {
                failures: item.failures,
                lastError: item.lastError,
                lastErrorType: item.lastErrorType || 'unknown'
              });
            } else {
              // Old format fallback: treat as 1 failure
              errorHistory.set(item.url, {
                failures: 1,
                lastError: item.lastError,
                lastErrorType: 'unknown'
              });
            }
          });
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

    // Reorder feeds: priority category first, then healthy feeds, then problematic feeds
    const isHealthy = (feed: FeedSource) => !problematicUrls.has(feed.url);
    const isPriority = (feed: FeedSource) =>
      priorityCategoryId && priorityCategoryId !== 'all' && feed.categoryId === priorityCategoryId;

    // Sort feeds into 4 groups:
    // 1. Priority category + healthy
    // 2. Other healthy feeds
    // 3. Priority category + problematic
    // 4. Other problematic feeds
    const priorityHealthy = currentFeeds.filter(f => isPriority(f) && isHealthy(f));
    const otherHealthy = currentFeeds.filter(f => !isPriority(f) && isHealthy(f));
    const priorityProblematic = currentFeeds.filter(f => isPriority(f) && !isHealthy(f));
    const otherProblematic = currentFeeds.filter(f => !isPriority(f) && !isHealthy(f));

    const orderedFeeds = [...priorityHealthy, ...otherHealthy, ...priorityProblematic, ...otherProblematic];
    const priorityFeedCount = priorityHealthy.length + otherHealthy.length;

    if (problematicUrls.size > 0) {
      logger.info(`Feed ordering: ${priorityHealthy.length} priority+healthy, ${otherHealthy.length} other healthy, ${priorityProblematic.length + otherProblematic.length} problematic`, {
        additionalData: {
          priorityCategory: priorityCategoryId,
          problematicCount: problematicUrls.size
        }
      });
    }

    // Load feeds in batches to avoid overwhelming proxies
    const feedBatches: FeedSource[][] = [];
    for (let i = 0; i < orderedFeeds.length; i += BATCH_SIZE) {
      feedBatches.push(orderedFeeds.slice(i, i + BATCH_SIZE));
    }

    logger.info(`Loading ${currentFeeds.length} feeds in ${feedBatches.length} batches of ${BATCH_SIZE}`, {
      additionalData: { totalFeeds: currentFeeds.length, batchCount: feedBatches.length }
    });

    const allResults: Promise<FeedResult>[] = [];

    // Process batches sequentially with delay
    for (let batchIndex = 0; batchIndex < feedBatches.length; batchIndex++) {
      const batch = feedBatches[batchIndex];

      logger.debug(`Processing batch ${batchIndex + 1}/${feedBatches.length} with ${batch.length} feeds`);

      // Update status for user
      setLoadingState(prev => ({
        ...prev,
        currentAction: `Carregando lote ${batchIndex + 1} de ${feedBatches.length}...`
      }));

      // Process feeds in current batch concurrently
      const batchPromises = batch.map(async (feed) => {
        try {
          // Update granular status for single feed start (optional, might flicker too fast)
          // setLoadingState(prev => ({ ...prev, currentAction: `Contacting ${new URL(feed.url).hostname}...` }));

          const result = await loadSingleFeedWithTimeout(feed, abortControllerRef.current?.signal);

          // Update progress immediately when each feed completes
          loadedCount++;
          const progress = (loadedCount / currentFeeds.length) * 100;

          // Check if all priority (healthy) feeds have been loaded
          const priorityComplete = loadedCount >= priorityFeedCount;

          setLoadingState(prev => ({
            ...prev,
            loadedFeeds: loadedCount,
            progress,
            priorityFeedsLoaded: priorityComplete,
            // Show what we just finished or generic progress
            currentAction: priorityComplete && loadedCount < currentFeeds.length
              ? `Carregando feeds restantes... (${currentFeeds.length - loadedCount} faltam)`
              : `Processado ${feed.customTitle || new URL(feed.url).hostname}`
          }));

          // Add result to map
          newFeedResults.set(feed.url, result);

          if (!result.success) {
            // Track error with categorization
            const errorMessage = result.error || 'Unknown error';
            const errorType = categorizeError(errorMessage);
            errors.push({
              url: feed.url,
              error: errorMessage,
              timestamp: Date.now(),
              feedTitle: result.title,
              errorType: errorType,
            });
          }

          return result;
        } catch (error) {
          loadedCount++;
          const progress = (loadedCount / currentFeeds.length) * 100;

          setLoadingState(prev => ({
            ...prev,
            loadedFeeds: loadedCount,
            progress,
            currentAction: `Error processing ${feed.customTitle || 'feed'}`
          }));

          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push({
            url: feed.url,
            error: errorMessage,
            timestamp: Date.now(),
          });

          return {
            url: feed.url,
            articles: [],
            title: feed.customTitle || feed.url,
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
      setFeedResults(prev => {
        const updated = new Map(prev);
        // Merge new results from this batch into the map
        newFeedResults.forEach((result, url) => {
             updated.set(url, result);
        });
        // Update the articles state with the accumulated results
        updateArticlesFromFeedResults(updated);
        return updated;
      });

      // Add delay between batches (except for the last batch)
      if (batchIndex < feedBatches.length - 1) {
        logger.debug(`Waiting ${BATCH_DELAY_MS}ms before next batch`);
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
      }
    }

    const feedPromises = allResults;

    try {
      // Wait for all feeds to complete
      const results = await Promise.allSettled(feedPromises);

      // Update final state
      setFeedResults(newFeedResults);
      updateArticlesFromFeedResults(newFeedResults);

      setLoadingState({
        status: 'success',
        progress: 100,
        loadedFeeds: currentFeeds.length,
        totalFeeds: currentFeeds.length,
        errors,
        isBackgroundRefresh: false,
        currentAction: 'All feeds loaded',
        priorityFeedsLoaded: true,
      });

      const successfulFeeds = results.filter(r => r.status === 'fulfilled' && r.value.success).length;

      // Persist error history to localStorage for future prioritization
      // Persist error history to localStorage for future prioritization
      // We update the errorHistory map based on this run's results
      try {
        // 1. Process successes: Remove from error history (reset count)
        results.forEach(r => {
          if (r.status === 'fulfilled' && r.value.success) {
            errorHistory.delete(r.value.url);
          }
        });

        // 2. Process failures: Increment or add to error history
        errors.forEach(e => {
          const existing = errorHistory.get(e.url);
          errorHistory.set(e.url, {
            failures: (existing?.failures || 0) + 1,
            lastError: Date.now(),
            lastErrorType: e.errorType || 'unknown'
          });
        });

        // 3. Serialize and save map to array
        const historyArray = Array.from(errorHistory.entries()).map(([url, data]) => ({
          url,
          ...data
        }));

        localStorage.setItem(problematicFeedsKey, JSON.stringify(historyArray));
        logger.debug(`Persisted error history for ${historyArray.length} feeds`);
      } catch (err) {
        logger.warn('Failed to save feed error history', err as Error);
      }

      logger.info(`Feed loading completed`, {
        additionalData: {
          totalFeeds: currentFeeds.length,
          successfulFeeds,
          failedFeeds: currentFeeds.length - successfulFeeds,
          errorsCount: errors.length,
          forceRefresh,
          hadValidCache: hasValidCache,
        }
      });

    } catch (error) {
      logger.error('Error during progressive feed loading', error as Error);

      setLoadingState({
        status: 'error',
        progress: 100,
        loadedFeeds: currentFeeds.length,
        totalFeeds: currentFeeds.length,
        errors,
        isBackgroundRefresh: false,
        currentAction: 'Error during loading process',
      });
    }
  }, [getCachedArticlesFromSmartCache, loadSingleFeedWithTimeout, updateArticlesFromFeedResults, logger]);

  /**
   * Retry failed feeds
   */
  const retryFailedFeeds = useCallback(async () => {
    const failedUrls = loadingState.errors.map(error => error.url);
    const failedFeeds = feedsRef.current.filter(feed => failedUrls.includes(feed.url));

    if (failedFeeds.length === 0) return;

    logger.info(`Retrying ${failedFeeds.length} failed feeds`);

    // Reset errors for the feeds we're retrying
    setLoadingState(prev => ({
      ...prev,
      errors: prev.errors.filter(error => !failedUrls.includes(error.url)),
      status: 'loading',
      currentAction: 'Retrying failed feeds...',
    }));

    // Load failed feeds
    const retryPromises = failedFeeds.map(async (feed) => {
      const result = await loadSingleFeedWithTimeout(feed);

      if (result.success) {
        setFeedResults(prev => {
          const updated = new Map(prev);
          updated.set(feed.url, result);
          updateArticlesFromFeedResults(updated);
          return updated;
        });
      } else {
        const errorMessage = result.error || 'Retry failed';
        setLoadingState(prev => ({
          ...prev,
          errors: [...prev.errors, {
            url: feed.url,
            error: errorMessage,
            timestamp: Date.now(),
            feedTitle: result.title,
            errorType: categorizeError(errorMessage),
          }],
        }));
      }

      return result;
    });

    await Promise.allSettled(retryPromises);

    setLoadingState(prev => ({
      ...prev,
      status: 'success',
      currentAction: 'Retry completed',
    }));
  }, [loadingState.errors, loadSingleFeedWithTimeout, updateArticlesFromFeedResults, logger]);

  /**
   * Retry specific feeds by URLs
   */
  const retrySelectedFeeds = useCallback(async (urls: string[]) => {
    const selectedFeeds = feedsRef.current.filter(feed => urls.includes(feed.url));

    if (selectedFeeds.length === 0) return;

    logger.info(`Retrying ${selectedFeeds.length} selected feeds`);

    // Reset errors for the feeds we're retrying
    setLoadingState(prev => ({
      ...prev,
      errors: prev.errors.filter(error => !urls.includes(error.url)),
      status: 'loading',
      currentAction: 'Retrying selected feeds...',
    }));

    // Load selected feeds
    const retryPromises = selectedFeeds.map(async (feed) => {
      const result = await loadSingleFeedWithTimeout(feed);

      if (result.success) {
        setFeedResults(prev => {
          const updated = new Map(prev);
          updated.set(feed.url, result);
          updateArticlesFromFeedResults(updated);
          return updated;
        });
      } else {
        const errorMessage = result.error || 'Retry failed';
        setLoadingState(prev => ({
          ...prev,
          errors: [...prev.errors, {
            url: feed.url,
            error: errorMessage,
            timestamp: Date.now(),
            feedTitle: result.title,
            errorType: categorizeError(errorMessage),
          }],
        }));
      }

      return result;
    });

    await Promise.allSettled(retryPromises);

    setLoadingState(prev => ({
      ...prev,
      status: 'success',
      currentAction: 'Selected retry completed',
    }));
  }, [loadSingleFeedWithTimeout, updateArticlesFromFeedResults, logger]);

  /**
   * Cancel ongoing loading
   */
  const cancelLoading = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setLoadingState(prev => ({
      ...prev,
      status: 'idle',
      currentAction: 'Cancelled by user',
    }));

    logger.info('Feed loading cancelled');
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
    setLoadingState(prev => ({
      ...prev,
      totalFeeds: feeds.length,
    }));

    // TODO: Implementar pré-carregamento inteligente
    // if (feeds.length > 0) {
    //   schedulePreload(feeds);
    // }
  }, [feeds]);

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
