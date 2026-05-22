import React from "react";
import { ChevronDown } from "lucide-react";
import { FeedManagerSectionHeader } from "./FeedManagerSectionHeader";

type FeedManagerAccordionTone = "neutral" | "warning" | "danger";

interface FeedManagerAccordionSectionProps {
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  description?: string;
  eyebrow: string;
  icon?: React.ReactNode;
  id: string;
  isOpen: boolean;
  onToggle: () => void;
  title: string;
  tone?: FeedManagerAccordionTone;
}

export const FeedManagerAccordionSection: React.FC<
  FeedManagerAccordionSectionProps
> = ({
  actions,
  children,
  className = "",
  description,
  eyebrow,
  icon,
  id,
  isOpen,
  onToggle,
  title,
  tone = "neutral",
}) => {
  const bodyId = `${id}-body`;

  return (
    <section
      id={id}
      className={`feed-manager-accordion-section feed-manager-anchor-section ${
        isOpen ? "" : "feed-manager-accordion-section--collapsed"
      } ${className}`.trim()}
    >
      <FeedManagerSectionHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        icon={icon}
        tone={tone}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {actions}
            <button
              type="button"
              className="feed-manager-accordion-toggle"
              aria-expanded={isOpen}
              aria-controls={bodyId}
              aria-label={`${isOpen ? "Recolher" : "Expandir"} ${title}`}
              onClick={onToggle}
            >
              <span>{isOpen ? "Recolher" : "Expandir"}</span>
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        }
      />
      <div id={bodyId} className="feed-manager-accordion-body" hidden={!isOpen}>
        {children}
      </div>
    </section>
  );
};
