import React from 'react';

export const FirstPaintShell: React.FC<{ layoutMode?: string }> = ({ layoutMode = 'modern' }) => {
    // Determine skeleton type based on layout mode
    const isList = ['newspaper', 'minimal', 'timeline', 'focus'].includes(layoutMode);
    const isMagazine = layoutMode === 'magazine';
    const isImmersive = layoutMode === 'immersive';

    // Header styling based on type
    const headerClass = isMagazine
        ? "fixed top-0 left-0 right-0 z-50 h-20 border-b border-white/5 bg-[rgb(10,10,12)]/95 backdrop-blur-md flex flex-col justify-center items-center"
        : "fixed top-0 left-0 right-0 z-50 h-16 border-b border-white/5 bg-[rgb(10,10,12)]/80 backdrop-blur-md";

    return (
        <div className="min-h-screen flex flex-col theme-transition-all bg-[rgb(10,10,12)]">
            {/* Static Header Shell */}
            <header className={headerClass}>
                <div className={`container mx-auto px-4 h-full flex items-center ${isMagazine ? 'justify-center relative w-full' : 'justify-between'}`}>

                    {/* Magazine: Central Logo */}
                    {isMagazine && (
                        <>
                            <div className="absolute left-4 flex items-center">
                                <div className="w-8 h-8 bg-white/10 rounded-lg animate-pulse" />
                            </div>
                            <div className="h-8 w-48 bg-white/10 rounded animate-pulse" />
                            <div className="absolute right-4 flex items-center space-x-3">
                                <div className="w-8 h-8 bg-white/5 rounded-full animate-pulse" />
                            </div>
                        </>
                    )}

                    {/* Standard: Left Logo */}
                    {!isMagazine && (
                        <>
                            <div className="flex items-center space-x-4">
                                <div className="w-8 h-8 bg-white/10 rounded-lg animate-pulse flex items-center justify-center">
                                    <span className="sr-only">PN</span>
                                </div>
                                {!isImmersive && (
                                    <div className="h-6 w-32 bg-white/10 rounded animate-pulse flex items-center">
                                        <span className="text-white/20 select-none font-bold">Personal News</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-white/5 rounded-full animate-pulse" />
                                <div className="w-8 h-8 bg-white/5 rounded-full animate-pulse" />
                            </div>
                        </>
                    )}
                </div>
            </header>

            {/* Main Content Spacer */}
            <main className="w-full min-h-screen relative z-10 flex-grow pt-24 pb-8">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">

                    {/* LIST LAYOUT SKELETON */}
                    {isList && (
                        <div className="max-w-4xl mx-auto space-y-6">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex gap-4 p-4 border border-white/5 rounded-xl">
                                    <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white/5 rounded-lg animate-pulse flex-shrink-0" />
                                    <div className="flex-1 space-y-3 py-1">
                                        <div className="h-4 bg-white/10 rounded w-3/4 animate-pulse" />
                                        <div className="h-4 bg-white/5 rounded w-1/2 animate-pulse" />
                                        <div className="h-3 bg-white/5 rounded w-full animate-pulse mt-4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* GRID/DEFAULT LAYOUT SKELETON */}
                    {!isList && (
                        <>
                            {/* Hero */}
                            <div className={`w-full ${isMagazine ? 'aspect-[21/9]' : 'aspect-[16/9]'} bg-white/5 rounded-xl animate-pulse mb-8`} />

                            {/* Secondary Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="h-64 bg-white/5 rounded-xl animate-pulse" />
                                <div className="h-64 bg-white/5 rounded-xl animate-pulse" />
                                <div className="h-64 bg-white/5 rounded-xl animate-pulse" />
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};
