/**
 * proxyConfig.ts
 *
 * Comprehensive proxy configuration with metadata, API key support, validation,
 * and detailed information about each CORS proxy service used in the application
 *
 */

export interface ProxyMetadata {
  /** Proxy service identifier */
  id: string;
  /** Display name */
  name: string;
  /** Official service website */
  website: string;
  /** Service description */
  description: string;
  /** Whether this proxy has an API key configuration */
  hasApiKey: boolean;
  /** Environment variable name for API key (if applicable) */
  apiKeyEnvVar?: string;
  /** URL to get a free API key */
  apiKeyUrl?: string;
  /** Rate limits information */
  rateLimits: {
    /** Requests per minute (without API key) */
    freeRpm?: number;
    /** Requests per minute (with API key) */
    paidRpm?: number;
    /** Requests per day (if applicable) */
    rpd?: number;
    /** Notes about rate limiting */
    notes?: string;
  };
  /** Reliability assessment */
  reliability: "excellent" | "good" | "fair" | "unstable";
  /** Response time assessment */
  responseTime: "fast" | "moderate" | "slow";
  /** Free tier information */
  freeTier: {
    available: boolean;
    limitations?: string[];
    notes?: string;
  };
  /** Recommendations for use */
  recommendations: string[];
  /** Categories this proxy handles well */
  bestFor: ("RSS" | "HTML" | "JSON" | "XML" | "Text")[];
  /** Tags for filtering */
  tags: string[];
  /** Priority in fallback order (lower = higher priority) */
  priority: number;
  /** Whether to include in default fallback chain */
  includeInFallback: boolean;
}

/**
 * Complete proxy configuration database
 * Ordered by recommended priority for the proxy pool
 */
export const PROXY_CONFIGS: Record<string, ProxyMetadata> = {
  "local-proxy": {
    id: "local-proxy",
    name: "LocalProxy",
    website: "http://localhost:3000/local-proxy/",
    description:
      "Local development proxy - runs on your own server, no external dependencies",
    hasApiKey: false,
    rateLimits: {
      notes: "Unlimited - depends on your local setup",
    },
    reliability: "excellent",
    responseTime: "fast",
    freeTier: {
      available: true,
      notes: "Only available during development with local proxy running",
    },
    recommendations: [
      "Use as primary proxy in development",
      "Provides zero latency and full control",
      "Requires running local proxy server",
    ],
    bestFor: ["RSS", "HTML", "XML", "JSON"],
    tags: ["local", "development", "no-external-dependency"],
    priority: -2,
    includeInFallback: false, // Only for development
  },

  rss2json: {
    id: "rss2json",
    name: "RSS2JSON",
    website: "https://rss2json.com",
    description:
      "Converts RSS feeds to JSON format with API key support for higher limits",
    hasApiKey: true,
    apiKeyEnvVar: "VITE_RSS2JSON_API_KEY",
    apiKeyUrl: "https://rss2json.com",
    rateLimits: {
      freeRpm: 30,
      paidRpm: 1000,
      notes: "Free tier: 30 requests/day, Pro: 1000 requests/day",
    },
    reliability: "good",
    responseTime: "moderate",
    freeTier: {
      available: true,
      limitations: [
        "Very slow feed updates (~6-12 hours)",
        "Limited concurrent requests",
      ],
      notes: "API key drastically improves performance and reliability",
    },
    recommendations: [
      "Get a free API key from rss2json.com - highly recommended",
      "API key increases daily limit from 30 to 1000 requests",
      "Excellent for converting RSS to JSON format",
      "Good as primary proxy if API key is available",
    ],
    bestFor: ["RSS"],
    tags: ["api-key", "rss-to-json", "official-api", "recommended"],
    priority: -1, // High priority when API key is available
    includeInFallback: true,
  },

  codetabs: {
    id: "codetabs",
    name: "CodeTabs",
    website: "https://api.codetabs.com",
    description: "Simple CORS proxy with stable uptime - no API key required",
    hasApiKey: false,
    rateLimits: {
      notes:
        "Undocumented but stable - appears to have reasonable implicit limits",
    },
    reliability: "excellent",
    responseTime: "fast",
    freeTier: {
      available: true,
      notes: "Completely free, no authentication required, very reliable",
    },
    recommendations: [
      "Excellent choice as primary free proxy",
      "Consistently reliable with good uptime",
      "One of the best unmaintained free CORS proxies",
      "Use as primary in fallback chain when RSS2JSON API key unavailable",
    ],
    bestFor: ["RSS", "HTML", "JSON", "XML"],
    tags: ["free", "stable", "no-auth", "recommended"],
    priority: 0,
    includeInFallback: true,
  },

  allorigins: {
    id: "allorigins",
    name: "AllOrigins",
    website: "https://allorigins.win",
    description: "Simple and fast CORS proxy, good for basic use cases",
    hasApiKey: false,
    rateLimits: {
      notes: "Implicit limits - works well for small to medium volume",
    },
    reliability: "good",
    responseTime: "fast",
    freeTier: {
      available: true,
      limitations: ["No official rate limit documentation"],
      notes: "Works well for simple requests and popular feeds",
    },
    recommendations: [
      "Good secondary fallback option",
      "Reliable for RSS/XML feeds",
      "Works best with popular/cached feeds",
      "May have undocumented rate limits",
    ],
    bestFor: ["RSS", "XML", "HTML"],
    tags: ["free", "simple", "cache-friendly"],
    priority: 1,
    includeInFallback: true,
  },

  "corsproxy-io": {
    id: "corsproxy-io",
    name: "CorsProxy.io",
    website: "https://corsproxy.io",
    description:
      "Professional CORS proxy with dashboard and optional API key (self-hosted option available)",
    hasApiKey: true,
    apiKeyEnvVar: "VITE_CORSPROXY_API_KEY",
    apiKeyUrl: "https://corsproxy.io",
    rateLimits: {
      freeRpm: 50,
      paidRpm: 1000,
      notes:
        "Free tier has ~50 RPM limit, paid tiers available for higher throughput",
    },
    reliability: "good",
    responseTime: "moderate",
    freeTier: {
      available: true,
      limitations: [
        "Rate limited to ~50 requests per minute",
        "No dashboard access in free tier",
      ],
      notes: "Self-hosted option available if you deploy your own instance",
    },
    recommendations: [
      "Consider getting API key for better limits",
      "Good option if you want managed service with monitoring",
      "Self-hosting is possible if you need guaranteed uptime",
      "Useful as secondary/tertiary fallback",
    ],
    bestFor: ["RSS", "HTML", "XML", "JSON"],
    tags: ["api-key-optional", "managed-service", "self-hostable"],
    priority: 2,
    includeInFallback: true,
  },

  whateverorigin: {
    id: "whateverorigin",
    name: "WhateverOrigin",
    website: "https://whateverorigin.org",
    description: "Community-maintained CORS proxy with callback support",
    hasApiKey: false,
    rateLimits: {
      freeRpm: 20,
      notes: "~20 requests per minute per origin (implicit)",
    },
    reliability: "fair",
    responseTime: "moderate",
    freeTier: {
      available: true,
      limitations: [
        "Lower rate limit than alternatives (~20 RPM)",
        "Community maintained - less predictable",
      ],
      notes: "Works but not as reliable as CodeTabs or AllOrigins",
    },
    recommendations: [
      "Use as fallback option (not primary)",
      "Good for testing but may have occasional issues",
      "Better alternatives exist (CodeTabs, AllOrigins)",
    ],
    bestFor: ["RSS", "JSON"],
    tags: ["free", "community-maintained", "fallback"],
    priority: 6,
    includeInFallback: true,
  },

  "cors-anywhere": {
    id: "cors-anywhere",
    name: "CORS Anywhere",
    website: "https://github.com/Rob--W/cors-anywhere",
    description:
      "Popular CORS proxy - public instance has aggressive rate limiting and frequent downtime",
    hasApiKey: false,
    rateLimits: {
      notes: "Public instance: highly rate-limited and frequently overloaded",
    },
    reliability: "unstable",
    responseTime: "slow",
    freeTier: {
      available: true,
      limitations: [
        "Public instance is frequently rate-limited or blocked",
        "May be down without notice",
        "IP-based bans are common",
      ],
      notes: "Self-hosting is recommended if you use this",
    },
    recommendations: [
      "Use only as absolute last fallback",
      "Public instance is unreliable - not recommended",
      "Deploy your own instance if you need it",
      "Consider other proxies first",
    ],
    bestFor: ["RSS", "HTML", "XML"],
    tags: ["self-hostable", "fallback-only", "unreliable-public"],
    priority: 3,
    includeInFallback: true,
  },

  textproxy: {
    id: "textproxy",
    name: "TextProxy",
    website: "https://textproxy.io",
    description: "Text-focused proxy - less reliable, minimal maintenance",
    hasApiKey: false,
    rateLimits: {
      notes: "Undocumented - appears to have tight limits",
    },
    reliability: "fair",
    responseTime: "slow",
    freeTier: {
      available: true,
      limitations: [
        "Inconsistent response quality",
        "Limited maintenance - may be abandoned",
      ],
      notes: "Not recommended as primary choice",
    },
    recommendations: [
      "Use only as emergency fallback",
      "Better alternatives available",
      "Limited active maintenance",
    ],
    bestFor: ["Text", "HTML"],
    tags: ["fallback", "text-focus", "unmaintained"],
    priority: 5,
    includeInFallback: true,
  },

  "jina-reader": {
    id: "jina-reader",
    name: "Jina Reader (r.jina.ai)",
    website: "https://jina.ai/",
    description:
      "Removes CORS restrictions and provides cleaned content - excellent for normalization",
    hasApiKey: false,
    rateLimits: {
      notes: "Very generous implicit limits - good for volume",
    },
    reliability: "excellent",
    responseTime: "fast",
    freeTier: {
      available: true,
      notes: "Completely free with good reliability and caching",
    },
    recommendations: [
      "Excellent for content normalization and cleaning",
      "Very stable service with good uptime",
      "Good as alternative primary or secondary proxy",
      "Use as fallback for HTML content",
    ],
    bestFor: ["HTML", "Text", "RSS"],
    tags: ["free", "excellent-uptime", "content-cleaning", "recommended"],
    priority: 4,
    includeInFallback: true,
  },
};

/**
 * Proxy configuration by category
 */
export const PROXIES_BY_CATEGORY = {
  development: ["local-proxy"],
  recommended: ["rss2json", "codetabs", "jina-reader"],
  withApiKeys: ["rss2json", "corsproxy-io"],
  fallback: ["allorigins", "whateverorigin", "cors-anywhere", "textproxy"],
  all: Object.keys(PROXY_CONFIGS),
};

/**
 * Get recommended proxy order for fallback chain
 * Prioritizes proxies based on reliability, response time, and API key availability
 */
export function getRecommendedProxyOrder(
  hasApiKeys: {
    rss2json?: boolean;
    corsproxy?: boolean;
  } = {},
): string[] {
  const orderByPriority: string[] = [];

  // Sort by priority
  const sorted = Object.entries(PROXY_CONFIGS)
    .filter(([_, config]) => config.includeInFallback)
    .sort((a, b) => a[1].priority - b[1].priority)
    .map(([id]) => id);

  for (const id of sorted) {
    const config = PROXY_CONFIGS[id];

    // Skip local-proxy in production
    if (id === "local-proxy") continue;

    // Boost priority if API key is available
    if (config.hasApiKey) {
      if (id === "rss2json" && hasApiKeys.rss2json) {
        orderByPriority.unshift(id); // Add to front
        continue;
      }
      if (id === "corsproxy-io" && hasApiKeys.corsproxy) {
        orderByPriority.unshift(id); // Add to front
        continue;
      }
    }

    orderByPriority.push(id);
  }

  return orderByPriority;
}

/**
 * Validate an API key format for a specific proxy
 */
export function validateProxyApiKey(
  proxyId: string,
  apiKey: string,
): {
  valid: boolean;
  error?: string;
} {
  if (!apiKey || apiKey.trim() === "") {
    return { valid: false, error: "API key cannot be empty" };
  }

  if (apiKey === "your-api-key-here") {
    return {
      valid: false,
      error: "Please replace placeholder with actual API key",
    };
  }

  // Proxy-specific validation
  switch (proxyId) {
    case "rss2json":
      // RSS2JSON API keys are typically alphanumeric, 20-40 characters
      if (apiKey.length < 10) {
        return { valid: false, error: "RSS2JSON API key seems too short" };
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(apiKey)) {
        return { valid: false, error: "API key contains invalid characters" };
      }
      break;

    case "corsproxy-io":
      // CorsProxy API keys may vary in format
      if (apiKey.length < 5) {
        return { valid: false, error: "API key seems too short" };
      }
      break;

    default:
      // Generic validation
      if (apiKey.length < 3) {
        return { valid: false, error: "API key is too short" };
      }
  }

  return { valid: true };
}

/**
 * Get environment variable name for a proxy's API key
 */
export function getApiKeyEnvVar(proxyId: string): string | null {
  const config = PROXY_CONFIGS[proxyId];
  return config?.apiKeyEnvVar || null;
}

/**
 * Format proxy configuration for display
 */
export function formatProxyInfo(proxyId: string): {
  name: string;
  description: string;
  link?: string;
} | null {
  const config = PROXY_CONFIGS[proxyId];
  if (!config) return null;

  return {
    name: config.name,
    description: config.description,
    link: config.website,
  };
}

/**
 * Get all proxies that require API keys
 */
export function getProxiesRequiringApiKeys(): Array<{
  id: string;
  name: string;
  envVar: string;
  url: string;
}> {
  return Object.entries(PROXY_CONFIGS)
    .filter(([_, config]) => config.hasApiKey && config.apiKeyEnvVar)
    .map(([id, config]) => ({
      id,
      name: config.name,
      envVar: config.apiKeyEnvVar!,
      url: config.apiKeyUrl || config.website,
    }));
}

/**
 * Health assessment based on configuration metadata
 */
export function assessProxyHealth(proxyId: string): {
  score: number;
  recommendation: string;
} {
  const config = PROXY_CONFIGS[proxyId];
  if (!config) {
    return { score: 0, recommendation: "Unknown proxy" };
  }

  let score = 100;

  // Reliability score
  switch (config.reliability) {
    case "excellent":
      break;
    case "good":
      score -= 10;
      break;
    case "fair":
      score -= 20;
      break;
    case "unstable":
      score -= 40;
      break;
  }

  // Response time score
  switch (config.responseTime) {
    case "fast":
      break;
    case "moderate":
      score -= 5;
      break;
    case "slow":
      score -= 15;
      break;
  }

  let recommendation = "Good choice";
  if (score >= 80) {
    recommendation = "Highly recommended";
  } else if (score >= 70) {
    recommendation = "Recommended";
  } else if (score >= 50) {
    recommendation = "Use as fallback";
  } else {
    recommendation = "Use only if necessary";
  }

  return { score, recommendation };
}
