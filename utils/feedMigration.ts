import { FeedSource } from '../types';
import { DEFAULT_FEEDS } from '../constants/curatedFeeds';

const CANONICAL_FEED_REPLACEMENTS: Array<{
  titlePattern: RegExp;
  staleUrls: string[];
  canonicalUrl: string;
}> = [
  {
    titlePattern: /\bforo de teresina\b/i,
    staleUrls: ['https://piaui.folha.uol.com.br/feed/'],
    canonicalUrl: 'https://feeds.megaphone.fm/NPP2619427256',
  },
];

const normalizeFeedUrlForMigration = (url: string): string => {
  try {
    const parsed = new URL(url.trim());
    parsed.hash = '';
    parsed.hostname = parsed.hostname.toLowerCase();
    parsed.pathname = parsed.pathname.replace(/\/+$/, '') || '/';

    const normalizedParams = new URLSearchParams();
    Array.from(parsed.searchParams.entries())
      .filter(([key]) => {
        const normalizedKey = key.toLowerCase();
        return (
          !normalizedKey.startsWith('utm_') &&
          normalizedKey !== 'ref' &&
          normalizedKey !== 'source'
        );
      })
      .sort(([keyA, valueA], [keyB, valueB]) =>
        keyA === keyB
          ? valueA.localeCompare(valueB)
          : keyA.localeCompare(keyB)
      )
      .forEach(([key, value]) => normalizedParams.append(key, value));
    parsed.search = normalizedParams.toString();

    return parsed.toString().replace(/\/$/, '');
  } catch {
    return url.trim().replace(/\/+$/, '').toLowerCase();
  }
};

/**
 * Returns the default list of feeds to start with
 */
export const getDefaultFeeds = (): FeedSource[] => {
  return [...DEFAULT_FEEDS];
};

/**
 * Resets feeds to the default list
 */
export const resetToDefaultFeeds = (): FeedSource[] => {
  return [...DEFAULT_FEEDS];
};

/**
 * Adds new feeds to an existing collection, avoiding duplicates
 */
export const addFeedsToCollection = (
  currentFeeds: FeedSource[],
  newFeeds: FeedSource[]
): FeedSource[] => {
  const existingUrls = new Set(currentFeeds.map(f => f.url));
  const uniqueNewFeeds = newFeeds.filter(f => !existingUrls.has(f.url));
  return [...currentFeeds, ...uniqueNewFeeds];
};

/**
 * Checks if migration is needed and performs it
 * This handles versioning or initial setup logic
 */
export const migrateFeeds = (currentFeeds: FeedSource[]): { migrated: boolean; feeds: FeedSource[]; reason?: string } => {
  // If no feeds, initialize with defaults
  if (!currentFeeds || currentFeeds.length === 0) {
    return {
      migrated: true,
      feeds: getDefaultFeeds(),
      reason: 'Initialized with default feeds'
    };
  }

  // Sync metadata from DEFAULT_FEEDS to existing feeds
  let hasChanges = false;
  const defaultFeedsByNormalizedUrl = new Map(
    DEFAULT_FEEDS.map((feed) => [
      normalizeFeedUrlForMigration(feed.url),
      feed,
    ]),
  );
  const migratedFeeds = currentFeeds.map(feed => {
    const canonicalReplacement = CANONICAL_FEED_REPLACEMENTS.find((replacement) => {
      const title = feed.customTitle || feed.url;
      const normalizedUrl = normalizeFeedUrlForMigration(feed.url);
      const isKnownStaleUrl = replacement.staleUrls.some(
        (staleUrl) => normalizeFeedUrlForMigration(staleUrl) === normalizedUrl
      );
      return (
        replacement.titlePattern.test(title) &&
        isKnownStaleUrl &&
        normalizedUrl !== normalizeFeedUrlForMigration(replacement.canonicalUrl)
      );
    });
    const feedToSync = canonicalReplacement
      ? { ...feed, url: canonicalReplacement.canonicalUrl }
      : feed;
    if (canonicalReplacement) {
      hasChanges = true;
    }

    const knownFeed = defaultFeedsByNormalizedUrl.get(
      normalizeFeedUrlForMigration(feedToSync.url),
    );
    if (knownFeed) {
      const updatedFeed = { ...feedToSync };
      let changed = false;

      // Ensure categoryId exists or is updated if it matches default
      if ((canonicalReplacement || !feedToSync.categoryId) && knownFeed.categoryId) {
        updatedFeed.categoryId = knownFeed.categoryId;
        changed = true;
      }

      // Sync hideFromAll from defaults
      if (feedToSync.hideFromAll !== knownFeed.hideFromAll) {
        updatedFeed.hideFromAll = knownFeed.hideFromAll;
        changed = true;
      }

      // Sync customTitle if not set or if it's currently using the URL
      if (!feedToSync.customTitle || feedToSync.customTitle === feedToSync.url) {
        if (knownFeed.customTitle && feedToSync.customTitle !== knownFeed.customTitle) {
          updatedFeed.customTitle = knownFeed.customTitle;
          changed = true;
        }
      }

      if (changed) {
        hasChanges = true;
        return updatedFeed;
      }
    }
    return feedToSync;
  });

  const dedupedFeeds: FeedSource[] = [];
  const seenUrls = new Set<string>();
  for (const feed of migratedFeeds) {
    const normalizedUrl = normalizeFeedUrlForMigration(feed.url);
    if (seenUrls.has(normalizedUrl)) {
      hasChanges = true;
      continue;
    }
    seenUrls.add(normalizedUrl);
    dedupedFeeds.push(feed);
  }

  const repairedFeeds = [...dedupedFeeds];
  for (const defaultFeed of DEFAULT_FEEDS) {
    const normalizedUrl = normalizeFeedUrlForMigration(defaultFeed.url);
    if (seenUrls.has(normalizedUrl)) continue;

    hasChanges = true;
    seenUrls.add(normalizedUrl);
    repairedFeeds.push({ ...defaultFeed });
  }

  if (hasChanges) {
    return {
      migrated: true,
      feeds: repairedFeeds,
      reason: 'Synchronized metadata with default configurations'
    };
  }

  return {
    migrated: false,
    feeds: currentFeeds
  };
};
