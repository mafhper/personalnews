import{a as M,r,j as H}from"./performance-o4eTjbDj.js";import{u as N}from"./index-CY0uw9Qf.js";const P=`data:image/svg+xml;base64,${btoa(`
  <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#374151;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#1f2937;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#grad)" />
  </svg>
`)}`,_=`data:image/svg+xml;base64,${btoa(`
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
`)}`,B=({src:t,alt:n,placeholder:s,className:i="",onLoad:c,onError:d,retryAttempts:h=2,retryDelay:m=500,sizes:S="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 33vw",srcSet:b,fallbacks:x=[],priority:u=!1,width:p,height:e,aspectRatio:a="16/9",fill:o=!1})=>{const[w,I]=r.useState(!1),[C,O]=r.useState(u),[y,L]=r.useState(!1),[k,D]=r.useState(0),[g,A]=r.useState(0),E=r.useRef(null),v=r.useRef(null),f=[t,...x].filter(l=>typeof l=="string"&&l.length>0);r.useEffect(()=>{},[t,u,f.length,C]),r.useEffect(()=>{if(!u&&E.current)return v.current=new IntersectionObserver(l=>{const[G]=l;G.isIntersecting&&(O(!0),v.current?.disconnect())},{rootMargin:"200px",threshold:.01}),v.current.observe(E.current),()=>{v.current?.disconnect()}},[u,t]);const U=r.useCallback(()=>{I(!0),L(!1),c?.()},[c,f,g]),R=r.useCallback(()=>{if(k<h)setTimeout(()=>{D(l=>l+1)},m);else{const l=g+1;l<f.length?(A(l),D(0)):(L(!0),I(!0),d?.())}},[k,h,m,d,g,f]),T=()=>y||f.length===0?_:!C&&k===0&&g===0?s||P:f[g];r.useEffect(()=>{I(!1),L(!1),D(0),A(0)},[t]);const $=T(),j=!u,z={...o?{}:{aspectRatio:a},...p&&!o?{width:p}:{},...e&&!o?{height:e}:{},objectPosition:"center"};return H.jsx("img",{ref:E,src:$,alt:y?"":n,width:o?void 0:p,height:o?void 0:e,style:z,className:`transition-opacity duration-300 ease-in-out ${w?"opacity-100":"opacity-80"} ${i} ${w?"":"bg-gray-800"}`,onLoad:U,onError:R,loading:j?"lazy":"eager",sizes:S,srcSet:!y&&C&&g===0?b:void 0})},Z=M.memo(B),F=t=>{const n=`${t.link}-${t.title}`;let s=0;for(let i=0;i<n.length;i++){const c=n.charCodeAt(i);s=(s<<5)-s+c,s=s&s}return Math.abs(s).toString(36)},J=t=>({id:F(t),title:t.title,link:t.link,pubDate:t.pubDate.toISOString(),sourceTitle:t.sourceTitle,imageUrl:t.imageUrl,description:t.description,author:t.author,categories:t.categories,favoritedAt:new Date().toISOString()}),K=t=>({title:t.title,link:t.link,pubDate:new Date(t.pubDate),sourceTitle:t.sourceTitle,imageUrl:t.imageUrl,description:t.description,author:t.author,categories:t.categories}),Q=()=>{const[t,n]=N("favorites-data",{articles:[],lastUpdated:new Date().toISOString()}),s=r.useMemo(()=>t.articles,[t.articles]),i=r.useCallback(e=>{const a=F(e);return s.some(o=>o.id===a)},[s]),c=r.useCallback(e=>{if(i(e))return;const a=J(e);n(o=>({articles:[a,...o.articles],lastUpdated:new Date().toISOString()}))},[i,n]),d=r.useCallback(e=>{const a=F(e);n(o=>({articles:o.articles.filter(w=>w.id!==a),lastUpdated:new Date().toISOString()}))},[n]),h=r.useCallback(e=>{i(e)?d(e):c(e)},[i,c,d]),m=r.useCallback(()=>{n({articles:[],lastUpdated:new Date().toISOString()})},[n]),S=r.useCallback(()=>s.length,[s.length]),b=r.useCallback(()=>{const e={...t,exportedAt:new Date().toISOString(),version:"1.0"};return JSON.stringify(e,null,2)},[t]),x=r.useCallback(e=>{try{const a=JSON.parse(e);if(!a.articles||!Array.isArray(a.articles))throw new Error("Invalid favorites data format");for(const o of a.articles)if(!o.id||!o.title||!o.link||!o.pubDate)throw new Error("Invalid article data in favorites");return n({articles:a.articles,lastUpdated:new Date().toISOString()}),!0}catch(a){return console.error("Failed to import favorites:",a),!1}},[n]),u=r.useCallback(e=>!e||e==="All"?s:s.filter(a=>a.categories?.some(o=>o.toLowerCase()===e.toLowerCase())),[s]),p=r.useCallback(e=>e?s.filter(a=>a.sourceTitle.toLowerCase().includes(e.toLowerCase())||a.author?.toLowerCase().includes(e.toLowerCase())):s,[s]);return{favorites:s,isFavorite:i,addToFavorites:c,removeFromFavorites:d,toggleFavorite:h,clearAllFavorites:m,getFavoritesCount:S,exportFavorites:b,importFavorites:x,getFavoritesByCategory:u,getFavoritesBySource:p}};export{Z as L,K as f,Q as u};
