import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { FeedAddTab } from "../components/FeedManager/FeedAddTab";
import { SettingsSidebar } from "../components/SettingsSidebar";
import { SkipLinks } from "../components/SkipLinks";
import { createThemeSeedPair } from "../services/themeUtils";
import type { ExtendedTheme, ThemeSettings } from "../types";

const {
  setCurrentThemeMock,
  updateThemeSettingsMock,
  updateBackgroundConfigMock,
  updateHeaderConfigMock,
  updateContentConfigMock,
  applyLayoutPresetMock,
  resetAppearanceMock,
  resetCategoryLayoutsMock,
  themeState,
} = vi.hoisted(() => ({
  setCurrentThemeMock: vi.fn(),
  updateThemeSettingsMock: vi.fn(),
  updateBackgroundConfigMock: vi.fn(),
  updateHeaderConfigMock: vi.fn(),
  updateContentConfigMock: vi.fn(),
  applyLayoutPresetMock: vi.fn(),
  resetAppearanceMock: vi.fn(),
  resetCategoryLayoutsMock: vi.fn(),
  themeState: {
    currentTheme: null,
    customThemes: [],
    themeSettings: null,
    systemPreference: "dark",
  } as {
    currentTheme: ExtendedTheme | null;
    customThemes: ExtendedTheme[];
    themeSettings: ThemeSettings | null;
    systemPreference: "light" | "dark";
  },
}));

const darkTheme = {
  id: "dark",
  name: "Modo Escuro",
  colors: {
    primary: "147 197 253",
    primarySurface: "30 64 175",
    onPrimary: "255 255 255",
    secondary: "30 41 59",
    accent: "191 219 254",
    accentSurface: "29 78 216",
    onAccent: "255 255 255",
    background: "10 15 30",
    surface: "30 41 59",
    surfaceElevated: "51 65 85",
    text: "255 255 255",
    textSecondary: "203 213 225",
    border: "51 65 85",
    success: "34 197 94",
    warning: "234 179 8",
    error: "239 68 68",
  },
  layout: "comfortable" as const,
  density: "medium" as const,
  borderRadius: "medium" as const,
  shadows: true,
  animations: true,
};

const lightTheme = {
  ...darkTheme,
  id: "light",
  name: "Modo Claro",
  colors: {
    ...darkTheme.colors,
    primary: "29 78 216",
    primarySurface: "29 78 216",
    accent: "30 64 175",
    accentSurface: "30 64 175",
    background: "255 255 255",
    surface: "241 245 249",
    surfaceElevated: "226 232 240",
    text: "15 23 42",
    textSecondary: "71 85 105",
    border: "226 232 240",
  },
};

vi.mock("../hooks/useExtendedTheme", () => ({
  useExtendedTheme: () => {
    const currentTheme = themeState.currentTheme ?? darkTheme;
    const customThemes = themeState.customThemes;
    const themeSettings = themeState.themeSettings ?? {
      autoDetectSystemTheme: false,
      systemThemeOverride: null,
      currentTheme,
      customThemes,
      themeTransitions: true,
    };
    const defaultPresets = [
      { id: "light", category: "light", theme: lightTheme },
      { id: "dark", category: "dark", theme: darkTheme },
    ];

    return {
      currentTheme,
      themeSettings,
      customThemes,
      systemPreference: themeState.systemPreference,
      setCurrentTheme: setCurrentThemeMock,
      updateThemeSettings: updateThemeSettingsMock,
      defaultPresets,
      allThemes: [
        ...defaultPresets.map((preset) => preset.theme),
        ...customThemes,
      ],
    };
  },
}));

vi.mock("../hooks/useAppearance", () => ({
  LAYOUT_PRESETS: [],
  useAppearance: () => ({
    applyLayoutPreset: applyLayoutPresetMock,
    backgroundConfig: {},
    updateBackgroundConfig: updateBackgroundConfigMock,
    resetAppearance: resetAppearanceMock,
    headerConfig: {
      style: "default",
      position: "static",
      height: "normal",
      showTitle: true,
      showLogo: true,
      customTitle: "Personal News",
      logoUrl: null,
      logoSize: "md",
      backgroundColor: "10 15 30",
      backgroundOpacity: 100,
      blurIntensity: "medium",
      borderColor: "51 65 85",
      borderOpacity: 100,
      categoryBackgroundColor: "30 41 59",
      categoryBackgroundOpacity: 100,
      bgColor: "10 15 30",
      bgOpacity: 1,
      blur: 0,
      customLogoSvg: "",
      logoColor: "255 255 255",
      logoColorMode: "theme",
      syncFavicon: true,
      titleColor: "255 255 255",
    },
    updateHeaderConfig: updateHeaderConfigMock,
    contentConfig: {
      showAuthor: true,
      showDate: true,
      showTime: true,
      showTags: true,
      layoutMode: "default",
      density: "comfortable",
      paginationType: "numbered",
    },
    updateContentConfig: updateContentConfigMock,
  }),
}));

vi.mock("../hooks/useFeedCategories", () => ({
  useFeedCategories: () => ({
    resetCategoryLayouts: resetCategoryLayoutsMock,
  }),
}));

vi.mock("../hooks/useNotificationReplacements", () => ({
  useNotificationReplacements: () => ({
    alertSuccess: vi.fn(),
    alertError: vi.fn(),
    confirmDanger: vi.fn().mockResolvedValue(false),
  }),
}));

vi.mock("../hooks/useLanguage", () => ({
  useLanguage: () => ({
    language: "pt-BR",
    setLanguage: vi.fn(),
    t: (key: string) => {
      if (key === "action.add") {
        return "Adicionar";
      }

      return key;
    },
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

vi.mock("../components/FeedItem", () => ({
  FeedItem: () => <div data-testid="feed-item" />,
}));

describe("theme contrast hotspots", () => {
  beforeEach(() => {
    setCurrentThemeMock.mockClear();
    updateThemeSettingsMock.mockClear();
    themeState.currentTheme = darkTheme;
    themeState.customThemes = [];
    themeState.themeSettings = {
      autoDetectSystemTheme: false,
      systemThemeOverride: null,
      currentTheme: darkTheme,
      customThemes: [],
      themeTransitions: true,
    };
    themeState.systemPreference = "dark";
  });

  it("keeps skip links on semantic accent surface tokens", () => {
    render(<SkipLinks />);

    const skipLink = screen.getByRole("link", {
      name: /skip to main content/i,
    });

    expect(skipLink.className).toContain(
      "focus:bg-[rgb(var(--color-accentSurface))]",
    );
    expect(skipLink.className).toContain(
      "focus:text-[rgb(var(--color-onAccent))]",
    );
  });

  it("uses semantic CTA tokens in feed manager add flow", () => {
    render(
      <FeedAddTab
        categories={[{ id: "general", name: "General", color: "0 0 0", order: 0 }]}
        newFeedUrl=""
        setNewFeedUrl={vi.fn()}
        newFeedTitle=""
        setNewFeedTitle={vi.fn()}
        newFeedCategory=""
        setNewFeedCategory={vi.fn()}
        processingUrl={null}
        onSubmit={(event) => event.preventDefault()}
        onImportOPML={vi.fn()}
        onShowImportModal={vi.fn()}
        feedCount={0}
      />,
    );

    const newFeedButton = screen.getByRole("button", { name: /Abrir listas/i });
    expect(newFeedButton.className).toContain(
      "bg-[rgb(var(--color-accentSurface))]",
    );
    expect(newFeedButton.className).toContain(
      "text-[rgb(var(--color-onAccent))]",
    );

    const saveFeedButton = screen.getByRole("button", { name: /^Adicionar$/i });
    expect(saveFeedButton.className).toContain(
      "bg-[rgb(var(--color-accentSurface))]",
    );
    expect(saveFeedButton.className).toContain(
      "text-[rgb(var(--color-onAccent))]",
    );
  });

  it("keeps category manager accent CTAs on explicit high-contrast foreground tokens", () => {
    const categoryManagerSource = readFileSync(
      resolve(process.cwd(), "components/FeedCategoryManager.tsx"),
      "utf8",
    );

    expect(categoryManagerSource).toContain(
      "bg-[rgb(var(--color-accent))] px-4 py-2.5 text-sm font-black text-slate-950",
    );
    expect(categoryManagerSource).toContain(
      "bg-[rgb(var(--color-accent))] text-slate-950 font-black px-6 py-2.5",
    );
    expect(categoryManagerSource).not.toContain("Create New Category");
    expect(categoryManagerSource).not.toContain("Save Changes");
  });

  it("keeps background type tabs on semantic accent surface contrast tokens", () => {
    const backgroundCreatorSource = readFileSync(
      resolve(process.cwd(), "components/BackgroundCreator.tsx"),
      "utf8",
    );

    expect(backgroundCreatorSource).toContain(
      "bg-[rgb(var(--color-accentSurface))] text-[rgb(var(--color-onAccent))] shadow-md",
    );
    expect(backgroundCreatorSource).toContain(
      "flex h-9 flex-1 items-center justify-center rounded-lg px-3 text-xs font-medium transition-all",
    );
    expect(backgroundCreatorSource).toContain(
      "const settingsActionButtonClass = '!h-9 w-full text-xs';",
    );
    expect(backgroundCreatorSource).not.toContain(
      "bg-[rgb(var(--color-accent))] text-white shadow-md",
    );
  });

  it("keeps settings sidebar form actions on a consistent control height", () => {
    const settingsSidebarSource = readFileSync(
      resolve(process.cwd(), "components/SettingsSidebar.tsx"),
      "utf8",
    );

    expect(settingsSidebarSource).toContain(
      "flex h-9 items-center justify-center rounded-lg px-3 text-xs font-medium transition-all",
    );
    expect(settingsSidebarSource).toContain(
      "inline-flex h-9 items-center justify-center rounded-lg px-3 text-xs font-medium transition-colors",
    );
    expect(settingsSidebarSource).toContain("w-full h-9 rounded-xl");
  });

  it("routes sidebar theme mode changes through presets with semantic tokens", () => {
    render(
      <SettingsSidebar
        isOpen={true}
        onClose={vi.fn()}
        timeFormat="24h"
        setTimeFormat={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText("Aparência").closest("button")!);
    fireEvent.click(screen.getByRole("button", { name: "Escuro" }));

    expect(setCurrentThemeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        colors: expect.objectContaining({
          primarySurface: expect.any(String),
          onPrimary: expect.any(String),
          accentSurface: expect.any(String),
          onAccent: expect.any(String),
        }),
      }),
    );
  });

  it("applies seed color presets as complete semantic light and dark themes", () => {
    render(
      <SettingsSidebar
        isOpen={true}
        onClose={vi.fn()}
        timeFormat="24h"
        setTimeFormat={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText("Aparência").closest("button")!);
    fireEvent.click(
      screen.getByRole("button", { name: "Aplicar cor-semente Esmeralda" }),
    );

    expect(setCurrentThemeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "seed-emerald-dark",
        colors: expect.objectContaining({
          primarySurface: expect.any(String),
          onPrimary: expect.any(String),
          accentSurface: expect.any(String),
          onAccent: expect.any(String),
          surfaceElevated: expect.any(String),
          text: expect.any(String),
          textSecondary: expect.any(String),
        }),
      }),
    );
    expect(updateThemeSettingsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        autoDetectSystemTheme: false,
        systemThemeOverride: "dark",
        customThemes: expect.arrayContaining([
          expect.objectContaining({ id: "seed-emerald-light" }),
          expect.objectContaining({ id: "seed-emerald-dark" }),
        ]),
      }),
    );
  });

  it("preserves the active seed pair when switching between light and dark modes", () => {
    const seedPair = createThemeSeedPair("5 150 105", "Esmeralda", "seed-emerald");
    themeState.currentTheme = seedPair.dark;
    themeState.customThemes = [seedPair.light, seedPair.dark];
    themeState.themeSettings = {
      autoDetectSystemTheme: false,
      systemThemeOverride: "dark",
      currentTheme: seedPair.dark,
      customThemes: themeState.customThemes,
      themeTransitions: true,
    };

    render(
      <SettingsSidebar
        isOpen={true}
        onClose={vi.fn()}
        timeFormat="24h"
        setTimeFormat={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText("Aparência").closest("button")!);

    expect(
      screen.getByText("Cor-semente ativa: Esmeralda (Escuro)"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Claro" }));

    expect(setCurrentThemeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "seed-emerald-light",
        colors: expect.objectContaining({
          primarySurface: expect.any(String),
          onPrimary: expect.any(String),
          accentSurface: expect.any(String),
          onAccent: expect.any(String),
        }),
      }),
    );
    expect(updateThemeSettingsMock).toHaveBeenCalledWith({
      autoDetectSystemTheme: false,
      systemThemeOverride: "light",
    });
  });

  it("renders seed preview coverage for CTA, outline, pagination, chips, and elevated cards", () => {
    render(
      <SettingsSidebar
        isOpen={true}
        onClose={vi.fn()}
        timeFormat="24h"
        setTimeFormat={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText("Aparência").closest("button")!);

    expect(
      screen.getByRole("button", { name: "Aplicar cor-semente Azul" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Aplicar cor-semente Esmeralda" }),
    ).toBeInTheDocument();
    expect(screen.getByText("AA validado")).toBeInTheDocument();
    expect(screen.getAllByText("Azul").length).toBeGreaterThan(0);
  });

  it("syncs the custom seed swatch with the selected preset color", () => {
    render(
      <SettingsSidebar
        isOpen={true}
        onClose={vi.fn()}
        timeFormat="24h"
        setTimeFormat={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText("Aparência").closest("button")!);
    fireEvent.click(
      screen.getByRole("button", { name: "Aplicar cor-semente Âmbar" }),
    );

    expect(screen.getByLabelText("Cor-semente personalizada")).toHaveValue(
      "#d97706",
    );
    expect(screen.getAllByText("Âmbar").length).toBeGreaterThan(0);
  });

  it("maps proxy settings CTA styles to semantic accent tokens", () => {
    const cssSource = readFileSync(
      resolve(process.cwd(), "styles/ProxySettings.module.css"),
      "utf8",
    );

    expect(cssSource).toContain(
      "--primary-color: rgb(var(--color-accentSurface, var(--color-accent)));",
    );
    expect(cssSource).toContain(
      "--primary-foreground: rgb(var(--color-onAccent, var(--color-text)));",
    );
    expect(cssSource).toContain("color: var(--primary-foreground);");
  });

  it("keeps feed tools separated from diagnostics and risk actions high contrast", () => {
    const toolsSource = readFileSync(
      resolve(process.cwd(), "components/FeedManager/FeedToolsTab.tsx"),
      "utf8",
    );

    expect(toolsSource).toContain("Bancada");
    expect(toolsSource).toContain("Fluxos principais");
    expect(toolsSource).toContain("Zona de risco");
    expect(toolsSource).toContain("bg-red-500 px-4 py-3 text-sm font-black text-white");
    expect(toolsSource).not.toContain("useProxyDashboard");
  });
});
