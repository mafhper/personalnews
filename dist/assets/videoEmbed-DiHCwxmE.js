import{r as l,j as c}from"./performance-CaXuyyM6.js";import{u as x}from"./useFavorites-CjlsPQhZ.js";const f=l.memo(({filled:t=!1,className:e=""})=>c.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",className:e,fill:t?"currentColor":"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:2,children:c.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"})}));f.displayName="HeartIcon";const k=({article:t,size:e="medium",position:a="overlay",className:u="","aria-label":i,title:d})=>{const{isFavorite:r,toggleFavorite:n}=x(),s=r(t),h=l.useCallback(o=>{o.preventDefault(),o.stopPropagation(),n(t)},[n,t]),g=l.useCallback(o=>{(o.key==="Enter"||o.key===" ")&&(o.preventDefault(),o.stopPropagation(),n(t))},[n,t]),m={small:{container:"w-6 h-6 p-1",icon:"h-3 w-3"},medium:{container:"w-8 h-8 p-1.5",icon:"h-4 w-4"},large:{container:"w-10 h-10 p-2",icon:"h-5 w-5"}},v={overlay:"absolute",inline:"relative"},b=`
    ${m[e].container}
    ${v[a]}
    rounded-full
    transition-all duration-200 ease-in-out
    flex items-center justify-center
    focus:outline-none
    focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent
    ${u}
  `,w=a==="overlay"?`
      bg-black/70 backdrop-blur-sm
      ${s?"text-red-500 hover:text-red-400 focus:ring-red-500":"text-white hover:text-red-500 focus:ring-white"}
      hover:bg-black/80
    `:`
      bg-gray-800/90 hover:bg-gray-700/90
      ${s?"text-red-500 hover:text-red-400 focus:ring-red-500":"text-gray-400 hover:text-red-500 focus:ring-gray-400"}
    `,y=s?"Remove from favorites":"Add to favorites",p=s?"Remove from favorites":"Add to favorites";return c.jsx("button",{onClick:h,onKeyDown:g,className:`${b} ${w}`,"aria-label":i||y,"aria-pressed":s,title:d||p,type:"button",role:"button",tabIndex:0,children:c.jsx(f,{filled:s,className:m[e].icon})})},$=(t,e)=>t.article.link===e.article.link&&t.size===e.size&&t.position===e.position&&t.className===e.className&&t["aria-label"]===e["aria-label"]&&t.title===e.title,F=l.memo(k,$);function R(t){if(!t)return null;const e=/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i,a=t.match(e);if(a&&a[1])return`https://www.youtube.com/embed/${a[1]}?autoplay=1&modestbranding=1&rel=0`;const u=/(?:vimeo\.com\/)(\d+)/i,i=t.match(u);if(i&&i[1])return`https://player.vimeo.com/video/${i[1]}?autoplay=1`;const d=/(?:twitch\.tv\/)([^"&?/\s]+)/i,r=t.match(d);if(r&&r[1]){const n=typeof window<"u"?window.location.hostname:"localhost";return`https://player.twitch.tv/?channel=${r[1]}&parent=${n}&muted=false`}return null}export{F,R as g};
