import { describe, expect, it } from "vitest";
import { normalizeArticleForFeedSource } from "../hooks/useProgressiveFeedLoading";
import type { Article, FeedSource } from "../types";

describe("progressive feed discovery normalization", () => {
  it("keeps articles from discovered URLs associated with the saved feed URL", () => {
    const savedFeed: FeedSource = {
      url: "https://example.com",
      customTitle: "Example",
      categoryId: "tech",
    };
    const discoveredArticle: Article = {
      title: "Discovered article",
      link: "https://example.com/post",
      pubDate: new Date("2026-05-22T12:00:00.000Z"),
      sourceTitle: "Example RSS",
      feedUrl: "https://example.com/feed.xml",
    };

    expect(
      normalizeArticleForFeedSource(savedFeed, discoveredArticle, {
        preferSavedFeedUrl: true,
      }),
    ).toMatchObject({
      title: "Discovered article",
      feedUrl: "https://example.com",
      sourceTitle: "Example",
    });
  });
});
