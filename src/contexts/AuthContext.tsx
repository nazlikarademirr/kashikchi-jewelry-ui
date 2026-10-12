import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useToast } from './ToastContext';
import { services } from '@/services';
import type { LoginInput, RegisterInput, UpdateProfileInput, User } from '@/types';

interface AuthValue {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isCustomer: boolean;
  login: (input: LoginInput) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  updateProfile: (input: UpdateProfileInput) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    services.auth
      .me()
      .then((u) => alive && setUser(u))
      .catch(() => alive && setUser(null))
      .finally(() => alive && setLoading(false));
    
    const onUnauthorized = () => setUser(null);
    window.addEventListener('kj:unauthorized', onUnauthorized);
    return () => {
      alive = false;
      window.removeEventListener('kj:unauthorized', onUnauthorized);
    };
  }, []);

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

  const updateProfile = useCallback(async (input: UpdateProfileInput) => {
    const u = await services.auth.updateProfile(input);
    setUser(u);
    return u;
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
      register,
      updateProfile,
      logout,
    }),
    [user, loading, login, register, updateProfile, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
