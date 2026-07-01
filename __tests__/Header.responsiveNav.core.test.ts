import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readProjectFile = (path: string) =>
  readFileSync(resolve(process.cwd(), path), "utf8");

const readStyleRule = (styles: string, selector: string) => {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return styles.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`))?.[1] ?? "";
};

describe("Header responsive navigation rules", () => {
  it("keeps many-category desktop navigation on a protected grid", () => {
    const source = readProjectFile("components/Header.tsx");

    expect(source).toContain("feed-header-layout--many-categories");
    expect(source).toContain("hidden md:grid");
    expect(source).toContain("feed-header-category-rail");
    expect(source).toContain("feed-header-actions");
  });

  it("centers desktop categories independently from brand and actions", () => {
    const styles = readProjectFile("index.css");
    const source = readProjectFile("components/Header.tsx");
    const layoutRule = readStyleRule(styles, ".feed-header-layout");
    const brandRule = readStyleRule(styles, ".feed-header-brand");
    const railRule = readStyleRule(styles, ".feed-header-category-rail");
    const scrollRule = readStyleRule(styles, ".feed-header-category-scroll");
    const actionsRule = readStyleRule(styles, ".feed-header-actions");

    expect(layoutRule).toContain(
      "grid-template-columns: minmax(var(--space-12), 1fr) minmax(0, max-content) minmax(var(--space-12), 1fr);",
    );
    expect(brandRule).toContain("grid-column: 1;");
    expect(brandRule).toContain("justify-self: start;");
    expect(railRule).toContain("grid-column: 2;");
    expect(railRule).toContain("width: fit-content;");
    expect(railRule).toContain("max-width: 100%;");
    expect(railRule).toContain("justify-self: center;");
    expect(scrollRule).toContain("width: max-content;");
    expect(actionsRule).toContain("grid-column: 3;");
    expect(actionsRule).toContain("justify-self: end;");
    expect(styles).not.toMatch(
      /@media \(max-width: 900px\)[\s\S]*?\.feed-header-layout--many-categories\s*\{\s*grid-template-columns:\s*minmax\(0, 1fr\) auto;\s*\}/,
    );
    expect(source).toMatch(
      /feed-header-category-scroll[^`]*\bmax-w-full\b[^`]*\boverflow-x-auto\b/,
    );
  });

  it("lets the desktop header use the available viewport width before categories overflow", () => {
    const source = readProjectFile("components/Header.tsx");

    expect(source).toMatch(/floating:\s*"[^"]*w-\[96%\][^"]*"/);
    expect(source).not.toMatch(/floating:\s*"[^"]*max-w-7xl/);
    expect(source).toContain(
      "feed-header-inner mx-auto w-full px-3 sm:px-4",
    );
    expect(source).not.toContain("!isFloating ? 'container' : ''");
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

  it("keeps category pill proportions synchronized with header height", () => {
    const source = readProjectFile("components/FeedDropdown.tsx");

    expect(source).toContain('headerHeight?: HeaderConfig["height"]');
    expect(source).toContain("'ultra-compact': 'px-3 py-1 rounded-full min-h-[30px]'");
    expect(source).toContain("spacious: 'px-5 py-2.5 rounded-full min-h-[44px]'");
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

  it("hosts favorites filters inside the header contract", () => {
    const source = readProjectFile("components/Header.tsx");

    expect(source).toContain("favoriteToolbar?: HeaderFavoriteToolbarProps");
    expect(source).toContain("FavoritesHeaderToolbar");
    expect(source).toContain("favoriteToolbarVariant");
    expect(source).toContain("favorites-header-toolbar-drawer");
    expect(source).toContain("feed-header-reveal-cluster");
  });

  it("exposes the favorites toolbar variant in layout settings", () => {
    const settingsSource = readProjectFile("components/SettingsSidebar.tsx");
    const typesSource = readProjectFile("types.ts");
    const defaultsSource = readProjectFile("config/defaultConfig.ts");
    const initialSetup = readProjectFile("config/initial-setup.md");
    const generatedConfig = readProjectFile("constants/curatedFeeds.ts");

    expect(typesSource).toContain('favoriteToolbarVariant?: "inline" | "drawer"');
    expect(defaultsSource).toContain("initialConfig.favoriteToolbarVariant");
    expect(generatedConfig).toContain('"favoriteToolbarVariant": "inline"');
    expect(initialSetup).toContain("- Filtros de Favoritos: inline;");
    expect(settingsSource).toContain("Filtros de Favoritos");
    expect(settingsSource).toContain("Faixa inline");
    expect(settingsSource).toContain("Gaveta no header");
  });

  it("keeps the hidden header recoverable from a compact reveal cluster", () => {
    const source = readProjectFile("components/Header.tsx");
    const styles = readProjectFile("index.css");

    expect(source).toContain("Mostrar cabeçalho");
    expect(source).toContain("Abrir filtros de favoritos");
    expect(source).toContain("Esconder cabeçalho");
    expect(styles).toContain(".feed-header-reveal-cluster");
    expect(styles).toContain(".feed-header-reveal-control--filters");
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
    const appContent = readProjectFile("components/AppContent.tsx");
    const filters = readProjectFile("utils/favoriteViewFilters.ts");

    expect(appContent).toContain("selectedFavoriteSourceKey");
    expect(appContent).toContain("setSelectedFeedUrl(null)");
    expect(appContent).toContain("filterAndSortFavorites");
    expect(appContent).toContain("sourceKey: selectedFavoriteSourceKey");
    expect(filters).toContain("matchesFavoriteSourceKey");
  });
});
