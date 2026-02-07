import React, { useState } from 'react';
import { Article } from '../../types';
import { ArticleReaderModal } from '../ArticleReaderModal';
import { useLanguage } from '../../hooks/useLanguage';
import { FavoriteButton } from '../FavoriteButton';

interface CompactLayoutProps {
  articles: Article[];
  timeFormat: '12h' | '24h';
}

export const CompactSkeleton: React.FC = () => {
  const Bone = ({ className = "" }) => <div className={`feed-skeleton-block ${className}`} />;
  
  return (
    <div className="min-h-screen font-mono text-sm p-2 sm:p-4">
      <div className="max-w-5xl mx-auto bg-[rgb(var(--color-surface))] border border-white/5 rounded-lg overflow-hidden">
        <div className="feed-skeleton-block h-10 px-4 flex items-center" />
        <div className="p-4 space-y-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="flex gap-3 py-2 border-b border-white/5">
              <Bone className="w-20 h-14 flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <Bone className="h-4 w-3/4" />
                <Bone className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const CompactLayout: React.FC<CompactLayoutProps> = ({ articles }) => {
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);
  const { t } = useLanguage();

  return (
    <div className="min-h-screen font-mono text-sm p-2 sm:p-4">
      <div className="max-w-5xl mx-auto bg-[rgb(var(--color-surface))] shadow-md border border-[rgb(var(--color-border))] rounded-lg overflow-hidden">
        <div className="bg-[rgba(var(--color-accent),0.16)] border-b border-white/5 p-2 px-4 flex items-center">
          <span className="font-bold feed-accent-text mr-4">FeedNews</span>
          <span className="text-white/70 text-xs">new | past | comments | ask | jobs</span>
        </div>
        <div className="p-2 sm:p-4">
          <ol className="list-decimal list-inside space-y-1 text-[rgb(var(--color-textSecondary))]">
            {articles.map((article, i) => (
              <li key={i} className="py-2 border-b border-[rgb(var(--color-border))]/30 last:border-b-0 group flex gap-3 items-start">
                {/* Image Thumbnail */}
                {article.imageUrl && (
                  <div className="flex-shrink-0 w-20 h-14 bg-gray-200 dark:bg-gray-800 rounded-sm overflow-hidden border border-[rgb(var(--color-border))] mt-0.5">
                    <img
                      src={article.imageUrl}
                      alt=""
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="leading-tight">
                    <span onClick={() => setReadingArticle(article)} className="text-[rgb(var(--color-text))] font-medium hover:text-white hover:underline cursor-pointer mr-2 transition-colors">
                      {article.title}
                    </span>
                    {(() => {
                      let host = '';
                      try { host = new URL(article.link).hostname.replace('www.', ''); } catch { host = ''; }
                      const source = (article.sourceTitle || '').toLowerCase();
                      const showHost = host && !source.includes(host.toLowerCase());
                      return showHost ? (
                        <span className="text-[10px] text-[rgb(var(--color-textSecondary))] whitespace-nowrap">
                          ({host})
                        </span>
                      ) : null;
                    })()}
                  </div>

                  <div className="text-[10px] text-[rgb(var(--color-textSecondary))] leading-tight mt-1 flex flex-col gap-1.5">
                    {article.description && (
                      <p className="line-clamp-2 italic opacity-80 mb-1 max-w-3xl leading-relaxed">
                        {article.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 min-w-0 flex-wrap">
                      <span className="truncate max-w-[150px] sm:max-w-[200px]">
                        {article.author && article.author !== article.sourceTitle
                          ? `by ${article.author}`
                          : `via ${article.sourceTitle}`}
                      </span>
                      <span className="opacity-50 flex-shrink-0">|</span>
                      <span>{new Date(article.pubDate).toLocaleDateString()}</span>
                      <span className="opacity-50 flex-shrink-0">|</span>
                      <span onClick={() => setReadingArticle(article)} className="cursor-pointer hover:underline hover:text-white transition-colors">{t('action.preview').toLowerCase()}</span>
                      <span className="opacity-50 flex-shrink-0">|</span>
                      <FavoriteButton
                        article={article}
                        size="small"
                        position="inline"
                        className="p-0 hover:text-white transition-colors opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
      {readingArticle && (
        <ArticleReaderModal
          article={readingArticle}
          onClose={() => setReadingArticle(null)}
          onNext={() => { }}
          onPrev={() => { }}
          hasNext={false}
          hasPrev={false}
        />
      )}
    </div>
  );
};
