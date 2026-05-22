import { afterEach, describe, expect, it, vi } from "vitest";
import { CACHE_POLICY_V1 } from "../services/cachePolicy";
import {
  createSmartFeedCacheMigrationRecord,
  isIndexedDbCacheAvailable,
  migrateSmartFeedCacheToIndexedDb,
} from "../services/indexedDbCache";

describe("indexedDbCache", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("detects when IndexedDB is unavailable", () => {
    expect(isIndexedDbCacheAvailable()).toBe(false);
  });

  it("creates a migration record without parsing or mutating the legacy payload", () => {
    const rawPayload = JSON.stringify({
      entries: [["https://example.com/rss.xml", { timestamp: 123 }]],
    });

    expect(createSmartFeedCacheMigrationRecord(rawPayload, 42)).toEqual({
      key: CACHE_POLICY_V1.keys.smartFeedCache,
      value: rawPayload,
      policyVersion: CACHE_POLICY_V1.version,
      migratedAt: 42,
      updatedAt: 42,
    });
  });

  it("skips migration without removing localStorage when IndexedDB is unavailable", async () => {
    const rawPayload = '{"entries":[]}';
    window.localStorage.setItem(CACHE_POLICY_V1.keys.smartFeedCache, rawPayload);

    await expect(migrateSmartFeedCacheToIndexedDb()).resolves.toEqual({
      status: "skipped",
      reason: "indexeddb-unavailable",
    });
    expect(window.localStorage.getItem(CACHE_POLICY_V1.keys.smartFeedCache)).toBe(
      rawPayload,
    );
  });
});
