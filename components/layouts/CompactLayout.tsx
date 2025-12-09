import React, { useState } from 'react';
import { Article } from '../../types';
import { ArticleReaderModal } from '../ArticleReaderModal';
import { useLanguage } from '../../contexts/LanguageContext';

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
              <li key={i} className="py-1.5 border-b border-[rgb(var(--color-border))]/30 last:border-b-0">
                <span onClick={() => setReadingArticle(article)} className="text-[rgb(var(--color-text))] font-medium hover:text-[rgb(var(--color-accent))] hover:underline cursor-pointer mr-2 transition-colors">
                  {article.title}
                </span>
                <span className="text-[10px] text-[rgb(var(--color-textSecondary))]">
                  ({new URL(article.link).hostname.replace('www.', '')})
                </span>
                <div className="text-[10px] text-[rgb(var(--color-textSecondary))] ml-6 leading-tight mt-0.5">
                  by {article.author || article.sourceTitle} <span className="mx-1 opacity-50">|</span> {new Date(article.pubDate).toLocaleDateString()} <span className="mx-1 opacity-50">|</span>
                  <span onClick={() => setReadingArticle(article)} className="cursor-pointer hover:underline hover:text-[rgb(var(--color-accent))] mx-1 transition-colors">{t('action.preview').toLowerCase()}</span>
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
          onNext={() => {}}
          onPrev={() => {}}
          hasNext={false}
          hasPrev={false}
        />
      )}
    </div>
  );
};
