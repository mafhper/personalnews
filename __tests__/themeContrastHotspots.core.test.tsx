import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { FeedAddTab } from "../components/FeedManager/FeedAddTab";
import { FeedListTab } from "../components/FeedManager/FeedListTab";
import { SettingsSidebar } from "../components/SettingsSidebar";
import { SkipLinks } from "../components/SkipLinks";

const {
  setCurrentThemeMock,
  updateThemeSettingsMock,
  updateBackgroundConfigMock,
  updateHeaderConfigMock,
  updateContentConfigMock,
  applyLayoutPresetMock,
  resetAppearanceMock,
  resetCategoryLayoutsMock,
} = vi.hoisted(() => ({
  setCurrentThemeMock: vi.fn(),
  updateThemeSettingsMock: vi.fn(),
  updateBackgroundConfigMock: vi.fn(),
  updateHeaderConfigMock: vi.fn(),
  updateContentConfigMock: vi.fn(),
  applyLayoutPresetMock: vi.fn(),
  resetAppearanceMock: vi.fn(),
  resetCategoryLayoutsMock: vi.fn(),
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
  useExtendedTheme: () => ({
    currentTheme: darkTheme,
    themeSettings: {
      autoDetectSystemTheme: false,
      systemThemeOverride: null,
      currentTheme: darkTheme,
      customThemes: [],
      themeTransitions: true,
    },
    setCurrentTheme: setCurrentThemeMock,
    updateThemeSettings: updateThemeSettingsMock,
    defaultPresets: [
      { id: "light", category: "light", theme: lightTheme },
      { id: "dark", category: "dark", theme: darkTheme },
    ],
  }),
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

  it("uses semantic CTA tokens in feed add actions", () => {
    render(
      <FeedAddTab
        newFeedUrl=""
        setNewFeedUrl={vi.fn()}
        newFeedCategory=""
        setNewFeedCategory={vi.fn()}
        processingUrl={null}
        categories={[{ id: "general", name: "General", color: "0 0 0", order: 0 }]}
        onSubmit={(event) => event.preventDefault()}
        discoveryProgress={new Map()}
      />,
    );

    const submitButton = screen.getByRole("button", { name: /Adicionar/i });

    expect(submitButton.className).toContain(
      "bg-[rgb(var(--color-accentSurface))]",
    );
    expect(submitButton.className).toContain(
      "text-[rgb(var(--color-onAccent))]",
    );
  });

  it("uses semantic CTA tokens in feed manager add flow", () => {
    render(
      <FeedListTab
        feeds={[]}
        validations={new Map()}
        categories={[{ id: "general", name: "General", color: "0 0 0", order: 0 }]}
        onRemove={vi.fn()}
        onRetry={vi.fn()}
        onEdit={vi.fn()}
        onShowError={vi.fn()}
        onMoveCategory={vi.fn()}
        newFeedUrl=""
        setNewFeedUrl={vi.fn()}
        newFeedTitle=""
        setNewFeedTitle={vi.fn()}
        newFeedCategory=""
        setNewFeedCategory={vi.fn()}
        processingUrl={null}
        onSubmit={(event) => event.preventDefault()}
      />,
    );

    const newFeedButton = screen.getByRole("button", { name: /Novo Feed/i });
    expect(newFeedButton.className).toContain(
      "bg-[rgb(var(--color-accentSurface))]",
    );
    expect(newFeedButton.className).toContain(
      "text-[rgb(var(--color-onAccent))]",
    );

    fireEvent.click(newFeedButton);

    const saveFeedButton = screen.getByRole("button", { name: /Salvar Feed/i });
    expect(saveFeedButton.className).toContain(
      "bg-[rgb(var(--color-accentSurface))]",
    );
    expect(saveFeedButton.className).toContain(
      "text-[rgb(var(--color-onAccent))]",
    );
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

  it("keeps settings modal active controls on semantic surface tokens", () => {
    const modalSource = readFileSync(
      resolve(process.cwd(), "components/SettingsModal.tsx"),
      "utf8",
    );

    expect(modalSource).toContain(
      "bg-[rgb(var(--color-accentSurface))] text-[rgb(var(--color-onAccent))]",
    );
    expect(modalSource).toContain(
      "border border-[rgb(var(--color-accentSurface))] shadow-sm",
    );
  });

  it("keeps feed tools actions on semantic accent surface tokens", () => {
    const toolsSource = readFileSync(
      resolve(process.cwd(), "components/FeedManager/FeedToolsTab.tsx"),
      "utf8",
    );

    expect(toolsSource).toContain(
      "bg-[rgb(var(--color-accentSurface))] text-[rgb(var(--color-onAccent))]",
    );
    expect(toolsSource).toContain("hover:brightness-110");
  });
});
