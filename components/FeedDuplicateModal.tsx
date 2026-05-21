import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { FeedSource } from '../types';
import { Modal } from './Modal';
import { buildReplaceDuplicateFeedConfirmation } from '../utils/feedDangerConfirmation';

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
  const replacementConfirmation = existingFeed
    ? buildReplaceDuplicateFeedConfirmation({ existingFeed, newFeedUrl })
    : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      title={t('feeds.duplicate.title') || 'Feed Duplicado Detectado'}
      description={t('feeds.duplicate.message') || 'Este feed parece ser uma duplicata de um existente.'}
      tone="warning"
      zIndexClass="z-[9999]"
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            onClick={onClose}
            className="rounded-lg px-5 py-2.5 text-sm font-medium text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))] transition-colors hover:bg-[rgb(var(--theme-manager-control,var(--color-surfaceElevated)))] hover:text-[rgb(var(--theme-manager-text,var(--color-text)))]"
            type="button"
          >
            {t('feeds.action.cancel_dont_add') || replacementConfirmation?.cancelText || 'Cancelar'}
          </button>
          <button
            onClick={onAddAnyway}
            className="rounded-lg border border-[rgba(var(--color-border),0.18)] bg-[rgb(var(--theme-manager-control,var(--color-surfaceElevated)))] px-5 py-2.5 text-sm font-medium text-[rgb(var(--theme-manager-text,var(--color-text)))] transition-colors hover:bg-[rgb(var(--theme-manager-soft,var(--color-surfaceElevated)))]"
            type="button"
          >
            {t('feeds.action.add_anyway') || 'Adicionar Mesmo Assim'}
          </button>
          <button
            onClick={onReplace}
            className="rounded-lg bg-[rgb(var(--color-warning))] px-5 py-2.5 text-sm font-bold text-black shadow-lg transition-all hover:brightness-110"
            type="button"
          >
            {t('feeds.action.replace') || replacementConfirmation?.confirmText || 'Substituir Existente'}
          </button>
        </div>
      }
    >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">

            {/* Desktop Divider Icon */}
            <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[rgb(var(--theme-manager-control,var(--color-surfaceElevated)))] rounded-full p-2 border border-[rgba(var(--color-border),0.16)] z-10 shadow-lg">
              <svg className="w-5 h-5 text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>

            {/* Existing Feed Card */}
            <div className="bg-[rgb(var(--theme-manager-control,var(--color-surfaceElevated)))] rounded-xl p-5 border border-[rgba(var(--color-border),0.12)] flex flex-col h-full relative group hover:border-[rgba(var(--color-border),0.2)] transition-colors">
              <div className="absolute top-3 right-3 text-xs font-bold text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))] uppercase tracking-wider bg-black/10 px-2 py-1 rounded">
                {t('feeds.duplicate.existing') || 'Existente'}
              </div>

              <div className="mt-4 flex-1">
                <h4 className="text-[rgb(var(--theme-manager-text,var(--color-text)))] font-medium text-lg mb-2 line-clamp-2" title={existingFeed?.customTitle || existingFeed?.url}>
                  {existingFeed?.customTitle || 'Sem Título'}
                </h4>
                <div className="bg-black/20 rounded-lg p-3 border border-[rgba(var(--color-border),0.1)] break-all">
                  <p className="text-[rgb(var(--color-accent))] text-sm font-mono leading-relaxed">
                    {existingFeed?.url}
                  </p>
                </div>
              </div>
            </div>

            {/* New Feed Card */}
            <div className="bg-[rgba(var(--color-accent),0.08)] rounded-xl p-5 border border-[rgba(var(--color-accent),0.22)] flex flex-col h-full relative group hover:border-[rgba(var(--color-accent),0.32)] transition-colors">
              <div className="absolute top-3 right-3 text-xs font-bold text-[rgb(var(--color-accent))] uppercase tracking-wider bg-[rgb(var(--color-accent))]/10 px-2 py-1 rounded">
                {t('feeds.duplicate.new') || 'Novo'}
              </div>

              <div className="mt-4 flex-1">
                <h4 className="text-[rgb(var(--theme-manager-text,var(--color-text)))] font-medium text-lg mb-2 italic">
                  (Novo Feed)
                </h4>
                <div className="bg-black/20 rounded-lg p-3 border border-[rgba(var(--color-border),0.1)] break-all">
                  <p className="text-[rgb(var(--color-accent))] text-sm font-mono leading-relaxed">
                    {newFeedUrl}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Confidence Indicator */}
          <div className="mt-6 flex items-center justify-center">
             <div className="bg-[rgb(var(--theme-manager-control,var(--color-surfaceElevated)))] rounded-full px-4 py-1.5 border border-[rgba(var(--color-border),0.12)] flex items-center gap-2 text-sm">
                <span className="text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))]">{t('feeds.duplicate.confidence') || 'Confiança'}:</span>
                <span className={`font-bold ${
                  confidence > 0.9 ? "text-red-400" : confidence > 0.7 ? "text-yellow-400" : "text-green-400"
                }`}>
                  {Math.round(confidence * 100)}%
                </span>
             </div>
          </div>

          {replacementConfirmation && (
            <div className="mt-5 rounded-xl border border-[rgba(var(--color-warning),0.22)] bg-[rgba(var(--color-warning),0.08)] p-4">
              <p className="text-sm font-semibold text-[rgb(var(--theme-manager-text,var(--color-text)))]">
                {replacementConfirmation.impact}
              </p>
              <ul className="mt-3 space-y-1">
                {replacementConfirmation.details?.map((detail) => (
                  <li
                    className="break-words text-xs font-mono text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))]"
                    key={detail}
                  >
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          )}
    </Modal>
  );
};
