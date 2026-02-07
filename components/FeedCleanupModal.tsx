import React, { useState, useEffect } from 'react';
import { FeedSource } from '../types';
import { useNotificationReplacements } from '../hooks/useNotificationReplacements';

interface FeedErrorHistoryItem {
  url: string;
  failures: number;
  lastError: number;
  lastErrorType: string;
}

interface FeedCleanupModalProps {
  isOpen: boolean;
  onClose: () => void;
  feeds: FeedSource[];
  onRemoveFeeds: (urls: string[]) => void;
}

export const FeedCleanupModal: React.FC<FeedCleanupModalProps> = ({
  isOpen,
  onClose,
  feeds,
  onRemoveFeeds,
}) => {
  const [errorHistory, setErrorHistory] = useState<FeedErrorHistoryItem[]>([]);
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  
  // Filters
  const [minFailures, setMinFailures] = useState<number>(1);
  const [errorTypeFilter, setErrorTypeFilter] = useState<string>('all');

  const { confirmDanger, alertSuccess } = useNotificationReplacements();

  const loadErrorHistory = React.useCallback(() => {
    try {
      const stored = localStorage.getItem('feed-error-history');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Ensure compatibility with the new format (array of objects)
        const history: FeedErrorHistoryItem[] = Array.isArray(parsed) 
          ? parsed.map((item: Record<string, unknown>) => ({
              url: item.url as string,
              failures: (item.failures as number) || 1, // Fallback for old format
              lastError: item.lastError as number,
              lastErrorType: (item.lastErrorType as string) || 'unknown'
            }))
          : [];
        setErrorHistory(history);
      }
    } catch (e) {
      console.error("Failed to load feed error history", e);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Use requestAnimationFrame to avoid "synchronous setState" error during render/mount
      const handle = requestAnimationFrame(() => loadErrorHistory());
      return () => cancelAnimationFrame(handle);
    }
  }, [isOpen, loadErrorHistory]);

  const getFilteredFeeds = () => {
    return errorHistory.filter(item => {
      // Must verify the feed actually exists in current list
      const feedExists = feeds.some(f => f.url === item.url);
      if (!feedExists) return false;

      // Filter by failure count
      if (item.failures < minFailures) return false;

      // Filter by error type
      if (errorTypeFilter !== 'all' && item.lastErrorType !== errorTypeFilter) return false;

      return true;
    });
  };

  const filteredItems = getFilteredFeeds();

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allUrls = filteredItems.map(item => item.url);
      setSelectedUrls(new Set(allUrls));
    } else {
      setSelectedUrls(new Set());
    }
  };

  const handleToggleFeed = (url: string) => {
    const newSet = new Set(selectedUrls);
    if (newSet.has(url)) {
      newSet.delete(url);
    } else {
      newSet.add(url);
    }
    setSelectedUrls(newSet);
  };

  const handleDelete = async () => {
    if (selectedUrls.size === 0) return;

    const confirmed = await confirmDanger(
      `Tem certeza que deseja remover ${selectedUrls.size} feeds selecionados? Esta ação não pode ser desfeita.`
    );

    if (confirmed) {
      onRemoveFeeds(Array.from(selectedUrls));
      
      // Clean up local storage for removed feeds
      const remainingHistory = errorHistory.filter(item => !selectedUrls.has(item.url));
      localStorage.setItem('feed-error-history', JSON.stringify(remainingHistory));
      
      alertSuccess(`${selectedUrls.size} feeds removidos com sucesso.`);
      loadErrorHistory(); // Reload
      setSelectedUrls(new Set());
      onClose(); // Optional: close modal or stay open? Let's close for now or let user see empty list. 
      // Actually, staying open to see result is better UX if they want to verify. But usually modal closes on success action.
      // Let's close it.
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-red-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </span>
              Limpeza de Feeds
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Remova feeds que estão apresentando erros recorrentes.
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 bg-white/5 border-b border-white/10 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Mínimo de Falhas</label>
            <input 
              type="number" 
              min="1" 
              value={minFailures}
              onChange={(e) => setMinFailures(parseInt(e.target.value) || 1)}
              className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white w-24 focus:outline-none focus:border-red-500"
            />
          </div>
          
          <div>
            <label className="block text-xs text-gray-400 mb-1">Tipo de Erro</label>
            <select 
              value={errorTypeFilter}
              onChange={(e) => setErrorTypeFilter(e.target.value)}
              className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white w-40 focus:outline-none focus:border-red-500"
            >
              <option value="all">Todos</option>
              <option value="timeout">Timeout</option>
              <option value="network">Rede (Network)</option>
              <option value="parse">Parse (Formato)</option>
              <option value="cors">CORS</option>
              <option value="unknown">Desconhecido</option>
            </select>
          </div>

          <div className="flex-1 text-right text-xs text-gray-500 pb-2">
            Encontrados: <span className="text-white font-medium">{filteredItems.length}</span>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-[200px]">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 py-10">
              <svg className="w-12 h-12 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p>Nenhum feed corresponde aos critérios.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2 px-2">
                 <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={filteredItems.length > 0 && selectedUrls.size === filteredItems.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-600 bg-gray-800 text-red-500 focus:ring-red-500"
                    />
                    Selecionar Todos
                 </label>
              </div>

              {filteredItems.map(item => {
                const feed = feeds.find(f => f.url === item.url);
                return (
                  <div key={item.url} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${selectedUrls.has(item.url) ? 'bg-red-500/10 border-red-500/30' : 'bg-black/20 border-white/5 hover:border-white/10'}`}>
                    <input 
                      type="checkbox"
                      checked={selectedUrls.has(item.url)}
                      onChange={() => handleToggleFeed(item.url)}
                       className="rounded border-gray-600 bg-gray-800 text-red-500 focus:ring-red-500"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-white truncate">
                        {feed?.customTitle || new URL(item.url).hostname}
                      </h4>
                      <p className="text-xs text-gray-500 truncate" title={item.url}>{item.url}</p>
                    </div>
                    <div className="text-right">
                       <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                          {item.failures} falhas
                       </span>
                       <div className="text-[10px] text-gray-500 mt-1 uppercase">
                          {item.lastErrorType}
                       </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-black/20 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleDelete}
            disabled={selectedUrls.size === 0}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-900/20"
          >
            Excluir {selectedUrls.size > 0 ? `(${selectedUrls.size})` : ''}
          </button>
        </div>

      </div>
    </div>
  );
};
