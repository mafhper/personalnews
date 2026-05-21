import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, AlertCircle, Check, Info, X } from "lucide-react";
import type {
  ConfirmDialogCloseResult,
  ConfirmDialogScope,
  ConfirmDialogOptions,
} from "../types";

const EMPTY_SCOPES: ConfirmDialogScope[] = [];

const getDefaultSelectedScopeIds = (scopes: ConfirmDialogScope[]) =>
  scopes
    .filter((scope) => scope.required || scope.checkedByDefault !== false)
    .map((scope) => scope.id);

interface ConfirmDialogProps {
  isOpen: boolean;
  options: ConfirmDialogOptions;
  onClose: (result: ConfirmDialogCloseResult) => void;
}

const getIcon = (type: ConfirmDialogOptions["type"]) => {
  switch (type) {
    case "danger":
      return (
        <AlertCircle size={24} className="text-[rgb(var(--color-error))]" />
      );
    case "warning":
      return (
        <AlertTriangle size={24} className="text-[rgb(var(--color-warning))]" />
      );
    case "info":
    default:
      return <Info size={24} className="text-[rgb(var(--color-accent))]" />;
  }
};

const getConfirmButtonClassName = (type: ConfirmDialogOptions["type"]) => {
  switch (type) {
    case "danger":
      return "bg-[rgb(var(--color-error))] hover:brightness-110";
    case "warning":
      return "bg-[rgb(var(--color-warning))] hover:brightness-110";
    case "info":
    default:
      return "bg-[rgb(var(--color-accentSurface))] hover:brightness-110";
  }
};

const getImpactClassName = (type: ConfirmDialogOptions["type"]) => {
  switch (type) {
    case "danger":
      return "border-[rgba(var(--color-error),0.2)] bg-[rgba(var(--color-error),0.08)]";
    case "warning":
      return "border-[rgba(var(--color-warning),0.22)] bg-[rgba(var(--color-warning),0.08)]";
    case "info":
    default:
      return "border-[rgba(var(--color-accent),0.18)] bg-[rgba(var(--color-accent),0.08)]";
  }
};

const getConfirmFocusClassName = (type: ConfirmDialogOptions["type"]) => {
  switch (type) {
    case "danger":
      return "focus:ring-[rgba(var(--color-error),0.35)]";
    case "warning":
      return "focus:ring-[rgba(var(--color-warning),0.35)]";
    case "info":
    default:
      return "focus:ring-[rgba(var(--color-accent),0.35)]";
  }
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  options,
  onClose,
}) => {
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);
  const {
    title = "Confirmação",
    message,
    impact,
    details = [],
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    type = "info",
    scopes = EMPTY_SCOPES,
    scopesTitle = "Dados afetados",
    scopesCollapsed = false,
    scopesCollapseThreshold = 5,
    scopesSummary,
  } = options;
  const hasScopes = scopes.length > 0;
  const [selectedScopeIds, setSelectedScopeIds] = useState<string[]>(() =>
    getDefaultSelectedScopeIds(scopes),
  );
  const [scopesExpanded, setScopesExpanded] = useState(
    !scopesCollapsed && scopes.length <= scopesCollapseThreshold,
  );
  const selectedScopeIdSet = useMemo(
    () => new Set(selectedScopeIds),
    [selectedScopeIds],
  );
  const canConfirm =
    !hasScopes ||
    scopes.some((scope) => scope.required || selectedScopeIdSet.has(scope.id));

  useEffect(() => {
    if (!isOpen) return;

    setSelectedScopeIds(getDefaultSelectedScopeIds(scopes));
    setScopesExpanded(!scopesCollapsed && scopes.length <= scopesCollapseThreshold);
  }, [isOpen, scopes, scopesCollapsed, scopesCollapseThreshold]);

  const handleConfirm = () => {
    if (!canConfirm) return;

    if (hasScopes) {
      onClose({ confirmed: true, selectedScopeIds });
      return;
    }

    onClose(true);
  };

  const handleCancel = () => {
    if (hasScopes) {
      onClose({ confirmed: false, selectedScopeIds });
      return;
    }

    onClose(false);
  };

  const handleClose = useCallback(() => {
    if (hasScopes) {
      onClose({ confirmed: false, selectedScopeIds });
      return;
    }

    onClose(false);
  }, [hasScopes, onClose, selectedScopeIds]);

  const handleScopeToggle = (scopeId: string) => {
    const scope = scopes.find((item) => item.id === scopeId);
    if (!scope || scope.required) return;

    setSelectedScopeIds((current) =>
      current.includes(scopeId)
        ? current.filter((id) => id !== scopeId)
        : [...current, scopeId],
    );
  };

  useEffect(() => {
    if (!isOpen) return;

    const frameId = requestAnimationFrame(() => {
      cancelButtonRef.current?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleClose, isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      <section
        aria-modal="true"
        className="w-full max-w-lg overflow-hidden rounded-lg border border-[rgba(var(--color-border),0.2)] bg-[rgb(var(--theme-manager-surface,var(--color-surface)))] text-[rgb(var(--theme-manager-text,var(--color-text)))] shadow-2xl"
        role="dialog"
      >
        <header className="flex items-center gap-3 border-b border-[rgba(var(--color-border),0.16)] px-5 py-4">
          {getIcon(type)}
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            aria-label="Fechar"
            className="ml-auto rounded p-1 text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))] transition hover:bg-[rgb(var(--theme-manager-control,var(--color-surfaceElevated)))] hover:text-[rgb(var(--theme-manager-text,var(--color-text)))]"
            onClick={handleClose}
            type="button"
          >
            <X size={20} />
          </button>
        </header>

        <div className="space-y-4 px-5 py-5">
          <p className="whitespace-pre-line text-sm leading-6 text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))]">
            {message}
          </p>
          {impact && (
            <p
              className={`${getImpactClassName(type)} rounded-lg border px-3 py-2 text-sm font-semibold leading-6 text-[rgb(var(--theme-manager-text,var(--color-text)))]`}
            >
              {impact}
            </p>
          )}
          {details.length > 0 && (
            <ul className="space-y-2 rounded-lg bg-[rgb(var(--theme-manager-control,var(--color-surfaceElevated)))] px-3 py-3">
              {details.map((detail, index) => (
                <li
                  className="break-words text-sm leading-5 text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))]"
                  key={`${detail}-${index}`}
                >
                  {detail}
                </li>
              ))}
            </ul>
          )}
          {hasScopes && (
            <div className="rounded-lg bg-[rgb(var(--theme-manager-control,var(--color-surfaceElevated)))] p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wide text-[rgb(var(--theme-manager-text,var(--color-text)))]">
                    {scopesTitle}
                  </h3>
                  {!scopesExpanded && (
                    <p className="mt-1 text-xs leading-5 text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))]">
                      {scopesSummary ||
                        `${selectedScopeIds.length} de ${scopes.length} itens selecionados.`}
                    </p>
                  )}
                </div>
                {!scopesExpanded && (
                  <button
                    className="rounded-md px-2.5 py-1.5 text-xs font-bold text-[rgb(var(--color-accent))] transition hover:bg-[rgb(var(--color-accent))]/10"
                    onClick={() => setScopesExpanded(true)}
                    type="button"
                  >
                    Expandir lista
                  </button>
                )}
              </div>

              {scopesExpanded && (
                <div className="mt-3 space-y-2">
                  {scopes.map((scope) => {
                    const checked =
                      scope.required || selectedScopeIdSet.has(scope.id);
                    const disabled = scope.required || Boolean(scope.disabledReason);

                    return (
                      <label
                        className={`flex items-start gap-3 rounded-lg px-3 py-2 text-left transition ${
                          disabled
                            ? "cursor-not-allowed bg-[rgb(var(--color-text))]/5 opacity-70"
                            : "cursor-pointer hover:bg-[rgb(var(--color-accent))]/8"
                        }`}
                        key={scope.id}
                      >
                        <span
                          className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border ${
                            checked
                              ? "border-[rgb(var(--color-accent))] bg-[rgb(var(--color-accentSurface))] text-[rgb(var(--color-onAccent))]"
                              : "border-[rgba(var(--color-border),0.42)] bg-[rgb(var(--theme-manager-surface,var(--color-surface)))]"
                          }`}
                        >
                          {checked && <Check className="h-3.5 w-3.5" />}
                        </span>
                        <input
                          checked={checked}
                          className="sr-only"
                          disabled={disabled}
                          onChange={() => handleScopeToggle(scope.id)}
                          type="checkbox"
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-[rgb(var(--theme-manager-text,var(--color-text)))]">
                            {scope.label}
                          </span>
                          {(scope.description || scope.disabledReason) && (
                            <span className="mt-0.5 block text-xs leading-5 text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))]">
                              {scope.disabledReason || scope.description}
                            </span>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              {!canConfirm && (
                <p className="mt-3 rounded-md border border-[rgba(var(--color-warning),0.28)] bg-[rgba(var(--color-warning),0.1)] px-3 py-2 text-xs font-semibold text-[rgb(var(--theme-manager-text,var(--color-text)))]">
                  Selecione pelo menos um item para continuar.
                </p>
              )}
            </div>
          )}
        </div>

        <footer className="flex justify-end gap-2 px-5 pb-5">
          <button
            ref={cancelButtonRef}
            className="rounded-md border border-[rgba(var(--color-border),0.28)] px-4 py-2 text-sm font-semibold text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))] transition hover:bg-[rgb(var(--theme-manager-control,var(--color-surfaceElevated)))] hover:text-[rgb(var(--theme-manager-text,var(--color-text)))] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--color-accent),0.35)]"
            onClick={handleCancel}
            type="button"
          >
            {cancelText}
          </button>
          <button
            className={`${getConfirmButtonClassName(type)} ${getConfirmFocusClassName(type)} rounded-md px-4 py-2 text-sm font-semibold text-white transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50`}
            disabled={!canConfirm}
            onClick={handleConfirm}
            type="button"
          >
            {confirmText}
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  );
};
