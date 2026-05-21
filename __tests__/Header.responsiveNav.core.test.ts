import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readProjectFile = (path: string) =>
  readFileSync(resolve(process.cwd(), path), "utf8");

describe("Header responsive navigation rules", () => {
  it("keeps many-category desktop navigation on a protected grid", () => {
    const source = readProjectFile("components/Header.tsx");

    expect(source).toContain("feed-header-layout--many-categories");
    expect(source).toContain("hidden md:grid");
    expect(source).toContain("feed-header-category-rail");
    expect(source).toContain("feed-header-actions");
  });

  it("collapses action icons before reducing categories", () => {
    const source = readProjectFile("components/Header.tsx");

    expect(source).toMatch(
      /hasManyCategories\s*\?\s*"hidden 2xl:flex"/,
    );
    expect(source).toMatch(
      /hasManyCategories\s*\?\s*"hidden md:flex 2xl:hidden"/,
    );
    expect(source).toContain('aria-label="Menu de ações"');
  });

  it("hides brand title and logo progressively for compact many-category headers", () => {
    const styles = readProjectFile("index.css");

    expect(styles).toContain("@media (max-width: 1280px)");
    expect(styles).toContain(
      ".feed-header-layout--many-categories .feed-header-brand-title",
    );
    expect(styles).toContain("@media (max-width: 900px)");
    expect(styles).toContain(
      ".feed-header-layout--many-categories .feed-header-brand-logo",
    );
  });

  it("keeps the default category pill proportion from the main header baseline", () => {
    const source = readProjectFile("components/FeedDropdown.tsx");

    expect(source).toContain("default: 'px-5 py-2.5 rounded-full min-h-[44px]'");
  });

  it("replaces All with the virtual Favorites slot instead of rendering both", () => {
    const source = readProjectFile("components/Header.tsx");

    expect(source).toContain('props.primaryView !== "favorites"');
    expect(source).toContain('id: FAVORITES_VIEW_ID');
    expect(source).toContain(
      '...activeCategories.filter((category) => category.id !== "all")',
    );
    expect(source).toContain("visibleCategories.map");
  });

  it("keeps category-only actions hidden for the virtual Favorites dropdown", () => {
    const source = readProjectFile("components/FeedDropdown.tsx");

    expect(source).toContain("isVirtual = false");
    expect(source).toContain("!isVirtual && onEditCategory");
    expect(source).toContain("!isVirtual && !category.isDefault");
  });

  it("renders Favorites dropdown feeds from favorited articles", () => {
    const source = readProjectFile("components/Header.tsx");

    expect(source).toContain("favoriteDropdownFeeds");
    expect(source).toContain("props.favoriteArticles.forEach");
    expect(source).toContain("buildFavoriteSourceKey");
    expect(source).toContain("categoryId: FAVORITES_VIEW_ID");
    expect(source).toContain(
      "isFavoritesSlot\n                  ? favoriteDropdownFeeds",
    );
  });

  it("keeps dropdown headers category-agnostic and primary actions icon-only", () => {
    const source = readProjectFile("components/FeedDropdown.tsx");

    expect(source).not.toContain('`View ${category.name}`');
    expect(source).not.toContain(
      '`${t("feeds.tab.feeds")} de ${category.name}`',
    );
    expect(source).toContain("primaryViewActionIcon");
    expect(source).toContain(
      '<PrimaryViewIcon showBackground={false} size="sm" />',
    );
  });

  it("keeps Favorites source filtering separate from real feed URL selection", () => {
    const source = readProjectFile("components/AppContent.tsx");

    expect(source).toContain("selectedFavoriteSourceKey");
    expect(source).toContain("setSelectedFeedUrl(null)");
    expect(source).toContain("matchesFavoriteSourceKey");
  });
});
