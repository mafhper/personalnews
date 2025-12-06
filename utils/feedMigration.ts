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

  // Add auto-categorization logic here if needed for legacy feeds
  // For now, we just return the current feeds if they exist
  let hasChanges = false;
  const migratedFeeds = currentFeeds.map(feed => {
    // Example migration: ensure categoryId exists if it matches a known feed
    if (!feed.categoryId) {
      const knownFeed = DEFAULT_FEEDS.find(df => df.url === feed.url);
      if (knownFeed && knownFeed.categoryId) {
        hasChanges = true;
        return { ...feed, categoryId: knownFeed.categoryId };
      }
    }
    return feed;
  });

  if (hasChanges) {
    return {
      migrated: true,
      feeds: migratedFeeds,
      reason: 'Categorized legacy feeds'
    };
  }

  return {
    migrated: false,
    feeds: currentFeeds
  };
};