import { CACHE_POLICY_V1 } from "./cachePolicy";

export const INDEXEDDB_CACHE_DB_NAME = "personalnews-cache";
export const INDEXEDDB_CACHE_STORE_NAME = "cache-records";
export const INDEXEDDB_CACHE_DB_VERSION = 1;

export interface IndexedDbCacheRecord {
  key: string;
  value: string;
  policyVersion: number;
  migratedAt?: number;
  updatedAt: number;
}

export type IndexedDbMigrationResult =
  | { status: "migrated"; key: string; removedLegacy: boolean }
  | {
      status: "skipped";
      reason: "indexeddb-unavailable" | "legacy-cache-missing";
    };

export const isIndexedDbCacheAvailable = (): boolean =>
  typeof window !== "undefined" && typeof window.indexedDB !== "undefined";

const openIndexedDbCache = (): Promise<IDBDatabase> => {
  if (!isIndexedDbCacheAvailable()) {
    return Promise.reject(new Error("IndexedDB is not available"));
  }

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(
      INDEXEDDB_CACHE_DB_NAME,
      INDEXEDDB_CACHE_DB_VERSION,
    );

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(INDEXEDDB_CACHE_STORE_NAME)) {
        db.createObjectStore(INDEXEDDB_CACHE_STORE_NAME, { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      reject(request.error ?? new Error("Failed to open IndexedDB cache"));
    };
  });
};

export const createSmartFeedCacheMigrationRecord = (
  rawLegacyPayload: string,
  now = Date.now(),
): IndexedDbCacheRecord => ({
  key: CACHE_POLICY_V1.keys.smartFeedCache,
  value: rawLegacyPayload,
  policyVersion: CACHE_POLICY_V1.version,
  migratedAt: now,
  updatedAt: now,
});

export const putIndexedDbCacheRecord = async (
  record: IndexedDbCacheRecord,
): Promise<void> => {
  const db = await openIndexedDbCache();

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(INDEXEDDB_CACHE_STORE_NAME, "readwrite");
      const store = transaction.objectStore(INDEXEDDB_CACHE_STORE_NAME);
      store.put(record);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => {
        reject(transaction.error ?? new Error("Failed to write cache record"));
      };
      transaction.onabort = () => {
        reject(transaction.error ?? new Error("Cache record write was aborted"));
      };
    });
  } finally {
    db.close();
  }
};

export const getIndexedDbCacheRecord = async (
  key: string,
): Promise<IndexedDbCacheRecord | null> => {
  const db = await openIndexedDbCache();

  try {
    return await new Promise<IndexedDbCacheRecord | null>((resolve, reject) => {
      const transaction = db.transaction(INDEXEDDB_CACHE_STORE_NAME, "readonly");
      const store = transaction.objectStore(INDEXEDDB_CACHE_STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve((request.result as IndexedDbCacheRecord | undefined) ?? null);
      };
      request.onerror = () => {
        reject(transaction.error ?? new Error("Failed to read cache record"));
      };
    });
  } finally {
    db.close();
  }
};

export const migrateSmartFeedCacheToIndexedDb = async (
  options: { removeLegacy?: boolean } = {},
): Promise<IndexedDbMigrationResult> => {
  if (!isIndexedDbCacheAvailable()) {
    return { status: "skipped", reason: "indexeddb-unavailable" };
  }

  const legacyPayload = window.localStorage.getItem(
    CACHE_POLICY_V1.keys.smartFeedCache,
  );

  if (!legacyPayload) {
    return { status: "skipped", reason: "legacy-cache-missing" };
  }

  await putIndexedDbCacheRecord(
    createSmartFeedCacheMigrationRecord(legacyPayload),
  );

  if (options.removeLegacy) {
    window.localStorage.removeItem(CACHE_POLICY_V1.keys.smartFeedCache);
  }

  return {
    status: "migrated",
    key: CACHE_POLICY_V1.keys.smartFeedCache,
    removedLegacy: options.removeLegacy === true,
  };
};
