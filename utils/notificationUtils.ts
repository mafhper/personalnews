import { NotificationOptions, Notification } from "../types";

export const createNotification = (
  message: string,
  options: NotificationOptions = {}
): Notification => {
  const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  return {
    id,
    message,
    type: options.type || "info",
    duration: options.duration || 5000,
    persistent: options.persistent || false,
    timestamp: Date.now(),
  };
};