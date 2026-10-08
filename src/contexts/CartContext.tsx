import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { services } from '@/services';
import { useAuth } from './AuthContext';
import { finalPrice } from '@/utils/format';
import type { AddToCartInput, CartItem } from '@/types';

interface CartValue {
  items: CartItem[];
  loading: boolean;
  count: number;
  total: number;
  add: (input: AddToCartInput) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  updateNote: (itemId: string, note: string) => Promise<void>;
  remove: (itemId: string) => Promise<void>;
  refresh: () => Promise<void>;
  reset: () => void;
}

const CartContext = createContext<CartValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, isCustomer } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isCustomer) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      setItems(await services.cart.get());
    } finally {
      setLoading(false);
    }
  }, [isCustomer]);

  useEffect(() => {
    refresh().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCustomer, user?.id]);

  const add = useCallback(async (input: AddToCartInput) => setItems(await services.cart.add(input)), []);
  const updateQuantity = useCallback(
    async (id: string, q: number) => setItems(await services.cart.updateQuantity(id, q)),
    [],
  );
  const updateNote = useCallback(async (id: string, n: string) => setItems(await services.cart.updateNote(id, n)), []);
  const remove = useCallback(async (id: string) => setItems(await services.cart.remove(id)), []);
  const reset = useCallback(() => setItems([]), []);

  const value = useMemo<CartValue>(
    () => ({
      items,
      loading,
      count: items.reduce((s, i) => s + i.quantity, 0),
      total: items.reduce((s, i) => s + finalPrice(i.product) * i.quantity, 0),
      add,
      updateQuantity,
      updateNote,
      remove,
      refresh,
      reset,
    }),
    [items, loading, add, updateQuantity, updateNote, remove, refresh, reset],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
