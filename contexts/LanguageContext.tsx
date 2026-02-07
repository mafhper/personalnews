import React from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { Language } from "../types";
import { LanguageContext } from "./LanguageContextState";
import { getTranslation } from "../utils/translationUtils";

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [language, setLanguage] = useLocalStorage<Language>(
    "app-language",
    "pt-BR",
  );

  const t = (key: string): string => {
    return getTranslation(key, language);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
