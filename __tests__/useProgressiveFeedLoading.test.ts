import { describe, expect, it } from "vitest";
import { resolveFeedLoadScope } from "../hooks/useProgressiveFeedLoading";
import type { FeedSource } from "../types";

const feeds: FeedSource[] = [
  {
    url: "https://example.com/tech.xml",
    categoryId: "tech",
    customTitle: "Tech",
  },
  {
    url: "https://example.com/design.xml",
    categoryId: "design",
    customTitle: "Design",
  },
  {
    url: "https://example.com/games.xml",
    categoryId: "games",
    customTitle: "Games",
  },
];

describe("resolveFeedLoadScope", () => {
  it("returns every feed for all mode", () => {
    expect(resolveFeedLoadScope(feeds, { mode: "all" })).toHaveLength(3);
  });

  it("filters feeds by category mode", () => {
    expect(
      resolveFeedLoadScope(feeds, {
        categoryId: "design",
        mode: "category",
      }),
    ).toEqual([feeds[1]]);
  });

  it("loads only the selected feed in single-feed mode", () => {
    expect(
      resolveFeedLoadScope(feeds, {
        categoryId: "tech",
        feedUrl: "https://example.com/tech.xml",
        mode: "single-feed",
      }),
    ).toEqual([feeds[0]]);
  });
});
