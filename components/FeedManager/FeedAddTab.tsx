import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { FeedCategory } from '../../types';

interface FeedAddTabProps {
  newFeedUrl: string;
  setNewFeedUrl: (url: string) => void;
  newFeedCategory: string;
  setNewFeedCategory: (id: string) => void;
  processingUrl: string | null;
  categories: FeedCategory[];
  onSubmit: (e: React.FormEvent) => void;
  discoveryProgress: Map<string, { status: string; progress: number }>;
}

export const FeedAddTab: React.FC<FeedAddTabProps> = ({
  newFeedUrl,
  setNewFeedUrl,
  newFeedCategory,
  setNewFeedCategory,
  processingUrl,
  categories,
  onSubmit,
  discoveryProgress
}) => {
  const { t } = useLanguage();

  return (
    <div className="p-4 sm:p-6 h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-2xl mx-auto space-y-6 sm:space-y-8">
        
        {/* Header */}
        <div className="text-center animate-in slide-in-from-top-2">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Adicionar Novo Feed</h2>
          <p className="text-sm sm:text-base text-gray-400">
            Insira a URL de um site ou canal para começar a monitorar.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-6 shadow-xl animate-in fade-in zoom-in-95 duration-300">
          <form onSubmit={onSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">URL do Site ou Feed</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={newFeedUrl}
                  onChange={(e) => setNewFeedUrl(e.target.value)}
                  placeholder="https://exemplo.com ou Canal YouTube"
                  disabled={!!processingUrl}
                  className="w-full bg-black/40 text-white pl-10 pr-4 py-3 rounded-lg border border-white/10 focus:outline-none focus:border-[rgb(var(--color-accent))] focus:ring-1 focus:ring-[rgb(var(--color-accent))] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Categoria (Opcional)</label>
              <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <select
                  value={newFeedCategory}
                  onChange={(e) => setNewFeedCategory(e.target.value)}
                  disabled={!!processingUrl}
                  className="w-full bg-black/40 text-white pl-10 pr-4 py-3 rounded-lg border border-white/10 focus:outline-none focus:border-[rgb(var(--color-accent))] focus:ring-1 focus:ring-[rgb(var(--color-accent))] disabled:opacity-50 disabled:cursor-not-allowed appearance-none transition-all"
                >
                  <option value="">{t('feeds.category.none')}</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={!!processingUrl}
              className="mt-2 w-full px-6 py-3 bg-[rgb(var(--color-accent))] hover:bg-[rgb(var(--color-accent))]/90 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium shadow-lg shadow-[rgb(var(--color-accent))]/20"
            >
              {processingUrl ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processando...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>{t('action.add')}</span>
                </>
              )}
            </button>
          </form>

          {/* Discovery Progress Indicator */}
          {processingUrl && (
            <div className="mt-6 bg-black/30 rounded-lg p-4 border border-white/10 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-blue-300 font-medium flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                  {discoveryProgress.get(processingUrl)?.status || t('loading')}
                </span>
                <span className="text-xs text-gray-500">{Math.round(discoveryProgress.get(processingUrl)?.progress || 0)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${discoveryProgress.get(processingUrl)?.progress || 5}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* YouTube Guide Section */}
        <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-5 animate-in slide-in-from-bottom-4 duration-500 delay-100">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 bg-red-500/10 p-2 rounded-lg">
              <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Como adicionar canais do YouTube?</h3>
              <p className="text-gray-400 text-sm mb-3 leading-relaxed">
                Nosso sistema possui descoberta automática. Você pode tentar colar a <strong>URL do canal</strong> diretamente.
              </p>
              
              <div className="space-y-3">
                <div className="bg-black/30 rounded p-2 border border-white/5">
                  <p className="text-xs text-gray-500 mb-1 font-bold uppercase">Opção 1: URL do Canal (Recomendado)</p>
                  <code className="text-xs text-green-400 font-mono break-all">https://www.youtube.com/@CanalExemplo</code>
                </div>
                
                <div className="bg-black/30 rounded p-2 border border-white/5">
                  <p className="text-xs text-gray-500 mb-1 font-bold uppercase">Opção 2: ID do Canal (Infalível)</p>
                  <p className="text-gray-400 text-xs mb-1">Se a URL falhar, use o ID direto:</p>
                  <code className="text-xs text-blue-400 font-mono break-all">UCef5U1dB5a2e2S-XUlnhxSA</code>
                </div>
              </div>

              <p className="text-xs text-gray-500 mt-3 italic">
                Nota: O sistema converte automaticamente para o feed XML correto.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
