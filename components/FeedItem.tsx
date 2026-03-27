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

const CONTROL_CLASS =
  "w-full rounded-[16px] bg-[rgb(var(--theme-manager-control,var(--theme-control-bg,var(--color-surface))))] px-3 py-2.5 text-sm text-[rgb(var(--theme-control-text,var(--theme-text-on-surface,var(--color-text))))] shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] outline-none transition-all focus:bg-[rgb(var(--theme-manager-soft,var(--theme-control-bg,var(--color-surface))))] focus:ring-1 focus:ring-[rgba(var(--color-accent),0.35)]";

const getStatusMeta = (validation?: FeedValidationResult) => {
  if (!validation) {
    return {
      label: "Pendente",
      tone: "bg-[rgba(var(--color-background),0.5)] text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))]",
    };
  }

  if (validation.isValid) {
    return {
      label: "Válido",
      tone: "bg-[rgba(var(--color-success),0.12)] text-[rgb(var(--color-success))]",
    };
  }

  return {
    label: "Atenção",
    tone: "bg-[rgba(var(--color-error),0.12)] text-[rgb(var(--color-error))]",
  };
};

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
  const status = getStatusMeta(validation);
  const title = feed.customTitle || validation?.title || "Feed sem título";
  const hasError = validation && !validation.isValid;

  return (
    <div className="rounded-[20px] bg-[rgb(var(--theme-manager-elevated,var(--theme-surface-elevated,var(--color-surface))))] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] transition-colors hover:bg-[rgb(var(--theme-manager-soft,var(--theme-surface-elevated,var(--color-surface))))]">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_15rem_auto] xl:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="min-w-0 truncate text-sm font-semibold text-[rgb(var(--theme-text-readable))]">
              {title}
            </h4>
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] ${status.tone}`}
            >
              {status.label}
            </span>
            {feed.hideFromAll && (
              <span className="rounded-full bg-[rgba(var(--color-accent),0.12)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--color-accent))] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                Oculto em Todos
              </span>
            )}
          </div>

          <p className="mt-2 truncate font-mono text-xs text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))]">
            {feed.url}
          </p>
        </div>

        <select
          value={feed.categoryId || ""}
          onChange={(e) => onMoveCategory(e.target.value)}
          className={CONTROL_CLASS}
        >
          <option value="">Sem categoria</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        <div className="flex flex-wrap gap-2 xl:justify-end">
          <ActionButton
            onClick={() => onRetry(feed.url)}
            label="Revalidar"
            title="Revalidar"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </ActionButton>
          <ActionButton
            onClick={() => onEdit(feed.url)}
            label="Editar URL"
            title="Editar URL"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2.5 2.5 0 113.536 3.536L11.828 15H9v-2.828l8.586-8.586z"
            />
          </ActionButton>
          {onToggleHideFromAll && (
            <ActionButton
              onClick={() => onToggleHideFromAll(feed.url)}
              label={feed.hideFromAll ? "Mostrar em Todos" : "Ocultar em Todos"}
              title={feed.hideFromAll ? "Mostrar em Todos" : "Ocultar em Todos"}
            >
              {feed.hideFromAll ? (
                <>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                </>
              ) : (
                <>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </>
              )}
            </ActionButton>
          )}
          {hasError && onShowError && (
            <ActionButton
              onClick={() => onShowError(feed.url)}
              label="Detalhes"
              title="Detalhes"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </ActionButton>
          )}
          <ActionButton
            onClick={() => onRemove(feed.url)}
            label="Remover"
            title="Remover"
            destructive
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </ActionButton>
        </div>
      </div>
    </div>
  );
};

const ActionButton: React.FC<{
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  title: string;
  destructive?: boolean;
}> = ({ children, onClick, label, title, destructive = false }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`inline-flex items-center gap-2 rounded-[14px] px-3 py-2 text-xs font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] transition-all hover:-translate-y-0.5 ${
      destructive
        ? "bg-[rgba(var(--color-error),0.12)] text-[rgb(var(--color-error))] hover:bg-[rgba(var(--color-error),0.18)]"
        : "bg-[rgb(var(--theme-manager-control,var(--theme-control-bg,var(--color-surface))))] text-[rgb(var(--theme-manager-text-secondary,var(--theme-text-secondary-readable,var(--color-textSecondary))))] hover:bg-[rgb(var(--theme-manager-soft,var(--theme-control-bg,var(--color-surface))))] hover:text-[rgb(var(--theme-manager-text,var(--theme-text-readable)))]"
    }`}
  >
    <svg
      className="h-3.5 w-3.5 shrink-0"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      {children}
    </svg>
    <span>{label}</span>
  </button>
);
