import React from 'react';

// Newspaper Layout Skeleton
export const NewspaperSkeleton = () => (
  <div className="w-full min-h-screen animate-pulse">
    <div className="mx-auto px-6 md:px-10 py-8 max-w-[1400px] 2xl:max-w-[1680px] bg-[rgb(var(--color-surface))]/85 rounded-2xl border border-[rgb(var(--color-border))]/20">
      
      {/* Masthead */}
      <div className="border-b border-[rgb(var(--color-border))] pb-6 mb-10 flex justify-between">
        <div className="h-4 w-32 bg-gray-700/50 rounded" />
        <div className="h-4 w-48 bg-gray-700/50 rounded" />
        <div className="h-4 w-32 bg-gray-700/50 rounded" />
      </div>

      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
        <div className="lg:col-span-7 2xl:col-span-8 h-[260px] sm:h-[320px] md:h-[360px] lg:h-[420px] 2xl:h-[480px] bg-gray-700/50 rounded-xl" />
        <div className="lg:col-span-5 2xl:col-span-4 flex flex-col justify-center gap-4">
          <div className="h-4 w-24 bg-gray-700/50 rounded" />
          <div className="h-10 w-full bg-gray-700/50 rounded" />
          <div className="h-10 w-3/4 bg-gray-700/50 rounded" />
          <div className="h-20 w-full bg-gray-700/50 rounded mt-2" />
        </div>
      </div>

      {/* Secondary Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        {[1, 2].map((i) => (
          <div key={i} className="flex gap-5">
            <div className="w-40 h-28 bg-gray-700/50 rounded-lg flex-shrink-0" />
            <div className="flex flex-col gap-2 w-full">
              <div className="h-3 w-20 bg-gray-700/50 rounded" />
              <div className="h-6 w-full bg-gray-700/50 rounded" />
              <div className="h-6 w-2/3 bg-gray-700/50 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Grid Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-10">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="border-t border-[rgb(var(--color-border))] pt-4">
            <div className="h-40 bg-gray-700/50 rounded-lg mb-3" />
            <div className="h-3 w-16 bg-gray-700/50 rounded mb-2" />
            <div className="h-6 w-full bg-gray-700/50 rounded mb-2" />
            <div className="h-16 w-full bg-gray-700/50 rounded" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Immersive Layout Skeleton
export const ImmersiveSkeleton = () => (
  <div className="flex flex-col gap-12 pb-20 px-4 sm:px-6 lg:px-8 animate-pulse">
    {/* Hero */}
    <div className="relative w-full rounded-3xl overflow-hidden min-h-[55vh] md:min-h-[60vh] xl:min-h-[65vh] bg-gray-800/80">
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 p-6 sm:p-10 w-full max-w-5xl space-y-4">
        <div className="h-4 w-32 bg-gray-600/50 rounded" />
        <div className="h-12 w-3/4 bg-gray-600/50 rounded" />
        <div className="h-12 w-1/2 bg-gray-600/50 rounded" />
        <div className="h-20 w-2/3 bg-gray-600/50 rounded" />
      </div>
    </div>

    {/* Grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="relative w-full rounded-3xl overflow-hidden min-h-[42vh] bg-gray-800/60">
           <div className="absolute bottom-0 left-0 p-6 w-full space-y-3">
             <div className="h-3 w-24 bg-gray-600/50 rounded" />
             <div className="h-8 w-full bg-gray-600/50 rounded" />
             <div className="h-8 w-2/3 bg-gray-600/50 rounded" />
           </div>
        </div>
      ))}
    </div>
  </div>
);

// Terminal Layout Skeleton
export const TerminalSkeleton = () => (
  <div className="min-h-screen pt-3 pb-12 px-3 sm:px-4 md:px-6 font-mono animate-pulse">
    <div className="w-full max-w-[80rem] lg:mx-auto border border-white/10 rounded-lg bg-black/95 min-h-[70vh] flex flex-col">
      {/* Header */}
      <div className="bg-white/5 border-b border-white/5 p-2 flex items-center gap-2">
        <div className="flex gap-1.5 ml-2">
          <div className="w-3 h-3 rounded-full bg-gray-700" />
          <div className="w-3 h-3 rounded-full bg-gray-700" />
          <div className="w-3 h-3 rounded-full bg-gray-700" />
        </div>
        <div className="flex-1 text-center h-3 bg-gray-800 rounded w-32 mx-auto opacity-50" />
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6 md:p-8 space-y-6 flex-1">
        <div className="h-4 w-64 bg-gray-800 rounded mb-8" />
        
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-start gap-4 pl-4 border-l-2 border-transparent">
             <div className="w-4 h-4 mt-1 bg-gray-800 rounded" />
             <div className="w-28 h-20 bg-gray-800 rounded-md flex-shrink-0" />
             <div className="flex-1 space-y-2">
               <div className="h-3 w-40 bg-gray-800 rounded" />
               <div className="h-5 w-3/4 bg-gray-800 rounded" />
                              <div className="h-4 w-full bg-gray-800 rounded opacity-60" />
                            </div>
                         </div>
                       ))} 
                     </div>
                   </div>
                 </div>
               );
               
               // Timeline Layout Skeleton
               export const TimelineSkeleton = () => (
                 <div className="max-w-3xl mx-auto relative animate-pulse py-8 min-h-screen">
                   {/* Vertical Line */}
                   <div className="absolute left-4 md:left-8 top-0 bottom-0 w-0.5 bg-gray-700/30" />
               
                   {[1, 2, 3].map((dateIndex) => (
                     <div key={dateIndex} className="mb-12 relative">
                       {/* Date Header */}
                       <div className="sticky top-20 z-10 mb-8 ml-10 md:ml-16">
                         <div className="h-8 w-32 bg-gray-700/50 rounded-full" />
                       </div>
               
                       <div className="space-y-8">
                         {[1, 2].map((articleIndex) => (
                           <div key={articleIndex} className="relative pl-10 md:pl-16">
                             {/* Dot */}
                             <div className="absolute left-[14px] md:left-[30px] top-6 w-3 h-3 rounded-full bg-gray-700" />
               
                             <div className="bg-[rgb(var(--color-surface))] p-4 md:p-6 rounded-2xl border border-[rgb(var(--color-border))]/30">
                               <div className="flex gap-2 mb-3">
                                 <div className="h-3 w-20 bg-gray-700/50 rounded" />
                                 <div className="h-3 w-16 bg-gray-700/50 rounded" />
                               </div>
               
                               <div className="h-6 w-3/4 bg-gray-700/50 rounded mb-4" />
               
                               {/* Optional Image Skeleton */}
                               {articleIndex % 2 === 0 && (
                                 <div className="h-48 w-full bg-gray-700/50 rounded-xl mb-4" />
                               )}
               
                               <div className="space-y-2">
                                 <div className="h-4 w-full bg-gray-700/50 rounded" />
                                 <div className="h-4 w-5/6 bg-gray-700/50 rounded" />
                                 <div className="h-4 w-4/6 bg-gray-700/50 rounded" />
                               </div>
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   ))}
                 </div>
               );
               
