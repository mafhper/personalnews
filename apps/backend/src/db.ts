import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { Database } from "bun:sqlite";
import type {
  CacheStats,
  FeedCategoryItem,
  FeedCollectionItem,
  FeedHealthItem,
  FeedHealthSeverity,
  FeedHealthStatus,
  UserPreferencesV2,
} from "../../../shared/contracts/backend";

const DEFAULT_DB_PATH = resolve(process.cwd(), "apps/backend/data/personalnews.db");

function resolveDefaultBackendMode(): UserPreferencesV2["backendMode"] {
  const value = process.env.BACKEND_DEFAULT_MODE;
  if (value === "on" || value === "off" || value === "auto") {
    return value;
  }
  return "auto";
}

export type FeedCacheRecord = {
  url: string;
  title: string;
  payloadJson: string;
  fetchedAt: string;
  expiresAt: string;
  hitCount: number;
  lastUsedAt: string;
};

export type FeedCacheEntry = {
  url: string;
  title: string;
  fetchedAt: string;
  expiresAt: string;
  lastUsedAt: string;
  hitCount: number;
  payloadBytes: number;
  sourceHost: string | null;
};

export type LocalProxyStats = {
  proxyName: "LocalProxy";
  totalRequests: number;
  successes: number;
  failures: number;
  successRate: number;
  avgResponseMs: number;
  lastUsedAt: string | null;
};

const MIGRATIONS: Array<{ version: number; sql: string }> = [
  {
    version: 1,
    sql: `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        applied_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS feeds (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT NOT NULL UNIQUE,
        category_id TEXT,
        custom_title TEXT,
        hide_from_all INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT,
        "order" INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS preferences (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS feed_cache (
        url TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        fetched_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        hit_count INTEGER NOT NULL DEFAULT 0,
        last_used_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_feed_cache_expires_at ON feed_cache (expires_at);

      CREATE TABLE IF NOT EXISTS proxy_telemetry (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        proxy_name TEXT,
        target_host TEXT,
        success INTEGER NOT NULL,
        response_ms INTEGER,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_proxy_telemetry_created_at ON proxy_telemetry (created_at);
    `,
  },
  {
    version: 2,
    sql: `
      CREATE TABLE IF NOT EXISTS feed_health (
        url TEXT PRIMARY KEY,
        is_valid INTEGER NOT NULL,
        status TEXT NOT NULL,
        severity TEXT NOT NULL,
        title TEXT,
        error TEXT,
        diagnostic TEXT,
        route TEXT,
        checked_at TEXT NOT NULL,
        last_successful_fetch_at TEXT,
        used_cache INTEGER NOT NULL DEFAULT 0,
        response_time_ms INTEGER NOT NULL DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_feed_health_checked_at ON feed_health (checked_at);
    `,
  },
  {
    version: 3,
    sql: `
      ALTER TABLE feeds ADD COLUMN display_order INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE categories ADD COLUMN is_default INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE categories ADD COLUMN is_pinned INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE categories ADD COLUMN description TEXT;
      ALTER TABLE categories ADD COLUMN layout_mode TEXT;
      ALTER TABLE categories ADD COLUMN auto_discovery INTEGER;
      ALTER TABLE categories ADD COLUMN hide_from_all INTEGER NOT NULL DEFAULT 0;
    `,
  },
];

const DEFAULT_SETTINGS: Omit<UserPreferencesV2, "updatedAt"> = {
  backendMode: resolveDefaultBackendMode(),
  windowStyle: "native_thin",
  cacheTtlMinutes: 30,
};

export class BackendDatabase {
  readonly dbPath: string;
  private readonly db: Database;

  constructor(dbPath?: string) {
    this.dbPath = dbPath ? resolve(dbPath) : DEFAULT_DB_PATH;
    mkdirSync(dirname(this.dbPath), { recursive: true });
    this.db = new Database(this.dbPath, { create: true, strict: true });
    this.applyMigrations();
    this.ensureDefaultSettings();
  }

  close() {
    this.db.close();
  }

  getSettings(): UserPreferencesV2 {
    const stmt = this.db.query("SELECT key, value, updated_at FROM preferences");
    const rows = stmt.all() as Array<{ key: string; value: string; updated_at: string }>;
    const bag: Record<string, string> = {};
    let updatedAt = new Date(0).toISOString();

    for (const row of rows) {
      bag[row.key] = row.value;
      if (row.updated_at > updatedAt) {
        updatedAt = row.updated_at;
      }
    }

    return {
      backendMode: (bag.backendMode || DEFAULT_SETTINGS.backendMode) as UserPreferencesV2["backendMode"],
      windowStyle: (bag.windowStyle || DEFAULT_SETTINGS.windowStyle) as UserPreferencesV2["windowStyle"],
      cacheTtlMinutes: Number.parseInt(bag.cacheTtlMinutes || String(DEFAULT_SETTINGS.cacheTtlMinutes), 10),
      updatedAt,
    };
  }

  updateSettings(updates: Partial<UserPreferencesV2>): UserPreferencesV2 {
    const now = new Date().toISOString();
    const insert = this.db.query(
      "INSERT INTO preferences (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at"
    );

    for (const [key, value] of Object.entries(updates)) {
      if (key === "updatedAt" || value === undefined) continue;
      insert.run(key, String(value), now);
    }

    return this.getSettings();
  }

  getCache(url: string): FeedCacheRecord | null {
    const stmt = this.db.query(
      "SELECT url, title, payload_json, fetched_at, expires_at, hit_count, last_used_at FROM feed_cache WHERE url = ?"
    );
    const row = stmt.get(url) as
      | {
          url: string;
          title: string;
          payload_json: string;
          fetched_at: string;
          expires_at: string;
          hit_count: number;
          last_used_at: string;
        }
      | null;

    if (!row) return null;

    return {
      url: row.url,
      title: row.title,
      payloadJson: row.payload_json,
      fetchedAt: row.fetched_at,
      expiresAt: row.expires_at,
      hitCount: row.hit_count,
      lastUsedAt: row.last_used_at,
    };
  }

  touchCacheHit(url: string) {
    const now = new Date().toISOString();
    const stmt = this.db.query(
      "UPDATE feed_cache SET hit_count = hit_count + 1, last_used_at = ? WHERE url = ?"
    );
    stmt.run(now, url);
  }

  setCache(url: string, title: string, payloadJson: string, ttlMinutes: number) {
    const now = new Date();
    const expires = new Date(now.getTime() + ttlMinutes * 60_000);
    const nowIso = now.toISOString();
    const expiresIso = expires.toISOString();

    const stmt = this.db.query(
      "INSERT INTO feed_cache (url, title, payload_json, fetched_at, expires_at, hit_count, last_used_at) VALUES (?, ?, ?, ?, ?, 0, ?) ON CONFLICT(url) DO UPDATE SET title=excluded.title, payload_json=excluded.payload_json, fetched_at=excluded.fetched_at, expires_at=excluded.expires_at, last_used_at=excluded.last_used_at"
    );
    stmt.run(url, title, payloadJson, nowIso, expiresIso, nowIso);
  }

  clearCache(): number {
    const stmt = this.db.query("DELETE FROM feed_cache");
    const result = stmt.run();
    return Number(result.changes || 0);
  }

  getCacheStats(): CacheStats {
    const totals = this.db
      .query(
        "SELECT COUNT(*) as entries, SUM(hit_count) as total_hits, AVG(LENGTH(payload_json)) as avg_bytes, MIN(fetched_at) as oldest, MAX(fetched_at) as newest FROM feed_cache"
      )
      .get() as {
      entries: number;
      total_hits: number | null;
      avg_bytes: number | null;
      oldest: string | null;
      newest: string | null;
    };

    const expired = this.db
      .query("SELECT COUNT(*) as expired FROM feed_cache WHERE expires_at < ?")
      .get(new Date().toISOString()) as { expired: number };

    return {
      entries: totals.entries || 0,
      expired: expired.expired || 0,
      avgPayloadBytes: Number(totals.avg_bytes || 0),
      totalHits: Number(totals.total_hits || 0),
      oldestFetchedAt: totals.oldest || null,
      newestFetchedAt: totals.newest || null,
    };
  }

  getCacheEntries(limit = 50): FeedCacheEntry[] {
    const safeLimit = Math.max(1, Math.min(200, Math.round(limit)));
    const stmt = this.db.query(
      "SELECT url, title, fetched_at, expires_at, last_used_at, hit_count, LENGTH(payload_json) as payload_bytes FROM feed_cache ORDER BY fetched_at DESC LIMIT ?"
    );
    const rows = stmt.all(safeLimit) as Array<{
      url: string;
      title: string;
      fetched_at: string;
      expires_at: string;
      last_used_at: string;
      hit_count: number;
      payload_bytes: number | null;
    }>;

    return rows.map((row) => ({
      sourceHost: this.safeExtractHost(row.url),
      url: row.url,
      title: row.title,
      fetchedAt: row.fetched_at,
      expiresAt: row.expires_at,
      lastUsedAt: row.last_used_at,
      hitCount: row.hit_count,
      payloadBytes: Number(row.payload_bytes || 0),
    }));
  }

  getFeeds(): FeedCollectionItem[] {
    const rows = this.db
      .query(
        "SELECT url, category_id, custom_title, hide_from_all, display_order FROM feeds ORDER BY display_order, id, url"
      )
      .all() as Array<{
      url: string;
      category_id: string | null;
      custom_title: string | null;
      hide_from_all: number;
      display_order: number;
    }>;

    return rows.map((row) => ({
      url: row.url,
      categoryId: row.category_id || undefined,
      customTitle: row.custom_title || undefined,
      hideFromAll: row.hide_from_all === 1 || undefined,
      order: Number(row.display_order || 0),
    }));
  }

  getCategories(): FeedCategoryItem[] {
    const rows = this.db
      .query(
        'SELECT id, name, color, "order", is_default, is_pinned, description, layout_mode, auto_discovery, hide_from_all FROM categories ORDER BY "order", name'
      )
      .all() as Array<{
      id: string;
      name: string;
      color: string | null;
      order: number | null;
      is_default: number;
      is_pinned: number;
      description: string | null;
      layout_mode: string | null;
      auto_discovery: number | null;
      hide_from_all: number;
    }>;

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      color: row.color || undefined,
      order: Number(row.order || 0),
      isDefault: row.is_default === 1 || undefined,
      isPinned: row.is_pinned === 1 || undefined,
      description: row.description || undefined,
      layoutMode: row.layout_mode || undefined,
      autoDiscovery:
        row.auto_discovery === null ? undefined : row.auto_discovery === 1,
      hideFromAll: row.hide_from_all === 1 || undefined,
    }));
  }

  replaceFeedCollection(
    feeds: FeedCollectionItem[],
    categories: FeedCategoryItem[] = [],
  ): { feeds: number; categories: number; updatedAt: string } {
    const now = new Date().toISOString();
    this.db.run("BEGIN");
    try {
      this.db.run("DELETE FROM feeds");
      this.db.run("DELETE FROM categories");

      const insertFeed = this.db.query(
        "INSERT INTO feeds (url, category_id, custom_title, hide_from_all, display_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
      );
      const seenFeeds = new Set<string>();
      for (const [index, feed] of feeds.entries()) {
        if (seenFeeds.has(feed.url)) continue;
        seenFeeds.add(feed.url);
        insertFeed.run(
          feed.url,
          feed.categoryId || null,
          feed.customTitle || null,
          feed.hideFromAll ? 1 : 0,
          feed.order ?? index,
          now,
          now,
        );
      }

      const insertCategory = this.db.query(
        'INSERT INTO categories (id, name, color, "order", is_default, is_pinned, description, layout_mode, auto_discovery, hide_from_all, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      );
      const seenCategories = new Set<string>();
      for (const category of categories) {
        if (seenCategories.has(category.id)) continue;
        seenCategories.add(category.id);
        insertCategory.run(
          category.id,
          category.name,
          category.color || null,
          category.order ?? 0,
          category.isDefault ? 1 : 0,
          category.isPinned ? 1 : 0,
          category.description || null,
          category.layoutMode || null,
          category.autoDiscovery === undefined
            ? null
            : category.autoDiscovery
              ? 1
              : 0,
          category.hideFromAll ? 1 : 0,
          now,
          now,
        );
      }

      this.db.run("COMMIT");
      return { feeds: seenFeeds.size, categories: seenCategories.size, updatedAt: now };
    } catch (error) {
      this.db.run("ROLLBACK");
      throw error;
    }
  }

  replaceCategories(categories: FeedCategoryItem[]): {
    categories: number;
    updatedAt: string;
  } {
    const now = new Date().toISOString();
    this.db.run("BEGIN");
    try {
      this.db.run("DELETE FROM categories");
      const insertCategory = this.db.query(
        'INSERT INTO categories (id, name, color, "order", is_default, is_pinned, description, layout_mode, auto_discovery, hide_from_all, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      );
      const seenCategories = new Set<string>();
      for (const category of categories) {
        if (seenCategories.has(category.id)) continue;
        seenCategories.add(category.id);
        insertCategory.run(
          category.id,
          category.name,
          category.color || null,
          category.order ?? 0,
          category.isDefault ? 1 : 0,
          category.isPinned ? 1 : 0,
          category.description || null,
          category.layoutMode || null,
          category.autoDiscovery === undefined
            ? null
            : category.autoDiscovery
              ? 1
              : 0,
          category.hideFromAll ? 1 : 0,
          now,
          now,
        );
      }
      this.db.run("COMMIT");
      return { categories: seenCategories.size, updatedAt: now };
    } catch (error) {
      this.db.run("ROLLBACK");
      throw error;
    }
  }

  importFeedCollection(
    feeds: FeedCollectionItem[],
    categories: FeedCategoryItem[] = [],
  ): {
    importedFeeds: number;
    skippedFeeds: number;
    importedCategories: number;
    skippedCategories: number;
    updatedAt: string;
  } {
    const now = new Date().toISOString();
    const insertFeed = this.db.query(
      "INSERT INTO feeds (url, category_id, custom_title, hide_from_all, display_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(url) DO NOTHING"
    );
    const insertCategory = this.db.query(
      'INSERT INTO categories (id, name, color, "order", is_default, is_pinned, description, layout_mode, auto_discovery, hide_from_all, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING'
    );
    let importedFeeds = 0;
    let skippedFeeds = 0;
    let importedCategories = 0;
    let skippedCategories = 0;

    this.db.run("BEGIN");
    try {
      for (const [index, feed] of feeds.entries()) {
        const result = insertFeed.run(
          feed.url,
          feed.categoryId || null,
          feed.customTitle || null,
          feed.hideFromAll ? 1 : 0,
          feed.order ?? index,
          now,
          now,
        );
        if (Number(result.changes || 0) > 0) importedFeeds += 1;
        else skippedFeeds += 1;
      }

      for (const category of categories) {
        const result = insertCategory.run(
          category.id,
          category.name,
          category.color || null,
          category.order ?? 0,
          category.isDefault ? 1 : 0,
          category.isPinned ? 1 : 0,
          category.description || null,
          category.layoutMode || null,
          category.autoDiscovery === undefined
            ? null
            : category.autoDiscovery
              ? 1
              : 0,
          category.hideFromAll ? 1 : 0,
          now,
          now,
        );
        if (Number(result.changes || 0) > 0) importedCategories += 1;
        else skippedCategories += 1;
      }

      this.db.run("COMMIT");
    } catch (error) {
      this.db.run("ROLLBACK");
      throw error;
    }

    return {
      importedFeeds,
      skippedFeeds,
      importedCategories,
      skippedCategories,
      updatedAt: now,
    };
  }

  setFeedHealth(item: FeedHealthItem) {
    const stmt = this.db.query(
      "INSERT INTO feed_health (url, is_valid, status, severity, title, error, diagnostic, route, checked_at, last_successful_fetch_at, used_cache, response_time_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(url) DO UPDATE SET is_valid=excluded.is_valid, status=excluded.status, severity=excluded.severity, title=excluded.title, error=excluded.error, diagnostic=excluded.diagnostic, route=excluded.route, checked_at=excluded.checked_at, last_successful_fetch_at=excluded.last_successful_fetch_at, used_cache=excluded.used_cache, response_time_ms=excluded.response_time_ms"
    );
    stmt.run(
      item.url,
      item.isValid ? 1 : 0,
      item.status,
      item.severity,
      item.title || null,
      item.error || null,
      item.diagnostic || null,
      item.route || null,
      item.checkedAt,
      item.lastSuccessfulFetchAt,
      item.usedCache ? 1 : 0,
      item.responseTimeMs,
    );
  }

  getFeedHealth(urls?: string[]): FeedHealthItem[] {
    const rows = (
      urls && urls.length > 0
        ? urls
            .map((url) =>
              this.db
                .query(
                  "SELECT url, is_valid, status, severity, title, error, diagnostic, route, checked_at, last_successful_fetch_at, used_cache, response_time_ms FROM feed_health WHERE url = ?"
                )
                .get(url),
            )
            .filter(Boolean)
        : this.db
            .query(
              "SELECT url, is_valid, status, severity, title, error, diagnostic, route, checked_at, last_successful_fetch_at, used_cache, response_time_ms FROM feed_health ORDER BY checked_at DESC"
            )
            .all()
    ) as Array<{
      url: string;
      is_valid: number;
      status: FeedHealthStatus;
      severity: FeedHealthSeverity;
      title: string | null;
      error: string | null;
      diagnostic: string | null;
      route: string | null;
      checked_at: string;
      last_successful_fetch_at: string | null;
      used_cache: number;
      response_time_ms: number;
    }>;

    return rows.map((row) => ({
      url: row.url,
      isValid: row.is_valid === 1,
      status: row.status,
      severity: row.severity,
      title: row.title || undefined,
      error: row.error || undefined,
      diagnostic: row.diagnostic || undefined,
      route: row.route || undefined,
      checkedAt: row.checked_at,
      lastSuccessfulFetchAt: row.last_successful_fetch_at,
      usedCache: row.used_cache === 1,
      responseTimeMs: Number(row.response_time_ms || 0),
    }));
  }

  recordProxyTelemetry(proxyName: string, targetHost: string, success: boolean, responseMs: number) {
    const stmt = this.db.query(
      "INSERT INTO proxy_telemetry (proxy_name, target_host, success, response_ms, created_at) VALUES (?, ?, ?, ?, ?)"
    );
    stmt.run(proxyName, targetHost, success ? 1 : 0, Math.max(0, Math.round(responseMs)), new Date().toISOString());
  }

  getProxyStats(): LocalProxyStats {
    const row = this.db
      .query(
        "SELECT COUNT(*) as total_requests, SUM(success) as total_success, AVG(response_ms) as avg_response, MAX(created_at) as last_used_at FROM proxy_telemetry WHERE proxy_name = 'LocalProxy'"
      )
      .get() as {
      total_requests: number | null;
      total_success: number | null;
      avg_response: number | null;
      last_used_at: string | null;
    };

    const totalRequests = Number(row?.total_requests || 0);
    const successes = Number(row?.total_success || 0);
    const failures = Math.max(0, totalRequests - successes);
    const successRate = totalRequests > 0 ? (successes / totalRequests) * 100 : 0;

    return {
      proxyName: "LocalProxy",
      totalRequests,
      successes,
      failures,
      successRate,
      avgResponseMs: Number(row?.avg_response || 0),
      lastUsedAt: row?.last_used_at || null,
    };
  }

  importLocalStorageSnapshot(data: Record<string, unknown>): { importedKeys: number; skippedKeys: number } {
    const now = new Date().toISOString();
    const insert = this.db.query(
      "INSERT INTO preferences (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at"
    );

    let imported = 0;
    let skipped = 0;

    for (const [key, value] of Object.entries(data)) {
      if (!key) {
        skipped += 1;
        continue;
      }

      try {
        insert.run(`snapshot:${key}`, JSON.stringify(value), now);
        imported += 1;
      } catch {
        skipped += 1;
      }
    }

    return { importedKeys: imported, skippedKeys: skipped };
  }

  private applyMigrations() {
    this.db.run("CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)");

    for (const migration of MIGRATIONS) {
      const exists = this.db
        .query("SELECT version FROM schema_migrations WHERE version = ?")
        .get(migration.version) as { version: number } | null;

      if (exists) continue;

      this.db.run("BEGIN");
      try {
        this.db.run(migration.sql);
        this.db
          .query("INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)")
          .run(migration.version, new Date().toISOString());
        this.db.run("COMMIT");
      } catch (error) {
        this.db.run("ROLLBACK");
        throw error;
      }
    }
  }

  private ensureDefaultSettings() {
    const now = new Date().toISOString();
    const insert = this.db.query(
      "INSERT INTO preferences (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO NOTHING"
    );

    insert.run("backendMode", DEFAULT_SETTINGS.backendMode, now);
    insert.run("windowStyle", DEFAULT_SETTINGS.windowStyle, now);
    insert.run("cacheTtlMinutes", String(DEFAULT_SETTINGS.cacheTtlMinutes), now);
  }

  private safeExtractHost(url: string): string | null {
    try {
      return new URL(url).hostname || null;
    } catch {
      return null;
    }
  }
}
