/** @vitest-environment jsdom */
/**
 * [CORE][DEGRADATION] Graceful Degradation Suite
 * 
 * Purpose:
 * - Ensure system remains functional when partial services fail.
 * - Validate fallback mechanisms (Proxy -> Direct Fetch).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { feedDiscoveryService } from "../services/feedDiscoveryService";
import { proxyManager } from "../services/proxyManager";

vi.mock("../services/proxyManager", () => ({
  proxyManager: {
    tryProxiesWithFailover: vi.fn(),
  },
}));

vi.mock("../services/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debugTag: vi.fn(),
  },
  useLogger: () => ({
    debugTag: vi.fn(),
  })
}));

describe("[CORE][DEGRADATION] graceful degradation", () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return result even if proxy service fails (using direct fetch fallback)", async () => {
    const targetUrl = "https://example.com";
    const mockRssContent = `<?xml version="1.0"?><rss version="2.0"><channel><title>Fallback Feed</title><link>https://example.com</link></channel></rss>`;

    // 1. Simular que o fetch direto (primeira tentativa interna) funciona
    // O service tenta fetch direto, se falhar tenta proxy.
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockRssContent),
      headers: { get: (n: string) => n === 'content-type' ? 'application/rss+xml' : null }
    } as any);

    // Proxy nem precisaria ser chamado se o primeiro fetch funcionar, 
    // mas vamos garantir que se ele for chamado e falhar, o sistema lida.
    vi.mocked(proxyManager.tryProxiesWithFailover).mockRejectedValue(new Error("Proxy Down"));

    // Act
    const result = await feedDiscoveryService.discoverFromWebsite(targetUrl);

    // Assert
    expect(result.discoveredFeeds.length).toBeGreaterThan(0);
    expect(result.discoveredFeeds[0].title).toBe("Fallback Feed");
  });

  it("should return result with suggestions (not crash) when all fetches fail", async () => {
    // 1. Todos os fetches falham
    vi.mocked(global.fetch).mockRejectedValue(new Error("Network Down"));
    vi.mocked(proxyManager.tryProxiesWithFailover).mockRejectedValue(new Error("Proxy Down"));

    // Act
    const result = await feedDiscoveryService.discoverFromWebsite("https://broken.com");

    // Assert
    expect(result.discoveredFeeds).toHaveLength(0);
    // O service adiciona mensagens de erro em suggestions
    expect(result.suggestions.length).toBeGreaterThan(0);
  });
});
