import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { translations, type Language, type Translations } from "@/lib/i18n";

interface TranslationContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const TranslationContext = createContext<TranslationContextValue | undefined>(undefined);

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem("language") as Language) || "en";
  });

  useEffect(() => {
    localStorage.setItem("language", language);
    document.dir = language === "ar" || language === "ur" ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language]);

  const t = translations[language];

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslationContext() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error("useTranslation must be used within a TranslationProvider");
  }
  return context;
}

export { TranslationContext };

