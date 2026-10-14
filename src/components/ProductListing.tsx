import { useSearchParams } from 'react-router-dom';
import { INPUT_LIMITS, PRODUCT_PAGE_SIZE } from '@/constants';
import { useI18n } from '@/contexts/I18nContext';
import { useDebounce } from '@/hooks/useDebounce';
import { useAsync } from '@/hooks/useAsync';
import { services } from '@/services';
import type { ProductSort } from '@/types';
import { useEffect, useLayoutEffect, useRef, useState, type ChangeEvent } from 'react';
import { ProductGrid } from './product';
import { Input, Select } from './ui/Input';
import { Pagination } from './ui/Misc';
import { EmptyState, ErrorState, ProductGridSkeleton } from './ui/State';
import { formatPriceRange, parsePriceRangeNumber, parseRangeNumber } from '@/utils/productRange';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { MultiComboBox } from './ui/MultiComboBox';
import { useCategories } from '@/contexts/CategoriesContext';

const SORTS: ProductSort[] = ['newest', 'priceAsc', 'priceDesc', 'caratAsc', 'caratDesc'];

export function ProductListing({ category, subCategory, categoryFilter = false }: { category?: string; subCategory?: string; categoryFilter?: boolean }) {
  const { t, loc } = useI18n();
  const { tree, loading: categoriesLoading } = useCategories();
  const [params, setParams] = useSearchParams();
  const paramsRef = useRef(params);
  useLayoutEffect(() => { paramsRef.current = params; }, [params]);
  const sort = (SORTS as string[]).includes(params.get('sort') ?? '') ? (params.get('sort') as ProductSort) : 'newest';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const q = params.get('q') ?? '';
  const selectedCategories = categoryFilter ? [...new Set(params.getAll('categories'))] : [];
  const categoryKey = selectedCategories.join(',');
  const minPriceText = params.get('minPrice') ?? '';
  const maxPriceText = params.get('maxPrice') ?? '';
  const minCaratText = (params.get('minCarat') ?? '').replace('.', ',');
  const maxCaratText = (params.get('maxCarat') ?? '').replace('.', ',');
  const minPrice = parsePriceRangeNumber(useDebounce(minPriceText, 350));
  const maxPrice = parsePriceRangeNumber(useDebounce(maxPriceText, 350));
  const minCarat = parseRangeNumber(useDebounce(minCaratText, 350));
  const maxCarat = parseRangeNumber(useDebounce(maxCaratText, 350));
  const priceInvalid = minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice;
  const caratInvalid = minCarat !== undefined && maxCarat !== undefined && minCarat > maxCarat;
  const invalidRange = priceInvalid || caratInvalid;

  const [search, setSearch] = useState(q);
  const debounced = useDebounce(search, 350);
  useEffect(() => setSearch(q), [q]);
  useEffect(() => {
    if (debounced !== q) {
      const next = new URLSearchParams(paramsRef.current);
      if (debounced) next.set('q', debounced);
      else next.delete('q');
      next.delete('page');
      paramsRef.current = next;
      setParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const { data, error, loading, reload } = useAsync(
    () => invalidRange
      ? Promise.resolve({ items: [], total: 0, page: 1, pageSize: PRODUCT_PAGE_SIZE })
      : services.products.list({ category, subCategory, categories: selectedCategories, search: q, sort, page, pageSize: PRODUCT_PAGE_SIZE, minPrice, maxPrice, minCarat, maxCarat }),
    [category, subCategory, categoryKey, q, sort, page, minPrice, maxPrice, minCarat, maxCarat, invalidRange],
  );

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(paramsRef.current);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    paramsRef.current = next;
    setParams(next, { replace: key.startsWith('min') || key.startsWith('max') });
  };

  const updateRange = (key: string, value: string) => {
    if (/^\d*(?:,\d{0,3})?$/.test(value) && value.length <= INPUT_LIMITS.carat) update(key, value.startsWith(',') ? `0${value}` : value);
  };

  const updatePriceRange = (key: string, event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    if (!/^[\d.]*$/.test(input.value)) return;
    const raw = input.value.replace(/\./g, '');
    if (raw.length > 15) return;
    const digitsBeforeCursor = input.value.slice(0, input.selectionStart ?? input.value.length).replace(/\./g, '').length;
    const formatted = formatPriceRange(raw);
    update(key, raw);
    requestAnimationFrame(() => {
      let cursor = 0;
      let digits = 0;
      while (cursor < formatted.length && digits < digitsBeforeCursor) {
        if (/\d/.test(formatted[cursor])) digits++;
        cursor++;
      }
      if (document.activeElement === input) input.setSelectionRange(cursor, cursor);
    });
  };

  const updateCategories = (values: string[]) => {
    const next = new URLSearchParams(paramsRef.current);
    next.delete('categories');
    values.forEach(value => next.append('categories', value));
    next.delete('page');
    paramsRef.current = next;
    setParams(next);
  };
  const hasFilters = Boolean(selectedCategories.length || search || sort !== 'newest' || minPriceText || maxPriceText || minCaratText || maxCaratText);
  const clearFilters = () => {
    const next = new URLSearchParams(paramsRef.current);
    for (const key of ['q', 'sort', 'categories', 'minPrice', 'maxPrice', 'minCarat', 'maxCarat', 'page']) next.delete(key);
    paramsRef.current = next;
    setSearch('');
    setParams(next);
  };

  return (
    <>
      <div className={`toolbar catalog-toolbar${categoryFilter ? ' catalog-toolbar--categories' : ''}`}>
        <div className="toolbar__filters">
          <Input
            label={t('listing.search')}
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('listing.searchPlaceholder')}
            maxLength={INPUT_LIMITS.search}
            autoComplete="off"
          />
          {categoryFilter && <MultiComboBox label={t('listing.categories')} placeholder={t('listing.categoriesPlaceholder')}
            emptyText={t('listing.categoriesEmpty')} disabled={categoriesLoading}
            options={tree.flatMap(item => [
              { value: item.id, label: loc(item.name), depth: 0 },
              ...item.children.map(child => ({ value: child.id, label: loc(child.name), depth: 1 })),
            ])}
            value={selectedCategories} onChange={updateCategories} />}
          <Select label={t('listing.sort')} value={sort} onChange={(e) => update('sort', e.target.value === 'newest' ? '' : e.target.value)}>
            {SORTS.map((s) => (
              <option key={s} value={s}>
                {t(`listing.sorts.${s}`)}
              </option>
            ))}
          </Select>
          <fieldset className="toolbar__range" aria-invalid={priceInvalid}>
            <legend className="field__label">{t('listing.priceRange')}</legend>
            <div className="toolbar__range-inputs">
              <Input label={t('listing.minPrice')} placeholder={t('listing.min')} inputMode="numeric" value={formatPriceRange(minPriceText)} onChange={(e) => updatePriceRange('minPrice', e)} reserveMessageSpace={false} autoComplete="off" />
              <span className="toolbar__range-separator" aria-hidden="true">–</span>
              <Input label={t('listing.maxPrice')} placeholder={t('listing.max')} inputMode="numeric" value={formatPriceRange(maxPriceText)} onChange={(e) => updatePriceRange('maxPrice', e)} reserveMessageSpace={false} autoComplete="off" />
            </div>
          </fieldset>
          <fieldset className="toolbar__range" aria-invalid={caratInvalid}>
            <legend className="field__label">{t('listing.caratRange')}</legend>
            <div className="toolbar__range-inputs">
              <Input label={t('listing.minCarat')} placeholder={t('listing.min')} inputMode="decimal" value={minCaratText} onChange={(e) => updateRange('minCarat', e.target.value)} reserveMessageSpace={false} autoComplete="off" />
              <span className="toolbar__range-separator" aria-hidden="true">–</span>
              <Input label={t('listing.maxCarat')} placeholder={t('listing.max')} inputMode="decimal" value={maxCaratText} onChange={(e) => updateRange('maxCarat', e.target.value)} reserveMessageSpace={false} autoComplete="off" />
            </div>
          </fieldset>
        </div>
        <div className="catalog-toolbar__meta">
          <Button variant="ghost" size="sm" onClick={clearFilters} disabled={!hasFilters} aria-label={t('listing.clearFilters')} title={t('listing.clearFilters')}>
            <Icon name="trash" size={20} />
          </Button>
          <p className="catalog-toolbar__count" aria-live="polite">{data && t('listing.resultCount', { n: data.total })}</p>
        </div>
      </div>

      {invalidRange && <p className="field__error" role="alert">{t('listing.invalidRange')}</p>}

      {invalidRange ? null : loading && !data ? (
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
