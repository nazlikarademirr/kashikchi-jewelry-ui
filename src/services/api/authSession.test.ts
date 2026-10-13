import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { AUTH_SESSION_KEY, SESSION_EXPIRED, expireSession, readSession, saveSession } from './authSession';

describe('shared authentication session', () => {
  const values = new Map<string, string>();
  const target = new EventTarget();
  beforeEach(() => {
    values.clear();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    });
    vi.stubGlobal('window', target);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-13T10:00:00Z'));
  });
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

  it('keeps the same absolute deadline across token rotation and reloads', () => {
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    saveSession({ accessToken: 'first', refreshToken: 'first-refresh', expiresAt });
    vi.advanceTimersByTime(23 * 60 * 60 * 1000);
    saveSession({ accessToken: 'rotated', refreshToken: 'rotated-refresh', expiresAt });
    expect(readSession()?.expiresAt).toBe(expiresAt);
    expect(expireSession()).toBe(false);
    vi.advanceTimersByTime(60 * 60 * 1000);
    const expired = vi.fn();
    target.addEventListener(SESSION_EXPIRED, expired);
    expect(expireSession()).toBe(true);
    expect(readSession()).toBeNull();
    expect(expireSession()).toBe(false);
    expect(expired).toHaveBeenCalledTimes(1);
    target.removeEventListener(SESSION_EXPIRED, expired);
  });

  it('reads shared storage changes instead of retaining stale credentials', () => {
    saveSession({ accessToken: 'first', refreshToken: 'refresh', expiresAt: Date.now() + 1000 });
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ accessToken: 'another-tab', refreshToken: 'new-refresh', expiresAt: Date.now() + 2000 }));
    expect(readSession()?.accessToken).toBe('another-tab');
    localStorage.removeItem(AUTH_SESSION_KEY);
    expect(readSession()).toBeNull();
  });

  it('does not reuse old credentials with no session deadline or malformed sessions', () => {
    localStorage.setItem('access_token', 'old');
    localStorage.setItem('refresh_token', 'old-refresh');
    expect(readSession()).toBeNull();
    localStorage.setItem(AUTH_SESSION_KEY, '{broken');
    expect(readSession()).toBeNull();
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ accessToken: 'a', refreshToken: 'r' }));
    expect(readSession()).toBeNull();
    saveSession(null);
    expect(localStorage.getItem('access_token')).toBeNull();
  });
});
