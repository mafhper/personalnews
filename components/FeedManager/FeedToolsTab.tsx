import React from 'react';

interface FeedToolsTabProps {
  onExportOPML: () => void;
  onImportOPML: () => void; // Trigger file input
  onShowImportModal: () => void;
  onResetDefaults: () => void;
  onCleanupErrors: () => void;
  onDeleteAll: () => void;
  feedCount: number;
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
      case 'danger': return 'bg-red-500/10 border-red-500/20 hover:border-red-500/40 text-red-400 hover:bg-red-500/20';
      case 'warning': return 'bg-yellow-500/10 border-yellow-500/20 hover:border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/20';
      case 'success': return 'bg-green-500/10 border-green-500/20 hover:border-green-500/40 text-green-400 hover:bg-green-500/20';
      default: return 'bg-white/5 border-white/10 hover:border-white/20 text-blue-400 hover:bg-white/10';
    }
  };

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-start p-5 rounded-xl border transition-all duration-200 group text-left h-full ${getColors()} animate-in fade-in zoom-in-95`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="mb-3 p-2 rounded-lg bg-black/20 group-hover:scale-110 transition-transform duration-200">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
      <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
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
  feedCount
}) => {
  return (
    <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar h-full">
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
        
        {/* Header Section */}
        <div className="text-center mb-6 sm:mb-8 animate-in slide-in-from-top-4 duration-500">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Ferramentas de Gerenciamento</h2>
          <p className="text-sm sm:text-base text-gray-400">
            Gerencie sua coleção de feeds, faça backups e manutenção do sistema.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          
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

        </div>
      </div>
    </div>
  );
};
