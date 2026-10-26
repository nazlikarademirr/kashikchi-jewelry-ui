import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import type { Product } from '@/types';
import { useI18n } from './I18nContext';
import { Button } from '@/components/ui/Button';
import { ProductCompareDrawer } from '@/components/ProductCompareDrawer';

interface ProductCompareValue {
  products: Product[];
  isSelected: (productId: string) => boolean;
  toggle: (product: Product) => void;
  remove: (productId: string) => void;
  clear: () => void;
  open: () => void;
}

const ProductCompareContext = createContext<ProductCompareValue | null>(null);

export function ProductCompareProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { t } = useI18n();
  const { pathname } = useLocation();
  const showCompare = /^\/(products|category)(\/|$)/.test(pathname);

  const toggle = useCallback((product: Product) => {
    setProducts((current) => {
      if (current.some((item) => item.id === product.id)) return current.filter((item) => item.id !== product.id);
      return current.length < 3 ? [...current, product] : current;
    });
  }, []);

  const remove = useCallback((productId: string) => {
    const next = products.filter((product) => product.id !== productId);
    setProducts(next);
    if (next.length < 2) setDrawerOpen(false);
  }, [products]);

  const clear = useCallback(() => {
    setProducts([]);
    setDrawerOpen(false);
  }, []);
  const open = useCallback(() => setDrawerOpen(true), []);

  useEffect(() => {
    if (!showCompare) setDrawerOpen(false);
  }, [showCompare]);

  const value = useMemo<ProductCompareValue>(() => ({
    products,
    isSelected: (productId) => products.some((product) => product.id === productId),
    toggle,
    remove,
    clear,
    open,
  }), [products, toggle, remove, clear, open]);

  return (
    <ProductCompareContext.Provider value={value}>
      {children}
      {showCompare && products.length > 0 && (
        <div className="compare-bar" role="status">
          <span>{t('listing.compareSelectionCount', { n: products.length })}</span>
          <div className="compare-bar__actions">
            <Button variant="ghost" size="sm" onClick={clear}>{t('listing.compareClear')}</Button>
            <Button size="sm" onClick={open} disabled={products.length < 2}>
              {t('listing.compareOpen', { n: products.length })}
            </Button>
          </div>
        </div>
      )}
      {showCompare && drawerOpen && products.length >= 2 && (
        <ProductCompareDrawer products={products} onClose={() => setDrawerOpen(false)} onRemove={remove} />
      )}
    </ProductCompareContext.Provider>
  );
}

export function useProductCompare(): ProductCompareValue {
  const context = useContext(ProductCompareContext);
  if (!context) throw new Error('useProductCompare must be used within ProductCompareProvider');
  return context;
}
