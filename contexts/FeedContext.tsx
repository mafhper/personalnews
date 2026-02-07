import React, { useEffect, useCallback, ReactNode } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useProgressiveFeedLoading } from "../hooks/useProgressiveFeedLoading";
import { useInitialLoadGuard } from "../hooks/useVisibilityRecovery";
import { useNotification } from "../hooks/useNotification";
import { getDefaultFeeds, migrateFeeds } from "../utils/feedMigration";
import { FeedSource } from "../types";
import { FeedContext } from "./FeedContextState";
import { useLogger } from "../services/logger";

export const FeedProvider: React.FC<{
  children: ReactNode;
  autoStart?: boolean;
}> = ({ children, autoStart = true }) => {
  const [feeds, setFeeds] = useLocalStorage<FeedSource[]>(
    "rss-feeds",
    getDefaultFeeds(),
  );
  const { showNotification } = useNotification();
  const logger = useLogger("FeedProvider");
  const loadGuard = useInitialLoadGuard();

  // Feed migration logic
  useEffect(() => {
    const migrationResult = migrateFeeds(feeds);
    if (migrationResult.migrated) {
      logger.debugTag(
        "STATE",
        "Feed migration triggered:",
        migrationResult.reason,
      );
      setFeeds(migrationResult.feeds);

      if (migrationResult.reason?.includes("Upgraded from legacy")) {
        showNotification(
          "🎉 Feeds atualizados! Agora você tem 16 feeds organizados por categoria.",
          { type: "success", duration: 8000 },
        );
      } else if (
        migrationResult.reason?.includes("categorization") ||
        migrationResult.reason?.includes("Synchronized")
      ) {
        showNotification(
          "✨ Seus feeds foram sincronizados com as configurações do sistema.",
          { type: "info", duration: 6000 },
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
    logger.debugTag("STATE", `Loading Status changed: ${loadingState.status}`, {
      progress: loadingState.progress,
      action: loadingState.currentAction,
      articlesCount: articles.length,
      isResolved: loadingState.isResolved,
    });
  }, [
    loadingState.status,
    loadingState.currentAction,
    loadingState.isResolved,
    loadingState.progress,
    articles.length,
    logger,
  ]);

  const startInitialLoad = useCallback(async () => {
    if (isInitialized.current) return;
    if (feeds.length === 0) return;

    const urlParams = new URLSearchParams(window.location.search);
    const currentCategory = urlParams.get("category") || "all";

    logger.debugTag("STATE", "FeedContext: Iniciando carregamento", {
      currentCategory,
      isPageVisible: !document.hidden,
      timestamp: new Date().toISOString(),
      feedsCount: feeds.length,
      trigger: autoStart ? "auto" : "manual",
    });

    loadGuard.setLoadStarted();
    isInitialized.current = true;
    await loadFeeds(false, currentCategory);
  }, [feeds.length, loadFeeds, loadGuard, logger, autoStart]);

  // Inicializar carregamento automaticamente quando permitido
  useEffect(() => {
    if (!autoStart) return;
    void startInitialLoad();
  }, [autoStart, startInitialLoad]);

  // Listener para visibilitychange - retoma carregamento quando aba volta a ficar visível
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      
      logger.debugTag("STATE", "Visibility changed", {
        isVisible,
        loadingStatus: loadingState.status,
        isInitialized: isInitialized.current,
        feedsCount: feeds.length,
      });

      // Quando a aba volta a ficar visível e o carregamento está em andamento
      if (isVisible && isInitialized.current && loadingState.status === "loading") {
        logger.debugTag("PERF", "Tab became visible while loading - continuing progress");
        // Forçar um update no estado para que o React processe quaisquer atualizações pendentes
        // Isso ajuda a garantir que a UI seja atualizada imediatamente
        setFeeds(prev => [...prev]);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loadingState.status, feeds.length, logger, setFeeds]);

  // Listener para forçar carregamento se a página ficar em background muito tempo
  useEffect(() => {
    if (!autoStart) return;

    const handleForceLoad = () => {
      if (!isInitialized.current && feeds.length > 0) {
        logger.debugTag(
          "STATE",
          "Force loading feeds due to background timeout",
        );
        void startInitialLoad();
      }
    };

    window.addEventListener("force-initial-load", handleForceLoad);
    return () => {
      window.removeEventListener("force-initial-load", handleForceLoad);
    };
  }, [autoStart, feeds.length, logger, startInitialLoad]);

  const refreshFeeds = useCallback(
    (categoryFilter?: string) => {
      loadFeeds(true, categoryFilter);
    },
    [loadFeeds],
  );

  const value = {
    feeds,
    setFeeds,
    articles,
    loadingState,
    loadFeeds,
    startInitialLoad,
    retryFailedFeeds,
    cancelLoading,
    refreshFeeds,
  };

  return <FeedContext.Provider value={value}>{children}</FeedContext.Provider>;
};
