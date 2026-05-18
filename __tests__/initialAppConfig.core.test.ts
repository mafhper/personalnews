import { describe, expect, it } from "vitest";
import { DEFAULT_ARTICLE_LAYOUT, DEFAULT_CONTENT_CONFIG, DEFAULT_HEADER_CONFIG } from "../config/defaultConfig";
import { INITIAL_APP_CONFIG } from "../constants/curatedFeeds";

describe("initial app configuration", () => {
  it("syncs release setup defaults into generated config", () => {
    expect(INITIAL_APP_CONFIG).toMatchObject({
      header: "floating",
      headerHeight: "compact",
      headerOpacity: 0.6,
      headerBlur: 20,
      logoSize: "md",
      paginationType: "numbered",
      topStoriesCount: 15,
      autoRefreshInterval: 15,
      feedCacheTtlMinutes: 10,
    });
  });

  it("wires generated defaults into runtime defaults", () => {
    expect(DEFAULT_HEADER_CONFIG.height).toBe("compact");
    expect(DEFAULT_HEADER_CONFIG.bgOpacity).toBe(0.6);
    expect(DEFAULT_HEADER_CONFIG.blur).toBe(20);
    expect(DEFAULT_HEADER_CONFIG.logoSize).toBe("md");
    expect(DEFAULT_CONTENT_CONFIG.paginationType).toBe("numbered");
    expect(DEFAULT_ARTICLE_LAYOUT.topStoriesCount).toBe(15);
    expect(DEFAULT_ARTICLE_LAYOUT.articlesPerPage).toBe(21);
    expect(DEFAULT_ARTICLE_LAYOUT.autoRefreshInterval).toBe(15);
    expect(DEFAULT_ARTICLE_LAYOUT.feedCacheTtlMinutes).toBe(10);
  });
});
