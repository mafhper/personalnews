import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf-8");

describe("feed layout polish wiring", () => {
  const longTitle =
    "Japan can’t make robot wolves fast enough to counter the rise in bear attacks that have killed 13 humans this year — $4,000+ animatronic Monster Wolf features intense LEDs and makes loud noises";

  it("caps Gallery at four columns", () => {
    const source = read("components/layouts/GalleryLayout.tsx");
    expect(source).toContain("lg:grid-cols-4");
    expect(source).not.toContain("2xl:grid-cols-5");
  });

  it("keeps Brutalist images in original color", () => {
    const source = read("components/layouts/BrutalistLayout.tsx");
    expect(source).not.toContain("grayscale");
    expect(source).not.toContain("brightness-90");
  });

  it("uses the requested Magazine slice counts", () => {
    const source = read("components/layouts/MagazineLayout.tsx");
    expect(source).toContain("visibleArticles.slice(1, 7)");
    expect(source).toContain("visibleArticles.slice(7, 19)");
    expect(source).not.toContain("layout.latest");
  });

  it("keeps Magazine actions in top rails and copy in bottom blocks", () => {
    const source = read("components/layouts/MagazineLayout.tsx");
    expect(source).toContain("feed-card-top-rail");
    expect(source).toContain("feed-card-action-rail");
    expect(source).toContain("feed-card-bottom-copy");
    expect(source).toContain("compact");
    expect(source).toContain("feed-card-title-clamp");
  });

  it("routes Magazine through the polished full layout", () => {
    const source = read("components/FeedContent.tsx");
    expect(source).toContain("default: m.MagazineLayout");
    expect(source).toContain("'magazine', 'masonry'");
    expect(source).toContain("case 'magazine': return <MagazineLayout");
  });

  it("uses three Modern featured items without a text-only aside slice", () => {
    const source = read("components/layouts/ModernPortalLayout.tsx");
    expect(source).toContain("articles.slice(3, 6)");
    expect(source).not.toContain("sidebarFeed");
  });

  it("keeps overlay layouts split into top rail and bottom copy zones", () => {
    for (const path of [
      "components/layouts/GalleryLayout.tsx",
      "components/layouts/ModernPortalLayout.tsx",
    ]) {
      const source = read(path);
      expect(source).toContain("feed-image-story-top-rail");
      expect(source).toContain("feed-image-story-bottom-copy");
      expect(source).toContain("feed-card-action-rail");
      expect(source).toContain("compact");
    }
  });

  it("removes Newspaper secondary stories below the hero", () => {
    const source = read("components/layouts/NewspaperLayout.tsx");
    expect(source).toContain("const rest = articles.slice(1)");
    expect(source).not.toContain("const secondary");
    expect(source).not.toContain("{secondary.length > 0");
  });

  it("keeps Newspaper, Masonry, Immersive, Brutalist, and ArticleItem on top-rail composition", () => {
    for (const path of [
      "components/layouts/NewspaperLayout.tsx",
      "components/layouts/MasonryLayout.tsx",
      "components/layouts/ImmersiveLayout.tsx",
      "components/layouts/BrutalistLayout.tsx",
      "components/ArticleItem.tsx",
    ]) {
      const source = read(path);
      expect(source).toContain("feed-card-action-rail");
      expect(source).toContain("feed-card-bottom-copy");
      expect(source).toContain("compact");
    }
  });

  it("keeps feed action links hover-revealed in the polished layouts", () => {
    for (const path of [
      "components/ArticleItem.tsx",
      "components/layouts/MagazineLayout.tsx",
      "components/layouts/MasonryLayout.tsx",
      "components/layouts/NewspaperLayout.tsx",
      "components/layouts/GalleryLayout.tsx",
      "components/layouts/ModernPortalLayout.tsx",
      "components/layouts/ImmersiveLayout.tsx",
      "components/layouts/BrutalistLayout.tsx",
    ]) {
      expect(read(path)).toContain("FeedInteractiveActions");
      expect(read(path)).not.toContain("forceVisible");
    }
  });

  it("uses responsive date rendering where card metadata can be squeezed", () => {
    for (const path of [
      "components/ArticleItem.tsx",
      "components/layouts/MagazineLayout.tsx",
      "components/layouts/MasonryLayout.tsx",
      "components/layouts/NewspaperLayout.tsx",
      "components/layouts/GalleryLayout.tsx",
      "components/layouts/ModernPortalLayout.tsx",
      "components/layouts/ImmersiveLayout.tsx",
      "components/layouts/BrutalistLayout.tsx",
    ]) {
      expect(read(path)).toContain("FeedResponsiveDate");
    }

    const css = read("index.css");
    expect(css).toContain(".feed-responsive-date");
    expect(css).toContain("@container (max-width: 13rem)");
  });

  it("keeps title clamps for long headline fixtures", () => {
    expect(longTitle.length).toBeGreaterThan(140);

    for (const path of [
      "components/ArticleItem.tsx",
      "components/layouts/MagazineLayout.tsx",
      "components/layouts/MasonryLayout.tsx",
      "components/layouts/NewspaperLayout.tsx",
      "components/layouts/GalleryLayout.tsx",
      "components/layouts/ImmersiveLayout.tsx",
    ]) {
      expect(read(path)).toContain("feed-card-title-clamp");
    }
  });
});
