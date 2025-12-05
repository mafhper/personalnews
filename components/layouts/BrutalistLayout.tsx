import React from 'react';
import { Article } from '../../types';

interface BrutalistLayoutProps {
  articles: Article[];
  timeFormat: '12h' | '24h';
}

export const BrutalistLayout: React.FC<BrutalistLayoutProps> = ({ articles }) => {
  return (
    <div className="space-y-0 border-4 border-black dark:border-white bg-[rgb(var(--color-background))]">
      {/* Brutalist Header */}
      <div className="bg-[rgb(var(--color-accent))] p-8 border-b-4 border-black dark:border-white">
        <h1 className="text-6xl md:text-9xl font-black uppercase tracking-tighter text-white break-words leading-[0.8]">
          THE FEED
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y-4 divide-black dark:divide-white md:divide-y-0 md:divide-x-4">
        {articles.map((article, index) => (
          <article 
            key={article.link} 
            className={`
              p-6 group hover:bg-[rgb(var(--color-accent))] hover:text-white transition-colors duration-0
              ${index % 3 === 0 ? 'md:col-span-2 lg:col-span-1' : ''}
              border-b-4 border-black dark:border-white md:border-b-0
            `}
          >
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-start mb-4 border-b-2 border-current pb-2">
                <span className="font-mono text-xs uppercase font-bold">
                  {article.sourceTitle}
                </span>
                <span className="font-mono text-xs font-bold">
                  {new Date(article.pubDate).toLocaleDateString()}
                </span>
              </div>

              {article.imageUrl && (
                <div className="mb-6 border-2 border-current p-1 bg-white dark:bg-black group-hover:bg-transparent">
                  <img 
                    src={article.imageUrl} 
                    alt="" 
                    className="w-full h-56 object-cover border border-current"
                  />
                </div>
              )}
              
              <div className="flex-1">
                <h2 className="text-2xl md:text-4xl font-black uppercase leading-none mb-4 group-hover:underline decoration-4 break-words">
                  <a href={article.link} target="_blank" rel="noopener noreferrer">
                    {article.title}
                  </a>
                </h2>
                
                <p className="font-mono text-sm md:text-base mb-6 line-clamp-4 font-medium">
                  {article.description}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
