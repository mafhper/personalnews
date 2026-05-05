import type { Article } from "../types";
import { detectEnvironment } from "./environmentDetector";
import { desktopBackendClient } from "./desktopBackendClient";
import {
  buildFeedDiagnosticInfo,
  type FeedDiagnosticInfo,
  type FeedRouteInfo,
} from "./feedDiagnostics";
import { ProxyManager } from "./proxyManager";
import { parseRssUrlDetailed } from "./rssParser";

export interface FeedRuntimeResult {
  title: string;
  articles: Article[];
  route: FeedRouteInfo;
  warning?: FeedDiagnosticInfo;
  cached: boolean;
  source: "backend" | "client-fallback" | "client";
}

export interface FeedRuntimeState {
  activeMode: "desktop-local" | "cloud-fallback" | "web-client" | "unknown";
  lastRoute?: FeedRouteInfo;
  lastWarning?: FeedDiagnosticInfo;
  backendAvailable?: boolean;
  lastCheckedAt?: number;
}

const runtimeState: FeedRuntimeState = {
  activeMode: "unknown",
};

const updateRuntimeState = (next: Partial<FeedRuntimeState>) => {
  Object.assign(runtimeState, next, { lastCheckedAt: Date.now() });
};

const coerceArticlesFromBackend = (
  articles:
    | FeedRuntimeResult["articles"]
    | Array<Omit<Article, "pubDate"> & { pubDate: string }>,
): Article[] => {
  return articles.map((article) => ({
    ...article,
    pubDate: new Date(article.pubDate),
  }));
};

const buildBackendRoute = (cached: boolean): FeedRouteInfo => ({
  transport: "desktop-backend",
  routeKind: cached ? "cache" : "local-backend",
  routeName: "LocalBackend",
  viaFallback: false,
  checkedAt: Date.now(),
  detail: cached
    ? "Servido pelo cache do backend local"
    : "Servido diretamente pelo backend local",
});

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Request was cancelled", "AbortError"));
      return;
    }

    const timeoutId = window.setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timeoutId);
        reject(new DOMException("Request was cancelled", "AbortError"));
      },
      { once: true },
    );
  });

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const getBackendErrorStatusCode = (error: unknown): number | undefined => {
  if (!error || typeof error !== "object") return undefined;
  const statusCode = (error as { statusCode?: unknown }).statusCode;
  return typeof statusCode === "number" ? statusCode : undefined;
};

const isBackendReachabilityError = (error: unknown) => {
  const statusCode = getBackendErrorStatusCode(error);
  if (statusCode) return false;

  const message = getErrorMessage(error).toLowerCase();
  if (
    message.includes("abort") ||
    message.includes("cancelled") ||
    message.includes("timeout")
  ) {
    return false;
  }

  return (
    message.includes("backend local indisponivel") ||
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("econnrefused") ||
    message.includes("connection refused") ||
    message.includes("no backend candidates responded")
  );
};

const waitForBackendWarmup = async (
  initialHealth: Awaited<ReturnType<typeof desktopBackendClient.checkHealth>>,
  signal?: AbortSignal,
) => {
  let health = initialHealth;
  const deadline = Date.now() + 25_000;

  while (!health.available && health.initializing && Date.now() < deadline) {
    await sleep(250, signal);
    health = await desktopBackendClient.checkHealth(true, signal);
  }

  return health;
};

const buildBackendUnavailableError = (
  message: string,
  initializing?: boolean,
) =>
  new Error(
    initializing
      ? `Backend local inicializando: ${message}`
      : `Backend local indisponivel: ${message}`,
  );

export const getFeedRuntimeState = (): FeedRuntimeState => ({
  ...runtimeState,
});

export async function loadFeedWithRuntime(
  url: string,
  options: {
    forceRefresh?: boolean;
    signal?: AbortSignal;
    skipCache?: boolean;
  } = {},
): Promise<FeedRuntimeResult> {
  const env = detectEnvironment();
  const hasBackendRuntime = desktopBackendClient.isEnabled();
  const preferLocalProxy = ProxyManager.getPreferLocalProxy();
  const allowClientProxyFallback = ProxyManager.shouldUseClientProxyFallback();
  const { forceRefresh = false, signal, skipCache = false } = options;

  if (hasBackendRuntime && !preferLocalProxy) {
    const result = await parseRssUrlDetailed(url, {
      signal,
      skipCache,
    });
    updateRuntimeState({
      activeMode: "cloud-fallback",
      lastRoute: result.route,
      lastWarning: undefined,
      backendAvailable: false,
    });
    desktopBackendClient.setRuntimeState({
      activeMode: "cloud-fallback",
      lastRoute: result.route.routeName,
      lastWarning: undefined,
      backendAvailable: false,
    });

    return {
      title: result.title,
      articles: result.articles,
      route: {
        ...result.route,
        viaFallback: true,
      },
      cached: result.cached,
      source: "client",
    };
  }

  if (hasBackendRuntime) {
    const health = await waitForBackendWarmup(
      await desktopBackendClient.checkHealth(false, signal),
      signal,
    );

    if (health.available) {
      try {
        const response = await desktopBackendClient.fetchFeed(url, {
          forceRefresh: forceRefresh || skipCache,
          signal,
        });
        const route = buildBackendRoute(response.meta.cached);
        updateRuntimeState({
          activeMode: "desktop-local",
          lastRoute: route,
          lastWarning: undefined,
          backendAvailable: true,
        });
        desktopBackendClient.setRuntimeState({
          activeMode: "desktop-local",
          lastRoute: "LocalBackend",
          lastWarning: undefined,
          backendAvailable: true,
        });

        return {
          title: response.title,
          articles: coerceArticlesFromBackend(response.articles),
          route,
          cached: response.meta.cached,
          source: "backend",
        };
      } catch (error) {
        const message = getErrorMessage(error);
        const statusCode = getBackendErrorStatusCode(error);
        const backendRoute: FeedRouteInfo = {
          transport: "desktop-backend",
          routeKind: "local-backend",
          routeName: "LocalBackend",
          viaFallback: false,
          checkedAt: Date.now(),
        };

        if (!isBackendReachabilityError(error)) {
          updateRuntimeState({
            activeMode: "desktop-local",
            lastRoute: backendRoute,
            lastWarning: buildFeedDiagnosticInfo(
              message,
              statusCode,
              backendRoute,
            ),
            backendAvailable: true,
          });
          desktopBackendClient.setRuntimeState({
            activeMode: "desktop-local",
            lastRoute: "LocalBackend",
            lastWarning: undefined,
            backendAvailable: true,
            lastError: message,
          });
          throw error;
        }

        const warning = buildFeedDiagnosticInfo(
          `Backend unavailable: ${message}`,
          undefined,
          backendRoute,
          allowClientProxyFallback
            ? "Fallback automatico para proxies em nuvem ativado."
            : undefined,
        );

        if (!allowClientProxyFallback) {
          updateRuntimeState({
            activeMode: "desktop-local",
            lastRoute: backendRoute,
            lastWarning: warning,
            backendAvailable: false,
          });
          desktopBackendClient.setRuntimeState({
            activeMode: "desktop-local",
            lastRoute: "LocalBackend",
            lastWarning: JSON.stringify(warning),
            backendAvailable: false,
            lastError: message,
          });
          throw buildBackendUnavailableError(message);
        }

        const fallback = await parseRssUrlDetailed(url, {
          signal,
          skipCache,
        });

        updateRuntimeState({
          activeMode: "cloud-fallback",
          lastRoute: fallback.route,
          lastWarning: warning,
          backendAvailable: false,
        });
        desktopBackendClient.setRuntimeState({
          activeMode: "cloud-fallback",
          lastRoute: fallback.route.routeName,
          lastWarning: JSON.stringify(warning),
          backendAvailable: false,
          lastError: message,
        });

        return {
          title: fallback.title,
          articles: fallback.articles,
          route: {
            ...fallback.route,
            viaFallback: true,
          },
          warning,
          cached: fallback.cached,
          source: "client-fallback",
        };
      }
    }

    const healthMessage = health.error || "health check failed";
    const warning = buildFeedDiagnosticInfo(
      `Backend unavailable: ${healthMessage}`,
      undefined,
      {
        transport: "desktop-backend",
        routeKind: "local-backend",
        routeName: "LocalBackend",
        viaFallback: false,
        checkedAt: Date.now(),
      },
      allowClientProxyFallback
        ? "Fallback automatico para proxies em nuvem ativado."
        : undefined,
    );

    if (!allowClientProxyFallback) {
      updateRuntimeState({
        activeMode: "desktop-local",
        lastRoute: warning.route,
        lastWarning: warning,
        backendAvailable: false,
      });
      desktopBackendClient.setRuntimeState({
        activeMode: "desktop-local",
        lastRoute: "LocalBackend",
        lastWarning: JSON.stringify(warning),
        backendAvailable: false,
        backendInitializing: health.initializing,
        lastError: health.initializing ? undefined : healthMessage,
      });
      throw buildBackendUnavailableError(healthMessage, health.initializing);
    }

    const fallback = await parseRssUrlDetailed(url, {
      signal,
      skipCache,
    });

    updateRuntimeState({
      activeMode: "cloud-fallback",
      lastRoute: fallback.route,
      lastWarning: warning,
      backendAvailable: false,
    });
    desktopBackendClient.setRuntimeState({
      activeMode: "cloud-fallback",
      lastRoute: fallback.route.routeName,
      lastWarning: JSON.stringify(warning),
      backendAvailable: false,
      lastError: health.error,
    });

    return {
      title: fallback.title,
      articles: fallback.articles,
      route: {
        ...fallback.route,
        viaFallback: true,
      },
      warning,
      cached: fallback.cached,
      source: "client-fallback",
    };
  }

  const result = await parseRssUrlDetailed(url, {
    signal,
    skipCache,
  });
  updateRuntimeState({
    activeMode: env.isTauri ? "desktop-local" : "web-client",
    lastRoute: result.route,
    lastWarning: undefined,
    backendAvailable: false,
  });

  return {
    title: result.title,
    articles: result.articles,
    route: result.route,
    cached: result.cached,
    source: "client",
  };
}
