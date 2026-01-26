/** @vitest-environment jsdom */
/**
 * [CORE][RACE] Race Conditions Suite
 * 
 * Purpose:
 * - Ensure that stale async responses do NOT overwrite current data.
 * - Validate async ordering safety in feed discovery and loading.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { feedDiscoveryService } from "../services/feedDiscoveryService";
import { proxyManager } from "../services/proxyManager";

// Helper to create a deferred promise that we can resolve manually
function createDeferred<T>() {
  let resolve: (value: T) => void;
  let reject: (reason?: any) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve: resolve!, reject: reject! };
}

vi.mock("../services/proxyManager", () => ({
  proxyManager: {
    tryProxiesWithFailover: vi.fn(),
  },
}));

vi.mock("../services/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debugTag: vi.fn(),
  },
  useLogger: () => ({
    debugTag: vi.fn(),
  })
}));

describe("[CORE][RACE] async ordering safety", () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should ensure later requests take precedence over stale ones", async () => {
    const deferredSlow = createDeferred<any>();
    const deferredFast = createDeferred<any>();

    // Mock implementation based on URL
    vi.mocked(proxyManager.tryProxiesWithFailover).mockImplementation(async (url) => {
      if (url.includes("slow.com")) return deferredSlow.promise;
      if (url.includes("fast.com")) return deferredFast.promise;
      return { content: "", proxyUsed: "None", attempts: [] };
    });

    // Trigger first discovery (Slow)
    const discovery1 = feedDiscoveryService.discoverFromWebsite("https://slow.com");
    
    // Trigger second discovery (Fast)
    const discovery2 = feedDiscoveryService.discoverFromWebsite("https://fast.com");

    // Resolve the second (fast) one first
    const fastResponse = { 
      content: "<html><head><link rel='alternate' type='application/rss+xml' title='Fast' href='https://fast.com/rss' /></head></html>", 
      proxyUsed: "P1", 
      attempts: [] 
    };
    deferredFast.resolve(fastResponse);
    const result2 = await discovery2;

    // Resolve the first (slow) one later
    const slowResponse = { 
      content: "<html><head><link rel='alternate' type='application/rss+xml' title='Slow' href='https://slow.com/rss' /></head></html>", 
      proxyUsed: "P1", 
      attempts: [] 
    };
    deferredSlow.resolve(slowResponse);
    const result1 = await discovery1;

    expect(result2.discoveredFeeds.length).toBeGreaterThan(0);
    expect(result2.discoveredFeeds[0].url).toBe("https://fast.com/rss");
    
    expect(result1.discoveredFeeds.length).toBeGreaterThan(0);
    expect(result1.discoveredFeeds[0].url).toBe("https://slow.com/rss");
  });
});
