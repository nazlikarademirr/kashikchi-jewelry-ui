export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export const AUTH_SESSION_KEY = 'kj:auth-session';
export const SESSION_CHANGED = 'kj:session-changed';
export const SESSION_EXPIRED = 'kj:session-expired';

export function readSession(): AuthSession | null {
  try {
    const value = JSON.parse(localStorage.getItem(AUTH_SESSION_KEY) ?? 'null') as AuthSession | null;
    return value && typeof value.accessToken === 'string' && value.accessToken.length > 0
      && typeof value.refreshToken === 'string' && value.refreshToken.length > 0
      && Number.isFinite(value.expiresAt) ? value : null;
  } catch { return null; }
}

export function saveSession(session: AuthSession | null) {
  if (session) localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(AUTH_SESSION_KEY);
  // Eski, süresi belirlenmemiş oturumları taşımayız.
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  window.dispatchEvent(new Event(SESSION_CHANGED));
}

export function expireSession(): boolean {
  const session = readSession();
  if (!session || session.expiresAt > Date.now()) return false;
  saveSession(null);
  window.dispatchEvent(new Event(SESSION_EXPIRED));
  return true;
}
