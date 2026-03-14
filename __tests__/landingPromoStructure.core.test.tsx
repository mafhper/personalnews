import React from "react";
import { render, screen, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LandingPage } from "../components/landing/LandingPage";

vi.mock("../hooks/useLanguage", () => ({
  useLanguage: () => ({ language: "pt-BR" }),
}));

const mockFetch = vi.fn();

describe("LandingPage promo structure", () => {
  beforeEach(() => {
    window.location.hash = "#home";
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [
        {
          sha: "abc123",
          html_url: "https://github.com/mafhper/personalnews/commit/abc123",
          commit: {
            message: "Refine promo shell",
            author: {
              name: "mafhper",
              date: "2026-03-12T18:00:00Z",
            },
          },
        },
      ],
    });
    vi.stubGlobal("fetch", mockFetch);
  });

  it("shows the feed CTA in both hero and header on home", async () => {
    render(<LandingPage onOpenFeed={vi.fn()} />);
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByTestId("promo-page-home")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /abrir feed/i })).toHaveLength(2);
    expect(screen.getAllByText("Personal News").length).toBeGreaterThan(0);
    expect(document.body.textContent).not.toContain("PersonalNews");
  });

  it("switches promo pages with landing hashes while preserving landing view", async () => {
    render(<LandingPage onOpenFeed={vi.fn()} />);

    await act(async () => {
      window.location.hash = "#project";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });

    expect(screen.getByTestId("promo-page-project")).toBeInTheDocument();
    expect(screen.getByText("Desenvolvimento visível, sem esconder o que mudou.")).toBeInTheDocument();
  });

  it("keeps project sections in the expected order", async () => {
    render(<LandingPage onOpenFeed={vi.fn()} />);

    await act(async () => {
      window.location.hash = "#project";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });

    const stackHeading = screen.getByText(
      "React, Vite e Bun sustentam uma base leve.",
    );
    const commitsHeading = screen.getByText(
      "Desenvolvimento visível, sem esconder o que mudou.",
    );
    const aboutHeading = screen.getByText(
      "mafhper desenvolve o Personal News.",
    );

    expect(
      stackHeading.compareDocumentPosition(commitsHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      commitsHeading.compareDocumentPosition(aboutHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("renders the faq page with controlled accordion items", async () => {
    render(<LandingPage onOpenFeed={vi.fn()} />);

    await act(async () => {
      window.location.hash = "#faq";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });

    expect(screen.getByTestId("promo-page-faq")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Tire suas dúvidas antes de começar.",
      ),
    ).toBeInTheDocument();

    const triggerButtons = screen.getAllByRole("button", { name: /\?$/i });
    expect(triggerButtons.length).toBeGreaterThan(0);
    expect(triggerButtons[0].getAttribute("aria-expanded")).toBe("false");
  });
});
