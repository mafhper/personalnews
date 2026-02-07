/**
 * App.tsx
 *
 * Componente principal do Personal News Dashboard.
 * Gerencia o estado global da aplicação, incluindo artigos, feeds, pesquisa,
 * paginação, categorias e preferências do usuário.
 *
 * @author Matheus Pereira
 * @version 2.4.0
 */

import React, { useState, useEffect, useCallback } from "react";

import { ModalProvider } from "./contexts/ModalContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { FeedProvider } from "./contexts/FeedContext";
import { useFeeds } from "./contexts/FeedContextState";
import { UIProvider } from "./contexts/UIContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { NotificationContainer } from "./components/NotificationToast";
import { FirstPaintShell } from "./components/ui/FirstPaintShell";
import { withPerformanceTracking } from "./services/performanceUtils";
import { LandingPage } from "./components/landing/LandingPage";

// Lazy load AppContent to split bundle
const AppContent = React.lazy(() => import("./components/AppContent"));

declare global {
  interface Window {
    debugMigration: { run: () => void };
  }
}

const HOME_STAY_PREFETCH_DELAY_MS = 30000;

const getViewFromHash = () => {
  if (typeof window === "undefined") return "landing";
  return window.location.hash.toLowerCase() === "#feed" ? "feed" : "landing";
};

const isPrefetchAllowed = () => {
  if (typeof navigator === "undefined") return false;
  const connection = (navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  }).connection;

  if (connection?.saveData) return false;
  if (connection?.effectiveType?.includes("2g")) return false;
  const deviceMemory = (navigator as Navigator & { deviceMemory?: number })
    .deviceMemory;
  if (typeof deviceMemory === "number" && deviceMemory <= 2) return false;
  return true;
};

const FeedBootstrap: React.FC<{ active: boolean }> = ({ active }) => {
  const { startInitialLoad } = useFeeds();
  const hasStartedRef = React.useRef(false);

  useEffect(() => {
    if (!active || hasStartedRef.current) return;
    hasStartedRef.current = true;
    void startInitialLoad();
  }, [active, startInitialLoad]);

  return null;
};

const FeedView: React.FC = () => {
  // 0. SYNC LAYOUT READ FOR SKELETON MATCHING
  const initialLayout = React.useMemo(() => {
    try {
      const stored = localStorage.getItem("appearance-active-layout");
      return stored ? JSON.parse(stored) : "modern";
    } catch {
      return "modern";
    }
  }, []);

  // 1. FIRST PAINT MODE STATE
  const [isFirstPaint, setIsFirstPaint] = useState(true);

  // 2. INTERACTIVITY GATE STATE
  const [, setIsInteractive] = useState(false);

  // Effect: Release First Paint lock after frames are painted
  useEffect(() => {
    requestAnimationFrame(() => {
      const shell = document.getElementById("app-shell");
      if (shell) {
        shell.style.opacity = "0";
        setTimeout(() => shell.remove(), 500);
      }

      requestAnimationFrame(() => {
        setIsFirstPaint(false);
      });
    });
  }, []);

  // Effect: Enable interactivity after idle (requestIdleCallback)
  useEffect(() => {
    if (!isFirstPaint) {
      let id: number | NodeJS.Timeout;
      let visibilityHandler: (() => void) | null = null;

      const enableInteractivity = () => {
        setIsInteractive(true);
        if (visibilityHandler) {
          document.removeEventListener("visibilitychange", visibilityHandler);
        }
      };

      const isBackgroundTab = document.hidden;
      const useIdleCallback = "requestIdleCallback" in window && !isBackgroundTab;

      if (useIdleCallback) {
        id = requestIdleCallback(enableInteractivity, { timeout: 500 });
        return () => {
          if (typeof id === "number") {
            cancelIdleCallback(id);
          }
        };
      }

      id = setTimeout(enableInteractivity, isBackgroundTab ? 100 : 500);

      if (isBackgroundTab) {
        visibilityHandler = () => {
          if (!document.hidden) {
            clearTimeout(id as NodeJS.Timeout);
            enableInteractivity();
          }
        };
        document.addEventListener("visibilitychange", visibilityHandler);
      }

      return () => {
        clearTimeout(id as NodeJS.Timeout);
        if (visibilityHandler) {
          document.removeEventListener("visibilitychange", visibilityHandler);
        }
      };
    }
  }, [isFirstPaint]);

  const appWithProviders = (
    <React.Suspense fallback={<FirstPaintShell layoutMode={initialLayout} />}>
      <ModalProvider>
        <UIProvider>
          <AppContent />
          <NotificationContainer />
        </UIProvider>
      </ModalProvider>
    </React.Suspense>
  );

  if (isFirstPaint) {
    return <FirstPaintShell layoutMode={initialLayout} />;
  }

  return appWithProviders;
};

const App: React.FC = () => {
  const [view, setView] = useState<"landing" | "feed">(getViewFromHash);
  const [shouldStartFeed, setShouldStartFeed] = useState(view === "feed");
  const [isHomeDataReady, setIsHomeDataReady] = useState(false);
  const [isFooterReached, setIsFooterReached] = useState(false);
  const [hasStayed30sOnHome, setHasStayed30sOnHome] = useState(false);

  const openFeed = useCallback(() => {
    setShouldStartFeed(true);
    if (window.location.hash.toLowerCase() !== "#feed") {
      window.location.hash = "#feed";
    }
    setView("feed");
  }, []);

  const handleFooterVisible = useCallback(() => {
    if (view !== "landing") return;
    setIsFooterReached(true);
  }, [view]);

  const handleHomeDataReady = useCallback(() => {
    setIsHomeDataReady(true);
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const nextView = getViewFromHash();
      setView(nextView);
      if (nextView === "feed") {
        setShouldStartFeed(true);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    if (view !== "landing") return;
    if (hasStayed30sOnHome) return;

    const timerId = window.setTimeout(
      () => setHasStayed30sOnHome(true),
      HOME_STAY_PREFETCH_DELAY_MS,
    );
    return () => clearTimeout(timerId);
  }, [view, hasStayed30sOnHome]);

  useEffect(() => {
    if (view !== "landing" || shouldStartFeed || !isPrefetchAllowed()) return;
    if (!isHomeDataReady) return;
    if (!isFooterReached && !hasStayed30sOnHome) return;

    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => setShouldStartFeed(true), { timeout: 1200 });
      return;
    }
    setShouldStartFeed(true);
  }, [
    view,
    shouldStartFeed,
    isHomeDataReady,
    isFooterReached,
    hasStayed30sOnHome,
  ]);

  // Initialize logging system (dev only)
  React.useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      import("./utils/debugMigration").then(({ debugMigration }) => {
        window.debugMigration = debugMigration;
      });
    }
  }, []);

  // Load ProxyManager preferences (API key, etc)
  React.useEffect(() => {
    import("./services/proxyManager").then(({ ProxyManager, proxyManager }) => {
      ProxyManager.loadPreferences();
      // Keep all configured proxies active by default at app startup.
      proxyManager.getProxyConfigs().forEach((proxy) => {
        proxyManager.enableProxy(proxy.name);
      });

      const envApiKey = import.meta.env.VITE_RSS2JSON_API_KEY;
      if (envApiKey && !localStorage.getItem("rss2json_api_key")) {
        localStorage.setItem("rss2json_api_key_origin", "env.local");
        ProxyManager.setRss2jsonApiKey(envApiKey);
      }
    });
  }, []);

  return (
    <LanguageProvider>
      <NotificationProvider>
        <FeedProvider autoStart={false}>
          <FeedBootstrap active={shouldStartFeed} />
          {view === "feed" ? (
            <FeedView />
          ) : (
            <LandingPage
              onOpenFeed={openFeed}
              onFooterVisible={handleFooterVisible}
              onHomeDataReady={handleHomeDataReady}
            />
          )}
        </FeedProvider>
      </NotificationProvider>
    </LanguageProvider>
  );
};

const PerformanceApp = withPerformanceTracking(App, "App");
export default PerformanceApp;
