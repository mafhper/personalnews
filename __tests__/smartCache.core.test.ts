import { beforeEach, describe, expect, it, vi } from "vitest";
import { SmartCache } from "../services/smartCache";
import type { Article } from "../types";

const article: Article = {
  title: "Cached article",
  link: "https://example.com/article",
  pubDate: new Date("2026-05-24T12:00:00.000Z"),
  sourceTitle: "Example",
  description: "Cached description",
};

describe("SmartCache cache-management behavior", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("applies dynamic policy values without recreating the cache", () => {
    const cache = new SmartCache({
      enablePersistence: false,
      ttl: 1000,
      maxEntries: 2,
      enableStaleWhileRevalidate: 2000,
    });

    cache.set("https://example.com/1.xml", [article], "One");
    cache.set("https://example.com/2.xml", [article], "Two");
    cache.applyPolicy({
      version: 1,
      feedFreshTtlMinutes: 5,
      staleWhileRevalidateMinutes: 15,
      respectHttpValidators: true,
      offlineFallback: true,
      maxStorageMb: 50,
      maxFeedEntries: 1,
      articleMaxAgeHours: 24,
      articleMaxEntries: 500,
    });

    expect(cache.getStats().totalEntries).toBe(1);
  });

  it("stores validators and refreshes timestamps after 304 responses", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-24T12:00:00.000Z"));
    const cache = new SmartCache({
      enablePersistence: false,
      ttl: 1000,
      maxEntries: 10,
      enableStaleWhileRevalidate: 10_000,
    });
    const headers = new Headers({
      etag: '"v1"',
      "last-modified": "Sun, 24 May 2026 12:00:00 GMT",
    });

    cache.set("https://example.com/rss.xml", [article], "Example", headers);
    const initialMetadata = cache.getMetadata("https://example.com/rss.xml");
    vi.setSystemTime(new Date("2026-05-24T12:05:00.000Z"));

    const cachedArticles = cache.markNotModified(
      "https://example.com/rss.xml",
      headers,
    );
    const nextMetadata = cache.getMetadata("https://example.com/rss.xml");

    expect(cachedArticles).toHaveLength(1);
    expect(cache.getValidators("https://example.com/rss.xml")).toEqual({
      etag: '"v1"',
      lastModified: "Sun, 24 May 2026 12:00:00 GMT",
    });
    expect(nextMetadata?.timestamp).toBeGreaterThan(
      initialMetadata?.timestamp ?? 0,
    );
    expect(cache.getStats()).toMatchObject({
      revalidations: 1,
      notModified: 1,
    });
    vi.useRealTimers();
  });

  it("removes persisted storage when clearing with removeStorage", () => {
    vi.useFakeTimers();
    const cache = new SmartCache({
      enablePersistence: true,
      ttl: 1000,
      maxEntries: 10,
      enableStaleWhileRevalidate: 10_000,
    });

    cache.set("https://example.com/rss.xml", [article], "Example");
    vi.advanceTimersByTime(2000);
    expect(window.localStorage.getItem("smart-feed-cache-v2")).not.toBeNull();

    cache.clear({ removeStorage: true });
    vi.advanceTimersByTime(2000);

    expect(cache.getStats().totalEntries).toBe(0);
    expect(window.localStorage.getItem("smart-feed-cache-v2")).toBeNull();
    vi.useRealTimers();
  });
});
