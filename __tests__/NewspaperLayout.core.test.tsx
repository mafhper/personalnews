import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NewspaperLayout } from "../components/layouts/NewspaperLayout";
import type { Article } from "../types";

vi.mock("../hooks/useLanguage", () => ({
  useLanguage: () => ({
    t: (key: string) =>
      ({
        "article.end": "Fim da edicao",
      })[key] || key,
  }),
}));

vi.mock("../hooks/useWeather", () => ({
  useWeather: () => ({
    data: { temperature: 23 },
    city: "Sao Paulo",
    getWeatherIcon: () => "sun",
    isLoading: false,
    changeCity: vi.fn(),
  }),
}));

vi.mock("../components/FavoriteButton", () => ({
  FavoriteButton: ({ article }: { article: Article }) => (
    <button type="button">Favoritar {article.title}</button>
  ),
}));

vi.mock("../components/FeedInteractiveActions", () => ({
  FeedInteractiveActions: ({ onRead }: { onRead: () => void }) => (
    <button type="button" onClick={onRead}>
      Ler
    </button>
  ),
}));

vi.mock("../components/ArticleReaderModal", () => ({
  ArticleReaderModal: () => null,
}));

const makeArticle = (
  title: string,
  hoursOld: number,
  imageUrl?: string,
): Article => ({
  title,
  link: `https://example.com/${title.toLowerCase().replaceAll(" ", "-")}`,
  pubDate: new Date(Date.UTC(2026, 4, 26, 12 - hoursOld)),
  sourceTitle: "Fonte editorial",
  description: `Resumo de ${title}`,
  imageUrl,
});

const newest = makeArticle("Primeira noticia", 0, "https://cdn.example.com/first.jpg");
const second = makeArticle("Segunda noticia", 1, "https://cdn.example.com/second.jpg");
const third = makeArticle("Terceira noticia", 2, "https://cdn.example.com/third.jpg");
const fourth = makeArticle("Quarta noticia", 3);
const fifth = makeArticle("Quinta noticia", 4);
const sixth = makeArticle("Sexta noticia", 5, "https://cdn.example.com/sixth.jpg");
const seventh = makeArticle("Setima noticia", 6, "https://cdn.example.com/seventh.jpg");

const outcomes = new Map<string, "load" | "error">();
const requestedImages: string[] = [];

class MockPreloadImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;

  set src(value: string) {
    requestedImages.push(value);
    queueMicrotask(() => {
      if (outcomes.get(value) === "load") {
        this.onload?.();
        return;
      }
      this.onerror?.();
    });
  }
}

const renderNewspaper = (articles: Article[]) =>
  render(
    <NewspaperLayout
      articles={articles}
      timeFormat="24h"
      editionLabel="Politica"
      editionColor="#c70000"
    />,
  );

describe("NewspaperLayout editorial desk", () => {
  beforeEach(() => {
    outcomes.clear();
    requestedImages.length = 0;
    vi.stubGlobal("Image", MockPreloadImage);
  });

  it("reveals the first article when its original image validates", async () => {
    outcomes.set(newest.imageUrl!, "load");
    outcomes.set(second.imageUrl!, "load");

    renderNewspaper([newest, second, third, fourth, fifth]);

    expect(screen.getByTestId("newspaper-lead-skeleton")).toBeInTheDocument();

    const lead = await screen.findByTestId("newspaper-lead");
    expect(within(lead).getByText("Primeira noticia")).toBeInTheDocument();
    expect(within(lead).getByRole("img", { name: "Primeira noticia" })).toHaveAttribute(
      "src",
      newest.imageUrl,
    );
    expect(requestedImages).toEqual([newest.imageUrl]);
    expect(screen.queryByTestId("newspaper-lead-skeleton")).not.toBeInTheDocument();
  });

  it("promotes the next candidate when an original image fails", async () => {
    outcomes.set(newest.imageUrl!, "error");
    outcomes.set(second.imageUrl!, "load");

    renderNewspaper([newest, second, third, fourth, fifth]);

    const lead = await screen.findByTestId("newspaper-lead");
    expect(within(lead).getByText("Segunda noticia")).toBeInTheDocument();
    expect(within(lead).getByRole("img", { name: "Segunda noticia" })).toHaveAttribute(
      "src",
      second.imageUrl,
    );
    expect(requestedImages).toEqual([newest.imageUrl, second.imageUrl]);

    const latestRail = screen.getByTestId("newspaper-latest");
    expect(within(latestRail).getByText("Primeira noticia")).toBeInTheDocument();
    expect(within(latestRail).queryByText("Segunda noticia")).not.toBeInTheDocument();
  });

  it("uses a textual lead when no real candidate image validates", async () => {
    outcomes.set(newest.imageUrl!, "error");
    outcomes.set(second.imageUrl!, "error");

    renderNewspaper([newest, second, fourth]);

    const lead = await screen.findByTestId("newspaper-lead");
    expect(within(lead).getByText("Primeira noticia")).toBeInTheDocument();
    expect(within(lead).queryByRole("img")).not.toBeInTheDocument();
  });

  it("removes lead media if the validated original later fails", async () => {
    outcomes.set(newest.imageUrl!, "load");

    renderNewspaper([newest, second, fourth]);

    const lead = await screen.findByTestId("newspaper-lead");
    fireEvent.error(within(lead).getByRole("img", { name: "Primeira noticia" }));

    expect(within(lead).queryByRole("img")).not.toBeInTheDocument();
    expect(within(lead).getByText("Primeira noticia")).toBeInTheDocument();
  });

  it("validates at most six image candidates for the lead", async () => {
    const candidates = [
      newest,
      second,
      third,
      sixth,
      seventh,
      makeArticle("Oitava noticia", 7, "https://cdn.example.com/eighth.jpg"),
      makeArticle("Nona noticia", 8, "https://cdn.example.com/ninth.jpg"),
    ];
    candidates.forEach((article) => outcomes.set(article.imageUrl!, "error"));

    renderNewspaper(candidates);

    const lead = await screen.findByTestId("newspaper-lead");
    expect(within(lead).getByText("Primeira noticia")).toBeInTheDocument();
    expect(within(lead).queryByRole("img")).not.toBeInTheDocument();
  });

  it("renders the compact edition line and orders lead, Agora, and remaining stories", async () => {
    outcomes.set(second.imageUrl!, "load");
    outcomes.set(sixth.imageUrl!, "error");

    renderNewspaper([newest, second, third, fourth, fifth, sixth]);

    expect(await screen.findByText("Politica")).toBeInTheDocument();
    expect(screen.queryByText(/23/)).not.toBeInTheDocument();

    const latestRail = screen.getByTestId("newspaper-latest");
    expect(within(latestRail).getAllByRole("article").map((item) => item.textContent)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Primeira noticia"),
        expect.stringContaining("Terceira noticia"),
      ]),
    );

    const storyFlow = screen.getByTestId("newspaper-story-flow");
    const sixthStory = within(storyFlow).getByText("Sexta noticia").closest("article");
    expect(sixthStory).not.toBeNull();
    expect(within(sixthStory!).queryByRole("img")).not.toBeInTheDocument();
    expect(within(storyFlow).queryByText("Segunda noticia")).not.toBeInTheDocument();
  });
});
