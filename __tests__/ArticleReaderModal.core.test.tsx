import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Article } from "../types";

type FetchFullContentFn = typeof import("../services/articleFetcher").fetchFullContent;
type OpenExternalLinkFn = typeof import("../utils/openExternalLink").openExternalLink;

let fetchFullContentMock: ReturnType<typeof vi.fn<FetchFullContentFn>>;
let openExternalLinkMock: ReturnType<typeof vi.fn<OpenExternalLinkFn>>;

const readStatusMocks = vi.hoisted(() => ({
  markAsRead: vi.fn(),
}));

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

vi.mock("../hooks/useReadStatus", () => ({
  useReadStatus: () => ({
    markAsRead: readStatusMocks.markAsRead,
  }),
}));

describe("ArticleReaderModal", () => {
  beforeEach(async () => {
    readStatusMocks.markAsRead.mockClear();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => "<html><body></body></html>",
      })),
    );

    const articleFetcher = await import("../services/articleFetcher");
    const externalLink = await import("../utils/openExternalLink");

    fetchFullContentMock = vi
      .spyOn(articleFetcher, "fetchFullContent")
      .mockResolvedValue({
        content: "",
        blocked: false,
        usedFallback: false,
      });
    openExternalLinkMock = vi
      .spyOn(externalLink, "openExternalLink")
      .mockResolvedValue(undefined);
  });

  const mockFullContent = (content: string) => {
    fetchFullContentMock.mockResolvedValue({
      content,
      blocked: false,
      usedFallback: false,
    });
  };

  it("marks the active article as read when the modal opens", async () => {
    const { ArticleReaderModal } = await import(
      "../components/ArticleReaderModal"
    );
    const article: Article = {
      title: "Saved favorite",
      link: "https://example.com/saved-favorite",
      pubDate: new Date("2026-04-29T10:00:00.000Z"),
      sourceTitle: "Example",
      content: "<p>Favorite body.</p>",
    };
    mockFullContent(article.content);

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

    await waitFor(() => {
      expect(readStatusMocks.markAsRead).toHaveBeenCalledWith(article);
    });
  });

  it("marks the next active article as read when modal navigation changes it", async () => {
    const { ArticleReaderModal } = await import(
      "../components/ArticleReaderModal"
    );
    const firstArticle: Article = {
      title: "First favorite",
      link: "https://example.com/first-favorite",
      pubDate: new Date("2026-04-29T10:00:00.000Z"),
      sourceTitle: "Example",
      content: "<p>First body.</p>",
    };
    const nextArticle: Article = {
      title: "Next favorite",
      link: "https://example.com/next-favorite",
      pubDate: new Date("2026-04-30T10:00:00.000Z"),
      sourceTitle: "Example",
      content: "<p>Next body.</p>",
    };
    mockFullContent(firstArticle.content || "");

    const { rerender } = render(
      <ArticleReaderModal
        article={firstArticle}
        onClose={vi.fn()}
        onNext={vi.fn()}
        onPrev={vi.fn()}
        hasNext={true}
        hasPrev={false}
      />,
    );

    await waitFor(() => {
      expect(readStatusMocks.markAsRead).toHaveBeenCalledWith(firstArticle);
    });

    rerender(
      <ArticleReaderModal
        article={nextArticle}
        onClose={vi.fn()}
        onNext={vi.fn()}
        onPrev={vi.fn()}
        hasNext={false}
        hasPrev={true}
      />,
    );

    await waitFor(() => {
      expect(readStatusMocks.markAsRead).toHaveBeenCalledWith(nextArticle);
    });
  });

  it("routes article body links through the external opener", async () => {
    const { ArticleReaderModal } = await import(
      "../components/ArticleReaderModal"
    );
    const article: Article = {
      title: "Apple TV horror series",
      link: "https://www.theverge.com/entertainment/919634/widows-bay-apple-tv-cast-interview",
      pubDate: new Date("2026-04-29T10:00:00.000Z"),
      sourceTitle: "The Verge",
      content:
        '<p>Partial story.</p><p><a href="https://www.theverge.com/entertainment/919634/widows-bay-apple-tv-cast-interview">Read the full story at The Verge.</a></p>',
    };
    mockFullContent(article.content);

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
      expect(openExternalLinkMock).toHaveBeenCalledWith(article.link);
    });
    await waitFor(() => {
      expect(fetchFullContentMock).toHaveBeenCalledWith(article.link);
    });
  });

  it("resolves relative article body links against the article URL", async () => {
    const { ArticleReaderModal } = await import(
      "../components/ArticleReaderModal"
    );
    const article: Article = {
      title: "Relative link story",
      link: "https://example.com/news/story",
      pubDate: new Date("2026-04-29T10:00:00.000Z"),
      sourceTitle: "Example",
      content: '<p><a href="/news/story/full">Read more</a></p>',
    };
    mockFullContent(article.content);

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
      expect(openExternalLinkMock).toHaveBeenCalledWith(
        "https://example.com/news/story/full",
      );
    });
    await waitFor(() => {
      expect(fetchFullContentMock).toHaveBeenCalledWith(article.link);
    });
  });

  it("sanitizes article HTML before injecting it into the modal", async () => {
    const { ArticleReaderModal } = await import(
      "../components/ArticleReaderModal"
    );
    const article: Article = {
      title: "Hostile story",
      link: "https://example.com/news/story",
      pubDate: new Date("2026-04-29T10:00:00.000Z"),
      sourceTitle: "Example",
      content:
        '<p onclick="alert(1)">Safe text</p><img src="data:image/svg+xml;base64,PHN2Zz4=" onerror="alert(1)"><a href="javascript:alert(1)">bad</a>',
    };
    mockFullContent(article.content);

    const { container } = render(
      <ArticleReaderModal
        article={article}
        onClose={vi.fn()}
        onNext={vi.fn()}
        onPrev={vi.fn()}
        hasNext={false}
        hasPrev={false}
      />,
    );

    expect(await screen.findByText("Safe text")).toBeInTheDocument();
    expect(container.innerHTML).not.toContain("onclick");
    expect(container.innerHTML).not.toContain("onerror");
    expect(container.innerHTML).not.toContain("javascript:");
    expect(container.innerHTML).not.toContain("data:image/svg+xml");
    await waitFor(() => {
      expect(fetchFullContentMock).toHaveBeenCalledWith(article.link);
    });
  });
});
