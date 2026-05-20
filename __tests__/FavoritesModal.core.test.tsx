import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FavoritesModal } from "../components/FavoritesModal";
import type { FavoriteArticle, UseFavoritesReturn } from "../hooks/useFavorites";

const mockUseFavorites = vi.fn<() => UseFavoritesReturn>();

vi.mock("../components/LazyImage", () => ({
  LazyImage: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

vi.mock("../hooks/useNotificationReplacements", () => ({
  useNotificationReplacements: () => ({
    alertSuccess: vi.fn(),
    alertError: vi.fn(),
  }),
}));

vi.mock("../hooks/useFavorites", async () => {
  const actual = await vi.importActual<typeof import("../hooks/useFavorites")>(
    "../hooks/useFavorites",
  );
  return {
    ...actual,
    useFavorites: () => mockUseFavorites(),
  };
});

const makeFavorite = (
  overrides: Partial<FavoriteArticle> = {},
): FavoriteArticle => ({
  id: overrides.id || "fav-1",
  title: overrides.title || "Favorite title",
  link: overrides.link || "https://example.com/article",
  pubDate: overrides.pubDate || "2024-01-01T00:00:00.000Z",
  sourceTitle: overrides.sourceTitle || "Example Source",
  favoritedAt: overrides.favoritedAt || "2024-02-01T00:00:00.000Z",
  categories: overrides.categories || ["Tech"],
  ...overrides,
});

const setupFavorites = (favorites: FavoriteArticle[]) => {
  mockUseFavorites.mockReturnValue({
    favorites,
    isFavorite: vi.fn(),
    addToFavorites: vi.fn(),
    removeFromFavorites: vi.fn(),
    toggleFavorite: vi.fn(),
    clearAllFavorites: vi.fn(),
    getFavoritesCount: vi.fn(() => favorites.length),
    exportFavorites: vi.fn(() => "{}"),
    importFavorites: vi.fn(() => true),
    getFavoritesByCategory: vi.fn(),
    getFavoritesBySource: vi.fn(),
  });
};

describe("FavoritesModal", () => {
  it("composes category, source, and search filters", () => {
    setupFavorites([
      makeFavorite({
        id: "keep",
        title: "Keep this favorite",
        sourceTitle: "Source A",
        categories: ["Tech"],
        description: "needle",
      }),
      makeFavorite({
        id: "wrong-source",
        title: "Wrong source",
        sourceTitle: "Source B",
        categories: ["Tech"],
        description: "needle",
      }),
      makeFavorite({
        id: "wrong-category",
        title: "Wrong category",
        sourceTitle: "Source A",
        categories: ["Science"],
        description: "needle",
      }),
    ]);

    render(<FavoritesModal isOpen onClose={vi.fn()} />);

    fireEvent.change(screen.getByDisplayValue("Todas as categorias"), {
      target: { value: "Tech" },
    });
    fireEvent.change(screen.getByDisplayValue("Todas as fontes"), {
      target: { value: "Source A" },
    });
    fireEvent.change(screen.getByPlaceholderText("Buscar favoritos"), {
      target: { value: "needle" },
    });

    expect(screen.getByText("Keep this favorite")).toBeInTheDocument();
    expect(screen.queryByText("Wrong source")).not.toBeInTheDocument();
    expect(screen.queryByText("Wrong category")).not.toBeInTheDocument();
  });

  it("filters favorites by media type", () => {
    setupFavorites([
      makeFavorite({
        id: "article",
        title: "Article favorite",
        mediaType: "article",
      }),
      makeFavorite({
        id: "podcast",
        title: "Podcast favorite",
        audioUrl: "https://cdn.example.com/audio.mp3",
      }),
      makeFavorite({
        id: "video",
        title: "Video favorite",
        link: "https://youtu.be/example",
      }),
    ]);

    render(<FavoritesModal isOpen onClose={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Tipo de favorito"), {
      target: { value: "podcast" },
    });

    expect(screen.getByText("Podcast favorite")).toBeInTheDocument();
    expect(screen.queryByText("Article favorite")).not.toBeInTheDocument();
    expect(screen.queryByText("Video favorite")).not.toBeInTheDocument();
  });
});
