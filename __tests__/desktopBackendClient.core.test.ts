import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("desktopBackendClient local discovery", () => {
  beforeEach(() => {
    vi.resetModules();
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
});
