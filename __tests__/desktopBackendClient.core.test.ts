import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DesktopBackendStatusSchema } from "../shared/contracts/backend";

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
