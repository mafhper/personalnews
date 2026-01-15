/**
 * FeedContent.tsx
 *
 * Componente principal para exibição de artigos no Personal News Dashboard.
 * Gerencia a seleção e renderização dos layouts (Grid, Masonry, Minimal, Portal).
 *
 * @author Matheus Pereira
 * @version 3.0.0
 */

import React, { Suspense, lazy, useState, useCallback } from "react";
import { Virtuoso, VirtuosoGrid } from "react-virtuoso";
import type { Article } from "../types";
import { withPerformanceTracking } from "../services/performanceUtils";
import { useAppearance } from "../hooks/useAppearance";
import { useFeedCategories } from "../hooks/useFeedCategories";
import { FeedSkeleton } from "./ui/FeedSkeleton";
import { ArticleItem } from "./ArticleItem";
import { ArticleItemLight } from "./ArticleItemLight";
import { MagazineItem } from "./layouts/MagazineItem";
import { MagazineHeader } from "./layouts/MagazineHeader";
import { MagazineReaderModal } from "./MagazineReaderModal";

// Grid Virtualizer Components
const GridList = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>((props, ref) => (
  <div
    ref={ref}
    {...props}
    className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    style={{ ...props.style, display: 'grid' }}
  />
));

const GridItemContainer = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>((props, ref) => (
  <div ref={ref} {...props} className="h-full" />
));

// Lazy load complex layouts that handle their own virtualization or structure
// Ideally, all would be unified, but for Phase 2 we target the main lists
const MasonryLayout = lazy(() => import("./layouts/MasonryLayout").then(m => ({ default: m.MasonryLayout })));
const MinimalLayout = lazy(() => import('./layouts/MinimalLayout').then(module => ({ default: module.MinimalLayout })));
const PortalLayout = lazy(() => import('./layouts/PortalLayout').then(module => ({ default: module.PortalLayout })));
const ImmersiveLayout = lazy(() => import("./layouts/ImmersiveLayout").then(m => ({ default: m.ImmersiveLayout })));
const BrutalistLayout = lazy(() => import("./layouts/BrutalistLayout").then(m => ({ default: m.BrutalistLayout })));
const TimelineLayout = lazy(() => import("./layouts/TimelineLayout").then(m => ({ default: m.TimelineLayout })));
const BentoLayout = lazy(() => import("./layouts/BentoLayout").then(m => ({ default: m.BentoLayout })));
const ModernPortalLayout = lazy(() => import("./layouts/ModernPortalLayout").then(m => ({ default: m.ModernPortalLayout })));
const NewspaperLayout = lazy(() => import("./layouts/NewspaperLayout").then(m => ({ default: m.NewspaperLayout })));
const FocusLayout = lazy(() => import("./layouts/FocusLayout").then(m => ({ default: m.FocusLayout })));
const GalleryLayout = lazy(() => import("./layouts/GalleryLayout").then(m => ({ default: m.GalleryLayout })));
const CompactLayout = lazy(() => import("./layouts/CompactLayout").then(m => ({ default: m.CompactLayout })));
const SplitLayout = lazy(() => import("./layouts/SplitLayout").then(m => ({ default: m.SplitLayout })));
const CyberpunkLayout = lazy(() => import("./layouts/CyberpunkLayout").then(m => ({ default: m.CyberpunkLayout })));
const TerminalLayout = lazy(() => import("./layouts/TerminalLayout").then(m => ({ default: m.TerminalLayout })));
const PocketFeedsLayout = lazy(() => import("./layouts/PocketFeedsLayout").then(m => ({ default: m.PocketFeedsLayout })));

interface FeedContentProps {
  articles: Article[];
  timeFormat: "12h" | "24h";
  selectedCategory?: string;
}

const FeedContentComponent: React.FC<FeedContentProps> = ({
  articles,
  timeFormat,
  selectedCategory,
}) => {
  const { contentConfig } = useAppearance();
  const { getCategoryById } = useFeedCategories();
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);

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

  // Resolve effective layout
  let effectiveLayout = contentConfig.layoutMode;
  if (selectedCategory) {
    const category = getCategoryById(selectedCategory);
    if (category?.layoutMode) {
      effectiveLayout = category.layoutMode;
    }
  }
  if (effectiveLayout === 'default') {
    effectiveLayout = 'grid'; // Default 'grid' now maps to Magazine-style/Grid virtualized
  }

  // Generic Item Renderer (for List/Minimal/Default) - Defined Unconditionally
  const genericItemContent = useCallback((index: number, article: Article) => {
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
  }, [effectiveLayout, timeFormat, handleOpenReader]);

  // Magazine Item Renderer - Memoized to reduce closure recreation
  const magazineItemContent = useCallback((_: number, article: Article) => (
    <MagazineItem article={article} onClick={handleOpenReader} />
  ), [handleOpenReader]);

  // Grid Item Renderer - Memoized to reduce closure recreation
  const gridItemContent = useCallback((index: number) => (
    <ArticleItem
      article={articles[index]}
      index={index}
      timeFormat={timeFormat}
      onClick={handleOpenReader}
      showImage={true}
      renderMode="full"
      layoutMode="grid"
    />
  ), [articles, timeFormat, handleOpenReader]);

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
      <Suspense fallback={<div className="container mx-auto px-4 py-8"><FeedSkeleton count={6} /></div>}>
        {renderComplexLayout()}
      </Suspense>
    );
  }

  // --- VIRTUALIZED LIST HANDLERS ---

  // Magazine Layout Handler
  if (effectiveLayout === 'magazine') {
    const listArticles = articles.slice(10);
    // Header component for Virtuoso
    const Header = () => (
      <MagazineHeader articles={articles} onArticleClick={handleOpenReader} />
    );

    return (
      <>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8">
          <Virtuoso
            useWindowScroll
            data={listArticles}
            components={{ Header }}
            itemContent={magazineItemContent}
            overscan={400}
          />
        </div>
        {readingArticle && <MagazineReaderModal article={readingArticle} onClose={() => setReadingArticle(null)} onNext={handleNextArticle} onPrev={handlePrevArticle} hasNext={true} hasPrev={true} />}
      </>
    );
  }

  // Grid Layout Handler
  if (effectiveLayout === 'grid') {
    return (
      <>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8">
          <VirtuosoGrid
            useWindowScroll
            totalCount={articles.length}
            components={{ List: GridList, Item: GridItemContainer }}
            itemContent={gridItemContent}
            overscan={400}
          />
        </div>
        {readingArticle && <MagazineReaderModal article={readingArticle} onClose={() => setReadingArticle(null)} onNext={handleNextArticle} onPrev={handlePrevArticle} hasNext={true} hasPrev={true} />}
      </>
    );
  }

  // Default / List Fallback
  return (
    <>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8">
        <Virtuoso
          useWindowScroll
          data={articles}
          itemContent={genericItemContent}
          overscan={400}
        />
      </div>

      {readingArticle && (
        <MagazineReaderModal
          article={readingArticle}
          onClose={() => setReadingArticle(null)}
          onNext={handleNextArticle}
          onPrev={handlePrevArticle}
          hasNext={articles.findIndex(a => a.link === readingArticle.link) < articles.length - 1}
          hasPrev={articles.findIndex(a => a.link === readingArticle.link) > 0}
        />
      )}
    </>
  );
};

export const FeedContent = withPerformanceTracking(
  FeedContentComponent,
  "FeedContent"
);
