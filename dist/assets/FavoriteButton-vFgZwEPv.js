import{r as s,j as n}from"./performance-C3ZVEFVv.js";import{u as y}from"./useFavorites-BhlVs9Be.js";const c=s.memo(({filled:e=!1,className:t=""})=>n.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",className:t,fill:e?"currentColor":"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:2,children:n.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"})}));c.displayName="HeartIcon";const p=({article:e,size:t="medium",position:i="overlay",className:u="","aria-label":d,title:f})=>{const{isFavorite:m,toggleFavorite:r}=y(),a=m(e),g=s.useCallback(o=>{o.preventDefault(),o.stopPropagation(),r(e)},[r,e]),v=s.useCallback(o=>{(o.key==="Enter"||o.key===" ")&&(o.preventDefault(),o.stopPropagation(),r(e))},[r,e]),l={small:{container:"w-6 h-6 p-1",icon:"h-3 w-3"},medium:{container:"w-8 h-8 p-1.5",icon:"h-4 w-4"},large:{container:"w-10 h-10 p-2",icon:"h-5 w-5"}},b={overlay:"absolute",inline:"relative"},h=`
    ${l[t].container}
    ${b[i]}
    rounded-full
    transition-all duration-200 ease-in-out
    flex items-center justify-center
    focus:outline-none
    focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent
    ${u}
  `,w=i==="overlay"?`
      bg-black/70 backdrop-blur-sm
      ${a?"text-red-500 hover:text-red-400 focus:ring-red-500":"text-white hover:text-red-500 focus:ring-white"}
      hover:bg-black/80
    `:`
      bg-gray-800/90 hover:bg-gray-700/90
      ${a?"text-red-500 hover:text-red-400 focus:ring-red-500":"text-gray-400 hover:text-red-500 focus:ring-gray-400"}
    `,x=a?"Remove from favorites":"Add to favorites",k=a?"Remove from favorites":"Add to favorites";return n.jsx("button",{onClick:g,onKeyDown:v,className:`${h} ${w}`,"aria-label":d||x,"aria-pressed":a,title:f||k,type:"button",role:"button",tabIndex:0,children:n.jsx(c,{filled:a,className:l[t].icon})})},C=(e,t)=>e.article.link===t.article.link&&e.size===t.size&&e.position===t.position&&e.className===t.className&&e["aria-label"]===t["aria-label"]&&e.title===t.title,$=s.memo(p,C);export{$ as F};
