import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Lang } from './translations';

interface LocaleContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (path: string, vars?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleContextType | null>(null);

const getPath = (obj: unknown, path: string): unknown =>
  path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);

export const LocaleProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem('lang');
    return saved === 'uk' || saved === 'en' ? saved : 'uk';
  });

  useEffect(() => {
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (l: Lang) => setLangState(l);

  const t = (path: string, vars?: Record<string, string | number>): string => {
    const raw = getPath(translations[lang], path) ?? getPath(translations.uk, path);
    let value = typeof raw === 'string' ? raw : path;
    if (vars) {
      Object.entries(vars).forEach(([key, v]) => {
        value = value.replace(new RegExp(`{{${key}}}`, 'g'), String(v));
      });
    }
    return value;
  };

  return (
    <LocaleContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LocaleContext.Provider>
  );
};

export const useLocale = () => {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
};
