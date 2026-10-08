import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { services } from '@/services';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { useI18n } from './I18nContext';
import { isAppError } from '@/types';

interface FavoritesValue {
  ids: ReadonlySet<string>;
  has: (productId: string) => boolean;
  toggle: (productId: string) => Promise<void>;
}

const FavoritesContext = createContext<FavoritesValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user, isCustomer } = useAuth();
  const { t, tError } = useI18n();
  const toast = useToast();
  const [ids, setIds] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    if (!isCustomer) {
      setIds(new Set());
      return;
    }
    let alive = true;
    services.favorites
      .listIds()
      .then((list) => alive && setIds(new Set(list)))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [isCustomer, user?.id]);

  const toggle = useCallback(
    async (productId: string) => {
      const wasFav = ids.has(productId);
      
      setIds((prev) => {
        const next = new Set(prev);
        if (wasFav) next.delete(productId);
        else next.add(productId);
        return next;
      });
      try {
        if (wasFav) await services.favorites.remove(productId);
        else await services.favorites.add(productId);
        toast.success(wasFav ? 'favorites.removed' : 'favorites.added');
      } catch (e) {
        setIds((prev) => {
          const next = new Set(prev);
          if (wasFav) next.add(productId);
          else next.delete(productId);
          return next;
        });
        toast.error(isAppError(e) ? tError(e.code) : t('errors.UNKNOWN'));
      }
    },
    [ids, toast, t, tError],
  );

  const value = useMemo<FavoritesValue>(() => ({ ids, has: (id) => ids.has(id), toggle }), [ids, toggle]);
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}
