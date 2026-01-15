import React, { useState } from 'react';
import { Article } from '../../types';
import { ArticleReaderModal } from '../ArticleReaderModal';
import { useLanguage } from '../../contexts/LanguageContext';
import { FavoriteButton } from '../FavoriteButton';

interface CompactLayoutProps {
  articles: Article[];
  timeFormat: '12h' | '24h';
}

export const CompactLayout: React.FC<CompactLayoutProps> = ({ articles }) => {
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);
  const { t } = useLanguage();

  return (
    <div className="min-h-screen font-mono text-sm p-2 sm:p-4">
      <div className="max-w-5xl mx-auto bg-[rgb(var(--color-surface))] shadow-lg border border-[rgb(var(--color-border))] rounded-lg overflow-hidden">
        <div className="bg-[rgb(var(--color-accent))] p-2 px-4 flex items-center">
          <span className="font-bold text-white mr-4">FeedNews</span>
          <span className="text-white/80 text-xs">new | past | comments | ask | jobs</span>
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
                    <span onClick={() => setReadingArticle(article)} className="text-[rgb(var(--color-text))] font-medium hover:text-[rgb(var(--color-accent))] hover:underline cursor-pointer mr-2 transition-colors">
                      {article.title}
                    </span>
                    <span className="text-[10px] text-[rgb(var(--color-textSecondary))] whitespace-nowrap">
                      ({(() => { try { return new URL(article.link).hostname.replace('www.', ''); } catch { return 'source'; } })()})
                    </span>
                  </div>

                  <div className="text-[10px] text-[rgb(var(--color-textSecondary))] leading-tight mt-1 flex flex-col gap-1.5">
                    {article.description && (
                      <p className="line-clamp-2 italic opacity-80 mb-1 max-w-3xl leading-relaxed">
                        {article.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 min-w-0 flex-wrap">
                      <span className="truncate max-w-[150px] sm:max-w-[200px]">by {article.author || article.sourceTitle}</span>
                      <span className="opacity-50 flex-shrink-0">|</span>
                      <span>{new Date(article.pubDate).toLocaleDateString()}</span>
                      <span className="opacity-50 flex-shrink-0">|</span>
                      <span onClick={() => setReadingArticle(article)} className="cursor-pointer hover:underline hover:text-[rgb(var(--color-accent))] transition-colors">{t('action.preview').toLowerCase()}</span>
                      <span className="opacity-50 flex-shrink-0">|</span>
                      <FavoriteButton
                        article={article}
                        size="small"
                        position="inline"
                        className="p-0 hover:text-[rgb(var(--color-accent))] transition-colors opacity-0 group-hover:opacity-100 transition-opacity"
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
