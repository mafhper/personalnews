import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProxyManager, proxyManager } from "../services/proxyManager";

const rssXml =
  "<rss><channel><title>Ok</title><item><title>Item</title></item></channel></rss>";

const stubFetchWithContent = (content: string, contentType: string) => {
  const fetchMock = vi.fn(async () => ({
    ok: true,
    status: 200,
    statusText: "OK",
    headers: {
      get: (name: string) =>
        name.toLowerCase() === "content-type" ? contentType : null,
    },
    text: async () => content,
  }));

  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

describe("ProxyManager API-key proxy URLs", () => {
  beforeEach(() => {
    localStorage.clear();
    ProxyManager.setRss2jsonApiKey("");
    ProxyManager.setCorsproxyCIOApiKey("");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends CorsProxy.io API keys using the documented key and url query params", async () => {
    const corsKey = ["cors", "proxy", "test"].join("-");
    const corsProxy = proxyManager
      .getProxyConfigs()
      .find((config) => config.name === "CorsProxy.io");
    const fetchMock = stubFetchWithContent(rssXml, "application/rss+xml");

    expect(corsProxy).toBeDefined();
    ProxyManager.setCorsproxyCIOApiKey(corsKey, "manual");

    await proxyManager.tryProxy(corsProxy!, "https://example.com/feed.xml");

    const requestedUrl = new URL(fetchMock.mock.calls[0][0] as string);
    expect(`${requestedUrl.origin}${requestedUrl.pathname}`).toBe(
      "https://corsproxy.io/",
    );
    expect(requestedUrl.searchParams.get("key")).toBe(corsKey);
    expect(requestedUrl.searchParams.get("url")).toBe(
      "https://example.com/feed.xml",
    );
  });

  it("uses the explicit url parameter for CorsProxy.io even without an API key", async () => {
    const corsProxy = proxyManager
      .getProxyConfigs()
      .find((config) => config.name === "CorsProxy.io");
    const fetchMock = stubFetchWithContent(rssXml, "application/rss+xml");

    expect(corsProxy).toBeDefined();

    await proxyManager.tryProxy(corsProxy!, "https://example.com/feed.xml");

    const requestedUrl = new URL(fetchMock.mock.calls[0][0] as string);
    expect(requestedUrl.searchParams.has("key")).toBe(false);
    expect(requestedUrl.searchParams.get("url")).toBe(
      "https://example.com/feed.xml",
    );
  });

  it("keeps RSS2JSON authenticated through api_key and above the old 5s timeout", async () => {
    const rssKey = ["rss", "test", "key", "12345"].join("_");
    const rss2json = proxyManager
      .getProxyConfigs()
      .find((config) => config.name === "RSS2JSON");
    const fetchMock = stubFetchWithContent(
      JSON.stringify({
        status: "ok",
        feed: { title: "Ok" },
        items: [],
      }),
      "application/json",
    );

    expect(rss2json).toBeDefined();
    ProxyManager.setRss2jsonApiKey(rssKey, "manual");

    await proxyManager.tryProxy(rss2json!, "https://example.com/feed.xml");

    const requestedUrl = new URL(fetchMock.mock.calls[0][0] as string);
    expect(requestedUrl.searchParams.get("api_key")).toBe(rssKey);
    expect(requestedUrl.searchParams.get("rss_url")).toBe(
      "https://example.com/feed.xml",
    );
    expect(rss2json!.timeout).toBeGreaterThan(5_000);
  });
});
