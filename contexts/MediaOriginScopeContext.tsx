import React, { createContext, ReactNode, useContext } from "react";

const MediaOriginScopeContext = createContext<string>("all");

export const MediaOriginScopeProvider: React.FC<{
  categoryId: string;
  children: ReactNode;
}> = ({ categoryId, children }) => (
  <MediaOriginScopeContext.Provider value={categoryId || "all"}>
    {children}
  </MediaOriginScopeContext.Provider>
);

export const useMediaOriginScope = () => useContext(MediaOriginScopeContext);
