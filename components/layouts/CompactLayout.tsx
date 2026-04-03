import React, { useState } from 'react';
import { Article } from '../../types';
import { ArticleReaderModal } from '../ArticleReaderModal';
import { FavoriteButton } from '../FavoriteButton';
import { FeedInteractiveActions } from '../FeedInteractiveActions';
import { getVideoEmbed } from '../../utils/videoEmbed';

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
            <div key={i} className="flex gap-4 py-2 border-b border-white/5">
              <Bone className="w-28 h-20 flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <Bone className="h-5 w-3/4" />
                <Bone className="h-4 w-1/2" />
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

  return (
    <div className="feed-page-frame min-h-screen font-mono text-base pb-12">
      <div className="mx-auto bg-[rgb(var(--color-surface))] shadow-xl border border-[rgb(var(--color-border))]/40 rounded-xl overflow-hidden">
        <div className="bg-[rgba(var(--color-accent),0.18)] border-b border-[rgb(var(--color-border))]/30 p-3 px-6 flex items-center justify-between">
          <div className="flex items-center">
            <span className="font-bold feed-accent-text mr-4 text-base tracking-tight">Personal News Digest</span>
          </div>
          <div className="text-[10px] uppercase font-bold tracking-tighter opacity-70">
            {new Date().toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' })}
          </div>
        </div>
        <div className="p-3 sm:p-6">
          <ol className="list-decimal list-inside space-y-1 text-[rgb(var(--color-textSecondary))]">
            {articles.map((article, i) => (
              <li key={i} className="py-4 border-b border-[rgb(var(--color-border))]/20 last:border-b-0 group flex gap-5 items-start">
                {/* Image Thumbnail - Slightly larger */}
                {article.imageUrl && (
                  <div className="flex-shrink-0 w-36 h-24 bg-gray-200 dark:bg-gray-800 rounded-md overflow-hidden border border-[rgb(var(--color-border))]/30 mt-1 shadow-sm">
                    <img
                      src={article.imageUrl}
                      alt=""
                      className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-all duration-300 group-hover:scale-105"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="leading-snug mb-2">
                    <span onClick={() => setReadingArticle(article)} className="text-xl text-[rgb(var(--color-text))] font-bold hover:feed-accent-text hover:underline cursor-pointer mr-3 transition-colors inline-block decoration-2 underline-offset-4">
                      {article.title}
                    </span>
                    {(() => {
                      const host = (() => {
                        try {
                          return new URL(article.link).hostname.replace('www.', '');
                        } catch {
                          return '';
                        }
                      })();
                      const source = (article.sourceTitle || '').toLowerCase();
                      const showHost = host && !source.includes(host.toLowerCase());
                      return showHost ? (
                        <span className="text-xs font-medium text-[rgb(var(--color-textSecondary))] opacity-60 italic whitespace-nowrap">
                          ({host})
                        </span>
                      ) : null;
                    })()}
                  </div>

                  <div className="text-sm text-[rgb(var(--color-textSecondary))] leading-relaxed mt-1 flex flex-col gap-2">
                    {article.description && (
                      <p className="line-clamp-2 italic opacity-75 mb-1 max-w-4xl font-sans text-xs leading-relaxed">
                        {article.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 min-w-0 flex-wrap font-sans text-[11px] font-bold uppercase tracking-wider">
                      <span className="truncate max-w-[180px] sm:max-w-[280px] feed-accent-text">
                        {article.author && article.author !== article.sourceTitle
                          ? `by ${article.author}`
                          : `via ${article.sourceTitle}`}
                      </span>
                      <span className="opacity-30 flex-shrink-0">•</span>
                      <span className="opacity-80">{new Date(article.pubDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}</span>
                      <span className="opacity-30 flex-shrink-0">•</span>
                      <FavoriteButton
                        article={article}
                        size="small"
                        position="inline"
                        className="p-0 hover:text-[rgb(var(--color-error))] transition-colors opacity-60 group-hover:opacity-100"
                      />
                      <span className="opacity-30 flex-shrink-0">•</span>
                      {(() => {
                        const embedUrl = getVideoEmbed(article.link);
                        return (
                          <FeedInteractiveActions
                            articleLink={article.link}
                            onRead={() => setReadingArticle(article)}
                            showRead={!embedUrl}
                            showWatch={!!embedUrl}
                            showVisit={true}
                            className="!mt-0 !mb-0 flex-wrap"
                          />
                        );
                      })()}
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
