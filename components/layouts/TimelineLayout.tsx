import React from 'react';
import { Article } from '../../types';

interface TimelineLayoutProps {
  articles: Article[];
  timeFormat: '12h' | '24h';
}

export const TimelineLayout: React.FC<TimelineLayoutProps> = ({ articles, timeFormat }) => {
  // Group articles by date
  const groupedArticles = articles.reduce((acc, article) => {
    const date = new Date(article.pubDate).toLocaleDateString(undefined, { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(article);
    return acc;
  }, {} as Record<string, Article[]>);

  return (
    <div className="max-w-3xl mx-auto relative">
      {/* Vertical Line */}
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-[rgb(var(--color-border))]" />

      {Object.entries(groupedArticles).map(([date, dateArticles]) => (
        <div key={date} className="mb-12 relative">
          {/* Date Header */}
          <div className="sticky top-20 z-10 mb-8 ml-16">
            <span className="inline-block px-4 py-2 bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-full text-sm font-bold text-[rgb(var(--color-text))] shadow-sm">
              {date}
            </span>
          </div>

          <div className="space-y-8">
            {dateArticles.map((article) => (
              <article key={article.link} className="relative pl-16 group">
                {/* Timeline Dot */}
                <div className="absolute left-[30px] top-6 w-3 h-3 rounded-full bg-[rgb(var(--color-accent))] border-4 border-[rgb(var(--color-background))] shadow-sm group-hover:scale-125 transition-transform" />

                <div className="bg-[rgb(var(--color-surface))] p-6 rounded-2xl border border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-accent))] transition-colors shadow-sm hover:shadow-md">
                  <div className="flex items-center space-x-2 text-xs text-[rgb(var(--color-textSecondary))] mb-2">
                    <span className="font-medium text-[rgb(var(--color-accent))]">{article.sourceTitle}</span>
                    <span>•</span>
                    <span>
                      {new Date(article.pubDate).toLocaleTimeString(undefined, { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        hour12: timeFormat === '12h'
                      })}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-[rgb(var(--color-text))] mb-3 leading-tight">
                    <a href={article.link} target="_blank" rel="noopener noreferrer" className="hover:text-[rgb(var(--color-accent))]">
                      {article.title}
                    </a>
                  </h3>

                  {article.imageUrl && (
                    <div className="mb-4 rounded-xl overflow-hidden h-48">
                      <img src={article.imageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <p className="text-[rgb(var(--color-textSecondary))] text-sm line-clamp-3">
                    {article.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
