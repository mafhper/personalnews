import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { desktopBackendClient } from "./services/desktopBackendClient";

const DESKTOP_BACKEND_BOOTSTRAP_TIMEOUT_MS = 10_000;

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const bootstrapDesktopBackend = async () => {
  if (!desktopBackendClient.isDesktopRuntime()) return;

  const status = await desktopBackendClient
    .bootstrapFromSupervisor()
    .catch(() => null);
  if (status?.health === "ready") return;

  await desktopBackendClient
    .waitUntilReady(DESKTOP_BACKEND_BOOTSTRAP_TIMEOUT_MS)
    .catch(() => false);
};

const bootstrap = async () => {
  await bootstrapDesktopBackend();

  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
};

void bootstrap();
