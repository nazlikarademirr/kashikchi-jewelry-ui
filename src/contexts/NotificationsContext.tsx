import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { services } from '@/services';
import { useAuth } from './AuthContext';

interface NotificationsValue {
  unreadCount: number;
  refresh: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsValue | null>(null);

const POLL_MS = 15_000;

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    try {
      setUnreadCount(await services.notifications.unreadCount());
    } catch {
          }
  }, [user]);

  useEffect(() => {
    refresh();
    if (!user) return;
    
    const timer = window.setInterval(refresh, POLL_MS);
    window.addEventListener('storage', refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('storage', refresh);
    };
  }, [user, refresh]);

  const value = useMemo(() => ({ unreadCount, refresh }), [unreadCount, refresh]);
  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotificationsBadge(): NotificationsValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotificationsBadge must be used within NotificationsProvider');
  return ctx;
}
