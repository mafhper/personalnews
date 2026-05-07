import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LandingPage } from "../components/landing/LandingPage";

vi.mock("../hooks/useLanguage", () => ({
  useLanguage: () => ({ language: "pt-BR" }),
}));

const scrollIntoViewMock = vi.fn();
const scrollToMock = vi.fn();

describe("LandingPage promo structure", () => {
  beforeEach(() => {
    window.location.hash = "#home";
    window.localStorage.removeItem("appearance-background");
    scrollIntoViewMock.mockClear();
    scrollToMock.mockClear();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;
    window.scrollTo = scrollToMock;
  });

  it("renders the promo as one continuous editorial landing", () => {
    render(<LandingPage onOpenFeed={vi.fn()} />);

    expect(screen.getByTestId("promo-section-home")).toBeInTheDocument();
    expect(screen.getByTestId("promo-section-experience")).toBeInTheDocument();
    expect(screen.getByTestId("promo-section-project")).toBeInTheDocument();
    expect(screen.getByTestId("promo-section-faq")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Notícias no seu ritmo.",
      }),
    ).toBeInTheDocument();
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

  it("uses the liquid WebGL hero backdrop with a product screenshot signal", () => {
    const { container } = render(<LandingPage onOpenFeed={vi.fn()} />);
    const liquidBackdrop = container.querySelector(".promo-liquid-mesh");
    const liquidCanvas = container.querySelector(".promo-liquid-mesh__canvas");
    const heroImage = container.querySelector(".promo-product-frame img");

    expect(liquidBackdrop).toBeInTheDocument();
    expect(liquidCanvas).toBeInTheDocument();
    expect(liquidCanvas?.getAttribute("aria-hidden")).toBeNull();
    expect(heroImage?.getAttribute("src")).toContain("assets/screen.png");
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
