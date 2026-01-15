import React, { useState } from 'react';
import { Article } from '../../types';
import { getVideoEmbed } from '../../utils/videoEmbed';
import { OptimizedImage } from '../OptimizedImage';
import { FavoriteButton } from '../FavoriteButton';

interface BrutalistLayoutProps {
  articles: Article[];
  timeFormat: '12h' | '24h';
}

const BrutalistCard: React.FC<{ article: Article; index: number }> = ({ article, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const embedUrl = getVideoEmbed(article.link);

  const handleToggleVideo = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <article
      className={`group relative flex flex-col border-4 border-black dark:border-white bg-[rgb(var(--color-surface))] transition-all duration-300 ${isExpanded
        ? 'md:col-span-2 md:row-span-2 z-20 shadow-[12px_12px_0px_0px_rgba(var(--color-accent),1)] scale-[1.02]'
        : 'hover:-translate-y-2 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]'
        }`}
    >
      {/* Card Header / System Line */}
      <div className={`flex items-center justify-between px-3 py-2 border-b-4 border-black dark:border-white text-[10px] font-bold uppercase tracking-wider ${isExpanded ? 'bg-[rgb(var(--color-accent))] text-white' : 'bg-black text-white dark:bg-white dark:text-black'
        }`}>
        <span className="truncate max-w-[60%]">{article.sourceTitle}</span>
        <span>
          {isExpanded ? 'PLAYING_NOW' : `IDX_${index.toString().padStart(3, '0')}`}
        </span>
      </div>

      {/* Media Area */}
      <div className={`relative w-full border-b-4 border-black dark:border-white group-hover:border-b-[rgb(var(--color-accent))] transition-colors ${isExpanded ? 'aspect-video h-full bg-black' : 'aspect-video'
        }`}>
        {isExpanded && embedUrl ? (
          <iframe
            src={embedUrl}
            title={article.title}
            className="w-full h-full absolute inset-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <>
            {article.imageUrl ? (
              <OptimizedImage
                src={article.imageUrl}
                alt=""
                fallbackText="NO_SIGNAL"
                width={600}
                height={400}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                <span className="text-xs">NO_SIGNAL</span>
              </div>
            )}

            {/* Play Overlay (Only if not expanded) */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-[2px] pointer-events-none z-10">
              <div className="w-12 h-12 bg-[rgb(var(--color-accent))] border-2 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            <a href={article.link} target="_blank" rel="noopener noreferrer" className="absolute inset-0 z-10" aria-label={`Watch ${article.title}`}></a>
          </>
        )}
      </div>

      {/* Content Block */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          <h2 className={`font-bold leading-tight mb-3 uppercase group-hover:text-[rgb(var(--color-accent))] transition-colors ${isExpanded ? 'text-xl md:text-2xl' : 'text-lg line-clamp-3'
            }`}>
            <a href={article.link} target="_blank" rel="noopener noreferrer">
              {article.title}
            </a>
          </h2>

          <p className={`text-xs font-medium opacity-70 mb-4 border-l-2 border-current pl-2 ${isExpanded ? 'line-clamp-none' : 'line-clamp-3'
            }`}>
            {article.description}
          </p>
        </div>

        <div className="pt-3 border-t-2 border-dashed border-black/20 dark:border-white/20 flex justify-between items-center text-xs font-bold">
          <div className="flex items-center gap-3">
            <span>{new Date(article.pubDate).toLocaleDateString()}</span>
            <FavoriteButton
              article={article}
              size="small"
              position="inline"
              className="text-black dark:text-white hover:text-[rgb(var(--color-accent))] p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </div>

          <div className="flex gap-2 z-20">
            {embedUrl && (
              <button
                onClick={handleToggleVideo}
                className={`uppercase px-3 py-1 text-xs font-bold border-2 transition-all ${isExpanded
                  ? 'bg-red-500 text-white border-red-500 hover:bg-transparent hover:text-red-500'
                  : 'bg-transparent text-black dark:text-white border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black'
                  }`}
              >
                {isExpanded ? 'CLOSE' : 'WATCH'}
              </button>
            )}

            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="uppercase px-3 py-1 text-xs font-bold border-2 border-black dark:border-white text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all"
            >
              LINK
            </a>
          </div>
        </div>
      </div>
    </article>
  );
};

export const BrutalistLayout: React.FC<BrutalistLayoutProps> = ({ articles }) => {
  return (
    <div className="min-h-screen p-4 md:p-8 font-mono">
      <div className="container mx-auto">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 auto-dense">
          {articles.map((article, index) => (
            <BrutalistCard key={`${article.link}-${index}`} article={article} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
};
