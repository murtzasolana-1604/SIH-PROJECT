/**
 * Language Context
 * Reactive bilingual translation provider (English & Hindi)
 * Uses plain object property access (t.key) — no Proxy, fully Hermes-safe
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { Language, TRANSLATIONS } from "../constants/translations";
import { StorageService } from "../services/storage";

export type Translations = typeof TRANSLATIONS["en"];

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  toggleLanguage: () => Promise<void>;
  t: Translations;
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

  // Plain object merge — fully Hermes compatible, no Proxy needed
  const t: Translations = {
    ...TRANSLATIONS["en"],
    ...(TRANSLATIONS[language] || {}),
  };

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
