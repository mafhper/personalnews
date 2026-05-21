import { describe, expect, it, vi } from "vitest";
import {
  applySelectedResetScopes,
  getResetScopeStorageKeys,
  RESET_SCOPE_DEFINITIONS,
} from "../utils/destructiveScopes";

describe("destructiveScopes", () => {
  it("maps reset scopes to visible storage keys only", () => {
    expect(getResetScopeStorageKeys(["favorites", "read-history"])).toEqual([
      "article-read-status",
      "favorites-data",
    ]);
  });

  it("does not include unmapped preference keys in a full local data reset", () => {
    const keys = getResetScopeStorageKeys(
      RESET_SCOPE_DEFINITIONS.map((scope) => scope.id),
    );

    expect(keys).toContain("rss-feeds");
    expect(keys).toContain("feed-categories");
    expect(keys).toContain("article-read-status");
    expect(keys).toContain("favorites-data");
    expect(keys).not.toContain("personalnews-primary-view");
    expect(keys).not.toContain("personalnews_weather_city");
  });

  it("removes only keys from selected scopes", () => {
    const storage = {
      removeItem: vi.fn(),
    };

    const removed = applySelectedResetScopes(["favorites"], storage);

    expect(removed).toEqual(["favorites-data"]);
    expect(storage.removeItem).toHaveBeenCalledTimes(1);
    expect(storage.removeItem).toHaveBeenCalledWith("favorites-data");
  });
});

