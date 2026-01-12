import React, { useState } from 'react';
import { Article } from '../../types';
import { ArticleReaderModal } from '../ArticleReaderModal';
import { OptimizedImage } from '../OptimizedImage';
import { useLanguage } from '../../contexts/LanguageContext';

interface TerminalLayoutProps {
  articles: Article[];
  timeFormat: '12h' | '24h';
}

export const TerminalLayout: React.FC<TerminalLayoutProps> = ({ articles }) => {
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);
  const { t } = useLanguage();

  return (
    <div className="min-h-screen text-green-500 pt-3 pb-12 px-3 sm:px-4 md:px-6 font-mono text-sm md:text-base">

      {/* Terminal Window */}
      <div
        className="
          border border-white/10 rounded-lg bg-black/95 shadow-2xl overflow-hidden
          min-h-[70vh] flex flex-col relative backdrop-blur-sm

          /* 🔑 comportamento desejado */
          w-full

          /* controle em telas grandes */
          lg:max-w-[90vw]
          xl:max-w-[80rem]

          /* centraliza só quando faz sentido */
          lg:mx-auto
        "
      >

        {/* Header */}
        <div className="bg-white/5 border-b border-white/5 p-2 flex items-center gap-2 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex gap-1.5 ml-2">
            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
            <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
          </div>
          <div className="flex-1 text-center text-gray-600 text-[10px] uppercase tracking-widest font-bold opacity-50 select-none">
            terminal://rss-stream
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 md:p-8 space-y-6 flex-1 overflow-y-auto custom-scrollbar">

          {/* Boot log */}
          <div className="mb-8 text-white/90">
            <span className="text-blue-400 font-bold">user@news</span>
            :<span className="text-blue-300">~</span>$ ./fetch_feeds
            <div className="text-gray-500/80 mt-1">&gt; {articles.length} items received</div>
          </div>

          {/* Articles */}
          <div className="space-y-8">

            {articles.map((article, i) => (
              <article
                key={article.link || i}
                className="
                  group relative pl-4 border-l-2 border-transparent
                  hover:border-green-500/50 transition-colors
                "
              >
                <div className="flex items-start gap-4">

                  {/* Prompt */}
                  <span className="text-gray-700 select-none font-bold opacity-50">{'>'}</span>

                  {/* Image */}
                  <div className="w-28 h-20 flex-shrink-0 rounded-md overflow-hidden bg-white/5 border border-white/10">
                    {article.imageUrl ? (
                      <OptimizedImage
                        src={article.imageUrl}
                        alt={article.title}
                        fallbackText="NO_IMG"
                        width={200}
                        height={150}
                        className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-500 uppercase tracking-widest">
                        no img
                      </div>
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">

                    <div className="flex flex-wrap items-center gap-x-3 text-xs text-gray-500 mb-1 font-medium">
                      <span className="text-yellow-600/80">
                        [{new Date(article.pubDate).toISOString().split('T')[0]}]
                      </span>
                      <span className="text-blue-500/80 lowercase">
                        @{article.sourceTitle.replace(/\s/g, '_')}
                      </span>
                    </div>

                    <h2
                      className="
                        text-lg md:text-xl font-bold text-gray-200
                        hover:text-green-400 hover:underline
                        decoration-green-500/50 underline-offset-4
                        transition-all cursor-pointer mb-2
                        max-w-[72ch]
                      "
                      onClick={() => setReadingArticle(article)}
                    >
                      {article.title}
                    </h2>

                    {article.description && (
                      <p className="text-gray-500/80 leading-relaxed text-sm max-w-[80ch]">
                        {article.description.length > 200
                          ? article.description.slice(0, 200) + '…'
                          : article.description}
                      </p>
                    )}

                    <button
                      onClick={() => setReadingArticle(article)}
                      className="
                        mt-3 text-[10px] uppercase tracking-widest
                        text-[#00ff41]/60 hover:text-[#00ff41]
                        border border-[#00ff41]/20 hover:border-[#00ff41]/60
                        px-2 py-1 rounded-sm transition-all
                      "
                    >
                      open_{t('action.preview')}
                    </button>

                  </div>
                </div>
              </article>
            ))}

          </div>

          {/* Cursor */}
          <div className="mt-12 pt-8 border-t border-white/5">
            <span className="text-blue-400 font-bold">user@news</span>
            :<span className="text-blue-300">~</span>$ 
            <span className="w-2.5 h-5 bg-gray-500/50 inline-block align-middle animate-pulse ml-1" />
          </div>

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
