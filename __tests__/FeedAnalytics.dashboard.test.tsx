import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FeedAnalytics } from "../components/FeedAnalytics";
import type { Article, FeedSource } from "../types";
import type { FeedValidationResult } from "../services/feedValidator";

vi.mock("../hooks/useProxyDashboard", () => ({
  useProxyDashboard: () => ({
    snapshot: {
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
    },
    refresh: vi.fn(),
  }),
}));

describe("FeedAnalytics dashboard", () => {
  it("renders the diagnosis-first dashboard and keeps a single export hub", () => {
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

    render(
      <FeedAnalytics
        feeds={feeds}
        articles={articles}
        feedValidations={feedValidations}
      />,
    );

    expect(screen.getByText("Dashboard de diagnóstico")).toBeInTheDocument();
    expect(screen.getByText("Central de exportação")).toBeInTheDocument();
    expect(screen.queryByText("Exportar JSON")).not.toBeInTheDocument();
    expect(screen.queryByText("Exportar Markdown")).not.toBeInTheDocument();
    expect(screen.getByText("Backend local indisponível")).toBeInTheDocument();
  });
});
