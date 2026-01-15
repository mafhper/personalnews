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

import React, {
  useState,
  useEffect,
} from "react";

import { ModalProvider } from "./contexts/ModalContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { FeedProvider } from "./contexts/FeedContext";
import { UIProvider } from "./contexts/UIContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { NotificationContainer } from "./components/NotificationToast";
import { FirstPaintShell } from "./components/ui/FirstPaintShell";
import { withPerformanceTracking } from "./services/performanceUtils";

// Lazy load AppContent to split bundle
const AppContent = React.lazy(() => import("./components/AppContent"));

declare global {
  interface Window {
    debugMigration: { run: () => void };
  }
}

const App: React.FC = () => {
  // 0. SYNC LAYOUT READ FOR SKELETON MATCHING
  const initialLayout = React.useMemo(() => {
    try {
      const stored = localStorage.getItem('appearance-active-layout');
      return stored ? JSON.parse(stored) : 'modern';
    } catch {
      return 'modern';
    }
  }, []);

  // 1. FIRST PAINT MODE STATE
  // Critical for FCP/LCP. Must be initialized before extensive logic.
  const [isFirstPaint, setIsFirstPaint] = useState(true);

  // 2. INTERACTIVITY GATE STATE
  // Defers heavy Provider initialization until browser is idle.
  // This dramatically reduces TBT by spreading JS execution over time.
  const [isInteractive, setIsInteractive] = useState(false);

  // Effect: Release First Paint lock after frames are painted
  useEffect(() => {
    requestAnimationFrame(() => {
      // Remove critical shell from index.html
      const shell = document.getElementById('app-shell');
      if (shell) {
        shell.style.opacity = '0';
        setTimeout(() => shell.remove(), 500);
      }

      requestAnimationFrame(() => {
        setIsFirstPaint(false);
      });
    });
  }, []);

  // Effect: Enable interactivity after idle (requestIdleCallback)
  // Timeout of 2000ms guarantees providers are mounted even if browser never idles
  // (e.g., in background tabs or on heavy devices).
  useEffect(() => {
    if (!isFirstPaint) {
      const id = requestIdleCallback(
        () => setIsInteractive(true),
        { timeout: 2000 }
      );
      return () => cancelIdleCallback(id);
    }
  }, [isFirstPaint]);

  // Initialize logging system (dev only)
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      import('./utils/debugMigration').then(({ debugMigration }) => {
        window.debugMigration = debugMigration;
      });
    }
  }, []);

  // 3. IMMEDIATE RETURN FOR FIRST PAINT (Pure Shell)
  if (isFirstPaint) {
    return <FirstPaintShell layoutMode={initialLayout} />;
  }

  // 4. PRE-INTERACTIVE PHASE (Providers not yet mounted)
  // Renders content but without heavy context dependencies.
  // This allows the browser to paint the app shell before committing heavy JS.
  if (!isInteractive) {
    return (
      <React.Suspense fallback={<FirstPaintShell layoutMode={initialLayout} />}>
        <FirstPaintShell layoutMode={initialLayout} />
      </React.Suspense>
    );
  }

  // 5. MAIN APP RENDER (Full Providers - After idle)
  return (
    <React.Suspense fallback={<FirstPaintShell layoutMode={initialLayout} />}>
      <ModalProvider>
        <NotificationProvider>
          <FeedProvider>
            <UIProvider>
              <LanguageProvider>
                <AppContent />
                <NotificationContainer />
              </LanguageProvider>
            </UIProvider>
          </FeedProvider>
        </NotificationProvider>
      </ModalProvider>
    </React.Suspense>
  );
};

const PerformanceApp = withPerformanceTracking(App, "App");
export default PerformanceApp;