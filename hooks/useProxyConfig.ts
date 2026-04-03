/**
 * useProxyConfig.ts
 *
 * Hook for managing runtime proxy configuration through ProxyManager.
 * Proxy metadata still comes from config/proxyConfig, but keys, preference,
 * testing and runtime health all reflect the live manager state.
 */

import { useState, useEffect, useCallback } from "react";
import {
  PROXY_CONFIGS,
  validateProxyApiKey,
  getProxiesRequiringApiKeys,
  assessProxyHealth,
} from "../config/proxyConfig";
import {
  ProxyManager,
  proxyManager,
  type ProxyTestResult,
} from "../services/proxyManager";

export interface ProxyApiKeyStatus {
  proxyId: string;
  proxyName: string;
  hasKey: boolean;
  isValid: boolean;
  error?: string;
  envVar?: string;
  origin?: string;
}

export type ProxyApiKeysState = Record<string, string>;

const buildKeyState = (): ProxyApiKeysState => ({
  rss2json: ProxyManager.getRss2jsonApiKey(),
  "corsproxy-io": ProxyManager.getCorsproxyCIOApiKey(),
});

const getRuntimeProxyNameSet = () =>
  new Set(proxyManager.getProxyConfigs().map((config) => config.name));

const isRuntimeSupportedProxy = (proxyId: string) => {
  const config = PROXY_CONFIGS[proxyId];
  if (!config) return false;
  return getRuntimeProxyNameSet().has(config.name);
};

/**
 * Hook for managing proxy configurations and API keys
 */
export function useProxyConfig() {
  const [apiKeys, setApiKeys] = useState<ProxyApiKeysState>(() => {
    ProxyManager.loadPreferences();
    return buildKeyState();
  });
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const isLoading = false;
  const [preferLocalProxy, setPreferLocalProxyState] = useState(() => {
    ProxyManager.loadPreferences();
    return ProxyManager.getPreferLocalProxy();
  });

  const syncFromManager = useCallback(() => {
    ProxyManager.loadPreferences();
    setApiKeys(buildKeyState());
    setPreferLocalProxyState(ProxyManager.getPreferLocalProxy());
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      syncFromManager();
    };

    window.addEventListener(
      "localStorage-change",
      handleStorageChange as EventListener,
    );
    return () => {
      window.removeEventListener(
        "localStorage-change",
        handleStorageChange as EventListener,
      );
    };
  }, [syncFromManager]);

  /**
   * Validate and set an API key for a proxy
   */
  const setApiKey = useCallback((proxyId: string, apiKey: string): boolean => {
    const validation = validateProxyApiKey(proxyId, apiKey);

    if (!validation.valid) {
      setValidationErrors((prev) => ({
        ...prev,
        [proxyId]: validation.error || "Invalid API key",
      }));
      return false;
    }

    setValidationErrors((prev) => {
      const next = { ...prev };
      delete next[proxyId];
      return next;
    });

    if (proxyId === "rss2json") {
      ProxyManager.setRss2jsonApiKey(apiKey, "manual");
    } else if (proxyId === "corsproxy-io") {
      ProxyManager.setCorsproxyCIOApiKey(apiKey, "manual");
    }

    setApiKeys(buildKeyState());
    return true;
  }, []);

  /**
   * Clear an API key
   */
  const clearApiKey = useCallback((proxyId: string) => {
    if (proxyId === "rss2json") {
      ProxyManager.setRss2jsonApiKey("");
    } else if (proxyId === "corsproxy-io") {
      ProxyManager.setCorsproxyCIOApiKey("");
    }

    setValidationErrors((prev) => {
      const next = { ...prev };
      delete next[proxyId];
      return next;
    });
    setApiKeys(buildKeyState());
  }, []);

  const setPreferLocalProxy = useCallback((prefer: boolean) => {
    ProxyManager.setPreferLocalProxy(prefer);
    setPreferLocalProxyState(prefer);
  }, []);

  const setProxyEnabled = useCallback((proxyId: string, enabled: boolean) => {
    const config = PROXY_CONFIGS[proxyId];
    if (!config || !isRuntimeSupportedProxy(proxyId)) return;

    if (enabled) {
      proxyManager.enableProxy(config.name);
    } else {
      proxyManager.disableProxy(config.name);
    }

    syncFromManager();
  }, [syncFromManager]);

  /**
   * Get validation status for all proxies with API keys
   */
  const getApiKeyStatus = useCallback((): ProxyApiKeyStatus[] => {
    const proxiesWithKeys = getProxiesRequiringApiKeys();

    return proxiesWithKeys.map((proxy) => {
      const key = apiKeys[proxy.id] || "";
      const validation = validateProxyApiKey(proxy.id, key);
      const origin =
        proxy.id === "rss2json"
          ? ProxyManager.getRss2jsonApiKeyOrigin()
          : ProxyManager.getCorsproxyCIOApiKeyOrigin();

      return {
        proxyId: proxy.id,
        proxyName: proxy.name,
        hasKey: !!key && key !== "your-api-key-here",
        isValid: validation.valid && !!key,
        error: validationErrors[proxy.id],
        envVar: proxy.envVar,
        origin,
      };
    });
  }, [apiKeys, validationErrors]);

  /**
   * Get proxy information with runtime health assessment
   */
  const getProxyInfo = useCallback(
    (proxyId: string) => {
      const config = PROXY_CONFIGS[proxyId];
      if (!config || !isRuntimeSupportedProxy(proxyId)) return null;

      const runtimeName = config.name;
      const runtimeStats = proxyManager.getProxyStatsByName(runtimeName);
      const runtimeScore =
        runtimeStats && runtimeStats.totalRequests > 0
          ? Math.round(runtimeStats.healthScore * 100)
          : null;
      const metadataHealth = assessProxyHealth(proxyId);
      const status = getApiKeyStatus().find((s) => s.proxyId === proxyId);

      return {
        ...config,
        health: {
          score: runtimeScore ?? metadataHealth.score,
          recommendation:
            runtimeScore !== null
              ? runtimeScore >= 80
                ? "Healthy in current session"
                : runtimeScore >= 50
                  ? "Degraded in current session"
                  : "Needs attention in current session"
              : metadataHealth.recommendation,
        },
        apiKeyStatus: status,
      };
    },
    [getApiKeyStatus],
  );

  /**
   * Get all configured proxies with live runtime state
   */
  const getAllProxiesStatus = useCallback(() => {
    const runtimeStats = proxyManager.getProxyStats();
    const runtimeConfigs = new Map(
      proxyManager.getProxyConfigs().map((config) => [config.name, config]),
    );

    return Object.keys(PROXY_CONFIGS)
      .filter((proxyId) => isRuntimeSupportedProxy(proxyId))
      .map((proxyId) => {
        const config = PROXY_CONFIGS[proxyId];
        const runtime = runtimeStats[config.name];
        const runtimeConfig = runtimeConfigs.get(config.name);
        const apiKeyStatus = getApiKeyStatus().find(
          (s) => s.proxyId === proxyId,
        );
        const fallbackHealth = assessProxyHealth(proxyId);

        return {
          id: proxyId,
          name: config.name,
          reliability: config.reliability,
          responseTime: config.responseTime,
          hasApiKey: config.hasApiKey,
          isConfigured: apiKeyStatus?.hasKey || !config.hasApiKey,
          enabled: runtimeConfig?.enabled ?? true,
          health: {
            score:
              runtime && runtime.totalRequests > 0
                ? Math.round(runtime.healthScore * 100)
                : fallbackHealth.score,
            recommendation:
              runtime && runtime.totalRequests > 0
                ? `Sessao atual: ${runtime.success}/${runtime.totalRequests} sucesso`
                : fallbackHealth.recommendation,
          },
          apiKeyStatus,
        };
      });
  }, [getApiKeyStatus]);

  /**
   * Test a proxy with a real request
   */
  const testProxy = useCallback(
    async (proxyId: string): Promise<ProxyTestResult> => {
      const config = PROXY_CONFIGS[proxyId];
      if (!config) {
        return {
          success: false,
          responseTime: 0,
          error: `Unknown proxy: ${proxyId}`,
          detail: "Proxy nao encontrado na configuracao.",
          route: "client-proxy",
        };
      }

      if (!isRuntimeSupportedProxy(proxyId)) {
        return {
          success: false,
          responseTime: 0,
          error: `Unsupported proxy runtime: ${config.name}`,
          detail:
            "Esta rota existe apenas como metadado e ainda nao possui implementacao no runtime ativo.",
          route: "client-proxy",
        };
      }

      return proxyManager.testProxy(config.name);
    },
    [],
  );

  const loadProxyPreferences = useCallback(() => {
    syncFromManager();
  }, [syncFromManager]);

  return {
    apiKeys,
    validationErrors,
    isLoading,
    preferLocalProxy,
    setPreferLocalProxy,
    setProxyEnabled,
    setApiKey,
    clearApiKey,
    getApiKeyStatus,
    getProxyInfo,
    getAllProxiesStatus,
    testProxy,
    loadProxyPreferences,
  };
}

/**
 * Simple hook to get current proxy status and stats
 */
export function useProxyStats() {
  const [stats, setStats] = useState(() => proxyManager.getOverallStats());
  const [proxyStats, setProxyStats] = useState(() =>
    proxyManager.getProxyStats(),
  );

  const refresh = useCallback(() => {
    setStats(proxyManager.getOverallStats());
    setProxyStats(proxyManager.getProxyStats());
  }, []);

  useEffect(() => {
    const interval = setInterval(refresh, 10_000);
    return () => clearInterval(interval);
  }, [refresh]);

  return {
    stats,
    proxyStats,
    refresh,
  };
}
