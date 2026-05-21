import type { Article } from "../types";

const FAVORITE_SOURCE_PREFIX = "favorite-source:";
const FAVORITE_FEED_PREFIX = "favorite-feed:";

const normalizeSourceIdentity = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, " ");

export const buildFavoriteSourceKey = (
  article: Pick<Article, "sourceTitle" | "feedUrl">,
): string | null => {
  const sourceTitle = article.sourceTitle?.trim();
  if (sourceTitle) {
    return `${FAVORITE_SOURCE_PREFIX}${normalizeSourceIdentity(sourceTitle)}`;
  }

  const feedUrl = article.feedUrl?.trim();
  if (feedUrl) {
    return `${FAVORITE_FEED_PREFIX}${normalizeSourceIdentity(feedUrl)}`;
  }

  return null;
};

export const matchesFavoriteSourceKey = (
  article: Pick<Article, "sourceTitle" | "feedUrl">,
  sourceKey: string,
) => {
  const expectedSourceTitle = sourceKey.startsWith(FAVORITE_SOURCE_PREFIX)
    ? sourceKey.slice(FAVORITE_SOURCE_PREFIX.length)
    : null;
  if (expectedSourceTitle) {
    return normalizeSourceIdentity(article.sourceTitle || "") === expectedSourceTitle;
  }

  const expectedFeedUrl = sourceKey.startsWith(FAVORITE_FEED_PREFIX)
    ? sourceKey.slice(FAVORITE_FEED_PREFIX.length)
    : null;
  if (expectedFeedUrl) {
    return normalizeSourceIdentity(article.feedUrl || "") === expectedFeedUrl;
  }

  return false;
};
