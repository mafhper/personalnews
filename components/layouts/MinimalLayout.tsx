import React from 'react';
import { Article } from '../../types';
import { SmallOptimizedImage } from '../SmallOptimizedImage';

interface MinimalLayoutProps {
  articles: Article[];
  timeFormat: '12h' | '24h';
}

export const MinimalLayout: React.FC<MinimalLayoutProps> = ({ articles }) => {
  return (
    <div className="max-w-3xl mx-auto space-y-16 py-12 animate-in fade-in duration-500">
      {articles.map((article, index) => (
        <article key={`${article.link}-${index}`} className="group cursor-pointer">
          <a href={article.link} target="_blank" rel="noopener noreferrer" className="block space-y-4">
            {/* Meta */}
            <div className="flex items-center space-x-3 text-xs tracking-widest uppercase text-gray-500">
              <span className="text-[rgb(var(--color-accent))] font-bold">{article.sourceTitle}</span>
              <span>•</span>
              <time dateTime={article.pubDate.toISOString()}>
                {article.pubDate.toLocaleDateString()}
              </time>
            </div>

            {/* Title */}
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-100 group-hover:text-[rgb(var(--color-accent))] transition-colors leading-tight">
              {article.title}
            </h2>

            {/* Author */}
            {article.author && (
              <p className="text-sm text-gray-400 italic">
                by {article.author}
              </p>
            )}

            {/* Image (Optional/Subtle) */}
            {index < 3 && (
              <div className="mt-6 rounded-lg overflow-hidden opacity-80 group-hover:opacity-100 transition-opacity">
                 <SmallOptimizedImage
                    src={article.imageUrl}
                    alt={article.title}
                    className="w-full h-64 object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                    fallbackText={article.sourceTitle}
                    size={800}
                 />
              </div>
            )}
            
            <div className="w-12 h-px bg-gray-800 mt-12 group-hover:w-full group-hover:bg-[rgb(var(--color-accent))] transition-all duration-500" />
          </a>
        </article>
      ))}
    </div>
  );
};
