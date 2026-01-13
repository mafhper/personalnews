import React, { useState } from 'react';
import { Article } from '../../types';
import { ArticleItem } from '../ArticleItem';
import { FeaturedArticle } from '../FeaturedArticle';
import { ArticleReaderModal } from '../ArticleReaderModal';
import { useLanguage } from '../../contexts/LanguageContext';

interface MasonryLayoutProps {
  articles: Article[];
  timeFormat: '12h' | '24h';
}

export const MasonryLayout: React.FC<MasonryLayoutProps> = ({ articles, timeFormat }) => {
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);
  const { t } = useLanguage();
  const featured = articles[0];
  const rest = articles.slice(1);

  const handleOpenReader = (article: Article) => {
    setReadingArticle(article);
  };

  const handleNextArticle = () => {
    if (!readingArticle) return;
    const currentIndex = articles.findIndex(a => a.link === readingArticle.link);
    if (currentIndex < articles.length - 1) {
      setReadingArticle(articles[currentIndex + 1]);
    }
  };

  const handlePrevArticle = () => {
    if (!readingArticle) return;
    const currentIndex = articles.findIndex(a => a.link === readingArticle.link);
    if (currentIndex > 0) {
      setReadingArticle(articles[currentIndex - 1]);
    }
  };

  return (
    <div className="max-w-[1800px] mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Featured Article - Full Width Hero */}
      <div className="h-[60vh] min-h-[400px] rounded-2xl overflow-hidden shadow-2xl relative group">
        <FeaturedArticle article={featured} timeFormat={timeFormat} />
         {/* Preview Button for Featured */}
         <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity p-4">
            <button
                onClick={() => handleOpenReader(featured)}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg hover:scale-105 transition-all"
            >
                {t('action.preview')}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            </button>
         </div>
      </div>

      {/* Masonry Grid */}
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
        {rest.map((article, index) => (
          <div key={`${article.link}-${index}`} className="break-inside-avoid mb-6">
            <div className="bg-gray-800/40 backdrop-blur-sm border border-white/5 rounded-xl overflow-hidden hover:border-white/20 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 p-5 relative group">
              <ArticleItem article={article} index={index + 2} timeFormat={timeFormat} onClick={handleOpenReader} />
            </div>
          </div>
        ))}
      </div>

      {readingArticle && (
        <ArticleReaderModal 
          article={readingArticle}
          onClose={() => setReadingArticle(null)}
          onNext={handleNextArticle}
          onPrev={handlePrevArticle}
          hasNext={articles.findIndex(a => a.link === readingArticle.link) < articles.length - 1}
          hasPrev={articles.findIndex(a => a.link === readingArticle.link) > 0}
        />
      )}
    </div>
  );
};
