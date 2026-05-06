import React, { useState } from "react";
import {
  MoreVertical,
  RefreshCw,
  Edit2,
  Type,
  Eye,
  EyeOff,
  Info,
  Trash2,
} from "lucide-react";
import type { FeedSource, FeedCategory } from "../types";
import type { FeedValidationResult } from "../services/feedValidator";
import { getFeedDisplayName } from "../utils/feedDisplay";

interface FeedItemProps {
  feed: FeedSource;
  validation?: FeedValidationResult;
  onRemove: (url: string) => void;
  onRetry: (url: string) => void;
  onEdit: (url: string) => void;
  onEditTitle?: (url: string) => void;
  onShowError?: (url: string) => void;
  onToggleHideFromAll?: (url: string) => void;
  categories: FeedCategory[];
  onMoveCategory: (categoryId: string) => void;
}

const getStatusMeta = (validation?: FeedValidationResult) => {
  if (!validation) {
    return {
      label: "Pendente",
      tone: "text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))] opacity-60",
      dot: "bg-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))] opacity-45",
    };
  }

  if (validation.isValid) {
    return {
      label: "Válido",
      tone: "text-[rgb(var(--color-success))]",
      dot: "bg-[rgb(var(--color-success))]",
    };
  }

  return {
    label: "Atenção",
    tone: "text-[rgb(var(--color-error))]",
    dot: "bg-[rgb(var(--color-error))]",
  };
};

export const FeedItem: React.FC<FeedItemProps> = ({
  feed,
  validation,
  onRemove,
  onRetry,
  onEdit,
  onEditTitle,
  onShowError,
  onToggleHideFromAll,
  categories,
  onMoveCategory,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const status = getStatusMeta(validation);
  const title = getFeedDisplayName(feed, validation?.title);
  const hasError = validation && !validation.isValid;

  return (
    <div className="group relative rounded-[20px] bg-[rgb(var(--theme-manager-elevated,var(--theme-surface-elevated,var(--color-surface))))] px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] transition-all hover:bg-[rgb(var(--theme-manager-soft,var(--theme-surface-elevated,var(--color-surface))))] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] focus-within:bg-[rgb(var(--theme-manager-soft,var(--theme-surface-elevated,var(--color-surface))))]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className={`h-2.5 w-2.5 shrink-0 rounded-full shadow-[0_0_0_4px_rgba(255,255,255,0.03)] ${status.dot}`} />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="truncate text-sm font-bold text-[rgb(var(--theme-text-readable))]">
                {title}
              </h4>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${status.tone}`}>
                {status.label}
              </span>
              {feed.hideFromAll && (
                <EyeOff className="h-3 w-3 text-[rgb(var(--color-accent))] opacity-60" />
              )}
            </div>
            <p className="mt-0.5 truncate font-mono text-[10px] text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))] opacity-60">
              {feed.url}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 lg:flex-nowrap">
          <div className="min-w-[150px] flex-1 sm:flex-none">
            <select
              value={feed.categoryId || ""}
              onChange={(e) => onMoveCategory(e.target.value)}
              aria-label={`Categoria de ${title}`}
              className="h-8 w-full rounded-full bg-[rgb(var(--theme-manager-control,var(--theme-control-bg,var(--color-surface))))] px-3 text-[11px] font-semibold text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))] outline-none transition hover:text-[rgb(var(--theme-text-readable))] focus:ring-1 focus:ring-[rgba(var(--color-accent),0.35)]"
            >
              <option value="">Sem categoria</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 rounded-full bg-[rgb(var(--theme-manager-control,var(--theme-control-bg,var(--color-surface))))] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <IconButton
              onClick={() => onRetry(feed.url)}
              title="Revalidar"
              icon={<RefreshCw className="h-4 w-4" />}
            />
            {hasError && onShowError && (
              <IconButton
                onClick={() => onShowError(feed.url)}
                title="Ver erro"
                icon={<Info className="h-4 w-4" />}
                tone="warning"
              />
            )}
            <div className="relative">
              <IconButton
                onClick={() => setShowMenu(!showMenu)}
                title="Mais ações"
                icon={<MoreVertical className="h-4 w-4" />}
                active={showMenu}
              />

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-[100]"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-full z-[101] mt-2 w-48 overflow-hidden rounded-xl border border-[rgba(var(--color-border),0.12)] bg-[rgb(var(--theme-manager-elevated))] p-1 shadow-xl animate-in fade-in zoom-in-95 duration-100">
                    <MenuAction
                      onClick={() => {
                        onEdit(feed.url);
                        setShowMenu(false);
                      }}
                      icon={<Edit2 className="h-3.5 w-3.5" />}
                      label="Editar URL"
                    />
                    {onEditTitle && (
                      <MenuAction
                        onClick={() => {
                          onEditTitle(feed.url);
                          setShowMenu(false);
                        }}
                        icon={<Type className="h-3.5 w-3.5" />}
                        label="Editar nome"
                      />
                    )}
                    {onToggleHideFromAll && (
                      <MenuAction
                        onClick={() => {
                          onToggleHideFromAll(feed.url);
                          setShowMenu(false);
                        }}
                        icon={feed.hideFromAll ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                        label={feed.hideFromAll ? "Mostrar em Todos" : "Ocultar em Todos"}
                      />
                    )}
                    <div className="my-1 border-t border-[rgba(var(--color-border),0.08)]" />
                    <MenuAction
                      onClick={() => {
                        onRemove(feed.url);
                        setShowMenu(false);
                      }}
                      icon={<Trash2 className="h-3.5 w-3.5" />}
                      label="Remover feed"
                      destructive
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const IconButton: React.FC<{
  onClick: () => void;
  title: string;
  icon: React.ReactNode;
  tone?: "default" | "warning" | "danger";
  active?: boolean;
}> = ({ onClick, title, icon, tone = "default", active = false }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    aria-label={title}
    className={`flex h-8 w-8 items-center justify-center rounded-full transition-all hover:scale-110 active:scale-95 ${
      active
        ? "bg-[rgba(var(--color-accent),0.15)] text-[rgb(var(--color-accent))]"
        : tone === "warning"
          ? "text-[rgb(var(--color-warning))] hover:bg-[rgba(var(--color-warning),0.12)]"
          : tone === "danger"
            ? "text-[rgb(var(--color-error))] hover:bg-[rgba(var(--color-error),0.12)]"
            : "text-[rgb(var(--theme-text-secondary-readable))] hover:bg-[rgba(255,255,255,0.05)] hover:text-[rgb(var(--theme-text-readable))]"
    }`}
  >
    {icon}
  </button>
);

const MenuAction: React.FC<{
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  destructive?: boolean;
}> = ({ onClick, icon, label, destructive = false }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors ${
      destructive
        ? "text-red-400 hover:bg-red-500/10"
        : "text-[rgb(var(--theme-text-readable))] hover:bg-[rgba(255,255,255,0.05)]"
    }`}
  >
    <span className="opacity-70">{icon}</span>
    {label}
  </button>
);
