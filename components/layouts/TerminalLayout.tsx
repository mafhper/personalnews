import React, { useState } from 'react';
import { Article } from '../../types';
import { ArticleReaderModal } from '../ArticleReaderModal';
import { useLanguage } from '../../contexts/LanguageContext';

interface TerminalLayoutProps {
  articles: Article[];
  timeFormat: '12h' | '24h';
}

export const TerminalLayout: React.FC<TerminalLayoutProps> = ({ articles }) => {
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);
  const { t } = useLanguage();

  return (
    <div className="min-h-screen text-green-500 pt-3 pb-12 px-4 md:px-8 font-mono text-sm md:text-base">

      {/* Terminal Window Frame */}
      <div className="border border-white/10 rounded-lg bg-black/95 shadow-2xl overflow-hidden min-h-[70vh] flex flex-col relative max-w-6xl mx-auto backdrop-blur-sm">

        {/* Discrete Window Header */}
        <div className="bg-white/5 border-b border-white/5 p-2 flex items-center gap-2 sticky top-0 z-10 backdrop-blur-md">
            <div className="flex gap-1.5 ml-2">
                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50 hover:bg-red-500/80 transition-colors"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50 hover:bg-yellow-500/80 transition-colors"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50 hover:bg-green-500/80 transition-colors"></div>
            </div>
            <div className="flex-1 text-center text-gray-600 text-[10px] uppercase tracking-widest font-bold opacity-50 select-none">Create a new window instance</div>
        </div>

        {/* Content Area */}
        <div className="p-6 md:p-8 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
            <div className="mb-8 text-white/90">
                <span className="text-blue-400 font-bold">user@news-dashboard</span>:<span className="text-blue-300">~</span>$ ./fetch_feeds.sh --silent
                <br/>
                <div className="text-gray-500/80 mt-1 flex items-center gap-2">
                    <span>&gt; Initializing connection...</span>
                    <span className="text-green-500">Done</span>
                </div>
                <div className="text-gray-500/80">
                    <span>&gt; {articles.length} packets received from aggregation layer.</span>
                </div>
            </div>

            <div className="space-y-8 max-w-4xl">
                {articles.map((article, i) => (
                <div key={i} className="group relative pl-4 border-l-2 border-transparent hover:border-green-500/50 transition-colors duration-300">
                    <div className="flex items-start gap-4">
                        <span className="text-gray-700 select-none font-bold opacity-50">{`>`}</span>
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-x-3 text-xs text-gray-500 mb-1 font-medium">
                                <span className="text-yellow-600/80">[{new Date(article.pubDate).toISOString().split('T')[0]}]</span>
                                <span className="text-blue-500/80 lowercase">@{article.sourceTitle.replace(/\s/g, '_')}</span>
                                <span className="text-gray-700">pid:{1000 + (article.title.length * 7 + new Date(article.pubDate).getDate()) % 9000}</span>
                            </div>
                            <h2
                                className="text-lg md:text-xl font-bold text-gray-200 hover:text-green-400 hover:underline decoration-green-500/50 underline-offset-4 transition-all cursor-pointer mb-2"
                                onClick={() => setReadingArticle(article)}
                            >
                                {article.title}
                            </h2>
                            <p className="text-gray-500/80 max-w-3xl leading-relaxed text-sm">
                                {article.description ? article.description.slice(0, 180) + (article.description.length > 180 ? '...' : '') : ''}
                            </p>
                            <button
                                onClick={() => setReadingArticle(article)}
                                className="mt-3 text-[10px] uppercase tracking-widest text-[#00ff41]/60 hover:text-[#00ff41] border border-[#00ff41]/20 hover:border-[#00ff41]/60 px-2 py-1 rounded-sm transition-all"
                            >
                                Open_{t('action.preview')}
                            </button>
                        </div>
                    </div>
                </div>
                ))}
            </div>

            <div className="mt-12 pt-8 border-t border-white/5">
                <span className="text-blue-400 font-bold">user@news-dashboard</span>:<span className="text-blue-300">~</span>$ <span className="w-2.5 h-5 bg-gray-500/50 inline-block align-middle animate-pulse"/>
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
