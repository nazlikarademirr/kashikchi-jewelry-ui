import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { services } from '@/services';
import { useAuth } from './AuthContext';

interface NotificationsValue {
  unreadCount: number;
  revision: number;
  refresh: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsValue | null>(null);

const POLL_MS = 15_000;

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [revision, setRevision] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    if (document.visibilityState === 'hidden') return;
    try {
      setUnreadCount(await services.notifications.unreadCount());
      // A message can update an existing unread notification without changing the count.
      setRevision((previous) => previous + 1);
    } catch {
      // Keep the last successful result if a background request fails.
    }
  }, [user]);

  useEffect(() => {
    refresh();
    if (!user) return;
    
    const timer = window.setInterval(refresh, POLL_MS);
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('storage', refresh);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [user, refresh]);

  const value = useMemo(() => ({ unreadCount, revision, refresh }), [unreadCount, revision, refresh]);
  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotificationsBadge(): NotificationsValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotificationsBadge must be used within NotificationsProvider');
  return ctx;
}
