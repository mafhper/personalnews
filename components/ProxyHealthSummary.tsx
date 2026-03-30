import React from "react";
import { Activity, AlertCircle, CheckCircle2, Clock3 } from "lucide-react";
import {
  useProxyDashboard,
  type ProxyDashboardRoute,
  type ProxyDashboardSnapshot,
} from "../hooks/useProxyDashboard";

interface ProxyHealthSummaryProps {
  snapshot?: ProxyDashboardSnapshot;
}

const SURFACE_CLASS =
  "rounded-[24px] border border-[rgb(var(--color-border))]/14 bg-[rgb(var(--theme-manager-surface,var(--theme-surface-readable,var(--color-surface))))] p-5 shadow-[0_24px_52px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.025)]";

const statusStyles: Record<
  ProxyDashboardRoute["status"],
  { label: string; tone: string }
> = {
  healthy: {
    label: "Saudável",
    tone: "border-[rgba(var(--color-success),0.22)] bg-[rgba(var(--color-success),0.12)] text-[rgb(var(--color-success))]",
  },
  degraded: {
    label: "Degradado",
    tone: "border-[rgba(var(--color-warning),0.24)] bg-[rgba(var(--color-warning),0.12)] text-[rgb(var(--color-warning))]",
  },
  offline: {
    label: "Indisponível",
    tone: "border-[rgba(var(--color-error),0.22)] bg-[rgba(var(--color-error),0.12)] text-[rgb(var(--color-error))]",
  },
  idle: {
    label: "Sem uso",
    tone: "border-[rgb(var(--color-border))]/18 bg-[rgb(var(--theme-manager-control,var(--theme-control-bg,var(--color-surface))))] text-[rgb(var(--theme-manager-text-secondary,var(--theme-text-secondary-on-surface,var(--color-textSecondary))))]",
  },
};

const formatRelativeDate = (timestamp?: number) => {
  if (!timestamp) return "Nunca usado";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(timestamp));
};

export const ProxyHealthSummary: React.FC<ProxyHealthSummaryProps> = ({
  snapshot,
}) => {
  const dashboard = useProxyDashboard({ enabled: !snapshot });
  const data = snapshot ?? dashboard.snapshot;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className={SURFACE_CLASS}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))]">
                Estado atual
              </p>
              <p className="mt-2 text-lg font-semibold text-[rgb(var(--theme-text-readable))]">
                {data.summary.fallbackActive
                  ? "Fallback em nuvem ativo"
                  : data.backend.enabled && data.backend.available
                    ? "Backend local ativo"
                    : data.backend.enabled
                      ? "Backend local indisponível"
                      : "Modo web"}
              </p>
            </div>
            <Activity className="h-6 w-6 text-[rgb(var(--color-primary))]" />
          </div>
        </div>

        <div className={SURFACE_CLASS}>
          <p className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))]">
            Taxa de sucesso
          </p>
          <p className="mt-2 text-3xl font-bold text-[rgb(var(--theme-text-readable))]">
            {data.summary.successRate}%
          </p>
          <p className="mt-2 text-xs text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))]">
            {data.summary.totalSuccesses}/
            {Math.max(1, data.summary.totalRequests)} respostas bem-sucedidas
          </p>
        </div>

        <div className={SURFACE_CLASS}>
          <p className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))]">
            Rotas saudáveis
          </p>
          <p className="mt-2 text-3xl font-bold text-[rgb(var(--theme-text-readable))]">
            {data.summary.healthyRoutes}/{Math.max(1, data.summary.totalRoutes)}
          </p>
          <p className="mt-2 text-xs text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))]">
            Backend local e proxies em uma única leitura
          </p>
        </div>

        <div className={SURFACE_CLASS}>
          <p className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))]">
            Requisições
          </p>
          <p className="mt-2 text-3xl font-bold text-[rgb(var(--theme-text-readable))]">
            {data.summary.totalRequests}
          </p>
          <p className="mt-2 text-xs text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))]">
            {data.summary.totalFailures} falhas registradas nesta sessão
          </p>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        {data.routes.map((route) => {
          const status = statusStyles[route.status];
          return (
            <div key={route.id} className={SURFACE_CLASS}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-semibold text-[rgb(var(--theme-text-readable))]">
                      {route.name}
                    </h4>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${status.tone}`}
                    >
                      {status.label}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))]">
                    {route.detail}
                  </p>
                </div>
                <div className="rounded-full border border-[rgb(var(--color-border))]/14 bg-[rgb(var(--theme-manager-control,var(--theme-control-bg,var(--color-surface))))] px-3 py-1 text-xs font-semibold text-[rgb(var(--theme-manager-text-secondary,var(--theme-text-secondary-on-surface,var(--color-textSecondary))))]">
                  {route.transport === "desktop-backend" ? "desktop" : "cloud"}
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))]">
                    Saúde
                  </p>
                  <p className="mt-1 text-base font-semibold text-[rgb(var(--theme-text-readable))]">
                    {route.healthScore}%
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))]">
                    Sucesso
                  </p>
                  <p className="mt-1 text-base font-semibold text-[rgb(var(--theme-text-readable))]">
                    {route.successRate === null ? "—" : `${route.successRate}%`}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))]">
                    Latência
                  </p>
                  <p className="mt-1 text-base font-semibold text-[rgb(var(--theme-text-readable))]">
                    {route.avgResponseTime > 0
                      ? `${Math.round(route.avgResponseTime)}ms`
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))]">
                    Último uso
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[rgb(var(--theme-text-readable))]">
                    {formatRelativeDate(route.lastUsedAt)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {data.runtime.lastWarning && (
        <div className="rounded-[22px] border border-[rgba(var(--color-warning),0.24)] bg-[rgba(var(--color-warning),0.12)] p-4 text-sm text-[rgb(var(--theme-manager-text,var(--theme-text-on-surface,var(--color-text))))] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-[rgb(var(--color-warning))]" />
            <div className="space-y-1">
              <p className="font-semibold">Aviso operacional</p>
              <p>
                {data.runtime.warningDetails?.summary ||
                  data.runtime.lastWarning}
              </p>
              <p className="text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))]">
                {data.runtime.warningDetails?.action ||
                  "Abra as configurações de proxy para revisar a rota ativa e a recuperação."}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 text-xs text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))]">
        <span className="inline-flex items-center gap-1">
          <CheckCircle2 className="h-4 w-4" />
          Atualização automática a cada 10s
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock3 className="h-4 w-4" />
          Última leitura:{" "}
          {formatRelativeDate(
            data.runtime.lastCheckedAt || data.backend.checkedAt,
          )}
        </span>
      </div>
    </div>
  );
};

export default ProxyHealthSummary;
