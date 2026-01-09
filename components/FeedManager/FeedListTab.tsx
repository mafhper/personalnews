import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { FeedItem } from '../FeedItem';
import type { FeedSource, FeedCategory } from '../../types';
import type { FeedValidationResult } from '../../services/feedValidator';

interface FeedListTabProps {
  feeds: FeedSource[];
  validations: Map<string, FeedValidationResult>;
  categories: FeedCategory[];
  onRemove: (url: string) => void;
  onRetry: (url: string) => void;
  onEdit: (url: string) => void;
  onShowError: (url: string, validation?: FeedValidationResult) => void;
  onMoveCategory: (feedUrl: string, categoryId: string) => void;
  onRefreshAll?: () => void;
}

export const FeedListTab: React.FC<FeedListTabProps> = ({
  feeds,
  validations,
  categories,
  onRemove,
  onRetry,
  onEdit,
  onShowError,
  onMoveCategory,
  onRefreshAll
}) => {
  const { t } = useLanguage();
  
  // Local state for filtering and display
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedSection, setExpandedSection] = useState<'valid' | 'issues' | 'unchecked' | null>('issues');

  const toggleSection = (section: 'valid' | 'issues' | 'unchecked') => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Filter Logic
  const filteredFeeds = feeds.filter((feed) => {
    const validation = validations.get(feed.url);

    // Search filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      feed.url.toLowerCase().includes(searchLower) ||
      (validation?.title && validation.title.toLowerCase().includes(searchLower)) ||
      (validation?.description && validation.description.toLowerCase().includes(searchLower)) ||
      (feed.customTitle && feed.customTitle.toLowerCase().includes(searchLower));

    // Status filter
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "valid" && validation?.status === "valid") ||
      (statusFilter === "invalid" && validation?.status && validation.status !== "valid") ||
      (statusFilter === "unchecked" && !validation);

    return matchesSearch && matchesStatus;
  });

  // Grouping
  const validFeeds = filteredFeeds.filter(f => {
    const val = validations.get(f.url);
    return !val || val.isValid;
  });
  const issueFeeds = filteredFeeds.filter(f => {
    const val = validations.get(f.url);
    return val && !val.isValid;
  });
  const uncheckedFeeds = filteredFeeds.filter(f => !validations.has(f.url));

  return (
    <div className="flex flex-col h-full">
      {/* Search and Filter Bar */}
      <div className="p-3 sm:p-4 bg-white/5 border-b border-white/5 flex flex-col sm:flex-row gap-3 sm:gap-4 animate-in fade-in shrink-0">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder={t('search.placeholder') || "Buscar..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/20 text-white pl-10 pr-4 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-[rgb(var(--color-accent))]"
          />
        </div>
        <div className="flex gap-2">
            <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 sm:flex-none bg-black/20 text-white px-4 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-[rgb(var(--color-accent))]"
            >
            <option value="all">Todos</option>
            <option value="valid">{t('analytics.valid')}</option>
            <option value="invalid">{t('analytics.issues')}</option>
            <option value="unchecked">{t('analytics.pending')}</option>
            </select>

            {onRefreshAll && (
            <button
                onClick={() => {
                if (window.confirm('Deseja forçar a revalidação de todos os feeds? Isso pode levar alguns instantes.')) {
                    onRefreshAll();
                }
                }}
                className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 p-2 rounded-lg border border-blue-500/20 transition-colors"
                title="Forçar Revalidação"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
            </button>
            )}
        </div>
      </div>

      {/* Lists */}
      <div className="flex-1 overflow-y-auto pr-1 sm:pr-2 custom-scrollbar p-3 sm:p-4 space-y-3" role="list">
        
        {/* Empty State */}
        {filteredFeeds.length === 0 && (
           <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p>Nenhum feed encontrado com os filtros atuais.</p>
           </div>
        )}

        {/* Issues Section */}
        {issueFeeds.length > 0 && (
          <div className="border border-red-500/20 rounded-lg overflow-hidden animate-in fade-in slide-in-from-left-2">
            <button
              onClick={() => toggleSection('issues')}
              className="w-full flex items-center justify-between p-4 bg-red-500/10 hover:bg-red-500/20 transition-colors"
            >
              <div className="flex items-center space-x-2 text-red-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="font-medium">{t('analytics.attention')} ({issueFeeds.length})</span>
              </div>
              <svg className={`w-5 h-5 text-red-400 transform transition-transform ${expandedSection === 'issues' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {expandedSection === 'issues' && (
              <div className="p-4 bg-black/20 space-y-2">
                {issueFeeds.map((feed) => (
                  <FeedItem
                    key={feed.url}
                    feed={feed}
                    validation={validations.get(feed.url)}
                    onRemove={onRemove}
                    onRetry={onRetry}
                    onEdit={onEdit}
                    onShowError={(url) => onShowError(url, validations.get(url))}
                    categories={categories}
                    onMoveCategory={(catId: string) => onMoveCategory(feed.url, catId)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Valid Section */}
        {validFeeds.length > 0 && (
          <div className="border border-green-500/20 rounded-lg overflow-hidden animate-in fade-in slide-in-from-left-2 delay-75">
            <button
              onClick={() => toggleSection('valid')}
              className="w-full flex items-center justify-between p-4 bg-green-500/10 hover:bg-green-500/20 transition-colors"
            >
              <div className="flex items-center space-x-2 text-green-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">{t('analytics.valid')} ({validFeeds.length})</span>
              </div>
              <svg className={`w-5 h-5 text-green-400 transform transition-transform ${expandedSection === 'valid' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {expandedSection === 'valid' && (
              <div className="p-4 bg-black/20 space-y-2">
                {validFeeds.map((feed) => (
                  <FeedItem
                    key={feed.url}
                    feed={feed}
                    validation={validations.get(feed.url)}
                    onRemove={onRemove}
                    onRetry={onRetry}
                    onEdit={onEdit}
                    onShowError={(url) => onShowError(url, validations.get(url))}
                    categories={categories}
                    onMoveCategory={(catId: string) => onMoveCategory(feed.url, catId)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Unchecked Section */}
        {uncheckedFeeds.length > 0 && (
          <div className="border border-gray-500/20 rounded-lg overflow-hidden animate-in fade-in slide-in-from-left-2 delay-100">
            <button
              onClick={() => toggleSection('unchecked')}
              className="w-full flex items-center justify-between p-4 bg-gray-500/10 hover:bg-gray-500/20 transition-colors"
            >
              <div className="flex items-center space-x-2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">{t('analytics.pending')} ({uncheckedFeeds.length})</span>
              </div>
              <svg className={`w-5 h-5 text-gray-400 transform transition-transform ${expandedSection === 'unchecked' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {expandedSection === 'unchecked' && (
              <div className="p-4 bg-black/20 space-y-2">
                {uncheckedFeeds.map((feed) => (
                  <FeedItem
                    key={feed.url}
                    feed={feed}
                    validation={validations.get(feed.url)}
                    onRemove={onRemove}
                    onRetry={onRetry}
                    onEdit={onEdit}
                    onShowError={(url) => onShowError(url, validations.get(url))}
                    categories={categories}
                    onMoveCategory={(catId: string) => onMoveCategory(feed.url, catId)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
