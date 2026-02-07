import React, { Suspense } from 'react';
import { useLogger } from '../../services/logger';

const ModernPortalSkeleton = React.lazy(() =>
  import('../layouts/ModernPortalLayout').then((m) => ({
    default: m.ModernPortalSkeleton,
  })),
);
const MagazineSkeleton = React.lazy(() =>
  import('../layouts/MagazineLayout').then((m) => ({
    default: m.MagazineSkeleton,
  })),
);
const BentoSkeleton = React.lazy(() =>
  import('../layouts/BentoLayout').then((m) => ({
    default: m.BentoSkeleton,
  })),
);
const MasonrySkeleton = React.lazy(() =>
  import('../layouts/MasonryLayout').then((m) => ({
    default: m.MasonrySkeleton,
  })),
);
const BrutalistSkeleton = React.lazy(() =>
  import('../layouts/BrutalistLayout').then((m) => ({
    default: m.BrutalistSkeleton,
  })),
);
const SplitSkeleton = React.lazy(() =>
  import('../layouts/SplitLayout').then((m) => ({
    default: m.SplitSkeleton,
  })),
);
const GallerySkeleton = React.lazy(() =>
  import('../layouts/GalleryLayout').then((m) => ({
    default: m.GallerySkeleton,
  })),
);
const CompactSkeleton = React.lazy(() =>
  import('../layouts/CompactLayout').then((m) => ({
    default: m.CompactSkeleton,
  })),
);
const TimelineSkeleton = React.lazy(() =>
  import('../layouts/TimelineLayout').then((m) => ({
    default: m.TimelineSkeleton,
  })),
);
const NewspaperSkeleton = React.lazy(() =>
  import('../layouts/NewspaperLayout').then((m) => ({
    default: m.NewspaperSkeleton,
  })),
);
const FocusSkeleton = React.lazy(() =>
  import('../layouts/FocusLayout').then((m) => ({
    default: m.FocusSkeleton,
  })),
);
const ImmersiveSkeleton = React.lazy(() =>
  import('../layouts/ImmersiveLayout').then((m) => ({
    default: m.ImmersiveSkeleton,
  })),
);
const CyberpunkSkeleton = React.lazy(() =>
  import('../layouts/CyberpunkLayout').then((m) => ({
    default: m.CyberpunkSkeleton,
  })),
);
const TerminalSkeleton = React.lazy(() =>
  import('../layouts/TerminalLayout').then((m) => ({
    default: m.TerminalSkeleton,
  })),
);
const PocketFeedsSkeleton = React.lazy(() =>
  import('../layouts/PocketFeedsLayout').then((m) => ({
    default: m.PocketFeedsSkeleton,
  })),
);
const MinimalSkeleton = React.lazy(() =>
  import('../layouts/MinimalLayout').then((m) => ({
    default: m.MinimalSkeleton,
  })),
);
const PortalSkeleton = React.lazy(() =>
  import('../layouts/PortalLayout').then((m) => ({
    default: m.PortalSkeleton,
  })),
);

interface FeedSkeletonProps {
  count?: number;
  layoutMode?: string;
}

/**
 * Generic Grid Fallback (Safety net only)
 */
const GridFallback: React.FC<{ count: number }> = ({ count }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5 lg:gap-6 container mx-auto px-4 py-8">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="space-y-4 bg-white/5 animate-pulse rounded-2xl p-4 flex flex-col h-[380px]">
        <div className="w-full aspect-[4/3] sm:aspect-[3/2] bg-white/10 rounded-xl" />
        <div className="h-6 w-full bg-white/10 rounded" />
        <div className="h-4 w-2/3 bg-white/10 rounded" />
      </div>
    ))}
  </div>
);

const GridSkeleton: React.FC = () => (
  <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5 lg:gap-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="space-y-4 bg-white/5 animate-pulse rounded-2xl p-4 flex flex-col h-[360px]">
          <div className="w-full aspect-[4/3] bg-white/10 rounded-xl" />
          <div className="h-5 w-full bg-white/10 rounded" />
          <div className="h-3 w-2/3 bg-white/10 rounded" />
          <div className="mt-auto h-3 w-1/3 bg-white/10 rounded" />
        </div>
      ))}
    </div>
  </div>
);

const SKELETON_COMPONENTS: Record<string, React.ComponentType> = {
  default: ModernPortalSkeleton,
  modern: ModernPortalSkeleton,
  modernportal: ModernPortalSkeleton,
  modern_portal: ModernPortalSkeleton,
  'modern-portal': ModernPortalSkeleton,
  magazine: MagazineSkeleton,
  bento: BentoSkeleton,
  masonry: MasonrySkeleton,
  brutalist: BrutalistSkeleton,
  split: SplitSkeleton,
  gallery: GallerySkeleton,
  compact: CompactSkeleton,
  timeline: TimelineSkeleton,
  newspaper: NewspaperSkeleton,
  focus: FocusSkeleton,
  immersive: ImmersiveSkeleton,
  cyberpunk: CyberpunkSkeleton,
  terminal: TerminalSkeleton,
  pocketfeeds: PocketFeedsSkeleton,
  pocket_feeds: PocketFeedsSkeleton,
  'pocket-feeds': PocketFeedsSkeleton,
  minimal: MinimalSkeleton,
  portal: PortalSkeleton,
  list: PortalSkeleton,
  grid: GridSkeleton,
};

/**
 * Universal Skeleton Dispatcher
 * Treats all 16 layouts with equal priority and high-fidelity.
 */
export const FeedSkeleton: React.FC<FeedSkeletonProps> = ({
  count = 6,
  layoutMode = 'modern',
}) => {
  const logger = useLogger('FeedSkeleton');
  const normalizedLayout = (layoutMode || 'modern').toLowerCase().replace(/\s+/g, '').replace(/-/g, '_');
  logger.debugTag('APPEARANCE', 'Skeleton Engine - Rendering native skeleton for:', normalizedLayout);

  const SkeletonComponent = SKELETON_COMPONENTS[normalizedLayout] || SKELETON_COMPONENTS.default;
  if (!SKELETON_COMPONENTS[normalizedLayout]) {
    logger.warn(`Unknown layout mode: ${layoutMode}, falling back to default skeleton`);
  }

  return (
    <Suspense fallback={<GridFallback count={count} />}>
      <SkeletonComponent />
    </Suspense>
  );
};
