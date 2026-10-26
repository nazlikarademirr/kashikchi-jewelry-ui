import { useMemo, useState } from 'react';
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

type SortColumn = 'customer' | 'date' | 'total';
type SortState = { column: SortColumn; direction: 'asc' | 'desc' } | null;

export default function AdminOrdersPage() {
  const { t, price, date } = useI18n();
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [sort, setSort] = useState<SortState>(null);
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);
  const orders = useAsync(() => services.orders.list(status ? { status } : undefined), [status]);
  const sortedOrders = useMemo(() => {
    if (!orders.data || !sort) return orders.data ?? [];
    const direction = sort.direction === 'asc' ? 1 : -1;
    return [...orders.data].sort((a, b) => {
      let result = 0;
      switch (sort.column) {
        case 'customer':
          result = `${a.customer.name} ${a.customer.surname}`.localeCompare(`${b.customer.name} ${b.customer.surname}`, undefined, { sensitivity: 'base' });
          break;
        case 'date':
          result = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'total':
          result = a.totalPrice - b.totalPrice;
          break;
      }
      return result * direction;
    });
  }, [orders.data, sort, t]);
  useDocumentMeta({ title: t('admin.orders.title'), noindex: true });

  const sortHeader = (column: SortColumn, label: string) => (
    <button
      type="button"
      className="admin-orders-sort"
      aria-label={label}
      onClick={() => setSort((current) => current?.column === column
        ? { column, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { column, direction: 'asc' })}
    >
      <span>{label}</span>
      <span className="admin-orders-sort__arrow" aria-hidden="true">
        {sort?.column === column ? (sort.direction === 'asc' ? '↑' : '↓') : '↕'}
      </span>
    </button>
  );

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
          <table className="table admin-orders-table">
            <colgroup>
              <col span={5} style={{ width: '16%' }} />
              <col style={{ width: '20%' }} />
            </colgroup>
            <thead>
              <tr>
                <th scope="col">{t('admin.orders.colOrder')}</th>
                <th scope="col" aria-sort={sort?.column === 'customer' ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>{sortHeader('customer', t('admin.orders.colCustomer'))}</th>
                <th scope="col" aria-sort={sort?.column === 'date' ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>{sortHeader('date', t('admin.orders.colDate'))}</th>
                <th scope="col" aria-sort={sort?.column === 'total' ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>{sortHeader('total', t('admin.orders.colTotal'))}</th>
                <th scope="col">{t('admin.orders.colStatus')}</th>
                <th scope="col" style={{ textAlign: 'right' }}>
                  <span className="sr-only">{t('admin.orders.view')}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedOrders.map((o) => (
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
                      <Link to={ROUTES.adminOrder(o.id)} className="btn btn--sm btn--secondary admin-order-action">
                        {t('admin.orders.view')}
                      </Link>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="admin-order-action admin-order-action--delete"
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
