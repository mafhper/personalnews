/**
 * FeedContent.tsx
 *
 * Componente principal para exibição de artigos no Personal News Dashboard.
 * Gerencia a seleção e renderização dos layouts (Grid, Masonry, Minimal, Portal).
 *
 * @author Matheus Pereira
 * @version 3.0.0
 */

import React, { Suspense, useState, useCallback, useEffect, lazy } from "react";
import type { VirtuosoProps, VirtuosoGridProps, ItemContent, GridItemContent } from "react-virtuoso";
import type { Article } from "../types";
import { withPerformanceTracking } from "../services/performanceUtils";
import { useAppearance } from "../hooks/useAppearance";
import { useFeedCategories } from "../hooks/useFeedCategories";
import { FeedSkeleton } from "./ui/FeedSkeleton";
import { ArticleItem } from "./ArticleItem";
import { ArticleItemLight } from "./ArticleItemLight";
import { MagazineItem } from "./layouts/MagazineItem";
import { MagazineHeader } from "./layouts/MagazineHeader";
const MagazineReaderModal = lazy(() =>
  import("./MagazineReaderModal").then((m) => ({
    default: m.MagazineReaderModal,
  })),
);
import { useLogger } from "../services/logger";

// Lazy-loaded layouts to reduce main bundle size
const MasonryLayout = lazy(() =>
  import("./layouts/MasonryLayout").then((m) => ({ default: m.MasonryLayout })),
);
const MinimalLayout = lazy(() =>
  import("./layouts/MinimalLayout").then((m) => ({ default: m.MinimalLayout })),
);
const PortalLayout = lazy(() =>
  import("./layouts/PortalLayout").then((m) => ({ default: m.PortalLayout })),
);
const ImmersiveLayout = lazy(() =>
  import("./layouts/ImmersiveLayout").then((m) => ({
    default: m.ImmersiveLayout,
  })),
);
const BrutalistLayout = lazy(() =>
  import("./layouts/BrutalistLayout").then((m) => ({
    default: m.BrutalistLayout,
  })),
);
const TimelineLayout = lazy(() =>
  import("./layouts/TimelineLayout").then((m) => ({
    default: m.TimelineLayout,
  })),
);
const BentoLayout = lazy(() =>
  import("./layouts/BentoLayout").then((m) => ({ default: m.BentoLayout })),
);
const ModernPortalLayout = lazy(() =>
  import("./layouts/ModernPortalLayout").then((m) => ({
    default: m.ModernPortalLayout,
  })),
);
const NewspaperLayout = lazy(() =>
  import("./layouts/NewspaperLayout").then((m) => ({
    default: m.NewspaperLayout,
  })),
);
const FocusLayout = lazy(() =>
  import("./layouts/FocusLayout").then((m) => ({ default: m.FocusLayout })),
);
const GalleryLayout = lazy(() =>
  import("./layouts/GalleryLayout").then((m) => ({ default: m.GalleryLayout })),
);
const CompactLayout = lazy(() =>
  import("./layouts/CompactLayout").then((m) => ({ default: m.CompactLayout })),
);
const SplitLayout = lazy(() =>
  import("./layouts/SplitLayout").then((m) => ({ default: m.SplitLayout })),
);
const CyberpunkLayout = lazy(() =>
  import("./layouts/CyberpunkLayout").then((m) => ({
    default: m.CyberpunkLayout,
  })),
);
const TerminalLayout = lazy(() =>
  import("./layouts/TerminalLayout").then((m) => ({
    default: m.TerminalLayout,
  })),
);
const PocketFeedsLayout = lazy(() =>
  import("./layouts/PocketFeedsLayout").then((m) => ({
    default: m.PocketFeedsLayout,
  })),
);

const Virtuoso = lazy(() =>
  import("react-virtuoso").then((m) => ({ default: m.Virtuoso })),
) as React.ComponentType<VirtuosoProps<Article, unknown>>;
const VirtuosoGrid = lazy(() =>
  import("react-virtuoso").then((m) => ({ default: m.VirtuosoGrid })),
) as React.ComponentType<VirtuosoGridProps<Article, unknown>>;

// Grid Virtualizer Components
const GridList = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>((props, ref) => (
  <div
    ref={ref}
    {...props}
    className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10 xl:px-12 py-7 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5 gap-5 lg:gap-6"
    style={{ ...props.style, display: 'grid' }}
  />
));

const GridItemContainer = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>((props, ref) => (
  <div ref={ref} {...props} className="h-full" />
));

interface FeedContentProps {
  articles: Article[];
  timeFormat: "12h" | "24h";
  selectedCategory?: string;
  layoutMode?: string;
  onMounted?: () => void;
}

const FeedContentComponent: React.FC<FeedContentProps> = ({
  articles,
  timeFormat,
  selectedCategory,
  layoutMode,
  onMounted,
}) => {
  const logger = useLogger('FeedContent');
  const { contentConfig } = useAppearance();
  const { getCategoryById } = useFeedCategories();
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);

  // T4 & T10 & T36: Log articles arriving and trigger mount handshake
  useEffect(() => {
    logger.debugTag('STATE', `FeedContent MOUNTED for category: ${selectedCategory || 'all'}`, { 
        articlesCount: articles.length,
        effectiveLayout: layoutMode || contentConfig.layoutMode 
    });
    
    // T36: Atomic Handshake - tell parent we are ready to take over the screen
    onMounted?.();

    return () => {
      logger.debugTag('STATE', `FeedContent UNMOUNTED for category: ${selectedCategory || 'all'}`);
    };
  }, [selectedCategory, logger, layoutMode, contentConfig.layoutMode, onMounted, articles.length]);

  useEffect(() => {
    logger.debugTag('STATE', `FeedContent rendering ${articles.length} articles`);
  }, [articles.length, logger]);

  // Reader Handlers - Define these BEFORE any early return
  const handleOpenReader = useCallback((article: Article) => {
    setReadingArticle(article);
  }, []);

  const handleNextArticle = useCallback(() => {
    if (!readingArticle) return;
    const currentIndex = articles.findIndex(a => a.link === readingArticle.link);
    if (currentIndex < articles.length - 1) {
      setReadingArticle(articles[currentIndex + 1]);
    }
  }, [articles, readingArticle]);

  const handlePrevArticle = useCallback(() => {
    if (!readingArticle) return;
    const currentIndex = articles.findIndex(a => a.link === readingArticle.link);
    if (currentIndex > 0) {
      setReadingArticle(articles[currentIndex - 1]);
    }
  }, [articles, readingArticle]);

  // Resolve effective layout - PRIORITIZE prop layoutMode
  let effectiveLayout = layoutMode || contentConfig.layoutMode;
  
  if (!layoutMode && selectedCategory) {
    const category = getCategoryById(selectedCategory);
    if (category?.layoutMode) {
      effectiveLayout = category.layoutMode;
    }
  }
  if (effectiveLayout === 'default') {
    effectiveLayout = 'grid'; // Default 'grid' now maps to Magazine-style/Grid virtualized
  }

  // Generic Item Renderer (for List/Minimal/Default) - Defined Unconditionally
  const genericItemContent: ItemContent<Article, unknown> = useCallback((index: number, article: Article) => {
    if (index === 0) {
        logger.debugTag('FEED', 'Virtuoso started rendering list items');
    }
    if (effectiveLayout === 'minimal') {
      return <ArticleItemLight article={article} index={index} onClick={handleOpenReader} />;
    }
    return (
      <ArticleItem
        article={article}
        index={index}
        timeFormat={timeFormat}
        onClick={handleOpenReader}
        renderMode="light"
      />
    );
  }, [effectiveLayout, timeFormat, handleOpenReader, logger]);

  // Magazine Item Renderer - Memoized to reduce closure recreation
  const magazineItemContent: ItemContent<Article, unknown> = useCallback((index: number, article: Article) => {
    if (index === 0) {
        logger.debugTag('FEED', 'Virtuoso started rendering magazine items');
    }
    return <MagazineItem article={article} onClick={handleOpenReader} />;
  }, [handleOpenReader, logger]);

  // Grid Item Renderer - Memoized to reduce closure recreation
  const gridItemContent: GridItemContent<Article, unknown> = useCallback((index: number, article: Article) => {
    if (index === 0) {
        logger.debugTag('FEED', 'Virtuoso started rendering grid items');
    }
    return (
      <ArticleItem
        article={article}
        index={index}
        timeFormat={timeFormat}
        onClick={handleOpenReader}
        showImage={true}
        renderMode="full"
        layoutMode="grid"
      />
    );
  }, [timeFormat, handleOpenReader, logger]);

  // Layouts that manage their own container/virtualization for now
  const complexLayouts = [
    'masonry', 'immersive', 'brutalist', 'timeline', 'bento',
    'newspaper', 'focus', 'gallery', 'compact', 'split',
    'cyberpunk', 'terminal', 'pocketfeeds', 'modern',
    'minimal', 'list'
  ];

  if (complexLayouts.includes(effectiveLayout)) {
    const renderComplexLayout = () => {
      switch (effectiveLayout) {
        case 'masonry': return <MasonryLayout articles={articles} timeFormat={timeFormat} />;
        case 'immersive': return <ImmersiveLayout articles={articles} timeFormat={timeFormat} />;
        case 'brutalist': return <BrutalistLayout articles={articles} timeFormat={timeFormat} />;
        case 'timeline': return <TimelineLayout articles={articles} timeFormat={timeFormat} />;
        case 'bento': return <BentoLayout articles={articles} timeFormat={timeFormat} />;
        case 'newspaper': return <NewspaperLayout articles={articles} timeFormat={timeFormat} />;
        case 'focus': return <FocusLayout articles={articles} timeFormat={timeFormat} />;
        case 'gallery': return <GalleryLayout articles={articles} timeFormat={timeFormat} />;
        case 'compact': return <CompactLayout articles={articles} timeFormat={timeFormat} />;
        case 'split': return <SplitLayout articles={articles} timeFormat={timeFormat} />;
        case 'cyberpunk': return <CyberpunkLayout articles={articles} timeFormat={timeFormat} />;
        case 'terminal': return <TerminalLayout articles={articles} timeFormat={timeFormat} />;
        case 'pocketfeeds': return <PocketFeedsLayout articles={articles} timeFormat={timeFormat} />;
        case 'minimal': return <MinimalLayout articles={articles} timeFormat={timeFormat} />;
        case 'list': return <PortalLayout articles={articles} timeFormat={timeFormat} />;
        case 'modern': return <ModernPortalLayout articles={articles} timeFormat={timeFormat} />;
        default: return null;
      }
    };

    return (
      <div className="feed-layout" data-layout={effectiveLayout}>
        <Suspense fallback={<div className="container mx-auto px-4 py-8"><FeedSkeleton count={6} layoutMode={effectiveLayout} /></div>}>
          {renderComplexLayout()}
        </Suspense>
      </div>
    );
  }

  // --- VIRTUALIZED LIST HANDLERS ---
  const virtuosoFallback = (
    <div className="container mx-auto px-4 py-8">
      <FeedSkeleton count={6} layoutMode={effectiveLayout} />
    </div>
  );

  // Magazine Layout Handler
  if (effectiveLayout === 'magazine') {
    const listArticles = articles.slice(10);
    // Header component for Virtuoso
    const Header = () => (
      <MagazineHeader articles={articles} onArticleClick={handleOpenReader} />
    );

    return (
      <div className="feed-layout" data-layout={effectiveLayout}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8" style={{ minHeight: '80vh' }}>
          <Suspense fallback={virtuosoFallback}>
            <Virtuoso
              useWindowScroll
              data={listArticles}
              components={{ Header }}
              itemContent={magazineItemContent}
              overscan={200}
            />
          </Suspense>
        </div>
        {readingArticle && (
          <Suspense fallback={null}>
            <MagazineReaderModal
              article={readingArticle}
              onClose={() => setReadingArticle(null)}
              onNext={handleNextArticle}
              onPrev={handlePrevArticle}
              hasNext={true}
              hasPrev={true}
            />
          </Suspense>
        )}
      </div>
    );
  }

  // Grid Layout Handler
  if (effectiveLayout === 'grid') {
    return (
      <div className="feed-layout" data-layout={effectiveLayout}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8" style={{ minHeight: '80vh' }}>
          <Suspense fallback={virtuosoFallback}>
            <VirtuosoGrid
              useWindowScroll
              data={articles}
              totalCount={articles.length}
              components={{ List: GridList, Item: GridItemContainer }}
              itemContent={gridItemContent}
              overscan={200}
            />
          </Suspense>
        </div>
        {readingArticle && (
          <Suspense fallback={null}>
            <MagazineReaderModal
              article={readingArticle}
              onClose={() => setReadingArticle(null)}
              onNext={handleNextArticle}
              onPrev={handlePrevArticle}
              hasNext={true}
              hasPrev={true}
            />
          </Suspense>
        )}
      </div>
    );
  }

  // Default / List Fallback
  return (
    <div className="feed-layout" data-layout={effectiveLayout}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8" style={{ minHeight: '80vh' }}>
        <Suspense fallback={virtuosoFallback}>
          <Virtuoso
            useWindowScroll
            data={articles}
            itemContent={genericItemContent}
            overscan={200}
          />
        </Suspense>
      </div>

      {readingArticle && (
        <Suspense fallback={null}>
          <MagazineReaderModal
            article={readingArticle}
            onClose={() => setReadingArticle(null)}
            onNext={handleNextArticle}
            onPrev={handlePrevArticle}
            hasNext={articles.findIndex(a => a.link === readingArticle.link) < articles.length - 1}
            hasPrev={articles.findIndex(a => a.link === readingArticle.link) > 0}
          />
        </Suspense>
      )}
    </div>
  );
};

export const FeedContent = withPerformanceTracking(
  FeedContentComponent,
  "FeedContent"
);
