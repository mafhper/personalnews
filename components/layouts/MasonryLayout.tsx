import React from 'react';
import { Article } from '../../types';
import { ArticleItem } from '../ArticleItem';
import { FeaturedArticle } from '../FeaturedArticle';

interface MasonryLayoutProps {
  articles: Article[];
  timeFormat: '12h' | '24h';
}

export const MasonryLayout: React.FC<MasonryLayoutProps> = ({ articles, timeFormat }) => {
  const featured = articles[0];
  const rest = articles.slice(1);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Featured Article - Full Width Hero */}
      <div className="h-[60vh] min-h-[400px] rounded-2xl overflow-hidden shadow-2xl">
        <FeaturedArticle article={featured} timeFormat={timeFormat} />
      </div>

      {/* Masonry Grid */}
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
        {rest.map((article, index) => (
          <div key={`${article.link}-${index}`} className="break-inside-avoid mb-6">
            <div className="bg-gray-800/40 backdrop-blur-sm border border-white/5 rounded-xl overflow-hidden hover:border-white/20 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <ArticleItem article={article} index={index + 2} timeFormat={timeFormat} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
