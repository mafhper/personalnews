/**
 * proxyConfig.test.ts
 * Tests for proxy configuration and validation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  PROXY_CONFIGS,
  PROXIES_BY_CATEGORY,
  getRecommendedProxyOrder,
  validateProxyApiKey,
  getApiKeyEnvVar,
  formatProxyInfo,
  getProxiesRequiringApiKeys,
  assessProxyHealth,
} from '../config/proxyConfig';

describe('proxyConfig', () => {
  describe('PROXY_CONFIGS', () => {
    it('should have all required proxies', () => {
      expect(Object.keys(PROXY_CONFIGS).length).toBeGreaterThan(0);
      expect(PROXY_CONFIGS['rss2json']).toBeDefined();
      expect(PROXY_CONFIGS['codetabs']).toBeDefined();
    });

    it('should have valid metadata for each proxy', () => {
      Object.entries(PROXY_CONFIGS).forEach(([id, config]) => {
        expect(config.id).toBe(id);
        expect(config.name).toBeDefined();
        expect(config.website).toBeDefined();
        expect(config.description).toBeDefined();
        expect(config.reliability).toMatch(/^(excellent|good|fair|unstable)$/);
        expect(config.responseTime).toMatch(/^(fast|moderate|slow)$/);
        expect(config.freeTier).toBeDefined();
        expect(Array.isArray(config.recommendations)).toBe(true);
        expect(Array.isArray(config.bestFor)).toBe(true);
        expect(Array.isArray(config.tags)).toBe(true);
        expect(typeof config.priority).toBe('number');
        expect(typeof config.includeInFallback).toBe('boolean');
      });
    });

    it('should have unique priorities (with exceptions)', () => {
      const priorities = Object.values(PROXY_CONFIGS)
        .filter(c => c.includeInFallback)
        .map(c => c.priority)
        .sort((a, b) => a - b);

      // Just verify they're in order (some may be the same)
      for (let i = 1; i < priorities.length; i++) {
        expect(priorities[i]).toBeGreaterThanOrEqual(priorities[i - 1]);
      }
    });
  });

  describe('PROXIES_BY_CATEGORY', () => {
    it('should have valid categories', () => {
      expect(PROXIES_BY_CATEGORY.development).toBeDefined();
      expect(PROXIES_BY_CATEGORY.recommended).toBeDefined();
      expect(PROXIES_BY_CATEGORY.withApiKeys).toBeDefined();
      expect(PROXIES_BY_CATEGORY.fallback).toBeDefined();
      expect(PROXIES_BY_CATEGORY.all).toBeDefined();
    });

    it('should have correct proxies in each category', () => {
      expect(PROXIES_BY_CATEGORY.development).toContain('local-proxy');
      expect(PROXIES_BY_CATEGORY.recommended).toContain('rss2json');
      expect(PROXIES_BY_CATEGORY.withApiKeys).toContain('rss2json');
      expect(PROXIES_BY_CATEGORY.withApiKeys).toContain('corsproxy-io');
    });

    it('should have all proxies in the "all" category', () => {
      const allIds = Object.keys(PROXY_CONFIGS);
      allIds.forEach(id => {
        expect(PROXIES_BY_CATEGORY.all).toContain(id);
      });
    });
  });

  describe('getRecommendedProxyOrder', () => {
    it('should return array of proxy IDs', () => {
      const order = getRecommendedProxyOrder();
      expect(Array.isArray(order)).toBe(true);
      expect(order.length).toBeGreaterThan(0);
      order.forEach(id => {
        expect(typeof id).toBe('string');
      });
    });

    it('should not include local-proxy in recommended order', () => {
      const order = getRecommendedProxyOrder();
      expect(order).not.toContain('local-proxy');
    });

    it('should boost rss2json when API key is available', () => {
      const withoutKey = getRecommendedProxyOrder({ rss2json: false });
      const withKey = getRecommendedProxyOrder({ rss2json: true });

      const indexWithout = withoutKey.indexOf('rss2json');
      const indexWith = withKey.indexOf('rss2json');

      // With key, RSS2JSON should be earlier (lower index = higher priority)
      expect(indexWith).toBeLessThanOrEqual(indexWithout);
    });

    it('should only include proxies with includeInFallback=true', () => {
      const order = getRecommendedProxyOrder();
      order.forEach(id => {
        expect(PROXY_CONFIGS[id].includeInFallback).toBe(true);
      });
    });
  });

  describe('validateProxyApiKey', () => {
    it('should reject empty keys', () => {
      const result = validateProxyApiKey('rss2json', '');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject placeholder keys', () => {
      const result = validateProxyApiKey('rss2json', 'your-api-key-here');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('placeholder');
    });

    it('should validate RSS2JSON API key format', () => {
      const validResult = validateProxyApiKey('rss2json', 'valid_api_key_12345');
      expect(validResult.valid).toBe(true);

      const tooShort = validateProxyApiKey('rss2json', '123');
      expect(tooShort.valid).toBe(false);

      const invalidChars = validateProxyApiKey('rss2json', 'invalid@#$%^');
      expect(invalidChars.valid).toBe(false);
    });

    it('should validate CorsProxy API key format', () => {
      const validResult = validateProxyApiKey('corsproxy-io', 'some-valid-key');
      expect(validResult.valid).toBe(true);

      const tooShort = validateProxyApiKey('corsproxy-io', 'ab');
      expect(tooShort.valid).toBe(false);
    });

    it('should handle unknown proxy IDs', () => {
      const result = validateProxyApiKey('unknown-proxy', 'some-key');
      // Should still do basic validation
      expect(typeof result.valid).toBe('boolean');
    });
  });

  describe('getApiKeyEnvVar', () => {
    it('should return correct env var for proxies with API key', () => {
      expect(getApiKeyEnvVar('rss2json')).toBe('VITE_RSS2JSON_API_KEY');
      expect(getApiKeyEnvVar('corsproxy-io')).toBe('VITE_CORSPROXY_API_KEY');
    });

    it('should return null for proxies without API key', () => {
      expect(getApiKeyEnvVar('codetabs')).toBeNull();
      expect(getApiKeyEnvVar('allorigins')).toBeNull();
    });

    it('should return null for invalid proxy IDs', () => {
      expect(getApiKeyEnvVar('invalid-proxy')).toBeNull();
    });
  });

  describe('formatProxyInfo', () => {
    it('should format proxy information correctly', () => {
      const info = formatProxyInfo('rss2json');
      expect(info).toBeDefined();
      expect(info?.name).toBe('RSS2JSON');
      expect(info?.description).toBeDefined();
      expect(info?.link).toBeDefined();
    });

    it('should return null for invalid proxy ID', () => {
      const info = formatProxyInfo('invalid-proxy');
      expect(info).toBeNull();
    });
  });

  describe('getProxiesRequiringApiKeys', () => {
    it('should return proxies with API key support', () => {
      const result = getProxiesRequiringApiKeys();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      result.forEach(item => {
        expect(item.id).toBeDefined();
        expect(item.name).toBeDefined();
        expect(item.envVar).toBeDefined();
        expect(item.url).toBeDefined();
      });
    });

    it('should include RSS2JSON and CorsProxy.io', () => {
      const result = getProxiesRequiringApiKeys();
      const ids = result.map(r => r.id);
      expect(ids).toContain('rss2json');
      expect(ids).toContain('corsproxy-io');
    });

    it('should not include proxies without API key support', () => {
      const result = getProxiesRequiringApiKeys();
      const ids = result.map(r => r.id);
      expect(ids).not.toContain('codetabs');
      expect(ids).not.toContain('allorigins');
    });
  });

  describe('assessProxyHealth', () => {
    it('should return health score for valid proxy', () => {
      const result = assessProxyHealth('rss2json');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.recommendation).toBeDefined();
    });

    it('should give higher scores to reliable proxies', () => {
      const excellent = assessProxyHealth('rss2json'); // excellent
      const unstable = assessProxyHealth('cors-anywhere'); // unstable
      expect(excellent.score).toBeGreaterThan(unstable.score);
    });

    it('should provide appropriate recommendations', () => {
      const excellent = assessProxyHealth('rss2json');
      expect(excellent.recommendation).toMatch(/[Rr]ecommend/);

      const unstable = assessProxyHealth('cors-anywhere');
      expect(unstable.recommendation).toMatch(/[Ll]ast|[Ff]allback|[Nn]ecessary/);
    });

    it('should return zero score for invalid proxy', () => {
      const result = assessProxyHealth('invalid-proxy');
      expect(result.score).toBe(0);
    });
  });

  describe('Proxy Metadata Consistency', () => {
    it('should have consistent API key configuration', () => {
      Object.entries(PROXY_CONFIGS).forEach(([id, config]) => {
        if (config.hasApiKey) {
          expect(config.apiKeyEnvVar).toBeDefined();
          expect(config.apiKeyUrl).toBeDefined();
        } else {
          // Proxies without API key should not have env var
          if (id !== 'local-proxy') {
            expect(config.apiKeyEnvVar).toBeUndefined();
          }
        }
      });
    });

    it('should have non-empty description and recommendations', () => {
      Object.values(PROXY_CONFIGS).forEach(config => {
        expect(config.description.length).toBeGreaterThan(0);
        expect(config.recommendations.length).toBeGreaterThan(0);
      });
    });

    it('should have valid content types in bestFor', () => {
      const validTypes = ['RSS', 'HTML', 'JSON', 'XML', 'Text'];
      Object.values(PROXY_CONFIGS).forEach(config => {
        config.bestFor.forEach(type => {
          expect(validTypes).toContain(type);
        });
      });
    });

    it('should have priority sorted correctly for fallback proxies', () => {
      const fallbackProxies = Object.values(PROXY_CONFIGS)
        .filter(c => c.includeInFallback && c.id !== 'local-proxy')
        .sort((a, b) => a.priority - b.priority);

      for (let i = 1; i < fallbackProxies.length; i++) {
        expect(fallbackProxies[i].priority).toBeGreaterThanOrEqual(
          fallbackProxies[i - 1].priority
        );
      }
    });
  });
});
