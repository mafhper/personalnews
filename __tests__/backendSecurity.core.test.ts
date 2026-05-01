import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchAndParseFeed } from "../apps/backend/src/feedParser";
import {
  buildJsonHeaders,
  preflightResponse,
  validateBackendRequest,
} from "../apps/backend/src/httpSecurity";
import { SecurityValidationError } from "../apps/backend/src/security";
import { BACKEND_AUTH_TOKEN_HEADER } from "../shared/contracts/backend";

describe("backend security controls", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("sanitizes backend feed HTML before returning article content", async () => {
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

  it("rejects untrusted browser origins and reflects only trusted CORS origins", () => {
    const allowedRequest = new Request("http://127.0.0.1:3001/api/v1/settings", {
      method: "OPTIONS",
      headers: { origin: "http://localhost:5173" },
    });
    const blockedRequest = new Request("http://127.0.0.1:3001/api/v1/settings", {
      method: "OPTIONS",
      headers: { origin: "https://attacker.example" },
    });

    expect(preflightResponse(allowedRequest).status).toBe(204);
    expect(buildJsonHeaders(allowedRequest)).toMatchObject({
      "access-control-allow-origin": "http://localhost:5173",
    });
    expect(preflightResponse(blockedRequest).status).toBe(403);
    expect(validateBackendRequest(blockedRequest)?.status).toBe(403);
  });

  it("requires the backend token when BACKEND_AUTH_TOKEN is configured", () => {
    vi.stubEnv("BACKEND_AUTH_TOKEN", "1234567890abcdef1234567890abcdef");
    const protectedRequest = new Request("http://127.0.0.1:3001/api/v1/settings", {
      headers: { origin: "http://localhost:5173" },
    });
    const authorizedRequest = new Request("http://127.0.0.1:3001/api/v1/settings", {
      headers: {
        origin: "http://localhost:5173",
        [BACKEND_AUTH_TOKEN_HEADER]: "1234567890abcdef1234567890abcdef",
      },
    });

    expect(validateBackendRequest(protectedRequest)?.status).toBe(401);
    expect(validateBackendRequest(authorizedRequest)).toBeNull();
  });
});
