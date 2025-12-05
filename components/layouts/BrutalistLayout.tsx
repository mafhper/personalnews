import React from 'react';
import { Article } from '../../types';

interface BrutalistLayoutProps {
  articles: Article[];
  timeFormat: '12h' | '24h';
}

export const BrutalistLayout: React.FC<BrutalistLayoutProps> = ({ articles }) => {
  return (
    <div className="min-h-screen bg-[rgb(var(--color-background))] p-4 md:p-8 font-mono">
      
      {/* Header Decoration */}
      <div className="mb-8 border-b-4 border-black dark:border-white pb-2 flex justify-between items-end uppercase">
        <h1 className="text-4xl md:text-6xl font-black leading-none tracking-tighter">
          VIDEO_FEED
        </h1>
        <span className="hidden md:block font-bold text-xs tracking-widest">
          CNT: {articles.length} // MODE: RAW
        </span>
      </div>

      {/* Uniform Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
        {articles.map((article, index) => (
          <article 
            key={`${article.link}-${index}`} 
            className="group relative flex flex-col border-4 border-black dark:border-white bg-[rgb(var(--color-surface))] hover:-translate-y-2 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] transition-all duration-200"
          >
            {/* Card Header / System Line */}
            <div className="flex items-center justify-between px-3 py-2 border-b-4 border-black dark:border-white text-[10px] font-bold uppercase tracking-wider bg-black text-white dark:bg-white dark:text-black">
              <span className="truncate max-w-[60%]">{article.sourceTitle}</span>
              <span>IDX_{index.toString().padStart(3, '0')}</span>
            </div>

            {/* Thumbnail Area */}
            <div className="relative aspect-video w-full overflow-hidden border-b-4 border-black dark:border-white group-hover:border-b-[rgb(var(--color-accent))] transition-colors">
              {article.imageUrl ? (
                <img 
                  src={article.imageUrl} 
                  alt="" 
                  className="w-full h-full object-cover transition-all duration-300"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                    <span className="text-xs">NO_SIGNAL</span>
                </div>
              )}
              
              {/* Play Overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-[2px]">
                <div className="w-12 h-12 bg-[rgb(var(--color-accent))] border-2 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                   </svg>
                </div>
              </div>
              
              <a href={article.link} target="_blank" rel="noopener noreferrer" className="absolute inset-0 z-10" aria-label={`Watch ${article.title}`}></a>
            </div>

            {/* Content Block */}
            <div className="p-4 flex flex-col flex-1 justify-between">
              <div>
                <h2 className="text-lg font-bold leading-tight mb-3 uppercase line-clamp-3 group-hover:text-[rgb(var(--color-accent))] transition-colors">
                  <a href={article.link} target="_blank" rel="noopener noreferrer">
                    {article.title}
                  </a>
                </h2>
                
                <p className="text-xs font-medium opacity-70 line-clamp-3 mb-4 border-l-2 border-current pl-2">
                    {article.description}
                </p>
              </div>

              <div className="pt-3 border-t-2 border-dashed border-black/20 dark:border-white/20 flex justify-between items-center text-xs font-bold">
                <span>{new Date(article.pubDate).toLocaleDateString()}</span>
                <button className="uppercase hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black px-2 py-1 transition-colors">
                    [ OPEN ]
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
