import React, { useMemo, useState } from "react";
import { Check, Copy, Download, FileJson, FileText } from "lucide-react";
import { FeedContext } from "../contexts/FeedContextState";
import type { ProxyDashboardSnapshot } from "../hooks/useProxyDashboard";
import type { FeedValidationResult } from "../services/feedValidator";

interface ExportFeedItem {
  title: string;
  url: string;
  status: string;
  route?: string;
  error?: string;
  action?: string;
  lastFetch?: string;
  impact?: string;
}

interface HealthReportExporterProps {
  feeds?: ExportFeedItem[];
  feedValidations?: Map<string, FeedValidationResult>;
  snapshot?: ProxyDashboardSnapshot;
}

const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};

const formatDate = (value?: string) => {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
};

export const HealthReportExporter: React.FC<HealthReportExporterProps> = ({
  feeds: externalFeeds,
  feedValidations,
  snapshot,
}) => {
  const feedContext = React.useContext(FeedContext);
  const [copiedType, setCopiedType] = useState<"markdown" | "json" | null>(
    null,
  );
  const contextFeeds = feedContext?.feeds ?? [];

  const feeds = useMemo<ExportFeedItem[]>(() => {
    if (externalFeeds) return externalFeeds;

    return contextFeeds.map((feed) => {
      const validation = feedValidations?.get(feed.url);
      return {
        title: feed.customTitle || validation?.title || feed.url,
        url: feed.url,
        status: validation?.status || "unchecked",
        route: validation?.route?.routeName,
        error: validation?.diagnostics?.summary || validation?.error,
        action: validation?.diagnostics?.action,
        lastFetch: validation?.lastChecked
          ? new Date(validation.lastChecked).toISOString()
          : undefined,
        impact: validation?.isValid ? "baixo" : "médio",
      };
    });
  }, [contextFeeds, externalFeeds, feedValidations]);

  const summary = useMemo(() => {
    const invalid = feeds.filter((feed) => feed.status !== "valid").length;
    const valid = feeds.filter((feed) => feed.status === "valid").length;
    const topIssues = feeds
      .filter((feed) => feed.status !== "valid")
      .slice(0, 6)
      .map((feed) => ({
        title: feed.title,
        status: feed.status,
        route: feed.route,
        error: feed.error,
        action: feed.action,
      }));

    return {
      generatedAt: new Date().toISOString(),
      valid,
      invalid,
      fallbackActive: snapshot?.summary.fallbackActive ?? false,
      missingApiKeys: snapshot?.summary.missingApiKeys ?? [],
      runtimeMode: snapshot?.runtime.activeMode ?? "unknown",
      backendAvailable: snapshot?.backend.available ?? false,
      proxySummary:
        snapshot?.routes.map((route) => ({
          name: route.name,
          status: route.status,
          transport: route.transport,
          successRate: route.successRate,
          healthScore: route.healthScore,
          totalRequests: route.totalRequests,
          avgResponseTime: route.avgResponseTime,
          detail: route.detail,
        })) ?? [],
      feeds,
      topIssues,
    };
  }, [feeds, snapshot]);

  const markdownReport = useMemo(() => {
    const lines = [
      "# Personal News - Diagnóstico de feeds",
      "",
      `Gerado em: ${formatDate(summary.generatedAt)}`,
      `Modo atual: ${summary.runtimeMode}`,
      `Backend local: ${summary.backendAvailable ? "ativo" : "indisponível ou não aplicável"}`,
      `Fallback em nuvem: ${summary.fallbackActive ? "ativo" : "inativo"}`,
      `Feeds válidos: ${summary.valid}`,
      `Feeds com atenção: ${summary.invalid}`,
      `Chaves ausentes: ${summary.missingApiKeys.length > 0 ? summary.missingApiKeys.join(", ") : "nenhuma"}`,
      "",
      "## Rotas e proxies",
      "",
      ...summary.proxySummary.map(
        (route) =>
          `- ${route.name} [${route.transport}] ${route.status} | saúde ${route.healthScore}% | sucesso ${
            route.successRate === null ? "—" : `${route.successRate}%`
          } | latência ${Math.round(route.avgResponseTime || 0)}ms`,
      ),
      "",
      "## Feeds afetados",
      "",
      ...(summary.topIssues.length > 0
        ? summary.topIssues.map(
            (issue) =>
              `- ${issue.title} | ${issue.status} | rota ${issue.route || "desconhecida"} | ${
                issue.error || "sem detalhe"
              } | ação: ${issue.action || "revisar diagnóstico"}`,
          )
        : ["- Nenhum feed crítico no momento."]),
    ];

    return lines.join("\n");
  }, [summary]);

  const jsonReport = useMemo(() => JSON.stringify(summary, null, 2), [summary]);

  const handleCopy = async (type: "markdown" | "json") => {
    const content = type === "markdown" ? markdownReport : jsonReport;
    await navigator.clipboard.writeText(content);
    setCopiedType(type);
    window.setTimeout(() => setCopiedType(null), 1800);
  };

  return (
    <div className="rounded-[24px] border border-[rgb(var(--color-border))]/18 bg-[linear-gradient(180deg,rgba(var(--theme-surface-readable,var(--color-surface)),0.98),rgba(var(--theme-surface-elevated,var(--color-surface)),0.92))] p-5 shadow-[0_18px_48px_rgba(15,23,42,0.12)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h4 className="text-base font-semibold text-[rgb(var(--theme-text-readable))]">
            Central de exportação
          </h4>
          <p className="mt-1 text-sm text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))]">
            Um único hub para resumo em Markdown, dados brutos em JSON e cópia
            rápida para suporte ou auditoria.
          </p>
        </div>
        <div className="rounded-full border border-[rgb(var(--color-border))]/16 bg-[rgba(var(--color-text),0.05)] px-3 py-1.5 text-xs font-semibold text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))]">
          {feeds.length} feeds no relatório
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        <button
          type="button"
          onClick={() => void handleCopy("markdown")}
          className="inline-flex items-center justify-center gap-2 rounded-[18px] border border-[rgba(var(--color-primary),0.28)] bg-[rgba(var(--color-primary),0.12)] px-4 py-3 text-sm font-semibold text-[rgb(var(--color-primary))] transition-all hover:bg-[rgba(var(--color-primary),0.18)]"
        >
          {copiedType === "markdown" ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          Copiar resumo
        </button>
        <button
          type="button"
          onClick={() =>
            downloadFile(
              markdownReport,
              `personalnews-report-${new Date().toISOString().slice(0, 10)}.md`,
              "text/markdown;charset=utf-8",
            )
          }
          className="inline-flex items-center justify-center gap-2 rounded-[18px] border border-[rgba(var(--color-success),0.28)] bg-[rgba(var(--color-success),0.12)] px-4 py-3 text-sm font-semibold text-[rgb(var(--color-success))] transition-all hover:bg-[rgba(var(--color-success),0.18)]"
        >
          <FileText className="h-4 w-4" />
          Baixar Markdown
        </button>
        <button
          type="button"
          onClick={() =>
            downloadFile(
              jsonReport,
              `personalnews-report-${new Date().toISOString().slice(0, 10)}.json`,
              "application/json;charset=utf-8",
            )
          }
          className="inline-flex items-center justify-center gap-2 rounded-[18px] border border-[rgb(var(--color-border))]/20 bg-[rgba(var(--color-text),0.06)] px-4 py-3 text-sm font-semibold text-[rgb(var(--theme-text-readable))] transition-all hover:bg-[rgba(var(--color-text),0.1)]"
        >
          <FileJson className="h-4 w-4" />
          Baixar JSON bruto
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))]">
        <span className="inline-flex items-center gap-1">
          <Download className="h-4 w-4" />
          Sem exportações duplicadas fora deste bloco
        </span>
        <span>
          Última geração preparada em {formatDate(summary.generatedAt)}
        </span>
      </div>
    </div>
  );
};
