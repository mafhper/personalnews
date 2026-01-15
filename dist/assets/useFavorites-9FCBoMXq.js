import{a as T,r,j as $}from"./performance-o4eTjbDj.js";import{u as z}from"./index-PLyDweJM.js";const G=`data:image/svg+xml;base64,${btoa(`
  <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#374151;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#1f2937;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#grad)" />
  </svg>
`)}`,M=`data:image/svg+xml;base64,${btoa(`
  <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="gradError" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#1f2937;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#111827;stop-opacity:1" />
      </linearGradient>
      <pattern id="pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1" fill="#374151" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#gradError)" />
    <rect width="100%" height="100%" fill="url(#pattern)" />
    <path d="M30 50 L50 30 L70 50 L50 70 Z" fill="none" stroke="#374151" stroke-width="2" opacity="0.5" />
  </svg>
`)}`,j=({src:t,alt:n,placeholder:s,className:i="",onLoad:c,onError:d,retryAttempts:h=2,retryDelay:w=500,sizes:S="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 33vw",srcSet:x,fallbacks:I=[],priority:u=!1})=>{const[m,e]=r.useState(!1),[a,o]=r.useState(u),[p,b]=r.useState(!1),[C,y]=r.useState(0),[g,D]=r.useState(0),L=r.useRef(null),v=r.useRef(null),f=[t,...I].filter(l=>typeof l=="string"&&l.length>0);r.useEffect(()=>{},[t,u,f.length,a]),r.useEffect(()=>{if(!u&&L.current)return v.current=new IntersectionObserver(l=>{const[R]=l;R.isIntersecting&&(o(!0),v.current?.disconnect())},{rootMargin:"200px",threshold:.01}),v.current.observe(L.current),()=>{v.current?.disconnect()}},[u,t]);const E=r.useCallback(()=>{e(!0),b(!1),c?.()},[c,f,g]),F=r.useCallback(()=>{if(C<h)setTimeout(()=>{y(l=>l+1)},w);else{const l=g+1;l<f.length?(D(l),y(0)):(b(!0),e(!0),d?.())}},[C,h,w,d,g,f]),A=()=>p||f.length===0?M:!a&&C===0&&g===0?s||G:f[g];r.useEffect(()=>{e(!1),b(!1),y(0),D(0)},[t]);const O=A(),U=!u;return $.jsx("img",{ref:L,src:O,alt:p?"":n,className:`transition-opacity duration-500 ease-in-out ${m?"opacity-100":"opacity-0"} ${i} ${m?"":"bg-gray-800 animate-pulse"}`,onLoad:E,onError:F,loading:U?"lazy":"eager",sizes:S,srcSet:!p&&a&&g===0?x:void 0})},B=T.memo(j),k=t=>{const n=`${t.link}-${t.title}`;let s=0;for(let i=0;i<n.length;i++){const c=n.charCodeAt(i);s=(s<<5)-s+c,s=s&s}return Math.abs(s).toString(36)},H=t=>({id:k(t),title:t.title,link:t.link,pubDate:t.pubDate.toISOString(),sourceTitle:t.sourceTitle,imageUrl:t.imageUrl,description:t.description,author:t.author,categories:t.categories,favoritedAt:new Date().toISOString()}),J=t=>({title:t.title,link:t.link,pubDate:new Date(t.pubDate),sourceTitle:t.sourceTitle,imageUrl:t.imageUrl,description:t.description,author:t.author,categories:t.categories}),P=()=>{const[t,n]=z("favorites-data",{articles:[],lastUpdated:new Date().toISOString()}),s=r.useMemo(()=>t.articles,[t.articles]),i=r.useCallback(e=>{const a=k(e);return s.some(o=>o.id===a)},[s]),c=r.useCallback(e=>{if(i(e))return;const a=H(e);n(o=>({articles:[a,...o.articles],lastUpdated:new Date().toISOString()}))},[i,n]),d=r.useCallback(e=>{const a=k(e);n(o=>({articles:o.articles.filter(p=>p.id!==a),lastUpdated:new Date().toISOString()}))},[n]),h=r.useCallback(e=>{i(e)?d(e):c(e)},[i,c,d]),w=r.useCallback(()=>{n({articles:[],lastUpdated:new Date().toISOString()})},[n]),S=r.useCallback(()=>s.length,[s.length]),x=r.useCallback(()=>{const e={...t,exportedAt:new Date().toISOString(),version:"1.0"};return JSON.stringify(e,null,2)},[t]),I=r.useCallback(e=>{try{const a=JSON.parse(e);if(!a.articles||!Array.isArray(a.articles))throw new Error("Invalid favorites data format");for(const o of a.articles)if(!o.id||!o.title||!o.link||!o.pubDate)throw new Error("Invalid article data in favorites");return n({articles:a.articles,lastUpdated:new Date().toISOString()}),!0}catch(a){return console.error("Failed to import favorites:",a),!1}},[n]),u=r.useCallback(e=>!e||e==="All"?s:s.filter(a=>a.categories?.some(o=>o.toLowerCase()===e.toLowerCase())),[s]),m=r.useCallback(e=>e?s.filter(a=>a.sourceTitle.toLowerCase().includes(e.toLowerCase())||a.author?.toLowerCase().includes(e.toLowerCase())):s,[s]);return{favorites:s,isFavorite:i,addToFavorites:c,removeFromFavorites:d,toggleFavorite:h,clearAllFavorites:w,getFavoritesCount:S,exportFavorites:x,importFavorites:I,getFavoritesByCategory:u,getFavoritesBySource:m}};export{B as L,J as f,P as u};
