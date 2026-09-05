/**
 * Language Context
 * Reactive bilingual translation provider (English & Hindi)
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { Language, TRANSLATIONS } from "../constants/translations";
import { StorageService } from "../services/storage";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  toggleLanguage: () => Promise<void>;
  t: typeof TRANSLATIONS["en"];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    StorageService.getLanguage().then(lang => setLanguageState(lang));
  }, []);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    await StorageService.setLanguage(lang);
  };

  const toggleLanguage = async () => {
    const nextLang = language === "en" ? "hi" : "en";
    await setLanguage(nextLang);
  };

  const t = TRANSLATIONS[language];

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
