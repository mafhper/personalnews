import React, { useState, useCallback, useRef, ReactNode } from "react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { AlertDialog } from "../components/AlertDialog";
import {
  NotificationOptions,
  Notification,
  ConfirmDialogOptions,
  ConfirmDialogCloseResult,
  ConfirmDialogResult,
} from "../types";
import { NotificationContext } from "./NotificationContextState";

interface NotificationProviderProps {
  children: ReactNode;
}

type ConfirmDialogRequest =
  | {
      isOpen: boolean;
      options: ConfirmDialogOptions;
      mode: "boolean";
      resolve: (value: boolean) => void;
    }
  | {
      isOpen: boolean;
      options: ConfirmDialogOptions;
      mode: "scoped";
      resolve: (value: ConfirmDialogResult) => void;
    };

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notificationDedupeRef = useRef<Map<string, number>>(new Map());
  const [confirmDialog, setConfirmDialog] =
    useState<ConfirmDialogRequest | null>(null);
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
      const type = options.type || "info";
      const now = Date.now();
      const dedupeKey = `${type}:${message}`;
      const lastShownAt = notificationDedupeRef.current.get(dedupeKey);

      if (lastShownAt && now - lastShownAt < 1000) {
        return;
      }

      notificationDedupeRef.current.set(dedupeKey, now);
      const id =
        Date.now().toString() + Math.random().toString(36).substr(2, 9);
      const notification: Notification = {
        id,
        message,
        type,
        duration: options.duration || 5000,
        persistent: options.persistent || false,
        timestamp: Date.now(),
      };

      setNotifications((prev) => {
        const alreadyVisible = prev.some(
          (item) => item.message === message && item.type === type,
        );

        return alreadyVisible ? prev : [...prev, notification];
      });

      // Auto-remove non-persistent notifications
      if (!notification.persistent) {
        setTimeout(() => {
          removeNotification(id);
          if (notificationDedupeRef.current.get(dedupeKey) === now) {
            notificationDedupeRef.current.delete(dedupeKey);
          }
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
          mode: "boolean",
          resolve,
        });
      });
    },
    [],
  );

  const showScopedConfirm = useCallback(
    (options: ConfirmDialogOptions): Promise<ConfirmDialogResult> => {
      return new Promise((resolve) => {
        setConfirmDialog({
          isOpen: true,
          options,
          mode: "scoped",
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
    (result: ConfirmDialogCloseResult) => {
      if (confirmDialog) {
        if (confirmDialog.mode === "scoped") {
          const scopedResult =
            typeof result === "boolean"
              ? { confirmed: result, selectedScopeIds: [] }
              : result;
          confirmDialog.resolve(scopedResult);
        } else {
          confirmDialog.resolve(
            typeof result === "boolean" ? result : result.confirmed,
          );
        }
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
    showScopedConfirm,
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
