import { AppError } from '@/types';
import { expireSession, readSession, saveSession } from './authSession';

const BASE_URL = ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api').replace(/\/$/, '');

export function apiUrl(path: string): URL { return new URL(`${BASE_URL}${path}`, window.location.origin); }

export function setTokens(access: string | null, refresh: string | null, sessionExpiresAt?: string) {
  if (!access || !refresh) { saveSession(null); return; }
  const expiresAt = sessionExpiresAt ? Date.parse(sessionExpiresAt) : readSession()?.expiresAt;
  if (!expiresAt || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) return;
  saveSession({ accessToken: access, refreshToken: refresh, expiresAt });
}

type Query = Record<string, string | number | boolean | undefined | null>;

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: Query;
  body?: unknown;
  formData?: FormData;
  allowUnauthorized?: boolean;
}

let refreshPromise: Promise<string | null> | null = null;

function accessTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number };
    return typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now();
  } catch { return false; }
}

async function refreshTokens(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  const original = readSession();
  if (!original || expireSession()) return null;
  const refresh = async () => {
    const session = readSession();
    if (!session || expireSession()) return null;
    // Başka bir sekme beklerken yenilemiş olabilir.
    if (session.accessToken !== original.accessToken) return session.accessToken;
    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      });
      if (!res.ok) {
        // Geçici sunucu/ağ hataları açık oturumu silmez.
        if (res.status === 401 && readSession()?.refreshToken === session.refreshToken) saveSession(null);
        if (res.status >= 500) throw new AppError('NETWORK_ERROR');
        return null;
      }
      const data = await res.json();
      const current = readSession();
      if (!current || expireSession()) return null;
      if (current.refreshToken !== session.refreshToken) return current.accessToken;
      setTokens(data.accessToken, data.refreshToken, data.sessionExpiresAt);
      return readSession()?.accessToken ?? null;
    } catch { throw new AppError('NETWORK_ERROR'); }
  };
  refreshPromise = (navigator.locks
    ? navigator.locks.request('kj:token-refresh', refresh)
    : refresh()).finally(() => { refreshPromise = null; });
  return refreshPromise;
}

export async function http<T = void>(path: string, opts: RequestOptions = {}, isRetry = false): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`, window.location.origin);
  Object.entries(opts.query ?? {}).forEach(([k, val]) => {
    if (val !== undefined && val !== null && val !== '') url.searchParams.set(k, String(val));
  });

  const method = opts.method ?? 'GET';
  const headers: Record<string, string> = { Accept: 'application/json' };
  
  expireSession();
  let session = readSession();
  // Herkese açık sayfalarda da kullanım sırasında süresi dolan access token yenilenir.
  if (!isRetry && !path.startsWith('/auth/') && session && accessTokenExpired(session.accessToken)) {
    await refreshTokens();
    session = readSession();
  }
  if (session) headers['Authorization'] = `Bearer ${session.accessToken}`;

  let body: BodyInit | undefined;
  if (opts.formData) body = opts.formData;
  else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.body);
  }

  let res: Response;
  try {
    res = await fetch(url, { method, headers, body });
  } catch {
    throw new AppError('NETWORK_ERROR');
  }

  if (res.status === 401) {
    const isAuthPath = path.startsWith('/auth/login') || path.startsWith('/auth/register') || path.startsWith('/auth/google');
    if (!isAuthPath) {
      if (!isRetry && readSession()?.refreshToken) {
        const newToken = await refreshTokens();
        if (newToken) return http<T>(path, opts, true);
      }
      
      if (readSession()?.accessToken !== session?.accessToken && readSession()) return http<T>(path, opts, true);
      setTokens(null, null);
      if (session) window.dispatchEvent(new Event('kj:unauthorized'));
      if (opts.allowUnauthorized) return null as T;
      throw new AppError('UNAUTHORIZED');
    }
  }

  if (!res.ok) {
    let payload: { code?: string; fieldErrors?: Record<string, string>; retryAfter?: number } = {};
    try {
      payload = await res.json();
    } catch {}

    const retryHeader = res.headers.get('Retry-After');
    const parsedRetry = retryHeader ? parseInt(retryHeader, 10) : undefined;
    const retryAfter =
      typeof payload.retryAfter === 'number'
        ? payload.retryAfter
        : parsedRetry !== undefined && !isNaN(parsedRetry)
        ? parsedRetry
        : undefined;

    throw new AppError(
      payload.code ??
        (res.status === 401
          ? 'INVALID_CREDENTIALS'
          : res.status === 403
          ? 'FORBIDDEN'
          : res.status === 404
          ? 'NOT_FOUND'
          : res.status >= 500
          ? 'NETWORK_ERROR'
          : 'UNKNOWN'),
      {
        fieldErrors: payload.fieldErrors,
        status: res.status,
        retryAfter,
      },
    );
  }
  
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
