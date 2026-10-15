import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useToast } from './ToastContext';
import { services } from '@/services';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { useI18n } from './I18nContext';
import { AUTH_SESSION_KEY, SESSION_CHANGED, SESSION_EXPIRED, expireSession, readSession } from '@/services/api/authSession';
import type { LoginInput, RegisterInput, UpdateProfileInput, User } from '@/types';

interface AuthValue {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isCustomer: boolean;
  login: (input: LoginInput) => Promise<User>;
  googleComplete: (ticket: string, proof: string) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  updateProfile: (input: UpdateProfileInput) => Promise<User>;
  reloadUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    let generation = 0;
    let timer: number | undefined;
    const expired = () => {
      generation++;
      setUser(null);
      setLoading(false);
      toast.error(t('auth.sessionExpired'));
      navigate(ROUTES.login, { replace: true, state: { sessionExpired: true } });
    };
    const schedule = () => {
      window.clearTimeout(timer);
      const session = readSession();
      if (!session) { generation++; setUser(null); setLoading(false); return; }
      if (expireSession()) return;
      timer = window.setTimeout(() => expireSession(), Math.max(0, session.expiresAt - Date.now()));
    };
    const reload = () => {
      schedule();
      if (!readSession()) return;
      const current = ++generation;
      services.auth.me().then((u) => { if (alive && current === generation) setUser(u); })
        .catch(() => { if (alive && current === generation) setUser(null); })
        .finally(() => { if (alive && current === generation) setLoading(false); });
    };
    const onUnauthorized = () => { generation++; setUser(null); setLoading(false); };
    const onStorage = (e: StorageEvent) => {
      if (e.key !== AUTH_SESSION_KEY && e.key !== null) return;
      if (!e.newValue && e.oldValue && !readSession()) {
        try { if (JSON.parse(e.oldValue).expiresAt <= Date.now()) { expired(); return; } } catch { /* invalid old data */ }
      }
      reload();
    };
    const onResume = () => { if (document.visibilityState !== 'hidden') reload(); };
    window.addEventListener(SESSION_EXPIRED, expired);
    window.addEventListener(SESSION_CHANGED, schedule);
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', onResume);
    document.addEventListener('visibilitychange', onResume);
    window.addEventListener('kj:unauthorized', onUnauthorized);
    reload();
    return () => {
      alive = false;
      window.clearTimeout(timer);
      window.removeEventListener(SESSION_EXPIRED, expired);
      window.removeEventListener(SESSION_CHANGED, schedule);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', onResume);
      document.removeEventListener('visibilitychange', onResume);
      window.removeEventListener('kj:unauthorized', onUnauthorized);
    };
  }, [navigate, toast, t]);

  const login = useCallback(async (input: LoginInput) => {
    const u = await services.auth.login(input);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const u = await services.auth.register(input);
    setUser(u);
    return u;
  }, []);

  const googleComplete = useCallback(async (ticket: string, proof: string) => {
    const u = await services.auth.googleComplete(ticket, proof);
    setUser(u);
    return u;
  }, []);

  const updateProfile = useCallback(async (input: UpdateProfileInput) => {
    const u = await services.auth.updateProfile(input);
    if (!expireSession() && readSession()) setUser(u);
    return u;
  }, []);

  const reloadUser = useCallback(async () => {
    const updated = await services.auth.me();
    if (!expireSession() && readSession()) setUser(updated);
  }, []);

  const logout = useCallback(async () => {
    await services.auth.logout();
    setUser(null);
    toast.success('auth.loggedOut');
  }, [toast]);

  const value = useMemo<AuthValue>(
    () => ({
      user,
      loading,
      isAdmin: user?.role === 1,
      isCustomer: user?.role === 0,
      login,
      googleComplete,
      register,
      updateProfile,
      reloadUser,
      logout,
    }),
    [user, loading, login, googleComplete, register, updateProfile, reloadUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
