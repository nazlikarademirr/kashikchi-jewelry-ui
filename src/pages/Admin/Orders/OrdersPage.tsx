import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DeleteOrderModal } from '@/components/DeleteOrderModal';
import { OrderStatusBadge } from '@/components/product';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/State';
import { ORDER_STATUSES } from '@/constants';
import { ROUTES } from '@/constants/routes';
import { useI18n } from '@/contexts/I18nContext';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { services } from '@/services';
import type { Order, OrderStatus } from '@/types';
import { orderCode } from '@/utils/format';

export default function AdminOrdersPage() {
  const { t, price, date } = useI18n();
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);
  const orders = useAsync(() => services.orders.list(status ? { status } : undefined), [status]);
  useDocumentMeta({ title: t('admin.orders.title'), noindex: true });

  return (
    <>
      <div className="dash__head">
        <div>
          <h1>{t('admin.orders.title')}</h1>
          <p className="muted" style={{ margin: 0 }}>
            {t('admin.orders.subtitle')}
          </p>
        </div>

        <div className="dash__head-filter">
          <Select
            label={t('admin.orders.filter')}
            value={status}
            onChange={(e) => setStatus(e.target.value as OrderStatus | '')}
            reserveMessageSpace={false}
          >
            <option value="">{t('admin.orders.all')}</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`orderStatus.${s}`)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {orders.loading ? (
        <Skeleton style={{ height: 240 }} />
      ) : orders.error ? (
        <ErrorState error={orders.error} onRetry={orders.reload} />
      ) : !orders.data || orders.data.length === 0 ? (
        <EmptyState icon="package" title={t('admin.orders.emptyTitle')} />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">{t('admin.orders.colOrder')}</th>
                <th scope="col">{t('admin.orders.colCustomer')}</th>
                <th scope="col">{t('admin.orders.colDate')}</th>
                <th scope="col">{t('admin.orders.colTotal')}</th>
                <th scope="col">{t('admin.orders.colStatus')}</th>
                <th scope="col" style={{ textAlign: 'right' }}>
                  <span className="sr-only">{t('admin.orders.view')}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.data.map((o) => (
                <tr key={o.id}>
                  <td className="nowrap">
                    <strong>{orderCode(o.id)}</strong>
                  </td>
                  <td>
                    {o.customer.name} {o.customer.surname}
                  </td>
                  <td className="nowrap">{date(o.createdAt)}</td>
                  <td className="nowrap">{price(o.totalPrice)}</td>
                  <td>
                    <OrderStatusBadge status={o.status} />
                  </td>
                  <td className="nowrap" style={{ textAlign: 'right' }}>
                    <div className="row" style={{ justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                      <Link to={ROUTES.adminOrder(o.id)} className="btn btn--sm btn--ghost">
                        {t('admin.orders.view')}
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        style={{ color: 'var(--danger)' }}
                        onClick={() => setDeleteTarget(o)}
                      >
                        {t('deleteOrder.deleteBtn')}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DeleteOrderModal
        open={!!deleteTarget}
        orderId={deleteTarget?.id ?? null}
        orderNo={deleteTarget ? orderCode(deleteTarget.id) : undefined}
        onClose={() => setDeleteTarget(null)}
        onDeleted={() => {
          orders.reload();
        }}
      />
    </>
  );
}
