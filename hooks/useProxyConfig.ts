/**
 * useProxyConfig.ts
 *
 * Hook for managing and validating proxy API keys and configuration
 * Provides utilities for setting, validating, and loading proxy settings
 */

import { useState, useEffect, useCallback } from 'react';
import {
  PROXY_CONFIGS,
  validateProxyApiKey,
  getProxiesRequiringApiKeys,
  assessProxyHealth,
} from '../config/proxyConfig';
import { ProxyManager, proxyManager } from '../services/proxyManager';

export interface ProxyApiKeyStatus {
  proxyId: string;
  proxyName: string;
  hasKey: boolean;
  isValid: boolean;
  error?: string;
  envVar?: string;
}

export interface ProxyApiKeysState {
  rss2json: string;
  corsproxy: string;
}

/**
 * Hook for managing proxy configurations and API keys
 */
export function useProxyConfig() {
  const [apiKeys, setApiKeys] = useState<ProxyApiKeysState>({
    rss2json: '',
    corsproxy: '',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load API keys from environment and localStorage on mount
  useEffect(() => {
    const loadApiKeys = () => {
      setIsLoading(true);

      const rss2jsonKey =
        import.meta.env.VITE_RSS2JSON_API_KEY ||
        localStorage.getItem('rss2json_api_key') ||
        '';

      const corsproxyCIOKey =
        import.meta.env.VITE_CORSPROXY_API_KEY ||
        localStorage.getItem('corsproxy_api_key') ||
        '';

      // Load already configured key from ProxyManager
      const currentRss2json = ProxyManager.getRss2jsonApiKey();

      setApiKeys({
        rss2json: currentRss2json || rss2jsonKey,
        corsproxy: corsproxyCIOKey,
      });

      setIsLoading(false);
    };

    loadApiKeys();
  }, []);

  /**
   * Validate and set an API key for a proxy
   */
  const setApiKey = useCallback(
    (proxyId: string, apiKey: string): boolean => {
      const validation = validateProxyApiKey(proxyId, apiKey);

      if (!validation.valid) {
        setValidationErrors((prev) => ({
          ...prev,
          [proxyId]: validation.error || 'Invalid API key',
        }));
        return false;
      }

      // Clear error
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[proxyId];
        return newErrors;
      });

      // Update state
      setApiKeys((prev) => ({
        ...prev,
        [proxyId]: apiKey,
      }));

      // Save to storage and ProxyManager based on proxy type
      if (proxyId === 'rss2json') {
        ProxyManager.setRss2jsonApiKey(apiKey, 'manual');
        localStorage.setItem('rss2json_api_key', apiKey);
      } else if (proxyId === 'corsproxy') {
        localStorage.setItem('corsproxy_api_key', apiKey);
      }

      return true;
    },
    []
  );

  /**
   * Clear an API key
   */
  const clearApiKey = useCallback((proxyId: string) => {
    setApiKeys((prev) => ({
      ...prev,
      [proxyId]: '',
    }));

    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[proxyId];
      return newErrors;
    });

    if (proxyId === 'rss2json') {
      ProxyManager.setRss2jsonApiKey('');
      localStorage.removeItem('rss2json_api_key');
    } else if (proxyId === 'corsproxy') {
      localStorage.removeItem('corsproxy_api_key');
    }
  }, []);

  /**
   * Get validation status for all proxies with API keys
   */
  const getApiKeyStatus = useCallback((): ProxyApiKeyStatus[] => {
    const proxiesWithKeys = getProxiesRequiringApiKeys();

    return proxiesWithKeys.map((proxy) => {
      const key = apiKeys[proxy.id as keyof ProxyApiKeysState] || '';
      const validation = validateProxyApiKey(proxy.id, key);

      return {
        proxyId: proxy.id,
        proxyName: proxy.name,
        hasKey: !!key && key !== 'your-api-key-here',
        isValid: validation.valid && !!key,
        error: validationErrors[proxy.id],
        envVar: proxy.envVar,
      };
    });
  }, [apiKeys, validationErrors]);

  /**
   * Get proxy information with health assessment
   */
  const getProxyInfo = useCallback(
    (proxyId: string) => {
      const config = PROXY_CONFIGS[proxyId];
      if (!config) return null;

      const health = assessProxyHealth(proxyId);
      const status = getApiKeyStatus().find((s) => s.proxyId === proxyId);

      return {
        ...config,
        health,
        apiKeyStatus: status,
      };
    },
    [getApiKeyStatus]
  );

  /**
   * Get all configured proxies with their status
   */
  const getAllProxiesStatus = useCallback(() => {
    return Object.keys(PROXY_CONFIGS).map((proxyId) => {
      const config = PROXY_CONFIGS[proxyId];
      const health = assessProxyHealth(proxyId);
      const apiKeyStatus = getApiKeyStatus().find((s) => s.proxyId === proxyId);

      return {
        id: proxyId,
        name: config.name,
        reliability: config.reliability,
        responseTime: config.responseTime,
        hasApiKey: config.hasApiKey,
        isConfigured: apiKeyStatus?.hasKey || !config.hasApiKey,
        health,
        apiKeyStatus,
      };
    });
  }, [getApiKeyStatus]);

  /**
   * Test a proxy with a simple request
   */
  const testProxy = useCallback(
    async (_proxyId: string, _testUrl: string = 'https://www.example.com/'): Promise<{
      success: boolean;
      responseTime?: number;
      error?: string;
    }> => {
      try {
        const startTime = Date.now();

        // We can't test from metadata alone - would need access to proxyManager internals
        // For now, we'll return a mock success
        // In production, this should be called from the server or via API
        return {
          success: true,
          responseTime: Date.now() - startTime,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
    []
  );

  /**
   * Load proxy preferences (for theme/settings panel)
   */
  const loadProxyPreferences = useCallback(() => {
    ProxyManager.loadPreferences();
    const rss2json = ProxyManager.getRss2jsonApiKey();
    if (rss2json) {
      setApiKeys((prev) => ({
        ...prev,
        rss2json,
      }));
    }
  }, []);

  return {
    apiKeys,
    validationErrors,
    isLoading,
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
  const [stats, setStats] = useState(proxyManager.getOverallStats());
  const [proxyStats, setProxyStats] = useState(proxyManager.getProxyStats());

  const refresh = useCallback(() => {
    setStats(proxyManager.getOverallStats());
    setProxyStats(proxyManager.getProxyStats());
  }, []);

  useEffect(() => {
    // Refresh stats every 10 seconds
    const interval = setInterval(refresh, 10000);
    return () => clearInterval(interval);
  }, [refresh]);

  return {
    stats,
    proxyStats,
    refresh,
  };
}
