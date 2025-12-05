import React from 'react';
import { Article } from '../../types';

interface BentoLayoutProps {
  articles: Article[];
  timeFormat: '12h' | '24h';
}

export const BentoLayout: React.FC<BentoLayoutProps> = ({ articles }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 auto-rows-[200px] gap-4">
      {articles.map((article, index) => {
        // Determine span based on index/pattern
        const isLarge = index === 0 || index === 7;
        const isTall = index === 2 || index === 5;
        const isWide = index === 3 || index === 6;
        
        let spanClass = "md:col-span-1 md:row-span-1";
        if (isLarge) spanClass = "md:col-span-2 md:row-span-2";
        else if (isTall) spanClass = "md:col-span-1 md:row-span-2";
        else if (isWide) spanClass = "md:col-span-2 md:row-span-1";

        return (
          <article 
            key={article.link} 
            className={`
              ${spanClass} 
              group relative overflow-hidden rounded-3xl bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))]
              hover:shadow-xl transition-all duration-300
            `}
          >
            {article.imageUrl ? (
              <div className="absolute inset-0">
                <img 
                  src={article.imageUrl} 
                  alt="" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90" />
              </div>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[rgb(var(--color-surface))] to-[rgb(var(--color-background))]" />
            )}

            <div className="absolute inset-0 p-6 flex flex-col justify-end">
              <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <div className="flex items-center space-x-2 text-xs text-gray-300 mb-2 opacity-0 group-hover:opacity-100 transition-opacity delay-100">
                  <span className="bg-[rgb(var(--color-accent))] px-2 py-0.5 rounded-full text-white font-bold">
                    {article.sourceTitle}
                  </span>
                  <span>{new Date(article.pubDate).toLocaleDateString()}</span>
                </div>
                
                <h3 className={`font-bold text-white leading-tight mb-2 ${isLarge ? 'text-3xl' : 'text-lg'}`}>
                  <a href={article.link} target="_blank" rel="noopener noreferrer" className="hover:underline decoration-2 underline-offset-4">
                    {article.title}
                  </a>
                </h3>
                
                {isLarge && (
                  <p className="text-gray-300 text-sm line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity delay-200">
                    {article.description}
                  </p>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
};
