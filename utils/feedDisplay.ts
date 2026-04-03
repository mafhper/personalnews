import type { FeedSource } from "../types";

const getHostnameLabel = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

export const getFeedDisplayName = (
  feed: Pick<FeedSource, "url" | "customTitle">,
  fallbackTitle?: string | null,
): string => {
  const customTitle = feed.customTitle?.trim();
  if (customTitle) return customTitle;

  const resolvedFallback = fallbackTitle?.trim();
  if (resolvedFallback) return resolvedFallback;

  return getHostnameLabel(feed.url);
};

export const getFeedSortKey = (
  feed: Pick<FeedSource, "url" | "customTitle">,
  fallbackTitle?: string | null,
): string => getFeedDisplayName(feed, fallbackTitle).toLocaleLowerCase("pt-BR");
