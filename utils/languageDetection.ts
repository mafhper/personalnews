import type { Language } from "../types";

const normalizeBrowserLanguage = (locale: string): Language | null => {
  const normalized = locale.toLowerCase();

  if (normalized.startsWith("pt")) return "pt-BR";
  if (normalized.startsWith("en")) return "en-US";
  if (normalized.startsWith("es")) return "es";

  return null;
};

export const detectBrowserLanguage = (): Language => {
  if (typeof navigator === "undefined") return "en-US";

  const browserLanguages = [
    ...(navigator.languages ?? []),
    navigator.language,
  ].filter(Boolean);

  for (const locale of browserLanguages) {
    const language = normalizeBrowserLanguage(locale);
    if (language) return language;
  }

  return "en-US";
};
