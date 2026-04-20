import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import type { NotificationOptions } from "../types";

interface AlertDialogProps {
  isOpen: boolean;
  message: string;
  options: NotificationOptions;
  onClose: () => void;
}

const getIcon = (type: NotificationOptions["type"]) => {
  switch (type) {
    case "success":
      return <CheckCircle size={24} className="text-green-500" />;
    case "error":
      return <AlertCircle size={24} className="text-red-500" />;
    case "warning":
      return <AlertTriangle size={24} className="text-yellow-500" />;
    case "info":
    default:
      return <Info size={24} className="text-blue-500" />;
  }
};

const getTitle = (type: NotificationOptions["type"]) => {
  switch (type) {
    case "success":
      return "Sucesso";
    case "error":
      return "Erro";
    case "warning":
      return "Aviso";
    case "info":
    default:
      return "Informação";
  }
};

export const AlertDialog: React.FC<AlertDialogProps> = ({
  isOpen,
  message,
  options,
  onClose,
}) => {
  const type = options.type || "info";

  const handleClose = () => {
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
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
          <h2 className="text-lg font-semibold">{getTitle(type)}</h2>
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

        <footer className="flex justify-end px-5 pb-5">
          <button
            className="rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600"
            onClick={handleClose}
            type="button"
          >
            OK
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  );
};
