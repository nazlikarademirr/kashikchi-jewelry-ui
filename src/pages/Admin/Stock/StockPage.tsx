import { useState } from 'react';
import { StockBadge } from '@/components/product';
import { Button, LinkButton } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/State';
import { ROUTES } from '@/constants/routes';
import { useI18n } from '@/contexts/I18nContext';
import { useToast } from '@/contexts/ToastContext';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { services } from '@/services';
import type { Product } from '@/types';
import { mediaUrl } from '@/utils/media';
import { v } from '@/utils/validation';

function StockRow({ product, onSaved }: { product: Product; onSaved: () => void }) {
  const { t, tDynamic, loc, errorMessage } = useI18n();
  const toast = useToast();
  const [value, setValue] = useState(String(product.stock));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const num = value.trim() === '' ? '' : Number(value);
  const invalid = v.nonNegativeInt(num);
  const dirty = Number(value) !== product.stock;

  const save = async () => {
    setError(null);
    if (invalid) {
      setError(tDynamic(invalid));
      return;
    }
    setBusy(true);
    try {
      await services.products.updateStock(product.id, Number(num));
      toast.success('admin.stock.updated');
      onSaved();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <tr>
      <td>
        <div className="row" style={{ flexWrap: 'nowrap' }}>
          {product.images[0] && <img className="table__thumb" src={mediaUrl(product.images[0].storageKey)} alt="" loading="lazy" />}
          <div>
            <strong>{loc(product.name)}</strong>
            <div className="muted" style={{ fontSize: '0.85rem' }}>
              {product.code}
            </div>
          </div>
        </div>
      </td>
      <td>
        <StockBadge stock={product.stock} />
      </td>
      <td>
        <form
          className="row"
          style={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <div style={{ width: 120 }}>
            <Input
              label={t('admin.stock.newStock')}
              type="number"
              min={0}
              max={999999}
              step={1}
              inputMode="numeric"
              value={value}
              error={error}
              onChange={(e) => setValue(e.target.value.slice(0, 6))}
            />
          </div>
          <Button type="submit" variant="secondary" loading={busy} disabled={!dirty} style={{ marginTop: 28 }}>
            {t('admin.stock.update')}
          </Button>
        </form>
      </td>
    </tr>
  );
}

export default function AdminStockPage() {
  const { t } = useI18n();
  const list = useAsync(() => services.products.list({ includeInactive: true, pageSize: 100, sort: 'newest' }), []);
  useDocumentMeta({ title: t('admin.stock.title'), noindex: true });

  return (
    <>
      <div className="dash__head">
        <div>
          <h1>{t('admin.stock.title')}</h1>
        </div>
      </div>
      {list.loading && !list.data ? (
        <Skeleton style={{ height: 280 }} />
      ) : list.error || !list.data ? (
        <ErrorState error={list.error} onRetry={list.reload} />
      ) : list.data.items.length === 0 ? (
        <EmptyState
          icon="gem"
          title={t('admin.stock.emptyTitle')}
          description={t('admin.stock.emptyText')}
          action={<LinkButton to={ROUTES.adminProductNew}>{t('admin.products.add')}</LinkButton>}
        />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">{t('admin.products.colProduct')}</th>
                <th scope="col">{t('admin.stock.colStock')}</th>
                <th scope="col">{t('admin.stock.newStock')}</th>
              </tr>
            </thead>
            <tbody>
              {list.data.items.map((p) => (
                <StockRow key={`${p.id}-${p.stock}`} product={p} onSaved={list.reload} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
