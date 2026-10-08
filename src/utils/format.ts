import type { Locale, LocalizedText, Product } from '@/types';
import { CURRENCY } from '@/constants';

const LOCALE_TAG: Record<Locale, string> = { tr: 'tr-TR', en: 'en-US' };

export function formatPrice(amount: number, locale: Locale): string {
  return new Intl.NumberFormat(LOCALE_TAG[locale], {
    style: 'currency',
    currency: CURRENCY,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(iso: string, locale: Locale, withTime = false): string {
  return new Intl.DateTimeFormat(LOCALE_TAG[locale], {
    dateStyle: 'long',
    ...(withTime ? { timeStyle: 'short' } : {}),
  }).format(new Date(iso));
}

export function formatCarat(carat: number, locale: Locale): string {
  return new Intl.NumberFormat(LOCALE_TAG[locale], { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(carat);
}

export function localized(text: LocalizedText | undefined, locale: Locale): string {
  if (!text) return '';
  return text[locale] || text.tr || text.en || '';
}

/** İndirim uygulanmış nihai birim fiyat (kuruş hatasından kaçınmak için tam sayıya yuvarlanır). */
export function finalPrice(p: Pick<Product, 'price' | 'discount'>): number {
  return Math.round(p.price * (1 - p.discount / 100));
}

export function isMadeToOrder(p: Pick<Product, 'stock'>): boolean {
  return p.stock <= 0;
}

export function shortId(id: string): string {
  return id.replace(/-/g, '').slice(0, 8).toUpperCase();
}
