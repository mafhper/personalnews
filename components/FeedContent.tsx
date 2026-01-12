/**
 * FeedContent.tsx
 *
 * Componente principal para exibição de artigos no Personal News Dashboard.
 * Gerencia a seleção e renderização dos layouts (Grid, Masonry, Minimal, Portal).
 *
 * @author Matheus Pereira
 * @version 3.0.0
 */

import React, { Suspense, lazy } from "react";
import type { Article } from "../types";
import { withPerformanceTracking } from "../services/performanceUtils";
import { useAppearance } from "../hooks/useAppearance";
import { useFeedCategories } from "../hooks/useFeedCategories";
import { useArticleLayout } from "../hooks/useArticleLayout";
import { FeaturedArticle } from "./FeaturedArticle";
import { ArticleItem } from "./ArticleItem";
import { NewspaperSkeleton, ImmersiveSkeleton, TerminalSkeleton, TimelineSkeleton } from "./ui/LayoutSkeletons";
import { FeedSkeleton } from "./ui/FeedSkeleton";

// Lazy load layouts to reduce initial bundle size
const MasonryLayout = lazy(() => import("./layouts/MasonryLayout").then(m => ({ default: m.MasonryLayout })));
const MinimalLayout = lazy(() => import("./layouts/MinimalLayout").then(m => ({ default: m.MinimalLayout })));
const PortalLayout = lazy(() => import("./layouts/PortalLayout").then(m => ({ default: m.PortalLayout })));
const ImmersiveLayout = lazy(() => import("./layouts/ImmersiveLayout").then(m => ({ default: m.ImmersiveLayout })));
const BrutalistLayout = lazy(() => import("./layouts/BrutalistLayout").then(m => ({ default: m.BrutalistLayout })));
const TimelineLayout = lazy(() => import("./layouts/TimelineLayout").then(m => ({ default: m.TimelineLayout })));
const BentoLayout = lazy(() => import("./layouts/BentoLayout").then(m => ({ default: m.BentoLayout })));
const MagazineLayout = lazy(() => import("./layouts/MagazineLayout").then(m => ({ default: m.MagazineLayout })));
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
  const { settings: layoutSettings } = useArticleLayout();
  const { getCategoryById } = useFeedCategories();

  // If no articles are present, we might be loading initially. 
  // Ideally, the parent component handles the loading state, but if articles is empty here,
  // returning null is standard. However, during initial load, we might want Skeleton if this component is mounted.
  if (articles.length === 0) {
    return null; 
  }

  // Resolve effective layout - category layout ALWAYS overrides global when set
  let effectiveLayout = contentConfig.layoutMode;
  
  // First check if the selected category has a specific layout override
  if (selectedCategory) {
    const category = getCategoryById(selectedCategory);
    if (category?.layoutMode) {
      effectiveLayout = category.layoutMode;
    }
  }
  
  // If still 'default', fallback to grid
  if (effectiveLayout === 'default') {
    effectiveLayout = 'grid';
  }

  const renderLayout = () => {
    switch (effectiveLayout) {
      case 'masonry': return <MasonryLayout articles={articles} timeFormat={timeFormat} />;
      case 'minimal': return <MinimalLayout articles={articles} timeFormat={timeFormat} />;
      case 'list': return <PortalLayout articles={articles} timeFormat={timeFormat} />;
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
      case 'modern': return <ModernPortalLayout articles={articles} timeFormat={timeFormat} />;
      case 'magazine':
      case 'grid':
      default:
        return <MagazineLayout articles={articles} timeFormat={timeFormat} />;
    }
  };

  // Layouts that manage their own container width (e.g. they need full width or have internal containers)
  const isSelfManagedLayout = [
    'newspaper',
    'immersive',
    'terminal',
    'magazine', // Has max-w-7xl internal
    'focus',
  ].includes(effectiveLayout);

  if (process.env.NODE_ENV === 'development' && articles.length > 0) {
    console.log(`[FeedContent] Layout: ${effectiveLayout}, First Article Image:`, articles[0].imageUrl);
  }

  const content = renderLayout();

  // Determine the appropriate skeleton
  let skeletonFallback: React.ReactNode;
  switch (effectiveLayout) {
    case 'newspaper':
      skeletonFallback = <NewspaperSkeleton />;
      break;
    case 'immersive':
      skeletonFallback = <ImmersiveSkeleton />;
      break;
    case 'timeline':
      skeletonFallback = <TimelineSkeleton />;
      break;
    case 'terminal':
      skeletonFallback = <TerminalSkeleton />;
      break;
    default:
      // For all other layouts, use the generic skeleton
      skeletonFallback = <FeedSkeleton count={8} />;
  }

  return (
    <Suspense fallback={
      // Wrap specific skeletons if they are self-managed, otherwise wrap generic in container
      isSelfManagedLayout ? (
        <div className="animate-pulse">
          {skeletonFallback}
        </div>
      ) : (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8 animate-in fade-in duration-500">
          {skeletonFallback}
        </div>
      )
    }>
      {isSelfManagedLayout ? content : (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          {content}
        </div>
      )}
    </Suspense>
  );
};

export const FeedContent = withPerformanceTracking(
  FeedContentComponent,
  "FeedContent"
);
