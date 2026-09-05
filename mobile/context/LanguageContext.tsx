/**
 * Language Context
 * Reactive bilingual translation provider (English & Hindi)
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { Language, TRANSLATIONS } from "../constants/translations";
import { StorageService } from "../services/storage";

export type TranslationFunction = ((key: string) => string) & typeof TRANSLATIONS["en"];

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  toggleLanguage: () => Promise<void>;
  t: TranslationFunction;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    StorageService.getLanguage().then((lang) => setLanguageState(lang));
  }, []);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    await StorageService.setLanguage(lang);
  };

  const toggleLanguage = async () => {
    const nextLang = language === "en" ? "hi" : "en";
    await setLanguage(nextLang);
  };

  const dict = TRANSLATIONS[language] || TRANSLATIONS["en"];
  const tFunc = (key: string): string => {
    return (dict as any)[key] ?? (TRANSLATIONS["en"] as any)[key] ?? key;
  };

  const t = new Proxy(tFunc, {
    get(target, prop: string) {
      if (prop in target) {
        return (target as any)[prop];
      }
      return (dict as any)[prop] ?? (TRANSLATIONS["en"] as any)[prop] ?? prop;
    },
    apply(target, thisArg, argArray) {
      const key = argArray[0];
      return (dict as any)[key] ?? (TRANSLATIONS["en"] as any)[key] ?? key;
    },
  }) as TranslationFunction;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
