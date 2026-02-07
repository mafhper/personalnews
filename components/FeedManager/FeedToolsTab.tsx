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
        return 'bg-[rgba(255,255,255,0.025)] border-rose-400/12 hover:border-rose-400/25 text-rose-200/80 hover:bg-[rgba(255,255,255,0.05)]';
      case 'warning':
        return 'bg-[rgba(255,255,255,0.025)] border-amber-300/12 hover:border-amber-300/25 text-amber-200/80 hover:bg-[rgba(255,255,255,0.05)]';
      case 'success':
        return 'bg-[rgba(255,255,255,0.025)] border-emerald-300/12 hover:border-emerald-300/25 text-emerald-200/80 hover:bg-[rgba(255,255,255,0.05)]';
      default:
        return 'bg-[rgba(255,255,255,0.025)] border-white/8 hover:border-white/16 text-slate-200/90 hover:bg-[rgba(255,255,255,0.05)]';
    }
  };

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-start p-5 rounded-xl border transition-all duration-200 group text-left h-full ${getColors()} animate-in fade-in zoom-in-95`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="mb-3 p-2 rounded-lg bg-black/25 group-hover:scale-105 transition-transform duration-200">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-[rgb(var(--color-text))] mb-1">{title}</h3>
      <p className="text-sm text-slate-400/90 leading-relaxed">{description}</p>
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
    <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar h-full">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">

        {/* Header Section */}
        <div className="text-center mb-6 sm:mb-8 animate-in slide-in-from-top-4 duration-500">
          <h2 className="text-xl sm:text-2xl font-bold text-[rgb(var(--color-text))] mb-2">Funções de Gerenciamento</h2>
          <p className="text-sm sm:text-base text-[rgb(var(--color-textSecondary))]">
            Acesse as principais funções para gerenciar seus feeds, fazer backups e manutenção.
          </p>
        </div>

        {/* Quick Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryPill label="Total" value={feedCount} tone="neutral" />
          <SummaryPill label="Válidos" value={validCount} tone="success" />
          <SummaryPill label="Com erro" value={invalidCount} tone="danger" />
          <SummaryPill label="Pendentes" value={pendingCount} tone="warning" />
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">

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
            description="Descubra e importe coleções de feeds selecionadas manualmente por categorias (Tech, Notícias, Dev)."
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
  );
};

const SummaryPill: React.FC<{
  label: string;
  value: number;
  tone: "neutral" | "success" | "warning" | "danger";
}> = ({ label, value, tone }) => {
  const styles = {
    neutral: "from-white/5 to-white/0 text-slate-200/90 border-white/10",
    success: "from-emerald-500/10 to-transparent text-emerald-200/90 border-emerald-400/20",
    warning: "from-amber-500/10 to-transparent text-amber-200/90 border-amber-400/20",
    danger: "from-rose-500/10 to-transparent text-rose-200/90 border-rose-400/20",
  } as const;

  return (
    <div className={`rounded-xl border bg-gradient-to-br ${styles[tone]} px-3 py-2 flex items-center justify-between`}>
      <span className="text-[10px] uppercase tracking-widest font-semibold">
        {label}
      </span>
      <span className="text-lg font-bold">{value}</span>
    </div>
  );
};
