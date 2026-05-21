import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import type { ConfirmDialogOptions } from "../types";

interface ConfirmDialogProps {
  isOpen: boolean;
  options: ConfirmDialogOptions;
  onClose: (result: boolean) => void;
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
  } = options;

  const handleConfirm = () => {
    onClose(true);
  };

  const handleCancel = () => {
    onClose(false);
  };

  const handleClose = () => {
    onClose(false);
  };

  useEffect(() => {
    if (!isOpen) return;

    const frameId = requestAnimationFrame(() => {
      cancelButtonRef.current?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

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
            className={`${getConfirmButtonClassName(type)} ${getConfirmFocusClassName(type)} rounded-md px-4 py-2 text-sm font-semibold text-white transition focus:outline-none focus:ring-2`}
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
