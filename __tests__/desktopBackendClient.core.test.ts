import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("desktopBackendClient local discovery", () => {
  beforeEach(() => {
    vi.resetModules();
    Object.defineProperty(window, "__TAURI__", {
      value: undefined,
      configurable: true,
    });
    Object.defineProperty(window, "__TAURI_INTERNALS__", {
      value: undefined,
      configurable: true,
    });
    Object.defineProperty(window, "__PERSONALNEWS_BACKEND_CONFIG__", {
      value: undefined,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(window, "location", {
      value: {
        ...window.location,
        hostname: "localhost",
        port: "5173",
        protocol: "http:",
      },
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("treats localhost dev as backend-capable and discovers a healthy backend port", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url === "http://127.0.0.1:3004/health") {
        return {
          ok: true,
          json: async () => ({
            status: "ok",
            service: "personalnews-backend",
            version: "0.1.0",
            uptimeMs: 10,
            dbPath: "memory",
            now: new Date().toISOString(),
          }),
        } as Response;
      }

      throw new Error("connect ECONNREFUSED");
    });

    vi.stubGlobal("fetch", fetchMock);

    const { desktopBackendClient } =
      await import("../services/desktopBackendClient");

    expect(desktopBackendClient.isEnabled()).toBe(true);

    const result = await desktopBackendClient.checkHealth(true);

    expect(result.available).toBe(true);
    expect(desktopBackendClient.getBaseUrl()).toBe("http://127.0.0.1:3004");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:3004/health",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("does not scan ports or mark unavailable when the caller signal is already aborted", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { desktopBackendClient } =
      await import("../services/desktopBackendClient");
    const controller = new AbortController();
    controller.abort();

    const result = await desktopBackendClient.checkHealth(true, controller.signal);

    expect(result.available).toBe(false);
    expect(result.initializing).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reuses an in-flight health discovery for concurrent callers", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        status: "ok",
        service: "personalnews-backend",
        version: "0.1.0",
        uptimeMs: 10,
        dbPath: "memory",
        now: new Date().toISOString(),
      }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    const { desktopBackendClient } =
      await import("../services/desktopBackendClient");

    const [first, second] = await Promise.all([
      desktopBackendClient.checkHealth(true),
      desktopBackendClient.checkHealth(true),
    ]);

    expect(first.available).toBe(true);
    expect(second.available).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reports warm-up without exposing a cascade of candidate abort errors", async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error("connect ECONNREFUSED");
    });

    vi.stubGlobal("fetch", fetchMock);

    const { desktopBackendClient } =
      await import("../services/desktopBackendClient");

    const result = await desktopBackendClient.checkHealth(true);

    expect(result.available).toBe(false);
    expect(result.initializing).toBe(true);
    expect(result.error).toBe("Backend local inicializando");
    expect(result.error).not.toContain("signal is aborted without reason");
  });

  it("sends the Tauri backend auth token on protected backend requests", async () => {
    Object.defineProperty(window, "__TAURI_INTERNALS__", {
      value: {
        invoke: vi.fn(async (command: string) => {
          if (command === "get_backend_status") {
            return {
              sidecarSpawned: true,
              baseUrl: "http://127.0.0.1:3001",
              port: 3001,
              dbPath: "memory",
              tokenAvailable: true,
              health: "ready",
              diagnostic: "ready",
            };
          }
          if (command === "get_backend_auth_token") return "desktop-token";
          return null;
        }),
      },
      configurable: true,
    });

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.endsWith("/health")) {
        return {
          ok: true,
          json: async () => ({
            status: "ok",
            service: "personalnews-backend",
            version: "0.1.0",
            uptimeMs: 10,
            dbPath: "memory",
            now: new Date().toISOString(),
          }),
        } as Response;
      }

      const headers = new Headers(init?.headers);
      expect(headers.get("x-personalnews-backend-token")).toBe("desktop-token");
      return {
        ok: true,
        json: async () => ({
          settings: {
            backendMode: "on",
            windowStyle: "native_thin",
            cacheTtlMinutes: 30,
            updatedAt: new Date().toISOString(),
          },
        }),
      } as Response;
    });

    vi.stubGlobal("fetch", fetchMock);

    const { desktopBackendClient } =
      await import("../services/desktopBackendClient");

    await expect(desktopBackendClient.setSettings({ backendMode: "on" })).resolves.toBe("on");
  });

  it("uses the Tauri backend status URL instead of scanning local ports", async () => {
    Object.defineProperty(window, "__TAURI_INTERNALS__", {
      value: {
        invoke: vi.fn(async (command: string) => {
          if (command === "get_backend_status") {
            return {
              sidecarSpawned: true,
              baseUrl: "http://127.0.0.1:3020",
              port: 3020,
              dbPath: "memory",
              tokenAvailable: true,
              health: "ready",
              diagnostic: "ready",
            };
          }
          return null;
        }),
      },
      configurable: true,
    });

    const fetchMock = vi.fn();

    vi.stubGlobal("fetch", fetchMock);

    const { desktopBackendClient } =
      await import("../services/desktopBackendClient");

    const result = await desktopBackendClient.checkHealth(true);

    expect(result.available).toBe(true);
    expect(desktopBackendClient.getBaseUrl()).toBe("http://127.0.0.1:3020");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalledWith(
      "http://127.0.0.1:3001/health",
      expect.anything(),
    );
  });

  it("accepts nullable Rust status fields and normalizes them internally", async () => {
    Object.defineProperty(window, "__TAURI_INTERNALS__", {
      value: {
        invoke: vi.fn(async (command: string) => {
          if (command === "get_backend_status") {
            return {
              generation: 1,
              sidecarSpawned: true,
              pid: null,
              baseUrl: "http://127.0.0.1:3001",
              port: 3001,
              dbPath: "memory",
              tokenAvailable: true,
              health: "ready",
              diagnostic: "ready",
              uptimeMs: null,
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

    const { desktopBackendClient } =
      await import("../services/desktopBackendClient");

    const status = await desktopBackendClient.getDesktopStatus();

    expect(status).toMatchObject({
      health: "ready",
      baseUrl: "http://127.0.0.1:3001",
    });
    expect(status?.pid).toBeUndefined();
    expect(status?.lastHealthError).toBeUndefined();
    await expect(desktopBackendClient.checkHealth(true)).resolves.toMatchObject({
      available: true,
      initializing: false,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("keeps a starting Tauri backend in warmup without probing the default port", async () => {
    Object.defineProperty(window, "__TAURI_INTERNALS__", {
      value: {
        invoke: vi.fn(async (command: string) => {
          if (command === "get_backend_status") {
            return {
              sidecarSpawned: true,
              baseUrl: "http://127.0.0.1:3020",
              port: 3020,
              dbPath: "memory",
              tokenAvailable: true,
              health: "starting",
              diagnostic: "starting",
            };
          }
          return null;
        }),
      },
      configurable: true,
    });

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { desktopBackendClient } =
      await import("../services/desktopBackendClient");

    const result = await desktopBackendClient.checkHealth(true);

    expect(result).toMatchObject({
      available: false,
      initializing: true,
      error: "Backend local inicializando",
    });
    expect(desktopBackendClient.getBaseUrl()).toBe("http://127.0.0.1:3020");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("bootstraps the Tauri supervisor URL before the app renders", async () => {
    Object.defineProperty(window, "__TAURI_INTERNALS__", {
      value: {
        invoke: vi.fn(async (command: string) => {
          if (command === "get_backend_status") {
            return {
              sidecarSpawned: true,
              baseUrl: "http://127.0.0.1:3033",
              port: 3033,
              dbPath: "memory",
              tokenAvailable: true,
              health: "ready",
              diagnostic: "ready",
            };
          }
          return null;
        }),
      },
      configurable: true,
    });

    const { desktopBackendClient } =
      await import("../services/desktopBackendClient");

    await expect(desktopBackendClient.bootstrapFromSupervisor()).resolves.toMatchObject({
      baseUrl: "http://127.0.0.1:3033",
      health: "ready",
    });
    expect(desktopBackendClient.getBaseUrl()).toBe("http://127.0.0.1:3033");
    expect(window.__PERSONALNEWS_BACKEND_CONFIG__).toMatchObject({
      baseUrl: "http://127.0.0.1:3033",
      status: {
        health: "ready",
      },
    });
  });

  it("trusts a ready Tauri supervisor when the browser health probe is cancelled", async () => {
    Object.defineProperty(window, "__TAURI_INTERNALS__", {
      value: {
        invoke: vi.fn(async (command: string) => {
          if (command === "get_backend_status") {
            return {
              sidecarSpawned: true,
              baseUrl: "http://127.0.0.1:3001",
              port: 3001,
              dbPath: "memory",
              tokenAvailable: true,
              health: "ready",
              diagnostic: "ready",
              uptimeMs: 2200,
            };
          }
          if (command === "get_backend_auth_token") return "desktop-token";
          return null;
        }),
      },
      configurable: true,
    });

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/health")) {
        throw new DOMException("Health check cancelled", "AbortError");
      }

      if (url.endsWith("/api/v1/feeds/batch")) {
        return {
          ok: true,
          json: async () => ({
            total: 1,
            success: 1,
            failed: 0,
            items: [
              {
                url: "https://example.com/rss.xml",
                success: true,
                result: {
                  title: "Example",
                  articles: [],
                  meta: {
                    source: "backend",
                    cached: false,
                    fetchedAt: new Date().toISOString(),
                    latencyMs: 1,
                  },
                },
              },
            ],
          }),
        } as Response;
      }

      return {
        ok: true,
        json: async () => ({
          feeds: [{ url: "https://example.com/rss.xml", customTitle: "Example" }],
          categories: [],
          source: "backend",
          updatedAt: new Date().toISOString(),
        }),
      } as Response;
    });

    vi.stubGlobal("fetch", fetchMock);

    const { desktopBackendClient } =
      await import("../services/desktopBackendClient");

    await expect(desktopBackendClient.checkHealth(true)).resolves.toMatchObject({
      available: true,
      initializing: false,
    });
    await expect(desktopBackendClient.getFeedCollection()).resolves.toMatchObject({
      feeds: [{ url: "https://example.com/rss.xml", customTitle: "Example" }],
    });
    await expect(
      desktopBackendClient.fetchFeedsBatch(["https://example.com/rss.xml"]),
    ).resolves.toMatchObject({
      total: 1,
      success: 1,
      failed: 0,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:3001/api/v1/feeds",
      expect.objectContaining({ method: "GET" }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:3001/api/v1/feeds/batch",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("refreshes the Tauri token once after a protected request returns 401", async () => {
    const invoke = vi.fn(async (command: string) => {
      if (command === "get_backend_status") {
        return {
          sidecarSpawned: true,
          baseUrl: "http://127.0.0.1:3001",
          port: 3001,
          dbPath: "memory",
          tokenAvailable: true,
          health: "ready",
          diagnostic: "ready",
        };
      }
      if (command === "get_backend_auth_token") {
        return invoke.mock.calls.filter(([name]) => name === command).length === 1
          ? "old-token"
          : "new-token";
      }
      return null;
    });

    Object.defineProperty(window, "__TAURI_INTERNALS__", {
      value: { invoke },
      configurable: true,
    });

    const protectedHeaders: Array<string | null> = [];
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/health")) {
        return {
          ok: true,
          json: async () => ({
            status: "ok",
            service: "personalnews-backend",
            version: "0.1.0",
            uptimeMs: 10,
            dbPath: "memory",
            now: new Date().toISOString(),
          }),
        } as Response;
      }

      protectedHeaders.push(
        new Headers(init?.headers).get("x-personalnews-backend-token"),
      );
      if (protectedHeaders.length === 1) {
        return {
          ok: false,
          status: 401,
          json: async () => ({ error: "Backend authentication required" }),
        } as Response;
      }

      return {
        ok: true,
        json: async () => ({
          settings: {
            backendMode: "on",
            windowStyle: "native_thin",
            cacheTtlMinutes: 30,
            updatedAt: new Date().toISOString(),
          },
        }),
      } as Response;
    });

    vi.stubGlobal("fetch", fetchMock);

    const { desktopBackendClient } =
      await import("../services/desktopBackendClient");

    await expect(desktopBackendClient.getSettings()).resolves.toBe("on");
    expect(protectedHeaders).toEqual(["old-token", "new-token"]);
  });

  it("reads and persists the desktop backend feed collection", async () => {
    Object.defineProperty(window, "__TAURI_INTERNALS__", {
      value: {
        invoke: vi.fn(async (command: string) => {
          if (command === "get_backend_status") {
            return {
              sidecarSpawned: true,
              baseUrl: "http://127.0.0.1:3001",
              port: 3001,
              dbPath: "memory",
              tokenAvailable: true,
              health: "ready",
              diagnostic: "ready",
            };
          }
          if (command === "get_backend_auth_token") return "desktop-token";
          return null;
        }),
      },
      configurable: true,
    });

    const requests: Array<{ url: string; body?: unknown }> = [];
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/health")) {
        return {
          ok: true,
          json: async () => ({
            status: "ok",
            service: "personalnews-backend",
            version: "0.1.0",
            uptimeMs: 10,
            dbPath: "memory",
            now: new Date().toISOString(),
          }),
        } as Response;
      }

      requests.push({
        url,
        body: init?.body ? JSON.parse(String(init.body)) : undefined,
      });
      if (url.endsWith("/api/v1/feeds/import-local-storage")) {
        return {
          ok: true,
          json: async () => ({
            importedFeeds: 1,
            skippedFeeds: 0,
            importedCategories: 0,
            skippedCategories: 0,
            updatedAt: new Date().toISOString(),
          }),
        } as Response;
      }
      return {
        ok: true,
        json: async () => ({
          feeds: [
            {
              url: "https://example.com/rss.xml",
              customTitle: "Example",
            },
          ],
          categories: [],
          source: "backend",
          updatedAt: new Date().toISOString(),
        }),
      } as Response;
    });

    vi.stubGlobal("fetch", fetchMock);

    const { desktopBackendClient } =
      await import("../services/desktopBackendClient");

    await expect(desktopBackendClient.getFeedCollection()).resolves.toMatchObject({
      feeds: [{ url: "https://example.com/rss.xml", customTitle: "Example" }],
    });
    await desktopBackendClient.replaceFeedCollection([
      { url: "https://example.org/feed.xml" },
    ]);
    await desktopBackendClient.importLocalFeedCollection([
      { url: "https://example.net/feed.xml" },
    ]);
    await desktopBackendClient.replaceFeedCategories([
      { id: "tech", name: "Tech", color: "#38bdf8", order: 1 },
    ]);

    expect(requests.map((request) => request.url)).toEqual([
      "http://127.0.0.1:3001/api/v1/feeds",
      "http://127.0.0.1:3001/api/v1/feeds",
      "http://127.0.0.1:3001/api/v1/feeds/import-local-storage",
      "http://127.0.0.1:3001/api/v1/feeds/categories",
    ]);
    expect(requests[1].body).toEqual({
      feeds: [{ url: "https://example.org/feed.xml" }],
    });
    expect(requests[2].body).toEqual({
      feeds: [{ url: "https://example.net/feed.xml" }],
      source: "localStorage",
    });
    expect(requests[3].body).toEqual({
      categories: [{ id: "tech", name: "Tech", color: "#38bdf8", order: 1 }],
    });
  });

  it("applies backend status events without waiting for the next poll", async () => {
    const handlers = new Map<string, (event: { payload: unknown }) => void>();
    Object.defineProperty(window, "__TAURI__", {
      value: {
        event: {
          listen: vi.fn(async (event: string, handler: (event: { payload: unknown }) => void) => {
            handlers.set(event, handler);
            return vi.fn();
          }),
        },
      },
      configurable: true,
    });

    const { desktopBackendClient } =
      await import("../services/desktopBackendClient");

    handlers.get("backend-ready")?.({
      payload: {
        sidecarSpawned: true,
        pid: null,
        baseUrl: "http://127.0.0.1:3022",
        port: 3022,
        dbPath: "memory",
        tokenAvailable: true,
        health: "ready",
        diagnostic: "ready",
        uptimeMs: null,
        lastStartError: null,
        lastHealthError: null,
        lastExitCode: null,
      },
    });

    expect(desktopBackendClient.getBaseUrl()).toBe("http://127.0.0.1:3022");
    expect(desktopBackendClient.getRuntimeState()).toMatchObject({
      activeMode: "desktop-local",
      backendAvailable: true,
      backendInitializing: false,
    });
  });
});
