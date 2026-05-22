import type { Article, FeedSource } from "../types";

export const DEFAULT_FEED_BATCH_SIZE = 8;
export const PODCAST_FEED_BATCH_SIZE = 4;
export const MAX_ARTICLES_PER_FEED = 50;
export const MAX_PODCAST_EPISODES_PER_FEED = 25;

export interface FeedLoadingBatch {
  id: string;
  kind: "standard" | "podcast";
  feeds: FeedSource[];
}

const normalizeText = (value?: string) => (value || "").toLowerCase();

export const isPodcastFeedSource = (feed: FeedSource): boolean => {
  const categoryId = normalizeText(feed.categoryId);
  const title = normalizeText(feed.customTitle);
  const url = normalizeText(feed.url);

  return (
    categoryId.includes("podcast") ||
    title.includes("podcast") ||
    url.includes("podcast") ||
    url.includes("/podcasts/") ||
    url.includes("anchor.fm") ||
    url.includes("spotify.com")
  );
};

export const isPodcastArticleSet = (
  feed: FeedSource,
  articles: Article[],
): boolean =>
  isPodcastFeedSource(feed) ||
  articles.some((article) => Boolean(article.audioUrl || article.audioDuration));

const sortNewestFirst = (articles: Article[]) =>
  articles
    .slice()
    .sort(
      (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime(),
    );

export const limitArticlesForFeedLoad = (
  feed: FeedSource,
  articles: Article[],
): Article[] => {
  const limit = isPodcastArticleSet(feed, articles)
    ? MAX_PODCAST_EPISODES_PER_FEED
    : MAX_ARTICLES_PER_FEED;

  if (articles.length <= limit) return articles;

  return sortNewestFirst(articles).slice(0, limit);
};

const chunkFeeds = (
  feeds: FeedSource[],
  size: number,
  kind: FeedLoadingBatch["kind"],
): FeedLoadingBatch[] => {
  const batches: FeedLoadingBatch[] = [];

  for (let index = 0; index < feeds.length; index += size) {
    batches.push({
      id: `${kind}-${Math.floor(index / size) + 1}`,
      kind,
      feeds: feeds.slice(index, index + size),
    });
  }

  return batches;
};

export const buildFeedLoadingBatches = (
  feeds: FeedSource[],
): FeedLoadingBatch[] => {
  const standardFeeds = feeds.filter((feed) => !isPodcastFeedSource(feed));
  const podcastFeeds = feeds.filter(isPodcastFeedSource);

  return [
    ...chunkFeeds(standardFeeds, DEFAULT_FEED_BATCH_SIZE, "standard"),
    ...chunkFeeds(podcastFeeds, PODCAST_FEED_BATCH_SIZE, "podcast"),
  ];
};
