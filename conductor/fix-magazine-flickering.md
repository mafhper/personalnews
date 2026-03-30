# Plan: Fix Flickering in Magazine Layout

## Objective
Reduce or eliminate flickering when selecting and rendering the Magazine layout in `FeedContent.tsx`.

## Background & Motivation
The user reports that the Magazine layout flickers multiple times before stabilizing. This is likely due to:
1.  **Component Recreation:** The `Header` component for `Virtuoso` is defined inside the render function, causing it to be recreated on every render of `FeedContent`.
2.  **Memoization:** Lack of proper memoization for articles slices and components.
3.  **Layout Transition:** The transition between different layouts might benefit from smoother state handling or more stable component references.

## Proposed Changes

### 1. `components/FeedContent.tsx`
-   **Stable Header Reference:** Move the `Header` component definition for the Magazine layout to a stable reference (either using `useMemo` or defining it outside the component if possible, though it needs `articles` and `handleOpenReader`).
-   **Memoize Article Slices:** Use `useMemo` to slice the articles for the Magazine layout (`listArticles`).
-   **Stable Virtuoso Components:** Use `useMemo` for the `components` prop of `Virtuoso`.

## Implementation Steps

1.  **Modify `components/FeedContent.tsx`:**
    -   Add `useMemo` to imports from 'react'.
    -   Memoize `listArticles` for the Magazine layout.
    -   Memoize the `Header` component for the Magazine layout.
    -   Ensure `magazineItemContent` is appropriately memoized (it already uses `useCallback`).

## Verification Plan

1.  **Visual Inspection:**
    -   Switch to Magazine layout and observe if the flickering is reduced or eliminated.
    -   Verify that the layout still renders correctly (Header, grid, and list).
2.  **Performance Check:**
    -   Verify that `MagazineHeader` is not re-rendering unnecessarily by adding a temporary log in `MagazineHeader.tsx`.
3.  **Type Check:**
    -   Run `bunx tsc --noEmit` to ensure no regressions in typing.
