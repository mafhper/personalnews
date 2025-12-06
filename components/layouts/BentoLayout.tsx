import React, { useState } from 'react';
import { Article } from '../../types';
import { ArticleReaderModal } from '../ArticleReaderModal';

interface BentoLayoutProps {
  articles: Article[];
  timeFormat: '12h' | '24h';
}

export const BentoLayout: React.FC<BentoLayoutProps> = ({ articles }) => {
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);
  
  // Helper to determine size classes based on index
  // Pattern repeats every 10 items to ensure a nice mix without gaps
  // 4 column grid
  const getSpanClasses = (index: number) => {
    const patternIndex = index % 12;
    
    switch (patternIndex) {
      case 0: return "md:col-span-2 md:row-span-2"; // Big Box (2x2)
      case 1: return "md:col-span-1 md:row-span-2"; // Tall (1x2)
      case 2: return "md:col-span-1 md:row-span-2"; // Tall (1x2)
      // Row 1 & 2 full (2+1+1 = 4)
      
      case 3: return "md:col-span-2 md:row-span-1"; // Wide (2x1)
      case 4: return "md:col-span-1 md:row-span-1"; // Standard
      case 5: return "md:col-span-1 md:row-span-1"; // Standard
      // Row 3 full (2+1+1 = 4)

      case 6: return "md:col-span-1 md:row-span-2"; // Tall (1x2)
      case 7: return "md:col-span-2 md:row-span-2"; // Big Box (2x2)
      case 8: return "md:col-span-1 md:row-span-1"; // Standard
      // Row 4 (1+2+1 = 4) - but index 8 is 1x1, leaving a 1x1 hole below it next to the 2x2?
      // Wait, if 6 is 1x2 (rows 4,5), 7 is 2x2 (rows 4,5). 
      // We have 1 column left in row 4. Item 8 (1x1) fills it.
      // Row 4 is full.
      
      // Row 5: Item 6 and 7 are still taking space. 
      // Item 6 takes col 1. Item 7 takes col 2,3.
      // We have col 4 open in row 5.
      case 9: return "md:col-span-1 md:row-span-1"; // Standard (fills row 5 slot)
      // Row 5 full.

      case 10: return "md:col-span-2 md:row-span-1"; // Wide (2x1)
      case 11: return "md:col-span-2 md:row-span-1"; // Wide (2x1)
      // Row 6 full.
      
      default: return "md:col-span-1 md:row-span-1";
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 auto-rows-[220px] gap-4 p-4 grid-flow-dense">
        {articles.map((article, index) => {
          const spanClass = getSpanClasses(index);
          const isLarge = spanClass.includes('col-span-2') && spanClass.includes('row-span-2');

          return (
            <article 
              key={article.link} 
              onClick={() => setReadingArticle(article)}
              className={`
                ${spanClass} 
                group relative overflow-hidden rounded-3xl bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))]
                hover:shadow-xl transition-all duration-300 cursor-pointer
              `}
            >
              {article.imageUrl ? (
                <div className="absolute inset-0">
                  <img 
                    src={article.imageUrl} 
                    alt="" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                </div>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[rgb(var(--color-surface))] to-[rgb(var(--color-background))]" />
              )}

              <div className="absolute inset-0 p-5 flex flex-col justify-end">
                <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <div className="flex items-center space-x-2 text-xs text-gray-200 mb-2 opacity-0 group-hover:opacity-100 transition-opacity delay-75">
                    <span className="bg-[rgb(var(--color-accent))] px-2 py-0.5 rounded-full text-white font-bold shadow-sm">
                      {article.sourceTitle}
                    </span>
                    <span className="shadow-black drop-shadow-md">{new Date(article.pubDate).toLocaleDateString()}</span>
                  </div>
                  
                  <h3 className={`font-bold text-white leading-tight mb-1 drop-shadow-md ${isLarge ? 'text-2xl md:text-3xl' : 'text-lg'}`}>
                    <span className="hover:underline decoration-2 underline-offset-4">
                      {article.title}
                    </span>
                  </h3>
                  
                  {isLarge && (
                    <p className="text-gray-200 text-sm line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity delay-100 drop-shadow-sm">
                      {article.description}
                    </p>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {readingArticle && (
        <ArticleReaderModal 
          article={readingArticle}
          onClose={() => setReadingArticle(null)}
          onNext={() => {}}
          onPrev={() => {}}
          hasNext={false}
          hasPrev={false}
        />
      )}
    </>
  );
};