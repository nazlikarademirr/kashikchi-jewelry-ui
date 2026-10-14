import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { apiServices } from './apiServices';
import { readSession } from './authSession';

beforeEach(() => {
  const session = new Map<string, string>();
  const local = new Map<string, string>();
  const storage = (values: Map<string, string>) => ({
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  });
  vi.stubGlobal('sessionStorage', storage(session));
  vi.stubGlobal('localStorage', storage(local));
  vi.stubGlobal('window', Object.assign(new EventTarget(), { location: { origin: 'http://localhost', assign: vi.fn() } }));
});
afterEach(() => vi.unstubAllGlobals());

it('keeps the login proof in this tab and sends only its hash in the redirect', async () => {
  await apiServices.auth.googleStart();
  const proof = sessionStorage.getItem('kj:google-proof')!;
  const url = new URL(vi.mocked(window.location.assign).mock.calls[0][0] as string);
  expect(proof).toHaveLength(43);
  expect(url.pathname).toBe('/api/auth/google/start');
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(proof)));
  const expected = btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  expect(url.searchParams.get('proofChallenge')).toBe(expected);
  expect(url.toString()).not.toContain(proof);
});

it('uses the completion response to establish the normal application session', async () => {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const user = { id: 'google-user' };
  const fetchMock = vi.fn(async (url: URL | string) => {
    expect(String(url)).toContain('/auth/google/complete');
    return Response.json({ user, accessToken: 'access', refreshToken: 'refresh', sessionExpiresAt: expiresAt });
  });
  vi.stubGlobal('fetch', fetchMock);
  expect(await apiServices.auth.googleComplete('ticket', 'proof')).toEqual(user);
  expect(String(fetchMock.mock.calls[0][0])).toContain('/auth/google/complete');
  expect(readSession()).toEqual({ accessToken: 'access', refreshToken: 'refresh', expiresAt: Date.parse(expiresAt) });
});
