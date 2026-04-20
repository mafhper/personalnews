import React from "react";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { useNotification } from "../hooks/useNotification";
import { Notification } from "../types";

interface NotificationToastProps {
  notification: Notification;
}

const getIcon = (type: Notification["type"]) => {
  switch (type) {
    case "success":
      return <CheckCircle size={20} className="shrink-0" />;
    case "error":
      return <AlertCircle size={20} className="shrink-0" />;
    case "warning":
      return <AlertTriangle size={20} className="shrink-0" />;
    case "info":
    default:
      return <Info size={20} className="shrink-0" />;
  }
};

const getToneClassName = (type: Notification["type"]) => {
  switch (type) {
    case "success":
      return "border-emerald-500 text-emerald-400";
    case "error":
      return "border-red-500 text-red-400";
    case "warning":
      return "border-amber-500 text-amber-400";
    case "info":
    default:
      return "border-blue-500 text-blue-400";
  }
};

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
}) => {
  const { removeNotification } = useNotification();

  const handleClose = () => {
    removeNotification(notification.id);
  };

  return (
    <div
      className={`flex w-full items-start gap-3 rounded-lg border bg-[#1e1e1e]/95 p-3 text-white shadow-2xl ${getToneClassName(
        notification.type,
      )}`}
      role={notification.type === "error" ? "alert" : "status"}
    >
      {getIcon(notification.type)}
      <p className="min-w-0 flex-1 text-sm leading-5 text-white">
        {notification.message}
      </p>
      <button
        aria-label="Fechar notificação"
        className="rounded p-1 text-white/80 transition hover:bg-white/10 hover:text-white"
        onClick={handleClose}
        type="button"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export const NotificationContainer: React.FC = () => {
  const { notifications } = useNotification();

  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        right: 20,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        maxWidth: "400px",
      }}
    >
      {notifications.map((notification: Notification) => (
        <NotificationToast key={notification.id} notification={notification} />
      ))}
    </div>
  );
};
