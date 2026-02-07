/**
 * Performance monitoring utilities for tracking feed loading, pagination, and application performance
 * Implements requirements 7.1, 7.2, 7.3, 7.4
 */

import { logger } from "./logger";

export interface PerformanceMetric {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
  status: "pending" | "completed" | "failed";
  error?: string;
}

export interface FeedLoadingMetric extends PerformanceMetric {
  feedUrl: string;
  articleCount?: number;
  cacheHit?: boolean;
  retryCount?: number;
}

export interface PaginationMetric extends PerformanceMetric {
  fromPage: number;
  toPage: number;
  totalArticles: number;
  renderTime?: number;
}

export interface ApplicationMetric extends PerformanceMetric {
  type: "app-load" | "theme-change" | "search" | "filter";
  componentCount?: number;
  memoryUsage?: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private feedMetrics: FeedLoadingMetric[] = [];
  private paginationMetrics: PaginationMetric[] = [];
  private applicationMetrics: ApplicationMetric[] = [];
  private isEnabled: boolean = true;
  private logToConsole: boolean = true;

  constructor() {
    // Enable performance monitoring in development
    this.isEnabled =
      import.meta.env.DEV ||
      localStorage.getItem("performance-debug") === "true";
    this.logToConsole = this.isEnabled;

    if (this.isEnabled) {
      this.initializePerformanceObserver();
      this.logSystemInfo();
    }
  }

  /**
   * Start timing a performance metric
   * Requirement 7.1: Measure and log loading times
   */
  startTiming(
    id: string,
    name: string,
    metadata?: Record<string, unknown>,
  ): void {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      id,
      name,
      startTime: performance.now(),
      status: "pending",
      metadata,
    };

    this.metrics.set(id, metric);

    if (this.logToConsole) {
      logger.debugTag("PERF", `Started: ${name}`, metadata);
    }
  }

  /**
   * End timing a performance metric
   * Requirement 7.1: Measure and log loading times
   */
  endTiming(
    id: string,
    additionalMetadata?: Record<string, unknown>,
  ): PerformanceMetric | null {
    if (!this.isEnabled) return null;

    const metric = this.metrics.get(id);
    if (!metric) {
      console.warn(`[Performance] Metric not found: ${id}`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    const completedMetric: PerformanceMetric = {
      ...metric,
      endTime,
      duration,
      status: "completed",
      metadata: { ...metric.metadata, ...additionalMetadata },
    };

    this.metrics.set(id, completedMetric);

    if (this.logToConsole) {
      logger.debugTag(
        "PERF",
        `Completed: ${metric.name} (${duration.toFixed(2)}ms)`,
        completedMetric.metadata,
      );
    }

    return completedMetric;
  }

  /**
   * Mark a metric as failed with error details
   * Requirement 7.3: Log error details for debugging
   */
  markFailed(
    id: string,
    error: string,
    additionalMetadata?: Record<string, unknown>,
  ): PerformanceMetric | null {
    if (!this.isEnabled) return null;

    const metric = this.metrics.get(id);
    if (!metric) {
      console.warn(`[Performance] Metric not found: ${id}`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    const failedMetric: PerformanceMetric = {
      ...metric,
      endTime,
      duration,
      status: "failed",
      error,
      metadata: { ...metric.metadata, ...additionalMetadata },
    };

    this.metrics.set(id, failedMetric);

    if (this.logToConsole) {
      console.error(
        `❌ [Performance] Failed: ${metric.name} (${duration.toFixed(2)}ms)`,
        {
          error,
          ...failedMetric.metadata,
        },
      );
    }

    return failedMetric;
  }

  /**
   * Track feed loading performance
   * Requirement 7.2: Record response time for each feed
   */
  trackFeedLoading(
    feedUrl: string,
    options?: {
      cacheHit?: boolean;
      retryCount?: number;
    },
  ): string {
    const id = `feed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    this.startTiming(id, `Feed Loading: ${feedUrl}`, {
      feedUrl,
      type: "feed-loading",
      ...options,
    });

    return id;
  }

  /**
   * Complete feed loading tracking
   * Requirement 7.2: Record response time for each feed
   */
  completeFeedLoading(
    id: string,
    articleCount: number,
    additionalData?: Record<string, unknown>,
  ): void {
    const metric = this.endTiming(id, { articleCount, ...additionalData });

    if (metric) {
      const feedMetric: FeedLoadingMetric = {
        ...metric,
        feedUrl:
          typeof metric.metadata?.feedUrl === "string"
            ? metric.metadata.feedUrl
            : "unknown",
        articleCount,
        cacheHit:
          typeof metric.metadata?.cacheHit === "boolean"
            ? metric.metadata.cacheHit
            : false,
        retryCount:
          typeof metric.metadata?.retryCount === "number"
            ? metric.metadata.retryCount
            : 0,
      };

      this.feedMetrics.push(feedMetric);
      this.trimMetricsArray(this.feedMetrics, 100); // Keep last 100 feed metrics
    }
  }

  /**
   * Mark feed loading as failed
   * Requirement 7.3: Log error details for debugging
   */
  failFeedLoading(
    id: string,
    error: string,
    additionalData?: Record<string, unknown>,
  ): void {
    const metric = this.markFailed(id, error, additionalData);

    if (metric && metric.metadata?.type === "feed-loading") {
      const feedMetric: FeedLoadingMetric = {
        ...metric,
        feedUrl:
          typeof metric.metadata?.feedUrl === "string"
            ? metric.metadata.feedUrl
            : "unknown",
        articleCount: 0,
        cacheHit:
          typeof metric.metadata?.cacheHit === "boolean"
            ? metric.metadata.cacheHit
            : false,
        retryCount:
          typeof metric.metadata?.retryCount === "number"
            ? metric.metadata.retryCount
            : 0,
      };

      this.feedMetrics.push(feedMetric);
      this.trimMetricsArray(this.feedMetrics, 100); // Keep last 100 feed metrics
    }
  }

  /**
   * Track pagination performance
   * Requirement 7.1: Measure pagination performance
   */
  trackPagination(
    fromPage: number,
    toPage: number,
    totalArticles: number,
  ): string {
    const id = `pagination-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    this.startTiming(id, `Pagination: ${fromPage} → ${toPage}`, {
      fromPage,
      toPage,
      totalArticles,
      type: "pagination",
    });

    return id;
  }

  /**
   * Complete pagination tracking
   */
  completePagination(id: string, renderTime?: number): void {
    const metric = this.endTiming(id, { renderTime });

    if (metric) {
      const paginationMetric: PaginationMetric = {
        ...metric,
        fromPage:
          typeof metric.metadata?.fromPage === "number"
            ? metric.metadata.fromPage
            : 0,
        toPage:
          typeof metric.metadata?.toPage === "number"
            ? metric.metadata.toPage
            : 0,
        totalArticles:
          typeof metric.metadata?.totalArticles === "number"
            ? metric.metadata.totalArticles
            : 0,
        renderTime,
      };

      this.paginationMetrics.push(paginationMetric);
      this.trimMetricsArray(this.paginationMetrics, 50); // Keep last 50 pagination metrics
    }
  }

  /**
   * Track application-level performance
   * Requirement 7.1: Measure application loading times
   */
  trackApplication(type: ApplicationMetric["type"], name?: string): string {
    const id = `app-${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    this.startTiming(id, name || `Application: ${type}`, {
      type,
      memoryUsage: this.getMemoryUsage(),
    });

    return id;
  }

  /**
   * Complete application tracking
   */
  completeApplication(
    id: string,
    additionalData?: Record<string, unknown>,
  ): void {
    const metric = this.endTiming(id, {
      memoryUsage: this.getMemoryUsage(),
      ...additionalData,
    });

    if (metric) {
      const appMetric: ApplicationMetric = {
        ...metric,
        type:
          typeof metric.metadata?.type === "string" &&
          ["app-load", "theme-change", "search", "filter"].includes(
            metric.metadata.type as string,
          )
            ? (metric.metadata.type as ApplicationMetric["type"])
            : "app-load",
        componentCount:
          typeof metric.metadata?.componentCount === "number"
            ? metric.metadata.componentCount
            : undefined,
        memoryUsage:
          typeof metric.metadata?.memoryUsage === "number"
            ? metric.metadata.memoryUsage
            : undefined,
      };

      this.applicationMetrics.push(appMetric);
      this.trimMetricsArray(this.applicationMetrics, 50); // Keep last 50 app metrics
    }
  }

  /**
   * Mark application operation as failed
   * Requirement 7.3: Log error details for debugging
   */
  failApplication(
    id: string,
    error: string,
    additionalData?: Record<string, unknown>,
  ): void {
    const metric = this.markFailed(id, error, {
      memoryUsage: this.getMemoryUsage(),
      ...additionalData,
    });

    if (metric) {
      const appMetric: ApplicationMetric = {
        ...metric,
        type:
          typeof metric.metadata?.type === "string" &&
          ["app-load", "theme-change", "search", "filter"].includes(
            metric.metadata.type as string,
          )
            ? (metric.metadata.type as ApplicationMetric["type"])
            : "app-load",
        componentCount:
          typeof metric.metadata?.componentCount === "number"
            ? metric.metadata.componentCount
            : undefined,
        memoryUsage:
          typeof metric.metadata?.memoryUsage === "number"
            ? metric.metadata.memoryUsage
            : undefined,
      };

      this.applicationMetrics.push(appMetric);
      this.trimMetricsArray(this.applicationMetrics, 50); // Keep last 50 app metrics
    }
  }

  /**
   * Get performance summary
   * Requirement 7.4: Provide performance metrics
   */
  getPerformanceSummary(): {
    feeds: {
      total: number;
      successful: number;
      failed: number;
      averageLoadTime: number;
      slowestFeed: FeedLoadingMetric | null;
      fastestFeed: FeedLoadingMetric | null;
      cacheHitRate: number;
    };
    pagination: {
      total: number;
      averageNavigationTime: number;
      slowestNavigation: PaginationMetric | null;
    };
    application: {
      total: number;
      averageLoadTime: number;
      memoryTrend: number[];
    };
  } {
    const successfulFeeds = this.feedMetrics.filter(
      (m) => m.status === "completed",
    );
    const failedFeeds = this.feedMetrics.filter((m) => m.status === "failed");
    const cacheHits = this.feedMetrics.filter((m) => m.cacheHit).length;

    const feedLoadTimes = successfulFeeds.map((m) => m.duration || 0);
    const paginationTimes = this.paginationMetrics.map((m) => m.duration || 0);
    const appLoadTimes = this.applicationMetrics.map((m) => m.duration || 0);

    return {
      feeds: {
        total: this.feedMetrics.length,
        successful: successfulFeeds.length,
        failed: failedFeeds.length,
        averageLoadTime: this.calculateAverage(feedLoadTimes),
        slowestFeed: this.findSlowest(
          this.feedMetrics,
        ) as FeedLoadingMetric | null,
        fastestFeed: this.findFastest(
          this.feedMetrics,
        ) as FeedLoadingMetric | null,
        cacheHitRate:
          this.feedMetrics.length > 0
            ? (cacheHits / this.feedMetrics.length) * 100
            : 0,
      },
      pagination: {
        total: this.paginationMetrics.length,
        averageNavigationTime: this.calculateAverage(paginationTimes),
        slowestNavigation: this.findSlowest(
          this.paginationMetrics,
        ) as PaginationMetric | null,
      },
      application: {
        total: this.applicationMetrics.length,
        averageLoadTime: this.calculateAverage(appLoadTimes),
        memoryTrend: this.applicationMetrics
          .slice(-10)
          .map((m) => m.memoryUsage || 0),
      },
    };
  }

  /**
   * Log performance summary to console
   * Requirement 7.4: Provide performance metrics via console
   */
  public logPerformanceSummary(): void {
    const summary = this.getPerformanceSummary();

    logger.debugTag("PERF", "Performance Summary", {
      feeds: {
        total: summary.feeds.total,
        successRate:
          summary.feeds.total > 0
            ? ((summary.feeds.successful / summary.feeds.total) * 100).toFixed(
                1,
              ) + "%"
            : "0%",
        avgLoadTime: summary.feeds.averageLoadTime.toFixed(2) + "ms",
        cacheHitRate: summary.feeds.cacheHitRate.toFixed(1) + "%",
        slowestFeed: summary.feeds.slowestFeed,
      },
      pagination: {
        total: summary.pagination.total,
        avgNavTime: summary.pagination.averageNavigationTime.toFixed(2) + "ms",
      },
      application: {
        total: summary.application.total,
        avgOpTime: summary.application.averageLoadTime.toFixed(2) + "ms",
        currentMemory: this.getMemoryUsage().toFixed(2) + "MB",
      },
    });
  }

  /**
   * Get all metrics for debugging
   * Requirement 7.4: Provide performance metrics for debugging
   */
  getAllMetrics(): {
    feeds: FeedLoadingMetric[];
    pagination: PaginationMetric[];
    application: ApplicationMetric[];
    active: PerformanceMetric[];
  } {
    return {
      feeds: [...this.feedMetrics],
      pagination: [...this.paginationMetrics],
      application: [...this.applicationMetrics],
      active: Array.from(this.metrics.values()).filter(
        (m) => m.status === "pending",
      ),
    };
  }

  /**
   * Clear all metrics
   */
  public clearMetrics(): void {
    this.metrics.clear();
    this.feedMetrics = [];
    this.paginationMetrics = [];
    this.applicationMetrics = [];
    if (this.logToConsole) {
      logger.debugTag("PERF", "All metrics cleared");
    }
  }

  /**
   * Enable/disable performance monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    this.logToConsole = enabled;

    if (enabled) {
      localStorage.setItem("performance-debug", "true");
    } else {
      localStorage.removeItem("performance-debug");
    }
  }

  // Private helper methods

  private initializePerformanceObserver(): void {
    if (typeof PerformanceObserver !== "undefined") {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.entryType === "navigation") {
              const navEntry = entry as PerformanceNavigationTiming;
              console.log(`🌐 [Performance] Navigation timing:`, {
                domContentLoaded:
                  navEntry.domContentLoadedEventEnd -
                  navEntry.domContentLoadedEventStart,
                loadComplete: navEntry.loadEventEnd - navEntry.loadEventStart,
                totalTime: navEntry.loadEventEnd - navEntry.fetchStart,
              });
            }
          });
        });

        observer.observe({ entryTypes: ["navigation", "measure"] });
      } catch (error) {
        console.warn("[Performance] PerformanceObserver not supported:", error);
      }
    }
  }

  private logSystemInfo(): void {
    const info = {
      userAgent: navigator.userAgent,
      memory: this.getMemoryUsage(),
      connection:
        (navigator as Navigator & { connection?: { effectiveType?: string } })
          .connection?.effectiveType || "unknown",
      hardwareConcurrency: navigator.hardwareConcurrency || "unknown",
    };

    // Use console instead of logger during initialization to avoid circular dependency/TDZ issues
    if (import.meta.env.DEV) {
      console.debug("[PERF-DEBUG] System info", info);
    }
  }

  private getMemoryUsage(): number {
    if ("memory" in performance) {
      return (
        (performance as Performance & { memory: { usedJSHeapSize: number } })
          .memory.usedJSHeapSize /
        1024 /
        1024
      ); // MB
    }
    return 0;
  }

  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }

  private findSlowest(metrics: PerformanceMetric[]): PerformanceMetric | null {
    if (metrics.length === 0) return null;
    return metrics.reduce((slowest, current) =>
      (current.duration || 0) > (slowest.duration || 0) ? current : slowest,
    );
  }

  private findFastest(metrics: PerformanceMetric[]): PerformanceMetric | null {
    if (metrics.length === 0) return null;
    return metrics.reduce((fastest, current) =>
      (current.duration || 0) < (fastest.duration || 0) ? current : fastest,
    );
  }

  private trimMetricsArray<T>(array: T[], maxLength: number): void {
    if (array.length > maxLength) {
      array.splice(0, array.length - maxLength);
    }
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Expose to window for debugging in development
if (import.meta.env.DEV) {
  (
    window as Window &
      typeof globalThis & { performanceMonitor?: PerformanceMonitor }
  ).performanceMonitor = performanceMonitor;
}

// Helper functions for common use cases

/**
 * Measure execution time of an async function
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>,
  metadata?: Record<string, unknown>,
): Promise<T> {
  const id = performanceMonitor.trackApplication("app-load", name);

  try {
    const result = await fn();
    performanceMonitor.completeApplication(id, metadata);
    return result;
  } catch (error) {
    performanceMonitor.failApplication(
      id,
      error instanceof Error ? error.message : String(error),
      metadata,
    );
    throw error;
  }
}

/**
 * Measure execution time of a synchronous function
 */
export function measureSync<T>(
  name: string,
  fn: () => T,
  metadata?: Record<string, unknown>,
): T {
  const id = performanceMonitor.trackApplication("app-load", name);

  try {
    const result = fn();
    performanceMonitor.completeApplication(id, metadata);
    return result;
  } catch (error) {
    performanceMonitor.failApplication(
      id,
      error instanceof Error ? error.message : String(error),
      metadata,
    );
    throw error;
  }
}
