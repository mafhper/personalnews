import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PocketFeedsLayout } from "../components/layouts/PocketFeedsLayout";
import type { Article } from "../types";

vi.mock("../hooks/useLanguage", () => ({
  useLanguage: () => ({
    t: (key: string) => key,
  }),
}));

const podcastEpisode: Article = {
  title: "Science podcast episode",
  link: "https://example.com/episode",
  pubDate: new Date("2026-05-17T12:00:00Z"),
  sourceTitle: "Science Podcast",
  description: "Episode summary",
  audioUrl: "https://cdn.example.com/episode.mp3",
  audioDuration: "42:12",
};

describe("PocketFeedsLayout audio player", () => {
  beforeEach(() => {
    Object.defineProperty(HTMLMediaElement.prototype, "play", {
      configurable: true,
      value: vi.fn().mockResolvedValue(undefined),
    });
    Object.defineProperty(HTMLMediaElement.prototype, "pause", {
      configurable: true,
      value: vi.fn(),
    });
  });

  it("opens player controls with play, seek, volume and speed", () => {
    render(<PocketFeedsLayout articles={[podcastEpisode]} />);

    fireEvent.click(screen.getByRole("button", { name: /tocar/i }));

    expect(screen.getAllByText("Science podcast episode").length).toBeGreaterThan(1);
    expect(screen.getByLabelText("Posição da reprodução")).toBeInTheDocument();
    expect(screen.getByLabelText("Volume")).toBeInTheDocument();
    expect(screen.getByLabelText("Velocidade de reprodução")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Velocidade de reprodução"), {
      target: { value: "1.5" },
    });

    expect(screen.getByLabelText("Velocidade de reprodução")).toHaveValue("1.5");
  });
});
