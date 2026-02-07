import React, { useState, useCallback, ReactNode } from "react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { AlertDialog } from "../components/AlertDialog";
import {
  NotificationOptions,
  Notification,
  ConfirmDialogOptions,
} from "../types";
import { NotificationContext } from "./NotificationContextState";

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    options: ConfirmDialogOptions;
    resolve: (value: boolean) => void;
  } | null>(null);
  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    message: string;
    options: NotificationOptions;
    resolve: () => void;
  } | null>(null);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id),
    );
  }, []);

  const showNotification = useCallback(
    (message: string, options: NotificationOptions = {}) => {
      const id =
        Date.now().toString() + Math.random().toString(36).substr(2, 9);
      const notification: Notification = {
        id,
        message,
        type: options.type || "info",
        duration: options.duration || 5000,
        persistent: options.persistent || false,
        timestamp: Date.now(),
      };

      setNotifications((prev) => [...prev, notification]);

      // Auto-remove non-persistent notifications
      if (!notification.persistent) {
        setTimeout(() => {
          removeNotification(id);
        }, notification.duration);
      }
    },
    [removeNotification],
  );

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const showConfirm = useCallback(
    (options: ConfirmDialogOptions): Promise<boolean> => {
      return new Promise((resolve) => {
        setConfirmDialog({
          isOpen: true,
          options,
          resolve,
        });
      });
    },
    [],
  );

  const showAlert = useCallback(
    (message: string, options: NotificationOptions = {}): Promise<void> => {
      return new Promise((resolve) => {
        setAlertDialog({
          isOpen: true,
          message,
          options,
          resolve,
        });
      });
    },
    [],
  );

  const handleConfirmClose = useCallback(
    (result: boolean) => {
      if (confirmDialog) {
        confirmDialog.resolve(result);
        setConfirmDialog(null);
      }
    },
    [confirmDialog],
  );

  const handleAlertClose = useCallback(() => {
    if (alertDialog) {
      alertDialog.resolve();
      setAlertDialog(null);
    }
  }, [alertDialog]);

  const value = {
    notifications,
    showNotification,
    removeNotification,
    clearAllNotifications,
    showConfirm,
    showAlert,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {/* Render confirm dialog */}
      {confirmDialog && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          options={confirmDialog.options}
          onClose={handleConfirmClose}
        />
      )}
      {/* Render alert dialog */}
      {alertDialog && (
        <AlertDialog
          isOpen={alertDialog.isOpen}
          message={alertDialog.message}
          options={alertDialog.options}
          onClose={handleAlertClose}
        />
      )}
    </NotificationContext.Provider>
  );
};
