import { useState } from 'react';
import { Link } from 'react-router-dom';
import { OrderStatusBadge } from '@/components/product';
import { Select } from '@/components/ui/Input';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/State';
import { ORDER_STATUSES } from '@/constants';
import { ROUTES } from '@/constants/routes';
import { useI18n } from '@/contexts/I18nContext';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { services } from '@/services';
import type { OrderStatus } from '@/types';
import { shortId } from '@/utils/format';

export default function AdminOrdersPage() {
  const { t, price, date } = useI18n();
  const [status, setStatus] = useState<OrderStatus | ''>('');
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
      </div>

      <div className="toolbar">
        <div className="toolbar__filters">
          <Select label={t('admin.orders.filter')} value={status} onChange={(e) => setStatus(e.target.value as OrderStatus | '')}>
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
                <th scope="col">
                  <span className="sr-only">{t('admin.orders.view')}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.data.map((o) => (
                <tr key={o.id}>
                  <td className="nowrap">
                    <strong>#{shortId(o.id)}</strong>
                  </td>
                  <td>
                    {o.customer.name} {o.customer.surname}
                  </td>
                  <td className="nowrap">{date(o.createdAt)}</td>
                  <td className="nowrap">{price(o.totalPrice)}</td>
                  <td>
                    <OrderStatusBadge status={o.status} />
                  </td>
                  <td>
                    <Link to={ROUTES.adminOrder(o.id)}>{t('admin.orders.view')}</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
