import React from 'react';

const SkeletonCard = () => {
  return (
    <div className="flex flex-col h-full animate-pulse bg-gray-900/40 rounded-lg p-2">
      {/* Image Placeholder */}
      <div className="w-full h-40 sm:h-32 lg:h-40 bg-gray-800 rounded-lg mb-4" />
      
      {/* Content Placeholder */}
      <div className="flex-1 flex flex-col space-y-3">
        {/* Source Badge */}
        <div className="w-20 h-4 bg-gray-800 rounded" />
        
        {/* Title */}
        <div className="space-y-2">
          <div className="w-full h-4 bg-gray-800 rounded" />
          <div className="w-3/4 h-4 bg-gray-800 rounded" />
          <div className="w-1/2 h-4 bg-gray-800 rounded" />
        </div>
        
        {/* Metadata (Author/Date) */}
        <div className="mt-auto pt-4 flex justify-between items-center">
          <div className="w-24 h-3 bg-gray-800 rounded" />
          <div className="w-16 h-3 bg-gray-800 rounded" />
        </div>
      </div>
    </div>
  );
};

export const FeedSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="aspect-[3/4] sm:aspect-auto sm:h-[400px]">
          <SkeletonCard />
        </div>
      ))}
    </div>
  );
};
