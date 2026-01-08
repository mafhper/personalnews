import{R as A,r as t,j as C}from"./performance-loPN9a-y.js";const S=`data:image/svg+xml;base64,${btoa(`
  <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#374151;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#1f2937;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#grad)" />
  </svg>
`)}`,$=`data:image/svg+xml;base64,${btoa(`
  <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#374151" />
    <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#ef4444" font-family="Arial" font-size="10">Image Error</text>
  </svg>
`)}`,z=({src:f,alt:m,placeholder:p,className:h="",onLoad:o,onError:n,retryAttempts:i=3,retryDelay:c=1e3,sizes:w="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 33vw",srcSet:x})=>{const[l,v]=t.useState(!1),[u,y]=t.useState(!1),[E,g]=t.useState(!1),[s,d]=t.useState(0),r=t.useRef(null),e=t.useRef(null);t.useEffect(()=>{if(r.current)return e.current=new IntersectionObserver(a=>{const[b]=a;b.isIntersecting&&(y(!0),e.current?.disconnect())},{rootMargin:"100px",threshold:.01}),e.current.observe(r.current),()=>{e.current?.disconnect()}},[]);const I=t.useCallback(()=>{v(!0),g(!1),d(0),o?.()},[o]),L=t.useCallback(()=>{s<i?setTimeout(()=>{d(a=>a+1)},c):(g(!0),n?.())},[s,i,c,n]),R=()=>E?$:u||s>0?f:p||S;return C.jsx("img",{ref:r,src:R(),alt:m,className:`transition-opacity duration-500 ease-in-out ${l?"opacity-100":"opacity-0"} ${h} ${l?"":"bg-gray-800 animate-pulse"}`,onLoad:I,onError:L,loading:"lazy",sizes:w,srcSet:u?x:void 0})},j=A.memo(z);export{j as L};
