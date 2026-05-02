import { useCallback, useEffect, useState } from "react";
import { desktopBackendClient } from "../services/desktopBackendClient";
import { type FeedDiagnosticInfo } from "../services/feedDiagnostics";
import { ProxyManager, proxyManager } from "../services/proxyManager";

type RouteStatus = "healthy" | "degraded" | "offline" | "idle" | "disabled";

export interface ProxyDashboardRoute {
  id: string;
  name: string;
  transport: "desktop-backend" | "client";
  routeKind: "local-backend" | "proxy";
  enabled: boolean;
  status: RouteStatus;
  healthScore: number;
  successRate: number | null;
  totalRequests: number;
  successCount: number;
  failureCount: number;
  avgResponseTime: number;
  consecutiveFailures: number;
  lastUsedAt?: number;
  detail: string;
}

export interface ProxyDashboardSnapshot {
  runtime: {
    activeMode: "desktop-local" | "cloud-fallback" | "web-client" | "unknown";
    lastRoute?: string;
    lastWarning?: string;
    warningDetails?: FeedDiagnosticInfo;
    backendAvailable: boolean;
    backendInitializing?: boolean;
    lastCheckedAt?: number;
    lastError?: string;
  };
  backend: {
    enabled: boolean;
    available: boolean;
    checkedAt?: number;
    error?: string;
    baseUrl?: string;
    diagnostic?: string;
    health?: string;
    pid?: number;
    restartAvailable?: boolean;
  };
  routes: ProxyDashboardRoute[];
  summary: {
    totalRoutes: number;
    healthyRoutes: number;
    totalRequests: number;
    totalSuccesses: number;
    totalFailures: number;
    successRate: number;
    fallbackActive: boolean;
    missingApiKeys: string[];
  };
}

const REFRESH_INTERVAL_MS = 10_000;

const getStatusFromHealth = (
  healthScore: number,
  totalRequests: number,
  available = true,
): RouteStatus => {
  if (!available) return "disabled";
  if (totalRequests === 0) return "idle";
  if (healthScore >= 80) return "healthy";
  if (healthScore >= 45) return "degraded";
  return "offline";
};

const normalizeWarningDetails = (
  raw: string | undefined,
): FeedDiagnosticInfo | undefined => {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as FeedDiagnosticInfo;
  } catch {
    return undefined;
  }
};

const formatWarningDetails = (
  details: FeedDiagnosticInfo | undefined,
  fallback: string | undefined,
) => {
  if (!details) return fallback;
  return details.warning || `${details.summary}. ${details.action}`;
};

const buildInitialSnapshot = (): ProxyDashboardSnapshot => ({
  runtime: {
    activeMode: "unknown",
    backendAvailable: false,
  },
  backend: {
    enabled: desktopBackendClient.isEnabled(),
    available: false,
    restartAvailable: false,
  },
  routes: [],
  summary: {
    totalRoutes: 0,
    healthyRoutes: 0,
    totalRequests: 0,
    totalSuccesses: 0,
    totalFailures: 0,
    successRate: 0,
    fallbackActive: false,
    missingApiKeys: [],
  },
});

const buildClientRoutes = (): ProxyDashboardRoute[] => {
  const statsByName = proxyManager.getProxyStats();
  const runtimeConfigs = new Map(
    proxyManager.getProxyConfigs().map((config) => [config.name, config]),
  );

  return Object.entries(statsByName)
    .filter(([name]) => name !== "LocalProxy")
    .map(([name, stats]) => {
      const enabled = runtimeConfigs.get(name)?.enabled ?? true;
      const healthScore = Math.round(stats.healthScore * 100);
      const successRate =
        stats.totalRequests > 0
          ? Math.round((stats.success / stats.totalRequests) * 100)
          : null;

      const nextRoute: ProxyDashboardRoute = {
        id: `client:${name}`,
        name,
        transport: "client",
        routeKind: "proxy",
        enabled,
        status: getStatusFromHealth(healthScore, stats.totalRequests, enabled),
        healthScore: enabled ? healthScore : 0,
        successRate,
        totalRequests: stats.totalRequests,
        successCount: stats.success,
        failureCount: stats.failures,
        avgResponseTime: stats.avgResponseTime,
        consecutiveFailures: stats.consecutiveFailures,
        lastUsedAt: stats.lastUsed || undefined,
        detail:
          !enabled
            ? "Desativado. Não entra no cálculo de saúde agregada."
            : stats.totalRequests > 0
            ? `${stats.success}/${stats.totalRequests} sucesso nesta sessao`
            : "Ainda sem uso nesta sessao",
      };
      return nextRoute;
    })
    .sort((a, b) => {
      if (a.transport !== b.transport) {
        return a.transport === "desktop-backend" ? -1 : 1;
      }
      if (a.healthScore !== b.healthScore) {
        return b.healthScore - a.healthScore;
      }
      return a.name.localeCompare(b.name);
    });
};

const buildMissingApiKeys = () => {
  const missing: string[] = [];
  if (!ProxyManager.getRss2jsonApiKey()) {
    missing.push("RSS2JSON");
  }
  if (!ProxyManager.getCorsproxyCIOApiKey()) {
    missing.push("CorsProxy.io");
  }
  return missing;
};

export const buildProxyDashboardSnapshot =
  async (): Promise<ProxyDashboardSnapshot> => {
    const runtimeState = desktopBackendClient.getRuntimeState();
    const warningDetails = normalizeWarningDetails(runtimeState.lastWarning);
    const baseRoutes = buildClientRoutes();
    let routes = baseRoutes;
    let backendAvailable = false;
    let backendCheckedAt: number | undefined;
    let backendError: string | undefined;
    const desktopStatus = await desktopBackendClient.getDesktopStatus();

    if (desktopBackendClient.isEnabled()) {
      const health =
        desktopStatus?.health === "ready"
          ? {
              available: true,
              checkedAt: Date.now(),
              error: undefined,
              initializing: false,
            }
          : await desktopBackendClient.checkHealth(false);
      backendAvailable = health.available;
      backendCheckedAt = health.checkedAt;
      backendError = health.error;

      if (health.available) {
        try {
          const statsResponse = await desktopBackendClient.getProxyStats();
          const stats = statsResponse.localProxy;
          const healthScore =
            stats.totalRequests > 0
              ? Math.round(
                  (stats.successRate * 0.75 +
                    (stats.avgResponseMs <= 1200 ? 25 : 10)) *
                    100,
                ) / 100
              : 100;
          routes = [
            {
              id: "desktop:LocalBackend",
              name: "LocalBackend",
              transport: "desktop-backend",
              routeKind: "local-backend",
              enabled: true,
              status: getStatusFromHealth(
                Math.min(100, Math.round(healthScore)),
                stats.totalRequests,
                true,
              ),
              healthScore: Math.min(100, Math.round(healthScore)),
              successRate: Math.round(stats.successRate),
              totalRequests: stats.totalRequests,
              successCount: stats.successes,
              failureCount: stats.failures,
              avgResponseTime: stats.avgResponseMs,
              consecutiveFailures: 0,
              lastUsedAt: stats.lastUsedAt
                ? new Date(stats.lastUsedAt).getTime()
                : undefined,
              detail:
                stats.totalRequests > 0
                  ? `${stats.successes}/${stats.totalRequests} sucesso no backend local`
                  : "Backend local ativo, sem uso registrado nesta sessao",
            },
            ...baseRoutes,
          ];
        } catch (error) {
          routes = [
            {
              id: "desktop:LocalBackend",
              name: "LocalBackend",
              transport: "desktop-backend",
              routeKind: "local-backend",
              enabled: true,
              status: "healthy",
              healthScore: 100,
              successRate: null,
              totalRequests: 0,
              successCount: 0,
              failureCount: 0,
              avgResponseTime: 0,
              consecutiveFailures: 0,
              detail:
                error instanceof Error
                  ? `Backend local ativo, mas sem estatisticas: ${error.message}`
                  : "Backend local ativo, mas sem estatisticas detalhadas",
            },
            ...baseRoutes,
          ];
        }
      } else {
        routes = [
          {
            id: "desktop:LocalBackend",
            name: "LocalBackend",
            transport: "desktop-backend",
            routeKind: "local-backend",
            enabled: true,
            status: health.initializing ? "idle" : "offline",
            healthScore: 0,
            successRate: null,
            totalRequests: 0,
            successCount: 0,
            failureCount: 0,
            avgResponseTime: 0,
            consecutiveFailures: 0,
            detail: health.initializing
              ? "Backend local inicializando"
              : backendError || "Backend local indisponivel",
          },
          ...baseRoutes,
        ];
      }
    }

    const staleBackendWarning =
      backendAvailable && warningDetails?.cause === "backend_unavailable";
    const runtimeWarningDetails = staleBackendWarning
      ? undefined
      : warningDetails;
    const runtimeLastWarning = staleBackendWarning
      ? undefined
      : formatWarningDetails(warningDetails, runtimeState.lastWarning);

    const totals = routes.reduce(
      (acc, route) => {
        acc.totalRequests += route.totalRequests;
        acc.totalSuccesses += route.successCount;
        acc.totalFailures += route.failureCount;
        if (
          route.status === "healthy" ||
          route.status === "idle" ||
          route.status === "disabled"
        ) {
          acc.healthyRoutes += 1;
        }
        return acc;
      },
      {
        totalRequests: 0,
        totalSuccesses: 0,
        totalFailures: 0,
        healthyRoutes: 0,
      },
    );

    return {
      runtime: {
        activeMode: runtimeState.activeMode,
        lastRoute: runtimeState.lastRoute,
        lastWarning: runtimeLastWarning,
        warningDetails: runtimeWarningDetails,
        backendAvailable,
        backendInitializing: runtimeState.backendInitializing,
        lastCheckedAt: runtimeState.lastCheckedAt,
        lastError: runtimeState.lastError,
      },
      backend: {
        enabled: desktopBackendClient.isEnabled(),
        available: backendAvailable,
        checkedAt: backendCheckedAt,
        error: backendError,
        baseUrl: desktopStatus?.baseUrl,
        diagnostic: desktopStatus?.diagnostic,
        health: desktopStatus?.health,
        pid: desktopStatus?.pid,
        restartAvailable: desktopBackendClient.isEnabled(),
      },
      routes,
      summary: {
        totalRoutes: routes.length,
        healthyRoutes: totals.healthyRoutes,
        totalRequests: totals.totalRequests,
        totalSuccesses: totals.totalSuccesses,
        totalFailures: totals.totalFailures,
        successRate:
          totals.totalRequests > 0
            ? Math.round((totals.totalSuccesses / totals.totalRequests) * 100)
            : 0,
        fallbackActive:
          runtimeState.activeMode === "cloud-fallback" && !staleBackendWarning,
        missingApiKeys: buildMissingApiKeys(),
      },
    };
  };

export function useProxyDashboard(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;
  const [snapshot, setSnapshot] =
    useState<ProxyDashboardSnapshot>(buildInitialSnapshot);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const next = await buildProxyDashboardSnapshot();
      setSnapshot(next);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const restartBackend = useCallback(async () => {
    await desktopBackendClient.restartBackend();
    await refresh();
  }, [refresh]);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }
    void refresh();
    const timer = window.setInterval(() => {
      void refresh();
    }, REFRESH_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [enabled, refresh]);

  return {
    snapshot,
    isLoading,
    refresh,
    restartBackend,
  };
}
