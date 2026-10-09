import { PASSWORD_MIN_LENGTH } from '@/constants';

export type ValidationMessageKey = string;



export type Validation = ValidationMessageKey | null;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[0-9\s()-]{10,18}$/;
const CODE_RE = /^[A-Za-z0-9ÇĞİÖŞÜçğıöşü][A-Za-z0-9ÇĞİÖŞÜçğıöşü\s-]{1,29}$/;

export const v = {
  required: (value: string): Validation => (value.trim() ? null : 'validation.required'),
  email: (value: string): Validation =>
    !value.trim() ? 'validation.required' : EMAIL_RE.test(value.trim()) && value.length <= 254 ? null : 'validation.email',
  password: (value: string): Validation => {
    if (!value) return 'validation.required';
    if (value.length < PASSWORD_MIN_LENGTH) return 'validation.passwordMin';
    if (!/[a-zA-Z]/.test(value) || !/[0-9]/.test(value)) return 'validation.passwordStrength';
    return null;
  },
  passwordMatch: (value: string, other: string): Validation =>
    !value ? 'validation.required' : value === other ? null : 'validation.passwordMatch',
  phone: (value: string): Validation =>
    !value.trim() ? 'validation.required' : PHONE_RE.test(value.trim()) ? null : 'validation.phone',
  code: (value: string): Validation =>
    !value.trim() ? 'validation.required' : CODE_RE.test(value.trim()) ? null : 'validation.codeFormat',
  maxLength: (value: string, max: number): Validation => (value.length > max ? 'validation.maxLength' : null),
  nonNegativeInt: (value: number | ''): Validation => {
    if (value === '' || Number.isNaN(value)) return 'validation.required';
    if (!Number.isInteger(value)) return 'validation.integer';
    return value < 0 ? 'validation.nonNegative' : null;
  },
  nonNegative: (value: number | ''): Validation => {
    if (value === '' || Number.isNaN(value)) return 'validation.required';
    return value < 0 ? 'validation.nonNegative' : null;
  },
  positive: (value: number | ''): Validation => {
    if (value === '' || Number.isNaN(value)) return 'validation.required';
    return value <= 0 ? 'validation.positive' : null;
  },
  discount: (value: number | ''): Validation => {
    if (value === '' || Number.isNaN(value)) return 'validation.required';
    return value < 0 || value > 100 ? 'validation.discountRange' : null;
  },
};

export function firstError(...results: Validation[]): Validation {
  return results.find((r) => r !== null) ?? null;
}

export function sanitizeText(input: string, maxLength = 2000): string {
  // eslint-disable-next-line no-control-regex
  return input.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, maxLength);
}

export function slugify(input: string): string {
  return input
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function uid(): string {
  return crypto.randomUUID();
}
