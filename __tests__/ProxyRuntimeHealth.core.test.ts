import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProxyManager, proxyManager } from "../services/proxyManager";

const resetRuntimeProxyStates = () => {
  [
    "LocalProxy",
    "AllOrigins",
    "CodeTabs",
    "WhateverOrigin",
    "TextProxy",
    "CorsProxy.io",
    "RSS2JSON",
    "CORS Anywhere",
  ].forEach((proxyName) => proxyManager.enableProxy(proxyName));
  proxyManager.resetStats();
};

describe("ProxyManager runtime health behavior", () => {
  beforeEach(() => {
    localStorage.clear();
    resetRuntimeProxyStates();
    delete (window as Window & { __TAURI__?: unknown }).__TAURI__;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps remote proxies enabled on first desktop run", () => {
    Object.defineProperty(window, "__TAURI__", {
      value: {},
      configurable: true,
    });

    ProxyManager.loadPreferences();

    const remoteConfigs = proxyManager
      .getProxyConfigs()
      .filter((config) => config.name !== "LocalProxy");

    expect(remoteConfigs.length).toBeGreaterThan(0);
    expect(remoteConfigs.every((config) => config.enabled)).toBe(true);
  });

  it("auto-disables only remote proxies after sustained critical health", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("proxy unavailable");
      }),
    );

    const codeTabs = proxyManager
      .getProxyConfigs()
      .find((config) => config.name === "CodeTabs");

    expect(codeTabs).toBeDefined();

    for (let index = 0; index < 6; index += 1) {
      await expect(
        proxyManager.tryProxy(codeTabs!, "https://example.com/feed.xml"),
      ).rejects.toThrow("proxy unavailable");
    }

    expect(
      proxyManager.getProxyConfigs().find((config) => config.name === "CodeTabs")
        ?.enabled,
    ).toBe(false);

    for (let index = 0; index < 6; index += 1) {
      proxyManager.markProxyStatus("LocalProxy", false);
    }

    expect(
      proxyManager
        .getProxyConfigs()
        .find((config) => config.name === "LocalProxy")?.enabled,
    ).toBe(true);
  });
});
