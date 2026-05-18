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
});
