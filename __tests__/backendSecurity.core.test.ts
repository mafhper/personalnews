import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchAndParseFeed } from "../apps/backend/src/feedParser";
import {
  buildJsonHeaders,
  preflightResponse,
  validateBackendRequest,
} from "../apps/backend/src/httpSecurity";
import {
  SecurityValidationError,
  validateTargetFeedUrl,
} from "../apps/backend/src/security";
import { BACKEND_AUTH_TOKEN_HEADER } from "../shared/contracts/backend";
import { DEV_PORT, PREVIEW_PORT } from "../ports.mjs";
import { allowConsoleWarn } from "../src/test-console";

describe("backend security controls", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("sanitizes backend feed HTML before returning article content", async () => {
    allowConsoleWarn(/Unexpected feed Content-Type/, 1);
    const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>PoC</title>
    <item>
      <title>Item</title>
      <link>https://example.com/article</link>
      <description><![CDATA[
        <script>alert("xss")</script>
        <p onclick="alert('xss')">hello <a href="javascript:alert(1)">bad</a></p>
        <img src="x" onerror="window.__PN_XSS=1">
      ]]></description>
      <pubDate>Fri, 01 May 2026 00:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(feed, { status: 200 })),
    );

    const result = await fetchAndParseFeed("https://feeds.example/rss.xml", {
      validateUrl: async () => undefined,
    });

    const content = result.articles[0].content || "";
    expect(content).toContain("<p>hello <a>bad</a></p>");
    expect(content).toContain('<img src="https://example.com/x">');
    expect(content).not.toContain("<script");
    expect(content).not.toContain("onclick");
    expect(content).not.toContain("onerror");
    expect(content).not.toContain("javascript:");
  });

  it("blocks private redirect targets before a follow-up fetch happens", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(null, {
        status: 302,
        headers: { location: "http://127.0.0.1/private.xml" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      fetchAndParseFeed("https://feeds.example/redirect.xml", {
        validateUrl: async (targetUrl) => {
          if (targetUrl.includes("127.0.0.1")) {
            throw new SecurityValidationError("private redirect blocked", 403);
          }
        },
      }),
    ).rejects.toThrow("private redirect blocked");

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("blocks direct localhost and metadata feed targets", async () => {
    await expect(validateTargetFeedUrl("http://127.0.0.1:8080/rss.xml")).rejects.toThrow(
      "Local/private hosts are blocked",
    );
    await expect(validateTargetFeedUrl("http://169.254.169.254/latest/meta-data")).rejects.toThrow(
      "Private IPv4 ranges are blocked",
    );
    await expect(validateTargetFeedUrl("file:///tmp/feed.xml")).rejects.toThrow(
      "Only http/https URLs are allowed",
    );
  });

  it("does not warn when an XML feed is served with a misleading content type", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>PoC</title>
    <item>
      <title>Item</title>
      <link>https://example.com/article</link>
      <description>hello</description>
    </item>
  </channel>
</rss>`;

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(feed, {
          status: 200,
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
      ),
    );

    const result = await fetchAndParseFeed("https://feeds.example/rss.xml", {
      validateUrl: async () => undefined,
    });

    expect(result.articles).toHaveLength(1);
    expect(warnSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("Unexpected feed Content-Type"),
    );
  });

  it("rejects untrusted browser origins and reflects only trusted CORS origins", () => {
    // A origem confiavel vem de `ports.mjs`, nao escrita a mao: a porta mudou
    // de 5173 para 5290 e um literal aqui teria continued testando a porta
    // antiga (que o allowlist recusa — e o teste falharia, por enquanto).
    const trusted = `http://localhost:${DEV_PORT}`;
    const allowedRequest = new Request("http://127.0.0.1:3001/api/v1/settings", {
      method: "OPTIONS",
      headers: { origin: trusted },
    });
    const blockedRequest = new Request("http://127.0.0.1:3001/api/v1/settings", {
      method: "OPTIONS",
      headers: { origin: "https://attacker.example" },
    });

    expect(preflightResponse(allowedRequest).status).toBe(204);
    expect(buildJsonHeaders(allowedRequest)).toMatchObject({
      "access-control-allow-origin": trusted,
    });
    expect(preflightResponse(blockedRequest).status).toBe(403);
    expect(validateBackendRequest(blockedRequest)?.status).toBe(403);
  });

  it("allows loopback dev origins on fallback local stack ports", () => {
    // `run-local-stack.mjs` sobe a porta quando a preferida esta ocupada; o
    // backend tem de aceitar o vizinho imediato (5290 → 5291). Fora dessa
    // janela curta, recusa.
    const devFallbackRequest = new Request("http://127.0.0.1:3001/health", {
      headers: { origin: `http://localhost:${DEV_PORT + 1}` },
    });
    const previewFallbackRequest = new Request("http://127.0.0.1:3001/health", {
      headers: { origin: `http://127.0.0.1:${PREVIEW_PORT + 1}` },
    });
    const outOfRangeRequest = new Request("http://127.0.0.1:3001/health", {
      headers: { origin: "http://127.0.0.1:5350" },
    });

    expect(buildJsonHeaders(devFallbackRequest)).toMatchObject({
      "access-control-allow-origin": `http://localhost:${DEV_PORT + 1}`,
    });
    expect(buildJsonHeaders(previewFallbackRequest)).toMatchObject({
      "access-control-allow-origin": `http://127.0.0.1:${PREVIEW_PORT + 1}`,
    });
    expect(validateBackendRequest(outOfRangeRequest)?.status).toBe(403);
  });

  it("requires the backend token when BACKEND_AUTH_TOKEN is configured", () => {
    vi.stubEnv("BACKEND_AUTH_TOKEN", "1234567890abcdef1234567890abcdef");
    const trusted = `http://localhost:${DEV_PORT}`;
    const protectedRequest = new Request("http://127.0.0.1:3001/api/v1/settings", {
      headers: { origin: trusted },
    });
    const authorizedRequest = new Request("http://127.0.0.1:3001/api/v1/settings", {
      headers: {
        origin: trusted,
        [BACKEND_AUTH_TOKEN_HEADER]: "1234567890abcdef1234567890abcdef",
      },
    });

    expect(validateBackendRequest(protectedRequest)?.status).toBe(401);
    expect(validateBackendRequest(authorizedRequest)).toBeNull();
  });
});
