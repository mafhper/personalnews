import { FeedSource } from '../types';
import { DEFAULT_FEEDS } from '../constants/curatedFeeds';

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
  const migratedFeeds = currentFeeds.map(feed => {
    const knownFeed = DEFAULT_FEEDS.find(df => df.url === feed.url);
    if (knownFeed) {
      const updatedFeed = { ...feed };
      let changed = false;

      // Ensure categoryId exists or is updated if it matches default
      if (!feed.categoryId && knownFeed.categoryId) {
        updatedFeed.categoryId = knownFeed.categoryId;
        changed = true;
      }

      // Sync hideFromAll from defaults
      if (feed.hideFromAll !== knownFeed.hideFromAll) {
        updatedFeed.hideFromAll = knownFeed.hideFromAll;
        changed = true;
      }

      // Sync customTitle if not set or if it's currently using the URL
      if (!feed.customTitle || feed.customTitle === feed.url) {
        if (knownFeed.customTitle && feed.customTitle !== knownFeed.customTitle) {
          updatedFeed.customTitle = knownFeed.customTitle;
          changed = true;
        }
      }

      if (changed) {
        hasChanges = true;
        return updatedFeed;
      }
    }
    return feed;
  });

  if (hasChanges) {
    return {
      migrated: true,
      feeds: migratedFeeds,
      reason: 'Synchronized metadata with default configurations'
    };
  }

  return {
    migrated: false,
    feeds: currentFeeds
  };
};