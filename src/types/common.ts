
export type Locale = 'tr' | 'en';

export type LocalizedText = Record<Locale, string>;

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export class AppError extends Error {
  readonly code: string;
  readonly fieldErrors?: Record<string, string>;
  readonly status?: number;

  constructor(code: string, options: { fieldErrors?: Record<string, string>; status?: number } = {}) {
    super(code);
    this.name = 'AppError';
    this.code = code;
    this.fieldErrors = options.fieldErrors;
    this.status = options.status;
  }
}

export const isAppError = (e: unknown): e is AppError => e instanceof AppError;
