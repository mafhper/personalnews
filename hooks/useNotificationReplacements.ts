import { useNotification } from "../hooks/useNotification";
import type { ConfirmDialogOptions, ConfirmDialogResult } from "../types";

/**
 * Hook que fornece substitutos para window.alert, window.confirm, etc.
 * usando o sistema de notificação integrado
 */
export const useNotificationReplacements = () => {
  const { showAlert, showConfirm, showScopedConfirm, showNotification } =
    useNotification();

  // Substituto para window.alert()
  const alert = async (message: string) => {
    await showAlert(message, { type: "info" });
  };

  // Substituto para window.confirm()
  const confirm = async (message: string): Promise<boolean> => {
    return await showConfirm({
      message,
      title: "Confirmação",
      confirmText: "OK",
      cancelText: "Cancelar",
      type: "info",
    });
  };

  // Versões específicas para diferentes tipos de mensagem
  const alertSuccess = async (message: string) => {
    await showAlert(message, { type: "success" });
  };

  const alertError = async (message: string) => {
    await showAlert(message, { type: "error" });
  };

  const alertWarning = async (message: string) => {
    await showAlert(message, { type: "warning" });
  };

  const confirmDanger = async (
    input: string | ConfirmDialogOptions,
    title?: string,
  ): Promise<boolean> => {
    const options =
      typeof input === "string"
        ? {
            message: input,
            title: title || "Atenção",
          }
        : input;

    return await showConfirm({
      ...options,
      title: options.title || title || "Atenção",
      type: "danger",
      confirmText: options.confirmText || "Excluir",
      cancelText: options.cancelText || "Cancelar",
    });
  };

  const confirmDangerScopes = async (
    options: ConfirmDialogOptions,
  ): Promise<ConfirmDialogResult> => {
    return await showScopedConfirm({
      ...options,
      title: options.title || "Atenção",
      type: "danger",
      confirmText: options.confirmText || "Confirmar",
      cancelText: options.cancelText || "Cancelar",
    });
  };

  const confirmWarning = async (
    input: string | ConfirmDialogOptions,
    title?: string,
  ): Promise<boolean> => {
    const options =
      typeof input === "string"
        ? {
            message: input,
            title: title || "Aviso",
          }
        : input;

    return await showConfirm({
      ...options,
      title: options.title || title || "Aviso",
      confirmText: options.confirmText || "Continuar",
      cancelText: options.cancelText || "Cancelar",
      type: "warning",
    });
  };

  // Toast notifications (não bloqueiam a interface)
  const toast = {
    success: (message: string) =>
      showNotification(message, { type: "success" }),
    error: (message: string) => showNotification(message, { type: "error" }),
    warning: (message: string) =>
      showNotification(message, { type: "warning" }),
    info: (message: string) => showNotification(message, { type: "info" }),
  };

  return {
    alert,
    confirm,
    alertSuccess,
    alertError,
    alertWarning,
    confirmDanger,
    confirmDangerScopes,
    confirmWarning,
    toast,
  };
};
