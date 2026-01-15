import{j as n}from"./performance-o4eTjbDj.js";const l=({checked:t,onChange:s,className:o="",size:e="md"})=>{const r={sm:{switch:"h-5 w-9",dot:"h-4 w-4",translate:"translate-x-4"},md:{switch:"h-6 w-11",dot:"h-5 w-5",translate:"translate-x-5"},lg:{switch:"h-8 w-14",dot:"h-7 w-7",translate:"translate-x-6"}}[e];return n.jsx("button",{type:"button",role:"switch","aria-checked":t,onClick:()=>s(!t),className:`
        relative inline-flex ${r.switch} flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent))] focus:ring-offset-2
        ${t?"bg-[rgb(var(--color-accent))]":"bg-gray-700"}
        ${o}
      `,children:n.jsx("span",{"aria-hidden":"true",className:`
          pointer-events-none inline-block ${r.dot} transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
          ${t?r.translate:"translate-x-0"}
        `})})};export{l as S};
