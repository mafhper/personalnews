import React from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LandingPage } from "../components/landing/LandingPage";
import type { Language } from "../types";

const languageState = vi.hoisted(() => ({
  current: "pt-BR" as Language,
}));

vi.mock("../hooks/useLanguage", () => ({
  useLanguage: () => ({ language: languageState.current }),
}));

const scrollIntoViewMock = vi.fn();
const scrollToMock = vi.fn();
const pushStateMock = vi.fn();

const setNavigatorPlatform = ({
  platform,
  userAgent,
  maxTouchPoints = 0,
}: {
  platform: string;
  userAgent: string;
  maxTouchPoints?: number;
}) => {
  Object.defineProperty(window.navigator, "platform", {
    configurable: true,
    value: platform,
  });
  Object.defineProperty(window.navigator, "userAgent", {
    configurable: true,
    value: userAgent,
  });
  Object.defineProperty(window.navigator, "maxTouchPoints", {
    configurable: true,
    value: maxTouchPoints,
  });
};

const getPromoNavLink = (name: string) =>
  within(
    screen.getByRole("navigation", { name: "Navegação promocional" }),
  ).getByRole("link", { name });

describe("LandingPage promo structure", () => {
  beforeEach(() => {
    languageState.current = "pt-BR";
    window.location.hash = "#home";
    window.localStorage.removeItem("appearance-background");
    scrollIntoViewMock.mockClear();
    scrollToMock.mockClear();
    pushStateMock.mockClear();
    pushStateMock.mockImplementation((_state, _title, url) => {
      if (typeof url === "string" && url.startsWith("#")) {
        window.location.hash = url;
      }
    });
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;
    window.scrollTo = scrollToMock;
    window.history.pushState = pushStateMock;
    setNavigatorPlatform({
      platform: "Win32",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    });
  });

  it("renders the promo as one continuous editorial landing", () => {
    const { container } = render(<LandingPage onOpenFeed={vi.fn()} />);

    expect(screen.getByTestId("promo-section-home")).toBeInTheDocument();
    expect(screen.getByTestId("promo-section-experience")).toBeInTheDocument();
    expect(screen.getByTestId("promo-section-versions")).toBeInTheDocument();
    expect(screen.getByTestId("promo-section-project")).toBeInTheDocument();
    expect(screen.getByTestId("promo-section-faq")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Notícias no seu ritmo.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Teste a demonstração online funcional; instale no desktop para a experiência completa.",
      ),
    ).toBeInTheDocument();
    expect(container.querySelectorAll(".promo-hero__actions > *")).toHaveLength(
      2,
    );
  });

  it("keeps the feed CTA functional in both hero and header", () => {
    const onOpenFeed = vi.fn();
    render(<LandingPage onOpenFeed={onOpenFeed} />);

    const feedButtons = screen.getAllByRole("button", { name: /abrir feed/i });
    expect(feedButtons).toHaveLength(2);

    fireEvent.click(feedButtons[0]);
    fireEvent.click(feedButtons[1]);

    expect(onOpenFeed).toHaveBeenCalledTimes(2);
    expect(screen.getAllByText("Personal News").length).toBeGreaterThan(0);
    expect(document.body.textContent).not.toContain("PersonalNews");
  });

  it("routes the install hero CTA to the versions section", () => {
    render(<LandingPage onOpenFeed={vi.fn()} />);

    fireEvent.click(screen.getByRole("link", { name: "Instalar app" }));

    expect(pushStateMock).toHaveBeenCalledWith(null, "", "#versions");
    expect(getPromoNavLink("Experiência")).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByTestId("promo-section-versions")).toBeInTheDocument();
    expect(scrollToMock).toHaveBeenCalled();
  });

  it("handles shared versions hashes through the promo hash router", async () => {
    render(<LandingPage onOpenFeed={vi.fn()} />);

    await act(async () => {
      window.location.hash = "#versions";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });

    expect(screen.getByTestId("promo-section-versions")).toBeInTheDocument();
    expect(getPromoNavLink("Experiência")).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(scrollToMock).toHaveBeenCalled();
  });

  it("marks the related nav item active when opening a shared versions URL", () => {
    window.location.hash = "#versions";

    render(<LandingPage onOpenFeed={vi.fn()} />);

    expect(getPromoNavLink("Experiência")).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("does not add duplicate history entries for repeated install CTA clicks", () => {
    render(<LandingPage onOpenFeed={vi.fn()} />);

    const installCta = screen.getByRole("link", { name: "Instalar app" });
    fireEvent.click(installCta);
    window.location.hash = "#versions";
    fireEvent.click(installCta);

    expect(pushStateMock).toHaveBeenCalledTimes(1);
  });

  it("labels supported desktop platforms in the install CTA", () => {
    const { container } = render(<LandingPage onOpenFeed={vi.fn()} />);

    const installHint = container.querySelector(".promo-install-button small");
    expect(installHint).toHaveTextContent("Windows");
  });

  it("hides unsupported mobile platform labels in the install CTA", () => {
    setNavigatorPlatform({
      platform: "Linux armv8l",
      userAgent:
        "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Mobile",
      maxTouchPoints: 5,
    });

    const { container } = render(<LandingPage onOpenFeed={vi.fn()} />);

    expect(container.querySelector(".promo-install-button small")).toBeNull();
    expect(screen.getByRole("link", { name: "Instalar app" })).toBeInTheDocument();
  });

  it("does not label touch iOS devices as macOS in the install CTA", () => {
    setNavigatorPlatform({
      platform: "iPhone",
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
      maxTouchPoints: 5,
    });

    const { container } = render(<LandingPage onOpenFeed={vi.fn()} />);

    expect(container.querySelector(".promo-install-button small")).toBeNull();
  });

  it("uses the liquid WebGL hero backdrop with a product screenshot signal", () => {
    const { container } = render(<LandingPage onOpenFeed={vi.fn()} />);
    const liquidBackdrop = container.querySelector(".promo-liquid-mesh");
    const liquidCanvas = container.querySelector(".promo-liquid-mesh__canvas");
    const heroImage = container.querySelector(".promo-product-frame img");

    expect(liquidBackdrop).toBeInTheDocument();
    expect(liquidBackdrop).toHaveAttribute("data-cycle-backdrop", "day-night");
    expect(liquidBackdrop?.className).toContain("promo-day-cycle-backdrop");
    expect(liquidCanvas).toBeInTheDocument();
    expect(liquidCanvas?.getAttribute("aria-hidden")).toBeNull();
    expect(heroImage?.getAttribute("src")).toContain(
      "assets/promo/screens/hero-narrow-01.webp",
    );
  });

  it("shows operational feature cards with product screenshots", () => {
    const { container } = render(<LandingPage onOpenFeed={vi.fn()} />);
    const featureImages = Array.from(
      container.querySelectorAll(".promo-reading .promo-layout-preview img"),
    ).map((image) => image.getAttribute("src"));

    expect(screen.getByText("Gerencie fontes e categorias.")).toBeInTheDocument();
    expect(screen.getByText("Uma leitura com sua identidade.")).toBeInTheDocument();
    expect(screen.getByText("Dados rápidos, sob controle.")).toBeInTheDocument();
    expect(featureImages).toEqual([
      expect.stringContaining("promo-feature-collections.webp"),
      expect.stringContaining("promo-feature-personalization.webp"),
      expect.stringContaining("promo-feature-cache.webp"),
    ]);
  });

  it("keeps support labels localized in Spanish", () => {
    languageState.current = "es";

    render(<LandingPage onOpenFeed={vi.fn()} />);

    expect(
      screen.getByRole("navigation", { name: "Navegación promocional" }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Resumen de Personal News"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Herramientas disponibles")).toBeInTheDocument();
    expect(
      screen.getByText("Código abierto para leer, adaptar y seguir."),
    ).toBeInTheDocument();
    expect(screen.getByText("Ver repositorio")).toBeInTheDocument();
    expect(screen.getByLabelText("Descargas por sistema")).toBeInTheDocument();
  });

  it("navigates hashes to sections without unmounting the landing", async () => {
    render(<LandingPage onOpenFeed={vi.fn()} />);

    await act(async () => {
      window.location.hash = "#project";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });

    expect(screen.getByTestId("promo-section-home")).toBeInTheDocument();
    expect(screen.getByTestId("promo-section-project")).toBeInTheDocument();
    expect(scrollToMock).toHaveBeenCalled();
  });

  it("updates the hash when header navigation is used", () => {
    render(<LandingPage onOpenFeed={vi.fn()} />);

    fireEvent.click(screen.getAllByRole("link", { name: "Experiência" })[0]);

    expect(window.location.hash).toBe("#experience");
    expect(screen.getByTestId("promo-section-experience")).toBeInTheDocument();
  });

  it("renders the faq with native accessible disclosure items", () => {
    render(<LandingPage onOpenFeed={vi.fn()} />);

    const firstQuestion = screen.getByText("Qual versão devo testar primeiro?");
    expect(firstQuestion.tagName.toLowerCase()).toBe("summary");
    expect(firstQuestion.closest("details")).toBeInTheDocument();
  });
});
