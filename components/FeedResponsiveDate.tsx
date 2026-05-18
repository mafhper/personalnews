import React from "react";
import { useLanguage } from "../hooks/useLanguage";

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
  const { language } = useLanguage();
  const value = toDate(date);
  const safeDate = Number.isNaN(value.getTime()) ? new Date() : value;
  const locale = language === "es" ? "es-ES" : language;
  const day = safeDate.getDate();
  const month = safeDate.getMonth() + 1;
  const two = (value: number) => value.toString().padStart(2, "0");
  const numericDate =
    language === "en-US"
      ? `${two(month)}/${two(day)}`
      : `${two(day)}/${two(month)}`;
  const shortDate =
    language === "en-US" ? `${month}/${day}` : `${day}/${month}`;
  const time = safeDate.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12,
  });
  const compactTime = safeDate.toLocaleTimeString(locale, {
    hour: "numeric",
    minute: "2-digit",
    hour12,
  });
  const full = includeTime ? `${numericDate} - ${time}` : numericDate;
  const medium = includeTime ? `${shortDate} - ${time}` : shortDate;
  const compact = includeTime ? `${shortDate} - ${compactTime}` : shortDate;
  const accessible = includeTime
    ? safeDate.toLocaleString(locale, {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12,
      })
    : safeDate.toLocaleDateString(locale, {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

  return (
    <time
      className={`feed-responsive-date ${className}`.trim()}
      dateTime={safeDate.toISOString()}
      title={accessible}
      aria-label={`Publicado em ${accessible}`}
    >
      <span className="feed-date-full">{full}</span>
      <span className="feed-date-medium">{medium}</span>
      <span className="feed-date-compact">{compact}</span>
    </time>
  );
};
