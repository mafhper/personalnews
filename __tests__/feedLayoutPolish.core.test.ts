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

  it("labels Brutalist as a reusable layout instead of a video-only feed", () => {
    const source = read("components/layouts/BrutalistLayout.tsx");

    expect(source).toContain("BRUTALIST");
    expect(source).not.toContain("VIDEO_FEED");
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

  it("builds Newspaper as an editorial desk with category metadata", () => {
    const source = read("components/layouts/NewspaperLayout.tsx");
    const feedContent = read("components/FeedContent.tsx");
    expect(source).toContain("editionLabel");
    expect(source).toContain("newspaper-latest");
    expect(source).toContain("newspaper-story-flow");
    expect(feedContent).toContain("editionLabel=");
    expect(feedContent).toContain("editionColor=");
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

  it("caps tall viewport media surfaces instead of scaling with viewport height", () => {
    const css = read("index.css");
    expect(css).toContain("min-height: min(calc(100svh - 144px), 820px)");
    expect(css).toContain(
      "@media (min-width: 981px) and (orientation: portrait)",
    );

    const immersive = read("components/layouts/ImmersiveLayout.tsx");
    expect(immersive).toContain("h-[clamp(24rem,52vw,38rem)]");
    expect(immersive).toContain("h-[clamp(22rem,42vw,32rem)]");
    expect(immersive).not.toContain("min-h-[46vh]");
    expect(immersive).not.toContain("min-h-[45vh]");

    const masonry = read("components/layouts/MasonryLayout.tsx");
    expect(masonry).toContain("h-[clamp(24rem,46vw,40rem)]");
    expect(masonry).not.toContain("h-[60vh]");
  });

  it("normalizes feed top clearance through the main header offset", () => {
    const css = read("index.css");
    const header = read("components/Header.tsx");

    expect(css).toContain("--feed-header-content-gap: 2.5rem");
    expect(css).toContain("--feed-layout-top-clearance: var(--space-6)");
    expect(css).toContain(".feed-layout[data-layout=\"modern\"]");
    expect(css).toContain("--feed-layout-top-clearance: var(--space-8)");
    expect(css).toContain(".feed-layout[data-layout=\"compact\"]");
    expect(css).toContain("--feed-layout-top-clearance: var(--space-5)");
    expect(css).toContain("padding-top: var(--feed-layout-top-clearance)");
    expect(css).toContain('.feed-layout[data-layout="immersive"] > div');
    expect(header).toContain("var(--feed-header-content-gap, 2.5rem)");
    expect(header).not.toContain("showFavoriteToolbar ? Math.min");
    expect(css).not.toContain("var(--feed-header-offset, 64px)\n  );");
    expect(css).not.toContain("var(--feed-header-offset, 56px) + 0.25rem");
  });

  it("keeps favorite actions grouped with read and visit controls where requested", () => {
    for (const path of [
      "components/layouts/BentoLayout.tsx",
      "components/layouts/FocusLayout.tsx",
      "components/layouts/PortalLayout.tsx",
      "components/layouts/SplitLayout.tsx",
      "components/layouts/TimelineLayout.tsx",
    ]) {
      const source = read(path);
      expect(source).toContain("feed-card-action-rail");
      expect(source).toContain("FeedInteractiveActions");
      expect(source).toContain("FavoriteButton");
    }

    const gallery = read("components/layouts/GalleryLayout.tsx");
    expect(gallery.indexOf("feed-image-story-bottom-copy")).toBeLessThan(
      gallery.indexOf("feed-card-action-rail mb-2 justify-start"),
    );

    const compact = read("components/layouts/CompactLayout.tsx");
    expect(compact).toContain("opacity-0 group-hover:opacity-100");
    expect(compact).not.toContain("opacity-60 group-hover:opacity-100");
  });

  it("keeps the first Modern stories actions in the top right of their media", () => {
    const source = read("components/layouts/ModernPortalLayout.tsx");
    expect(source).toContain("absolute right-5 top-5");
    expect(source).toContain("absolute right-3 top-3");
    expect(source).not.toContain("absolute bottom-5 right-5");
  });
});
