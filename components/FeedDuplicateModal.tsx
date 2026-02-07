import React from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../hooks/useLanguage';
import { FeedSource } from '../types';

interface FeedDuplicateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReplace: () => void;
  onAddAnyway: () => void;
  existingFeed: FeedSource | null;
  newFeedUrl: string;
  confidence: number;
}

export const FeedDuplicateModal: React.FC<FeedDuplicateModalProps> = ({
  isOpen,
  onClose,
  onReplace,
  onAddAnyway,
  existingFeed,
  newFeedUrl,
  confidence
}) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-white/10 rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-start justify-between bg-black/20">
          <div className="flex gap-4">
            <div className="flex-shrink-0 bg-yellow-500/10 p-3 rounded-xl h-fit">
              <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white leading-tight">
                {t('feeds.duplicate.title') || 'Feed Duplicado Detectado'}
              </h3>
              <p className="text-gray-400 text-sm mt-1">
                {t('feeds.duplicate.message') || 'Este feed parece ser uma duplicata de um existente.'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors p-1"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            
            {/* Desktop Divider Icon */}
            <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-800 rounded-full p-2 border border-white/10 z-10 shadow-lg">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>

            {/* Existing Feed Card */}
            <div className="bg-gray-800/50 rounded-xl p-5 border border-white/5 flex flex-col h-full relative group hover:border-white/10 transition-colors">
              <div className="absolute top-3 right-3 text-xs font-bold text-gray-500 uppercase tracking-wider bg-black/20 px-2 py-1 rounded">
                {t('feeds.duplicate.existing') || 'Existente'}
              </div>
              
              <div className="mt-4 flex-1">
                <h4 className="text-white font-medium text-lg mb-2 line-clamp-2" title={existingFeed?.customTitle || existingFeed?.url}>
                  {existingFeed?.customTitle || 'Sem Título'}
                </h4>
                <div className="bg-black/30 rounded-lg p-3 border border-white/5 break-all">
                  <p className="text-blue-300 text-sm font-mono leading-relaxed">
                    {existingFeed?.url}
                  </p>
                </div>
              </div>
            </div>

            {/* New Feed Card */}
            <div className="bg-[rgb(var(--color-accent))]/5 rounded-xl p-5 border border-[rgb(var(--color-accent))]/20 flex flex-col h-full relative group hover:border-[rgb(var(--color-accent))]/30 transition-colors">
              <div className="absolute top-3 right-3 text-xs font-bold text-[rgb(var(--color-accent))] uppercase tracking-wider bg-[rgb(var(--color-accent))]/10 px-2 py-1 rounded">
                {t('feeds.duplicate.new') || 'Novo'}
              </div>

              <div className="mt-4 flex-1">
                <h4 className="text-gray-300 font-medium text-lg mb-2 italic">
                  (Novo Feed)
                </h4>
                <div className="bg-black/30 rounded-lg p-3 border border-white/5 break-all">
                  <p className="text-[rgb(var(--color-accent))] text-sm font-mono leading-relaxed">
                    {newFeedUrl}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Confidence Indicator */}
          <div className="mt-6 flex items-center justify-center">
             <div className="bg-gray-800/50 rounded-full px-4 py-1.5 border border-white/5 flex items-center gap-2 text-sm">
                <span className="text-gray-400">{t('feeds.duplicate.confidence') || 'Confiança'}:</span>
                <span className={`font-bold ${
                  confidence > 0.9 ? "text-red-400" : confidence > 0.7 ? "text-yellow-400" : "text-green-400"
                }`}>
                  {Math.round(confidence * 100)}%
                </span>
             </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="p-6 border-t border-white/10 bg-black/20 flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors font-medium text-sm"
          >
            {t('feeds.action.cancel_dont_add') || 'Cancelar'}
          </button>
          
          <button
            onClick={onAddAnyway}
            className="px-5 py-2.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-colors font-medium text-sm flex items-center justify-center gap-2"
          >
            <span>{t('feeds.action.add_anyway') || 'Adicionar Mesmo Assim'}</span>
          </button>

          <button
            onClick={onReplace}
            className="px-5 py-2.5 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-white shadow-lg shadow-yellow-600/20 transition-all font-medium text-sm flex items-center justify-center gap-2"
          >
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
             </svg>
            <span>{t('feeds.action.replace') || 'Substituir Existente'}</span>
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};

