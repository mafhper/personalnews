import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PocketFeedsLayout } from "../components/layouts/PocketFeedsLayout";
import type { Article } from "../types";

vi.mock("../hooks/useLanguage", () => ({
  useLanguage: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("../components/FavoriteButton", () => ({
  FavoriteButton: ({ article }: { article: Article }) => (
    <button type="button" aria-label={`Favoritar ${article.title}`}>
      Favoritar
    </button>
  ),
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

const makeEpisode = (
  sourceTitle: string,
  title: string,
  pubDate: string,
  overrides: Partial<Article> = {},
): Article => ({
  title,
  link: `https://example.com/${encodeURIComponent(sourceTitle)}/${encodeURIComponent(title)}`,
  pubDate: new Date(pubDate),
  sourceTitle,
  description: `${title} summary`,
  audioUrl: `https://cdn.example.com/${encodeURIComponent(title)}.mp3`,
  audioDuration: "42:12",
  imageUrl: `https://cdn.example.com/${encodeURIComponent(title)}.jpg`,
  ...overrides,
});

const podcastEpisodes: Article[] = [
  makeEpisode("Science Podcast", "Science newest", "2026-05-20T12:00:00Z", {
    imageUrl: "https://cdn.example.com/science-newest-art.jpg",
  }),
  makeEpisode("Science Podcast", "Science older", "2026-05-18T12:00:00Z", {
    imageUrl: "https://cdn.example.com/science-older-art.jpg",
  }),
  makeEpisode("Design Podcast", "Design episode", "2026-05-19T12:00:00Z", {
    imageUrl: "https://cdn.example.com/design-episode-art.jpg",
  }),
  makeEpisode("Games Podcast", "Games episode", "2026-05-17T12:00:00Z", {
    imageUrl: "https://cdn.example.com/games-episode-art.jpg",
  }),
];

const manyPodcastFeeds: Article[] = Array.from({ length: 7 }, (_, index) =>
  makeEpisode(
    `Podcast ${index + 1}`,
    `Episode ${index + 1}`,
    `2026-05-${String(20 - index).padStart(2, "0")}T12:00:00Z`,
  ),
);

const openLayoutPicker = () => {
  fireEvent.click(
    screen.getByRole("button", {
      name: /alterar modo de visualização dos podcasts/i,
    }),
  );
};

describe("PocketFeedsLayout audio player", () => {
  beforeEach(() => {
    window.localStorage.clear();
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

  it("minimizes and expands the podcast player without stopping playback", async () => {
    render(<PocketFeedsLayout articles={[podcastEpisode]} />);

    fireEvent.click(screen.getByRole("button", { name: /tocar/i }));

    await waitFor(() =>
      expect(
        screen.getByTestId("pocketfeeds-player-expanded"),
      ).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole("button", { name: /minimizar player/i }));

    expect(screen.getByTestId("pocketfeeds-player-minimized")).toBeInTheDocument();
    expect(screen.queryByLabelText("Posição da reprodução")).not.toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /pausar episódio/i }).length,
    ).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: /expandir player/i }));

    expect(screen.getByTestId("pocketfeeds-player-expanded")).toBeInTheDocument();
    expect(screen.getByLabelText("Posição da reprodução")).toBeInTheDocument();
  });

  it("closes the podcast player and stops playback", async () => {
    render(<PocketFeedsLayout articles={[podcastEpisode]} />);

    fireEvent.click(screen.getByRole("button", { name: /tocar/i }));

    await waitFor(() =>
      expect(
        screen.getByTestId("pocketfeeds-player-expanded"),
      ).toBeInTheDocument(),
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /fechar player e parar reprodução/i,
      }),
    );

    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
    expect(screen.queryByTestId("pocketfeeds-player-expanded")).not.toBeInTheDocument();
    expect(screen.queryByTestId("pocketfeeds-player-minimized")).not.toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /tocar episódio/i }).length,
    ).toBeGreaterThan(0);
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
    window.localStorage.setItem(
      "pocketfeeds-view-mode",
      JSON.stringify("single"),
    );

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

  it("uses two columns by default and sizes the podcast header per layout", () => {
    render(<PocketFeedsLayout articles={podcastEpisodes} />);

    expect(screen.getByTestId("pocketfeeds-double-layout")).toBeInTheDocument();
    expect(screen.getByTestId("pocketfeeds-double-layout")).toHaveClass(
      "items-start",
    );
    expect(screen.getByTestId("pocketfeeds-double-layout")).toHaveClass(
      "md:grid-cols-2",
    );
    expect(screen.queryByText("Linha do tempo")).not.toBeInTheDocument();
    const scienceDoublePanel = screen.getByTestId(
      "pocketfeeds-double-episodes-Science Podcast",
    );
    expect(within(scienceDoublePanel).getByText("Science newest")).toBeInTheDocument();
    expect(within(scienceDoublePanel).getByText("Science older")).toBeInTheDocument();
    const gamesCard = screen
      .getAllByTestId("pocketfeeds-podcast-card")
      .find(
        (card) => within(card).queryAllByText("Games Podcast").length > 0,
      );
    expect(gamesCard).toHaveClass("md:col-span-2");
    expect(screen.getByTestId("pocketfeeds-layout-header")).toHaveClass(
      "max-w-6xl",
    );

    openLayoutPicker();

    fireEvent.click(screen.getByRole("button", { name: /1 coluna/i }));
    expect(screen.getByTestId("pocketfeeds-single-layout")).toBeInTheDocument();
    expect(screen.getByTestId("pocketfeeds-layout-header")).toHaveClass(
      "max-w-4xl",
    );

    openLayoutPicker();
    fireEvent.click(screen.getByRole("button", { name: /grid/i }));
    expect(screen.getByTestId("pocketfeeds-grid-layout")).toBeInTheDocument();
    expect(screen.getByTestId("pocketfeeds-grid-layout")).toHaveStyle({
      gridTemplateColumns:
        "repeat(auto-fit, minmax(min(100%, 10.5rem), 1fr))",
    });
    expect(screen.getByTestId("pocketfeeds-layout-header")).toHaveClass(
      "max-w-screen-2xl",
    );
  });

  it("hides the two-column option when the measured layout width is too narrow", async () => {
    const rectSpy = vi
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(function getBoundingClientRectMock() {
        const element = this as HTMLElement;
        const width =
          element.dataset.testid === "pocketfeeds-layout-measure" ? 640 : 0;

        return {
          bottom: 0,
          height: 0,
          left: 0,
          right: width,
          top: 0,
          width,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        } as DOMRect;
      });

    try {
      render(<PocketFeedsLayout articles={podcastEpisodes} />);

      await waitFor(() =>
        expect(
          screen.getByTestId("pocketfeeds-single-layout"),
        ).toBeInTheDocument(),
      );

      openLayoutPicker();

      expect(
        screen.queryByRole("button", { name: /2 colunas/i }),
      ).not.toBeInTheDocument();
      const picker = screen.getByRole("group", {
        name: /modo de visualização dos podcasts/i,
      });
      expect(
        within(picker).getByRole("button", { name: /1 coluna/i }),
      ).toHaveAttribute("aria-pressed", "true");
    } finally {
      rectSpy.mockRestore();
    }
  });

  it("hides the two-column option for larger podcast libraries and falls back to grid", () => {
    render(<PocketFeedsLayout articles={manyPodcastFeeds} />);

    expect(screen.getByTestId("pocketfeeds-grid-layout")).toBeInTheDocument();

    openLayoutPicker();

    expect(
      screen.queryByRole("button", { name: /2 colunas/i }),
    ).not.toBeInTheDocument();
    const picker = screen.getByRole("group", {
      name: /modo de visualização dos podcasts/i,
    });
    expect(
      within(picker).getByRole("button", { name: /grid/i }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("persists the selected podcast layout mode", async () => {
    const { unmount } = render(<PocketFeedsLayout articles={podcastEpisodes} />);

    openLayoutPicker();
    fireEvent.click(screen.getByRole("button", { name: /mixtape/i }));

    expect(window.localStorage.getItem("pocketfeeds-view-mode")).toBe(
      JSON.stringify("mixtape"),
    );

    await act(async () => {
      await Promise.resolve();
    });

    unmount();
    render(<PocketFeedsLayout articles={podcastEpisodes} />);

    expect(screen.getByTestId("pocketfeeds-mixtape-layout")).toBeInTheDocument();
  });

  it("keeps the layout picker open until selection, Escape, or outside click", () => {
    render(<PocketFeedsLayout articles={podcastEpisodes} />);

    openLayoutPicker();
    const pickerGroup = screen.getByRole("group", {
      name: /modo de visualização dos podcasts/i,
    });

    fireEvent.mouseLeave(pickerGroup.parentElement!);

    expect(
      screen.getByRole("button", { name: /mixtape/i }),
    ).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(
      screen.queryByRole("group", {
        name: /modo de visualização dos podcasts/i,
      }),
    ).not.toBeInTheDocument();

    openLayoutPicker();
    expect(
      screen.getByRole("group", {
        name: /modo de visualização dos podcasts/i,
      }),
    ).toBeInTheDocument();

    fireEvent.pointerDown(document.body);

    expect(
      screen.queryByRole("group", {
        name: /modo de visualização dos podcasts/i,
      }),
    ).not.toBeInTheDocument();

    openLayoutPicker();
    fireEvent.click(screen.getByRole("button", { name: /mixtape/i }));

    expect(screen.getByTestId("pocketfeeds-mixtape-layout")).toBeInTheDocument();
    expect(
      screen.queryByRole("group", {
        name: /modo de visualização dos podcasts/i,
      }),
    ).not.toBeInTheDocument();
  });

  it("opens the podcast episode modal from grid mode", () => {
    render(<PocketFeedsLayout articles={podcastEpisodes} />);

    openLayoutPicker();
    fireEvent.click(screen.getByRole("button", { name: /grid/i }));
    fireEvent.click(
      screen.getByRole("button", { name: /ver episódios de science podcast/i }),
    );

    const dialog = screen.getByRole("dialog", {
      name: /episódios de science podcast/i,
    });

    expect(within(dialog).getByText("Science newest")).toBeInTheDocument();
    expect(within(dialog).getByText("Science older")).toBeInTheDocument();
  });

  it("uses episode-specific artwork in expanded episode lists", () => {
    window.localStorage.setItem(
      "pocketfeeds-view-mode",
      JSON.stringify("single"),
    );

    render(<PocketFeedsLayout articles={podcastEpisodes} />);

    const scienceCard = screen
      .getAllByTestId("pocketfeeds-podcast-card")
      .find(
        (card) => within(card).queryAllByText("Science Podcast").length > 0,
      );

    expect(scienceCard).toBeDefined();
    fireEvent.click(
      within(scienceCard!).getByRole("button", { name: /Science Podcast/i }),
    );

    const scienceEpisodes = screen.getByTestId(
      "pocketfeeds-inline-episodes-Science Podcast",
    );

    expect(within(scienceEpisodes).getByAltText("Science newest")).toHaveAttribute(
      "src",
      "https://cdn.example.com/science-newest-art.jpg",
    );
    expect(within(scienceEpisodes).getByAltText("Science older")).toHaveAttribute(
      "src",
      "https://cdn.example.com/science-older-art.jpg",
    );
  });

  it("keeps responsive artwork visible and skips empty episode placeholders", () => {
    window.localStorage.setItem(
      "pocketfeeds-view-mode",
      JSON.stringify("single"),
    );

    const textOnlyNewest = {
      ...podcastEpisodes[0],
      title: "Science text-only newest",
      imageUrl: undefined,
    };

    render(
      <PocketFeedsLayout
        articles={[textOnlyNewest, podcastEpisodes[1], ...podcastEpisodes.slice(2)]}
      />,
    );

    const scienceCard = screen
      .getAllByTestId("pocketfeeds-podcast-card")
      .find(
        (card) => within(card).queryAllByText("Science Podcast").length > 0,
      );

    expect(scienceCard).toBeDefined();
    expect(within(scienceCard!).getByAltText("Science Podcast")).toHaveAttribute(
      "src",
      "https://cdn.example.com/science-older-art.jpg",
    );

    fireEvent.click(
      within(scienceCard!).getByRole("button", { name: /Science Podcast/i }),
    );

    const scienceEpisodes = screen.getByTestId(
      "pocketfeeds-inline-episodes-Science Podcast",
    );

    expect(
      within(scienceEpisodes).queryByAltText("Science text-only newest"),
    ).not.toBeInTheDocument();
    expect(within(scienceEpisodes).getByAltText("Science older")).not.toHaveClass(
      "hidden",
    );
  });

  it("renders mixtape with stable artwork panels and working podcast playback", async () => {
    render(<PocketFeedsLayout articles={podcastEpisodes} />);

    openLayoutPicker();
    fireEvent.click(screen.getByRole("button", { name: /mixtape/i }));

    expect(screen.getByTestId("pocketfeeds-mixtape-layout")).toBeInTheDocument();
    expect(screen.getByTestId("pocketfeeds-mixtape-layout")).toHaveClass(
      "items-start",
    );
    expect(screen.getAllByTestId("pocketfeeds-mixtape-card")[0]).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /tocar Science newest/i }));

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /pausar Science newest/i }),
      ).toBeInTheDocument(),
    );
    expect(screen.getByLabelText("Posição da reprodução")).toBeInTheDocument();
  });

  it("mixtape plays the first available audio episode when the newest entry has no audio", async () => {
    const textOnlyNewest = {
      ...podcastEpisodes[0],
      title: "Science text-only newest",
      audioUrl: undefined,
    };

    render(
      <PocketFeedsLayout
        articles={[textOnlyNewest, podcastEpisodes[1], ...podcastEpisodes.slice(2)]}
      />,
    );

    openLayoutPicker();
    fireEvent.click(screen.getByRole("button", { name: /mixtape/i }));

    fireEvent.click(screen.getByRole("button", { name: /tocar Science older/i }));

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /pausar Science older/i }),
      ).toBeInTheDocument(),
    );
  });
});
