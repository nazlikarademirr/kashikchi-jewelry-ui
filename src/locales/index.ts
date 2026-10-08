import { tr } from './tr';
import { en } from './en';
import type { Locale } from '@/types';

type Paths<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Paths<T[K], `${P}${K}.`>;
}[keyof T & string];

export type TranslationKey = Paths<typeof tr>;
export type Dictionary = typeof tr;

export const dictionaries: Record<Locale, Dictionary> = { tr, en };
export const SUPPORTED_LOCALES: readonly Locale[] = ['tr', 'en'];
export const DEFAULT_LOCALE: Locale = 'tr';

export function lookup(dict: Dictionary, key: string): string | undefined {
  let cur: unknown = dict;
  for (const part of key.split('.')) {
    if (cur && typeof cur === 'object' && part in cur) cur = (cur as Record<string, unknown>)[part];
    else return undefined;
  }
  return typeof cur === 'string' ? cur : undefined;
}
