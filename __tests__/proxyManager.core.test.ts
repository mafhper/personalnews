import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProxyManager } from "../services/proxyManager";

describe("ProxyManager preference loading", () => {
  beforeEach(() => {
    localStorage.clear();
    ProxyManager.setRss2jsonApiKey("");
    ProxyManager.setCorsproxyCIOApiKey("");
    ProxyManager.setPreferLocalProxy(false);
    delete (window as Window & { __TAURI__?: unknown }).__TAURI__;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("migrates the legacy corsproxy_api_key into corsproxy_cio_api_key", () => {
    localStorage.setItem("corsproxy_api_key", "legacy-cors-key");

    ProxyManager.loadPreferences();

    expect(ProxyManager.getCorsproxyCIOApiKey()).toBe("legacy-cors-key");
    expect(localStorage.getItem("corsproxy_api_key")).toBeNull();
    expect(localStorage.getItem("corsproxy_cio_api_key")).toBe(
      "legacy-cors-key",
    );
    expect(ProxyManager.getCorsproxyCIOApiKeyOrigin()).toBe(
      "migrated-localStorage",
    );
  });

  it("defaults desktop runtimes to prefer the local route when no explicit preference exists", () => {
    Object.defineProperty(window, "__TAURI__", {
      value: {},
      configurable: true,
    });
    localStorage.removeItem("prefer_local_proxy");

    ProxyManager.loadPreferences();

    expect(ProxyManager.getPreferLocalProxy()).toBe(true);
  });

  it("defaults dev local runs to prefer the backend route when backend mode is on", () => {
    vi.stubEnv("VITE_BACKEND_ENABLED", "true");
    vi.stubEnv("VITE_BACKEND_DEFAULT_MODE", "on");
    localStorage.removeItem("prefer_local_proxy");

    ProxyManager.loadPreferences();

    expect(ProxyManager.getPreferLocalProxy()).toBe(true);
  });

  it("forces the local route on dev local even when a stale saved preference was false", () => {
    vi.stubEnv("VITE_BACKEND_ENABLED", "true");
    vi.stubEnv("VITE_BACKEND_DEFAULT_MODE", "on");
    localStorage.setItem("prefer_local_proxy", "false");

    ProxyManager.loadPreferences();

    expect(ProxyManager.getPreferLocalProxy()).toBe(true);
    expect(localStorage.getItem("prefer_local_proxy")).toBe("true");
  });

  it("respects explicit local preference and persists both API keys with the correct names", () => {
    ProxyManager.setRss2jsonApiKey("rss-key", "manual");
    ProxyManager.setCorsproxyCIOApiKey("cors-key", "manual");
    ProxyManager.setPreferLocalProxy(true);

    expect(localStorage.getItem("rss2json_api_key")).toBe("rss-key");
    expect(localStorage.getItem("corsproxy_cio_api_key")).toBe("cors-key");
    expect(localStorage.getItem("prefer_local_proxy")).toBe("true");
    expect(ProxyManager.hasConfiguredApiKeys()).toBe(true);
  });
});
