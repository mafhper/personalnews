import{r as s,j as e}from"./performance-C3ZVEFVv.js";import{g as z}from"./videoEmbed-DkvFDeuS.js";import{f as B}from"./articleFetcher-DV9XA7ga.js";import{b as E,l as R,m as T}from"./index-cnnzl-gl.js";const _={fontSize:"medium",lineHeight:"relaxed",contentWidth:"medium",fontFamily:"serif"},U=({article:o,onClose:d,onNext:m,onPrev:b,hasNext:x,hasPrev:g})=>{const k=z(o.link),[j,w]=s.useState(null),[W,y]=s.useState(!1),[a,N]=s.useState(!1),[c,S]=s.useState(!1),{t:n}=E(),{setModalOpen:f}=R(),v=s.useRef(null),h=s.useRef(null),[t,C]=T("reader-preferences",_),L={small:"text-base leading-relaxed",medium:"text-lg leading-relaxed",large:"text-xl leading-relaxed",xlarge:"text-2xl leading-relaxed"},$={compact:"leading-normal",normal:"leading-relaxed",relaxed:"leading-loose"},M={narrow:"max-w-xl",medium:"max-w-2xl",wide:"max-w-4xl"},p={serif:"font-serif",sans:"font-sans",mono:"font-mono"},u=s.useCallback((r,i)=>{C(l=>({...l,[r]:i}))},[C]);s.useEffect(()=>{f(!0),h.current&&h.current.focus(),v.current&&(v.current.scrollTop=0),(async()=>{w(null),y(!0);const l=await B(o.link);l&&w(l),y(!1)})();const i=l=>{l.key==="Escape"&&(c?S(!1):d()),l.key==="ArrowRight"&&x&&m(),l.key==="ArrowLeft"&&g&&b(),l.key==="f"&&N(H=>!H)};return window.addEventListener("keydown",i),()=>{window.removeEventListener("keydown",i),f(!1)}},[o.link,d,m,b,x,g,f,c]);const q=r=>r?/<[a-z][\s\S]*>/i.test(r)?r:r.split(/\n\n+/).map(l=>`<p class="mb-4">${l.trim()}</p>`).join("").replace(/\n/g,"<br />"):"",F=q(j||o.content||o.description);return e.jsxs("div",{ref:h,tabIndex:-1,className:`fixed inset-0 z-[200] flex items-center justify-center animate-in fade-in duration-300 outline-none ${a?"bg-[rgb(var(--color-background))]":"p-0 md:p-8 bg-black md:bg-black/80"}`,children:[e.jsx("style",{children:`
        .article-content {
          font-family: inherit;
          line-height: inherit;
          color: inherit;
        }
        .article-content p { margin-bottom: 1.5em; }
        .article-content h1 { font-size: 2em; font-weight: 700; margin-top: 1.5em; margin-bottom: 0.5em; color: rgb(var(--color-text)); }
        .article-content h2 { font-size: 1.5em; font-weight: 700; margin-top: 1.5em; margin-bottom: 0.5em; color: rgb(var(--color-text)); }
        .article-content h3 { font-size: 1.25em; font-weight: 600; margin-top: 1.25em; margin-bottom: 0.5em; color: rgb(var(--color-text)); }
        .article-content ul, .article-content ol { margin-bottom: 1.5em; padding-left: 1.5em; }
        .article-content ul { list-style-type: disc; }
        .article-content ol { list-style-type: decimal; }
        .article-content li { margin-bottom: 0.5em; }
        .article-content blockquote { 
          border-left: 4px solid rgb(var(--color-accent)); 
          padding-left: 1em; 
          margin-left: 0; 
          margin-right: 0; 
          margin-bottom: 1.5em; 
          font-style: italic;
          background: rgba(var(--color-surface), 0.5);
          padding: 1rem;
          border-radius: 0 0.5rem 0.5rem 0;
        }
        .article-content a { color: rgb(var(--color-accent)); text-decoration: underline; text-underline-offset: 2px; }
        .article-content img { max-width: 100%; height: auto; border-radius: 0.5rem; margin: 1.5em 0; display: block; }
        .article-content pre { background: rgb(var(--color-background)); padding: 1em; border-radius: 0.5rem; overflow-x: auto; margin-bottom: 1.5em; border: 1px solid rgba(var(--color-border), 0.2); }
        .article-content code { background: rgba(var(--color-accent), 0.1); color: rgb(var(--color-accent)); padding: 0.2em 0.4em; border-radius: 0.25em; font-family: monospace; }
        .article-content pre code { background: transparent; color: inherit; padding: 0; }
        .article-content figure { margin: 1.5em 0; }
        .article-content figcaption { text-align: center; font-size: 0.875em; color: rgb(var(--color-textSecondary)); margin-top: 0.5em; }
        .article-content iframe { max-width: 100%; margin: 1.5em 0; }
      `}),!a&&e.jsx("div",{className:"absolute inset-0 bg-black/90 backdrop-blur-md hidden md:block",onClick:d}),e.jsxs("div",{className:`relative flex flex-col overflow-hidden transition-all duration-500 ${a?"w-full h-full bg-[rgb(var(--color-background))]":"w-full h-full md:h-[90vh] md:max-w-5xl bg-[rgb(var(--color-surface))] border-none md:border border-[rgb(var(--color-border))]/20 rounded-none md:rounded-2xl shadow-2xl"}`,children:[e.jsxs("div",{className:`sticky top-0 z-50 flex items-center justify-between px-4 py-3 transition-all duration-300 ${a?"bg-transparent":"bg-[rgb(var(--color-surface))]/95 backdrop-blur-xl border-b border-[rgb(var(--color-border))]/20"}`,children:[e.jsxs("button",{onClick:d,className:"flex items-center gap-2 text-[rgb(var(--color-textSecondary))] hover:text-[rgb(var(--color-text))] transition-colors",children:[e.jsx("svg",{className:"w-5 h-5",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M10 19l-7-7m0 0l7-7m-7 7h18"})}),e.jsx("span",{className:"font-medium text-sm hidden sm:inline",children:n("action.back")})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("button",{onClick:()=>S(!c),className:`p-2 rounded-lg transition-colors ${c?"bg-[rgb(var(--color-accent))] text-white":"text-[rgb(var(--color-textSecondary))] hover:text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-surface))]"}`,title:"Preferências de leitura",children:e.jsx("svg",{className:"w-5 h-5",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"})})}),e.jsx("button",{onClick:()=>N(!a),className:`p-2 rounded-lg transition-colors ${a?"bg-[rgb(var(--color-accent))] text-white":"text-[rgb(var(--color-textSecondary))] hover:text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-surface))]"}`,title:`${n("action.focus_mode")} (F)`,children:e.jsx("svg",{className:"w-5 h-5",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"})})})]})]}),c&&e.jsxs("div",{className:"absolute top-14 right-4 z-50 w-72 bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))]/30 rounded-xl shadow-2xl p-4 animate-in slide-in-from-top-2 duration-200",children:[e.jsxs("h3",{className:"text-sm font-bold text-[rgb(var(--color-text))] mb-4 flex items-center gap-2",children:[e.jsx("svg",{className:"w-4 h-4",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"})}),"Preferências de Leitura"]}),e.jsxs("div",{className:"mb-4",children:[e.jsx("label",{className:"text-xs text-[rgb(var(--color-textSecondary))] uppercase tracking-wider mb-2 block",children:"Tamanho da fonte"}),e.jsx("div",{className:"flex gap-1",children:["small","medium","large","xlarge"].map(r=>e.jsx("button",{onClick:()=>u("fontSize",r),className:`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${t.fontSize===r?"bg-[rgb(var(--color-accent))] text-white":"bg-[rgb(var(--color-background))] text-[rgb(var(--color-textSecondary))] hover:text-[rgb(var(--color-text))]"}`,children:r==="small"?"P":r==="medium"?"M":r==="large"?"G":"XG"},r))})]}),e.jsxs("div",{className:"mb-4",children:[e.jsx("label",{className:"text-xs text-[rgb(var(--color-textSecondary))] uppercase tracking-wider mb-2 block",children:"Espaçamento"}),e.jsx("div",{className:"flex gap-1",children:["compact","normal","relaxed"].map(r=>e.jsx("button",{onClick:()=>u("lineHeight",r),className:`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${t.lineHeight===r?"bg-[rgb(var(--color-accent))] text-white":"bg-[rgb(var(--color-background))] text-[rgb(var(--color-textSecondary))] hover:text-[rgb(var(--color-text))]"}`,children:r==="compact"?"Compacto":r==="normal"?"Normal":"Amplo"},r))})]}),e.jsxs("div",{className:"mb-4",children:[e.jsx("label",{className:"text-xs text-[rgb(var(--color-textSecondary))] uppercase tracking-wider mb-2 block",children:"Largura do texto"}),e.jsx("div",{className:"flex gap-1",children:["narrow","medium","wide"].map(r=>e.jsx("button",{onClick:()=>u("contentWidth",r),className:`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${t.contentWidth===r?"bg-[rgb(var(--color-accent))] text-white":"bg-[rgb(var(--color-background))] text-[rgb(var(--color-textSecondary))] hover:text-[rgb(var(--color-text))]"}`,children:r==="narrow"?"Estreito":r==="medium"?"Médio":"Largo"},r))})]}),e.jsxs("div",{children:[e.jsx("label",{className:"text-xs text-[rgb(var(--color-textSecondary))] uppercase tracking-wider mb-2 block",children:"Fonte"}),e.jsx("div",{className:"flex gap-1",children:["serif","sans","mono"].map(r=>e.jsx("button",{onClick:()=>u("fontFamily",r),className:`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${r==="serif"?"font-serif":r==="sans"?"font-sans":"font-mono"} ${t.fontFamily===r?"bg-[rgb(var(--color-accent))] text-white":"bg-[rgb(var(--color-background))] text-[rgb(var(--color-textSecondary))] hover:text-[rgb(var(--color-text))]"}`,children:r==="serif"?"Serifa":r==="sans"?"Sem Serifa":"Mono"},r))})]})]}),!a&&e.jsxs(e.Fragment,{children:[e.jsx("button",{onClick:b,disabled:!g,className:"hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-[rgb(var(--color-surface))]/80 hover:bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text))] disabled:opacity-0 transition-all border border-[rgb(var(--color-border))]/20 backdrop-blur-sm shadow-lg",title:n("action.prev"),children:e.jsx("svg",{className:"w-6 h-6",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M15 19l-7-7 7-7"})})}),e.jsx("button",{onClick:m,disabled:!x,className:"hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-[rgb(var(--color-surface))]/80 hover:bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text))] disabled:opacity-0 transition-all border border-[rgb(var(--color-border))]/20 backdrop-blur-sm shadow-lg",title:n("action.next"),children:e.jsx("svg",{className:"w-6 h-6",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M9 5l7 7-7 7"})})})]}),e.jsxs("div",{ref:v,className:`flex-1 overflow-y-auto custom-scrollbar scroll-smooth ${a?"bg-[rgb(var(--color-background))]":"bg-[rgb(var(--color-surface))]"}`,children:[k?e.jsxs("div",{className:"w-full min-h-full flex flex-col",children:[e.jsx("div",{className:"aspect-video w-full bg-black shrink-0 md:max-h-[70vh] mx-auto",children:e.jsx("iframe",{src:k,className:"w-full h-full",allow:"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",allowFullScreen:!0})}),e.jsxs("div",{className:`p-6 md:p-10 ${M[t.contentWidth]} mx-auto w-full`,children:[e.jsx("h1",{className:`text-2xl md:text-3xl font-bold text-[rgb(var(--color-text))] mb-6 ${p[t.fontFamily]}`,children:o.title}),e.jsx("div",{className:`
                    prose prose-invert max-w-none text-[rgb(var(--color-textSecondary))]
                    ${L[t.fontSize]}
                    ${$[t.lineHeight]}
                    ${p[t.fontFamily]}
                    prose-headings:text-[rgb(var(--color-text))]
                    prose-p:mb-6
                    prose-a:text-[rgb(var(--color-accent))]
                    prose-strong:text-[rgb(var(--color-text))]
                    prose-blockquote:border-[rgb(var(--color-accent))]
                    prose-blockquote:bg-[rgb(var(--color-background))]/50
                    prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-lg
                    prose-code:text-[rgb(var(--color-accent))]
                    prose-pre:bg-[rgb(var(--color-background))]
                    prose-img:rounded-xl prose-img:shadow-lg
                  `,dangerouslySetInnerHTML:{__html:F}})]})]}):e.jsxs("div",{className:"flex flex-col min-h-full",children:[o.imageUrl&&!a&&e.jsxs("div",{className:"w-full h-[35vh] md:h-[45vh] relative shrink-0",children:[e.jsx("img",{src:o.imageUrl,className:"w-full h-full object-cover",alt:o.title}),e.jsx("div",{className:"absolute inset-0 bg-gradient-to-t from-[rgb(var(--color-surface))] via-[rgb(var(--color-surface))]/30 to-transparent"})]}),e.jsxs("div",{className:`
                relative px-6 py-8 md:px-12 md:py-12 
                ${M[t.contentWidth]} 
                mx-auto w-full transition-all 
                ${a?"pt-8":o.imageUrl?"-mt-24 md:-mt-32":""}
              `,children:[!a&&e.jsxs("div",{className:"flex flex-wrap items-center gap-3 text-xs md:text-sm tracking-wider uppercase text-[rgb(var(--color-accent))] mb-4 md:mb-6 animate-in slide-in-from-bottom-4 duration-500",children:[e.jsx("span",{className:"font-bold bg-[rgb(var(--color-background))]/80 backdrop-blur px-3 py-1.5 rounded-lg border border-[rgb(var(--color-border))]/20",children:o.sourceTitle}),e.jsx("span",{className:"w-1.5 h-1.5 rounded-full bg-[rgb(var(--color-textSecondary))]"}),e.jsx("span",{className:"text-[rgb(var(--color-textSecondary))]",children:new Date(o.pubDate).toLocaleDateString("pt-BR",{day:"numeric",month:"long",year:"numeric"})})]}),e.jsx("h1",{className:`
                  text-2xl md:text-4xl lg:text-5xl font-bold text-[rgb(var(--color-text))] mb-8 
                  leading-tight animate-in slide-in-from-bottom-4 duration-500 delay-100
                  ${p[t.fontFamily]}
                `,children:o.title}),e.jsx("article",{className:`
                    prose prose-invert max-w-none
                    ${L[t.fontSize]}
                    ${$[t.lineHeight]}
                    ${p[t.fontFamily]}
                    text-[rgb(var(--color-textSecondary))]
                    
                    /* Headings */
                    prose-headings:text-[rgb(var(--color-text))]
                    prose-headings:font-bold
                    prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
                    prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
                    
                    /* Paragraphs */
                    prose-p:mb-6
                    prose-p:text-[rgb(var(--color-textSecondary))]
                    
                    /* Links */
                    prose-a:text-[rgb(var(--color-accent))]
                    prose-a:no-underline
                    prose-a:border-b prose-a:border-[rgb(var(--color-accent))]/30
                    hover:prose-a:border-[rgb(var(--color-accent))]
                    
                    /* Strong/Bold */
                    prose-strong:text-[rgb(var(--color-text))]
                    prose-strong:font-semibold
                    
                    /* Blockquotes */
                    prose-blockquote:border-l-4
                    prose-blockquote:border-[rgb(var(--color-accent))]
                    prose-blockquote:bg-[rgb(var(--color-background))]/50
                    prose-blockquote:py-4 prose-blockquote:px-6
                    prose-blockquote:rounded-r-xl
                    prose-blockquote:italic
                    prose-blockquote:my-8
                    prose-blockquote:not-italic
                    prose-blockquote:text-[rgb(var(--color-text))]
                    
                    /* Code */
                    prose-code:text-[rgb(var(--color-accent))]
                    prose-code:bg-[rgb(var(--color-background))]
                    prose-code:px-2 prose-code:py-0.5
                    prose-code:rounded
                    prose-code:before:content-none prose-code:after:content-none
                    
                    /* Pre/Code blocks */
                    prose-pre:bg-[rgb(var(--color-background))]
                    prose-pre:border prose-pre:border-[rgb(var(--color-border))]/20
                    prose-pre:rounded-xl
                    prose-pre:my-8
                    
                    /* Images */
                    prose-img:rounded-xl 
                    prose-img:shadow-xl
                    prose-img:my-8
                    
                    /* Lists */
                    prose-ul:my-6
                    prose-ol:my-6
                    prose-li:my-2
                    prose-li:text-[rgb(var(--color-textSecondary))]
                    marker:prose-ul:text-[rgb(var(--color-accent))]
                    marker:prose-ol:text-[rgb(var(--color-accent))]
                    
                    /* Horizontal Rule */
                    prose-hr:border-[rgb(var(--color-border))]
                    prose-hr:my-10
                    
                    /* Figure */
                    prose-figure:my-8
                    prose-figcaption:text-center
                    prose-figcaption:text-[rgb(var(--color-textSecondary))]
                    prose-figcaption:text-sm
                  `,children:W?e.jsxs("div",{className:"py-16 flex flex-col items-center justify-center text-[rgb(var(--color-textSecondary))] animate-pulse",children:[e.jsx("div",{className:"w-10 h-10 border-4 border-[rgb(var(--color-accent))] border-t-transparent rounded-full animate-spin mb-4"}),e.jsx("span",{className:"uppercase tracking-widest text-xs",children:n("loading")})]}):e.jsx("div",{dangerouslySetInnerHTML:{__html:F},className:"article-content animate-in fade-in duration-500"})}),e.jsx("div",{className:"mt-12 pt-8 border-t border-[rgb(var(--color-border))]/20 flex flex-col sm:flex-row gap-4 justify-between items-center",children:e.jsxs("a",{href:o.link,target:"_blank",rel:"noopener noreferrer",className:"inline-flex items-center gap-2 text-[rgb(var(--color-accent))] hover:underline text-sm uppercase tracking-widest font-bold transition-colors",children:[n("read.more"),e.jsx("svg",{className:"w-4 h-4",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"})})]})})]})]}),e.jsx("div",{className:"h-20 md:hidden"})]}),e.jsxs("div",{className:`
          md:hidden fixed bottom-0 left-0 right-0 
          bg-[rgb(var(--color-surface))]/95 backdrop-blur-xl 
          border-t border-[rgb(var(--color-border))]/20 
          p-4 flex justify-between items-center z-40 
          transition-transform duration-300 
          ${a?"translate-y-full":""}
        `,children:[e.jsxs("button",{onClick:b,disabled:!g,className:"flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))] disabled:opacity-30 text-xs font-bold uppercase tracking-widest hover:bg-[rgb(var(--color-background))]/80 active:scale-95 transition-all border border-[rgb(var(--color-border))]/20",children:[e.jsx("svg",{className:"w-4 h-4",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M15 19l-7-7 7-7"})}),n("action.prev")]}),e.jsxs("button",{onClick:m,disabled:!x,className:"flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[rgb(var(--color-accent))] text-white disabled:opacity-30 disabled:bg-[rgb(var(--color-background))] text-xs font-bold uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg",children:[n("action.next"),e.jsx("svg",{className:"w-4 h-4",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M9 5l7 7-7 7"})})]})]})]})]})};export{U as A};
