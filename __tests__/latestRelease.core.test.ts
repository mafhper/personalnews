import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearLatestReleaseCache,
  getLatestReleaseAssets,
} from "../services/latestRelease";

const releaseAssets = [
  {
    name: "PersonalNews_1.17.1_x64_pt-BR.msi",
    browser_download_url:
      "https://github.com/mafhper/personalnews/releases/download/v1.17.1/PersonalNews_1.17.1_x64_pt-BR.msi",
  },
  {
    name: "PersonalNews_1.17.1_x64-setup.exe",
    browser_download_url:
      "https://github.com/mafhper/personalnews/releases/download/v1.17.1/PersonalNews_1.17.1_x64-setup.exe",
  },
  {
    name: "PersonalNews_1.17.1_aarch64.dmg",
    browser_download_url:
      "https://github.com/mafhper/personalnews/releases/download/v1.17.1/PersonalNews_1.17.1_aarch64.dmg",
  },
  {
    name: "PersonalNews_1.17.1_amd64.deb",
    browser_download_url:
      "https://github.com/mafhper/personalnews/releases/download/v1.17.1/PersonalNews_1.17.1_amd64.deb",
  },
];

const jsonResponse = (payload: unknown, ok = true) =>
  ({
    ok,
    status: ok ? 200 : 403,
    json: async () => payload,
  }) as Response;

describe("latestRelease service", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    clearLatestReleaseCache();
    fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ assets: releaseAssets }) as Response,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("resolves the direct installer asset for every supported platform", async () => {
    const assets = await getLatestReleaseAssets();

    expect(assets).toEqual({
      windows:
        "https://github.com/mafhper/personalnews/releases/download/v1.17.1/PersonalNews_1.17.1_x64-setup.exe",
      macos:
        "https://github.com/mafhper/personalnews/releases/download/v1.17.1/PersonalNews_1.17.1_aarch64.dmg",
      linux:
        "https://github.com/mafhper/personalnews/releases/download/v1.17.1/PersonalNews_1.17.1_amd64.deb",
    });
  });

  it("picks the setup exe over other Windows assets", async () => {
    const assets = await getLatestReleaseAssets();

    expect(assets?.windows).toContain("_x64-setup.exe");
  });

  it("returns null when the latest release endpoint fails", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, false) as Response);

    expect(await getLatestReleaseAssets()).toBeNull();
  });

  it("returns null when the request itself fails", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));

    expect(await getLatestReleaseAssets()).toBeNull();
  });

  it("reuses the resolved result without refetching", async () => {
    await getLatestReleaseAssets();
    await getLatestReleaseAssets();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("resolves a fresh request after the cache is cleared", async () => {
    await getLatestReleaseAssets();
    clearLatestReleaseCache();
    await getLatestReleaseAssets();

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});