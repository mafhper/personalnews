import{R as S,r as t,j as C}from"./performance-DlrZJWlJ.js";const A=`data:image/svg+xml;base64,${btoa(`
  <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#374151;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#1f2937;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#grad)" />
  </svg>
`)}`,O=`data:image/svg+xml;base64,${btoa(`
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
`)}`,$=({src:h,alt:m,placeholder:w,className:x="",onLoad:n,onError:i,retryAttempts:c=3,retryDelay:l=1e3,sizes:y="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 33vw",srcSet:v})=>{const[d,p]=t.useState(!1),[u,E]=t.useState(!1),[s,f]=t.useState(!1),[r,g]=t.useState(0),o=t.useRef(null),e=t.useRef(null);t.useEffect(()=>{if(o.current)return e.current=new IntersectionObserver(a=>{const[b]=a;b.isIntersecting&&(E(!0),e.current?.disconnect())},{rootMargin:"100px",threshold:.01}),e.current.observe(o.current),()=>{e.current?.disconnect()}},[]);const L=t.useCallback(()=>{p(!0),f(!1),g(0),n?.()},[n]),R=t.useCallback(()=>{r<c?setTimeout(()=>{g(a=>a+1)},l):(f(!0),p(!0),i?.())},[r,c,l,i]),I=()=>s?O:u||r>0?h:w||A;return C.jsx("img",{ref:o,src:I(),alt:s?"":m,className:`transition-opacity duration-500 ease-in-out ${d?"opacity-100":"opacity-0"} ${x} ${d?"":"bg-gray-800 animate-pulse"}`,onLoad:L,onError:R,loading:"lazy",sizes:y,srcSet:!s&&u?v:void 0})},G=S.memo($);export{G as L};
