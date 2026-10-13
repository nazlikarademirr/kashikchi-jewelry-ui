import { Link } from 'react-router-dom';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/State';
import { Badge } from '@/components/ui/Misc';
import { ROUTES } from '@/constants/routes';
import { useI18n } from '@/contexts/I18nContext';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import type { TranslationKey } from '@/locales';
import { services } from '@/services';
import { orderCode } from '@/utils/format';

export default function DeletedOrdersPage() {
  const { t, price, date } = useI18n();
  const deletedOrders = useAsync(() => services.orders.listDeleted(), []);
  useDocumentMeta({ title: t('admin.deletedOrders.title'), noindex: true });

  const getReasonLabel = (reason: string | null | undefined, note?: string | null) => {
    if (!reason) return '—';
    const trKey = `deleteOrder.reasons.${reason}` as TranslationKey;
    const label = t(trKey);
    const resolved = label === trKey ? reason : label;
    if (reason === 'OTHER' && note) {
      return `${resolved}: ${note}`;
    }
    return note ? `${resolved} (${note})` : resolved;
  };

  return (
    <>
      <div className="dash__head">
        <div>
          <h1>{t('admin.deletedOrders.title')}</h1>
        </div>
      </div>

      {deletedOrders.loading ? (
        <Skeleton style={{ height: 240 }} />
      ) : deletedOrders.error ? (
        <ErrorState error={deletedOrders.error} onRetry={deletedOrders.reload} />
      ) : !deletedOrders.data || deletedOrders.data.length === 0 ? (
        <EmptyState icon="trash" title={t('admin.deletedOrders.emptyTitle')} description={t('admin.deletedOrders.emptyText')} />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">{t('admin.deletedOrders.colOrder')}</th>
                <th scope="col">{t('admin.deletedOrders.colCustomer')}</th>
                <th scope="col">{t('admin.deletedOrders.colOrderDate')}</th>
                <th scope="col">{t('admin.deletedOrders.colDeletedDate')}</th>
                <th scope="col">{t('admin.deletedOrders.colReason')}</th>
                <th scope="col">{t('admin.deletedOrders.colTotal')}</th>
                <th scope="col">
                  <span className="sr-only">{t('admin.deletedOrders.colActions')}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {deletedOrders.data.map((o) => (
                <tr key={o.id}>
                  <td className="nowrap">
                    <strong>{orderCode(o.id)}</strong>
                  </td>
                  <td>
                    <div>{o.customer.name} {o.customer.surname}</div>
                    <div className="muted" style={{ fontSize: '0.8rem' }}>{o.customer.email}</div>
                  </td>
                  <td className="nowrap">{date(o.createdAt, true)}</td>
                  <td className="nowrap">{o.deletedAt ? date(o.deletedAt, true) : '—'}</td>
                  <td>
                    <Badge kind="danger" dot>
                      {getReasonLabel(o.deletionReason, o.deletionNote)}
                    </Badge>
                  </td>
                  <td className="nowrap">{price(o.totalPrice)}</td>
                  <td className="nowrap" style={{ textAlign: 'right' }}>
                    <Link to={ROUTES.adminOrder(o.id)} className="btn btn--sm btn--ghost">
                      {t('admin.deletedOrders.view')}
                    </Link>
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
