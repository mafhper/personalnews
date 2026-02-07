import { createContext } from 'react';
import { NotificationOptions, Notification, ConfirmDialogOptions } from "../types";

export interface NotificationContextType {
  notifications: Notification[];
  showNotification: (message: string, options?: NotificationOptions) => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  showConfirm: (options: ConfirmDialogOptions) => Promise<boolean>;
  showAlert: (message: string, options?: NotificationOptions) => Promise<void>;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);
