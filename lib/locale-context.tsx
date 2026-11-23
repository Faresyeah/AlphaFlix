import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import { COPY } from "@/constants/brand";

type Language = "ar" | "en";
type LocaleValue = { language: Language; copy: (typeof COPY)[Language]; toggleLanguage: () => void };
const LocaleContext = createContext<LocaleValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("ar");
  const value = useMemo(() => ({ language, copy: COPY[language], toggleLanguage: () => setLanguage((current) => current === "ar" ? "en" : "ar") }), [language]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("useLocale must be used inside LocaleProvider");
  return value;
}
