/**
 * FeedItem.tsx
 * 
 * Componente para exibir um item de feed individual
 */

import React from "react";
import type { FeedSource, FeedCategory } from "../types";
import type { FeedValidationResult } from "../services/feedValidator";

interface FeedItemProps {
  feed: FeedSource;
  validation?: FeedValidationResult;
  onRemove: (url: string) => void;
  onRetry: (url: string) => void;
  onEdit: (url: string) => void;
  onShowError?: (url: string) => void;
  onToggleHideFromAll?: (url: string) => void;
  categories: FeedCategory[];
  onMoveCategory: (categoryId: string) => void;
}

export const FeedItem: React.FC<FeedItemProps> = ({
  feed,
  validation,
  onRemove,
  onRetry,
  onEdit,
  onShowError,
  onToggleHideFromAll,
  categories,
  onMoveCategory,
}) => {
  const getStatusColor = () => {
    if (!validation) return "text-slate-400/80";
    return validation.isValid ? "text-emerald-300/80" : "text-rose-300/85";
  };

  const getStatusIcon = () => {
    if (!validation) return "?";
    return validation.isValid ? "✓" : "✗";
  };

  return (
    <div className="bg-white/3 border border-white/6 rounded-xl p-3 hover:border-white/12 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold ${getStatusColor()}`}>
              {getStatusIcon()}
            </span>
            <h4 className="text-[rgb(var(--color-text))] font-medium truncate">
              {feed.customTitle || validation?.title || "Feed sem título"}
            </h4>
          </div>
          <p className="text-slate-400/80 text-xs truncate mt-1">
            {feed.url}
          </p>
          {validation?.error && (
            <div className="mt-1 flex items-center gap-2">
              <p className="text-rose-300/85 text-xs truncate max-w-[200px] sm:max-w-xs">
                {validation.error}
              </p>
              {onShowError && (
                <button
                  onClick={() => onShowError(feed.url)}
                  className="text-[10px] uppercase font-bold text-rose-200/90 hover:text-[rgb(var(--color-text))] bg-rose-500/10 hover:bg-rose-500/20 px-2 py-0.5 rounded transition-colors"
                >
                  Ver Detalhes
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Category dropdown */}
          <select
            value={feed.categoryId || ""}
            onChange={(e) => onMoveCategory(e.target.value)}
            className="bg-black/30 text-slate-300/80 text-xs rounded px-2 py-1 border border-white/10 focus:outline-none focus:border-[rgba(var(--color-accent),0.45)]"
          >
            <option value="">Sem categoria</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Info/Error Button (only if invalid) */}
          {validation && !validation.isValid && onShowError && (
            <button
              onClick={() => onShowError(feed.url)}
            className="p-1.5 text-slate-300/70 hover:text-rose-300 hover:bg-rose-400/10 rounded transition-colors"
            title="Ver Detalhes do Erro"
          >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </button>
          )}

          {/* Retry button */}
          <button
            onClick={() => onRetry(feed.url)}
            className="p-1.5 text-slate-300/70 hover:text-sky-300 hover:bg-sky-400/10 rounded transition-colors"
            title="Revalidar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* Edit button */}
          <button
            onClick={() => onEdit(feed.url)}
            className="p-1.5 text-slate-300/70 hover:text-amber-300 hover:bg-amber-400/10 rounded transition-colors"
            title="Editar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>

          {/* Visibility Toggle */}
          {onToggleHideFromAll && (
            <button
              onClick={() => onToggleHideFromAll(feed.url)}
              className={`p-1.5 rounded transition-colors ${feed.hideFromAll
                  ? "text-violet-300 bg-violet-400/10 hover:bg-violet-400/18"
                  : "text-slate-300/70 hover:text-violet-300 hover:bg-violet-400/10"
                }`}
              title={feed.hideFromAll ? "Mostrar em 'Todos'" : "Esconder de 'Todos'"}
            >
              {feed.hideFromAll ? (
                /* Slashed Eye (Hidden) */
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                /* Eye (Visible) */
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          )}

          {/* Remove button */}
          <button
            onClick={() => onRemove(feed.url)}
            className="p-1.5 text-slate-300/70 hover:text-rose-300 hover:bg-rose-400/10 rounded transition-colors"
            title="Remover"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
