import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FeedAnalytics } from "../components/FeedAnalytics";
import type { Article, FeedSource } from "../types";
import type { FeedValidationResult } from "../services/feedValidator";

const createProxySnapshot = (overrides: Record<string, unknown> = {}) => ({
  runtime: {
    activeMode: "cloud-fallback",
    lastRoute: "CodeTabs",
    lastWarning: JSON.stringify({
      cause: "backend_unavailable",
      summary: "Backend local indisponível",
      action: "Verifique o backend local do desktop.",
    }),
    warningDetails: {
      cause: "backend_unavailable",
      summary: "Backend local indisponível",
      action: "Verifique o backend local do desktop.",
    },
    backendAvailable: false,
  },
  backend: {
    enabled: true,
    available: false,
  },
  routes: [
    {
      id: "desktop:LocalBackend",
      name: "LocalBackend",
      transport: "desktop-backend",
      routeKind: "local-backend",
      enabled: true,
      status: "offline",
      healthScore: 0,
      successRate: null,
      totalRequests: 0,
      successCount: 0,
      failureCount: 0,
      avgResponseTime: 0,
      consecutiveFailures: 0,
      detail: "Backend local indisponível",
    },
  ],
  summary: {
    totalRoutes: 1,
    healthyRoutes: 0,
    totalRequests: 0,
    totalSuccesses: 0,
    totalFailures: 0,
    successRate: 0,
    fallbackActive: true,
    missingApiKeys: ["RSS2JSON"],
  },
  ...overrides,
});

let proxyDashboardSnapshot = createProxySnapshot();

vi.mock("../hooks/useProxyDashboard", () => ({
  useProxyDashboard: () => ({
    snapshot: proxyDashboardSnapshot,
    refresh: vi.fn(),
  }),
}));

describe("FeedAnalytics dashboard", () => {
  it("uses a single collection situation message instead of duplicated dominant problem copy", () => {
    proxyDashboardSnapshot = createProxySnapshot({
      runtime: {
        activeMode: "desktop-local",
        warningDetails: null,
        backendAvailable: true,
      },
      backend: {
        enabled: true,
        available: true,
      },
      summary: {
        totalRoutes: 1,
        healthyRoutes: 1,
        totalRequests: 1,
        totalSuccesses: 1,
        totalFailures: 0,
        successRate: 100,
        fallbackActive: false,
        missingApiKeys: [],
      },
    });
    const feeds: FeedSource[] = [
      { url: "https://example.com/missing.xml", customTitle: "Missing" },
    ];
    const feedValidations = new Map<string, FeedValidationResult>([
      [
        feeds[0].url,
        {
          url: feeds[0].url,
          isValid: false,
          status: "not_found",
          lastChecked: Date.now(),
          validationAttempts: [],
          suggestions: [],
          totalRetries: 0,
          totalValidationTime: 0,
          error: "Feed nao encontrado",
          diagnostics: {
            cause: "not_found",
            summary: "Feed nao encontrado",
            action: "Revise a URL do feed.",
          },
        },
      ],
    ]);

    render(
      <FeedAnalytics
        feeds={feeds}
        articles={[]}
        feedValidations={feedValidations}
      />,
    );

    expect(screen.getByText("Situação da coleção")).toBeInTheDocument();
    expect(screen.queryByText("Problema Dominante")).not.toBeInTheDocument();
    expect(screen.getByText("Inválidos reais")).toBeInTheDocument();
  });

  it("treats stale cached validations as warning instead of dominant errors", () => {
    proxyDashboardSnapshot = createProxySnapshot({
      runtime: {
        activeMode: "desktop-local",
        warningDetails: null,
        backendAvailable: true,
      },
      backend: {
        enabled: true,
        available: true,
      },
      summary: {
        totalRoutes: 1,
        healthyRoutes: 1,
        totalRequests: 1,
        totalSuccesses: 1,
        totalFailures: 0,
        successRate: 100,
        fallbackActive: false,
        missingApiKeys: [],
      },
    });
    const feeds: FeedSource[] = [
      { url: "https://example.com/flaky.xml", customTitle: "Flaky" },
    ];
    const feedValidations = new Map<string, FeedValidationResult>([
      [
        feeds[0].url,
        {
          url: feeds[0].url,
          isValid: true,
          status: "degraded_stale",
          severity: "warning",
          usedCache: true,
          lastSuccessfulFetchAt: new Date().toISOString(),
          lastChecked: Date.now(),
          validationAttempts: [],
          suggestions: [],
          totalRetries: 0,
          totalValidationTime: 0,
          diagnostic: "Falha transitória; cache recente mantido.",
        },
      ],
    ]);

    render(
      <FeedAnalytics
        feeds={feeds}
        articles={[]}
        feedValidations={feedValidations}
      />,
    );

    expect(screen.getByText("Coleção operando com cache")).toBeInTheDocument();
    expect(screen.getByText("Cache disponível")).toBeInTheDocument();
    expect(screen.getByText("degradado")).toBeInTheDocument();
  });

  it("keeps details collapsed until explicitly opened when diagnostics exist", async () => {
    proxyDashboardSnapshot = createProxySnapshot();
    const feeds: FeedSource[] = [
      {
        url: "https://example.com/tech.xml",
        customTitle: "Tech",
        categoryId: "tech",
      },
    ];
    const articles: Article[] = [];
    const feedValidations = new Map<string, FeedValidationResult>([
      [
        feeds[0].url,
        {
          url: feeds[0].url,
          isValid: false,
          status: "network_error",
          lastChecked: Date.now(),
          validationAttempts: [],
          suggestions: [],
          totalRetries: 0,
          totalValidationTime: 0,
          error: "Network error occurred while fetching the feed",
          diagnostics: {
            cause: "network_error",
            summary: "Falha de rede ao consultar o feed",
            action: "Verifique o backend local e os proxies em nuvem.",
          },
          route: {
            transport: "client",
            routeKind: "proxy",
            routeName: "CodeTabs",
            viaFallback: true,
            checkedAt: Date.now(),
          },
          finalMethod: "proxy",
        },
      ],
    ]);

    const user = userEvent.setup();

    render(
      <FeedAnalytics
        feeds={feeds}
        articles={articles}
        feedValidations={feedValidations}
      />,
    );

    expect(screen.getByText("Diagnóstico")).toBeInTheDocument();
    expect(screen.queryByText("Exportar relatório")).not.toBeInTheDocument();
    expect(screen.getByText("Backend local indisponível")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Detalhes/i }));

    expect(screen.getByText("Exportar relatório")).toBeInTheDocument();
    expect(screen.getAllByText("Exportar relatório")).toHaveLength(1);
    expect(screen.queryByText("Exportar JSON")).not.toBeInTheDocument();
    expect(screen.queryByText("Exportar Markdown")).not.toBeInTheDocument();
    expect(
      screen.getAllByText("Backend local indisponível").length,
    ).toBeGreaterThan(0);
  });

  it("starts compact in a healthy state and opens the focused diagnostics section", async () => {
    proxyDashboardSnapshot = createProxySnapshot({
      runtime: {
        activeMode: "desktop-local",
        lastRoute: "LocalBackend",
        warningDetails: null,
        backendAvailable: true,
      },
      backend: {
        enabled: true,
        available: true,
      },
      routes: [],
      summary: {
        totalRoutes: 1,
        healthyRoutes: 1,
        totalRequests: 2,
        totalSuccesses: 2,
        totalFailures: 0,
        successRate: 100,
        fallbackActive: false,
        missingApiKeys: [],
      },
    });

    const feeds: FeedSource[] = [
      {
        url: "https://example.com/healthy.xml",
        customTitle: "Healthy",
        categoryId: "tech",
      },
    ];
    const feedValidations = new Map<string, FeedValidationResult>([
      [
        feeds[0].url,
        {
          url: feeds[0].url,
          isValid: true,
          status: "valid",
          lastChecked: Date.now(),
          validationAttempts: [],
          suggestions: [],
          totalRetries: 0,
          totalValidationTime: 0,
          finalMethod: "backend",
        },
      ],
    ]);

    render(
      <FeedAnalytics
        feeds={feeds}
        articles={[]}
        feedValidations={feedValidations}
        focusSection="proxy-health"
      />,
    );

    expect(
      screen.queryByText("Backend local indisponível"),
    ).not.toBeInTheDocument();

    expect(await screen.findByText("Proxies")).toBeInTheDocument();
    expect(screen.getByText("Exportar relatório")).toBeInTheDocument();
  });

  it("shows disabled proxies as neutral in aggregate health", async () => {
    proxyDashboardSnapshot = createProxySnapshot({
      runtime: {
        activeMode: "web-client",
        warningDetails: null,
        backendAvailable: false,
      },
      backend: {
        enabled: false,
        available: false,
      },
      routes: [
        {
          id: "client:CodeTabs",
          name: "CodeTabs",
          transport: "client",
          routeKind: "proxy",
          enabled: false,
          status: "disabled",
          healthScore: 100,
          successRate: null,
          totalRequests: 0,
          successCount: 0,
          failureCount: 0,
          avgResponseTime: 0,
          consecutiveFailures: 6,
          detail: "Desativado. Não entra no cálculo de saúde agregada.",
        },
        {
          id: "client:AllOrigins",
          name: "AllOrigins",
          transport: "client",
          routeKind: "proxy",
          enabled: true,
          status: "idle",
          healthScore: 100,
          successRate: null,
          totalRequests: 0,
          successCount: 0,
          failureCount: 0,
          avgResponseTime: 0,
          consecutiveFailures: 0,
          detail: "Ainda sem uso nesta sessao",
        },
      ],
      summary: {
        totalRoutes: 2,
        healthyRoutes: 2,
        totalRequests: 0,
        totalSuccesses: 0,
        totalFailures: 0,
        successRate: 0,
        fallbackActive: false,
        missingApiKeys: [],
      },
    });

    render(
      <FeedAnalytics
        feeds={[]}
        articles={[]}
        feedValidations={new Map()}
        focusSection="proxy-health"
      />,
    );

    expect(await screen.findByText("Proxies")).toBeInTheDocument();
    expect(screen.getByText("Desativado")).toBeInTheDocument();
    expect(screen.getByText("2/2")).toBeInTheDocument();
  });
});
