import{R as z,r as t,j as G}from"./performance-DGt_hWBo.js";const j=`data:image/svg+xml;base64,${btoa(`
  <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#374151;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#1f2937;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#grad)" />
  </svg>
`)}`,D=`data:image/svg+xml;base64,${btoa(`
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
`)}`,H=({src:a,alt:E,placeholder:L,className:v="",onLoad:p,onError:h,retryAttempts:m=2,retryDelay:x=500,sizes:I="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 33vw",srcSet:R,fallbacks:S=[],priority:n=!1})=>{const[w,c]=t.useState(!1),[i,b]=t.useState(n),[l,u]=t.useState(!1),[f,d]=t.useState(0),[s,y]=t.useState(0),g=t.useRef(null),o=t.useRef(null),r=[a,...S].filter(e=>typeof e=="string"&&e.length>0);t.useEffect(()=>{},[a,n,r.length,i]),t.useEffect(()=>{if(!n&&g.current)return o.current=new IntersectionObserver(e=>{const[k]=e;k.isIntersecting&&(b(!0),o.current?.disconnect())},{rootMargin:"200px",threshold:.01}),o.current.observe(g.current),()=>{o.current?.disconnect()}},[n,a]);const C=t.useCallback(()=>{c(!0),u(!1),p?.()},[p,r,s]),A=t.useCallback(()=>{if(f<m)setTimeout(()=>{d(e=>e+1)},x);else{const e=s+1;e<r.length?(y(e),d(0)):(u(!0),c(!0),h?.())}},[f,m,x,h,s,r]),O=()=>l||r.length===0?D:!i&&f===0&&s===0?L||j:r[s];t.useEffect(()=>{c(!1),u(!1),d(0),y(0)},[a]);const U=O(),$=!n;return G.jsx("img",{ref:g,src:U,alt:l?"":E,className:`transition-opacity duration-500 ease-in-out ${w?"opacity-100":"opacity-0"} ${v} ${w?"":"bg-gray-800 animate-pulse"}`,onLoad:C,onError:A,loading:$?"lazy":"eager",sizes:I,srcSet:!l&&i&&s===0?R:void 0})},_=z.memo(H);export{_ as L};
