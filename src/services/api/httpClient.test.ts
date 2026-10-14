import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readSession, saveSession } from './authSession';
import { http } from './httpClient';

describe('session-aware HTTP requests', () => {
  const values = new Map<string, string>();
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
  beforeEach(() => {
    values.clear();
    const target = new EventTarget();
    vi.stubGlobal('window', Object.assign(target, { location: { origin: 'http://localhost' } }));
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    });
    vi.stubGlobal('navigator', { locks: { request: (_name: string, callback: () => unknown) => Promise.resolve().then(callback) } });
    saveSession({ accessToken: 'old', refreshToken: 'refresh', expiresAt });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('refreshes concurrent requests only once and adopts the renewed session deadline', async () => {
    const renewedDeadline = expiresAt + 6 * 24 * 60 * 60 * 1000;
    const fetchMock = vi.fn(async (url: URL | string, init: RequestInit) => {
      if (String(url).endsWith('/auth/refresh')) {
        return Response.json({ accessToken: 'new', refreshToken: 'rotated', sessionExpiresAt: new Date(renewedDeadline).toISOString() });
      }
      return (init.headers as Record<string, string>).Authorization === 'Bearer old'
        ? new Response(null, { status: 401 }) : Response.json({ ok: true });
    });
    vi.stubGlobal('fetch', fetchMock);
    expect(await Promise.all([http('/account'), http('/orders')])).toEqual([{ ok: true }, { ok: true }]);
    expect(fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/auth/refresh'))).toHaveLength(1);
    expect(readSession()?.expiresAt).toBe(renewedDeadline);
  });

  it('renews an expired access token even when browsing public products', async () => {
    const oldToken = `header.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 1 }))}.signature`;
    saveSession({ accessToken: oldToken, refreshToken: 'refresh', expiresAt });
    const fetchMock = vi.fn(async (url: URL | string, init: RequestInit) => {
      if (String(url).endsWith('/auth/refresh')) {
        return Response.json({ accessToken: 'new', refreshToken: 'rotated', sessionExpiresAt: new Date(expiresAt + 1000).toISOString() });
      }
      expect((init.headers as Record<string, string>).Authorization).toBe('Bearer new');
      return Response.json([]);
    });
    vi.stubGlobal('fetch', fetchMock);
    expect(await http('/products')).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(readSession()?.expiresAt).toBe(expiresAt + 1000);
  });

  it('does not resurrect a session logged out while refresh was pending', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: URL | string) => {
      if (String(url).endsWith('/auth/refresh')) {
        saveSession(null);
        return Response.json({ accessToken: 'late', refreshToken: 'late-refresh', sessionExpiresAt: new Date(expiresAt).toISOString() });
      }
      return new Response(null, { status: 401 });
    }));
    await expect(http('/account')).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    expect(readSession()).toBeNull();
  });

  it('keeps credentials on a transient refresh failure', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: URL | string) => new Response(null, { status: String(url).endsWith('/auth/refresh') ? 503 : 401 })));
    await expect(http('/account')).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
    expect(readSession()?.refreshToken).toBe('refresh');
  });

  it('does not refresh or clear an existing session when Google sign-in is rejected', async () => {
    const fetchMock = vi.fn(async () => Response.json({ code: 'GOOGLE_LOGIN_FAILED' }, { status: 401 }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(http('/auth/google', { method: 'POST', body: { credential: 'invalid' } }))
      .rejects.toMatchObject({ code: 'GOOGLE_LOGIN_FAILED' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(readSession()?.refreshToken).toBe('refresh');
  });
});
