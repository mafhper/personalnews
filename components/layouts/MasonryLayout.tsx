import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Article } from '../../types';
import { ArticleItem } from '../ArticleItem';
import { FeaturedArticle } from '../FeaturedArticle';
import { ArticleReaderModal } from '../ArticleReaderModal';
import { FeedInteractiveActions } from '../FeedInteractiveActions';
import { getVideoEmbed } from '../../utils/videoEmbed';

interface MasonryLayoutProps {
  articles: Article[];
  timeFormat: '12h' | '24h';
}

export const MasonrySkeleton: React.FC = () => {
  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 space-y-8">
      {/* Featured Hero Skeleton */}
      <div className="h-[60vh] min-h-[400px] rounded-2xl feed-skeleton-block" />
      
      {/* Masonry Columns Skeleton */}
      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <div key={i} className="break-inside-avoid mb-6 feed-skeleton-block rounded-2xl h-[300px]" />
        ))}
      </div>
    </div>
  );
};

export const MasonryLayout: React.FC<MasonryLayoutProps> = ({ articles, timeFormat }) => {
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);
  const featured = articles[0];
  const rest = articles.slice(1);

  const columnsRef = useRef<HTMLDivElement | null>(null);
  const itemElByLinkRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const computeTimerRef = useRef<number | null>(null);
  const [visualRankByLink, setVisualRankByLink] = useState<Record<string, number>>({});

  const setItemRef = useCallback((link: string) => (el: HTMLDivElement | null) => {
    if (!el) {
      itemElByLinkRef.current.delete(link);
      return;
    }
    itemElByLinkRef.current.set(link, el);
  }, []);

  const computeVisualRanks = useCallback(() => {
    const container = columnsRef.current;
    if (!container) return;

    // Rank by visual placement (left-to-right, top-to-bottom) inside CSS columns.
    // This makes the number overlay feel consistent even when the layout reflows.
    const items = rest
      .map((a) => {
        const el = itemElByLinkRef.current.get(a.link);
        return el ? { link: a.link, el } : null;
      })
      .filter(Boolean) as Array<{ link: string; el: HTMLDivElement }>;

    if (items.length === 0) return;

    items.sort((x, y) => {
      const xl = x.el.offsetLeft;
      const yl = y.el.offsetLeft;
      if (xl !== yl) return xl - yl;
      return x.el.offsetTop - y.el.offsetTop;
    });

    const next: Record<string, number> = {};
    items.forEach((item, i) => {
      next[item.link] = i + 2; // Featured is implicit "1"
    });

    setVisualRankByLink(next);
  }, [rest]);

  useEffect(() => {
    // Reset per render batch; ranks are re-measured after DOM/layout is stable.
    itemElByLinkRef.current.clear();
    setVisualRankByLink({});

    const schedule = () => {
      if (computeTimerRef.current) {
        window.clearTimeout(computeTimerRef.current);
      }
      computeTimerRef.current = window.setTimeout(() => {
        computeVisualRanks();
      }, 50);
    };

    // Two-pass scheduling helps after images load and column heights settle.
    schedule();
    const raf1 = window.requestAnimationFrame(schedule);
    const raf2 = window.requestAnimationFrame(schedule);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => schedule());
      if (columnsRef.current) ro.observe(columnsRef.current);
    }

    return () => {
      if (computeTimerRef.current) window.clearTimeout(computeTimerRef.current);
      computeTimerRef.current = null;
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
      ro?.disconnect();
    };
  }, [articles, computeVisualRanks]);

  const handleOpenReader = (article: Article) => {
    setReadingArticle(article);
  };

  const handleNextArticle = () => {
    if (!readingArticle) return;
    const currentIndex = articles.findIndex(a => a.link === readingArticle.link);
    if (currentIndex < articles.length - 1) {
      setReadingArticle(articles[currentIndex + 1]);
    }
  };

  const handlePrevArticle = () => {
    if (!readingArticle) return;
    const currentIndex = articles.findIndex(a => a.link === readingArticle.link);
    if (currentIndex > 0) {
      setReadingArticle(articles[currentIndex - 1]);
    }
  };

  return (
    <div className="feed-page-frame feed-page-frame--wide space-y-8 animate-in fade-in duration-500">
      {/* Featured Article - Full Width Hero */}
      <div className="h-[60vh] min-h-[400px] rounded-2xl overflow-hidden shadow-xl relative group">
        <FeaturedArticle article={featured} timeFormat={timeFormat} />
        {/* Preview Button for Featured */}
        <div className="absolute bottom-6 right-6 p-4 z-10">
          {(() => {
            const embedUrl = getVideoEmbed(featured.link);
            return (
              <FeedInteractiveActions
                variant="onDarkMedia"
                articleLink={featured.link}
                onRead={() => handleOpenReader(featured)}
                showRead={!embedUrl}
                showWatch={!!embedUrl}
                showVisit={true}
                onWatch={embedUrl ? () => window.open(featured.link, '_blank') : undefined}
              />
            );
          })()}
        </div>
      </div>

      {/* Masonry Grid */}
      <div
        ref={columnsRef}
        className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6"
      >
        {rest.map((article, index) => (
          <div
            key={`${article.link}-${index}`}
            ref={setItemRef(article.link)}
            className="break-inside-avoid mb-6"
          >
            <ArticleItem
              article={article}
              timeFormat={timeFormat}
              onClick={handleOpenReader}
              className="hover:-translate-y-1 transition-transform duration-300"
            />
          </div>
        ))}
      </div>

      {readingArticle && (
        <ArticleReaderModal
          article={readingArticle}
          onClose={() => setReadingArticle(null)}
          onNext={handleNextArticle}
          onPrev={handlePrevArticle}
          hasNext={articles.findIndex(a => a.link === readingArticle.link) < articles.length - 1}
          hasPrev={articles.findIndex(a => a.link === readingArticle.link) > 0}
        />
      )}
    </div>
  );
};
