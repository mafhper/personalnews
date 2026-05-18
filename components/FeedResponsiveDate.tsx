import React from "react";

interface FeedResponsiveDateProps {
  date: Date | string;
  className?: string;
  hour12?: boolean;
  includeTime?: boolean;
}

const toDate = (date: Date | string) =>
  typeof date === "string" ? new Date(date) : date;

export const FeedResponsiveDate: React.FC<FeedResponsiveDateProps> = ({
  date,
  className = "",
  hour12 = false,
  includeTime = true,
}) => {
  const value = toDate(date);
  const safeDate = Number.isNaN(value.getTime()) ? new Date() : value;
  const full = includeTime
    ? safeDate.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12,
      })
    : safeDate.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
  const medium = includeTime
    ? safeDate.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12,
      })
    : safeDate.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
      });
  const compact = includeTime
    ? safeDate.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12,
      })
    : safeDate.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      });

  return (
    <time
      className={`feed-responsive-date ${className}`.trim()}
      dateTime={safeDate.toISOString()}
      title={full}
      aria-label={`Publicado em ${full}`}
    >
      <span className="feed-date-full">{full}</span>
      <span className="feed-date-medium">{medium}</span>
      <span className="feed-date-compact">{compact}</span>
    </time>
  );
};
