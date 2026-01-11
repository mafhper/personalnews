import React, { useEffect, useCallback, ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useProgressiveFeedLoading } from '../hooks/useProgressiveFeedLoading';
import { useNotification } from './NotificationContext';
import { getDefaultFeeds, migrateFeeds } from '../utils/feedMigration';
import type { FeedSource } from '../types';
import { FeedContext } from './FeedContextState';

export const FeedProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [feeds, setFeeds] = useLocalStorage<FeedSource[]>('rss-feeds', getDefaultFeeds());
  const { showNotification } = useNotification();

  // Feed migration logic
  useEffect(() => {
    const migrationResult = migrateFeeds(feeds);
    if (migrationResult.migrated) {
      console.log('Feed migration:', migrationResult.reason);
      setFeeds(migrationResult.feeds);

      if (migrationResult.reason?.includes('Upgraded from legacy')) {
        showNotification(
          '🎉 Feeds atualizados! Agora você tem 16 feeds organizados por categoria.',
          { type: 'success', duration: 8000 }
        );
      } else if (migrationResult.reason?.includes('categorization') || migrationResult.reason?.includes('Synchronized')) {
        showNotification(
          '✨ Seus feeds foram sincronizados com as configurações do sistema.',
          { type: 'info', duration: 6000 }
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  const { articles, loadingState, loadFeeds, retryFailedFeeds, cancelLoading } =
    useProgressiveFeedLoading(feeds);

  // Initialize loading on mount if feeds exist
  useEffect(() => {
    if (feeds.length > 0) {
      loadFeeds();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feeds.length]); // Only re-run if feed count changes (naive check, but avoids infinite loops)

  const refreshFeeds = useCallback((categoryFilter?: string) => {
    loadFeeds(true, categoryFilter);
  }, [loadFeeds]);

  const value = {
    feeds,
    setFeeds,
    articles,
    loadingState,
    loadFeeds,
    retryFailedFeeds,
    cancelLoading,
    refreshFeeds
  };

  return <FeedContext.Provider value={value}>{children}</FeedContext.Provider>;
};
