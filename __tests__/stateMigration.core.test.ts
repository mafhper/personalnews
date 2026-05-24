/**
 * [CORE][MIGRATION] State Migration Suite
 *
 * Purpose:
 * - Ensure old localStorage/store formats are correctly migrated.
 * - Protect data integrity across versions.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { DEFAULT_FEEDS } from "../constants/curatedFeeds";
import { migrateFeeds } from "../utils/feedMigration";
import { FeedSource } from "../types";

describe("[CORE][MIGRATION] state migration logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with defaults if current feeds are empty", () => {
    const result = migrateFeeds([]);
    expect(result.migrated).toBe(true);
    expect(result.feeds.length).toBeGreaterThan(0);
    expect(result.reason).toContain("default feeds");
  });

  it("should add categoryId to legacy feeds that match default feeds", () => {
    const legacyFeeds: any[] = [
      {
        url: "https://www.xda-developers.com/feed/",
        title: "XDA",
        // categoryId is missing
      }
    ];

    const result = migrateFeeds(legacyFeeds as FeedSource[]);

    expect(result.migrated).toBe(true);
    expect(result.feeds[0].categoryId).toBeDefined();
    expect(result.feeds[0].categoryId).toBe("tech");
  });

  it("should NOT migrate if the full default collection is already up to date", () => {
    const upToDateFeeds: FeedSource[] = DEFAULT_FEEDS.map((feed) => ({
      ...feed,
    }));

    const result = migrateFeeds(upToDateFeeds);

    expect(result.migrated).toBe(false);
    expect(result.feeds).toBe(upToDateFeeds);
  });

  it("should preserve user-added feeds that are not in defaults", () => {
    const customFeed: FeedSource = {
      url: "https://my-custom-blog.com/feed",
      title: "My Blog",
      categoryId: "personal",
      active: true
    };

    const result = migrateFeeds([customFeed]);

    expect(result.feeds).toContainEqual(customFeed);
  });

  it("should repair missing initial feeds in a saved collection", () => {
    const defaultYouTubeFeeds = DEFAULT_FEEDS.filter(
      (feed) => feed.categoryId === "youtube",
    );
    const oldCollection: FeedSource[] = [defaultYouTubeFeeds[0]];

    const result = migrateFeeds(oldCollection);
    const migratedYouTubeFeeds = result.feeds.filter(
      (feed) => feed.categoryId === "youtube",
    );

    expect(result.migrated).toBe(true);
    expect(migratedYouTubeFeeds).toHaveLength(defaultYouTubeFeeds.length);
    expect(migratedYouTubeFeeds.map((feed) => feed.url)).toEqual(
      defaultYouTubeFeeds.map((feed) => feed.url),
    );
  });

  it("should preserve distinct YouTube channel feeds during dedupe", () => {
    const defaultYouTubeFeeds = DEFAULT_FEEDS.filter(
      (feed) => feed.categoryId === "youtube",
    );
    const collectionWithMetadataDrift = DEFAULT_FEEDS.map((feed, index) =>
      index === 0 ? { ...feed, customTitle: undefined } : { ...feed },
    );

    const result = migrateFeeds(collectionWithMetadataDrift);
    const migratedYouTubeFeeds = result.feeds.filter(
      (feed) => feed.categoryId === "youtube",
    );

    expect(result.migrated).toBe(true);
    expect(migratedYouTubeFeeds).toHaveLength(defaultYouTubeFeeds.length);
    expect(new Set(migratedYouTubeFeeds.map((feed) => feed.url)).size).toBe(
      defaultYouTubeFeeds.length,
    );
  });

  it("should still deduplicate truly equivalent feed URLs", () => {
    const xdaFeed = DEFAULT_FEEDS.find((feed) =>
      feed.url.includes("xda-developers.com"),
    );
    expect(xdaFeed).toBeDefined();

    const result = migrateFeeds([
      { ...xdaFeed! },
      {
        ...xdaFeed!,
        url: `${xdaFeed!.url}?utm_source=newsletter#top`,
      },
    ]);

    expect(result.migrated).toBe(true);
    expect(
      result.feeds.filter((feed) => feed.url.includes("xda-developers.com")),
    ).toHaveLength(1);
  });

  it("should migrate stale Foro de Teresina post feeds to the podcast RSS", () => {
    const staleForoFeed: FeedSource = {
      url: "https://piaui.folha.uol.com.br/feed/",
      customTitle: "Foro de Teresina",
      categoryId: "politics",
    };

    const result = migrateFeeds([staleForoFeed]);

    expect(result.migrated).toBe(true);
    expect(result.feeds[0]).toMatchObject({
      url: "https://feeds.megaphone.fm/NPP2619427256",
      customTitle: "Foro de Teresina",
      categoryId: "podcasts",
      hideFromAll: true,
    });
  });

  it("should not replace custom Foro feeds that are not known stale URLs", () => {
    const customForoFeed: FeedSource = {
      url: "https://example.com/proxy/foro-de-teresina.xml",
      customTitle: "Foro de Teresina",
      categoryId: "podcasts",
      active: true,
    };
    const feeds = [customForoFeed];

    const result = migrateFeeds(feeds);

    expect(result.feeds).toContainEqual(customForoFeed);
    expect(
      result.feeds.filter(
        (feed) => feed.url === "https://feeds.megaphone.fm/NPP2619427256",
      ),
    ).toHaveLength(1);
  });

  it("should deduplicate feeds after a stale Foro feed is canonicalized", () => {
    const staleForoFeed: FeedSource = {
      url: "https://piaui.folha.uol.com.br/feed/",
      customTitle: "Foro de Teresina",
      categoryId: "politics",
    };
    const canonicalForoFeed: FeedSource = {
      url: "https://feeds.megaphone.fm/NPP2619427256",
      customTitle: "Foro de Teresina",
      categoryId: "podcasts",
      hideFromAll: true,
    };

    const result = migrateFeeds([staleForoFeed, canonicalForoFeed]);

    expect(result.migrated).toBe(true);
    expect(
      result.feeds.filter(
        (feed) => feed.url === "https://feeds.megaphone.fm/NPP2619427256",
      ),
    ).toHaveLength(1);
  });
});
