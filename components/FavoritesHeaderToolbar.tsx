import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ActionIcons } from "./icons";
import type {
  FavoriteMediaFilter,
  FavoriteReadFilter,
  FavoriteSortMode,
} from "../utils/favoriteViewFilters";

export interface HeaderFavoriteToolbarProps {
  totalCount: number;
  visibleCount: number;
  unreadCount: number;
  readFilter: FavoriteReadFilter;
  mediaFilter: FavoriteMediaFilter;
  sortMode: FavoriteSortMode;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  onReadFilterChange: (filter: FavoriteReadFilter) => void;
  onMediaFilterChange: (filter: FavoriteMediaFilter) => void;
  onSortModeChange: (mode: FavoriteSortMode) => void;
  onClearFilters: () => void;
}

const mediaOptions: Array<{ value: FavoriteMediaFilter; label: string }> = [
  { value: "all", label: "Todos os tipos" },
  { value: "article", label: "Artigos" },
  { value: "podcast", label: "Podcasts" },
  { value: "video", label: "Vídeos" },
  { value: "unknown", label: "Outros" },
];

const sortOptions: Array<{ value: FavoriteSortMode; label: string }> = [
  { value: "saved-desc", label: "Salvos recentemente" },
  { value: "published-desc", label: "Publicados recentemente" },
  { value: "source-asc", label: "Fonte A-Z" },
];

const nextReadFilter: Record<FavoriteReadFilter, FavoriteReadFilter> = {
  all: "unread",
  unread: "read",
  read: "all",
};

interface ToolbarDropdownProps<T extends string> {
  icon: React.ReactNode;
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  ariaLabel: string;
  onChange: (value: T) => void;
}

const ToolbarDropdown = <T extends string>({
  icon,
  label,
  value,
  options,
  ariaLabel,
  onChange,
}: ToolbarDropdownProps<T>) => {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{
    left: number;
    top: number;
    minWidth: number;
  } | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const updateMenuPosition = () => {
    if (!wrapperRef.current || typeof window === "undefined") return;

    const rect = wrapperRef.current.getBoundingClientRect();
    const minWidth = Math.max(224, Math.ceil(rect.width));
    const viewportPadding = 8;
    const maxLeft = Math.max(
      viewportPadding,
      window.innerWidth - minWidth - viewportPadding,
    );

    setMenuPos({
      top: Math.round(rect.bottom + 8),
      left: Math.min(Math.max(viewportPadding, rect.right - minWidth), maxLeft),
      minWidth,
    });
  };

  useLayoutEffect(() => {
    if (!open) {
      setMenuPos(null);
      return;
    }

    updateMenuPosition();
  }, [open, label]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !wrapperRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    const handleViewportChange = () => updateMenuPosition();

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleViewportChange, { passive: true });
    window.addEventListener("scroll", handleViewportChange, {
      capture: true,
      passive: true,
    });
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, {
        capture: true,
      });
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="favorites-header-toolbar__dropdown">
      <button
        type="button"
        className="favorites-header-toolbar__control"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        title={label}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="favorites-header-toolbar__icon" aria-hidden="true">
          {icon}
        </span>
        <span className="favorites-header-toolbar__label">{label}</span>
        <ActionIcons.ChevronDown
          className="favorites-header-toolbar__chevron"
        />
      </button>

      {open &&
        menuPos &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            className="favorites-header-toolbar__menu"
            role="listbox"
            aria-label={ariaLabel}
            style={{
              left: menuPos.left,
              top: menuPos.top,
              minWidth: menuPos.minWidth,
              maxHeight: `calc(100vh - ${menuPos.top + 8}px)`,
            }}
          >
            {options.map((option) => {
              const selected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className="favorites-header-toolbar__option"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <span>{option.label}</span>
                  <ActionIcons.Confirm
                    className="favorites-header-toolbar__check"
                  />
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </div>
  );
};

export const FavoritesHeaderToolbar: React.FC<HeaderFavoriteToolbarProps> = ({
  totalCount,
  visibleCount,
  unreadCount,
  readFilter,
  mediaFilter,
  sortMode,
  hasActiveFilters,
  activeFilterCount,
  onReadFilterChange,
  onMediaFilterChange,
  onSortModeChange,
  onClearFilters,
}) => {
  const readCount = Math.max(0, totalCount - unreadCount);
  const readMeta = {
    all: {
      label: "Todos",
      count: totalCount,
      icon: <ActionIcons.Bookmark className="h-4 w-4" />,
      tone: "",
      ariaLabel: `Mostrando todos os ${totalCount} favoritos. Pressione para ver não lidos.`,
    },
    unread: {
      label: "Não lidos",
      count: unreadCount,
      icon: <ActionIcons.Hide className="h-4 w-4" />,
      tone: "unread",
      ariaLabel: `Mostrando ${unreadCount} favoritos não lidos. Pressione para ver lidos.`,
    },
    read: {
      label: "Lidos",
      count: readCount,
      icon: <ActionIcons.Show className="h-4 w-4" />,
      tone: "read",
      ariaLabel: `Mostrando ${readCount} favoritos lidos. Pressione para ver todos.`,
    },
  }[readFilter];
  const mediaLabel =
    mediaOptions.find((option) => option.value === mediaFilter)?.label ||
    "Todos os tipos";
  const sortLabel =
    sortOptions.find((option) => option.value === sortMode)?.label ||
    "Salvos recentemente";

  return (
    <div
      className="favorites-header-toolbar"
      role="toolbar"
      aria-label="Filtros de favoritos"
      data-visible-count={visibleCount}
    >
      <button
        type="button"
        className="favorites-header-toolbar__control favorites-header-toolbar__read"
        data-tone={readMeta.tone || undefined}
        aria-label={readMeta.ariaLabel}
        title={`${readMeta.label}: ${readMeta.count}`}
        onClick={() => onReadFilterChange(nextReadFilter[readFilter])}
      >
        <span className="favorites-header-toolbar__icon" aria-hidden="true">
          {readMeta.icon}
        </span>
        <span className="favorites-header-toolbar__label">
          {readMeta.label}
        </span>
        <span className="favorites-header-toolbar__separator" aria-hidden="true">
          ·
        </span>
        <span
          key={`${readFilter}-${readMeta.count}`}
          className="favorites-header-toolbar__count"
        >
          {readMeta.count}
        </span>
      </button>

      <ToolbarDropdown
        icon={<ActionIcons.Layers className="h-4 w-4" />}
        label={mediaLabel}
        value={mediaFilter}
        options={mediaOptions}
        ariaLabel="Tipo de favorito"
        onChange={onMediaFilterChange}
      />

      <ToolbarDropdown
        icon={<ActionIcons.SortDesc className="h-4 w-4" />}
        label={sortLabel}
        value={sortMode}
        options={sortOptions}
        ariaLabel="Ordenação de favoritos"
        onChange={onSortModeChange}
      />

      {hasActiveFilters && (
        <button
          type="button"
          className="favorites-header-toolbar__clear"
          aria-label="Limpar filtros"
          title="Limpar filtros"
          onClick={onClearFilters}
        >
          <ActionIcons.Close className="h-3.5 w-3.5" />
          <span>Limpar ({activeFilterCount})</span>
        </button>
      )}
    </div>
  );
};
