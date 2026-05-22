import React from "react";

type FeedManagerSectionHeaderTone = "neutral" | "warning" | "danger";

interface FeedManagerSectionHeaderProps {
  action?: React.ReactNode;
  description?: string;
  eyebrow: string;
  icon?: React.ReactNode;
  title: string;
  tone?: FeedManagerSectionHeaderTone;
}

export const FeedManagerSectionHeader: React.FC<
  FeedManagerSectionHeaderProps
> = ({ action, description, eyebrow, icon, title, tone = "neutral" }) => (
  <div className={`feed-manager-section-header feed-manager-section-header--${tone}`}>
    {icon && (
      <span className="feed-manager-section-header__icon" aria-hidden="true">
        {icon}
      </span>
    )}
    <div className="feed-manager-section-header__content">
      <p>{eyebrow}</p>
      <h2>{title}</h2>
      {description && <span>{description}</span>}
    </div>
    {action && (
      <div className="feed-manager-section-header__action">{action}</div>
    )}
  </div>
);
