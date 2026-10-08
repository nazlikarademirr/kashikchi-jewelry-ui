import { useSearchParams } from 'react-router-dom';
import { PRODUCT_PAGE_SIZE } from '@/constants';
import { useI18n } from '@/contexts/I18nContext';
import { useDebounce } from '@/hooks/useDebounce';
import { useAsync } from '@/hooks/useAsync';
import { services } from '@/services';
import type { ProductSort } from '@/types';
import { useEffect, useState } from 'react';
import { ProductGrid } from './product';
import { Input, Select } from './ui/Input';
import { Pagination } from './ui/Misc';
import { EmptyState, ErrorState, ProductGridSkeleton } from './ui/State';

const SORTS: ProductSort[] = ['newest', 'priceAsc', 'priceDesc', 'caratDesc'];

export function ProductListing({ category, subCategory }: { category?: string; subCategory?: string }) {
  const { t } = useI18n();
  const [params, setParams] = useSearchParams();
  const sort = (SORTS as string[]).includes(params.get('sort') ?? '') ? (params.get('sort') as ProductSort) : 'newest';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const q = params.get('q') ?? '';

  const [search, setSearch] = useState(q);
  const debounced = useDebounce(search, 350);
  useEffect(() => setSearch(q), [q]);
  useEffect(() => {
    if (debounced !== q) {
      const next = new URLSearchParams(params);
      if (debounced) next.set('q', debounced);
      else next.delete('q');
      next.delete('page');
      setParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const { data, error, loading, reload } = useAsync(
    () => services.products.list({ category, subCategory, search: q, sort, page, pageSize: PRODUCT_PAGE_SIZE }),
    [category, subCategory, q, sort, page],
  );

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next);
  };

  return (
    <>
      <div className="toolbar">
        <div className="toolbar__filters">
          <Input
            label={t('listing.search')}
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('listing.searchPlaceholder')}
            maxLength={80}
            autoComplete="off"
          />
          <Select label={t('listing.sort')} value={sort} onChange={(e) => update('sort', e.target.value === 'newest' ? '' : e.target.value)}>
            {SORTS.map((s) => (
              <option key={s} value={s}>
                {t(`listing.sorts.${s}`)}
              </option>
            ))}
          </Select>
        </div>
        {data && (
          <p className="muted" aria-live="polite" style={{ margin: 0 }}>
            {t('listing.resultCount', { n: data.total })}
          </p>
        )}
      </div>

      {loading && !data ? (
        <ProductGridSkeleton count={PRODUCT_PAGE_SIZE} />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : data && data.items.length === 0 ? (
        <EmptyState icon="search" title={t('listing.emptyTitle')} description={t('listing.emptyText')} />
      ) : data ? (
        <div style={{ opacity: loading ? 0.6 : 1, transition: 'opacity .2s' }}>
          <ProductGrid products={data.items} />
          <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onChange={(p) => update('page', String(p))} />
        </div>
      ) : null}
    </>
  );
}
