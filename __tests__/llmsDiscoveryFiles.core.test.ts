import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readPublicFile = (path: string) =>
  readFileSync(resolve(process.cwd(), "public", path), "utf8");

describe("AI discovery metadata files", () => {
  it("publishes the full static discovery file set", () => {
    for (const file of [
      "llms.txt",
      "llms-full.txt",
      "robots.txt",
      "sitemap.xml",
      "humans.txt",
      "schema.org.json",
      "openapi.json",
      "feed.xml",
    ]) {
      expect(existsSync(resolve(process.cwd(), "public", file))).toBe(true);
    }
  });

  it("publishes LLM context with real public project URLs", () => {
    const llms = readPublicFile("llms.txt");
    const full = readPublicFile("llms-full.txt");

    expect(llms).toContain("https://mafhper.github.io/personalnews/");
    expect(llms).toContain("https://github.com/mafhper/personalnews");
    expect(llms).toContain("https://mafhper.github.io/personalnews/llms-full.txt");
    expect(llms).toContain("https://mafhper.github.io/personalnews/humans.txt");
    expect(llms).toContain("https://mafhper.github.io/personalnews/openapi.json");
    expect(llms).not.toMatch(/placeholder|api\.personalnews\.app|\/schemas|\/api(?!\.json)/i);
    expect(full).toContain("does not provide a hosted account system");
    expect(full).toContain("Do not crawl, index, or publish local workspace paths");
    expect(full).not.toMatch(/placeholder|api\.personalnews\.app|\.dev\/tasks/i);
  });

  it("keeps robots and sitemap aligned to the GitHub Pages deployment", () => {
    const robots = readPublicFile("robots.txt");
    const sitemap = readPublicFile("sitemap.xml");

    expect(robots).toContain(
      "Sitemap: https://mafhper.github.io/personalnews/sitemap.xml",
    );
    expect(robots).toContain("https://mafhper.github.io/personalnews/llms.txt");
    expect(sitemap).toContain("https://mafhper.github.io/personalnews/");
    expect(sitemap).toContain("https://mafhper.github.io/personalnews/llms.txt");
    expect(sitemap).toContain(
      "https://mafhper.github.io/personalnews/schema.org.json",
    );
    expect(sitemap).not.toContain("https://github.com/mafhper/personalnews");
  });

  it("publishes parseable schema and OpenAPI metadata without fake API hosts", () => {
    const schema = JSON.parse(readPublicFile("schema.org.json"));
    const openapi = JSON.parse(readPublicFile("openapi.json"));

    expect(schema).toMatchObject({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Personal News",
      url: "https://mafhper.github.io/personalnews/",
      codeRepository: "https://github.com/mafhper/personalnews",
      softwareVersion: "1.13.6",
    });
    expect(openapi.servers[0].url).toBe("https://mafhper.github.io/personalnews");
    expect(openapi.info.description).toContain("does not expose a hosted user-feed API");
    expect(JSON.stringify(openapi)).not.toContain("api.personalnews.app");
  });

  it("links public discovery files from the application document", () => {
    const html = readFileSync(resolve(process.cwd(), "index.html"), "utf8");

    expect(html).toContain('rel="sitemap"');
    expect(html).toContain('title="Personal News LLM context"');
    expect(html).toContain('href="./llms.txt"');
    expect(html).toContain('href="./llms-full.txt"');
    expect(html).toContain('href="./humans.txt"');
    expect(html).toContain('href="./sitemap.xml"');
    expect(html).toContain('type="application/rss+xml"');
    expect(html).toContain('href="./feed.xml"');
    expect(html).toContain('href="./schema.org.json"');
  });
});
