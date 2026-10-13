import { Link } from 'react-router-dom';
import { OrderStatusBadge } from '@/components/product';
import { LinkButton } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Misc';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/State';
import { ROUTES } from '@/constants/routes';
import { useI18n } from '@/contexts/I18nContext';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { services } from '@/services';
import { orderCode } from '@/utils/format';

export default function AccountOrdersPage() {
  const { t, date, price } = useI18n();
  const orders = useAsync(() => services.orders.list(), []);
  useDocumentMeta({ title: t('orders.title'), noindex: true });

  return (
    <>
      <div className="dash__head">
        <div>
          <h1>{t('orders.title')}</h1>
          <p className="muted" style={{ margin: 0 }}>
            {t('orders.subtitle')}
          </p>
        </div>
      </div>
      {orders.loading ? (
        <div className="stack">
          <Skeleton style={{ height: 76 }} />
          <Skeleton style={{ height: 76 }} />
        </div>
      ) : orders.error ? (
        <ErrorState error={orders.error} onRetry={orders.reload} />
      ) : orders.data && orders.data.length > 0 ? (
        orders.data.map((o) => (
          <Link key={o.id} to={ROUTES.accountOrder(o.id)} className="list-card">
            <span>
              <strong>{t('orders.no', { no: orderCode(o.id) })}</strong>
              <br />
              <span className="muted">
                {date(o.createdAt)} · {o.items.length}
              </span>
              {o.isDeleted && (
                <span style={{ display: 'block', marginTop: 4, color: 'var(--danger)', fontSize: '0.85rem' }}>
                  {t('orders.cancelledNotice')}
                </span>
              )}
            </span>
            {o.isDeleted ? (
              <Badge kind="danger" dot>{t('orderStatus.CANCELLED')}</Badge>
            ) : (
              <OrderStatusBadge status={o.status} />
            )}
            <strong>{price(o.totalPrice)}</strong>
          </Link>
        ))
      ) : (
        <EmptyState
          icon="package"
          title={t('orders.emptyTitle')}
          action={<LinkButton to={ROUTES.products}>{t('orders.browse')}</LinkButton>}
        />
      )}
    </>
  );
}
