import React, { useEffect, useCallback, ReactNode } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useProgressiveFeedLoading } from "../hooks/useProgressiveFeedLoading";
import { useInitialLoadGuard } from "../hooks/useVisibilityRecovery";
import { useNotification } from "../hooks/useNotification";
import { getDefaultFeeds, migrateFeeds } from "../utils/feedMigration";
import { FeedLoadRequest, FeedSource } from "../types";
import { FeedContext } from "./FeedContextState";
import { useLogger } from "../services/logger";
import { desktopBackendClient } from "../services/desktopBackendClient";

const buildFeedSignature = (feeds: FeedSource[]) =>
  JSON.stringify(
    feeds.map((feed) => ({
      url: feed.url,
      categoryId: feed.categoryId || null,
      customTitle: feed.customTitle || null,
      hideFromAll: Boolean(feed.hideFromAll),
    })),
  );

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
  const usesBackendCollection = desktopBackendClient.isDesktopRuntime();
  const [collectionReady, setCollectionReady] = React.useState(
    !usesBackendCollection,
  );
  const backendCollectionReadyRef = React.useRef(!usesBackendCollection);
  const applyingBackendCollectionRef = React.useRef(false);
  const backendFeedSignatureRef = React.useRef<string | null>(null);
  const startupRecoveryAttemptedRef = React.useRef(false);

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
          "Feeds atualizados. Agora você tem 16 feeds organizados por categoria.",
          { type: "success", duration: 8000 },
        );
      } else if (
        migrationResult.reason?.includes("categorization") ||
        migrationResult.reason?.includes("Synchronized")
      ) {
        showNotification(
          "Seus feeds foram sincronizados com as configurações do sistema.",
          { type: "info", duration: 6000 },
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  useEffect(() => {
    if (!usesBackendCollection) return;
    let cancelled = false;

    const syncBackendCollection = async () => {
      try {
        const health = await desktopBackendClient.waitUntilReady({
          timeoutMs: 12_000,
        });

        if (!health.available || cancelled) {
          setCollectionReady(true);
          backendCollectionReadyRef.current = true;
          return;
        }

        await desktopBackendClient.importLocalFeedCollection(feeds);
        const collection = await desktopBackendClient.getFeedCollection();
        if (cancelled) return;

        const nextFeeds = collection.feeds.map((feed) => ({
          url: feed.url,
          categoryId: feed.categoryId,
          customTitle: feed.customTitle,
          hideFromAll: feed.hideFromAll,
        }));

        backendFeedSignatureRef.current = buildFeedSignature(nextFeeds);
        if (nextFeeds.length > 0 && backendFeedSignatureRef.current !== buildFeedSignature(feeds)) {
          applyingBackendCollectionRef.current = true;
          setFeeds(nextFeeds);
          window.setTimeout(() => {
            applyingBackendCollectionRef.current = false;
          }, 0);
        }

        backendCollectionReadyRef.current = true;
        setCollectionReady(true);
      } catch (error) {
        logger.warn("Backend feed collection sync failed; using local feeds", {
          additionalData: {
            error: error instanceof Error ? error.message : String(error),
          },
        });
        backendCollectionReadyRef.current = true;
        setCollectionReady(true);
      }
    };

    void syncBackendCollection();

    return () => {
      cancelled = true;
    };
    // Run only once with the startup localStorage snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!usesBackendCollection || !backendCollectionReadyRef.current) return;
    if (applyingBackendCollectionRef.current) return;

    const signature = buildFeedSignature(feeds);
    if (signature === backendFeedSignatureRef.current) return;
    backendFeedSignatureRef.current = signature;

    void desktopBackendClient.replaceFeedCollection(feeds).catch((error) => {
      logger.warn("Failed to persist feeds in backend collection", {
        additionalData: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
    });
  }, [feeds, logger, usesBackendCollection]);

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
    if (usesBackendCollection && !collectionReady) return;

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
    await loadFeeds({
      categoryId: currentCategory,
      mode: currentCategory === "all" ? "all" : "category",
    });
  }, [
    feeds.length,
    loadFeeds,
    loadGuard,
    logger,
    autoStart,
    usesBackendCollection,
    collectionReady,
  ]);

  // Inicializar carregamento automaticamente quando permitido
  useEffect(() => {
    if (!autoStart) return;
    void startInitialLoad();
  }, [autoStart, startInitialLoad]);

  useEffect(() => {
    if (!autoStart || !usesBackendCollection) return;
    if (loadingState.status !== "loading" || loadingState.loadedFeeds > 0) {
      return;
    }
    if (startupRecoveryAttemptedRef.current) return;

    const timer = window.setTimeout(() => {
      if (startupRecoveryAttemptedRef.current) return;
      startupRecoveryAttemptedRef.current = true;

      const recoverStartupLoad = async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const currentCategory = urlParams.get("category") || "all";
        const request: FeedLoadRequest = {
          categoryId: currentCategory,
          mode: currentCategory === "all" ? "all" : "category",
          forceRefresh: true,
        };

        logger.warn("Startup feed load stalled; attempting desktop recovery", {
          additionalData: {
            currentCategory,
            totalFeeds: loadingState.totalFeeds,
            currentAction: loadingState.currentAction,
          },
        });

        const health = await desktopBackendClient.checkHealth(true).catch(() => null);
        if (!health?.available) {
          await desktopBackendClient.restartBackend().catch(() => null);
          await desktopBackendClient.waitUntilReady({ timeoutMs: 8_000 }).catch(
            () => null,
          );
        }

        await loadFeeds(request);
      };

      void recoverStartupLoad();
    }, 18_000);

    return () => window.clearTimeout(timer);
  }, [
    autoStart,
    loadFeeds,
    loadingState.currentAction,
    loadingState.loadedFeeds,
    loadingState.status,
    loadingState.totalFeeds,
    logger,
    usesBackendCollection,
  ]);

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
    (request?: FeedLoadRequest) => {
      void loadFeeds({
        ...request,
        forceRefresh: true,
      });
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
