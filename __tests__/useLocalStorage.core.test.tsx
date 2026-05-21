import React, { useState } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useLocalStorage } from "../hooks/useLocalStorage";

const STORAGE_KEY = "use-local-storage-race-test";

function MountedReader() {
  const [value] = useLocalStorage(STORAGE_KEY, "fallback");
  return <div data-testid="mounted-reader">{value}</div>;
}

function RaceHarness() {
  const [, setValue] = useLocalStorage(STORAGE_KEY, "fallback");
  const [showReader, setShowReader] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setValue("updated");
          setShowReader(true);
        }}
      >
        update
      </button>
      {showReader && <MountedReader />}
    </>
  );
}

describe("useLocalStorage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify("initial"));
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("persists setter updates before newly mounted hook instances read the same key", async () => {
    render(<RaceHarness />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "update" }));
      await Promise.resolve();
    });

    expect(screen.getByTestId("mounted-reader")).toHaveTextContent("updated");
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null")).toBe(
      "updated",
    );
  });
});
