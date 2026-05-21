import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsSidebar } from "../components/SettingsSidebar";

const {
  alertSuccessMock,
  confirmDangerMock,
  confirmDangerScopesMock,
  resetAppearanceMock,
  resetCategoryLayoutsMock,
} = vi.hoisted(() => ({
  alertSuccessMock: vi.fn(),
  confirmDangerMock: vi.fn(),
  confirmDangerScopesMock: vi.fn(),
  resetAppearanceMock: vi.fn(),
  resetCategoryLayoutsMock: vi.fn(),
}));

vi.mock("../hooks/useExtendedTheme", () => ({
  useExtendedTheme: () => ({
    currentTheme: { id: "dark", name: "Dark" },
    customThemes: [],
    systemPreference: "dark",
    updateThemeSettings: vi.fn(),
    themeSettings: {
      autoDetectSystemTheme: false,
      systemThemeOverride: "dark",
      customThemes: [],
    },
    setCurrentTheme: vi.fn(),
    defaultPresets: [],
    allThemes: [],
  }),
}));

vi.mock("../hooks/useAppearance", () => ({
  LAYOUT_PRESETS: [],
  useAppearance: () => ({
    applyLayoutPreset: vi.fn(),
    backgroundConfig: {},
    updateBackgroundConfig: vi.fn(),
    resetAppearance: resetAppearanceMock,
    headerConfig: {
      position: "static",
      height: "normal",
      showTitle: true,
      showLogo: true,
      logoSize: "md",
      bgOpacity: 1,
      blur: 0,
    },
    updateHeaderConfig: vi.fn(),
    contentConfig: {
      showAuthor: true,
      showDate: true,
      showTags: true,
      layoutMode: "default",
      paginationType: "numbered",
    },
    updateContentConfig: vi.fn(),
  }),
}));

vi.mock("../hooks/useArticleLayout", () => ({
  useArticleLayout: () => ({
    settings: { feedCacheTtlMinutes: 10 },
    updateSettings: vi.fn(),
  }),
}));

vi.mock("../hooks/useFeedCategories", () => ({
  useFeedCategories: () => ({
    resetCategoryLayouts: resetCategoryLayoutsMock,
  }),
}));

vi.mock("../hooks/useNotificationReplacements", () => ({
  useNotificationReplacements: () => ({
    alertSuccess: alertSuccessMock,
    alertError: vi.fn(),
    confirmDanger: confirmDangerMock,
    confirmDangerScopes: confirmDangerScopesMock,
  }),
}));

vi.mock("../hooks/useLanguage", () => ({
  useLanguage: () => ({
    language: "pt-BR",
    setLanguage: vi.fn(),
  }),
}));

vi.mock("../services/backupService", () => ({
  createBackup: vi.fn(),
  downloadBackup: vi.fn(),
  restoreBackup: vi.fn(),
}));

vi.mock("../components/BackgroundCreator", () => ({
  BackgroundCreator: () => <div data-testid="background-creator" />,
}));

vi.mock("../components/ui/Switch", () => ({
  Switch: () => <div data-testid="switch" />,
}));

const renderOpenSystemSettings = () => {
  render(
    <SettingsSidebar
      isOpen
      onClose={vi.fn()}
      timeFormat="24h"
      setTimeFormat={vi.fn()}
      primaryView="all"
      onPrimaryViewChange={vi.fn()}
    />,
  );

  fireEvent.click(screen.getByText("Sistema").closest("button")!);
};

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

describe("SettingsSidebar reset scopes", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    localStorage.clear();
    confirmDangerMock.mockResolvedValue(false);
    confirmDangerScopesMock.mockResolvedValue({
      confirmed: false,
      selectedScopeIds: [],
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    localStorage.clear();
  });

  it("renders restoration and cleanup labels without legacy reset copy", () => {
    renderOpenSystemSettings();

    expect(screen.getByText("Restauração e limpeza")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Restaurar aparência/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Restaurar categorias/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Limpar feeds cadastrados/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Limpar histórico de leitura/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Limpar favoritos/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Redefinir dados locais/i })).toBeInTheDocument();
    expect(screen.queryByText("Opções de Reset")).not.toBeInTheDocument();
    expect(screen.queryByText("Resetar Estilos")).not.toBeInTheDocument();
    expect(screen.queryByText("Reset Completo")).not.toBeInTheDocument();
  });

  it("opens scoped full reset with the five visible data scopes", async () => {
    renderOpenSystemSettings();

    fireEvent.click(screen.getByRole("button", { name: /Redefinir dados locais/i }));

    await flushPromises();

    expect(confirmDangerScopesMock).toHaveBeenCalledTimes(1);
    expect(confirmDangerScopesMock.mock.calls[0][0]).toMatchObject({
      title: "Redefinir dados locais",
      scopes: expect.arrayContaining([
        expect.objectContaining({ id: "feeds", label: "Todos os feeds cadastrados" }),
        expect.objectContaining({ id: "categories", label: "Todas as categorias" }),
        expect.objectContaining({ id: "style", label: "Todas as personalizações de estilo" }),
        expect.objectContaining({ id: "read-history", label: "Histórico de leitura" }),
        expect.objectContaining({ id: "favorites", label: "Favoritos" }),
      ]),
    });
  });

  it("preserves favorites and read history when those full reset scopes are not selected", async () => {
    localStorage.setItem("favorites-data", "keep-favorites");
    localStorage.setItem("article-read-status", "keep-read-status");
    localStorage.setItem("rss-feeds", "remove-feeds");
    confirmDangerScopesMock.mockResolvedValue({
      confirmed: true,
      selectedScopeIds: ["feeds"],
    });

    renderOpenSystemSettings();
    fireEvent.click(screen.getByRole("button", { name: /Redefinir dados locais/i }));

    await flushPromises();

    expect(alertSuccessMock).toHaveBeenCalledWith("Dados locais redefinidos. A página será recarregada.");
    expect(localStorage.getItem("favorites-data")).toBe("keep-favorites");
    expect(localStorage.getItem("article-read-status")).toBe("keep-read-status");
    expect(localStorage.getItem("rss-feeds")).toBeNull();
  });

  it("restores appearance through the existing appearance hooks", async () => {
    confirmDangerMock.mockResolvedValueOnce(true);
    renderOpenSystemSettings();

    fireEvent.click(screen.getByRole("button", { name: /Restaurar aparência/i }));

    await flushPromises();

    expect(resetAppearanceMock).toHaveBeenCalledTimes(1);
    expect(resetCategoryLayoutsMock).toHaveBeenCalledTimes(1);
    expect(alertSuccessMock).toHaveBeenCalledWith("Aparência restaurada.");
  });
});
