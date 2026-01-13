import React, { useState } from 'react';
import { Article } from '../../types';
import { FeaturedArticle } from '../FeaturedArticle';
import { SmallOptimizedImage } from '../SmallOptimizedImage';
import { ArticleReaderModal } from '../ArticleReaderModal';
import { useLanguage } from '../../contexts/LanguageContext';
import { FavoriteButton } from '../FavoriteButton';

interface PortalLayoutProps {
  articles: Article[];
  timeFormat: '12h' | '24h';
}

export const PortalLayout: React.FC<PortalLayoutProps> = ({ articles, timeFormat }) => {
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);
  const { t } = useLanguage();

  const mainFeatured = articles[0];
  const subFeatured = articles.slice(1, 3);
  const sidebar = articles.slice(3, 8);
  const feed = articles.slice(8);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Section: Main Featured + 2 Sub Featured */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Featured (8 cols) */}
        <div className="lg:col-span-8 h-[500px] rounded-xl overflow-hidden relative group">
           <FeaturedArticle article={mainFeatured} timeFormat={timeFormat} />
        </div>

        {/* Sub Featured (4 cols) */}
        <div className="lg:col-span-4 space-y-6 flex flex-col">
          {subFeatured.map((article, idx) => (
            <div key={idx} className="flex-1 relative rounded-xl overflow-hidden group cursor-pointer">
                <a href={article.link} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                    <div className="absolute inset-0">
                        <SmallOptimizedImage src={article.imageUrl} alt={article.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" fallbackText={article.sourceTitle} size={400} />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    
                    <FavoriteButton 
                      article={article} 
                      size="small" 
                      position="overlay"
                      className="top-3 right-3 z-20 bg-black/40 hover:bg-black/60 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    />

                    <div className="absolute bottom-0 p-4 w-full">
                        <span className="text-[10px] font-bold text-[rgb(var(--color-accent))] uppercase bg-black/50 px-2 py-1 rounded mb-2 inline-block truncate max-w-full">{article.sourceTitle}</span>
                        <h3 className="text-white font-bold text-lg leading-tight group-hover:underline line-clamp-2">{article.title}</h3>
                    </div>
                </a>
            </div>
          ))}
        </div>
      </div>

      {/* Content Grid: Feed + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 border-t border-white/10 pt-8">
        {/* Main Feed (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
            <h3 className="text-xl font-bold text-[rgb(var(--color-accent))] uppercase tracking-wider mb-6 border-b border-[rgb(var(--color-accent))]/30 pb-2 inline-block">Últimas Notícias</h3>
            {feed.map((article, idx) => (
                <article key={idx} className="flex gap-4 p-4 bg-gray-800/20 rounded-lg hover:bg-gray-800/40 transition-colors border border-white/5 relative group">
                    <div className="w-32 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                        <SmallOptimizedImage src={article.imageUrl} alt={article.title} className="w-full h-full object-cover" fallbackText={article.sourceTitle} size={200} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xs font-bold text-[rgb(var(--color-accent))] truncate max-w-[120px] sm:max-w-[200px]">{article.sourceTitle}</span>
                                <span className="text-xs text-gray-500 flex-shrink-0">•</span>
                                <time className="text-xs text-gray-500 flex-shrink-0">{article.pubDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</time>
                            </div>
                            <div className="flex-shrink-0">
                              <FavoriteButton 
                                article={article} 
                                size="small" 
                                position="inline"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              />
                            </div>
                        </div>
                        <h4 className="text-lg font-bold text-gray-200 leading-tight mb-2 hover:text-[rgb(var(--color-accent))] cursor-pointer">
                            <a href={article.link} target="_blank" rel="noopener noreferrer">{article.title}</a>
                        </h4>
                        {article.description && (
                            <p className="text-sm text-gray-400 line-clamp-2 mb-2">{article.description}</p>
                        )}
                        {article.author && (
                            <p className="text-sm text-gray-500">{`Por ${article.author}`}</p>
                        )}
                        
                        {/* Preview Button (Only if content available) */}
                        {(!!article.content || (article.description && article.description.length > 200)) && (
                            <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setReadingArticle(article);
                                    }}
                                    className="text-xs bg-[rgb(var(--color-accent))] text-white px-3 py-1 rounded hover:bg-[rgb(var(--color-accent))]/80 transition-colors shadow-lg font-bold uppercase tracking-wider"
                                >
                                    {t('action.preview')}
                                </button>
                            </div>
                        )}
                    </div>
                </article>
            ))}
        </div>

        {/* Sidebar (4 cols) */}
        <div className="lg:col-span-4">
            <div className="sticky top-24">
                <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-4 flex items-center">
                    <span className="w-2 h-2 bg-[rgb(var(--color-accent))] rounded-full mr-2"></span>
                    Em Alta
                </h3>
                <div className="bg-gray-800/30 rounded-xl p-4 border border-white/5 space-y-4">
                    {sidebar.map((article, idx) => (
                        <div className="group cursor-pointer border-b border-white/5 last:border-0 pb-4 last:pb-0">
                            <div className="flex justify-between items-start gap-2">
                                <a href={article.link} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0">
                                    <span className="text-xs text-gray-500 mb-1 block truncate max-w-full">{idx + 1}. {article.sourceTitle}</span>
                                    <h4 className="text-sm font-medium text-gray-200 group-hover:text-[rgb(var(--color-accent))] transition-colors line-clamp-2">
                                        {article.title}
                                    </h4>
                                </a>
                                <div className="flex-shrink-0">
                                  <FavoriteButton 
                                    article={article} 
                                    size="small" 
                                    position="inline"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity mt-1"
                                  />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>

      {readingArticle && (
        <ArticleReaderModal 
          article={readingArticle}
          onClose={() => setReadingArticle(null)}
          onNext={() => {
            const idx = articles.findIndex(a => a.link === readingArticle.link);
            if (idx < articles.length - 1) setReadingArticle(articles[idx + 1]);
          }}
          onPrev={() => {
            const idx = articles.findIndex(a => a.link === readingArticle.link);
            if (idx > 0) setReadingArticle(articles[idx - 1]);
          }}
          hasNext={articles.findIndex(a => a.link === readingArticle.link) < articles.length - 1}
          hasPrev={articles.findIndex(a => a.link === readingArticle.link) > 0}
        />
      )}
    </div>
  );
};
