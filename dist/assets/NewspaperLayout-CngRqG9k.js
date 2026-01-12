import{r as d,j as e}from"./performance-C3ZVEFVv.js";import{A as N}from"./ArticleReaderModal-BjRqXQ1s.js";import{b as k}from"./index-KCFBQP9A.js";import{A as p}from"./ArticleImage-DzuEZ2nw.js";import"./react-vendor-Cgg2GOmP.js";import"./services-DShKEQpD.js";import"./videoEmbed-yRvvzQp4.js";import"./articleFetcher-DV9XA7ga.js";import"./LazyImage-CihW6eNW.js";const v="personalnews_weather_city",C="São Paulo",S=(t,a)=>t===0?a?"☀️":"🌙":t<=3?a?"⛅":"☁️":t<=48?"🌫️":t<=57||t<=67?"🌧️":t<=77?"❄️":t<=82?"🌧️":t<=86?"🌨️":t>=95?"⛈️":"☁️",A=async t=>{try{const n=await(await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(t)}&count=1&language=pt&format=json`)).json();return n.results&&n.results.length>0?{lat:n.results[0].latitude,lon:n.results[0].longitude,name:n.results[0].name}:null}catch{return null}},L=()=>{const[t,a]=d.useState({data:null,isLoading:!0,error:null,city:localStorage.getItem(v)||C}),n=d.useCallback(async i=>{a(l=>({...l,isLoading:!0,error:null}));const s=await A(i);if(!s){a(l=>({...l,isLoading:!1,error:"City not found"}));return}try{const o=await(await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${s.lat}&longitude=${s.lon}&current=temperature_2m,weather_code,is_day`)).json();o.current?(a({data:{temperature:Math.round(o.current.temperature_2m),weatherCode:o.current.weather_code,isDay:o.current.is_day===1},isLoading:!1,error:null,city:s.name}),localStorage.setItem(v,s.name)):a(u=>({...u,isLoading:!1,error:"Failed to fetch weather"}))}catch{a(l=>({...l,isLoading:!1,error:"Network error"}))}},[]),x=d.useCallback(i=>{n(i)},[n]);d.useEffect(()=>{const i=requestAnimationFrame(()=>n(t.city)),s=setInterval(()=>n(t.city),1800*1e3);return()=>{cancelAnimationFrame(i),clearInterval(s)}},[n,t.city]);const g=d.useCallback(()=>t.data?S(t.data.weatherCode,t.data.isDay):"🌡️",[t.data]);return{...t,changeCity:x,refreshWeather:()=>n(t.city),getWeatherIcon:g}},M=({articles:t})=>{const[a,n]=d.useState(null),{data:x,city:g,getWeatherIcon:i,isLoading:s,changeCity:l}=L(),{t:o}=k(),u=new Date,c=t[0],b=t.slice(1,3),j=t.slice(3),w=()=>{const r=prompt(o("weather.city_prompt"),g);r&&l(r)},h=r=>{const y=u.getTime()-r.getTime(),m=Math.floor(y/6e4);if(m<1)return o("time.now")||"agora";if(m<60)return`${m}min`;const f=Math.floor(m/60);return f<24?`${f}h`:r.toLocaleDateString("pt-BR",{day:"2-digit",month:"short"})};return e.jsxs("div",{className:"min-h-screen",children:[e.jsxs("div",{className:`
          mx-auto px-6 md:px-10 py-8
          max-w-[1400px]
          2xl:max-w-[1680px]
          bg-[rgb(var(--color-surface))]/85
          backdrop-blur
          rounded-2xl
          border border-[rgb(var(--color-border))]/20
        `,children:[e.jsx("header",{className:"border-b border-[rgb(var(--color-border))] pb-6 mb-10",children:e.jsxs("div",{className:"flex justify-between items-center text-xs uppercase tracking-widest text-[rgb(var(--color-textSecondary))]",children:[e.jsxs("span",{children:[o("article.vol")," ",new Date().getFullYear()]}),e.jsx("button",{onClick:w,className:"flex items-center gap-2 hover:text-[rgb(var(--color-accent))]",children:s?"...":x&&e.jsxs(e.Fragment,{children:[e.jsx("span",{children:i()}),e.jsxs("span",{children:[x.temperature,"°"]}),e.jsx("span",{className:"hidden sm:inline",children:g})]})}),e.jsx("span",{children:new Date().toLocaleDateString("pt-BR",{weekday:"short",day:"numeric",month:"short"})})]})}),c&&e.jsxs("section",{onClick:()=>n(c),className:`
              relative mb-16 cursor-pointer group
              grid grid-cols-1
              lg:grid-cols-12
              gap-8
              items-stretch
            `,children:[e.jsxs("div",{className:`
                relative overflow-hidden rounded-xl
                h-[260px]
                sm:h-[320px]
                md:h-[360px]
                lg:h-[420px]
                2xl:h-[480px]
                lg:col-span-7
                2xl:col-span-8
                bg-[rgb(var(--color-background))]
              `,children:[e.jsx(p,{article:c,className:"absolute inset-0 w-full h-full object-cover",width:1600,height:900}),e.jsx("div",{className:"absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"})]}),e.jsxs("div",{className:`
                lg:col-span-5
                2xl:col-span-4
                flex flex-col justify-center
                gap-4
                max-w-none
              `,children:[e.jsx("span",{className:"text-xs font-bold uppercase tracking-widest text-[rgb(var(--color-accent))]",children:c.sourceTitle}),e.jsx("h2",{className:`
                  font-serif font-bold leading-tight
                  text-2xl
                  sm:text-3xl
                  md:text-4xl
                  lg:text-4xl
                  2xl:text-5xl
                `,children:c.title}),c.description&&e.jsx("p",{className:"text-[rgb(var(--color-textSecondary))] leading-relaxed line-clamp-4",children:c.description}),e.jsx("span",{className:"text-xs text-[rgb(var(--color-textSecondary))]",children:h(c.pubDate)})]})]}),b.length>0&&e.jsx("section",{className:"grid grid-cols-1 md:grid-cols-2 gap-8 mb-16",children:b.map(r=>e.jsxs("article",{onClick:()=>n(r),className:"flex gap-5 cursor-pointer group",children:[e.jsx("div",{className:"relative w-40 h-28 rounded-lg overflow-hidden bg-[rgb(var(--color-background))] flex-shrink-0",children:e.jsx(p,{article:r,className:"absolute inset-0 w-full h-full object-cover",width:400,height:300})}),e.jsxs("div",{className:"flex flex-col gap-2",children:[e.jsx("span",{className:"text-[10px] uppercase tracking-widest text-[rgb(var(--color-accent))] font-bold",children:r.sourceTitle}),e.jsx("h3",{className:"font-serif text-lg font-bold leading-snug group-hover:text-[rgb(var(--color-accent))]",children:r.title}),e.jsx("span",{className:"text-xs text-[rgb(var(--color-textSecondary))]",children:h(r.pubDate)})]})]},r.link))}),e.jsx("section",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-10",children:j.map(r=>e.jsxs("article",{onClick:()=>n(r),className:"cursor-pointer group border-t border-[rgb(var(--color-border))] pt-4",children:[e.jsx("div",{className:"relative h-40 rounded-lg overflow-hidden bg-[rgb(var(--color-background))] mb-3",children:e.jsx(p,{article:r,className:"absolute inset-0 w-full h-full object-cover",width:600,height:400})}),e.jsx("span",{className:"inline-block text-[10px] uppercase tracking-widest bg-[rgb(var(--color-accent))]/10 text-[rgb(var(--color-accent))] px-2 py-0.5 rounded mb-2 font-bold",children:r.sourceTitle}),e.jsx("h3",{className:"font-serif text-lg font-bold leading-snug mb-2 group-hover:text-[rgb(var(--color-accent))]",children:r.title}),r.description&&e.jsx("p",{className:"text-sm text-[rgb(var(--color-textSecondary))] line-clamp-3 mb-2",children:r.description}),e.jsx("span",{className:"text-xs text-[rgb(var(--color-textSecondary))]",children:h(r.pubDate)})]},r.link))}),e.jsx("footer",{className:"mt-16 pt-6 border-t border-[rgb(var(--color-border))] text-center",children:e.jsx("p",{className:"text-xs uppercase tracking-widest text-[rgb(var(--color-textSecondary))]",children:o("article.end")||"Fim da edição"})})]}),a&&e.jsx(N,{article:a,onClose:()=>n(null),onNext:()=>{},onPrev:()=>{},hasNext:!1,hasPrev:!1})]})};export{M as NewspaperLayout};
