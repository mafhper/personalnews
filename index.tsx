import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { NotificationProvider } from "./contexts/NotificationContext";
import { NotificationContainer } from "./components/NotificationToast";
import { ModalProvider } from "./contexts/ModalContext";
import { FeedProvider } from "./contexts/FeedContext";
import { UIProvider } from "./contexts/UIContext";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ModalProvider>
      <NotificationProvider>
        <FeedProvider>
          <UIProvider>
            <App />
            <NotificationContainer />
          </UIProvider>
        </FeedProvider>
      </NotificationProvider>
    </ModalProvider>
  </React.StrictMode>
);
