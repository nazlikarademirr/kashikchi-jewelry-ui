import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { services } from '@/services';
import type { Category } from '@/types';

interface CategoriesValue {
  tree: Category[];
  loading: boolean;
  findTop: (slug: string) => Category | undefined;
  findSub: (top: string, sub: string) => Category | undefined;
  reload: () => Promise<void>;
}

const CategoriesContext = createContext<CategoriesValue | null>(null);

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const [tree, setTree] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const t = await services.categories.getTree();
      setTree(t);
    } catch {}
  }, []);

  useEffect(() => {
    let alive = true;
    services.categories
      .getTree()
      .then((t) => alive && setTree(t))
      .catch(() => undefined)
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const value = useMemo<CategoriesValue>(
    () => ({
      tree,
      loading,
      findTop: (id) => tree.find((c) => c.id === id),
      findSub: (top, sub) => tree.find((c) => c.id === top)?.children.find((c) => c.id === sub),
      reload,
    }),
    [tree, loading, reload],
  );
  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>;
}

export function useCategories(): CategoriesValue {
  const ctx = useContext(CategoriesContext);
  if (!ctx) throw new Error('useCategories must be used within CategoriesProvider');
  return ctx;
}
