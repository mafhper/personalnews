import { describe, expect, it } from "vitest";
import { buildImagePlaceholderDataUri } from "../utils/imagePlaceholders";

const decodeDataUriSvg = (uri: string) =>
  decodeURIComponent(uri.replace(/^data:image\/svg\+xml,/, ""));

describe("buildImagePlaceholderDataUri", () => {
  it("builds a source-aware ambient fallback instead of the old gray placeholder", () => {
    const svg = decodeDataUriSvg(
      buildImagePlaceholderDataUri({
        width: 1200,
        height: 800,
        label: "The Verge",
        feedUrl: "https://www.theverge.com/rss/index.xml",
        tone: "brand",
        variant: "ambient",
      }),
    );

    expect(svg).toContain("The Verge");
    expect(svg).toContain("theverge.com");
    expect(svg).toContain(">TV</text>");
    expect(svg).toContain("Imagem indisponivel");
    expect(svg).toContain("id=\"accentBar\"");
    expect(svg).not.toContain("VISUAL LOCAL");
    expect(svg).not.toContain("IMAGEM INDISPONIVEL");
  });
});
