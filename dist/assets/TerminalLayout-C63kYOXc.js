import{r as o,j as e}from"./performance-C3ZVEFVv.js";import{A as i}from"./ArticleReaderModal-BjRqXQ1s.js";import{O as d}from"./OptimizedImage-B6o4eLLQ.js";import{b as c}from"./index-KCFBQP9A.js";import"./react-vendor-Cgg2GOmP.js";import"./services-DShKEQpD.js";import"./videoEmbed-yRvvzQp4.js";import"./articleFetcher-DV9XA7ga.js";const w=({articles:t})=>{const[l,s]=o.useState(null),{t:a}=c();return e.jsxs("div",{className:"min-h-screen text-green-500 pt-3 pb-12 px-3 sm:px-4 md:px-6 font-mono text-sm md:text-base",children:[e.jsxs("div",{className:`\r
          border border-white/10 rounded-lg bg-black/95 shadow-2xl overflow-hidden\r
          min-h-[70vh] flex flex-col relative backdrop-blur-sm\r
\r
          /* 🔑 comportamento desejado */\r
          w-full\r
\r
          /* controle em telas grandes */\r
          lg:max-w-[90vw]\r
          xl:max-w-[80rem]\r
\r
          /* centraliza só quando faz sentido */\r
          lg:mx-auto\r
        `,children:[e.jsxs("div",{className:"bg-white/5 border-b border-white/5 p-2 flex items-center gap-2 sticky top-0 z-10 backdrop-blur-md",children:[e.jsxs("div",{className:"flex gap-1.5 ml-2",children:[e.jsx("div",{className:"w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"}),e.jsx("div",{className:"w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"}),e.jsx("div",{className:"w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"})]}),e.jsx("div",{className:"flex-1 text-center text-gray-600 text-[10px] uppercase tracking-widest font-bold opacity-50 select-none",children:"terminal://rss-stream"})]}),e.jsxs("div",{className:"p-4 sm:p-6 md:p-8 space-y-6 flex-1 overflow-y-auto custom-scrollbar",children:[e.jsxs("div",{className:"mb-8 text-white/90",children:[e.jsx("span",{className:"text-blue-400 font-bold",children:"user@news"}),":",e.jsx("span",{className:"text-blue-300",children:"~"}),"$ ./fetch_feeds",e.jsxs("div",{className:"text-gray-500/80 mt-1",children:["> ",t.length," items received"]})]}),e.jsx("div",{className:"space-y-8",children:t.map((r,n)=>e.jsx("article",{className:`\r
                  group relative pl-4 border-l-2 border-transparent\r
                  hover:border-green-500/50 transition-colors\r
                `,children:e.jsxs("div",{className:"flex items-start gap-4",children:[e.jsx("span",{className:"text-gray-700 select-none font-bold opacity-50",children:">"}),e.jsx("div",{className:"w-28 h-20 flex-shrink-0 rounded-md overflow-hidden bg-white/5 border border-white/10",children:r.imageUrl?e.jsx(d,{src:r.imageUrl,alt:r.title,fallbackText:"NO_IMG",width:200,height:150,className:"w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all"}):e.jsx("div",{className:"w-full h-full flex items-center justify-center text-[10px] text-gray-500 uppercase tracking-widest",children:"no img"})}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsxs("div",{className:"flex flex-wrap items-center gap-x-3 text-xs text-gray-500 mb-1 font-medium",children:[e.jsxs("span",{className:"text-yellow-600/80",children:["[",new Date(r.pubDate).toISOString().split("T")[0],"]"]}),e.jsxs("span",{className:"text-blue-500/80 lowercase",children:["@",r.sourceTitle.replace(/\s/g,"_")]})]}),e.jsx("h2",{className:`\r
                        text-lg md:text-xl font-bold text-gray-200\r
                        hover:text-green-400 hover:underline\r
                        decoration-green-500/50 underline-offset-4\r
                        transition-all cursor-pointer mb-2\r
                        max-w-[72ch]\r
                      `,onClick:()=>s(r),children:r.title}),r.description&&e.jsx("p",{className:"text-gray-500/80 leading-relaxed text-sm max-w-[80ch]",children:r.description.length>200?r.description.slice(0,200)+"…":r.description}),e.jsxs("button",{onClick:()=>s(r),className:`\r
                        mt-3 text-[10px] uppercase tracking-widest\r
                        text-[#00ff41]/60 hover:text-[#00ff41]\r
                        border border-[#00ff41]/20 hover:border-[#00ff41]/60\r
                        px-2 py-1 rounded-sm transition-all\r
                      `,children:["open_",a("action.preview")]})]})]})},r.link||n))}),e.jsxs("div",{className:"mt-12 pt-8 border-t border-white/5",children:[e.jsx("span",{className:"text-blue-400 font-bold",children:"user@news"}),":",e.jsx("span",{className:"text-blue-300",children:"~"}),"$",e.jsx("span",{className:"w-2.5 h-5 bg-gray-500/50 inline-block align-middle animate-pulse ml-1"})]})]})]}),l&&e.jsx(i,{article:l,onClose:()=>s(null),onNext:()=>{},onPrev:()=>{},hasNext:!1,hasPrev:!1})]})};export{w as TerminalLayout};
