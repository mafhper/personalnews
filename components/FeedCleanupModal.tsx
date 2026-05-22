import React, { useState, useEffect } from 'react';
import { FeedSource } from '../types';
import { useNotificationReplacements } from '../hooks/useNotificationReplacements';
import { Modal } from './Modal';

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="3xl"
      title="Limpeza de feeds"
      description="Revise e remova feeds que apresentam erros recorrentes."
      tone="danger"
      zIndexClass="z-[9999]"
      closeOnOverlay={selectedUrls.size === 0}
      bodyClassName="p-0"
      footer={
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))] transition-colors hover:bg-[rgb(var(--theme-manager-control,var(--color-surfaceElevated)))] hover:text-[rgb(var(--theme-manager-text,var(--color-text)))]"
            type="button"
          >
            Cancelar
          </button>
          <button
            onClick={() => void handleDelete()}
            disabled={selectedUrls.size === 0}
            className="rounded-lg bg-[rgb(var(--color-error))] px-4 py-2 text-sm font-medium text-white shadow-lg shadow-red-900/20 transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
          >
            Excluir {selectedUrls.size > 0 ? `(${selectedUrls.size})` : ''}
          </button>
        </div>
      }
    >
        <div className="p-4 bg-[rgb(var(--theme-manager-control,var(--color-surfaceElevated)))] border-b border-[rgba(var(--color-border),0.12)] flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))] mb-1">Mínimo de falhas</label>
            <input
              type="number"
              min="1"
              value={minFailures}
              onChange={(e) => setMinFailures(parseInt(e.target.value) || 1)}
              className="bg-black/20 border border-[rgba(var(--color-border),0.14)] rounded-lg px-3 py-2 text-[rgb(var(--theme-manager-text,var(--color-text)))] w-24 focus:outline-none focus:border-[rgb(var(--color-error))]"
            />
          </div>

          <div>
            <label className="block text-xs text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))] mb-1">Tipo de erro</label>
            <select
              value={errorTypeFilter}
              onChange={(e) => setErrorTypeFilter(e.target.value)}
              className="bg-black/20 border border-[rgba(var(--color-border),0.14)] rounded-lg px-3 py-2 text-[rgb(var(--theme-manager-text,var(--color-text)))] w-40 focus:outline-none focus:border-[rgb(var(--color-error))]"
            >
              <option value="all">Todos</option>
              <option value="timeout">Timeout</option>
              <option value="network">Rede (Network)</option>
              <option value="parse">Parse (Formato)</option>
              <option value="cors">CORS</option>
              <option value="unknown">Desconhecido</option>
            </select>
          </div>

          <div className="flex-1 text-right text-xs text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))] pb-2">
            Encontrados: <span className="text-[rgb(var(--theme-manager-text,var(--color-text)))] font-medium">{filteredItems.length}</span>
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto p-4 space-y-2 min-h-[260px] max-h-[50vh]">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))] py-10">
              <svg className="w-12 h-12 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p>Nenhum feed corresponde aos critérios.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2 px-2">
                 <label className="flex items-center gap-2 text-sm text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))] cursor-pointer">
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
                  <div key={item.url} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${selectedUrls.has(item.url) ? 'bg-red-500/10 border-red-500/30' : 'bg-black/20 border-[rgba(var(--color-border),0.1)] hover:border-[rgba(var(--color-border),0.18)]'}`}>
                    <input
                      type="checkbox"
                      checked={selectedUrls.has(item.url)}
                      onChange={() => handleToggleFeed(item.url)}
                       className="rounded border-gray-600 bg-gray-800 text-red-500 focus:ring-red-500"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-[rgb(var(--theme-manager-text,var(--color-text)))] truncate">
                        {feed?.customTitle || new URL(item.url).hostname}
                      </h4>
                      <p className="text-xs text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))] truncate" title={item.url}>{item.url}</p>
                    </div>
                    <div className="text-right">
                       <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                          {item.failures} falhas
                       </span>
                       <div className="text-[10px] text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))] mt-1 uppercase">
                          {item.lastErrorType}
                       </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
    </Modal>
  );
};
