import React, { useState, useMemo } from 'react';
import { Article } from '../../types';
import { ArticleReaderModal } from '../ArticleReaderModal';

interface TimelineLayoutProps {
  articles: Article[];
  timeFormat: '12h' | '24h';
}

export const TimelineLayout: React.FC<TimelineLayoutProps> = ({ articles, timeFormat }) => {
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);

  // Group articles by date
  // We use useMemo to avoid recalculating on every render
  const { groupedArticles, navigationList } = useMemo(() => {
    const groups = articles.reduce((acc, article) => {
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

    // Create a flat list consistent with the visual grouping for navigation
    // We iterate Object.entries to ensure we match the rendering order
    const flatList = Object.entries(groups).flatMap(([_, groupArticles]) => groupArticles);

    return { groupedArticles: groups, navigationList: flatList };
  }, [articles]);

  const handleOpenReader = (article: Article) => {
    setReadingArticle(article);
  };

  const handleNextArticle = () => {
    if (!readingArticle) return;
    const currentIndex = navigationList.findIndex(a => a.link === readingArticle.link);
    if (currentIndex < navigationList.length - 1) {
      setReadingArticle(navigationList[currentIndex + 1]);
    }
  };

  const handlePrevArticle = () => {
    if (!readingArticle) return;
    const currentIndex = navigationList.findIndex(a => a.link === readingArticle.link);
    if (currentIndex > 0) {
      setReadingArticle(navigationList[currentIndex - 1]);
    }
  };

  // Helper to check navigation state
  const currentNavIndex = readingArticle ? navigationList.findIndex(a => a.link === readingArticle.link) : -1;
  const hasNext = currentNavIndex !== -1 && currentNavIndex < navigationList.length - 1;
  const hasPrev = currentNavIndex > 0;

  return (
    <div className="max-w-3xl mx-auto relative animate-in fade-in duration-500">
      {/* Vertical Line */}
      <div className="absolute left-4 md:left-8 top-0 bottom-0 w-0.5 bg-[rgb(var(--color-border))]" />

      {Object.entries(groupedArticles).map(([date, dateArticles]) => (
        <div key={date} className="mb-12 relative">
          {/* Date Header */}
          <div className="sticky top-20 z-10 mb-8 ml-10 md:ml-16">
            <span className="inline-block px-4 py-2 bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-full text-sm font-bold text-[rgb(var(--color-text))] shadow-sm capitalize">
              {date}
            </span>
          </div>

          <div className="space-y-8">
            {dateArticles.map((article) => (
              <article key={article.link} className="relative pl-10 md:pl-16 group">
                {/* Timeline Dot */}
                <div className="absolute left-[14px] md:left-[30px] top-6 w-3 h-3 rounded-full bg-[rgb(var(--color-accent))] border-4 border-[rgb(var(--color-background))] shadow-sm group-hover:scale-125 transition-transform" />

                <div className="bg-[rgb(var(--color-surface))] p-4 md:p-6 rounded-2xl border border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-accent))] transition-all shadow-sm hover:shadow-md relative overflow-hidden">
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

                  <h3 
                    className="text-xl font-bold text-[rgb(var(--color-text))] mb-3 leading-tight cursor-pointer hover:text-[rgb(var(--color-accent))] transition-colors"
                    onClick={() => handleOpenReader(article)}
                  >
                    {article.title}
                  </h3>

                  {article.imageUrl && (
                    <div 
                        className="mb-4 rounded-xl overflow-hidden h-48 cursor-pointer"
                        onClick={() => handleOpenReader(article)}
                    >
                      <img src={article.imageUrl} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    </div>
                  )}

                  <div className="relative">
                    <p className="text-[rgb(var(--color-textSecondary))] text-sm line-clamp-6 mb-2 leading-relaxed">
                        {article.description}
                        {/* Simulate more text if description is short for visual balance request */}
                        {(!article.description || article.description.length < 100) && (
                            <span className="opacity-50"> {article.description} {article.description}</span>
                        )}
                    </p>
                    
                    {/* Overlay with Preview Button */}
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[rgb(var(--color-surface))] to-transparent flex items-end justify-center pb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                         {/* Button needs pointer-events-auto to work inside pointer-events-none parent */}
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleOpenReader(article); }}
                            className="pointer-events-auto bg-[rgb(var(--color-accent))] text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg hover:scale-105 transition-transform"
                        >
                            Preview
                        </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      ))}

      {readingArticle && (
        <ArticleReaderModal 
          article={readingArticle}
          onClose={() => setReadingArticle(null)}
          onNext={handleNextArticle}
          onPrev={handlePrevArticle}
          hasNext={hasNext}
          hasPrev={hasPrev}
        />
      )}
    </div>
  );
};
