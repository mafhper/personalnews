import { describe, expect, it } from "vitest";
import { getPromoContent } from "../config/promoContent";
import { detectBrowserLanguage } from "../utils/languageDetection";

const setNavigatorLanguages = (languages: readonly string[]) => {
  Object.defineProperty(window.navigator, "languages", {
    configurable: true,
    value: languages,
  });

  Object.defineProperty(window.navigator, "language", {
    configurable: true,
    value: languages[0] ?? "",
  });
};

describe("promo internationalization", () => {
  it("serves localized promo content for Brazilian Portuguese, English, and Spanish", () => {
    expect(getPromoContent("pt-BR").hero.title).toBe(
      "Notícias no seu ritmo.",
    );
    expect(getPromoContent("en-US").hero.title).toBe("News at your pace.");
    expect(getPromoContent("es").hero.title).toBe("Noticias a tu ritmo.");
    expect(getPromoContent("es").nav.pages.experience).toBe("Experiencia");
  });

  it("detects supported languages from the browser locale list", () => {
    setNavigatorLanguages(["es-ES", "en-US"]);
    expect(detectBrowserLanguage()).toBe("es");

    setNavigatorLanguages(["pt-BR", "en-US"]);
    expect(detectBrowserLanguage()).toBe("pt-BR");

    setNavigatorLanguages(["en-GB", "pt-BR"]);
    expect(detectBrowserLanguage()).toBe("en-US");
  });

  it("falls back to English when the browser locale is not published on the promo site", () => {
    setNavigatorLanguages(["fr-FR"]);
    expect(detectBrowserLanguage()).toBe("en-US");

    setNavigatorLanguages(["de-DE"]);
    expect(detectBrowserLanguage()).toBe("en-US");
  });
});
