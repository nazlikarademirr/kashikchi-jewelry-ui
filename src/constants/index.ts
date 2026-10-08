import type { OrderStatus } from '@/types';

export const APP_NAME = 'Kashikchi Jewelry';

export const STORE_CONTACT = {
  address: 'Grand Bazaar, Kılıççılar Sk. Fatih / Istanbul',
  email: 'destek@kashikchi.com',
  phone: '+90 532 230 87 24',
};

export const SOCIAL_LINKS = [
  { name: 'Instagram', icon: 'instagram', url: 'https://www.instagram.com/kashikchijewelry/' },
] as const;

export const CURRENCY = 'USD';

export const MAX_CART_QUANTITY = 10;
export const LOW_STOCK_THRESHOLD = 3;
export const PASSWORD_MIN_LENGTH = 8;

export const IMAGE_UPLOAD = {
  maxFiles: 6,
  maxBytes: 1_000_000,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
} as const;

export const ORDER_STATUSES: readonly OrderStatus[] = ['ORDER_RECEIVED', 'IN_PRODUCTION', 'READY'];

export const ORDER_STATUS_I18N: Record<OrderStatus, `orderStatus.${OrderStatus}`> = {
  ORDER_RECEIVED: 'orderStatus.ORDER_RECEIVED',
  IN_PRODUCTION: 'orderStatus.IN_PRODUCTION',
  READY: 'orderStatus.READY',
};

export const STORAGE_KEYS = {
  theme: 'kj.theme',
  locale: 'kj.locale',
  mockDb: 'kj.mockdb.v2',
  session: 'kj.session',
} as const;

export const PRODUCT_PAGE_SIZE = 8;

export const LEGAL_DOCS = ['terms', 'privacy', 'returns'] as const;
export type LegalDoc = typeof LEGAL_DOCS[number];
