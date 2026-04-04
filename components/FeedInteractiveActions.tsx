import React from "react";
import { useLanguage } from "../hooks/useLanguage";
import { openExternalLink } from "../utils/openExternalLink";

const ExternalLinkIcon: React.FC<{ className?: string }> = ({
  className = "",
}) => (
  <svg
    className={`feed-interactive-actions__icon shrink-0 ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
    />
  </svg>
);

export type FeedInteractiveActionsVariant =
  | "default"
  | "onDarkMedia"
  | "brutalist"
  | "terminal";

export interface FeedInteractiveActionsProps {
  articleLink: string;
  onRead: () => void;
  /** When set with showWatch, opens in-player / custom behavior */
  onWatch?: () => void;
  showWatch?: boolean;
  /** Primary read control; set false only in edge cases */
  showRead?: boolean;
  /** Force showing the visit link alongside other buttons */
  showVisit?: boolean;
  className?: string;
  /** Skip hover-hide (large hero cells, always-on toolbars) */
  forceVisible?: boolean;
  variant?: FeedInteractiveActionsVariant;
  /** Brutalist: second button style when video panel is open */
  watchActive?: boolean;
}

/**
 * Universal LER / ASSISTIR (optional) / VISITAR for feed cards.
 * Relies on an ancestor with `group` for hover reveal unless forceVisible.
 */
export const FeedInteractiveActions: React.FC<FeedInteractiveActionsProps> = ({
  articleLink,
  onRead,
  onWatch,
  showWatch = false,
  showRead = true,
  showVisit = false,
  className = "",
  forceVisible = false,
  variant = "default",
  watchActive = false,
}) => {
  const { t } = useLanguage();
  const readLabel = t("action.read") || "LER";
  const visitLabel = t("action.visit") || "VISITAR";
  const watchLabel = t("action.watch") || "ASSISTIR";

  const rootClass = [
    "feed-card-actions",
    forceVisible ? "feed-card-actions--force-visible" : "",
    variant === "onDarkMedia" ? "feed-card-actions--on-dark-media" : "",
    variant === "brutalist" ? "feed-card-actions--brutalist" : "",
    variant === "terminal" ? "feed-card-actions--terminal" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const readBtnClass =
    variant === "brutalist"
      ? "brutalist-btn brutalist-btn-alt"
      : "feed-btn-action";

  const visitExtra = (() => {
    if (variant === "brutalist") return "brutalist-btn flex items-center gap-2";
    if (variant === "terminal")
      return "feed-btn-action feed-btn-action--terminal-visit"; // We'll add this to index.css if needed, or just let it inherit
    return "feed-btn-action feed-btn-action--visit";
  })();

  const watchBtnClass = (() => {
    if (variant === "brutalist") {
      return `brutalist-btn${watchActive ? " brutalist-btn-alt" : ""}`;
    }
    return "feed-btn-action feed-btn-action--watch";
  })();

  const stop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if ("stopImmediatePropagation" in e.nativeEvent) {
      e.nativeEvent.stopImmediatePropagation();
    }
  };

  const handleWatch = onWatch ?? onRead;

  return (
    <div className={rootClass}>
      <div className="flex flex-wrap items-center gap-3">
        {showRead && (
          <button
            type="button"
            onClick={(e) => {
              stop(e);
              onRead();
            }}
            className={readBtnClass}
          >
            {readLabel}
          </button>
        )}
        {showWatch && (
          <button
            type="button"
            onClick={(e) => {
              stop(e);
              handleWatch();
            }}
            className={watchBtnClass}
          >
            {watchLabel}
          </button>
        )}
        {(showVisit || (!showWatch && !showRead)) && (
          <button
            type="button"
            className={visitExtra}
            onClick={(e) => {
              stop(e);
              void openExternalLink(articleLink);
            }}
          >
            {variant !== "brutalist" && variant !== "terminal" && (
              <ExternalLinkIcon />
            )}
            {visitLabel}
            {(variant === "brutalist" || variant === "terminal") && (
              <ExternalLinkIcon className="w-4 h-4 ml-0.5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};
