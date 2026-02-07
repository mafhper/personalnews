import { translations } from "../constants/translations";
import { Language } from "../types";

export const getTranslation = (key: string, language: Language): string => {
  return translations[language][key] || key;
};