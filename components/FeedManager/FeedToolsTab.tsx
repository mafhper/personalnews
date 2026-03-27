import React from "react";
import {
  Activity,
  AlertCircle,
  Download,
  List,
  RefreshCcw,
  Route,
  RotateCcw,
  Trash2,
  Upload,
  Wrench,
} from "lucide-react";
import { useProxyDashboard } from "../../hooks/useProxyDashboard";

interface FeedToolsTabProps {
  onExportOPML: () => void;
  onImportOPML: () => void;
  onShowImportModal: () => void;
  onResetDefaults: () => void;
  onCleanupErrors: () => void;
  onDeleteAll: () => void;
  onOpenDiagnostics: () => void;
  onShowProxySettings: () => void;
  feedCount: number;
  validCount: number;
  invalidCount: number;
  pendingCount: number;
}

const SURFACE_CLASS =
  "rounded-[24px] bg-[rgb(var(--theme-manager-surface,var(--theme-surface-readable,var(--color-surface))))] p-5 shadow-[0_24px_52px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.025)]";

const CARD_CLASS =
  "rounded-[20px] bg-[rgb(var(--theme-manager-elevated,var(--theme-surface-elevated,var(--color-surface))))] px-4 py-4 shadow-[0_14px_34px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.03)]";

export const FeedToolsTab: React.FC<FeedToolsTabProps> = ({
  onExportOPML,
  onImportOPML,
  onShowImportModal,
  onResetDefaults,
  onCleanupErrors,
  onDeleteAll,
  onOpenDiagnostics,
  onShowProxySettings,
  feedCount,
  validCount,
  invalidCount,
  pendingCount,
}) => {
  const { snapshot } = useProxyDashboard();
  const localRoute = snapshot.routes.find(
    (route) => route.routeKind === "local-backend",
  );
  const proxyStateLabel = snapshot.summary.fallbackActive
    ? "Fallback ativo"
    : snapshot.backend.enabled && snapshot.backend.available
      ? "Backend local ativo"
      : snapshot.backend.enabled
        ? "Backend local indisponível"
        : "Modo web";
  const missingKeys = snapshot.summary.missingApiKeys.length;
  const unhealthyRoutes = Math.max(
    0,
    snapshot.summary.totalRoutes - snapshot.summary.healthyRoutes,
  );

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-4 sm:p-6">
      <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-5">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricTile label="Total" value={feedCount} tone="neutral" />
          <MetricTile label="Válidos" value={validCount} tone="success" />
          <MetricTile label="Com erro" value={invalidCount} tone="danger" />
          <MetricTile label="Pendentes" value={pendingCount} tone="warning" />
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <section className={`${SURFACE_CLASS} space-y-4`}>
            <SectionHeader icon={Download} title="Importar e exportar" />

            <div className="grid gap-3 md:grid-cols-3">
              <ActionCard
                icon={Download}
                title="Exportar OPML"
                meta="Coleção atual"
                onClick={onExportOPML}
              />
              <ActionCard
                icon={Upload}
                title="Importar OPML"
                meta="Arquivo .opml ou .xml"
                onClick={onImportOPML}
              />
              <ActionCard
                icon={List}
                title="Listas"
                meta="Feeds curados"
                onClick={onShowImportModal}
              />
            </div>
          </section>

          <section className={`${SURFACE_CLASS} space-y-4`}>
            <SectionHeader icon={Wrench} title="Manutenção" />

            <div className="grid gap-3 md:grid-cols-3">
              <ActionCard
                icon={RefreshCcw}
                title="Limpar"
                meta={`${invalidCount} com erro`}
                onClick={onCleanupErrors}
              />
              <ActionCard
                icon={RotateCcw}
                title="Restaurar padrões"
                meta={`${feedCount} feeds atuais`}
                onClick={onResetDefaults}
              />
              <ActionCard
                icon={Trash2}
                title="Excluir tudo"
                meta="Ação irreversível"
                onClick={onDeleteAll}
                destructive
              />
            </div>
          </section>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <section className={`${SURFACE_CLASS} space-y-4`}>
            <div className="flex items-center justify-between gap-3">
              <SectionHeader icon={Activity} title="Diagnóstico" accent />
              <div className="flex flex-wrap gap-2">
                <InlineBadge
                  label="Com erro"
                  value={invalidCount}
                  tone="danger"
                />
                <InlineBadge
                  label="Pendentes"
                  value={pendingCount}
                  tone="warning"
                />
              </div>
            </div>

            <div className={`${CARD_CLASS} space-y-4`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-[rgb(var(--theme-text-readable))]">
                    {proxyStateLabel}
                  </div>
                  <div className="mt-1 text-sm text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))]">
                    {unhealthyRoutes > 0
                      ? `${unhealthyRoutes} rotas exigem atenção`
                      : "Sem alerta dominante"}
                  </div>
                </div>
                {snapshot.summary.fallbackActive ? (
                  <AlertCircle className="h-5 w-5 text-[rgb(var(--color-warning))]" />
                ) : (
                  <Activity className="h-5 w-5 text-[rgb(var(--color-accent))]" />
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <MiniDashboardStat
                  label="Feeds com erro"
                  value={invalidCount}
                  tone="danger"
                />
                <MiniDashboardStat
                  label="Pendentes"
                  value={pendingCount}
                  tone="warning"
                />
                <MiniDashboardStat
                  label="Rotas saudáveis"
                  value={`${snapshot.summary.healthyRoutes}/${Math.max(1, snapshot.summary.totalRoutes)}`}
                />
              </div>

              <button
                type="button"
                onClick={onOpenDiagnostics}
                className="group flex w-full items-center justify-between gap-4 rounded-[18px] bg-[rgba(var(--color-accent),0.14)] px-4 py-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-all hover:bg-[rgba(var(--color-accent),0.2)]"
              >
                <div>
                  <div className="text-sm font-semibold text-[rgb(var(--theme-text-readable))]">
                    Abrir diagnóstico
                  </div>
                  <div className="mt-1 text-sm text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))]">
                    Feeds afetados, impacto e relatório
                  </div>
                </div>
                <Activity className="h-5 w-5 text-[rgb(var(--color-accent))] transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </section>

          <section className={`${SURFACE_CLASS} space-y-4`}>
            <div className="flex items-center justify-between gap-3">
              <SectionHeader icon={Route} title="Proxies" />
              <InlineBadge
                label="Chaves"
                value={missingKeys}
                tone={missingKeys > 0 ? "warning" : "neutral"}
              />
            </div>

            <div className={`${CARD_CLASS} space-y-4`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-[rgb(var(--theme-text-readable))]">
                    {localRoute?.status === "healthy"
                      ? "Rota local saudável"
                      : snapshot.summary.fallbackActive
                        ? "Fallback em nuvem ativo"
                        : "Rotas ativas"}
                  </div>
                  <div className="mt-1 text-sm text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))]">
                    {localRoute
                      ? `${localRoute.healthScore}% de saúde no backend local`
                      : "Sem rota local registrada"}
                  </div>
                </div>
                <Route className="h-5 w-5 text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))]" />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <MiniDashboardStat
                  label="Sucesso"
                  value={`${snapshot.summary.successRate}%`}
                />
                <MiniDashboardStat
                  label="Rotas saudáveis"
                  value={`${snapshot.summary.healthyRoutes}/${Math.max(1, snapshot.summary.totalRoutes)}`}
                />
                <MiniDashboardStat
                  label="Último uso local"
                  value={
                    localRoute?.lastUsedAt
                      ? new Intl.DateTimeFormat("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(new Date(localRoute.lastUsedAt))
                      : "—"
                  }
                />
              </div>

              <button
                type="button"
                onClick={onShowProxySettings}
                className="group flex w-full items-center justify-between gap-4 rounded-[18px] bg-[rgb(var(--theme-manager-control,var(--theme-control-bg,var(--color-surface))))] px-4 py-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-all hover:bg-[rgb(var(--theme-manager-soft,var(--theme-control-bg,var(--color-surface))))]"
              >
                <div>
                  <div className="text-sm font-semibold text-[rgb(var(--theme-text-readable))]">
                    Configurar proxies
                  </div>
                  <div className="mt-1 text-sm text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))]">
                    Rotas, chaves e testes reais
                  </div>
                </div>
                <Route className="h-5 w-5 text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))] transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </section>
        </section>
      </div>
    </div>
  );
};

const SectionHeader: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  accent?: boolean;
}> = ({ icon: Icon, title, accent = false }) => (
  <div className="flex items-center gap-3">
    <div className="rounded-[16px] bg-[rgb(var(--theme-manager-control,var(--theme-control-bg,var(--color-surface))))] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
      <Icon
        className={`h-5 w-5 ${
          accent
            ? "text-[rgb(var(--color-accent))]"
            : "text-[rgb(var(--theme-text-readable))]"
        }`}
      />
    </div>
    <h3 className="text-lg font-semibold text-[rgb(var(--theme-text-readable))]">
      {title}
    </h3>
  </div>
);

const MetricTile: React.FC<{
  label: string;
  value: number;
  tone: "neutral" | "success" | "warning" | "danger";
}> = ({ label, value, tone }) => {
  const toneClass =
    tone === "success"
      ? "text-[rgb(var(--color-success))] bg-[rgba(var(--color-success),0.12)]"
      : tone === "warning"
        ? "text-[rgb(var(--color-warning))] bg-[rgba(var(--color-warning),0.12)]"
        : tone === "danger"
          ? "text-[rgb(var(--color-error))] bg-[rgba(var(--color-error),0.12)]"
          : "text-[rgb(var(--theme-manager-text,var(--theme-text-readable)))] bg-[rgb(var(--theme-manager-control,var(--theme-control-bg,var(--color-surface))))]";

  return (
    <div
      className={`rounded-[18px] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] ${toneClass}`}
    >
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-80">
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
};

const ActionCard: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  meta: string;
  onClick: () => void;
  destructive?: boolean;
}> = ({ icon: Icon, title, meta, onClick, destructive = false }) => (
  <button
    type="button"
    onClick={onClick}
    className={`group flex min-h-[112px] flex-col items-start justify-between rounded-[20px] px-4 py-4 text-left shadow-[0_14px_34px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.03)] transition-all hover:-translate-y-0.5 ${
      destructive
        ? "bg-[rgba(var(--color-error),0.1)] hover:bg-[rgba(var(--color-error),0.16)]"
        : "bg-[rgb(var(--theme-manager-elevated,var(--theme-surface-elevated,var(--color-surface))))] hover:bg-[rgb(var(--theme-manager-soft,var(--theme-surface-elevated,var(--color-surface))))]"
    }`}
  >
    <div className="rounded-[14px] bg-[rgb(var(--theme-manager-control,var(--theme-control-bg,var(--color-surface))))] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
      <Icon
        className={`h-4 w-4 ${
          destructive
            ? "text-[rgb(var(--color-error))]"
            : "text-[rgb(var(--theme-text-readable))]"
        }`}
      />
    </div>

    <div>
      <div
        className={`text-sm font-semibold ${
          destructive
            ? "text-[rgb(var(--color-error))]"
            : "text-[rgb(var(--theme-text-readable))]"
        }`}
      >
        {title}
      </div>
      <div className="mt-1 text-sm text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))]">
        {meta}
      </div>
    </div>
  </button>
);

const InlineBadge: React.FC<{
  label: string;
  value: number;
  tone: "neutral" | "warning" | "danger";
}> = ({ label, value, tone }) => (
  <span
    className={`rounded-full px-3 py-1.5 text-xs font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] ${
      tone === "danger"
        ? "bg-[rgba(var(--color-error),0.12)] text-[rgb(var(--color-error))]"
        : tone === "warning"
          ? "bg-[rgba(var(--color-warning),0.12)] text-[rgb(var(--color-warning))]"
          : "bg-[rgb(var(--theme-manager-control,var(--theme-control-bg,var(--color-surface))))] text-[rgb(var(--theme-manager-text-secondary,var(--theme-text-secondary-readable,var(--color-textSecondary))))]"
    }`}
  >
    {label}: {value}
  </span>
);

const MiniDashboardStat: React.FC<{
  label: string;
  value: number | string;
  tone?: "default" | "warning" | "danger";
}> = ({ label, value, tone = "default" }) => (
  <div
    className={`rounded-[18px] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] ${
      tone === "danger"
        ? "bg-[rgba(var(--color-error),0.12)]"
        : tone === "warning"
          ? "bg-[rgba(var(--color-warning),0.12)]"
          : "bg-[rgb(var(--theme-manager-control,var(--theme-control-bg,var(--color-surface))))]"
    }`}
  >
    <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))]">
      {label}
    </div>
    <div className="mt-2 text-base font-semibold text-[rgb(var(--theme-text-readable))]">
      {value}
    </div>
  </div>
);
