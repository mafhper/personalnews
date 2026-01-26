/** @vitest-environment jsdom */
/**
 * [CORE][NEGATIVE] Negative Behavior Suite
 * 
 * Purpose:
 * - Ensure forbidden side effects do NOT occur.
 * - Validate system stability under invalid or redundant actions.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ArticleCache } from "../services/articleCache";
import { logger } from "../services/logger";

// Mock logger to catch side effects
vi.mock("../services/logger", () => ({
  logger: {
    debugTag: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("[CORE][NEGATIVE] forbidden side effects", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("should NOT log 'evicted' articles when clearing an empty cache", () => {
    const cache = new ArticleCache();
    
    // Ensure cache is empty
    expect(cache.size()).toBe(0);
    vi.mocked(logger.debugTag).mockClear();

    // Act
    cache.cleanup();

    // Assert: No eviction log should have been triggered
    const calls = vi.mocked(logger.debugTag).mock.calls;
    const hasEvictionLog = calls.some(call => call[1].includes("Evicted"));
    
    expect(hasEvictionLog).toBe(false);
  });

  it("should NOT trigger multiple auto-cleanup intervals if started twice", () => {
    const cache = new ArticleCache({ autoCleanupInterval: 1000 });
    
    // Already started by constructor
    vi.mocked(logger.debugTag).mockClear();

    // Act: Start again
    cache.startAutoCleanup();

    // Assert: No new "Started automatic cache cleanup" log
    const calls = vi.mocked(logger.debugTag).mock.calls;
    const startLogs = calls.filter(call => call[1].includes("Started automatic cache cleanup"));
    
    expect(startLogs.length).toBe(0);
  });

  it("should NOT throw or log errors when deleting a non-existent item", () => {
    const cache = new ArticleCache();
    
    // Act
    const result = cache.delete("non-existent", "Source");

    // Assert
    expect(result).toBe(false);
    expect(logger.error).not.toHaveBeenCalled();
  });
});
