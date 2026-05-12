import { useEffect } from "react";

let lockCount = 0;
let previousHtmlOverflow = "";
let previousBodyOverflow = "";
let previousBodyPaddingRight = "";
let previousHtmlOverscrollBehavior = "";
let previousBodyOverscrollBehavior = "";

export const useDocumentScrollLock = (locked: boolean) => {
  useEffect(() => {
    if (!locked || typeof window === "undefined") return;

    const html = document.documentElement;
    const body = document.body;

    if (lockCount === 0) {
      previousHtmlOverflow = html.style.overflow;
      previousBodyOverflow = body.style.overflow;
      previousBodyPaddingRight = body.style.paddingRight;
      previousHtmlOverscrollBehavior = html.style.overscrollBehavior;
      previousBodyOverscrollBehavior = body.style.overscrollBehavior;

      const gutterStable =
        getComputedStyle(html).scrollbarGutter === "stable" ||
        getComputedStyle(body).scrollbarGutter === "stable";

      html.style.overflow = "hidden";
      body.style.overflow = "hidden";
      html.style.overscrollBehavior = "none";
      body.style.overscrollBehavior = "none";

      if (!gutterStable) {
        const scrollbarWidth = window.innerWidth - html.clientWidth;
        if (scrollbarWidth > 0) {
          body.style.paddingRight = `${scrollbarWidth}px`;
        }
      }
    }

    lockCount += 1;

    return () => {
      lockCount = Math.max(0, lockCount - 1);

      if (lockCount === 0) {
        html.style.overflow = previousHtmlOverflow;
        body.style.overflow = previousBodyOverflow;
        body.style.paddingRight = previousBodyPaddingRight;
        html.style.overscrollBehavior = previousHtmlOverscrollBehavior;
        body.style.overscrollBehavior = previousBodyOverscrollBehavior;
      }
    };
  }, [locked]);
};
