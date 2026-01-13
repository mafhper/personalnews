import{r as t,R as S,j as a}from"./performance-C3ZVEFVv.js";const I=({src:e,alt:u,className:f="",fallbackText:n,size:h,height:v,priority:w=!1})=>{const[o,s]=t.useState("loading"),[b,r]=t.useState(e),[c,d]=t.useState(0),g=v||h,m=h,i=t.useCallback((l,x)=>{const j="374151",$="9CA3AF";switch(l){case 0:return x||"";case 1:return`data:image/svg+xml,${encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="${m}" height="${g}">
            <rect width="100%" height="100%" fill="#${j}"/>
            <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" fill="#${$}" text-anchor="middle" dominant-baseline="middle">
              ${n.substring(0,3)}
            </text>
          </svg>
        `)}`;default:return`data:image/svg+xml,${encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="${m}" height="${g}">
            <rect width="100%" height="100%" fill="#6B7280"/>
            <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="12" fill="#F3F4F6" text-anchor="middle" dominant-baseline="middle">
              IMG
            </text>
          </svg>
        `)}`}},[n,m,g]),y=t.useCallback(()=>{s("loaded")},[]),p=t.useCallback(()=>{const l=c+1,x=i(l,e);l<=2?(d(l),r(x),s("loading")):s("error")},[c,i,e]);return S.useEffect(()=>{e?(r(e),s("loading"),d(0)):(r(i(1,void 0)),s("loading"),d(1))},[e,i]),a.jsxs("div",{className:`relative overflow-hidden flex-shrink-0 ${f}`,children:[o==="loading"&&a.jsx("div",{className:"absolute inset-0 bg-gray-700 flex items-center justify-center",children:a.jsx("div",{className:"text-gray-400 text-xs font-medium",children:c===0?"...":n.substring(0,3)})}),a.jsx("img",{src:b,alt:u,className:`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${o==="loaded"?"opacity-100":"opacity-0"}`,onLoad:y,onError:p,loading:w?"eager":"lazy"}),o==="error"&&a.jsx("div",{className:"absolute inset-0 bg-gray-800 flex items-center justify-center",children:a.jsx("div",{className:"text-gray-500 text-xs font-medium",children:"⚠️"})})]})};export{I as S};
