import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ArticleReaderModal } from "../components/ArticleReaderModal";
import { openExternalLink } from "../utils/openExternalLink";
import type { Article } from "../types";

vi.mock("../services/environmentDetector", () => ({
  detectEnvironment: () => ({ isTauri: false }),
}));

vi.mock("../hooks/useLanguage", () => ({
  useLanguage: () => ({
    t: (key: string) =>
      ({
        "action.back": "Back",
        "action.visit": "Visit",
        "action.prev": "Previous",
        "action.next": "Next",
        "action.focus_mode": "Focus mode",
        loading: "Loading",
      })[key] || key,
  }),
}));

vi.mock("../hooks/useModal", () => ({
  useModal: () => ({
    setModalOpen: vi.fn(),
  }),
}));

vi.mock("../utils/openExternalLink", () => ({
  openExternalLink: vi.fn(async () => {}),
}));

vi.mock("../services/articleFetcher", () => ({
  fetchFullContent: vi.fn(async () => ({ content: "" })),
}));

describe("ArticleReaderModal", () => {
  it("routes article body links through the external opener", async () => {
    const article: Article = {
      title: "Apple TV horror series",
      link: "https://www.theverge.com/entertainment/919634/widows-bay-apple-tv-cast-interview",
      pubDate: new Date("2026-04-29T10:00:00.000Z"),
      sourceTitle: "The Verge",
      content:
        '<p>Partial story.</p><p><a href="https://www.theverge.com/entertainment/919634/widows-bay-apple-tv-cast-interview">Read the full story at The Verge.</a></p>',
    };

    render(
      <ArticleReaderModal
        article={article}
        onClose={vi.fn()}
        onNext={vi.fn()}
        onPrev={vi.fn()}
        hasNext={false}
        hasPrev={false}
      />,
    );

    const fullStoryLink = await screen.findByRole("link", {
      name: /read the full story at the verge/i,
    });
    fireEvent.click(fullStoryLink);

    await waitFor(() => {
      expect(openExternalLink).toHaveBeenCalledWith(article.link);
    });
  });

  it("resolves relative article body links against the article URL", async () => {
    const article: Article = {
      title: "Relative link story",
      link: "https://example.com/news/story",
      pubDate: new Date("2026-04-29T10:00:00.000Z"),
      sourceTitle: "Example",
      content: '<p><a href="/news/story/full">Read more</a></p>',
    };

    render(
      <ArticleReaderModal
        article={article}
        onClose={vi.fn()}
        onNext={vi.fn()}
        onPrev={vi.fn()}
        hasNext={false}
        hasPrev={false}
      />,
    );

    fireEvent.click(await screen.findByRole("link", { name: /read more/i }));

    await waitFor(() => {
      expect(openExternalLink).toHaveBeenCalledWith(
        "https://example.com/news/story/full",
      );
    });
  });
});
