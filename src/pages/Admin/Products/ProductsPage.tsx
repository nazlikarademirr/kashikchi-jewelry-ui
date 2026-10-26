import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, LinkButton } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { ConfirmDialog } from '@/components/ui/Modal';
import { Badge, Pagination } from '@/components/ui/Misc';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/State';
import { ROUTES } from '@/constants/routes';
import { PRODUCT_PAGE_SIZE } from '@/constants';
import { useI18n } from '@/contexts/I18nContext';
import { useToast } from '@/contexts/ToastContext';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { services } from '@/services';
import type { Product } from '@/types';
import { finalPrice } from '@/utils/format';
import { mediaUrl } from '@/utils/media';

export default function AdminProductsPage() {
  const { t, loc, price, carat } = useI18n();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const list = useAsync(() => services.products.list({ includeInactive: true, page, pageSize: PRODUCT_PAGE_SIZE, sort: 'newest' }), [page]);
  const [target, setTarget] = useState<Product | null>(null);
  const [busy, setBusy] = useState(false);
  useDocumentMeta({ title: t('admin.products.title'), noindex: true });

  const toggle = async () => {
    if (!target) return;
    setBusy(true);
    try {
      const next = !target.isActive;
      await services.products.setActive(target.id, next);
      toast.success(next ? 'admin.products.activated' : 'admin.products.deactivated');
      setTarget(null);
      list.reload();
    } catch (e) {
      toast.error(t('errors.UNKNOWN'));
      void e;
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="dash__head">
        <div>
          <h1>{t('admin.products.title')}</h1>
          <p className="muted" style={{ margin: 0 }}>
            {t('admin.products.subtitle')}
          </p>
        </div>
        <LinkButton to={ROUTES.adminProductNew}>{t('admin.products.add')}</LinkButton>
      </div>

      {list.loading ? (
        <Skeleton style={{ height: 280 }} />
      ) : list.error ? (
        <ErrorState error={list.error} onRetry={list.reload} />
      ) : !list.data || list.data.items.length === 0 ? (
        <EmptyState
          icon="gem"
          title={t('admin.products.emptyTitle')}
          description={t('admin.products.emptyText')}
          action={<LinkButton to={ROUTES.adminProductNew}>{t('admin.products.add')}</LinkButton>}
        />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">{t('admin.products.colProduct')}</th>
                <th scope="col">{t('admin.products.colCode')}</th>
                <th scope="col">{t('admin.products.colPrice')}</th>
                <th scope="col">{t('admin.products.colStatus')}</th>
                <th scope="col" style={{ textAlign: 'right' }}>
                  <span className="sr-only">{t('admin.products.colActions')}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {list.data.items.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="row" style={{ flexWrap: 'nowrap' }}>
                      {p.images[0] && <img className="table__thumb" src={mediaUrl(p.images[0].storageKey)} alt="" loading="lazy" />}
                      <Link to={ROUTES.product(p.slug)}>
                        <strong>{loc(p.name, `product:${p.code}`)}{p.carat != null && p.carat > 0 ? ` · ${carat(p.carat)} ct` : null}</strong>
                      </Link>
                    </div>
                  </td>
                  <td className="nowrap">{p.code}</td>
                  <td className="nowrap">
                    {p.discount > 0 ? (
                      <>
                        {price(finalPrice(p))}{' '}
                        <span className="muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <span>(%{p.discount}</span><span style={{ display: 'inline-flex', alignItems: 'center' }}><Icon name="arrowDown" size={16} />)</span>
                        </span>
                      </>
                    ) : (
                      price(p.price)
                    )}
                  </td>
                  <td>
                    <Badge kind={p.isActive ? 'success' : 'default'} dot>
                      {p.isActive ? t('admin.products.active') : t('admin.products.inactive')}
                    </Badge>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="table__actions">
                      <LinkButton to={ROUTES.adminProductEdit(p.id)} variant="secondary" size="sm">
                        {t('admin.products.edit')}
                      </LinkButton>
                      <Button variant="ghost" size="sm" onClick={() => setTarget(p)}>
                        {p.isActive ? t('admin.products.deactivate') : t('admin.products.activate')}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!list.loading && !list.error && list.data && (
        <Pagination page={list.data.page} pageSize={list.data.pageSize} total={list.data.total} onChange={setPage} />
      )}

      <ConfirmDialog
        open={target !== null}
        danger={target?.isActive}
        loading={busy}
        title={target?.isActive ? t('admin.products.deactivateTitle') : t('admin.products.activateTitle')}
        message={
          target
            ? t(target.isActive ? 'admin.products.deactivateMessage' : 'admin.products.activateMessage', {
                name: loc(target.name, `product:${target.code}`),
              })
            : ''
        }
        confirmLabel={target?.isActive ? t('admin.products.deactivate') : t('admin.products.activate')}
        onCancel={() => setTarget(null)}
        onConfirm={() => void toggle()}
      />
    </>
  );
}
