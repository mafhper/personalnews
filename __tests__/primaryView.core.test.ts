import { beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_PRIMARY_VIEW,
  FAVORITES_VIEW_ID,
  PRIMARY_VIEW_STORAGE_KEY,
  normalizePrimaryView,
  readPrimaryViewPreference,
} from "../hooks/usePrimaryView";

describe("primary view preference", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defaults to All for unknown or missing values", () => {
    expect(normalizePrimaryView(undefined)).toBe(DEFAULT_PRIMARY_VIEW);
    expect(normalizePrimaryView("all")).toBe(DEFAULT_PRIMARY_VIEW);
    expect(normalizePrimaryView("unknown")).toBe(DEFAULT_PRIMARY_VIEW);
  });

  it("recognizes the virtual favorites view only by its stable id", () => {
    expect(normalizePrimaryView(FAVORITES_VIEW_ID)).toBe("favorites");
  });

  it("reads the persisted favorites view and falls back on malformed storage", () => {
    localStorage.setItem(PRIMARY_VIEW_STORAGE_KEY, JSON.stringify("favorites"));
    expect(readPrimaryViewPreference()).toBe("favorites");

    localStorage.setItem(PRIMARY_VIEW_STORAGE_KEY, "{");
    expect(readPrimaryViewPreference()).toBe("all");
  });
});
