import React, { useEffect, useCallback, ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useProgressiveFeedLoading } from '../hooks/useProgressiveFeedLoading';
import { useNotification } from './NotificationContext';
import { getDefaultFeeds, migrateFeeds } from '../utils/feedMigration';
import { FeedSource } from '../types';
import { FeedContext } from './FeedContextState';
import { useLogger } from '../services/logger';

export const FeedProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [feeds, setFeeds] = useLocalStorage<FeedSource[]>('rss-feeds', getDefaultFeeds());
  const { showNotification } = useNotification();
  const logger = useLogger('FeedProvider');

  // Feed migration logic
  useEffect(() => {
    const migrationResult = migrateFeeds(feeds);
    if (migrationResult.migrated) {
      logger.debugTag('STATE', 'Feed migration triggered:', migrationResult.reason);
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

  const isInitialized = React.useRef(false);

  // Track state changes for debugging
  useEffect(() => {
    logger.debugTag('STATE', `Loading Status changed: ${loadingState.status}`, {
      progress: loadingState.progress,
      action: loadingState.currentAction,
      articlesCount: articles.length,
      isResolved: loadingState.isResolved
    });
  }, [loadingState.status, loadingState.currentAction, loadingState.isResolved, articles.length, logger]);

  // Initialize loading on first mount ONLY
  useEffect(() => {
    if (isInitialized.current) return;
    
    if (feeds.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const currentCategory = urlParams.get('category') || 'all';
      logger.debugTag('STATE', 'FeedContext: Initial mount loading triggered', { currentCategory });
      loadFeeds(false, currentCategory);
      isInitialized.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run ONLY once on mount. Navigation is handled by AppContent.

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
