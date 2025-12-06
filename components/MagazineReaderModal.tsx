import React, { useEffect, useState } from 'react';
import type { Article } from '../types';
import { sanitizeHtmlContent } from '../utils/sanitization';
import { getVideoEmbed } from '../utils/videoEmbed';

import { fetchFullContent } from '../services/articleFetcher';

interface MagazineReaderModalProps {
  article: Article;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
}

export const MagazineReaderModal: React.FC<MagazineReaderModalProps> = ({
  article,
  onClose,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
}) => {
  const [showFullImage, setShowFullImage] = useState(false);
  const videoEmbed = getVideoEmbed(article.link);
  const [fullContent, setFullContent] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  useEffect(() => {
    setFullContent(null);
    setLoading(true);

    const loadContent = async () => {
        const fetched = await fetchFullContent(article.link);
        if (fetched) {
            setFullContent(fetched);
        }
        setLoading(false);
    };

    loadContent();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && hasNext) onNext();
      if (e.key === 'ArrowLeft' && hasPrev) onPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [article.link, onClose, onNext, onPrev, hasNext, hasPrev]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/95 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Navigation Buttons (Outside Modal) */}
      {hasPrev && (
        <button 
          onClick={onPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-4 text-[rgb(var(--color-textSecondary))] hover:text-[rgb(var(--color-text))] hover:bg-white/10 rounded-full transition-all z-[110]"
          aria-label="Previous Article"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
      )}

      {hasNext && (
        <button 
          onClick={onNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-4 text-[rgb(var(--color-textSecondary))] hover:text-[rgb(var(--color-text))] hover:bg-white/10 rounded-full transition-all z-[110]"
          aria-label="Next Article"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      )}

      {/* Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 p-2 text-[rgb(var(--color-text))] hover:text-[rgb(var(--color-accent))] bg-black/20 hover:bg-white/20 backdrop-blur rounded-full z-[110] transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      </button>

      {/* Magazine Modal Content - Two Page Spread */}
      <div className="relative w-full max-w-6xl max-h-[90vh] aspect-[16/10] bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))] rounded-sm shadow-2xl overflow-hidden flex flex-col md:flex-row border-l-[12px] border-r-[12px] border-[rgb(var(--color-border))] book-shadow">
        
        {/* Left Page: Visuals & Meta */}
        <div className="w-full md:w-1/2 h-full p-8 md:p-12 md:border-r border-[rgb(var(--color-border))] flex flex-col justify-between relative bg-[rgb(var(--color-surface))] page-texture overflow-y-auto custom-scrollbar-light">
           <div>
             <div className="flex items-center gap-3 mb-6">
                <span className="px-3 py-1 bg-[rgb(var(--color-accent))] text-white text-xs font-bold uppercase tracking-widest">{article.sourceTitle}</span>
                <time className="text-[rgb(var(--color-textSecondary))] text-xs font-serif italic">{new Date(article.pubDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</time>
             </div>

             <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-black leading-none tracking-tight mb-8 text-[rgb(var(--color-text))]">
               {sanitizeHtmlContent(article.title)}
             </h1>

             {article.author && (
                <div className="flex items-center gap-2 mb-8 text-sm font-medium text-[rgb(var(--color-textSecondary))] border-l-2 border-[rgb(var(--color-accent))] pl-3">
                  By {article.author}
                </div>
             )}
             
             {/* Main Image on Left Page */}
             {article.imageUrl && !showFullImage && (
               <div 
                 className="relative w-full aspect-video mb-6 cursor-zoom-in group overflow-hidden shadow-lg transform rotate-1 bg-black/20"
                 onClick={() => setShowFullImage(true)}
               >
                 <img src={article.imageUrl} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                 <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
               </div>
             )}
             
             {/* If video, show player here */}
             {videoEmbed && (
               <div className="aspect-video w-full mb-6 bg-black shadow-lg">
                 <iframe 
                   src={videoEmbed} 
                   className="w-full h-full" 
                   frameBorder="0" 
                   allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                   allowFullScreen
                 />
               </div>
             )}
           </div>

           <div className="text-xs text-[rgb(var(--color-textSecondary))] font-mono mt-4 pt-4 border-t border-[rgb(var(--color-border))]">
             PAGE 1 • {article.categories?.join(', ') || 'Uncategorized'}
           </div>
        </div>

        {/* Right Page: Content */}
        <div className="w-full md:w-1/2 h-full p-8 md:p-12 bg-[rgb(var(--color-background))] page-texture overflow-y-auto custom-scrollbar-light relative">
           <div className="prose prose-lg prose-invert max-w-none font-serif leading-relaxed drop-cap text-[rgb(var(--color-text))]">
              {/* If we have full content, iterate and render safe html, otherwise description */}
              {fullContent ? (
                  <div dangerouslySetInnerHTML={{ __html: fullContent }} className="animate-in fade-in duration-500" />
              ) : (
                  <>
                      {article.content ? (
                        <div dangerouslySetInnerHTML={{ __html: article.content }} />
                      ) : (
                        <div 
                          className="text-lg leading-8" 
                          dangerouslySetInnerHTML={{ __html: article.description || '' }} 
                        />
                      )}
                      {loading && (
                           <div className="py-8 flex items-center justify-center text-[rgb(var(--color-textSecondary))] animate-pulse font-sans text-sm">
                               <svg className="w-4 h-4 mr-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                               Fetching full story from source...
                           </div>
                       )}
                  </>
              )}
           </div>
           
           <div className="text-xs text-[rgb(var(--color-textSecondary))] font-mono mt-12 pt-4 border-t border-[rgb(var(--color-border))] text-right">
             PAGE 2 • PERSONAL NEWS
           </div>
        </div>
      </div>
    </div>
  );
};
