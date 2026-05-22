import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProxySettings } from "../components/ProxySettings";
import type { ProxyDashboardSnapshot } from "../hooks/useProxyDashboard";

vi.mock("../hooks/useProxyConfig", () => ({
  useProxyConfig: () => ({
    apiKeys: {},
    validationErrors: {},
    isLoading: false,
    setProxyEnabled: vi.fn(),
    setApiKey: vi.fn(),
    clearApiKey: vi.fn(),
    testProxy: vi.fn(),
    getAllProxiesStatus: () => [
      {
        id: "local-proxy",
        name: "LocalProxy",
        reliability: "excellent",
        responseTime: "fast",
        hasApiKey: false,
        isConfigured: true,
        enabled: true,
        health: { score: 100, recommendation: "ok" },
      },
      {
        id: "rss2json",
        name: "RSS2JSON",
        reliability: "good",
        responseTime: "moderate",
        hasApiKey: true,
        isConfigured: false,
        enabled: true,
        health: { score: 80, recommendation: "ok" },
        apiKeyStatus: {
          proxyId: "rss2json",
          proxyName: "RSS2JSON",
          hasKey: false,
          origin: "not-configured",
        },
      },
    ],
  }),
}));

vi.mock("../hooks/useProxyDashboard", () => ({
  useProxyDashboard: () => ({
    snapshot: {
      runtime: { activeMode: "web-client", backendAvailable: false },
      backend: { enabled: false, available: false },
      routes: [],
      summary: {
        totalRoutes: 0,
        healthyRoutes: 0,
        totalRequests: 0,
        totalSuccesses: 0,
        totalFailures: 0,
        successRate: 0,
        fallbackActive: false,
        missingApiKeys: [],
      },
    },
    refresh: vi.fn(),
  }),
}));

const makeSnapshot = (localStatus: "healthy" | "offline" = "healthy"): ProxyDashboardSnapshot => ({
  runtime: {
    activeMode: "web-client",
    backendAvailable: false,
  },
  backend: {
    enabled: false,
    available: false,
  },
  routes: [
    {
      id: "local-proxy",
      name: "LocalProxy",
      transport: "desktop-backend",
      routeKind: "local-backend",
      enabled: true,
      status: localStatus,
      healthScore: localStatus === "healthy" ? 100 : 0,
      successRate: null,
      totalRequests: 0,
      successCount: 0,
      failureCount: 0,
      avgResponseTime: 0,
      consecutiveFailures: localStatus === "healthy" ? 0 : 3,
      detail: "Local backend",
    },
    {
      id: "rss2json",
      name: "RSS2JSON",
      transport: "client",
      routeKind: "proxy",
      enabled: true,
      status: "idle",
      healthScore: 80,
      successRate: null,
      totalRequests: 0,
      successCount: 0,
      failureCount: 0,
      avgResponseTime: 0,
      consecutiveFailures: 0,
      detail: "RSS2JSON route",
    },
  ],
  summary: {
    totalRoutes: 2,
    healthyRoutes: localStatus === "healthy" ? 1 : 0,
    totalRequests: 0,
    totalSuccesses: 0,
    totalFailures: 0,
    successRate: 0,
    fallbackActive: false,
    missingApiKeys: [],
  },
});

describe("ProxySettings accordion", () => {
  it("keeps the user-opened proxy expanded across snapshot refreshes", () => {
    const { rerender } = render(
      <ProxySettings snapshot={makeSnapshot()} onRefresh={vi.fn()} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /rss2json/i }));
    expect(screen.getByText("Chave de API")).toBeInTheDocument();

    rerender(<ProxySettings snapshot={makeSnapshot("offline")} onRefresh={vi.fn()} />);

    expect(screen.getByText("Chave de API")).toBeInTheDocument();
  });
});
