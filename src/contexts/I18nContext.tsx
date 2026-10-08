import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { STORAGE_KEYS } from '@/constants';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, dictionaries, lookup, type TranslationKey } from '@/locales';
import { isAppError } from '@/types';
import type { Locale, LocalizedText } from '@/types';
import { formatCarat, formatDate, formatPrice, localized } from '@/utils/format';

type Params = Record<string, string | number>;

interface I18nValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey, params?: Params) => string;
    tDynamic: (key: string, params?: Params) => string;
    tError: (code: string) => string;
  loc: (text: LocalizedText | undefined) => string;
  price: (n: number) => string;
  date: (iso: string, withTime?: boolean) => string;
  carat: (n: number) => string;
  errorMessage: (err: unknown) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

function interpolate(template: string, params?: Params): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(params[k] ?? `{${k}}`));
}

function initialLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.locale);
    if (saved && (SUPPORTED_LOCALES as readonly string[]).includes(saved)) return saved as Locale;
  } catch {
      }
  return DEFAULT_LOCALE; 
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEYS.locale, l);
    } catch {
          }
  }, []);

  const value = useMemo<I18nValue>(() => {
    const dict = dictionaries[locale];
    const tDynamic = (key: string, params?: Params) =>
      interpolate(lookup(dict, key) ?? lookup(dictionaries[DEFAULT_LOCALE], key) ?? key, params);
    const tError = (code: string) => lookup(dict, `errors.${code}`) ?? dict.errors.UNKNOWN;
    return {
      locale,
      setLocale,
      t: (key, params) => tDynamic(key, params),
      tDynamic,
      tError,
      loc: (text) => localized(text, locale),
      price: (n) => formatPrice(n, locale),
      date: (iso, withTime) => formatDate(iso, locale, withTime),
      carat: (n) => formatCarat(n, locale),
      errorMessage: (err) => (isAppError(err) ? tError(err.code) : dict.errors.UNKNOWN),
    };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
