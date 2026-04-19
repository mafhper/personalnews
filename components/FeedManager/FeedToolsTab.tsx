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
  ChevronRight,
  ShieldCheck,
  Cpu
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
}

const SURFACE_CLASS =
  "rounded-[28px] bg-[rgb(var(--theme-manager-surface))] p-6 shadow-[0_24px_52px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.025)]";

const INFO_SURFACE_CLASS =
  "rounded-[28px] border border-[rgb(var(--color-border))]/10 bg-[rgb(var(--theme-manager-bg))] p-6 shadow-[0_12px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.025)]";

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
}) => {
  const { snapshot } = useProxyDashboard();
  const localRoute = snapshot.routes.find(
    (route) => route.routeKind === "local-backend",
  );
  const proxyStateLabel = snapshot.summary.fallbackActive
    ? "Fallback Ativo"
    : snapshot.backend.enabled && snapshot.backend.available
      ? "Backend Local Ativo"
      : "Modo Cloud/Web";

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-4 sm:p-6">
      <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-6">
        
        {/* Status & Diagnostics Overview */}
        <section className={INFO_SURFACE_CLASS}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgb(var(--color-accentSurface))] text-[rgb(var(--color-onAccent))] shadow-sm">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[rgb(var(--theme-text-readable))]">Centro de Operações</h2>
                  <p className="text-sm text-[rgb(var(--theme-text-secondary-readable))] opacity-70">
                    Gerencie a saúde da sua coleção e as configurações de infraestrutura.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <MetricTile label="Feeds" value={feedCount} tone="neutral" />
              <MetricTile label="Válidos" value={validCount} tone="success" />
              <MetricTile label="Erros" value={invalidCount} tone="danger" />
            </div>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <DiagnosticCard 
              title="Saúde da Coleção"
              status={invalidCount > 0 ? "Atenção Necessária" : "Tudo Certo"}
              description={invalidCount > 0 ? `${invalidCount} feeds apresentam problemas de carregamento.` : "Sua coleção está operando normalmente."}
              icon={invalidCount > 0 ? <AlertCircle className="text-red-400" /> : <ShieldCheck className="text-emerald-400" />}
              onAction={onOpenDiagnostics}
              actionLabel="Ver Diagnóstico"
            />
            <DiagnosticCard 
              title="Infraestrutura Proxy"
              status={proxyStateLabel}
              description={snapshot.summary.healthyRoutes > 0 ? `${snapshot.summary.healthyRoutes} rotas saudáveis detectadas.` : "Nenhuma rota configurada ou ativa."}
              icon={<Cpu className="text-blue-400" />}
              onAction={onShowProxySettings}
              actionLabel="Configurar Rotas"
            />
          </div>
        </section>

        {/* Tools Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          
          <ToolSection 
            title="Importar e Exportar" 
            description="Mova sua coleção entre dispositivos ou serviços usando arquivos OPML."
            icon={<Download className="h-5 w-5" />}
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <ActionCard
                title="Exportar"
                meta="Salvar OPML"
                icon={<Download className="h-4 w-4" />}
                onClick={onExportOPML}
              />
              <ActionCard
                title="Importar"
                meta="Arquivo Local"
                icon={<Upload className="h-4 w-4" />}
                onClick={onImportOPML}
              />
              <ActionCard
                title="Curados"
                meta="Sugestões"
                icon={<List className="h-4 w-4" />}
                onClick={onShowImportModal}
              />
            </div>
          </ToolSection>

          <ToolSection 
            title="Manutenção e Limpeza" 
            description="Ações globais para limpar erros ou redefinir sua coleção."
            icon={<Wrench className="h-5 w-5" />}
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <ActionCard
                title="Limpar Erros"
                meta="Apenas Falhas"
                icon={<RefreshCcw className="h-4 w-4" />}
                onClick={onCleanupErrors}
              />
              <ActionCard
                title="Restaurar"
                meta="Padrões Iniciais"
                icon={<RotateCcw className="h-4 w-4" />}
                onClick={onResetDefaults}
              />
              <ActionCard
                title="Excluir Tudo"
                meta="Limpar Coleção"
                icon={<Trash2 className="h-4 w-4" />}
                onClick={onDeleteAll}
                destructive
              />
            </div>
          </ToolSection>

        </div>
      </div>
    </div>
  );
};

const MetricTile: React.FC<{
  label: string;
  value: number;
  tone: "neutral" | "success" | "warning" | "danger";
}> = ({ label, value, tone }) => {
  const toneClass =
    tone === "success"
      ? "text-emerald-400"
      : tone === "warning"
        ? "text-orange-400"
        : tone === "danger"
          ? "text-red-400"
          : "text-[rgb(var(--theme-text-readable))]";

  return (
    <div className="flex min-w-[80px] flex-col items-center justify-center rounded-2xl bg-[rgb(var(--theme-manager-control))] px-4 py-2.5 shadow-sm">
      <span className="text-[10px] font-bold uppercase tracking-wider opacity-50">{label}</span>
      <span className={`text-lg font-bold ${toneClass}`}>{value}</span>
    </div>
  );
};

const ToolSection: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, description, icon, children }) => (
  <section className={SURFACE_CLASS}>
    <div className="mb-6 flex items-start gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[rgb(var(--theme-manager-control))] text-[rgb(var(--theme-text-readable))]">
        {icon}
      </div>
      <div>
        <h3 className="text-base font-bold text-[rgb(var(--theme-text-readable))]">{title}</h3>
        <p className="text-xs text-[rgb(var(--theme-text-secondary-readable))] opacity-60">{description}</p>
      </div>
    </div>
    {children}
  </section>
);

const DiagnosticCard: React.FC<{
  title: string;
  status: string;
  description: string;
  icon: React.ReactNode;
  onAction: () => void;
  actionLabel: string;
}> = ({ title, status, description, icon, onAction, actionLabel }) => (
  <div className="flex flex-col justify-between rounded-2xl bg-[rgb(var(--theme-manager-control))] p-5 transition-transform hover:scale-[1.01]">
    <div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-[rgb(var(--theme-text-secondary-readable))] opacity-60">{title}</span>
        {icon}
      </div>
      <div className="mt-2 text-base font-bold text-[rgb(var(--theme-text-readable))]">{status}</div>
      <p className="mt-1 text-xs text-[rgb(var(--theme-text-secondary-readable))] opacity-60">{description}</p>
    </div>
    <button
      onClick={onAction}
      className="mt-4 flex items-center justify-between rounded-xl bg-[rgb(var(--color-accentSurface))] px-4 py-2.5 text-xs font-bold text-[rgb(var(--color-onAccent))] shadow-sm transition-all hover:brightness-110"
    >
      {actionLabel}
      <ChevronRight className="h-4 w-4" />
    </button>
  </div>
);

const ActionCard: React.FC<{
  title: string;
  meta: string;
  icon: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
}> = ({ title, meta, icon, onClick, destructive }) => (
  <button
    onClick={onClick}
    className={`group flex flex-col items-center justify-center rounded-2xl p-4 text-center transition-all hover:scale-105 active:scale-95 ${
      destructive 
        ? "bg-red-500/10 text-red-400 hover:bg-red-500/20" 
        : "bg-[rgb(var(--theme-manager-control))] text-[rgb(var(--theme-text-readable))] hover:bg-[rgb(var(--theme-manager-soft))]"
    }`}
  >
    <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-full ${destructive ? "bg-red-500/10" : "bg-[rgba(255,255,255,0.05)] opacity-60"}`}>
      {icon}
    </div>
    <div className="text-xs font-bold">{title}</div>
    <div className="mt-0.5 text-[10px] opacity-50">{meta}</div>
  </button>
);
