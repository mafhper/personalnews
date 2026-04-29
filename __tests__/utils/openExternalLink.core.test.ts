import { afterEach, describe, expect, it, vi } from "vitest";
import { openExternalLink } from "../../utils/openExternalLink";
import { allowConsoleWarn } from "../../src/test-console";

type TauriWindow = Window & {
  __TAURI_INTERNALS__?: {
    invoke?: ReturnType<typeof vi.fn>;
  };
};

describe("openExternalLink", () => {
  afterEach(() => {
    delete (window as TauriWindow).__TAURI_INTERNALS__;
  });

  it("uses the desktop opener when Tauri invoke is available", async () => {
    const invoke = vi.fn(async () => undefined);
    (window as TauriWindow).__TAURI_INTERNALS__ = { invoke };
    const openSpy = vi.spyOn(window, "open");

    await openExternalLink("https://example.com/story");

    expect(invoke).toHaveBeenCalledWith("open_external_url", {
      url: "https://example.com/story",
    });
    expect(openSpy).not.toHaveBeenCalled();
  });

  it("does not fall back to an in-app WebView when the desktop opener fails", async () => {
    allowConsoleWarn("[external-link] failed to use desktop opener");
    const invoke = vi.fn(async () => {
      throw new Error("native opener unavailable");
    });
    (window as TauriWindow).__TAURI_INTERNALS__ = { invoke };
    const openSpy = vi.spyOn(window, "open");

    await openExternalLink("https://example.com/story");

    expect(invoke).toHaveBeenCalledOnce();
    expect(openSpy).not.toHaveBeenCalled();
  });

  it("uses a new browser window outside the desktop runtime", async () => {
    const openedWindow = { opener: {} } as Window;
    const openSpy = vi.spyOn(window, "open").mockReturnValue(openedWindow);

    await openExternalLink("https://example.com/story");

    expect(openSpy).toHaveBeenCalledWith(
      "https://example.com/story",
      "_blank",
      "noopener,noreferrer",
    );
    expect(openedWindow.opener).toBeNull();
  });
});
