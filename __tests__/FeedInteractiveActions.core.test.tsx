import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FeedInteractiveActions } from "../components/FeedInteractiveActions";

vi.mock("../hooks/useLanguage", () => ({
  useLanguage: () => ({
    t: (key: string) =>
      ({
        "action.read": "LER",
        "action.watch": "ASSISTIR",
        "action.visit": "VISITAR",
      })[key] || key,
  }),
}));

describe("FeedInteractiveActions", () => {
  it("falls back to the internal read handler when watch is shown without a custom watch handler", () => {
    const onRead = vi.fn();

    render(
      <FeedInteractiveActions
        articleLink="https://example.com/video"
        onRead={onRead}
        showRead={false}
        showWatch={true}
        showVisit={true}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "ASSISTIR" }));

    expect(onRead).toHaveBeenCalledTimes(1);
  });
});
