import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const runBunStoreScenario = (scenario: string) => {
  const output = execFileSync("bun", ["-e", scenario], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  return JSON.parse(output) as unknown;
};

describe("backend feed collection store", () => {
  it("replaces and imports feeds without duplicates", () => {
    const result = runBunStoreScenario(String.raw`
      import { mkdtempSync, rmSync } from "node:fs";
      import { join } from "node:path";
      import { tmpdir } from "node:os";
      import { BackendDatabase } from "./apps/backend/src/db";

      const dir = mkdtempSync(join(tmpdir(), "personalnews-backend-"));
      const db = new BackendDatabase(join(dir, "personalnews.db"));
      db.replaceFeedCollection(
        [
          { url: "https://example.org/rss.xml", customTitle: "Second" },
          { url: "https://example.com/rss.xml", categoryId: "tech", customTitle: "Example" },
        ],
        [
          {
            id: "tech",
            name: "Tecnologia",
            color: "#38bdf8",
            order: 2,
            isDefault: true,
            layoutMode: "modern",
            autoDiscovery: false,
          },
        ],
      );
      const importResult = db.importFeedCollection([
        { url: "https://example.com/rss.xml", customTitle: "Duplicate" },
        { url: "https://example.net/rss.xml", customTitle: "Third" },
      ]);
      const feeds = db.getFeeds();
      const categories = db.getCategories();
      db.close();
      rmSync(dir, { recursive: true, force: true });
      console.log(JSON.stringify({ importResult, feeds, categories }));
    `) as {
      importResult: { importedFeeds: number; skippedFeeds: number };
      feeds: Array<{ url: string; customTitle?: string }>;
      categories: Array<{ id: string; isDefault?: boolean; layoutMode?: string; autoDiscovery?: boolean }>;
    };

    expect(result.importResult.importedFeeds).toBe(1);
    expect(result.importResult.skippedFeeds).toBe(1);
    expect(result.feeds.map((feed) => feed.url)).toEqual([
      "https://example.org/rss.xml",
      "https://example.com/rss.xml",
      "https://example.net/rss.xml",
    ]);
    expect(result.categories).toEqual([
      expect.objectContaining({
        id: "tech",
        isDefault: true,
        layoutMode: "modern",
        autoDiscovery: false,
      }),
    ]);
  });

  it("stores feed health including degraded cache metadata", () => {
    const result = runBunStoreScenario(String.raw`
      import { mkdtempSync, rmSync } from "node:fs";
      import { join } from "node:path";
      import { tmpdir } from "node:os";
      import { BackendDatabase } from "./apps/backend/src/db";

      const dir = mkdtempSync(join(tmpdir(), "personalnews-backend-"));
      const db = new BackendDatabase(join(dir, "personalnews.db"));
      db.setFeedHealth({
        url: "https://www.youtube.com/feeds/videos.xml?channel_id=abc",
        isValid: true,
        status: "degraded_stale",
        severity: "warning",
        title: "Cached Channel",
        checkedAt: "2026-05-02T10:00:00.000Z",
        lastSuccessfulFetchAt: "2026-05-02T09:50:00.000Z",
        usedCache: true,
        responseTimeMs: 42,
        route: "LocalBackend cache",
        diagnostic: "Falha transitória; cache recente mantido.",
      });
      const health = db.getFeedHealth();
      db.close();
      rmSync(dir, { recursive: true, force: true });
      console.log(JSON.stringify(health));
    `) as Array<{
      status: string;
      severity: string;
      usedCache: boolean;
      lastSuccessfulFetchAt: string | null;
    }>;

    expect(result).toEqual([
      expect.objectContaining({
        status: "degraded_stale",
        severity: "warning",
        usedCache: true,
        lastSuccessfulFetchAt: "2026-05-02T09:50:00.000Z",
      }),
    ]);
  });

  it("replaces categories without rewriting the feed collection", () => {
    const result = runBunStoreScenario(String.raw`
      import { mkdtempSync, rmSync } from "node:fs";
      import { join } from "node:path";
      import { tmpdir } from "node:os";
      import { BackendDatabase } from "./apps/backend/src/db";

      const dir = mkdtempSync(join(tmpdir(), "personalnews-backend-"));
      const db = new BackendDatabase(join(dir, "personalnews.db"));
      db.replaceFeedCollection([
        { url: "https://example.org/rss.xml", customTitle: "First" },
      ]);
      db.replaceCategories([
        { id: "analysis", name: "Análise", color: "#22c55e", order: 1 },
      ]);
      const feeds = db.getFeeds();
      const categories = db.getCategories();
      db.close();
      rmSync(dir, { recursive: true, force: true });
      console.log(JSON.stringify({ feeds, categories }));
    `) as {
      feeds: Array<{ url: string }>;
      categories: Array<{ id: string }>;
    };

    expect(result.feeds.map((feed) => feed.url)).toEqual([
      "https://example.org/rss.xml",
    ]);
    expect(result.categories.map((category) => category.id)).toEqual([
      "analysis",
    ]);
  });
});
