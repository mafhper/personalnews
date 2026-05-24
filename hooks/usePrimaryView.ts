import { useLocalStorage } from "./useLocalStorage";

export type PrimaryView = "all" | "favorites";

export const PRIMARY_VIEW_STORAGE_KEY = "personalnews-primary-view";
export const FAVORITES_VIEW_ID = "favorites";
export const DEFAULT_PRIMARY_VIEW: PrimaryView = "all";

export const normalizePrimaryView = (value: unknown): PrimaryView =>
  value === FAVORITES_VIEW_ID ? "favorites" : DEFAULT_PRIMARY_VIEW;

export const readPrimaryViewPreference = (): PrimaryView => {
  if (typeof window === "undefined") return DEFAULT_PRIMARY_VIEW;

  try {
    return normalizePrimaryView(
      JSON.parse(window.localStorage.getItem(PRIMARY_VIEW_STORAGE_KEY) || "null"),
    );
  } catch {
    return DEFAULT_PRIMARY_VIEW;
  }
};

export const usePrimaryViewPreference = () => {
  const [storedPrimaryView, setStoredPrimaryView] = useLocalStorage<PrimaryView>(
    PRIMARY_VIEW_STORAGE_KEY,
    DEFAULT_PRIMARY_VIEW,
  );

  return [normalizePrimaryView(storedPrimaryView), setStoredPrimaryView] as const;
};
