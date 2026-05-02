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

describe("ProxyManager preference loading", () => {
  beforeEach(() => {
    localStorage.clear();
    ProxyManager.setRss2jsonApiKey("");
    ProxyManager.setCorsproxyCIOApiKey("");
    ProxyManager.setPreferLocalProxy(false);
    delete (window as Window & { __TAURI__?: unknown }).__TAURI__;
    setImportMetaEnv({});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    setImportMetaEnv({});
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
    setImportMetaEnv({
      VITE_BACKEND_ENABLED: "true",
      VITE_BACKEND_DEFAULT_MODE: "on",
    });
    localStorage.removeItem("prefer_local_proxy");

    ProxyManager.loadPreferences();

    expect(ProxyManager.getPreferLocalProxy()).toBe(true);
  });

  it("forces the local route on dev local even when a stale saved preference was false", () => {
    vi.stubEnv("VITE_BACKEND_ENABLED", "true");
    vi.stubEnv("VITE_BACKEND_DEFAULT_MODE", "on");
    setImportMetaEnv({
      VITE_BACKEND_ENABLED: "true",
      VITE_BACKEND_DEFAULT_MODE: "on",
    });
    localStorage.setItem("prefer_local_proxy", "false");

    ProxyManager.loadPreferences();

    expect(ProxyManager.getPreferLocalProxy()).toBe(true);
    expect(localStorage.getItem("prefer_local_proxy")).toBe("true");
  });

  it("forces the local route in backend auto mode even when a stale saved preference was false", () => {
    vi.stubEnv("VITE_BACKEND_ENABLED", "true");
    vi.stubEnv("VITE_BACKEND_DEFAULT_MODE", "auto");
    setImportMetaEnv({
      VITE_BACKEND_ENABLED: "true",
      VITE_BACKEND_DEFAULT_MODE: "auto",
    });
    localStorage.setItem("prefer_local_proxy", "false");

    ProxyManager.loadPreferences();

    expect(ProxyManager.getPreferLocalProxy()).toBe(true);
    expect(localStorage.getItem("prefer_local_proxy")).toBe("true");
  });

  it("lets explicit backend off override a stale saved local preference", () => {
    vi.stubEnv("VITE_BACKEND_ENABLED", "true");
    vi.stubEnv("VITE_BACKEND_DEFAULT_MODE", "off");
    setImportMetaEnv({
      VITE_BACKEND_ENABLED: "true",
      VITE_BACKEND_DEFAULT_MODE: "off",
    });
    localStorage.setItem("prefer_local_proxy", "true");

    ProxyManager.loadPreferences();

    expect(ProxyManager.getPreferLocalProxy()).toBe(false);
    expect(localStorage.getItem("prefer_local_proxy")).toBe("false");
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

  it("persists disabled proxies across preference reloads", () => {
    Object.defineProperty(window, "__TAURI__", {
      value: {},
      configurable: true,
    });

    proxyManager.disableProxy("CodeTabs");

    expect(localStorage.getItem("disabled_proxies")).toContain("CodeTabs");

    proxyManager.enableProxy("CodeTabs");
    proxyManager.disableProxy("CodeTabs");
    ProxyManager.loadPreferences();

    const codeTabs = proxyManager
      .getProxyConfigs()
      .find((config) => config.name === "CodeTabs");

    expect(codeTabs?.enabled).toBe(false);
  });

  it("starts remote fallback proxies disabled by default in desktop runtime", () => {
    Object.defineProperty(window, "__TAURI__", {
      value: {},
      configurable: true,
    });
    localStorage.removeItem("disabled_proxies");

    ProxyManager.loadPreferences();

    const remoteProxy = proxyManager
      .getProxyConfigs()
      .find((config) => config.name === "CodeTabs");
    expect(remoteProxy?.enabled).toBe(false);
  });

  it("allows manually enabling an optional remote proxy during a desktop session", () => {
    Object.defineProperty(window, "__TAURI__", {
      value: {},
      configurable: true,
    });
    localStorage.removeItem("disabled_proxies");
    ProxyManager.loadPreferences();

    proxyManager.enableProxy("CodeTabs");

    const availableProxy = proxyManager
      .getAvailableProxies()
      .find((config) => config.name === "CodeTabs");
    expect(availableProxy).toBeDefined();
  });
});

describe("ProxyManager desktop LocalProxy diagnostics", () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    delete (window as Window & { __TAURI__?: unknown }).__TAURI__;
    Object.defineProperty(window, "__TAURI_INTERNALS__", {
      value: undefined,
      configurable: true,
    });
    setImportMetaEnv({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    setImportMetaEnv({});
  });

  it("does not turn a starting desktop supervisor into a health-check failure", async () => {
    const invoke = vi.fn(async (command: string) => {
      if (command === "get_backend_status") {
        return {
          generation: 1,
          sidecarSpawned: true,
          pid: null,
          baseUrl: "http://127.0.0.1:3001",
          port: 3001,
          dbPath: "memory",
          tokenAvailable: true,
          health: "starting",
          diagnostic: "starting",
          uptimeMs: 1200,
          lastStartError: null,
          lastHealthError: null,
          lastExitCode: null,
        };
      }
      return null;
    });

    Object.defineProperty(window, "__TAURI_INTERNALS__", {
      value: { invoke },
      configurable: true,
    });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { proxyManager: desktopProxyManager } =
      await import("../services/proxyManager");

    const result = await desktopProxyManager.testProxy("LocalProxy");

    expect(result).toMatchObject({
      success: true,
      route: "backend-health",
    });
    expect(result.detail).toContain("inicializando");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not turn a restarting desktop supervisor into a health-check failure", async () => {
    Object.defineProperty(window, "__TAURI_INTERNALS__", {
      value: {
        invoke: vi.fn(async (command: string) => {
          if (command === "get_backend_status") {
            return {
              generation: 2,
              sidecarSpawned: true,
              pid: null,
              baseUrl: "http://127.0.0.1:3001",
              port: 3001,
              dbPath: "memory",
              tokenAvailable: true,
              health: "restarting",
              diagnostic: "starting",
              uptimeMs: 0,
              lastStartError: null,
              lastHealthError: null,
              lastExitCode: null,
            };
          }
          return null;
        }),
      },
      configurable: true,
    });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { proxyManager: desktopProxyManager } =
      await import("../services/proxyManager");

    const result = await desktopProxyManager.testProxy("LocalProxy");

    expect(result).toMatchObject({
      success: true,
      route: "backend-health",
    });
    expect(result.detail).toContain("reiniciando");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
