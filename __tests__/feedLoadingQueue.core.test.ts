import { describe, expect, it } from "vitest";
import {
  buildFeedLoadingBatches,
  limitArticlesForFeedLoad,
  MAX_ARTICLES_PER_FEED,
  MAX_PODCAST_EPISODES_PER_FEED,
} from "../services/feedLoadingQueue";
import type { Article, FeedSource } from "../types";

const makeFeed = (url: string, overrides: Partial<FeedSource> = {}) => ({
  url,
  ...overrides,
});

const makeArticle = (index: number, overrides: Partial<Article> = {}): Article => ({
  title: `Article ${index}`,
  link: `https://example.com/articles/${index}`,
  pubDate: new Date(Date.UTC(2026, 0, index + 1)),
  sourceTitle: "Example",
  ...overrides,
});

describe("feedLoadingQueue", () => {
  it("builds smaller queued batches for podcast feeds", () => {
    const standardFeeds = Array.from({ length: 9 }, (_, index) =>
      makeFeed(`https://example.com/feed-${index}.xml`),
    );
    const podcastFeeds = Array.from({ length: 5 }, (_, index) =>
      makeFeed(`https://example.com/podcast-${index}.xml`, {
        categoryId: "podcasts",
      }),
    );

    const batches = buildFeedLoadingBatches([...standardFeeds, ...podcastFeeds]);

    expect(batches.map((batch) => [batch.kind, batch.feeds.length])).toEqual([
      ["standard", 8],
      ["standard", 1],
      ["podcast", 4],
      ["podcast", 1],
    ]);
  });

  it("keeps a recent article window for normal feeds", () => {
    const feed = makeFeed("https://example.com/rss.xml");
    const articles = Array.from(
      { length: MAX_ARTICLES_PER_FEED + 5 },
      (_, index) => makeArticle(index),
    );

    const limited = limitArticlesForFeedLoad(feed, articles);

    expect(limited).toHaveLength(MAX_ARTICLES_PER_FEED);
    expect(limited[0].title).toBe(`Article ${MAX_ARTICLES_PER_FEED + 4}`);
  });

  it("keeps a smaller recent episode window for podcasts", () => {
    const feed = makeFeed("https://example.com/feed.xml", {
      categoryId: "podcasts",
    });
    const articles = Array.from(
      { length: MAX_PODCAST_EPISODES_PER_FEED + 5 },
      (_, index) =>
        makeArticle(index, {
          audioUrl: `https://cdn.example.com/audio/${index}.mp3`,
        }),
    );

    const limited = limitArticlesForFeedLoad(feed, articles);

    expect(limited).toHaveLength(MAX_PODCAST_EPISODES_PER_FEED);
    expect(limited[0].title).toBe(
      `Article ${MAX_PODCAST_EPISODES_PER_FEED + 4}`,
    );
  });
});
