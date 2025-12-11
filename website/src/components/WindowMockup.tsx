import React from 'react';

interface WindowMockupProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function WindowMockup({ title = 'Terminal', children, className = '' }: WindowMockupProps) {
  return (
    <div className={`overflow-hidden rounded-lg border border-white/10 bg-[#0d1117] shadow-2xl ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 bg-white/5 border-b border-white/5">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
          <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
        </div>
        <div className="flex-1 text-center text-xs font-medium text-zinc-500 font-mono">
          {title}
        </div>
        <div className="w-14" /> {/* Spacer for centering */}
      </div>
      
      {/* Content */}
      <div className="p-4 overflow-x-auto">
        {children}
      </div>
    </div>
  );
}
