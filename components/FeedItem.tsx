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
  categories: FeedCategory[];
  onMoveCategory: (categoryId: string) => void;
}

export const FeedItem: React.FC<FeedItemProps> = ({
  feed,
  validation,
  onRemove,
  onRetry,
  onEdit,
  categories,
  onMoveCategory,
}) => {
  const getStatusColor = () => {
    if (!validation) return "text-gray-400";
    return validation.isValid ? "text-green-400" : "text-red-400";
  };

  const getStatusIcon = () => {
    if (!validation) return "?";
    return validation.isValid ? "✓" : "✗";
  };

  return (
    <div className="bg-black/20 border border-white/5 rounded-lg p-3 hover:border-white/10 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold ${getStatusColor()}`}>
              {getStatusIcon()}
            </span>
            <h4 className="text-white font-medium truncate">
              {feed.customTitle || validation?.title || "Feed sem título"}
            </h4>
          </div>
          <p className="text-gray-400 text-xs truncate mt-1">
            {feed.url}
          </p>
          {validation?.error && (
            <p className="text-red-400 text-xs mt-1">
              {validation.error}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Category dropdown */}
          <select
            value={feed.categoryId || ""}
            onChange={(e) => onMoveCategory(e.target.value)}
            className="bg-black/30 text-gray-400 text-xs rounded px-2 py-1 border border-white/10 focus:outline-none focus:border-[rgb(var(--color-accent))]"
          >
            <option value="">Sem categoria</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Retry button */}
          <button
            onClick={() => onRetry(feed.url)}
            className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded transition-colors"
            title="Revalidar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* Edit button */}
          <button
            onClick={() => onEdit(feed.url)}
            className="p-1.5 text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10 rounded transition-colors"
            title="Editar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>

          {/* Remove button */}
          <button
            onClick={() => onRemove(feed.url)}
            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
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
