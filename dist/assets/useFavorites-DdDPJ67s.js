import{a as M,r,j}from"./performance-o4eTjbDj.js";import{u as H}from"./index-C2YApkSY.js";const N=`data:image/svg+xml;base64,${btoa(`
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
`)}`,B=({src:t,alt:n,placeholder:s,className:i="",onLoad:c,onError:d,retryAttempts:m=2,retryDelay:w=500,sizes:v="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 33vw",srcSet:x,fallbacks:I=[],priority:u=!1,width:p,height:e,aspectRatio:a="16/9"})=>{const[o,h]=r.useState(!1),[b,A]=r.useState(u),[C,y]=r.useState(!1),[L,k]=r.useState(0),[g,F]=r.useState(0),D=r.useRef(null),S=r.useRef(null),f=[t,...I].filter(l=>typeof l=="string"&&l.length>0);r.useEffect(()=>{},[t,u,f.length,b]),r.useEffect(()=>{if(!u&&D.current)return S.current=new IntersectionObserver(l=>{const[G]=l;G.isIntersecting&&(A(!0),S.current?.disconnect())},{rootMargin:"200px",threshold:.01}),S.current.observe(D.current),()=>{S.current?.disconnect()}},[u,t]);const O=r.useCallback(()=>{h(!0),y(!1),c?.()},[c,f,g]),U=r.useCallback(()=>{if(L<m)setTimeout(()=>{k(l=>l+1)},w);else{const l=g+1;l<f.length?(F(l),k(0)):(y(!0),h(!0),d?.())}},[L,m,w,d,g,f]),R=()=>C||f.length===0?_:!b&&L===0&&g===0?s||N:f[g];r.useEffect(()=>{h(!1),y(!1),k(0),F(0)},[t]);const T=R(),$=!u,z={aspectRatio:a,...p?{width:p}:{},...e?{height:e}:{}};return j.jsx("img",{ref:D,src:T,alt:C?"":n,width:p,height:e,style:z,className:`transition-opacity duration-500 ease-in-out ${o?"opacity-100":"opacity-0"} ${i} ${o?"":"bg-gray-800 animate-pulse"}`,onLoad:O,onError:U,loading:$?"lazy":"eager",sizes:v,srcSet:!C&&b&&g===0?x:void 0})},q=M.memo(B),E=t=>{const n=`${t.link}-${t.title}`;let s=0;for(let i=0;i<n.length;i++){const c=n.charCodeAt(i);s=(s<<5)-s+c,s=s&s}return Math.abs(s).toString(36)},J=t=>({id:E(t),title:t.title,link:t.link,pubDate:t.pubDate.toISOString(),sourceTitle:t.sourceTitle,imageUrl:t.imageUrl,description:t.description,author:t.author,categories:t.categories,favoritedAt:new Date().toISOString()}),Z=t=>({title:t.title,link:t.link,pubDate:new Date(t.pubDate),sourceTitle:t.sourceTitle,imageUrl:t.imageUrl,description:t.description,author:t.author,categories:t.categories}),K=()=>{const[t,n]=H("favorites-data",{articles:[],lastUpdated:new Date().toISOString()}),s=r.useMemo(()=>t.articles,[t.articles]),i=r.useCallback(e=>{const a=E(e);return s.some(o=>o.id===a)},[s]),c=r.useCallback(e=>{if(i(e))return;const a=J(e);n(o=>({articles:[a,...o.articles],lastUpdated:new Date().toISOString()}))},[i,n]),d=r.useCallback(e=>{const a=E(e);n(o=>({articles:o.articles.filter(h=>h.id!==a),lastUpdated:new Date().toISOString()}))},[n]),m=r.useCallback(e=>{i(e)?d(e):c(e)},[i,c,d]),w=r.useCallback(()=>{n({articles:[],lastUpdated:new Date().toISOString()})},[n]),v=r.useCallback(()=>s.length,[s.length]),x=r.useCallback(()=>{const e={...t,exportedAt:new Date().toISOString(),version:"1.0"};return JSON.stringify(e,null,2)},[t]),I=r.useCallback(e=>{try{const a=JSON.parse(e);if(!a.articles||!Array.isArray(a.articles))throw new Error("Invalid favorites data format");for(const o of a.articles)if(!o.id||!o.title||!o.link||!o.pubDate)throw new Error("Invalid article data in favorites");return n({articles:a.articles,lastUpdated:new Date().toISOString()}),!0}catch(a){return console.error("Failed to import favorites:",a),!1}},[n]),u=r.useCallback(e=>!e||e==="All"?s:s.filter(a=>a.categories?.some(o=>o.toLowerCase()===e.toLowerCase())),[s]),p=r.useCallback(e=>e?s.filter(a=>a.sourceTitle.toLowerCase().includes(e.toLowerCase())||a.author?.toLowerCase().includes(e.toLowerCase())):s,[s]);return{favorites:s,isFavorite:i,addToFavorites:c,removeFromFavorites:d,toggleFavorite:m,clearAllFavorites:w,getFavoritesCount:v,exportFavorites:x,importFavorites:I,getFavoritesByCategory:u,getFavoritesBySource:p}};export{q as L,Z as f,K as u};
