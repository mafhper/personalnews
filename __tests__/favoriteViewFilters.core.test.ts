import { describe, expect, it, vi } from "vitest";
import type { FavoriteArticle } from "../hooks/useFavorites";
import {
  filterAndSortFavorites,
  getFavoriteToolbarOptions,
} from "../utils/favoriteViewFilters";

const makeFavorite = (
  overrides: Partial<FavoriteArticle> & Pick<FavoriteArticle, "title" | "link">,
): FavoriteArticle => ({
  id: overrides.link,
  title: overrides.title,
  link: overrides.link,
  pubDate: "2026-03-20T12:00:00.000Z",
  sourceTitle: "Example",
  feedUrl: "https://example.com/feed.xml",
  categories: ["Tech"],
  mediaType: "article",
  favoritedAt: "2026-03-20T14:00:00.000Z",
  ...overrides,
});

const baseOptions = {
  readFilter: "all" as const,
  mediaFilter: "all" as const,
  categoryFilter: "all",
  sourceKey: null,
  sortMode: "saved-desc" as const,
  isArticleRead: vi.fn(() => false),
};

describe("favoriteViewFilters", () => {
  it("sorts by favoritedAt descending by default", () => {
    const oldest = makeFavorite({
      title: "Oldest",
      link: "https://example.com/oldest",
      favoritedAt: "2026-03-20T10:00:00.000Z",
    });
    const newest = makeFavorite({
      title: "Newest",
      link: "https://example.com/newest",
      favoritedAt: "2026-03-22T10:00:00.000Z",
    });

    const result = filterAndSortFavorites([oldest, newest], baseOptions);

    expect(result.map((favorite) => favorite.title)).toEqual([
      "Newest",
      "Oldest",
    ]);
  });

  it("sorts by pubDate descending", () => {
    const older = makeFavorite({
      title: "Older publication",
      link: "https://example.com/older-publication",
      pubDate: "2026-03-19T10:00:00.000Z",
    });
    const newer = makeFavorite({
      title: "Newer publication",
      link: "https://example.com/newer-publication",
      pubDate: "2026-03-21T10:00:00.000Z",
    });

    const result = filterAndSortFavorites([older, newer], {
      ...baseOptions,
      sortMode: "published-desc",
    });

    expect(result.map((favorite) => favorite.title)).toEqual([
      "Newer publication",
      "Older publication",
    ]);
  });

  it("filters by mediaType", () => {
    const article = makeFavorite({
      title: "Article",
      link: "https://example.com/article",
      mediaType: "article",
    });
    const podcast = makeFavorite({
      title: "Podcast",
      link: "https://example.com/podcast",
      audioUrl: "https://cdn.example.com/podcast.mp3",
      mediaType: "podcast",
    });

    const result = filterAndSortFavorites([article, podcast], {
      ...baseOptions,
      mediaFilter: "podcast",
    });

    expect(result).toEqual([podcast]);
  });

  it("filters by category", () => {
    const tech = makeFavorite({
      title: "Tech",
      link: "https://example.com/tech",
      categories: ["Tech"],
    });
    const design = makeFavorite({
      title: "Design",
      link: "https://example.com/design",
      categories: ["Design"],
    });

    const result = filterAndSortFavorites([tech, design], {
      ...baseOptions,
      categoryFilter: "design",
    });

    expect(result).toEqual([design]);
  });

  it("filters by canonical source across favorites with and without feedUrl", () => {
    const withFeedUrl = makeFavorite({
      title: "Canonical with feed",
      link: "https://example.com/with-feed",
      sourceTitle: "Same Source",
      feedUrl: "https://example.com/a.xml",
    });
    const withoutFeedUrl = makeFavorite({
      title: "Canonical without feed",
      link: "https://example.com/without-feed",
      sourceTitle: "Same Source",
      feedUrl: undefined,
    });
    const other = makeFavorite({
      title: "Other source",
      link: "https://example.com/other",
      sourceTitle: "Other Source",
      feedUrl: "https://example.com/other.xml",
    });

    const sourceKey = getFavoriteToolbarOptions([
      withFeedUrl,
      withoutFeedUrl,
      other,
    ]).sources.find((source) => source.label === "Same Source")?.value;

    const result = filterAndSortFavorites([withFeedUrl, withoutFeedUrl, other], {
      ...baseOptions,
      sourceKey: sourceKey || null,
    });

    expect(result.map((favorite) => favorite.title)).toEqual([
      "Canonical with feed",
      "Canonical without feed",
    ]);
  });

  it("filters read and unread favorites through the callback", () => {
    const read = makeFavorite({
      title: "Read",
      link: "https://example.com/read",
    });
    const unread = makeFavorite({
      title: "Unread",
      link: "https://example.com/unread",
    });
    const isArticleRead = vi.fn((article) => article.link === read.link);

    expect(
      filterAndSortFavorites([read, unread], {
        ...baseOptions,
        readFilter: "read",
        isArticleRead,
      }),
    ).toEqual([read]);
    expect(
      filterAndSortFavorites([read, unread], {
        ...baseOptions,
        readFilter: "unread",
        isArticleRead,
      }),
    ).toEqual([unread]);
  });
});
