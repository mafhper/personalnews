import type { FeedSource } from "../types";

export interface FeedErrorHistoryItem {
  url: string;
  failures: number;
  lastError: number;
  lastErrorType: string;
}

export interface QuarantineRecommendationInput {
  feed: FeedSource;
  history?: FeedErrorHistoryItem;
  isValid?: boolean;
}

export const QUARANTINE_RECOMMENDATION_FAILURES = 3;
export const QUARANTINE_RECOVERY_SUCCESSES = 2;
const QUARANTINE_RECHECK_HOURS = 24;
const QUARANTINE_INACTIVE_DAYS = 30;

const toIso = (timestamp: number) => new Date(timestamp).toISOString();

export const isFeedQuarantined = (feed: FeedSource): boolean =>
  feed.status === "quarantined";

export const isFeedInactive = (feed: FeedSource): boolean =>
  feed.status === "inactive";

export const isFeedActive = (feed: FeedSource): boolean =>
  !isFeedQuarantined(feed) && !isFeedInactive(feed);

export const getActiveFeeds = (feeds: FeedSource[]): FeedSource[] =>
  feeds.filter(isFeedActive);

export const shouldRecommendQuarantine = ({
  feed,
  history,
  isValid,
}: QuarantineRecommendationInput): boolean => {
  if (!history || isValid || !isFeedActive(feed)) return false;
  return history.failures >= QUARANTINE_RECOMMENDATION_FAILURES;
};

export const quarantineFeed = (
  feed: FeedSource,
  {
    reason,
    failureCountAtEntry = 0,
    lastErrorType,
    lastError,
    now = Date.now(),
  }: {
    reason: string;
    failureCountAtEntry?: number;
    lastErrorType?: string;
    lastError?: string;
    now?: number;
  },
): FeedSource => ({
  ...feed,
  status: "quarantined",
  quarantine: {
    enteredAt: toIso(now),
    reason,
    failureCountAtEntry,
    lastCheckedAt: toIso(now),
    nextCheckAt: toIso(now + QUARANTINE_RECHECK_HOURS * 60 * 60 * 1000),
    recoverySuccesses: 0,
    inactiveAfter: toIso(now + QUARANTINE_INACTIVE_DAYS * 24 * 60 * 60 * 1000),
    lastErrorType,
    lastError,
  },
});

export const restoreQuarantinedFeed = (feed: FeedSource): FeedSource => {
  const { quarantine: _quarantine, status: _status, ...rest } = feed;
  return rest;
};

export const markFeedInactive = (
  feed: FeedSource,
  now = Date.now(),
): FeedSource => ({
  ...feed,
  status: "inactive",
  quarantine: {
    enteredAt: feed.quarantine?.enteredAt || toIso(now),
    reason: feed.quarantine?.reason || "Marcado como inativo",
    failureCountAtEntry: feed.quarantine?.failureCountAtEntry || 0,
    lastCheckedAt: toIso(now),
    nextCheckAt: undefined,
    recoverySuccesses: feed.quarantine?.recoverySuccesses || 0,
    inactiveAfter: feed.quarantine?.inactiveAfter,
    lastErrorType: feed.quarantine?.lastErrorType,
    lastError: feed.quarantine?.lastError,
  },
});

export const updateQuarantineAfterValidation = (
  feed: FeedSource,
  validation: { isValid: boolean; status?: string; error?: string },
  now = Date.now(),
): FeedSource => {
  if (!isFeedQuarantined(feed) || !feed.quarantine) return feed;

  if (validation.isValid) {
    return {
      ...feed,
      quarantine: {
        ...feed.quarantine,
        lastCheckedAt: toIso(now),
        nextCheckAt: toIso(now + QUARANTINE_RECHECK_HOURS * 60 * 60 * 1000),
        recoverySuccesses: feed.quarantine.recoverySuccesses + 1,
        lastErrorType: undefined,
        lastError: undefined,
      },
    };
  }

  return {
    ...feed,
    quarantine: {
      ...feed.quarantine,
      lastCheckedAt: toIso(now),
      nextCheckAt: toIso(now + QUARANTINE_RECHECK_HOURS * 60 * 60 * 1000),
      recoverySuccesses: 0,
      lastErrorType: validation.status || feed.quarantine.lastErrorType,
      lastError: validation.error || feed.quarantine.lastError,
    },
  };
};

export const isQuarantineRecovered = (feed: FeedSource): boolean =>
  (feed.quarantine?.recoverySuccesses || 0) >= QUARANTINE_RECOVERY_SUCCESSES;
