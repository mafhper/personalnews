/**
 * FeedContent.tsx
 *
 * Componente principal para exibição de artigos no Personal News Dashboard.
 * Gerencia a seleção e renderização dos layouts (Grid, Masonry, Minimal, Portal).
 *
 * @author Matheus Pereira
 * @version 3.0.0
 */

import React from "react";
import type { Article } from "../types";
import { withPerformanceTracking } from "../services/performanceUtils";
import { useAppearance } from "../hooks/useAppearance";
import { useFeedCategories } from "../hooks/useFeedCategories";
import { MasonryLayout } from "./layouts/MasonryLayout";
import { MinimalLayout } from "./layouts/MinimalLayout";
import { PortalLayout } from "./layouts/PortalLayout";
import { ImmersiveLayout } from "./layouts/ImmersiveLayout";
import { BrutalistLayout } from "./layouts/BrutalistLayout";
import { TimelineLayout } from "./layouts/TimelineLayout";
import { BentoLayout } from "./layouts/BentoLayout";
import { MagazineLayout } from "./layouts/MagazineLayout";
import {  NewspaperLayout, 
  FocusLayout, 
  GalleryLayout, 
  CompactLayout, 
  SplitLayout, 
  CyberpunkLayout, 
  TerminalLayout, 
  PolaroidLayout 
} from "./layouts/NewLayouts";
import { FeaturedArticle } from "./FeaturedArticle";
import { ArticleItem } from "./ArticleItem";
import { useArticleLayout } from "../hooks/useArticleLayout";

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

  if (articles.length === 0) {
    return null;
  }

  // Resolve effective layout - category layout ALWAYS overrides global when set
  let effectiveLayout = contentConfig.layoutMode;
  
  // First check if the selected category has a specific layout override
  if (selectedCategory && selectedCategory !== 'all') {
    const category = getCategoryById(selectedCategory);
    if (category?.layoutMode) {
      effectiveLayout = category.layoutMode;
    }
  }
  
  // If still 'default', fallback to grid
  if (effectiveLayout === 'default') {
    effectiveLayout = 'grid';
  }

  // Render different layouts based on configuration
  if (effectiveLayout === 'masonry') {
    return <MasonryLayout articles={articles} timeFormat={timeFormat} />;
  }

  if (effectiveLayout === 'minimal') {
    return <MinimalLayout articles={articles} timeFormat={timeFormat} />;
  }

  if (effectiveLayout === 'list') { // 'list' maps to Portal layout
    return <PortalLayout articles={articles} timeFormat={timeFormat} />;
  }

  if (effectiveLayout === 'immersive') {
    return <ImmersiveLayout articles={articles} timeFormat={timeFormat} />;
  }

  if (effectiveLayout === 'brutalist') {
    return <BrutalistLayout articles={articles} timeFormat={timeFormat} />;
  }

  if (effectiveLayout === 'timeline') {
    return <TimelineLayout articles={articles} timeFormat={timeFormat} />;
  }

  if (effectiveLayout === 'bento') {
    return <BentoLayout articles={articles} timeFormat={timeFormat} />;
  }

  if (effectiveLayout === 'newspaper') {
    return <NewspaperLayout articles={articles} timeFormat={timeFormat} />;
  }

  if (effectiveLayout === 'focus') {
    return <FocusLayout articles={articles} timeFormat={timeFormat} />;
  }

  if (effectiveLayout === 'gallery') {
    return <GalleryLayout articles={articles} timeFormat={timeFormat} />;
  }

  if (effectiveLayout === 'compact') {
    return <CompactLayout articles={articles} timeFormat={timeFormat} />;
  }

  if (effectiveLayout === 'split') {
    return <SplitLayout articles={articles} timeFormat={timeFormat} />;
  }

  if (effectiveLayout === 'cyberpunk') {
    return <CyberpunkLayout articles={articles} timeFormat={timeFormat} />;
  }

  if (effectiveLayout === 'terminal') {
    return <TerminalLayout articles={articles} timeFormat={timeFormat} />;
  }

  if (effectiveLayout === 'polaroid') {
    return <PolaroidLayout articles={articles} timeFormat={timeFormat} />;
  }

  if (effectiveLayout === 'magazine' || effectiveLayout === 'grid' || effectiveLayout === 'default') {
    return <MagazineLayout articles={articles} timeFormat={timeFormat} />;
  }

  // Fallback (should not be reached if proper keys are set)
  return <MagazineLayout articles={articles} timeFormat={timeFormat} />;
};

export const FeedContent = withPerformanceTracking(
  FeedContentComponent,
  "FeedContent"
);
