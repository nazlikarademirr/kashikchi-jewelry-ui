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

  it('refreshes concurrent requests only once and preserves the session deadline', async () => {
    const fetchMock = vi.fn(async (url: URL | string, init: RequestInit) => {
      if (String(url).endsWith('/auth/refresh')) {
        return Response.json({ accessToken: 'new', refreshToken: 'rotated', sessionExpiresAt: new Date(expiresAt).toISOString() });
      }
      return (init.headers as Record<string, string>).Authorization === 'Bearer old'
        ? new Response(null, { status: 401 }) : Response.json({ ok: true });
    });
    vi.stubGlobal('fetch', fetchMock);
    expect(await Promise.all([http('/account'), http('/orders')])).toEqual([{ ok: true }, { ok: true }]);
    expect(fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/auth/refresh'))).toHaveLength(1);
    expect(readSession()?.expiresAt).toBe(expiresAt);
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
});
