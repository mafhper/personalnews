import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProxyManager, proxyManager } from "../services/proxyManager";

const importMetaWithEnv = import.meta as ImportMeta & {
  env: Record<string, string | undefined>;
};
const ORIGINAL_IMPORT_META_ENV = { ...importMetaWithEnv.env };

const setImportMetaEnv = (patch: Record<string, string | undefined>) => {
  importMetaWithEnv.env = {
    ...ORIGINAL_IMPORT_META_ENV,
    ...patch,
  };
};

const resetRuntimeProxyStates = () => {
  [
    "LocalProxy",
    "AllOrigins",
    "CodeTabs",
    "WhateverOrigin",
    "TextProxy",
    "CorsProxy.io",
    "RSS2JSON",
    "CORS Anywhere",
  ].forEach((proxyName) => proxyManager.enableProxy(proxyName));
  proxyManager.resetStats();
};

describe("ProxyManager runtime health behavior", () => {
  beforeEach(() => {
    localStorage.clear();
    resetRuntimeProxyStates();
    delete (window as Window & { __TAURI__?: unknown }).__TAURI__;
    delete (window as Window & { __TAURI_INTERNALS__?: unknown })
      .__TAURI_INTERNALS__;
    setImportMetaEnv({
      VITE_BACKEND_ENABLED: undefined,
      VITE_BACKEND_DEFAULT_MODE: undefined,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    setImportMetaEnv({});
  });

  it("starts desktop first runs with remote proxies disabled", () => {
    Object.defineProperty(window, "__TAURI__", {
      value: {},
      configurable: true,
    });

    ProxyManager.loadPreferences();

    const remoteConfigs = proxyManager
      .getProxyConfigs()
      .filter((config) => config.name !== "LocalProxy");

    expect(remoteConfigs.length).toBeGreaterThan(0);
    expect(remoteConfigs.every((config) => !config.enabled)).toBe(true);
    expect(localStorage.getItem("desktop_proxy_defaults_applied_v1")).toBe(
      "true",
    );
  });

  it("auto-disables only remote proxies after sustained critical health", async () => {
    Object.defineProperty(window, "__TAURI__", {
      value: {},
      configurable: true,
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("proxy unavailable");
      }),
    );

    const codeTabs = proxyManager
      .getProxyConfigs()
      .find((config) => config.name === "CodeTabs");

    expect(codeTabs).toBeDefined();

    for (let index = 0; index < 6; index += 1) {
      await expect(
        proxyManager.tryProxy(codeTabs!, "https://example.com/feed.xml"),
      ).rejects.toThrow("proxy unavailable");
    }

    expect(
      proxyManager.getProxyConfigs().find((config) => config.name === "CodeTabs")
        ?.enabled,
    ).toBe(false);

    for (let index = 0; index < 6; index += 1) {
      proxyManager.markProxyStatus("LocalProxy", false);
    }

    expect(
      proxyManager
        .getProxyConfigs()
        .find((config) => config.name === "LocalProxy")?.enabled,
    ).toBe(true);
  });

  it("keeps remote proxies enabled in web client mode even after sustained failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("proxy unavailable");
      }),
    );

    const codeTabs = proxyManager
      .getProxyConfigs()
      .find((config) => config.name === "CodeTabs");

    expect(codeTabs).toBeDefined();

    for (let index = 0; index < 6; index += 1) {
      await expect(
        proxyManager.tryProxy(codeTabs!, "https://example.com/feed.xml"),
      ).rejects.toThrow("proxy unavailable");
    }

    expect(
      proxyManager.getProxyConfigs().find((config) => config.name === "CodeTabs")
        ?.enabled,
    ).toBe(true);
  });

  it("keeps unhealthy remote proxies available in web client mode", () => {
    for (let index = 0; index < 6; index += 1) {
      proxyManager.markProxyStatus("CodeTabs", false);
    }

    const availableProxyNames = proxyManager
      .getAvailableProxies()
      .map((config) => config.name);

    expect(availableProxyNames).toContain("CodeTabs");
  });

  it("prioritizes browser-compatible cloud proxies before slow legacy fallbacks", () => {
    const availableProxyNames = proxyManager
      .getAvailableProxies()
      .map((config) => config.name);

    expect(availableProxyNames.indexOf("CorsProxy.io")).toBeLessThan(
      availableProxyNames.indexOf("AllOrigins"),
    );
    expect(availableProxyNames.indexOf("RSS2JSON")).toBeLessThan(
      availableProxyNames.indexOf("AllOrigins"),
    );
    expect(availableProxyNames).toContain("CodeTabs");
    expect(availableProxyNames).not.toContain("WhateverOrigin");
    expect(availableProxyNames).not.toContain("TextProxy");
    expect(availableProxyNames).not.toContain("CORS Anywhere");
  });

  it("ignores stale disabled remote proxies when loading web client preferences", () => {
    localStorage.setItem(
      "disabled_proxies",
      JSON.stringify(["RSS2JSON", "CodeTabs", "CorsProxy.io"]),
    );

    ProxyManager.loadPreferences();

    const remoteConfigs = proxyManager
      .getProxyConfigs()
      .filter((config) => config.name !== "LocalProxy");
    const persistedDisabled = localStorage.getItem("disabled_proxies") || "";

    expect(remoteConfigs.every((config) => config.enabled)).toBe(true);
    expect(persistedDisabled).not.toContain("RSS2JSON");
    expect(persistedDisabled).not.toContain("CodeTabs");
    expect(persistedDisabled).not.toContain("CorsProxy.io");
  });

  it("accepts transformed RSS that contains embedded item markup", async () => {
    const allOrigins = proxyManager
      .getProxyConfigs()
      .find((config) => config.name === "AllOrigins");
    const rssWithEmbeddedMarkup =
      '<rss><channel><title>Ok</title><item><title>Video</title><description><![CDATA[<iframe src="https://example.com/embed"></iframe>]]></description></item></channel></rss>';

    expect(allOrigins).toBeDefined();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        statusText: "OK",
        headers: {
          get: (name: string) =>
            name.toLowerCase() === "content-type" ? "application/json" : null,
        },
        text: async () => JSON.stringify({ contents: rssWithEmbeddedMarkup }),
      })),
    );

    await expect(
      proxyManager.tryProxy(allOrigins!, "https://example.com/feed.xml"),
    ).resolves.toBe(rssWithEmbeddedMarkup);
  });
});
