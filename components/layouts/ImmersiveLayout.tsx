import React from 'react';
import { Article } from '../../types';
import { ArticleItem } from '../ArticleItem';

interface ImmersiveLayoutProps {
  articles: Article[];
  timeFormat: '12h' | '24h';
}

export const ImmersiveLayout: React.FC<ImmersiveLayoutProps> = ({ articles, timeFormat }) => {
  const featuredArticle = articles[0];
  const otherArticles = articles.slice(1);

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      {featuredArticle && (
        <div className="relative h-[70vh] rounded-3xl overflow-hidden group">
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{ 
              backgroundImage: `url(${featuredArticle.imageUrl || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=2070&auto=format&fit=crop'})` 
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 max-w-4xl">
            <div className="inline-block px-3 py-1 bg-[rgb(var(--color-accent))] text-white text-xs font-bold uppercase tracking-wider rounded-full mb-4">
              Featured
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
              <a href={featuredArticle.link} target="_blank" rel="noopener noreferrer" className="hover:underline decoration-4 decoration-[rgb(var(--color-accent))] underline-offset-8">
                {featuredArticle.title}
              </a>
            </h1>
            <p className="text-lg md:text-xl text-gray-200 line-clamp-3 mb-6 max-w-2xl">
              {featuredArticle.description}
            </p>
            <div className="flex items-center space-x-4 text-sm text-gray-300">
              <span className="font-medium text-white">{featuredArticle.sourceTitle}</span>
              <span>•</span>
              <span>{new Date(featuredArticle.pubDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Horizontal Strips */}
      <div className="space-y-8">
        <h2 className="text-2xl font-bold text-[rgb(var(--color-text))] px-4 border-l-4 border-[rgb(var(--color-accent))]">
          Trending Now
        </h2>
        <div className="flex overflow-x-auto space-x-6 pb-8 px-4 snap-x snap-mandatory no-scrollbar mask-linear-fade">
          {otherArticles.map((article) => (
            <div key={article.link} className="flex-shrink-0 w-80 snap-center">
              <ArticleItem 
                article={article} 
                layoutMode="grid" 
                density="comfortable" 
                timeFormat={timeFormat}
                showImage={true}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
