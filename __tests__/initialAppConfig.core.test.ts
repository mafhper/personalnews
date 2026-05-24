import { describe, expect, it } from "vitest";
import { DEFAULT_ARTICLE_LAYOUT, DEFAULT_CONTENT_CONFIG, DEFAULT_HEADER_CONFIG } from "../config/defaultConfig";
import {
  CURATED_LISTS,
  DEFAULT_FEEDS,
  INITIAL_APP_CONFIG,
} from "../constants/curatedFeeds";

describe("initial app configuration", () => {
  it("syncs release setup defaults into generated config", () => {
    expect(INITIAL_APP_CONFIG).toMatchObject({
      header: "floating",
      headerHeight: "tiny",
      headerOpacity: 0.6,
      headerBlur: 20,
      favoriteToolbarVariant: "inline",
      logoSize: "md",
      paginationType: "numbered",
      topStoriesCount: 15,
      autoRefreshInterval: 15,
      feedCacheTtlMinutes: 10,
    });
  });

  it("wires generated defaults into runtime defaults", () => {
    expect(DEFAULT_HEADER_CONFIG.height).toBe("tiny");
    expect(DEFAULT_HEADER_CONFIG.bgOpacity).toBe(0.6);
    expect(DEFAULT_HEADER_CONFIG.blur).toBe(20);
    expect(DEFAULT_HEADER_CONFIG.favoriteToolbarVariant).toBe("inline");
    expect(DEFAULT_HEADER_CONFIG.logoSize).toBe("md");
    expect(DEFAULT_CONTENT_CONFIG.paginationType).toBe("numbered");
    expect(DEFAULT_ARTICLE_LAYOUT.topStoriesCount).toBe(15);
    expect(DEFAULT_ARTICLE_LAYOUT.articlesPerPage).toBe(21);
    expect(DEFAULT_ARTICLE_LAYOUT.autoRefreshInterval).toBe(15);
    expect(DEFAULT_ARTICLE_LAYOUT.feedCacheTtlMinutes).toBe(10);
  });

  it("keeps initial YouTube feeds scoped to the default collection", () => {
    const defaultYouTubeFeeds = DEFAULT_FEEDS.filter(
      (feed) => feed.categoryId === "youtube",
    );
    const curatedYouTubeFeeds = Object.values(CURATED_LISTS)
      .flat()
      .filter((feed) => feed.categoryId === "youtube");

    expect(defaultYouTubeFeeds.map((feed) => feed.customTitle)).toEqual([
      "1155 do ET",
      "Corridor Crew",
      "Diolinux",
      "Tecnologia e Classe",
    ]);
    expect(curatedYouTubeFeeds.some((feed) => feed.customTitle === "Alex Ziskind")).toBe(
      true,
    );
    expect(defaultYouTubeFeeds.some((feed) => feed.customTitle === "Alex Ziskind")).toBe(
      false,
    );
  });
});
