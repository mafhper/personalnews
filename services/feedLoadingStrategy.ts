import type { FeedLoadRequest, FeedSource } from "../types";
import { areUrlsEqual } from "../utils/urlUtils";

export const resolveScopeMode = (
  request?: FeedLoadRequest,
): NonNullable<FeedLoadRequest["mode"]> => {
  if (request?.mode) return request.mode;
  if (request?.feedUrl) return "single-feed";
  if (request?.categoryId && request.categoryId !== "all") return "category";
  return "all";
};

export const buildFeedLoadScopeKey = (
  request?: FeedLoadRequest,
): string => {
  const mode = resolveScopeMode(request);

  if (mode === "single-feed") {
    return `single-feed:${request?.feedUrl ?? "unknown"}`;
  }

  if (mode === "category") {
    return `category:${request?.categoryId ?? "all"}`;
  }

  return "all";
};

export const resolveFeedLoadScope = (
  feeds: FeedSource[],
  request?: FeedLoadRequest,
): FeedSource[] => {
  const mode = resolveScopeMode(request);

  if (mode === "single-feed" && request?.feedUrl) {
    return feeds.filter((feed) => areUrlsEqual(feed.url, request.feedUrl!));
  }

  if (mode === "category" && request?.categoryId) {
    return feeds.filter((feed) => feed.categoryId === request.categoryId);
  }

  return feeds;
};

export interface FeedVisibilityResolutionInput {
  forceRefresh: boolean;
  cachedArticlesCount: number;
  previousArticlesCount: number;
  previousScopeKey: string;
  scopeKey: string;
}

export interface FeedVisibilityResolution {
  hasScopedCache: boolean;
  isDifferentScope: boolean;
  isHoldingPreviousContent: boolean;
  shouldKeepVisibleContent: boolean;
  preserveVisibleArticlesOnFailure: boolean;
  shouldBypassCache: boolean;
}

export const resolveFeedVisibilityState = ({
  forceRefresh,
  cachedArticlesCount,
  previousArticlesCount,
  previousScopeKey,
  scopeKey,
}: FeedVisibilityResolutionInput): FeedVisibilityResolution => {
  const hasScopedCache = cachedArticlesCount > 0;
  const isDifferentScope = previousScopeKey !== scopeKey;
  const isHoldingPreviousContent =
    !forceRefresh &&
    !hasScopedCache &&
    isDifferentScope &&
    previousArticlesCount > 0;
  const shouldKeepVisibleContent =
    hasScopedCache || isHoldingPreviousContent || previousArticlesCount > 0;
  const preserveVisibleArticlesOnFailure =
    !isHoldingPreviousContent && previousArticlesCount > 0;
  const shouldBypassCache =
    forceRefresh || hasScopedCache || isHoldingPreviousContent;

  return {
    hasScopedCache,
    isDifferentScope,
    isHoldingPreviousContent,
    shouldKeepVisibleContent,
    preserveVisibleArticlesOnFailure,
    shouldBypassCache,
  };
};
