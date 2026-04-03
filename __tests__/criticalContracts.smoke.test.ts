import { describe, expect, it } from "vitest";
import { defaultThemePresets, validateTheme } from "../services/themeUtils";
import { getFeedDisplayName } from "../utils/feedDisplay";
import { getVideoEmbedDetails } from "../utils/videoEmbed";

describe("critical contracts smoke", () => {
  it("extracts youtube embeds for short links", () => {
    const embed = getVideoEmbedDetails("https://youtu.be/dQw4w9WgXcQ");

    expect(embed?.provider).toBe("youtube");
    expect(embed?.id).toBe("dQw4w9WgXcQ");
  });

  it("prefers the display name chosen by the user", () => {
    const displayName = getFeedDisplayName({
      url: "https://example.com/feed.xml",
      customTitle: "Meu Feed",
    });

    expect(displayName).toBe("Meu Feed");
  });

  it("keeps default presets valid", () => {
    expect(validateTheme(defaultThemePresets[0].theme)).toBe(true);
  });
});
