import React, { useEffect } from "react";
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
      return <AlertCircle size={24} className="text-red-500" />;
    case "warning":
      return <AlertTriangle size={24} className="text-yellow-500" />;
    case "info":
    default:
      return <Info size={24} className="text-blue-500" />;
  }
};

const getConfirmButtonClassName = (type: ConfirmDialogOptions["type"]) => {
  switch (type) {
    case "danger":
      return "bg-red-500 hover:bg-red-600";
    case "warning":
      return "bg-amber-500 hover:bg-amber-600";
    case "info":
    default:
      return "bg-blue-500 hover:bg-blue-600";
  }
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  options,
  onClose,
}) => {
  const {
    title = "Confirmação",
    message,
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

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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
        className="w-full max-w-lg overflow-hidden rounded-lg border border-gray-700 bg-[#1e1e1e] text-white shadow-2xl"
        role="dialog"
      >
        <header className="flex items-center gap-3 border-b border-gray-700 px-5 py-4">
          {getIcon(type)}
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            aria-label="Fechar"
            className="ml-auto rounded p-1 text-gray-400 transition hover:bg-white/10 hover:text-white"
            onClick={handleClose}
            type="button"
          >
            <X size={20} />
          </button>
        </header>

        <div className="px-5 py-5">
          <p className="text-sm leading-6 text-gray-300">{message}</p>
        </div>

        <footer className="flex justify-end gap-2 px-5 pb-5">
          <button
            className="rounded-md border border-gray-600 px-4 py-2 text-sm font-semibold text-gray-300 transition hover:border-gray-500 hover:bg-white/10 hover:text-white"
            onClick={handleCancel}
            type="button"
          >
            {cancelText}
          </button>
          <button
            className={`${getConfirmButtonClassName(type)} rounded-md px-4 py-2 text-sm font-semibold text-white transition`}
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
