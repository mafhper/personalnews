import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { desktopBackendClient } from "./services/desktopBackendClient";


const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const bootstrap = async () => {
  await Promise.race([
    desktopBackendClient.bootstrapFromSupervisor().catch(() => null),
    new Promise<null>((resolve) => window.setTimeout(resolve, 1_500, null)),
  ]);

  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
};

void bootstrap();
