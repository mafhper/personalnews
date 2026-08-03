import { useEffect, useState } from "react";
import {
  getLatestReleaseAssets,
  type LatestReleaseAssets,
  type ReleasePlatformKey,
} from "../services/latestRelease";

export const RELEASE_PLATFORM_BY_LABEL: Record<string, ReleasePlatformKey> = {
  Windows: "windows",
  macOS: "macos",
  Linux: "linux",
};

export const useLatestReleaseAssets = (): LatestReleaseAssets | null => {
  const [assets, setAssets] = useState<LatestReleaseAssets | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const resolved = await getLatestReleaseAssets();
      if (active) setAssets(resolved);
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  return assets;
};