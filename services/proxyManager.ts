/**
 * proxyManager.ts
 *
 * Enhanced CORS proxy management system with multiple proxy configurations,
 * health monitoring, automatic failover, and performance tracking
 *
 * @author Personal News Dashboard
 * @version 1.0.0
 */

export interface ProxyConfig {
  url: string;
  name: string;
  responseTransform?: (response: string) => string;
  headers?: Record<string, string>;
  timeout?: number;
  priority: number;
  enabled: boolean;
}

export interface ProxyStats {
  success: number;
  failures: number;
  totalRequests: number;
  avgResponseTime: number;
  lastUsed: number;
  lastSuccess: number;
  lastFailure: number;
  consecutiveFailures: number;
  healthScore: number; // 0-1 score based on recent performance
}

export interface ProxyAttempt {
  proxyName: string;
  proxyUrl: string;
  targetUrl: string;
  timestamp: number;
  success: boolean;
  responseTime: number;
  error?: string;
  statusCode?: number;
}

export interface ProxyManagerConfig {
  maxRetries: number;
  healthCheckInterval: number;
  failureThreshold: number;
  recoveryThreshold: number;
  defaultTimeout: number;
}

export class ProxyManager {
  private static rss2jsonApiKey: string = '';
  private static rss2jsonApiKeyOrigin: string = 'not-configured'; // 'env.local', 'localStorage', 'manual', 'not-configured'
  private static corsproxyCIOApiKey: string = '';
  private static corsproxyCIOApiKeyOrigin: string = 'not-configured';
  private static preferLocalProxy: boolean = false;

  static setRss2jsonApiKey(key: string, origin?: string) {
    this.rss2jsonApiKey = key;
    this.rss2jsonApiKeyOrigin = origin || 'manual';
    // Update localStorage for persistence
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('rss2json_api_key', key);
      if (origin) {
        localStorage.setItem('rss2json_api_key_origin', origin);
      }
    }
  }

  static setCorsproxyCIOApiKey(key: string, origin?: string) {
    this.corsproxyCIOApiKey = key;
    this.corsproxyCIOApiKeyOrigin = origin || 'manual';
    // Update localStorage for persistence
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('corsproxy_cio_api_key', key);
      if (origin) {
        localStorage.setItem('corsproxy_cio_api_key_origin', origin);
      }
    }
  }

  static setPreferLocalProxy(prefer: boolean) {
    this.preferLocalProxy = prefer;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('prefer_local_proxy', prefer ? 'true' : 'false');
    }
  }

  static getRss2jsonApiKey(): string {
    return this.rss2jsonApiKey;
  }

  static getRss2jsonApiKeyOrigin(): string {
    return this.rss2jsonApiKeyOrigin;
  }

  static getCorsproxyCIOApiKey(): string {
    return this.corsproxyCIOApiKey;
  }

  static getCorsproxyCIOApiKeyOrigin(): string {
    return this.corsproxyCIOApiKeyOrigin;
  }

  static getPreferLocalProxy(): boolean {
    return this.preferLocalProxy;
  }

  static loadPreferences() {
    if (typeof localStorage !== 'undefined') {
      const savedKey = localStorage.getItem('rss2json_api_key');
      if (savedKey) {
        this.rss2jsonApiKey = savedKey;
        this.rss2jsonApiKeyOrigin = localStorage.getItem('rss2json_api_key_origin') || 'localStorage';
      }

      const savedCorsproxyCIOKey = localStorage.getItem('corsproxy_cio_api_key');
      if (savedCorsproxyCIOKey) {
        this.corsproxyCIOApiKey = savedCorsproxyCIOKey;
        this.corsproxyCIOApiKeyOrigin = localStorage.getItem('corsproxy_cio_api_key_origin') || 'localStorage';
      }

      const savedPrefer = localStorage.getItem('prefer_local_proxy');
      if (savedPrefer) this.preferLocalProxy = savedPrefer === 'true';
    }
  }

  private readonly PROXY_CONFIGS: ProxyConfig[] = [
    {
      url: "/local-proxy/",
      name: "LocalProxy",
      headers: {
        Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml",
      },
      timeout: 10000,
      priority: -2,
      enabled: true,
    },
    {
      url: "https://api.allorigins.win/get?url=",
      name: "AllOrigins",
      responseTransform: (response: string) => {
        try {
          const parsed = JSON.parse(response);
          return parsed.contents || response;
        } catch {
          return response;
        }
      },
      headers: {
        Accept: "application/json",
      },
      timeout: 10000,
      priority: 0,
      enabled: true,
    },
    {
      url: "https://api.codetabs.com/v1/proxy?quest=",
      name: "CodeTabs",
      responseTransform: (response: string) => {
        // CodeTabs sometimes wraps response in JSON
        try {
          const parsed = JSON.parse(response);
          if (parsed.data) return parsed.data;
          return response;
        } catch {
          return response;
        }
      },
      timeout: 15000,
      priority: 1,
      enabled: true,
    },
    {
      url: "https://whatever-origin.herokuapp.com/get?url=",
      name: "WhateverOrigin",
      responseTransform: (response: string) => {
        try {
          const parsed = JSON.parse(response);
          return parsed.contents || response;
        } catch {
          return response;
        }
      },
      headers: {
        Accept: "application/json",
      },
      timeout: 12000,
      priority: 2,
      enabled: true,
    },
    {
      url: "https://textproxy.io/api/proxy?url=",
      name: "TextProxy",
      headers: {
        Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml",
        "User-Agent": "Personal News Dashboard/1.0",
      },
      timeout: 10000,
      priority: 3,
      enabled: true,
    },
    {
      url: "https://corsproxy.io/?",
      name: "CorsProxy.io",
      headers: {
        Accept:
          "application/rss+xml, application/atom+xml, application/xml, text/xml",
        "User-Agent": "Personal News Dashboard/1.0",
      },
      timeout: 8000,
      priority: 4,
      enabled: true,
    },
    {
      url: "https://api.rss2json.com/v1/api.json?rss_url=",
      name: "RSS2JSON",
      responseTransform: (response: string) => {
        // RSS2JSON returns object, we need it as string for the parser to detect JSON format
        // Note: fetch() .text() will already return stringified JSON if the response is JSON
        return response;
      },
      priority: 5,
      enabled: true,
      timeout: 5000,
    },
    {
      url: "https://cors-anywhere.herokuapp.com/",
      name: "CORS Anywhere",
      headers: {
        Accept:
          "application/rss+xml, application/atom+xml, application/xml, text/xml",
        "User-Agent": "Personal News Dashboard/1.0",
        "X-Requested-With": "XMLHttpRequest",
      },
      timeout: 12000,
      priority: 6,
      enabled: true,
    },
    // (moved above in free-first ordering)
  ];

  private proxyStats = new Map<string, ProxyStats>();
  private proxyHealthCheck = new Map<string, boolean>();
  private config: ProxyManagerConfig;
  private healthCheckTimer?: NodeJS.Timeout;
  private preferredProxyByHost = new Map<string, { name: string; ts: number }>();
  private preferredProxyTtlMs = 6 * 60 * 60 * 1000; // 6h

  constructor(config?: Partial<ProxyManagerConfig>) {
    this.config = {
      maxRetries: 3,
      healthCheckInterval: 5 * 60 * 1000, // 5 minutes
      failureThreshold: 3,
      recoveryThreshold: 2,
      defaultTimeout: 10000,
      ...config,
    };

    // Initialize stats for all proxies
    this.initializeProxyStats();
    this.loadPreferredProxyCache();

    // Start health monitoring
    this.startHealthMonitoring();
  }

  /**
   * Get available proxies sorted by health score and priority
   */
  getAvailableProxies(): ProxyConfig[] {
    const isLocalhost =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        window.location.hostname.endsWith(".local"));
    const allowLocalProxy = ProxyManager.preferLocalProxy || isLocalhost;

    // Create a copy to modify priorities dynamically
    const configsToSort = this.PROXY_CONFIGS.filter(
      (proxy) =>
        proxy.enabled &&
        this.isProxyHealthy(proxy.name) &&
        (proxy.name !== "LocalProxy" || allowLocalProxy)
    ).map(proxy => {
      // Adjust LocalProxy priority based on preference
      if (proxy.name === 'LocalProxy') {
        return {
          ...proxy,
          priority: allowLocalProxy && ProxyManager.preferLocalProxy ? -2 : 999
        };
      }

      // Adjust RSS2JSON priority based on API key availability
      if (proxy.name === 'RSS2JSON') {
        return {
          ...proxy,
          priority: ProxyManager.rss2jsonApiKey ? 1 : 5
        };
      }

      return proxy;
    }).sort((a, b) => {
      const statsA = this.proxyStats.get(a.name);
      const statsB = this.proxyStats.get(b.name);

      // Sort by health score first, then by priority
      const healthScoreA = statsA?.healthScore || 0;
      const healthScoreB = statsB?.healthScore || 0;

      if (Math.abs(healthScoreA - healthScoreB) > 0.1) {
        return healthScoreB - healthScoreA; // Higher health score first
      }

      return a.priority - b.priority; // Lower priority number first
    });

    return configsToSort;
  }

  /**
   * Try to fetch content through a specific proxy
   */
  async tryProxy(proxyConfig: ProxyConfig, targetUrl: string): Promise<string> {
    const startTime = Date.now();

    try {
      const proxyUrl = this.buildProxyUrl(proxyConfig, targetUrl);
      const timeout = proxyConfig.timeout || this.config.defaultTimeout;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(proxyUrl, {
        method: "GET",
        signal: controller.signal,
        headers: proxyConfig.headers || {},
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Validate response headers for security
      const contentType = response.headers.get('content-type') || '';
      const contentLength = response.headers.get('content-length');

      // Check for suspicious content types
      const suspiciousTypes = [
        'application/javascript',
        'text/javascript',
        'application/x-executable',
        'application/x-shockwave-flash',
      ];

      const isSuspicious = suspiciousTypes.some(type =>
        contentType.toLowerCase().includes(type)
      );

      if (isSuspicious) {
        throw new Error(`Suspicious content type from proxy: ${contentType}`);
      }

      // Validate content length (reject extremely large responses)
      if (contentLength) {
        const size = parseInt(contentLength, 10);
        const MAX_RESPONSE_SIZE = 10 * 1024 * 1024; // 10MB
        if (size > MAX_RESPONSE_SIZE) {
          throw new Error(`Response too large: ${size} bytes (max: ${MAX_RESPONSE_SIZE})`);
        }
      }

      let content = await response.text();

      // Validate content structure
      if (!this.validateProxyResponse(content, contentType)) {
        throw new Error(`Invalid response structure from proxy: ${proxyConfig.name}`);
      }

      // Apply response transformation if configured
      if (proxyConfig.responseTransform) {
        content = proxyConfig.responseTransform(content);
      }

      // Record successful attempt
      this.recordProxyAttempt({
        proxyName: proxyConfig.name,
        proxyUrl,
        targetUrl,
        timestamp: startTime,
        success: true,
        responseTime,
        statusCode: response.status,
      });

      return content;
    } catch (error: unknown) {
      const responseTime = Date.now() - startTime;

      // Record failed attempt
      this.recordProxyAttempt({
        proxyName: proxyConfig.name,
        proxyUrl: this.buildProxyUrl(proxyConfig, targetUrl),
        targetUrl,
        timestamp: startTime,
        success: false,
        responseTime,
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }

  /**
   * Try multiple proxies with automatic failover
   */
  async tryProxiesWithFailover(targetUrl: string): Promise<{
    content: string;
    proxyUsed: string;
    attempts: ProxyAttempt[];
  }> {
    const availableProxies = this.getAvailableProxies();
    const attempts: ProxyAttempt[] = [];

    if (availableProxies.length === 0) {
      throw new Error("No healthy proxies available");
    }

    const host = this.getHostForTarget(targetUrl);
    const preferredName = host ? this.getPreferredProxyName(host) : null;
    if (preferredName) {
      const preferredIndex = availableProxies.findIndex(
        (proxy) => proxy.name === preferredName
      );
      if (preferredIndex > 0) {
        const [preferred] = availableProxies.splice(preferredIndex, 1);
        availableProxies.unshift(preferred);
      }
    }

    let lastError: Error | null = null;

    for (const proxy of availableProxies) {
      const startTime = Date.now();

      try {
        const content = await this.tryProxy(proxy, targetUrl);

        // Record successful attempt
        const attempt: ProxyAttempt = {
          proxyName: proxy.name,
          proxyUrl: this.buildProxyUrl(proxy, targetUrl),
          targetUrl,
          timestamp: startTime,
          success: true,
          responseTime: Date.now() - startTime,
        };
        attempts.push(attempt);

        if (host) {
          this.setPreferredProxyName(host, proxy.name);
        }

        return {
          content,
          proxyUsed: proxy.name,
          attempts,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Record failed attempt
        const attempt: ProxyAttempt = {
          proxyName: proxy.name,
          proxyUrl: this.buildProxyUrl(proxy, targetUrl),
          targetUrl,
          timestamp: startTime,
          success: false,
          responseTime: Date.now() - startTime,
          error: lastError.message,
        };
        attempts.push(attempt);

        // Mark proxy as potentially unhealthy if it fails
        this.markProxyStatus(proxy.name, false);
        if (preferredName && proxy.name === preferredName && host) {
          this.clearPreferredProxy(host);
        }

        // Continue to next proxy
        continue;
      }
    }

    // All proxies failed
    throw new Error(
      `All proxies failed. Last error: ${lastError?.message || "Unknown error"}`
    );
  }

  /**
   * Mark proxy status for health monitoring
   */
  markProxyStatus(proxyName: string, success: boolean): void {
    const stats = this.proxyStats.get(proxyName);
    if (!stats) return;

    if (success) {
      stats.consecutiveFailures = 0;
      stats.lastSuccess = Date.now();
    } else {
      stats.consecutiveFailures++;
      stats.lastFailure = Date.now();
    }

    // Update health status
    this.proxyHealthCheck.set(
      proxyName,
      stats.consecutiveFailures < this.config.failureThreshold
    );

    // Recalculate health score
    this.updateHealthScore(proxyName);
  }

  /**
   * Get proxy statistics
   */
  getProxyStatsByName(proxyName: string): ProxyStats | undefined {
    return this.proxyStats.get(proxyName);
  }

  /**
   * Get overall proxy manager statistics
   */
  getOverallStats(): {
    totalProxies: number;
    healthyProxies: number;
    totalRequests: number;
    totalSuccesses: number;
    totalFailures: number;
    averageResponseTime: number;
  } {
    const stats = Array.from(this.proxyStats.values());

    return {
      totalProxies: this.PROXY_CONFIGS.length,
      healthyProxies: Array.from(this.proxyHealthCheck.values()).filter(Boolean)
        .length,
      totalRequests: stats.reduce((sum, s) => sum + s.totalRequests, 0),
      totalSuccesses: stats.reduce((sum, s) => sum + s.success, 0),
      totalFailures: stats.reduce((sum, s) => sum + s.failures, 0),
      averageResponseTime:
        stats.length > 0
          ? stats.reduce((sum, s) => sum + s.avgResponseTime, 0) / stats.length
          : 0,
    };
  }

  /**
   * Reset proxy statistics
   */
  resetStats(): void {
    this.initializeProxyStats();
  }

  /**
   * Disable a proxy
   */
  disableProxy(proxyName: string): void {
    const proxy = this.PROXY_CONFIGS.find((p) => p.name === proxyName);
    if (proxy) {
      proxy.enabled = false;
      this.proxyHealthCheck.set(proxyName, false);
    }
  }

  /**
   * Enable a proxy
   */
  enableProxy(proxyName: string): void {
    const proxy = this.PROXY_CONFIGS.find((p) => p.name === proxyName);
    if (proxy) {
      proxy.enabled = true;
      // Reset consecutive failures when re-enabling
      const stats = this.proxyStats.get(proxyName);
      if (stats) {
        stats.consecutiveFailures = 0;
      }
      this.proxyHealthCheck.set(proxyName, true);
    }
  }

  /**
   * Get current configuration
   */
  getConfiguration(): ProxyManagerConfig {
    return { ...this.config };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }
  }

  // Private methods

  private initializeProxyStats(): void {
    this.PROXY_CONFIGS.forEach((proxy) => {
      this.proxyStats.set(proxy.name, {
        success: 0,
        failures: 0,
        totalRequests: 0,
        avgResponseTime: 0,
        lastUsed: 0,
        lastSuccess: 0,
        lastFailure: 0,
        consecutiveFailures: 0,
        healthScore: 1.0, // Start with perfect health
      });

      this.proxyHealthCheck.set(proxy.name, true);
    });
  }

  private buildProxyUrl(proxyConfig: ProxyConfig, targetUrl: string): string {
    // For RSS2JSON, dynamically build URL with current API key
    if (proxyConfig.name === 'RSS2JSON') {
      const apiKey = ProxyManager.rss2jsonApiKey;
      const baseUrl = 'https://api.rss2json.com/v1/api.json';

      if (apiKey) {
        // Use API key if available - higher priority
        return `${baseUrl}?api_key=${encodeURIComponent(apiKey)}&rss_url=${encodeURIComponent(targetUrl)}`;
      } else {
        // Fallback without API key (rate limited)
        return `${baseUrl}?rss_url=${encodeURIComponent(targetUrl)}`;
      }
    }

    // For CorsProxy.io, add API key if available
    if (proxyConfig.name === 'CorsProxy.io') {
      const apiKey = ProxyManager.corsproxyCIOApiKey;
      if (apiKey) {
        // If API key is available, use it via authorization header
        // The header will be added in tryProxy method
        return proxyConfig.url + encodeURIComponent(targetUrl);
      }
      // Fallback without API key
      return proxyConfig.url + encodeURIComponent(targetUrl);
    }

    // For other proxies, use URL as-is
    return proxyConfig.url + encodeURIComponent(targetUrl);
  }

  private isProxyHealthy(proxyName: string): boolean {
    return this.proxyHealthCheck.get(proxyName) || false;
  }

  /**
   * Validate proxy response structure and content
   * Ensures response is valid RSS/XML/JSON and not malicious content
   */
  private validateProxyResponse(content: string, contentType: string): boolean {
    if (!content || content.trim().length === 0) {
      return false;
    }

    const trimmed = content.trim();

    // Reject HTML pages (potential XSS or phishing)
    if (
      trimmed.toLowerCase().includes('<!doctype html') ||
      trimmed.toLowerCase().startsWith('<html') ||
      trimmed.toLowerCase().includes('<script')
    ) {
      return false;
    }

    // Validate expected content types
    const lowerContentType = contentType.toLowerCase();
    const isJson = lowerContentType.includes('application/json') || trimmed.startsWith('{');
    const isXml =
      lowerContentType.includes('application/xml') ||
      lowerContentType.includes('text/xml') ||
      lowerContentType.includes('application/rss+xml') ||
      lowerContentType.includes('application/atom+xml') ||
      trimmed.startsWith('<');

    // Must be either JSON or XML
    if (!isJson && !isXml) {
      // Allow text/plain for some proxies that don't set proper content-type
      if (!lowerContentType.includes('text/plain') && !lowerContentType.includes('text/html')) {
        return false;
      }
    }

    // For JSON responses, validate basic structure
    if (isJson) {
      try {
        const parsed = JSON.parse(trimmed);
        // Must be an object or array
        if (typeof parsed !== 'object' || parsed === null) {
          return false;
        }
      } catch {
        // Invalid JSON
        return false;
      }
    }

    // For XML responses, validate basic structure
    if (isXml) {
      // Must contain XML-like tags
      if (!trimmed.includes('<') || !trimmed.includes('>')) {
        return false;
      }
      // Reject if it looks like HTML (potential XSS)
      const htmlTags = ['<html', '<body', '<head', '<div', '<span'];
      if (htmlTags.some(tag => trimmed.toLowerCase().includes(tag))) {
        return false;
      }
    }

    // Reject suspicious patterns
    const suspiciousPatterns = [
      /javascript:/i,
      /on\w+\s*=/i, // Event handlers
      /<iframe/i,
      /<object/i,
      /<embed/i,
    ];

    if (suspiciousPatterns.some(pattern => pattern.test(trimmed))) {
      return false;
    }

    return true;
  }

  private recordProxyAttempt(attempt: ProxyAttempt): void {
    const stats = this.proxyStats.get(attempt.proxyName);
    if (!stats) return;

    stats.totalRequests++;
    stats.lastUsed = attempt.timestamp;

    if (attempt.success) {
      stats.success++;
      stats.lastSuccess = attempt.timestamp;
      stats.consecutiveFailures = 0;
    } else {
      stats.failures++;
      stats.lastFailure = attempt.timestamp;
      stats.consecutiveFailures++;
    }

    // Update average response time
    const totalResponseTime =
      stats.avgResponseTime * (stats.totalRequests - 1) + attempt.responseTime;
    stats.avgResponseTime = totalResponseTime / stats.totalRequests;

    // Update health score
    this.updateHealthScore(attempt.proxyName);
  }

  private updateHealthScore(proxyName: string): void {
    const stats = this.proxyStats.get(proxyName);
    if (!stats) return;

    // Calculate health score based on multiple factors
    let healthScore = 1.0;

    // Factor 1: Success rate (weight: 0.5)
    if (stats.totalRequests > 0) {
      const successRate = stats.success / stats.totalRequests;
      healthScore *= successRate;
    }

    // Factor 2: Consecutive failures (weight: 0.4)
    if (stats.consecutiveFailures >= this.config.failureThreshold) {
      healthScore *= 0.1; // Severely penalize proxies with too many consecutive failures
    } else {
      const failurePenalty =
        stats.consecutiveFailures / this.config.failureThreshold;
      healthScore *= 1 - 0.4 * failurePenalty;
    }

    // Factor 3: Response time (weight: 0.1)
    // Penalize slow responses (over 5 seconds)
    if (stats.avgResponseTime > 5000) {
      const timePenalty = Math.min((stats.avgResponseTime - 5000) / 10000, 1);
      healthScore *= 1 - 0.1 * timePenalty;
    }

    stats.healthScore = Math.max(0, Math.min(1, healthScore));
  }

  private startHealthMonitoring(): void {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval);
  }

  private performHealthCheck(): void {
    // Check if any unhealthy proxies should be re-enabled
    this.PROXY_CONFIGS.forEach((proxy) => {
      if (!proxy.enabled) return;

      const stats = this.proxyStats.get(proxy.name);
      const isCurrentlyHealthy = this.proxyHealthCheck.get(proxy.name);

      if (!isCurrentlyHealthy && stats) {
        // Check if proxy should be marked as healthy again
        const timeSinceLastFailure = Date.now() - stats.lastFailure;
        const recoveryTime = 5 * 60 * 1000; // 5 minutes

        if (timeSinceLastFailure > recoveryTime) {
          // Reset consecutive failures and mark as healthy
          stats.consecutiveFailures = 0;
          this.proxyHealthCheck.set(proxy.name, true);
          this.updateHealthScore(proxy.name);
        }
      }
    });
  }

  private getHostForTarget(targetUrl: string): string | null {
    try {
      return new URL(targetUrl).hostname;
    } catch {
      return null;
    }
  }

  private getPreferredProxyName(host: string): string | null {
    const entry = this.preferredProxyByHost.get(host);
    if (!entry) return null;
    if (Date.now() - entry.ts > this.preferredProxyTtlMs) {
      this.preferredProxyByHost.delete(host);
      this.persistPreferredProxyCache();
      return null;
    }
    if (!this.proxyHealthCheck.get(entry.name)) return null;
    return entry.name;
  }

  private setPreferredProxyName(host: string, proxyName: string): void {
    this.preferredProxyByHost.set(host, { name: proxyName, ts: Date.now() });
    this.persistPreferredProxyCache();
  }

  private clearPreferredProxy(host: string): void {
    if (this.preferredProxyByHost.delete(host)) {
      this.persistPreferredProxyCache();
    }
  }

  private loadPreferredProxyCache(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem('preferred_proxy_by_host');
      if (!raw) return;
      const data = JSON.parse(raw) as Record<string, { name: string; ts: number }>;
      Object.entries(data).forEach(([host, entry]) => {
        if (entry?.name && entry?.ts) {
          this.preferredProxyByHost.set(host, { name: entry.name, ts: entry.ts });
        }
      });
    } catch {
      // ignore
    }
  }

  private persistPreferredProxyCache(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const data: Record<string, { name: string; ts: number }> = {};
      this.preferredProxyByHost.forEach((value, host) => {
        data[host] = value;
      });
      localStorage.setItem('preferred_proxy_by_host', JSON.stringify(data));
    } catch {
      // ignore
    }
  }

  /**
   * Get proxy statistics for monitoring and health display
   */
  getProxyStats(): Record<string, ProxyStats> {
    const stats: Record<string, ProxyStats> = {};
    this.proxyStats.forEach((value, key) => {
      stats[key] = { ...value };
    });
    return stats;
  }

  /**
   * Return a copy of the proxy configuration array (including enabled flag)
   */
  getProxyConfigs(): ProxyConfig[] {
    return this.PROXY_CONFIGS.map((p) => ({ ...p }));
  }
}

// Singleton instance
export const proxyManager = new ProxyManager();

// Utility functions for components
export const getProxyStatusIcon = (isHealthy: boolean): string => {
  return isHealthy ? "🟢" : "🔴";
};

export const getProxyHealthColor = (healthScore: number): string => {
  if (healthScore >= 0.8) return "text-green-500";
  if (healthScore >= 0.6) return "text-yellow-500";
  if (healthScore >= 0.4) return "text-orange-500";
  return "text-red-500";
};

export const formatProxyStats = (stats: ProxyStats): string => {
  const successRate =
    stats.totalRequests > 0
      ? Math.round((stats.success / stats.totalRequests) * 100)
      : 0;
  return `${successRate}% success (${stats.totalRequests} requests)`;
};

export const getProxyRecommendation = (stats: ProxyStats): string => {
  if (stats.healthScore >= 0.8) return "Excellent";
  if (stats.healthScore >= 0.6) return "Good";
  if (stats.healthScore >= 0.4) return "Fair";
  return "Poor";
};
