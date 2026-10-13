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
export const PASSWORD_MIN_LENGTH = 8;

export const INPUT_LIMITS = {
  name: 60,
  surname: 60,
  email: 254,
  phone: 20,
  password: 100,
  productCode: 30,
  productName: 160,
  productDescription: 4000,
  categoryName: 60,
  price: 15,
  carat: 10,
  note: 1000,
  message: 2000,
  search: 80,
  ringSize: 10,
} as const;

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
} as const;

export const PRODUCT_PAGE_SIZE = 8;

export const LEGAL_DOCS = ['privacy', 'returns'] as const;
export type LegalDoc = typeof LEGAL_DOCS[number];

export const GOLD_KARAT_OPTIONS = ['8K', '10K', '14K', '18K', '21K', '22K', '24K'] as const;

// GIA D–Z color scale and clarity grades; combined values remain editable.
export const DIAMOND_COLOR_OPTIONS = Array.from({ length: 23 }, (_, i) => String.fromCharCode(68 + i));
export const DIAMOND_CLARITY_OPTIONS = ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1', 'I2', 'I3', 'VVS', 'VS', 'SI', 'VVS - VS', 'VS - SI', 'SI - I'];
