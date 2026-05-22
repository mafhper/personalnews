import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FavoritesViewToolbar } from "../components/FavoritesViewToolbar";

const defaultProps = {
  totalCount: 5,
  visibleCount: 3,
  unreadCount: 2,
  readFilter: "all" as const,
  mediaFilter: "all" as const,
  categoryFilter: "all",
  sourceKey: null,
  sortMode: "saved-desc" as const,
  categoryOptions: [
    { value: "all", label: "Todas as categorias" },
    { value: "Tech", label: "Tech" },
  ],
  sourceOptions: [
    { value: "all", label: "Todas as fontes" },
    { value: "favorite-source:example", label: "Example" },
  ],
  hasActiveFilters: false,
  onReadFilterChange: vi.fn(),
  onMediaFilterChange: vi.fn(),
  onCategoryFilterChange: vi.fn(),
  onSourceKeyChange: vi.fn(),
  onSortModeChange: vi.fn(),
  onClearFilters: vi.fn(),
};

describe("FavoritesViewToolbar", () => {
  it("renders total and visible counts", () => {
    render(<FavoritesViewToolbar {...defaultProps} />);

    expect(screen.getByText("3 de 5 visíveis")).toBeInTheDocument();
    expect(screen.getByText("2 não lidos")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Filtros de favoritos"),
    ).toHaveClass("favorites-toolbar-frame");
    expect(
      screen.getByLabelText("Filtros de favoritos"),
    ).not.toHaveClass("feed-page-frame");
  });

  it("calls handlers when filters change", () => {
    const onReadFilterChange = vi.fn();
    const onMediaFilterChange = vi.fn();
    const onCategoryFilterChange = vi.fn();
    const onSourceKeyChange = vi.fn();
    const onSortModeChange = vi.fn();

    render(
      <FavoritesViewToolbar
        {...defaultProps}
        onReadFilterChange={onReadFilterChange}
        onMediaFilterChange={onMediaFilterChange}
        onCategoryFilterChange={onCategoryFilterChange}
        onSourceKeyChange={onSourceKeyChange}
        onSortModeChange={onSortModeChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Não lidos" }));
    fireEvent.change(screen.getByLabelText("Tipo de favorito"), {
      target: { value: "podcast" },
    });
    fireEvent.change(screen.getByLabelText("Categoria de favorito"), {
      target: { value: "Tech" },
    });
    fireEvent.change(screen.getByLabelText("Fonte de favorito"), {
      target: { value: "favorite-source:example" },
    });
    fireEvent.change(screen.getByLabelText("Ordenação de favoritos"), {
      target: { value: "source-asc" },
    });

    expect(onReadFilterChange).toHaveBeenCalledWith("unread");
    expect(onMediaFilterChange).toHaveBeenCalledWith("podcast");
    expect(onCategoryFilterChange).toHaveBeenCalledWith("Tech");
    expect(onSourceKeyChange).toHaveBeenCalledWith("favorite-source:example");
    expect(onSortModeChange).toHaveBeenCalledWith("source-asc");
  });

  it("shows the clear filters button only when a filter is active", () => {
    const onClearFilters = vi.fn();
    const { rerender } = render(
      <FavoritesViewToolbar
        {...defaultProps}
        onClearFilters={onClearFilters}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Limpar" }),
    ).not.toBeInTheDocument();

    rerender(
      <FavoritesViewToolbar
        {...defaultProps}
        hasActiveFilters
        readFilter="unread"
        onClearFilters={onClearFilters}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Limpar" }));

    expect(onClearFilters).toHaveBeenCalledTimes(1);
  });
});
