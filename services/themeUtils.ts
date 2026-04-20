import type { ExtendedTheme, ThemePreset, ThemeSettings } from "../types";
import { INITIAL_APP_CONFIG } from "../constants/curatedFeeds";

export type ThemeSeedMode = "light" | "dark";

export interface SeedColorOption {
  id: string;
  label: string;
  seed: string;
}

export interface SeedThemePair {
  light: ExtendedTheme;
  dark: ExtendedTheme;
  isValid: boolean;
  issues: string[];
}

// Color conversion utilities
export const hexToRgb = (hex: string): string => {
  // Remove # if present
  const cleanHex = hex.replace("#", "");

  // Validate hex format (3 or 6 characters)
  if (!/^[a-fA-F0-9]{3}$|^[a-fA-F0-9]{6}$/.test(cleanHex)) {
    throw new Error(
      `Invalid hex color format: ${hex}. Expected format: #RRGGBB or #RGB`,
    );
  }

  let r: number, g: number, b: number;

  if (cleanHex.length === 3) {
    // Convert 3-digit hex to 6-digit
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else {
    // 6-digit hex
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  }

  // Validate RGB values are in valid range
  if (
    isNaN(r) ||
    isNaN(g) ||
    isNaN(b) ||
    r < 0 ||
    r > 255 ||
    g < 0 ||
    g > 255 ||
    b < 0 ||
    b > 255
  ) {
    throw new Error(
      `Invalid hex color conversion result: ${hex} -> ${r} ${g} ${b}`,
    );
  }

  return `${r} ${g} ${b}`;
};

// Default theme presets with WCAG AA compliant colors
export const defaultThemePresets: ThemePreset[] = [
  {
    id: "dark",
    name: "Modo Escuro",
    description: "Tema escuro padrão com alto contraste",
    category: "dark",
    theme: {
      id: "dark",
      name: "Modo Escuro",
      colors: {
        primary: "147 197 253", // Blue 300 - branding/foreground
        primarySurface: "30 64 175", // Blue 800 - filled CTA
        onPrimary: "255 255 255",
        secondary: "30 41 59", // Slate 800
        accent: "191 219 254", // Blue 200 - branding/foreground
        accentSurface: "29 78 216", // Blue 700 - filled CTA
        onAccent: "255 255 255",
        background: "10 15 30", // Slate 900
        surface: "30 41 59", // Slate 800
        surfaceElevated: "51 65 85", // Slate 700
        text: "255 255 255", // White
        textSecondary: "203 213 225", // Slate 300
        border: "51 65 85", // Slate 700
        success: "34 197 94", // Green 500
        warning: "234 179 8", // Yellow 500
        error: "239 68 68", // Red 500
      },


      layout: "comfortable",
      density: "medium",
      borderRadius: "medium",
      shadows: true,
      animations: true,
    },
  },
  {
    id: "light",
    name: "Modo Claro",
    description: "Tema claro padrão com leitura otimizada",
    category: "light",
    theme: {
      id: "light",
      name: "Modo Claro",
      colors: {
        primary: "29 78 216", // Blue 700 - Deep enough for white text
        primarySurface: "29 78 216",
        onPrimary: "255 255 255",
        secondary: "241 245 249", // Slate 100
        accent: "30 64 175", // Blue 800
        accentSurface: "30 64 175",
        onAccent: "255 255 255",
        background: "255 255 255", // White
        surface: "241 245 249", // Slate 100
        surfaceElevated: "226 232 240", // Slate 200
        text: "15 23 42", // Slate 900
        textSecondary: "71 85 105", // Slate 600
        border: "226 232 240", // Slate 200
        success: "22 163 74", // Green 600
        warning: "202 138 4", // Yellow 600
        error: "220 38 38", // Red 600
      },
      layout: "comfortable",
      density: "medium",
      borderRadius: "medium",
      shadows: true,
      animations: true,
    },
  },
];

// Default theme settings
export const defaultThemeSettings: ThemeSettings = {
  currentTheme:
    defaultThemePresets.find((preset) => preset.id === INITIAL_APP_CONFIG.theme)
      ?.theme || defaultThemePresets[0].theme,
  customThemes: [],
  autoDetectSystemTheme: true,
  systemThemeOverride: null,
  themeTransitions: true,
};

// Theme validation utilities
const REQUIRED_THEME_FIELDS: Array<keyof ExtendedTheme> = [
  "id",
  "name",
  "colors",
  "layout",
  "density",
  "borderRadius",
];

const REQUIRED_THEME_COLORS: Array<keyof ExtendedTheme["colors"]> = [
  "primary",
  "primarySurface",
  "onPrimary",
  "secondary",
  "accent",
  "accentSurface",
  "onAccent",
  "background",
  "surface",
  "surfaceElevated",
  "text",
  "textSecondary",
  "border",
  "success",
  "warning",
  "error",
];

const hasCompleteThemeShape = (
  theme: Partial<ExtendedTheme>,
): theme is ExtendedTheme => {
  if (!theme.colors) {
    return false;
  }

  return (
    REQUIRED_THEME_FIELDS.every((field) => field in theme) &&
    REQUIRED_THEME_COLORS.every((color) => color in theme.colors!)
  );
};

export const validateTheme = (theme: Partial<ExtendedTheme>): boolean => {
  // Check required fields
  for (const field of REQUIRED_THEME_FIELDS) {
    if (!(field in theme)) {
      console.warn(`Theme validation failed: missing field "${field}"`);
      return false;
    }
  }

  // Check required colors
  if (theme.colors) {
    for (const color of REQUIRED_THEME_COLORS) {
      if (!(color in theme.colors)) {
        console.warn(`Theme validation failed: missing color "${color}"`);
        return false;
      }
    }
  }

  // Validate RGB color format
  if (theme.colors) {
    for (const [colorName, colorValue] of Object.entries(theme.colors)) {
      if (!isValidRGBString(colorValue)) {
        console.warn(
          `Theme validation failed: invalid RGB format for color "${colorName}": "${colorValue}"`,
        );
        return false;
      }
    }
  }

  const accessibilityValidation = validateThemeAccessibility(
    theme as ExtendedTheme,
  );
  if (!accessibilityValidation.isAccessible) {
    console.warn(
      `Theme validation failed: accessibility requirements not met (${accessibilityValidation.issues.join(
        "; ",
      )})`,
    );
    return false;
  }

  return true;
};

// Check if a string is a valid RGB format (e.g., "255 255 255")
const isValidRGBString = (rgb: string): boolean => {
  const rgbPattern = /^\d{1,3}\s+\d{1,3}\s+\d{1,3}$/;
  if (!rgbPattern.test(rgb)) return false;

  const values = rgb.split(/\s+/).map(Number);
  return values.every((val) => val >= 0 && val <= 255);
};

// WCAG Contrast Ratio Utilities

const rgbStringToObject = (rgb: string) => {
  const [r, g, b] = rgb.split(/\s+/).map(Number);
  return { r, g, b };
};

const rgbObjectToString = ({
  r,
  g,
  b,
}: {
  r: number;
  g: number;
  b: number;
}): string =>
  `${Math.round(Math.max(0, Math.min(255, r)))} ${Math.round(Math.max(0, Math.min(255, g)))} ${Math.round(Math.max(0, Math.min(255, b)))}`;

const composeRgbColors = (
  foreground: string,
  background: string,
  alpha: number,
): string => {
  const fg = rgbStringToObject(foreground);
  const bg = rgbStringToObject(background);
  const normalizedAlpha = Math.max(0, Math.min(1, alpha));

  return rgbObjectToString({
    r: fg.r * normalizedAlpha + bg.r * (1 - normalizedAlpha),
    g: fg.g * normalizedAlpha + bg.g * (1 - normalizedAlpha),
    b: fg.b * normalizedAlpha + bg.b * (1 - normalizedAlpha),
  });
};

const shiftColor = (rgb: string, factor: number, toward: "white" | "black") => {
  const { r, g, b } = rgbStringToObject(rgb);
  if (toward === "white") {
    return rgbObjectToString({
      r: r + (255 - r) * factor,
      g: g + (255 - g) * factor,
      b: b + (255 - b) * factor,
    });
  }

  return rgbObjectToString({
    r: r * (1 - factor),
    g: g * (1 - factor),
    b: b * (1 - factor),
  });
};

const getBestContrastText = (
  background: string,
  preferredText?: string,
  targetRatio: number = 4.5,
): string => {
  if (
    preferredText &&
    calculateContrastRatio(preferredText, background) >= targetRatio
  ) {
    return preferredText;
  }

  const white = "255 255 255";
  const black = "15 23 42";

  if (calculateContrastRatio(white, background) >= targetRatio) {
    return white;
  }

  if (calculateContrastRatio(black, background) >= targetRatio) {
    return black;
  }

  return calculateContrastRatio(white, background) >=
    calculateContrastRatio(black, background)
    ? white
    : black;
};

const getContrastTargetDirection = (background: string): "white" | "black" =>
  calculateLuminance(background) > 0.5 ? "black" : "white";

const getInteractiveSurfaceCandidate = (
  color: string,
  background: string,
): { surface: string; onSurface: string } => {
  const isDarkBackground = calculateLuminance(background) < 0.5;
  const directions: Array<"white" | "black"> = isDarkBackground
    ? ["black", "white"]
    : ["black", "white"];
  const factors = [0, 0.08, 0.16, 0.24, 0.32, 0.4, 0.48, 0.56, 0.64, 0.72];

  for (const direction of directions) {
    for (const factor of factors) {
      const candidate = factor === 0 ? color : shiftColor(color, factor, direction);
      const bgRatio = calculateContrastRatio(candidate, background);
      const onSurface = getBestContrastText(candidate, undefined, 4.5);
      const onSurfaceRatio = calculateContrastRatio(onSurface, candidate);

      if (bgRatio >= 3 && onSurfaceRatio >= 4.5) {
        return {
          surface: candidate,
          onSurface,
        };
      }
    }
  }

  const fallbackSurface = shiftColor(color, 0.56, directions[0]);

  return {
    surface: fallbackSurface,
    onSurface: getBestContrastText(fallbackSurface, undefined, 4.5),
  };
};

const ensureForegroundContrast = (
  color: string,
  background: string,
  targetRatio: number,
): string => {
  if (calculateContrastRatio(color, background) >= targetRatio) {
    return color;
  }

  const direction = getContrastTargetDirection(background);
  let candidate = color;

  for (let step = 0; step < 8; step += 1) {
    candidate = shiftColor(candidate, 0.12, direction);
    if (calculateContrastRatio(candidate, background) >= targetRatio) {
      return candidate;
    }
  }

  return candidate;
};

const deriveSurfaceElevated = (surface: string, background: string): string => {
  const isLightBackground = calculateLuminance(background) > 0.5;
  return isLightBackground
    ? shiftColor(surface, 0.08, "black")
    : shiftColor(surface, 0.12, "white");
};

const resolveSeedForeground = (
  seedColor: string,
  background: string,
  surface: string,
): string => {
  const backgroundRatio = calculateContrastRatio(seedColor, background);
  const surfaceRatio = calculateContrastRatio(seedColor, surface);

  if (backgroundRatio >= 3 && surfaceRatio >= 3) {
    return seedColor;
  }

  return ensureForegroundContrast(
    ensureForegroundContrast(seedColor, background, 3),
    surface,
    3,
  );
};

export const ensureThemeSemanticColors = (
  colors: Partial<ExtendedTheme["colors"]>,
): ExtendedTheme["colors"] => {
  const primary = colors.primary ?? "59 130 246";
  const accent = colors.accent ?? primary;
  const background = colors.background ?? "10 15 30";
  const surface = colors.surface ?? colors.secondary ?? "30 41 59";
  const text = colors.text ?? getBestContrastText(background);
  const textSecondary = colors.textSecondary ?? composeRgbColors(text, background, 0.72);
  const surfaceElevated = colors.surfaceElevated ?? deriveSurfaceElevated(surface, background);

  const primarySurfacePair = colors.primarySurface && colors.onPrimary
    ? {
        surface: colors.primarySurface,
        onSurface: colors.onPrimary,
      }
    : getInteractiveSurfaceCandidate(primary, background);

  const accentSurfacePair = colors.accentSurface && colors.onAccent
    ? {
        surface: colors.accentSurface,
        onSurface: colors.onAccent,
      }
    : getInteractiveSurfaceCandidate(accent, background);

  return {
    primary,
    primarySurface: primarySurfacePair.surface,
    onPrimary: getBestContrastText(
      primarySurfacePair.surface,
      primarySurfacePair.onSurface,
      4.5,
    ),
    secondary: colors.secondary ?? surface,
    accent,
    accentSurface: accentSurfacePair.surface,
    onAccent: getBestContrastText(
      accentSurfacePair.surface,
      accentSurfacePair.onSurface,
      4.5,
    ),
    background,
    surface,
    surfaceElevated,
    text,
    textSecondary,
    border: colors.border ?? composeRgbColors(text, background, 0.24),
    success: colors.success ?? "16 185 129",
    warning: colors.warning ?? "245 158 11",
    error: colors.error ?? "239 68 68",
  };
};

export const resolveThemeContrastTokens = (theme: ExtendedTheme) => {
  const isLightBackground = calculateLuminance(theme.colors.background) > 0.5;
  const surfaceBackground = composeRgbColors(
    theme.colors.surface,
    theme.colors.background,
    isLightBackground ? 0.96 : 0.88,
  );
  const elevatedSurface = theme.colors.surfaceElevated;
  const headerBackground = composeRgbColors(
    theme.colors.surface,
    theme.colors.background,
    isLightBackground ? 0.94 : 0.9,
  );
  const badgeBackground = composeRgbColors(
    theme.colors.accentSurface,
    surfaceBackground,
    isLightBackground ? 0.22 : 0.28,
  );
  const controlBackground = composeRgbColors(
    theme.colors.surface,
    theme.colors.background,
    isLightBackground ? 0.92 : 0.82,
  );
  const paginationBackground = composeRgbColors(
    theme.colors.surfaceElevated,
    theme.colors.background,
    isLightBackground ? 0.96 : 0.88,
  );
  const managerBackground = isLightBackground
    ? composeRgbColors(
        shiftColor(theme.colors.background, 0.08, "black"),
        theme.colors.background,
        0.18,
      )
    : composeRgbColors("0 0 0", theme.colors.background, 0.88);
  const managerSurface = isLightBackground
    ? composeRgbColors(theme.colors.surface, managerBackground, 0.98)
    : shiftColor(managerBackground, 0.08, "white");
  const managerElevated = isLightBackground
    ? shiftColor(managerSurface, 0.04, "black")
    : shiftColor(managerBackground, 0.12, "white");
  const managerControl = isLightBackground
    ? shiftColor(managerSurface, 0.08, "black")
    : shiftColor(managerBackground, 0.16, "white");
  const managerSoft = isLightBackground
    ? shiftColor(managerSurface, 0.12, "black")
    : shiftColor(managerBackground, 0.2, "white");
  const managerText = getBestContrastText(managerSurface, theme.colors.text, 7);
  const managerTextSecondary = isLightBackground
    ? composeRgbColors(theme.colors.textSecondary, managerSurface, 0.94)
    : composeRgbColors("255 255 255", managerSurface, 0.72);

  return {
    surfaceBackground,
    elevatedSurface,
    headerBackground,
    badgeBackground,
    controlBackground,
    paginationBackground,
    managerBackground,
    managerSurface,
    managerElevated,
    managerControl,
    managerSoft,
    textOnBackground: getBestContrastText(
      theme.colors.background,
      theme.colors.text,
    ),
    textSecondaryOnBackground: getBestContrastText(
      theme.colors.background,
      theme.colors.textSecondary,
    ),
    textOnSurface: getBestContrastText(surfaceBackground, theme.colors.text),
    textSecondaryOnSurface: getBestContrastText(
      surfaceBackground,
      theme.colors.textSecondary,
    ),
    headerText: getBestContrastText(headerBackground, theme.colors.text),
    badgeText: getBestContrastText(badgeBackground, theme.colors.text),
    controlText: getBestContrastText(controlBackground, theme.colors.text),
    paginationText: getBestContrastText(
      paginationBackground,
      theme.colors.text,
    ),
    managerText,
    managerTextSecondary,
  };
};

export const calculateLuminance = (rgb: string): number => {
  const [r, g, b] = rgb.split(/\s+/).map(Number);

  const sRGB = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
};

export const calculateContrastRatio = (
  color1: string,
  color2: string,
): number => {
  const lum1 = calculateLuminance(color1);
  const lum2 = calculateLuminance(color2);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
};

export const meetsWCAGAA = (
  foreground: string,
  background: string,
): boolean => {
  return calculateContrastRatio(foreground, background) >= 4.5;
};

export const meetsWCAGAAA = (
  foreground: string,
  background: string,
): boolean => {
  return calculateContrastRatio(foreground, background) >= 7;
};

// Enhanced theme accessibility validation for WCAG AA compliance
export const validateThemeAccessibility = (
  theme: ExtendedTheme,
): {
  isAccessible: boolean;
  issues: string[];
  suggestions: string[];
  contrastRatios: Record<string, number>;
} => {
  const issues: string[] = [];
  const suggestions: string[] = [];
  const contrastRatios: Record<string, number> = {};

  const WCAG_AA_NORMAL = 4.5;
  const WCAG_AA_LARGE = 3.0;
  const semanticColors = ensureThemeSemanticColors(theme.colors);
  const textPairs: Array<[string, string, string, number, string]> = [
    [
      "textOnBackground",
      semanticColors.text,
      semanticColors.background,
      WCAG_AA_NORMAL,
      "Texto principal no fundo",
    ],
    [
      "secondaryTextOnBackground",
      semanticColors.textSecondary,
      semanticColors.background,
      WCAG_AA_NORMAL,
      "Texto secundário no fundo",
    ],
    [
      "textOnSurface",
      semanticColors.text,
      semanticColors.surface,
      WCAG_AA_NORMAL,
      "Texto em superfícies",
    ],
    [
      "secondaryTextOnSurface",
      semanticColors.textSecondary,
      semanticColors.surface,
      WCAG_AA_NORMAL,
      "Texto secundário em superfícies",
    ],
    [
      "textOnSurfaceElevated",
      semanticColors.text,
      semanticColors.surfaceElevated,
      WCAG_AA_NORMAL,
      "Texto em superfícies elevadas",
    ],
    [
      "onPrimary",
      semanticColors.onPrimary,
      semanticColors.primarySurface,
      WCAG_AA_NORMAL,
      "Texto em CTA primário",
    ],
    [
      "onAccent",
      semanticColors.onAccent,
      semanticColors.accentSurface,
      WCAG_AA_NORMAL,
      "Texto em CTA de destaque",
    ],
  ];

  textPairs.forEach(([key, foreground, background, target, label]) => {
    const ratio = calculateContrastRatio(foreground, background);
    contrastRatios[key] = ratio;

    if (ratio < target) {
      issues.push(
        `${label} não atende WCAG AA (${ratio.toFixed(2)}:1, mínimo: ${target}:1)`,
      );
      suggestions.push(`Ajuste ${label.toLowerCase()} para atingir contraste suficiente`);
    }
  });

  const interactivePairs: Array<[string, string, string, string]> = [
    [
      "primaryOnBackground",
      semanticColors.primary,
      semanticColors.background,
      "Cor primária com o fundo",
    ],
    [
      "accentOnBackground",
      semanticColors.accent,
      semanticColors.background,
      "Cor de destaque com o fundo",
    ],
    [
      "primaryOnSurface",
      semanticColors.primary,
      semanticColors.surface,
      "Cor primária em superfícies",
    ],
    [
      "accentOnSurface",
      semanticColors.accent,
      semanticColors.surface,
      "Cor de destaque em superfícies",
    ],
  ];

  interactivePairs.forEach(([key, foreground, background, label]) => {
    const ratio = calculateContrastRatio(foreground, background);
    contrastRatios[key] = ratio;

    if (ratio < WCAG_AA_LARGE) {
      issues.push(
        `${label} não atende o contraste mínimo (${ratio.toFixed(2)}:1, mínimo: ${WCAG_AA_LARGE}:1)`,
      );
      suggestions.push(`Ajuste ${label.toLowerCase()} para melhorar a visibilidade`);
    }
  });

  return {
    isAccessible: issues.length === 0,
    issues,
    suggestions,
    contrastRatios,
  };
};

// Validate all theme presets for accessibility compliance
export const validateAllThemesAccessibility = (): {
  results: Record<string, ReturnType<typeof validateThemeAccessibility>>;
  summary: {
    totalThemes: number;
    accessibleThemes: number;
    failedThemes: string[];
    totalIssues: number;
  };
} => {
  const results: Record<
    string,
    ReturnType<typeof validateThemeAccessibility>
  > = {};
  const failedThemes: string[] = [];
  let totalIssues = 0;

  // Validate each theme preset
  defaultThemePresets.forEach((preset) => {
    const validation = validateThemeAccessibility(preset.theme);
    results[preset.id] = validation;

    if (!validation.isAccessible) {
      failedThemes.push(preset.id);
      totalIssues += validation.issues.length;
    }
  });

  return {
    results,
    summary: {
      totalThemes: defaultThemePresets.length,
      accessibleThemes: defaultThemePresets.length - failedThemes.length,
      failedThemes,
      totalIssues,
    },
  };
};

// Theme migration utilities
export const migrateTheme = (oldTheme: unknown): ExtendedTheme | null => {
  try {
    if (typeof oldTheme === "string") {
      return createThemeFromAccentColor(oldTheme, "Migrated Theme");
    }

    if (!oldTheme || typeof oldTheme !== "object") {
      return null;
    }

    const themeObj = oldTheme as Record<string, unknown>;

    if (
      hasCompleteThemeShape(themeObj as Partial<ExtendedTheme>) &&
      validateTheme(themeObj as Partial<ExtendedTheme>)
    ) {
      return themeObj as unknown as ExtendedTheme;
    }

    const partialTheme = themeObj as Partial<ExtendedTheme> & {
      colors?: Partial<ExtendedTheme["colors"]>;
      accent?: string;
    };
    const baseColors: Partial<ExtendedTheme["colors"]> = partialTheme.colors ?? {};
    const fallbackAccent = partialTheme.accent ?? baseColors.accent ?? baseColors.primary;

    if (fallbackAccent) {
      const inferredMode: ThemeSeedMode =
        baseColors.background && calculateLuminance(baseColors.background) > 0.5
          ? "light"
          : "dark";
      const seedTheme = createThemeFromSeedColor(
        fallbackAccent,
        inferredMode,
        partialTheme.name ?? "Migrated Theme",
        partialTheme.id ?? `migrated-${Date.now()}`,
      );
      const migratedTheme: ExtendedTheme = {
        id: seedTheme.id,
        name: seedTheme.name,
        colors: ensureThemeSemanticColors({
          ...seedTheme.colors,
          ...baseColors,
          primary: baseColors.primary ?? seedTheme.colors.primary,
          accent: baseColors.accent ?? seedTheme.colors.accent,
          background: baseColors.background ?? seedTheme.colors.background,
          surface:
            baseColors.surface ?? baseColors.secondary ?? seedTheme.colors.surface,
          text: baseColors.text ?? seedTheme.colors.text,
          textSecondary:
            baseColors.textSecondary ?? seedTheme.colors.textSecondary,
          border: baseColors.border ?? seedTheme.colors.border,
          success: baseColors.success ?? seedTheme.colors.success,
          warning: baseColors.warning ?? seedTheme.colors.warning,
          error: baseColors.error ?? seedTheme.colors.error,
        }),
        layout: partialTheme.layout ?? "comfortable",
        density: partialTheme.density ?? "medium",
        borderRadius: partialTheme.borderRadius ?? "medium",
        shadows: partialTheme.shadows ?? true,
        animations: partialTheme.animations ?? true,
        adaptiveLayout: partialTheme.adaptiveLayout,
      };

      return validateTheme(migratedTheme) ? migratedTheme : autoFixThemeAccessibility(migratedTheme);
    }

    return null as unknown as ExtendedTheme;
  } catch (error) {
    console.error("Theme migration failed:", error);
    return null;
  }
};

export const createThemeFromSeedColor = (
  seedColor: string,
  mode: ThemeSeedMode,
  name: string,
  id = `custom-seed-${mode}-${Date.now()}`,
): ExtendedTheme => {
  const isDark = mode === "dark";
  const background = isDark ? "10 15 30" : "255 255 255";
  const surface = isDark ? "30 41 59" : "241 245 249";
  const brandColor = resolveSeedForeground(seedColor, background, surface);

  return {
    id,
    name,
    colors: ensureThemeSemanticColors({
      primary: brandColor,
      secondary: surface,
      accent: brandColor,
      background,
      surface,
      text: isDark ? "255 255 255" : "15 23 42",
      textSecondary: isDark ? "203 213 225" : "71 85 105",
      border: isDark ? "51 65 85" : "226 232 240",
      success: isDark ? "34 197 94" : "22 163 74",
      warning: isDark ? "234 179 8" : "202 138 4",
      error: isDark ? "239 68 68" : "220 38 38",
    }),
    layout: "comfortable",
    density: "medium",
    borderRadius: "medium",
    shadows: true,
    animations: true,
  };
};

export const createThemeSeedPair = (
  seedColor: string,
  name: string,
  idBase = `custom-seed-${Date.now()}`,
): SeedThemePair => {
  const light = createThemeFromSeedColor(
    seedColor,
    "light",
    `${name} Claro`,
    `${idBase}-light`,
  );
  const dark = createThemeFromSeedColor(
    seedColor,
    "dark",
    `${name} Escuro`,
    `${idBase}-dark`,
  );
  const lightValidation = validateThemeAccessibility(light);
  const darkValidation = validateThemeAccessibility(dark);
  const issues = [
    ...lightValidation.issues.map((issue) => `Claro: ${issue}`),
    ...darkValidation.issues.map((issue) => `Escuro: ${issue}`),
  ];

  return {
    light,
    dark,
    isValid: issues.length === 0,
    issues,
  };
};

// Compatibility wrapper for legacy "accent color" state.
export const createThemeFromAccentColor = (
  accentColor: string,
  name: string,
): ExtendedTheme => {
  const rgbValues = accentColor.split(/\s+/).map(Number);
  const [r, g, b] = rgbValues;
  const mode: ThemeSeedMode =
    r * 0.299 + g * 0.587 + b * 0.114 < 128 ? "dark" : "light";

  return createThemeFromSeedColor(accentColor, mode, name, `custom-${Date.now()}`);
};

export const seedColorOptions: SeedColorOption[] = [
  { id: "seed-blue", label: "Azul", seed: "37 99 235" },
  { id: "seed-emerald", label: "Esmeralda", seed: "5 150 105" },
  { id: "seed-violet", label: "Violeta", seed: "124 58 237" },
  { id: "seed-amber", label: "Âmbar", seed: "217 119 6" },
  { id: "seed-rose", label: "Rosa", seed: "225 29 72" },
];

export const seedThemePresets: ThemePreset[] = seedColorOptions.flatMap(
  (option) => {
    const pair = createThemeSeedPair(option.seed, option.label, option.id);

    return [
      {
        id: pair.light.id,
        name: pair.light.name,
        description: `Cor-semente ${option.label} para tema claro`,
        category: "light" as const,
        theme: pair.light,
      },
      {
        id: pair.dark.id,
        name: pair.dark.name,
        description: `Cor-semente ${option.label} para tema escuro`,
        category: "dark" as const,
        theme: pair.dark,
      },
    ];
  },
);

// Apply theme to CSS custom properties

export const applyThemeToDOM = (theme: ExtendedTheme): void => {
  const root = document.documentElement;
  const safeTheme = validateTheme(theme)
    ? {
        ...theme,
        colors: ensureThemeSemanticColors(theme.colors),
      }
    : autoFixThemeAccessibility(theme);
  const resolved = resolveThemeContrastTokens(safeTheme);

  // Apply color variables
  Object.entries(safeTheme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value);
  });

  // Set dark mode class based on background luminance
  const luminance = calculateLuminance(safeTheme.colors.background);
  if (root.classList) {
    if (luminance < 0.5) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }

  root.style.setProperty(
    "--theme-surface-readable",
    resolved.surfaceBackground,
  );
  root.style.setProperty("--theme-surface-elevated", resolved.elevatedSurface);
  root.style.setProperty("--theme-header-bg", resolved.headerBackground);
  root.style.setProperty("--theme-header-text", resolved.headerText);
  root.style.setProperty("--theme-chip-bg", resolved.badgeBackground);
  root.style.setProperty("--theme-chip-text", resolved.badgeText);
  root.style.setProperty("--theme-control-bg", resolved.controlBackground);
  root.style.setProperty("--theme-control-text", resolved.controlText);
  root.style.setProperty(
    "--theme-pagination-bg",
    resolved.paginationBackground,
  );
  root.style.setProperty("--theme-pagination-text", resolved.paginationText);
  root.style.setProperty("--theme-manager-bg", resolved.managerBackground);
  root.style.setProperty("--theme-manager-surface", resolved.managerSurface);
  root.style.setProperty("--theme-manager-elevated", resolved.managerElevated);
  root.style.setProperty("--theme-manager-control", resolved.managerControl);
  root.style.setProperty("--theme-manager-soft", resolved.managerSoft);
  root.style.setProperty("--theme-manager-text", resolved.managerText);
  root.style.setProperty(
    "--theme-manager-text-secondary",
    resolved.managerTextSecondary,
  );
  root.style.setProperty("--theme-text-readable", resolved.textOnBackground);
  root.style.setProperty(
    "--theme-text-secondary-readable",
    resolved.textSecondaryOnBackground,
  );
  root.style.setProperty("--theme-text-on-surface", resolved.textOnSurface);
  root.style.setProperty(
    "--theme-text-secondary-on-surface",
    resolved.textSecondaryOnSurface,
  );

  // Apply layout variables
  const layoutSpacing = {
    compact: { padding: "0.5rem", gap: "0.5rem" },
    comfortable: { padding: "1rem", gap: "1rem" },
    spacious: { padding: "1.5rem", gap: "1.5rem" },
  };

  const spacing = layoutSpacing[safeTheme.layout];
  root.style.setProperty("--layout-padding", spacing.padding);
  root.style.setProperty("--layout-gap", spacing.gap);

  // Apply density variables
  const densityValues = {
    low: { fontSize: "0.875rem", lineHeight: "1.25rem" },
    medium: { fontSize: "1rem", lineHeight: "1.5rem" },
    high: { fontSize: "1.125rem", lineHeight: "1.75rem" },
  };

  const density = densityValues[safeTheme.density];
  root.style.setProperty("--density-font-size", density.fontSize);
  root.style.setProperty("--density-line-height", density.lineHeight);

  // Apply border radius
  const borderRadiusValues = {
    none: "0",
    small: "0.25rem",
    medium: "0.5rem",
    large: "1rem",
  };

  root.style.setProperty(
    "--border-radius",
    borderRadiusValues[safeTheme.borderRadius],
  );

  // Apply shadow and animation preferences
  root.style.setProperty("--shadows-enabled", safeTheme.shadows ? "1" : "0");
  root.style.setProperty(
    "--animations-enabled",
    safeTheme.animations ? "1" : "0",
  );

  // Set transition duration based on animation preference
  root.style.setProperty(
    "--transition-duration",
    safeTheme.animations ? "0.2s" : "0s",
  );
};

// Get system theme preference
export const getSystemThemePreference = (): "light" | "dark" => {
  try {
    if (
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function"
    ) {
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      if (mql && typeof mql.matches === "boolean") {
        return mql.matches ? "dark" : "light";
      }
    }
  } catch {
    // Silently fallback on error
  }
  return "dark"; // Default fallback
};

// Find best matching preset for system preference
export const getSystemMatchingTheme = (
  preference: "light" | "dark",
): ExtendedTheme => {
  const matchingPresets = defaultThemePresets.filter(
    (preset) =>
      preset.category === preference ||
      (preference === "dark" && preset.category === "colorful"),
  );

  return matchingPresets.length > 0
    ? matchingPresets[0].theme
    : defaultThemePresets[0].theme;
};

// Helper function to adjust color brightness
export const adjustColorBrightness = (rgb: string, factor: number): string => {
  const [r, g, b] = rgb.split(" ").map(Number);
  if (factor > 1) {
    // Lighten
    return `${Math.min(255, Math.round(r + (255 - r) * (factor - 1)))} ${Math.min(255, Math.round(g + (255 - g) * (factor - 1)))} ${Math.min(255, Math.round(b + (255 - b) * (factor - 1)))}`;
  } else {
    // Darken
    return `${Math.round(r * factor)} ${Math.round(g * factor)} ${Math.round(b * factor)}`;
  }
};

// Enhanced auto-fix accessibility issues for comprehensive WCAG AA compliance
export const autoFixThemeAccessibility = (
  theme: ExtendedTheme,
): ExtendedTheme => {
  const fixedTheme: ExtendedTheme = {
    ...theme,
    colors: ensureThemeSemanticColors(theme.colors),
  };

  fixedTheme.colors.text = getBestContrastText(
    fixedTheme.colors.background,
    fixedTheme.colors.text,
    4.5,
  );
  fixedTheme.colors.surface = ensureForegroundContrast(
    fixedTheme.colors.surface,
    fixedTheme.colors.background,
    1.2,
  );
  fixedTheme.colors.surfaceElevated = deriveSurfaceElevated(
    fixedTheme.colors.surface,
    fixedTheme.colors.background,
  );
  fixedTheme.colors.textSecondary = getBestContrastText(
    fixedTheme.colors.background,
    fixedTheme.colors.textSecondary,
    4.5,
  );

  fixedTheme.colors.primary = ensureForegroundContrast(
    fixedTheme.colors.primary,
    fixedTheme.colors.background,
    3,
  );
  fixedTheme.colors.accent = ensureForegroundContrast(
    fixedTheme.colors.accent,
    fixedTheme.colors.background,
    3,
  );
  fixedTheme.colors.primary = ensureForegroundContrast(
    fixedTheme.colors.primary,
    fixedTheme.colors.surface,
    3,
  );
  fixedTheme.colors.accent = ensureForegroundContrast(
    fixedTheme.colors.accent,
    fixedTheme.colors.surface,
    3,
  );

  const primarySurfacePair = getInteractiveSurfaceCandidate(
    fixedTheme.colors.primarySurface || fixedTheme.colors.primary,
    fixedTheme.colors.background,
  );
  fixedTheme.colors.primarySurface = primarySurfacePair.surface;
  fixedTheme.colors.onPrimary = primarySurfacePair.onSurface;

  const accentSurfacePair = getInteractiveSurfaceCandidate(
    fixedTheme.colors.accentSurface || fixedTheme.colors.accent,
    fixedTheme.colors.background,
  );
  fixedTheme.colors.accentSurface = accentSurfacePair.surface;
  fixedTheme.colors.onAccent = accentSurfacePair.onSurface;

  return {
    ...fixedTheme,
    colors: ensureThemeSemanticColors(fixedTheme.colors),
  };
};

// Generate theme variations
export const generateThemeVariations = (
  baseTheme: ExtendedTheme,
): ExtendedTheme[] => {
  const variations: ExtendedTheme[] = [];

  // High contrast variation
  const highContrast: ExtendedTheme = {
    ...baseTheme,
    id: `${baseTheme.id}-high-contrast`,
    name: `${baseTheme.name} (High Contrast)`,
    colors: ensureThemeSemanticColors({
      ...baseTheme.colors,
      text:
        calculateLuminance(baseTheme.colors.background) > 0.5
          ? "0 0 0"
          : "255 255 255",
      textSecondary:
        calculateLuminance(baseTheme.colors.background) > 0.5
          ? "31 41 55"
          : "203 213 225",
      border:
        calculateLuminance(baseTheme.colors.background) > 0.5
          ? "107 114 128"
          : "156 163 175",
    }),
  };
  variations.push(highContrast);

  // Soft variation (reduced contrast for comfort)
  const soft: ExtendedTheme = {
    ...baseTheme,
    id: `${baseTheme.id}-soft`,
    name: `${baseTheme.name} (Soft)`,
    colors: ensureThemeSemanticColors({
      ...baseTheme.colors,
      textSecondary:
        calculateLuminance(baseTheme.colors.background) > 0.5
          ? "100 116 139"
          : "148 163 184",
    }),
  };
  variations.push(soft);

  return variations;
};

// Color blindness simulation
export const simulateColorBlindness = (
  theme: ExtendedTheme,
  type: "protanopia" | "deuteranopia" | "tritanopia",
): ExtendedTheme => {
  const simulateColor = (rgb: string): string => {
    const [r, g, b] = rgb.split(" ").map(Number);

    let newR = r,
      newG = g,
      newB = b;

    switch (type) {
      case "protanopia": // Red-blind
        newR = 0.567 * r + 0.433 * g;
        newG = 0.558 * r + 0.442 * g;
        newB = 0.242 * g + 0.758 * b;
        break;
      case "deuteranopia": // Green-blind
        newR = 0.625 * r + 0.375 * g;
        newG = 0.7 * r + 0.3 * g;
        newB = 0.3 * g + 0.7 * b;
        break;
      case "tritanopia": // Blue-blind
        newR = 0.95 * r + 0.05 * g;
        newG = 0.433 * g + 0.567 * b;
        newB = 0.475 * g + 0.525 * b;
        break;
    }

    return `${Math.round(Math.max(0, Math.min(255, newR)))} ${Math.round(Math.max(0, Math.min(255, newG)))} ${Math.round(Math.max(0, Math.min(255, newB)))}`;
  };

  return {
    ...theme,
    id: `${theme.id}-${type}`,
    name: `${theme.name} (${type})`,
    colors: {
      primary: simulateColor(theme.colors.primary),
      primarySurface: simulateColor(theme.colors.primarySurface),
      onPrimary: simulateColor(theme.colors.onPrimary),
      secondary: simulateColor(theme.colors.secondary),
      accent: simulateColor(theme.colors.accent),
      accentSurface: simulateColor(theme.colors.accentSurface),
      onAccent: simulateColor(theme.colors.onAccent),
      background: simulateColor(theme.colors.background),
      surface: simulateColor(theme.colors.surface),
      surfaceElevated: simulateColor(theme.colors.surfaceElevated),
      text: simulateColor(theme.colors.text),
      textSecondary: simulateColor(theme.colors.textSecondary),
      border: simulateColor(theme.colors.border),
      success: simulateColor(theme.colors.success),
      warning: simulateColor(theme.colors.warning),
      error: simulateColor(theme.colors.error),
    },
  };
};

// Export/Import utilities
export const exportTheme = (theme: ExtendedTheme): string => {
  return JSON.stringify(theme, null, 2);
};

export const importTheme = (themeJson: string): ExtendedTheme | null => {
  try {
    const theme = JSON.parse(themeJson);
    if (
      hasCompleteThemeShape(theme as Partial<ExtendedTheme>) &&
      validateTheme(theme as Partial<ExtendedTheme>)
    ) {
      return theme as ExtendedTheme;
    }
    return migrateTheme(theme);
  } catch (error) {
    console.error("Failed to import theme:", error);
    return null;
  }
};
