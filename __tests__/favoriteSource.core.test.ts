import { describe, expect, it } from "vitest";
import {
  buildFavoriteSourceKey,
  matchesFavoriteSourceKey,
} from "../utils/favoriteSource";

describe("favorite source identity", () => {
  it("groups favorites by source title before feed URL", () => {
    const sourceKey = buildFavoriteSourceKey({
      sourceTitle: "Ars Technica",
      feedUrl: "https://feeds.arstechnica.com/arstechnica/index",
    });

    expect(sourceKey).toBe("favorite-source:ars technica");
    expect(
      matchesFavoriteSourceKey(
        { sourceTitle: "Ars Technica" },
        sourceKey as string,
      ),
    ).toBe(true);
  });

  it("falls back to feed URL when the favorite has no source title", () => {
    const sourceKey = buildFavoriteSourceKey({
      sourceTitle: "",
      feedUrl: "https://example.com/rss.xml",
    });

    expect(sourceKey).toBe("favorite-feed:https://example.com/rss.xml");
    expect(
      matchesFavoriteSourceKey(
        { sourceTitle: "", feedUrl: "https://example.com/rss.xml" },
        sourceKey as string,
      ),
    ).toBe(true);
  });
});
