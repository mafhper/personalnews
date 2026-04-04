import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ArticleItem } from "../components/ArticleItem";
import type { Article } from "../types";

vi.mock("../hooks/usePerformance", () => ({
  usePerformance: () => ({
    startRenderTiming: vi.fn(),
    endRenderTiming: vi.fn(),
  }),
}));

vi.mock("../hooks/useArticleLayout", () => ({
  useArticleLayout: () => ({
    settings: {
      showPublicationTime: false,
    },
  }),
}));

vi.mock("../hooks/useAppearance", () => ({
  useAppearance: () => ({
    contentConfig: {
      showTags: true,
      showAuthor: true,
      showDate: true,
      showTime: false,
    },
  }),
}));

describe("ArticleItem reader navigation", () => {
  it("opens the internal reader without exposing a title link", () => {
    const onClick = vi.fn();
    const article: Article = {
      title: "Headline",
      link: "https://example.com/headline",
      pubDate: new Date("2026-04-04T12:00:00.000Z"),
      sourceTitle: "Example",
      description: "Summary",
    };

    render(<ArticleItem article={article} onClick={onClick} />);

    expect(
      screen.queryByRole("link", { name: /headline/i }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Article: Headline/i }));

    expect(onClick).toHaveBeenCalledWith(article);
  });
});
