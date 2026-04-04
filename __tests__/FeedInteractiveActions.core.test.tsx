import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FeedInteractiveActions } from "../components/FeedInteractiveActions";
import { openExternalLink } from "../utils/openExternalLink";

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

vi.mock("../utils/openExternalLink", () => ({
  openExternalLink: vi.fn(async () => {}),
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
    expect(openExternalLink).not.toHaveBeenCalled();
  });

  it("routes VISITAR through the shared external-link helper", () => {
    render(
      <FeedInteractiveActions
        articleLink="https://example.com/video"
        onRead={vi.fn()}
        showRead={false}
        showVisit={true}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "VISITAR" }));

    expect(openExternalLink).toHaveBeenCalledWith("https://example.com/video");
  });
});
