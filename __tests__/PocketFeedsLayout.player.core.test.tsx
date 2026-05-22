import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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

const richPodcastEpisode: Article = {
  ...podcastEpisode,
  title: "Episode with rich metadata",
  imageUrl: "https://cdn.example.com/episode-art.jpg",
  author: "Host Name",
  description: "A focused episode summary for the listener.",
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

  it("opens player controls with play, seek, volume and speed", async () => {
    render(<PocketFeedsLayout articles={[podcastEpisode]} />);

    fireEvent.click(screen.getByRole("button", { name: /tocar/i }));

    await waitFor(() => expect(screen.getAllByText("Science podcast episode").length).toBeGreaterThan(1));
    expect(screen.getByLabelText("Posição da reprodução")).toBeInTheDocument();
    expect(screen.getByLabelText("Volume")).toBeInTheDocument();
    expect(screen.getByLabelText("Velocidade de reprodução")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Velocidade de reprodução"), {
      target: { value: "1.5" },
    });

    expect(screen.getByLabelText("Velocidade de reprodução")).toHaveValue("1.5");
  });

  it("does not mark an episode as playing when the browser rejects playback", async () => {
    Object.defineProperty(HTMLMediaElement.prototype, "play", {
      configurable: true,
      value: vi.fn().mockRejectedValue(new Error("CSP blocked media")),
    });

    render(<PocketFeedsLayout articles={[podcastEpisode]} />);

    fireEvent.click(screen.getByRole("button", { name: /tocar/i }));

    expect(await screen.findByText(/não foi possível iniciar o áudio/i)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /tocar episódio/i }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /pausar episódio/i })).not.toBeInTheDocument();
  });

  it("renders episode artwork, author, summary and duration metadata", () => {
    render(<PocketFeedsLayout articles={[richPodcastEpisode]} />);

    expect(screen.getByAltText("Science Podcast")).toBeInTheDocument();
    expect(screen.getByAltText("Episode with rich metadata")).toBeInTheDocument();
    expect(screen.getByText("Science Podcast • Host Name")).toBeInTheDocument();
    expect(screen.getByText("A focused episode summary for the listener.")).toBeInTheDocument();
    expect(screen.getByText("42:12")).toBeInTheDocument();
  });

  it("renders a global date timeline with expandable episode rows", () => {
    const olderEpisode: Article = {
      ...podcastEpisode,
      title: "Older design episode",
      link: "https://example.com/older",
      pubDate: new Date("2026-05-15T12:00:00Z"),
      sourceTitle: "Design Podcast",
    };
    const newestEpisode: Article = {
      ...podcastEpisode,
      title: "Newest games episode",
      link: "https://example.com/newest",
      pubDate: new Date("2026-05-20T12:00:00Z"),
      sourceTitle: "Games Podcast",
      description: "Newest episode details",
    };

    render(
      <PocketFeedsLayout
        articles={[olderEpisode, podcastEpisode, newestEpisode]}
      />,
    );

    const timelineRows = screen.getAllByTestId("pocketfeeds-timeline-episode");
    expect(within(timelineRows[0]).getByText("Newest games episode")).toBeInTheDocument();
    expect(within(timelineRows[1]).getByText("Science podcast episode")).toBeInTheDocument();
    expect(within(timelineRows[2]).getByText("Older design episode")).toBeInTheDocument();

    fireEvent.click(
      within(timelineRows[0]).getByRole("button", {
        name: /Newest games episode/i,
        expanded: false,
      }),
    );

    expect(screen.getByText("Newest episode details")).toBeInTheDocument();
    expect(
      within(timelineRows[0]).getByRole("button", {
        name: /Newest games episode/i,
        expanded: true,
      }),
    ).toBeInTheDocument();
  });
});
