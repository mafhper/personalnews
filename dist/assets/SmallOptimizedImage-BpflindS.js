import{r as t,R as $,j as a}from"./performance-loPN9a-y.js";const C=({src:e,alt:u,className:f="",fallbackText:n,size:h,height:v})=>{const[o,s]=t.useState("loading"),[w,r]=t.useState(e),[c,d]=t.useState(0),m=v||h,g=h,l=t.useCallback((i,x)=>{const p="374151",j="9CA3AF";switch(i){case 0:return x||"";case 1:return`data:image/svg+xml,${encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="${g}" height="${m}">
            <rect width="100%" height="100%" fill="#${p}"/>
            <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" fill="#${j}" text-anchor="middle" dominant-baseline="middle">
              ${n.substring(0,3)}
            </text>
          </svg>
        `)}`;default:return`data:image/svg+xml,${encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="${g}" height="${m}">
            <rect width="100%" height="100%" fill="#6B7280"/>
            <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="12" fill="#F3F4F6" text-anchor="middle" dominant-baseline="middle">
              IMG
            </text>
          </svg>
        `)}`}},[n,g,m]),b=t.useCallback(()=>{s("loaded")},[]),y=t.useCallback(()=>{const i=c+1,x=l(i,e);i<=2?(d(i),r(x),s("loading")):s("error")},[c,l,e]);return $.useEffect(()=>{e?(r(e),s("loading"),d(0)):(r(l(1,void 0)),s("loading"),d(1))},[e,l]),a.jsxs("div",{className:`relative overflow-hidden flex-shrink-0 ${f}`,children:[o==="loading"&&a.jsx("div",{className:"absolute inset-0 bg-gray-700 flex items-center justify-center",children:a.jsx("div",{className:"text-gray-400 text-xs font-medium",children:c===0?"...":n.substring(0,3)})}),a.jsx("img",{src:w,alt:u,className:`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${o==="loaded"?"opacity-100":"opacity-0"}`,onLoad:b,onError:y,loading:"lazy"}),o==="error"&&a.jsx("div",{className:"absolute inset-0 bg-gray-800 flex items-center justify-center",children:a.jsx("div",{className:"text-gray-500 text-xs font-medium",children:"⚠️"})})]})};export{C as S};
