import { beforeEach, describe, expect, it } from "vitest";
import {
  createBackup,
  restoreBackup,
  STORAGE_KEYS,
} from "../services/backupService";
import { readPrimaryViewPreference } from "../hooks/usePrimaryView";

describe("backup service", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("restores the primary favorites view in the JSON format expected by the app", () => {
    localStorage.setItem(STORAGE_KEYS.PRIMARY_VIEW, JSON.stringify("favorites"));

    const backup = createBackup();
    localStorage.clear();

    expect(restoreBackup(backup)).toBe(true);
    expect(localStorage.getItem(STORAGE_KEYS.PRIMARY_VIEW)).toBe(
      JSON.stringify("favorites"),
    );
    expect(readPrimaryViewPreference()).toBe("favorites");
  });
});
