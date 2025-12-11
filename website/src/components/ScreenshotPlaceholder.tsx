import React from 'react';

interface Props {
  width: number;
  height: number;
  label?: string;
  className?: string;
}

export const ScreenshotPlaceholder: React.FC<Props> = ({ width, height, label = "App Screenshot", className = "" }) => {
  return (
    <div className={`flex flex-col items-center justify-center bg-[#0a0a0a] border border-white/10 text-zinc-500 font-mono text-sm select-none ${className}`} style={{ width: '100%', height: '100%' }}>
        <div className="w-full h-full flex flex-col items-center justify-center bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')]">
          <div className="mb-3 opacity-40">
             <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
          <div className="font-bold text-zinc-400 mb-1">{label}</div>
          <div className="text-xs text-zinc-600 bg-white/5 px-2 py-1 rounded border border-white/5">{width}px x {height}px</div>
      </div>
    </div>
  );
};
