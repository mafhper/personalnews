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
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-500">
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
            <article key={idx} className="flex gap-4 p-5 bg-[rgb(var(--color-surface))]/70 backdrop-blur-xl rounded-2xl hover:bg-[rgb(var(--color-surface))] hover:border-[rgb(var(--color-accent))]/40 transition-all border border-white/10 relative group shadow-md">
              <div className="flex flex-col gap-3 w-32 sm:w-40 flex-shrink-0">
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-inner bg-black/20 group/img">
                  <SmallOptimizedImage src={article.imageUrl} alt={article.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" fallbackText={article.sourceTitle} size={200} />

                  {/* Favorite Button (Over image, hover-only) */}
                  <FavoriteButton
                    article={article}
                    size="small"
                    position="overlay"
                    className="top-2 right-2 z-20 bg-black/40 hover:bg-black/60 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>

                {/* Preview Button (Under image, hover-only) */}
                {(!!article.content || (article.description && article.description.length > 200)) && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setReadingArticle(article);
                    }}
                    className="w-full text-[10px] bg-[rgb(var(--color-accent))] text-white px-2 py-1.5 rounded-lg hover:bg-[rgb(var(--color-accent))]/80 transition-all shadow-xl font-black uppercase tracking-widest border border-white/10 opacity-0 group-hover:opacity-100 transform translate-y-1 group-hover:translate-y-0"
                  >
                    {t('action.preview')}
                  </button>
                )}
              </div>

              <div className="flex-1 flex flex-col p-1 relative">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-tighter bg-[rgb(var(--color-accent))] text-white px-2 py-0.5 rounded shadow-sm">
                    {article.sourceTitle}
                  </span>
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center">
                    <span className="mx-1.5 opacity-30">•</span>
                    {article.pubDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <a
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/title block"
                >
                  <h3 className="text-base sm:text-lg font-bold text-white leading-tight mb-2 group-hover/title:text-[rgb(var(--color-accent))] transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                </a>

                {article.description && (
                  <p className="text-gray-400 text-sm line-clamp-3 mb-4">
                    {article.description}
                  </p>
                )}

                <div className="flex items-center justify-between mt-auto">
                  {article.author && (
                    <p className="text-xs font-bold text-white/60 italic bg-white/5 px-2 py-0.5 rounded">{`Por ${article.author}`}</p>
                  )}
                </div>
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
            <div className="bg-[rgb(var(--color-surface))]/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 space-y-4 shadow-xl">
              {sidebar.map((article, idx) => (
                <div key={idx} className="group cursor-pointer border-b border-white/10 last:border-0 pb-4 last:pb-0">
                  <div className="flex justify-between items-start gap-3">
                    <a href={article.link} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0" onClick={(e) => { e.preventDefault(); setReadingArticle(article); }}>
                      <span className="text-[10px] font-black text-[rgb(var(--color-accent))] mb-1 block uppercase tracking-widest opacity-80 group-hover:opacity-100 transition-all">
                        {idx + 1}. {article.sourceTitle}
                      </span>
                      <h4 className="text-sm font-bold text-white group-hover:text-white group-hover:underline transition-all line-clamp-2 leading-tight">
                        {article.title}
                      </h4>
                    </a>
                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <FavoriteButton
                        article={article}
                        size="small"
                        position="inline"
                        className="opacity-100 text-[rgb(var(--color-accent))] hover:scale-110 transition-all"
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
