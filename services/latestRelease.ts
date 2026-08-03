export type ReleasePlatformKey = "windows" | "macos" | "linux";

export type LatestReleaseAssets = Partial<Record<ReleasePlatformKey, string>>;

const LATEST_RELEASE_API_URL =
  "https://api.github.com/repos/mafhper/personalnews/releases/latest";

const ASSET_SUFFIXES: Record<ReleasePlatformKey, string[]> = {
  windows: ["_x64-setup.exe"],
  macos: ["_aarch64.dmg"],
  linux: ["_amd64.deb"],
};

type GitHubAsset = {
  name?: string;
  browser_download_url?: string;
};

type GitHubLatestRelease = {
  assets?: GitHubAsset[];
};

const REQUEST_TIMEOUT_MS = 8000;

let cachedAssets: LatestReleaseAssets | null | undefined;

const pickAssetBySuffix = (
  assets: GitHubAsset[],
  suffixes: string[],
): string | undefined => {
  const asset = assets.find((item) =>
    suffixes.some((suffix) => item.name?.endsWith(suffix)),
  );
  return asset?.browser_download_url;
};

export const clearLatestReleaseCache = (): void => {
  cachedAssets = undefined;
};

export const getLatestReleaseAssets = async (): Promise<LatestReleaseAssets | null> => {
  if (cachedAssets !== undefined) return cachedAssets;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(LATEST_RELEASE_API_URL, {
      headers: { Accept: "application/vnd.github+json" },
      signal: controller.signal,
    });
    if (!response.ok) {
      cachedAssets = null;
      return cachedAssets;
    }

    const release = (await response.json()) as GitHubLatestRelease;
    const assets = release.assets ?? [];

    const resolved: LatestReleaseAssets = {};
    (Object.keys(ASSET_SUFFIXES) as ReleasePlatformKey[]).forEach((key) => {
      const url = pickAssetBySuffix(assets, ASSET_SUFFIXES[key]);
      if (url) resolved[key] = url;
    });

    cachedAssets = resolved;
    return cachedAssets;
  } catch {
    cachedAssets = null;
    return cachedAssets;
  } finally {
    clearTimeout(timeout);
  }
};