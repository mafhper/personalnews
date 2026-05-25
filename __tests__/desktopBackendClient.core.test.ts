import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DesktopBackendStatusSchema } from "../shared/contracts/backend";

const importMetaWithEnv = import.meta as ImportMeta & {
  env: Record<string, boolean | string | undefined>;
};
const ORIGINAL_IMPORT_META_ENV = { ...importMetaWithEnv.env };

const setImportMetaEnv = (
  patch: Record<string, boolean | string | undefined>,
) => {
  importMetaWithEnv.env = {
    ...ORIGINAL_IMPORT_META_ENV,
    ...patch,
  };
};

describe("desktopBackendClient local discovery", () => {
  beforeEach(() => {
    vi.resetModules();
    delete (window as Window & { __TAURI__?: unknown }).__TAURI__;
    delete (window as Window & { __TAURI_INTERNALS__?: unknown })
      .__TAURI_INTERNALS__;
    delete (globalThis as typeof globalThis & { isTauri?: unknown }).isTauri;
    Object.defineProperty(window, "location", {
      value: {
        ...window.location,
        hostname: "localhost",
        port: "5173",
        protocol: "http:",
      },
      configurable: true,
    });
    setImportMetaEnv({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    setImportMetaEnv({});
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

  it("rejects backend feed batches larger than the backend contract", async () => {
    const { desktopBackendClient } =
      await import("../services/desktopBackendClient");

    await expect(
      desktopBackendClient.fetchFeedsBatch(
        Array.from({ length: 26 }, (_, index) => `https://example.com/${index}.xml`),
      ),
    ).rejects.toThrow("at most 25");
  });

  it("sends batches with up to 25 URLs and exposes degraded backend state", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === "http://127.0.0.1:3001/health") {
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

      if (url === "http://127.0.0.1:3001/api/v1/feeds/batch") {
        const body = JSON.parse(String(init?.body));
        expect(body.urls).toHaveLength(25);
        return {
          ok: true,
          json: async () => ({
            total: 25,
            success: 1,
            failed: 24,
            items: body.urls.map((feedUrl: string, index: number) => ({
              url: feedUrl,
              success: index === 0,
              result:
                index === 0
                  ? {
                      title: "Example",
                      articles: [],
                      meta: {
                        source: "backend",
                        cached: false,
                        fetchedAt: new Date().toISOString(),
                        latencyMs: 3,
                      },
                    }
                  : undefined,
              error: index === 0 ? undefined : "failed",
              latencyMs: 3,
              cached: index === 0 ? false : undefined,
              statusCode: index === 0 ? 200 : 500,
              errorType: index === 0 ? undefined : "http",
            })),
          }),
        } as Response;
      }

      throw new Error(`Unexpected URL ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const { desktopBackendClient } =
      await import("../services/desktopBackendClient");

    const response = await desktopBackendClient.fetchFeedsBatch(
      Array.from({ length: 25 }, (_, index) => `https://example.com/${index}.xml`),
    );

    expect(response.items).toHaveLength(25);
    expect(desktopBackendClient.getBackendHealthState()).toMatchObject({
      available: true,
      circuitOpen: false,
    });
  });

  it("opens a circuit after repeated backend request failures", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "http://127.0.0.1:3001/health") {
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

      return {
        ok: false,
        status: 500,
        json: async () => ({ error: "backend exploded" }),
      } as Response;
    });
    vi.stubGlobal("fetch", fetchMock);

    const { desktopBackendClient } =
      await import("../services/desktopBackendClient");

    for (let index = 0; index < 3; index += 1) {
      await expect(
        desktopBackendClient.fetchFeedsBatch(["https://example.com/rss.xml"]),
      ).rejects.toThrow("backend exploded");
    }

    expect(desktopBackendClient.getBackendHealthState()).toMatchObject({
      available: false,
      circuitOpen: true,
    });
    const callsBeforeCircuitRejection = fetchMock.mock.calls.length;
    await expect(
      desktopBackendClient.fetchFeedsBatch(["https://example.com/rss.xml"]),
    ).rejects.toThrow("modo degradado");
    expect(fetchMock).toHaveBeenCalledTimes(callsBeforeCircuitRejection);
  });

  it("does not open the backend circuit for repeated upstream feed timeouts", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "http://127.0.0.1:3001/health") {
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

      if (url.startsWith("http://127.0.0.1:3001/api/v1/feed?")) {
        return {
          ok: false,
          status: 504,
          json: async () => ({
            error: "Upstream feed timeout after 12000ms",
          }),
        } as Response;
      }

      throw new Error(`Unexpected URL ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const { desktopBackendClient } =
      await import("../services/desktopBackendClient");

    for (let index = 0; index < 4; index += 1) {
      await expect(
        desktopBackendClient.fetchFeed(`https://example.com/feed-${index}.xml`),
      ).rejects.toThrow("Upstream feed timeout");
    }

    expect(desktopBackendClient.getBackendHealthState()).toMatchObject({
      available: true,
      circuitOpen: false,
      lastFailure: null,
    });
    expect(
      fetchMock.mock.calls.filter(([input]) =>
        String(input).includes("/api/v1/feed?"),
      ),
    ).toHaveLength(4);
  });

  it("does not open the backend circuit when navigation aborts pending feed requests", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "http://127.0.0.1:3001/health") {
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

      throw new DOMException("Request was cancelled", "AbortError");
    });
    vi.stubGlobal("fetch", fetchMock);

    const { desktopBackendClient } =
      await import("../services/desktopBackendClient");

    for (let index = 0; index < 4; index += 1) {
      await expect(
        desktopBackendClient.fetchFeed(`https://example.com/feed-${index}.xml`),
      ).rejects.toThrow("Request was cancelled");
    }

    expect(desktopBackendClient.getBackendHealthState()).toMatchObject({
      available: true,
      circuitOpen: false,
      lastFailure: null,
    });
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
              pid: 1234,
              baseUrl: "http://127.0.0.1:3001",
              port: 3001,
              dbPath: "memory",
              tokenAvailable: true,
              health: "ready",
              diagnostic: "ready",
              uptimeMs: 10,
              lastStartError: null,
              lastHealthError: null,
              lastExitCode: null,
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

  it("normalizes nullable Rust supervisor fields", () => {
    const parsed = DesktopBackendStatusSchema.parse({
      sidecarSpawned: true,
      pid: null,
      baseUrl: "http://127.0.0.1:3001",
      port: 3001,
      dbPath: "C:\\Users\\test\\AppData\\Local\\PersonalNews\\backend\\personalnews.db",
      tokenAvailable: true,
      health: "starting",
      diagnostic: "starting",
      uptimeMs: null,
      lastStartError: null,
      lastHealthError: null,
      lastExitCode: null,
    });

    expect(parsed.pid).toBeUndefined();
    expect(parsed.uptimeMs).toBeUndefined();
    expect(parsed.lastStartError).toBeUndefined();
    expect(parsed.lastHealthError).toBeUndefined();
    expect(parsed.lastExitCode).toBeUndefined();
  });

  it("uses supervisor status as the desktop source of truth", async () => {
    Object.defineProperty(window, "__TAURI_INTERNALS__", {
      value: {
        invoke: vi.fn(async (command: string) => {
          if (command === "get_backend_status") {
            return {
              sidecarSpawned: true,
              pid: 1234,
              baseUrl: "http://127.0.0.1:3007",
              port: 3007,
              dbPath: "memory",
              tokenAvailable: true,
              health: "ready",
              diagnostic: "ready",
              uptimeMs: 1200,
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
    const result = await desktopBackendClient.checkHealth(true);

    expect(result.available).toBe(true);
    expect(result.initializing).toBe(false);
    expect(desktopBackendClient.getBaseUrl()).toBe("http://127.0.0.1:3007");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("probes the configured backend in Tauri dev when the supervisor is not started", async () => {
    setImportMetaEnv({
      DEV: true,
      MODE: "development",
      VITE_LOCAL_BACKEND_URL: "http://127.0.0.1:3001",
    });
    Object.defineProperty(window, "__TAURI_INTERNALS__", {
      value: {
        invoke: vi.fn(async (command: string) => {
          if (command === "get_backend_status") {
            return {
              sidecarSpawned: false,
              pid: null,
              baseUrl: "http://127.0.0.1:3001",
              port: 3001,
              dbPath: "memory",
              tokenAvailable: false,
              health: "not_started",
              diagnostic: "not_started",
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
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "http://127.0.0.1:3001/health") {
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
    const result = await desktopBackendClient.checkHealth(true);

    expect(result.available).toBe(true);
    expect(result.initializing).toBe(false);
    expect(desktopBackendClient.getBaseUrl()).toBe("http://127.0.0.1:3001");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:3001/health",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("surfaces a failed supervisor status instead of masking it as warmup", async () => {
    setImportMetaEnv({
      DEV: false,
      MODE: "production",
      VITE_LOCAL_BACKEND_URL: undefined,
    });
    Object.defineProperty(window, "__TAURI_INTERNALS__", {
      value: {
        invoke: vi.fn(async (command: string) => {
          if (command === "get_backend_status") {
            return {
              sidecarSpawned: false,
              pid: null,
              baseUrl: "http://127.0.0.1:3001",
              port: 3001,
              dbPath: "memory",
              tokenAvailable: false,
              health: "failed",
              diagnostic: "spawn_blocked",
              uptimeMs: null,
              lastStartError: "failed to start backend sidecar",
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
    const result = await desktopBackendClient.checkHealth(true);

    expect(result.available).toBe(false);
    expect(result.initializing).toBe(false);
    expect(result.error).toBe("failed to start backend sidecar");
    expect(desktopBackendClient.getRuntimeState().lastError).toBe(
      "failed to start backend sidecar",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("stops waiting immediately when the supervisor reports a terminal failure", async () => {
    let calls = 0;
    Object.defineProperty(window, "__TAURI_INTERNALS__", {
      value: {
        invoke: vi.fn(async (command: string) => {
          if (command === "get_backend_status") {
            calls += 1;
            return {
              sidecarSpawned: false,
              pid: null,
              baseUrl: "http://127.0.0.1:3001",
              port: 3001,
              dbPath: "memory",
              tokenAvailable: false,
              health: "failed",
              diagnostic: "spawn_blocked",
              uptimeMs: null,
              lastStartError: "failed to start backend sidecar",
              lastHealthError: null,
              lastExitCode: null,
            };
          }
          return null;
        }),
      },
      configurable: true,
    });
    vi.stubGlobal("fetch", vi.fn());

    const { desktopBackendClient } =
      await import("../services/desktopBackendClient");

    await expect(desktopBackendClient.waitUntilReady(2_000)).resolves.toBe(
      false,
    );
    expect(calls).toBe(1);
    expect(desktopBackendClient.getRuntimeState().lastError).toBe(
      "failed to start backend sidecar",
    );
  });

  it("waits for a desktop supervisor transition to ready", async () => {
    let calls = 0;
    Object.defineProperty(window, "__TAURI_INTERNALS__", {
      value: {
        invoke: vi.fn(async (command: string) => {
          if (command === "get_backend_status") {
            calls += 1;
            return {
              sidecarSpawned: true,
              pid: 1234,
              baseUrl: "http://127.0.0.1:3007",
              port: 3007,
              dbPath: "memory",
              tokenAvailable: true,
              health: calls < 2 ? "starting" : "ready",
              diagnostic: calls < 2 ? "starting" : "ready",
              uptimeMs: calls * 100,
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
    vi.stubGlobal("fetch", vi.fn());

    const { desktopBackendClient } =
      await import("../services/desktopBackendClient");

    await expect(desktopBackendClient.waitUntilReady(2_000)).resolves.toBe(true);
    expect(calls).toBeGreaterThanOrEqual(2);
  });
});
