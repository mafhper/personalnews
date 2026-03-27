#!/usr/bin/env node

import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const modeArg = process.argv[2];
const mode = modeArg === "preview" ? "preview" : "dev";
const startViewArg = (process.argv[3] || "").toLowerCase();
const startView = startViewArg === "home" ? "home" : "feed";
const BACKEND_HOST = "127.0.0.1";
const BACKEND_PREFERRED_PORT = 3001;
const BACKEND_MAX_PORT = 3015;
const FRONTEND_PREFERRED_PORT = 5173;
const FRONTEND_MAX_PORT = 5190;
const ALLOW_BACKEND_REUSE = process.env.LOCAL_STACK_REUSE_BACKEND === "true";
const repoRoot = process.cwd();

let shuttingDown = false;
const children = [];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), ms),
    ),
  ]);
}

async function isBackendHealthy(port) {
  const healthUrl = `http://${BACKEND_HOST}:${port}/health`;
  try {
    const response = await withTimeout(fetch(healthUrl), 700);
    if (!response.ok) return false;
    const payload = await response.json().catch(() => null);
    return Boolean(
      payload &&
      payload.status === "ok" &&
      payload.service === "personalnews-backend",
    );
  } catch {
    return false;
  }
}

async function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.unref();
    server.once("error", () => resolve(false));
    server.listen(port, BACKEND_HOST, () => {
      server.close(() => resolve(true));
    });
  });
}

async function resolveBackendPort() {
  if (ALLOW_BACKEND_REUSE && (await isBackendHealthy(BACKEND_PREFERRED_PORT))) {
    return { port: BACKEND_PREFERRED_PORT, useExistingBackend: true };
  }

  if (await isPortAvailable(BACKEND_PREFERRED_PORT)) {
    return { port: BACKEND_PREFERRED_PORT, useExistingBackend: false };
  }

  for (
    let port = BACKEND_PREFERRED_PORT + 1;
    port <= BACKEND_MAX_PORT;
    port += 1
  ) {
    if (ALLOW_BACKEND_REUSE && (await isBackendHealthy(port))) {
      return { port, useExistingBackend: true };
    }
    if (await isPortAvailable(port)) {
      return { port, useExistingBackend: false };
    }
  }

  throw new Error(
    `nenhuma porta backend disponivel entre ${BACKEND_PREFERRED_PORT} e ${BACKEND_MAX_PORT}`,
  );
}

async function resolveFrontendPort() {
  for (
    let port = FRONTEND_PREFERRED_PORT;
    port <= FRONTEND_MAX_PORT;
    port += 1
  ) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(
    `nenhuma porta frontend disponivel entre ${FRONTEND_PREFERRED_PORT} e ${FRONTEND_MAX_PORT}`,
  );
}

async function waitForBackendHealth(port, timeoutMs = 15000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (await isBackendHealthy(port)) {
      return true;
    }
    await sleep(250);
  }

  return false;
}

function terminateChild(child) {
  if (!child || child.exitCode !== null) return;

  if (process.platform === "win32") {
    const pid = child.pid;
    if (!pid) return;
    spawn("taskkill", ["/pid", String(pid), "/t", "/f"], {
      stdio: "ignore",
      windowsHide: true,
    });
    return;
  }

  child.kill("SIGTERM");
}

function shutdownAndExit(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  children.forEach(terminateChild);
  setTimeout(() => process.exit(code), 150);
}

function spawnScript(name, script, envOverrides = {}) {
  const child = spawn("bun", ["run", script], {
    stdio: "inherit",
    env: {
      ...process.env,
      ...envOverrides,
    },
    windowsHide: false,
  });

  child.on("error", (error) => {
    console.error(`[local-stack] falha ao iniciar ${name}: ${String(error)}`);
    shutdownAndExit(1);
  });

  children.push(child);
  return child;
}

function clearViteOptimizeCache() {
  const viteCacheDir = join(repoRoot, "node_modules", ".vite");
  if (!existsSync(viteCacheDir)) return;

  rmSync(viteCacheDir, {
    force: true,
    recursive: true,
  });
  console.log(
    "[local-stack] cache node_modules/.vite limpo para evitar bundles desatualizados.",
  );
}

async function main() {
  if (mode === "dev") {
    clearViteOptimizeCache();
  }

  const { port: backendPort, useExistingBackend } = await resolveBackendPort();
  const frontendPort = await resolveFrontendPort();
  const backendBaseUrl = `http://${BACKEND_HOST}:${backendPort}`;
  const forceFeedHash = startView === "feed";
  const frontendEnv = {
    VITE_BACKEND_ENABLED: "true",
    VITE_LOCAL_BACKEND_URL: backendBaseUrl,
    VITE_FORCE_FEED_HASH: forceFeedHash ? "true" : "false",
    VITE_START_VIEW: startView,
    VITE_BACKEND_DEFAULT_MODE: "on",
    DEV_PORT: String(frontendPort),
  };

  console.log(
    `[local-stack] start view: ${startView === "home" ? "home (/)" : "feed (/#feed)"}.`,
  );
  if (frontendPort !== FRONTEND_PREFERRED_PORT) {
    console.log(
      `[local-stack] porta ${FRONTEND_PREFERRED_PORT} em uso; usando ${frontendPort}.`,
    );
  }
  if (!ALLOW_BACKEND_REUSE) {
    console.log(
      `[local-stack] backend reuse disabled (set LOCAL_STACK_REUSE_BACKEND=true to reuse an existing backend).`,
    );
  }

  let backend = null;
  if (useExistingBackend) {
    console.log(
      `[local-stack] reutilizando backend ja ativo em ${backendBaseUrl}.`,
    );
  } else {
    backend = spawnScript("backend", "backend:start", {
      BACKEND_HOST,
      BACKEND_PORT: String(backendPort),
    });

    const healthy = await waitForBackendHealth(backendPort, 15000);
    if (!healthy) {
      throw new Error(
        `backend nao ficou saudavel em ${backendBaseUrl} dentro do timeout`,
      );
    }
  }

  const frontend = spawnScript(
    "frontend",
    mode === "preview" ? "preview" : "dev",
    frontendEnv,
  );

  if (backend) {
    backend.on("exit", (code, signal) => {
      if (shuttingDown) return;
      console.error(
        `[local-stack] backend finalizou inesperadamente (${signal ?? code ?? 1}).`,
      );
      shutdownAndExit(typeof code === "number" ? code : 1);
    });
  }

  frontend.on("exit", (code, signal) => {
    if (shuttingDown) return;
    console.error(
      `[local-stack] frontend finalizou (${signal ?? code ?? 0}). Encerrando backend...`,
    );
    shutdownAndExit(typeof code === "number" ? code : 0);
  });

  if (!backend) {
    // Mantem o processo vivo para receber sinais enquanto apenas o frontend roda.
    while (!shuttingDown) {
      await sleep(500);
    }
  }
}

process.on("SIGINT", () => shutdownAndExit(130));
process.on("SIGTERM", () => shutdownAndExit(143));

main().catch((error) => {
  console.error(
    `[local-stack] falha ao inicializar stack local: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exit(1);
});
