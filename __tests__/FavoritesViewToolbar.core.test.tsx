import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FavoritesHeaderToolbar } from "../components/FavoritesHeaderToolbar";

const defaultProps = {
  totalCount: 5,
  visibleCount: 3,
  unreadCount: 2,
  readFilter: "all" as const,
  mediaFilter: "all" as const,
  sortMode: "saved-desc" as const,
  hasActiveFilters: false,
  activeFilterCount: 0,
  onReadFilterChange: vi.fn(),
  onMediaFilterChange: vi.fn(),
  onSortModeChange: vi.fn(),
  onClearFilters: vi.fn(),
};

describe("FavoritesHeaderToolbar", () => {
  it("renders compact favorites filters without category or source controls", () => {
    render(<FavoritesHeaderToolbar {...defaultProps} />);

    expect(
      screen.getByRole("toolbar", { name: "Filtros de favoritos" }),
    ).toHaveClass("favorites-header-toolbar");
    expect(screen.getByText("Todos")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tipo de favorito" }))
      .toHaveTextContent("Todos os tipos");
    expect(screen.getByRole("button", { name: "Ordenação de favoritos" }))
      .toHaveTextContent("Salvos recentemente");
    expect(screen.queryByLabelText("Categoria de favorito")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Fonte de favorito")).not.toBeInTheDocument();
  });

  it("cycles the read filter through the next state", () => {
    const onReadFilterChange = vi.fn();

    render(
      <FavoritesHeaderToolbar
        {...defaultProps}
        onReadFilterChange={onReadFilterChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Mostrando todos/ }));

    expect(onReadFilterChange).toHaveBeenCalledWith("unread");
  });

  it("calls handlers from type and sort dropdowns", () => {
    const onMediaFilterChange = vi.fn();
    const onSortModeChange = vi.fn();

    render(
      <FavoritesHeaderToolbar
        {...defaultProps}
        onMediaFilterChange={onMediaFilterChange}
        onSortModeChange={onSortModeChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Tipo de favorito" }));
    const mediaMenu = screen.getByRole("listbox", { name: "Tipo de favorito" });
    expect(
      screen.getByRole("toolbar", { name: "Filtros de favoritos" }),
    ).not.toContainElement(mediaMenu);
    expect(mediaMenu.parentElement).toBe(document.body);
    fireEvent.click(screen.getByRole("option", { name: "Podcasts" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Ordenação de favoritos" }),
    );
    fireEvent.click(screen.getByRole("option", { name: "Fonte A-Z" }));

    expect(onMediaFilterChange).toHaveBeenCalledWith("podcast");
    expect(onSortModeChange).toHaveBeenCalledWith("source-asc");
  });

  it("shows the clear filters button only when a filter is active", () => {
    const onClearFilters = vi.fn();
    const { rerender } = render(
      <FavoritesHeaderToolbar
        {...defaultProps}
        onClearFilters={onClearFilters}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Limpar filtros" }),
    ).not.toBeInTheDocument();

    rerender(
      <FavoritesHeaderToolbar
        {...defaultProps}
        hasActiveFilters
        activeFilterCount={2}
        readFilter="unread"
        onClearFilters={onClearFilters}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));

    expect(onClearFilters).toHaveBeenCalledTimes(1);
  });
});
