import React from 'react';

interface FeedToolsTabProps {
  onExportOPML: () => void;
  onImportOPML: () => void; // Trigger file input
  onShowImportModal: () => void;
  onResetDefaults: () => void;
  onCleanupErrors: () => void;
  onDeleteAll: () => void;
  onShowReports: () => void;
  onShowProxySettings: () => void;
  onShowProxyHealth: () => void;
  onShowFeedStatus: () => void;
  feedCount: number;
  validCount: number;
  invalidCount: number;
  pendingCount: number;
}

interface ToolCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger' | 'warning' | 'success';
  delay?: number;
}

const ToolCard: React.FC<ToolCardProps> = ({ title, description, icon, onClick, variant = 'default', delay = 0 }) => {
  const getColors = () => {
    switch (variant) {
      case 'danger':
        return 'border-[rgba(var(--color-error),0.24)] bg-[linear-gradient(180deg,rgba(var(--color-error),0.12),rgba(var(--theme-surface-readable,var(--color-surface)),0.94))] text-[rgb(var(--color-error))] hover:bg-[linear-gradient(180deg,rgba(var(--color-error),0.16),rgba(var(--theme-surface-readable,var(--color-surface)),0.98))]';
      case 'warning':
        return 'border-[rgba(var(--color-warning),0.24)] bg-[linear-gradient(180deg,rgba(var(--color-warning),0.12),rgba(var(--theme-surface-readable,var(--color-surface)),0.94))] text-[rgb(var(--color-warning))] hover:bg-[linear-gradient(180deg,rgba(var(--color-warning),0.16),rgba(var(--theme-surface-readable,var(--color-surface)),0.98))]';
      case 'success':
        return 'border-[rgba(var(--color-success),0.24)] bg-[linear-gradient(180deg,rgba(var(--color-success),0.12),rgba(var(--theme-surface-readable,var(--color-surface)),0.94))] text-[rgb(var(--color-success))] hover:bg-[linear-gradient(180deg,rgba(var(--color-success),0.16),rgba(var(--theme-surface-readable,var(--color-surface)),0.98))]';
      default:
        return 'border-[rgb(var(--color-border))]/18 bg-[linear-gradient(180deg,rgba(var(--theme-surface-readable,var(--color-surface)),0.98),rgba(var(--theme-surface-elevated,var(--color-surface)),0.92))] text-[rgb(var(--theme-text-on-surface,var(--color-text)))] hover:bg-[linear-gradient(180deg,rgba(var(--theme-surface-readable,var(--color-surface)),1),rgba(var(--theme-surface-elevated,var(--color-surface)),0.98))]';
    }
  };

  return (
    <button
      onClick={onClick}
      className={`group flex h-full flex-col items-start rounded-[24px] border p-5 text-left transition-all duration-200 shadow-[0_18px_48px_rgba(15,23,42,0.12)] hover:translate-y-[-2px] ${getColors()} animate-in fade-in zoom-in-95`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="mb-4 rounded-2xl bg-[rgb(var(--theme-surface-elevated,var(--color-surface)))]/86 p-2.5 transition-transform duration-200 group-hover:scale-105">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-[rgb(var(--theme-text-readable))]">{title}</h3>
      <p className="text-sm leading-relaxed text-[rgba(var(--color-textSecondary),0.9)]">{description}</p>
    </button>
  );
};

export const FeedToolsTab: React.FC<FeedToolsTabProps> = ({
  onExportOPML,
  onImportOPML,
  onShowImportModal,
  onResetDefaults,
  onCleanupErrors,
  onDeleteAll,
  onShowReports,
  onShowProxySettings,
  onShowProxyHealth,
  onShowFeedStatus,
  feedCount,
  validCount,
  invalidCount,
  pendingCount
}) => {
  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 custom-scrollbar">
      <div className="mx-auto max-w-6xl space-y-6 sm:space-y-8">

        <div className="rounded-[28px] border border-[rgb(var(--color-border))]/18 bg-[linear-gradient(180deg,rgba(var(--theme-surface-elevated,var(--color-surface)),0.96),rgba(var(--theme-surface-readable,var(--color-surface)),0.9))] p-5 shadow-[0_24px_72px_rgba(15,23,42,0.12)] animate-in slide-in-from-top-4 duration-500">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[rgb(var(--theme-surface-elevated,var(--color-surface)))]/84 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[rgb(var(--theme-text-secondary-on-surface,var(--color-textSecondary)))]">
                Centro de Operações
              </div>
              <h2 className="mb-2 text-xl font-bold text-[rgb(var(--theme-text-readable))] sm:text-2xl">Funções de gerenciamento e manutenção</h2>
              <p className="text-sm leading-relaxed text-[rgb(var(--color-textSecondary))] sm:text-base">
                Backups, importações, relatórios e rotinas de limpeza ficam concentrados aqui para evitar ruído nas outras abas.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-[rgb(var(--color-border))]/18 bg-[rgb(var(--theme-surface-elevated,var(--color-surface)))]/84 px-3 py-1.5 text-xs font-medium text-[rgb(var(--theme-text-on-surface,var(--color-text)))]">
                {feedCount} feeds
              </span>
              {invalidCount > 0 && (
                <span className="rounded-full border border-[rgba(var(--color-error),0.24)] bg-[rgba(var(--color-error),0.12)] px-3 py-1.5 text-xs font-medium text-[rgb(var(--color-error))]">
                  {invalidCount} com erro
                </span>
              )}
              {pendingCount > 0 && (
                <span className="rounded-full border border-[rgba(var(--color-warning),0.22)] bg-[rgba(var(--color-warning),0.1)] px-3 py-1.5 text-xs font-medium text-[rgb(var(--color-warning))]">
                  {pendingCount} pendentes
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryPill label="Total" value={feedCount} tone="neutral" />
          <SummaryPill label="Válidos" value={validCount} tone="success" />
          <SummaryPill label="Com erro" value={invalidCount} tone="danger" />
          <SummaryPill label="Pendentes" value={pendingCount} tone="warning" />
        </div>

        <div className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-[rgb(var(--theme-text-readable))]">Ações disponíveis</h3>
              <p className="mt-1 text-sm text-[rgb(var(--theme-text-secondary-readable))]">
                Escolha a operação que deseja executar. Os blocos abaixo priorizam leitura e consequência.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 sm:gap-4">

          <ToolCard
            title="Exportar Feeds (OPML)"
            description="Baixe um arquivo .opml com todos os seus feeds para backup ou para usar em outros leitores de RSS."
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            }
            onClick={onExportOPML}
            delay={0}
          />

          <ToolCard
            title="Importar OPML"
            description="Adicione múltiplos feeds de uma vez carregando um arquivo .opml do seu computador."
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            }
            onClick={onImportOPML}
            variant="default"
            delay={50}
          />

          <ToolCard
            title="Listas Curadas"
            description="Compare coleções prontas, revise os sites incluídos em cada categoria e escolha como importar."
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            }
            onClick={onShowImportModal}
            variant="success"
            delay={100}
          />

          <ToolCard
            title="Limpeza Inteligente"
            description="Analisa e remove feeds que estão apresentando erros de conexão ou validação consistentemente."
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
            onClick={onCleanupErrors}
            variant="warning"
            delay={150}
          />

          <ToolCard
            title="Restaurar Padrões"
            description="Substitui sua coleção atual pelos feeds iniciais recomendados. Atenção: remove personalizações."
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            }
            onClick={onResetDefaults}
            variant="warning"
            delay={200}
          />

          <ToolCard
            title="Excluir Tudo"
            description={`Remove permanentemente todos os ${feedCount} feeds monitorados. Esta ação não pode ser desfeita.`}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            }
            onClick={onDeleteAll}
            variant="danger"
            delay={250}
          />

          <ToolCard
            title="Relatórios de Feeds"
            description="Visualize uso, erros e exporte relatórios resumidos dos seus feeds monitorados."
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3v18M4 7h16M4 12h16M4 17h16" />
              </svg>
            }
            onClick={onShowReports}
            variant="default"
            delay={300}
          />

          <ToolCard
            title="API Keys de Proxy"
            description="Configure e gerencie chaves de API para servidores proxy e alternativas de fetch."
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7h4a2 2 0 012 2v10a2 2 0 01-2 2h-4m0 0H7a2 2 0 01-2-2V9a2 2 0 012-2h4m0 0V5a2 2 0 012-2h2a2 2 0 012 2v2" />
              </svg>
            }
            onClick={onShowProxySettings}
            variant="default"
            delay={350}
          />

          <ToolCard
            title="Saúde dos Proxys"
            description="Monitore status, latência e taxa de sucesso dos servidores proxy configurados."
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
            onClick={onShowProxyHealth}
            variant="success"
            delay={400}
          />

          <ToolCard
            title="Status dos Feeds"
            description="Visualize estado atual, erros de validação e histórico de sincronização dos feeds."
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
            onClick={onShowFeedStatus}
            variant="warning"
            delay={450}
          />

          </div>
        </div>
      </div>
    </div>
  );
};

const SummaryPill: React.FC<{
  label: string;
  value: number;
  tone: "neutral" | "success" | "warning" | "danger";
}> = ({ label, value, tone }) => {
  const styles = {
    neutral: "from-[rgba(var(--color-text),0.05)] to-[rgba(var(--theme-surface-readable,var(--color-surface)),0.92)] text-[rgb(var(--theme-text-on-surface,var(--color-text)))] border-[rgb(var(--color-border))]/18",
    success: "from-[rgba(var(--color-success),0.08)] to-transparent text-[rgb(var(--color-success))] border-[rgba(var(--color-success),0.15)]",
    warning: "from-[rgba(var(--color-warning),0.08)] to-transparent text-[rgb(var(--color-warning))] border-[rgba(var(--color-warning),0.15)]",
    danger: "from-[rgba(var(--color-error),0.08)] to-transparent text-[rgb(var(--color-error))] border-[rgba(var(--color-error),0.15)]",
  } as const;

  return (
    <div className={`flex items-center justify-between rounded-[18px] border bg-gradient-to-br px-4 py-3 shadow-[0_12px_30px_rgba(15,23,42,0.1)] transition-all hover:scale-[1.02] ${styles[tone]}`}>
      <span className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-80">
        {label}
      </span>
      <span className="text-xl font-bold">{value}</span>
    </div>
  );
};
