import { AppError } from '@/types';

const BASE_URL = ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api').replace(/\/$/, '');

let accessToken: string | null = localStorage.getItem('access_token');
let refreshToken: string | null = localStorage.getItem('refresh_token');

export function setTokens(access: string | null, refresh: string | null) {
  accessToken = access;
  refreshToken = refresh;
  if (access) localStorage.setItem('access_token', access);
  else localStorage.removeItem('access_token');
  if (refresh) localStorage.setItem('refresh_token', refresh);
  else localStorage.removeItem('refresh_token');
}

type Query = Record<string, string | number | boolean | undefined | null>;

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: Query;
  body?: unknown;
  formData?: FormData;
  allowUnauthorized?: boolean;
}

let isRefreshing = false;
let refreshSubscribers: ((token: string | null) => void)[] = [];

function onRefreshed(token: string | null) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

async function refreshTokens(): Promise<string | null> {
  if (!refreshToken) return null;
  if (isRefreshing) {
    return new Promise((resolve) => {
      refreshSubscribers.push(resolve);
    });
  }

  isRefreshing = true;
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    
    if (!res.ok) throw new Error();
    const data = await res.json();
    setTokens(data.accessToken, data.refreshToken);
    onRefreshed(data.accessToken);
    return data.accessToken;
  } catch {
    setTokens(null, null);
    onRefreshed(null);
    return null;
  } finally {
    isRefreshing = false;
  }
}

export async function http<T = void>(path: string, opts: RequestOptions = {}, isRetry = false): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`, window.location.origin);
  Object.entries(opts.query ?? {}).forEach(([k, val]) => {
    if (val !== undefined && val !== null && val !== '') url.searchParams.set(k, String(val));
  });

  const method = opts.method ?? 'GET';
  const headers: Record<string, string> = { Accept: 'application/json' };
  
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

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
    if (!isRetry && refreshToken) {
      const newToken = await refreshTokens();
      if (newToken) return http<T>(path, opts, true);
    }
    
    if (opts.allowUnauthorized) return null as T;
    
    window.dispatchEvent(new Event('kj:unauthorized'));
    setTokens(null, null);
    throw new AppError('UNAUTHORIZED');
  }

  if (!res.ok) {
    let payload: { code?: string; fieldErrors?: Record<string, string> } = {};
    try {
      payload = await res.json();
    } catch {}
    
    throw new AppError(payload.code ??
      (res.status === 403 ? 'FORBIDDEN' : res.status === 404 ? 'NOT_FOUND' : res.status >= 500 ? 'NETWORK_ERROR' : 'UNKNOWN'), {
      fieldErrors: payload.fieldErrors,
      status: res.status,
    });
  }
  
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
