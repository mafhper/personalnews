import React from 'react';
import { useLogger } from '../../services/logger';

// Standardized Imports for all 16 Layout Skeletons
import { ModernPortalSkeleton } from '../layouts/ModernPortalLayout';
import { MagazineSkeleton } from '../layouts/MagazineLayout';
import { BentoSkeleton } from '../layouts/BentoLayout';
import { MasonrySkeleton } from '../layouts/MasonryLayout';
import { BrutalistSkeleton } from '../layouts/BrutalistLayout';
import { SplitSkeleton } from '../layouts/SplitLayout';
import { GallerySkeleton } from '../layouts/GalleryLayout';
import { CompactSkeleton } from '../layouts/CompactLayout';
import { TimelineSkeleton } from '../layouts/TimelineLayout';
import { NewspaperSkeleton } from '../layouts/NewspaperLayout';
import { FocusSkeleton } from '../layouts/FocusLayout';
import { CyberpunkSkeleton } from '../layouts/CyberpunkLayout';
import { TerminalSkeleton } from '../layouts/TerminalLayout';
import { PocketFeedsSkeleton } from '../layouts/PocketFeedsLayout';
import { MinimalSkeleton } from '../layouts/MinimalLayout';
import { PortalSkeleton } from '../layouts/PortalLayout';

interface FeedSkeletonProps {
  count?: number;
  layoutMode?: string;
}

/**
 * Universal Skeleton Dispatcher
 * Treats all 16 layouts with equal priority and high-fidelity.
 */
export const FeedSkeleton: React.FC<FeedSkeletonProps> = ({ 
  count = 6, 
  layoutMode = 'modern' 
}) => {
  const logger = useLogger('FeedSkeleton');
  logger.debugTag('APPEARANCE', 'Skeleton Engine - Rendering native skeleton for:', layoutMode);
  
  switch (layoutMode) {
    case 'modern': return <ModernPortalSkeleton />;
    case 'magazine': return <MagazineSkeleton />;
    case 'bento': return <BentoSkeleton />;
    case 'masonry': return <MasonrySkeleton />;
    case 'brutalist': return <BrutalistSkeleton />;
    case 'split': return <SplitSkeleton />;
    case 'gallery': return <GallerySkeleton />;
    case 'compact': return <CompactSkeleton />;
    case 'timeline': return <TimelineSkeleton />;
    case 'newspaper': return <NewspaperSkeleton />;
    case 'focus': return <FocusSkeleton />;
    case 'cyberpunk': return <CyberpunkSkeleton />;
    case 'terminal': return <TerminalSkeleton />;
    case 'pocketfeeds': return <PocketFeedsSkeleton />;
    case 'minimal': return <MinimalSkeleton />;
    case 'list': return <PortalSkeleton />; // Directly use Portal native skeleton
    
    default:
      logger.warn(`Unknown layout mode: ${layoutMode}, using grid fallback`);
      return <GridFallback count={count} />;
  }
};

/**
 * Generic Grid Fallback (Safety net only)
 */
const GridFallback: React.FC<{ count: number }> = ({ count }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 container mx-auto px-4 py-8">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="space-y-4 bg-white/5 animate-pulse rounded-2xl p-4 flex flex-col h-[380px]">
        <div className="w-full aspect-video bg-white/10 rounded-xl" />
        <div className="h-6 w-full bg-white/10 rounded" />
        <div className="h-4 w-2/3 bg-white/10 rounded" />
      </div>
    ))}
  </div>
);
