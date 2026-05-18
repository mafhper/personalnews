import React, { memo, useCallback } from "react";
import { useFavorites } from "../hooks/useFavorites";
import type { Article } from "../types";

interface HeartIconProps {
  filled?: boolean;
  className?: string;
}

const HeartIcon: React.FC<HeartIconProps> = memo(
  ({ filled = false, className = "" }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill={filled ? "currentColor" : "none"}
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
  )
);

HeartIcon.displayName = "HeartIcon";

export interface FavoriteButtonProps {
  article: Article;
  size?: "small" | "medium" | "large";
  position?: "overlay" | "inline";
  className?: string;
  "aria-label"?: string;
  title?: string;
}

const FavoriteButtonComponent: React.FC<FavoriteButtonProps> = ({
  article,
  size = "medium",
  position = "overlay",
  className = "",
  "aria-label": ariaLabel,
  title,
}) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const isFavorited = isFavorite(article);

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      toggleFavorite(article);
    },
    [toggleFavorite, article]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(article);
      }
    },
    [toggleFavorite, article]
  );

  // Favorite controls use one visual size everywhere so cards do not drift
  // when individual layouts pass different size props.
  const sizeClasses = {
    small: {
      container: "h-8 w-8 p-1.5",
      icon: "h-4 w-4",
    },
    medium: {
      container: "h-8 w-8 p-1.5",
      icon: "h-4 w-4",
    },
    large: {
      container: "h-8 w-8 p-1.5",
      icon: "h-4 w-4",
    },
  };

  // Position-specific styles
  const positionClasses = {
    overlay: "absolute",
    inline: "relative",
  };

  // Base styles that apply to all variants
  const baseClasses = `
    feed-card-favorite-control
    ${sizeClasses[size].container}
    ${positionClasses[position]}
    rounded-full
    border
    border-[rgba(var(--color-error-500),0.45)]
    transition-all duration-200 ease-in-out
    flex items-center justify-center
    focus:outline-none
    focus:ring-2 focus:ring-[rgb(var(--color-error-500))]
    focus:ring-offset-2 focus:ring-offset-transparent
    ${className}
  `;

  const stateClasses = `
    !bg-[rgb(var(--color-error-500))]
    !text-white
    shadow-md shadow-red-950/25
    backdrop-blur-sm
    hover:brightness-110
    ${isFavorited ? "ring-1 ring-white/35" : ""}
  `;

  // Generate accessible labels
  const defaultAriaLabel = isFavorited
    ? "Remove from favorites"
    : "Add to favorites";
  const defaultTitle = isFavorited
    ? "Remove from favorites"
    : "Add to favorites";

  return (
    <button
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      className={`${baseClasses} ${stateClasses}`}
      aria-label={ariaLabel || defaultAriaLabel}
      aria-pressed={isFavorited}
      title={title || defaultTitle}
      type="button"
      role="button"
      tabIndex={0}
    >
      <HeartIcon filled={isFavorited} className={sizeClasses[size].icon} />
    </button>
  );
};

// Custom comparison function for React.memo
const arePropsEqual = (
  prevProps: FavoriteButtonProps,
  nextProps: FavoriteButtonProps
): boolean => {
  return (
    prevProps.article.link === nextProps.article.link &&
    prevProps.size === nextProps.size &&
    prevProps.position === nextProps.position &&
    prevProps.className === nextProps.className &&
    prevProps["aria-label"] === nextProps["aria-label"] &&
    prevProps.title === nextProps.title
  );
};

export const FavoriteButton = memo(FavoriteButtonComponent, arePropsEqual);
