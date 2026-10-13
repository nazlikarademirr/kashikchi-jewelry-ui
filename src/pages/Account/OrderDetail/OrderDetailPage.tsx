import { useLocation, useParams } from 'react-router-dom';
import { MessagePanel, OrderItemsList, OrderTimeline } from '@/components/order';
import { OrderStatusBadge } from '@/components/product';
import { LinkButton } from '@/components/ui/Button';
import { Badge, Breadcrumb } from '@/components/ui/Misc';
import { Alert, ErrorState, Skeleton } from '@/components/ui/State';
import { ROUTES } from '@/constants/routes';
import { useI18n } from '@/contexts/I18nContext';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { services } from '@/services';
import { orderCode } from '@/utils/format';

export default function AccountOrderDetailPage() {
  const { id = '' } = useParams();
  const location = useLocation();
  const justCreated = (location.state as { justCreated?: boolean } | null)?.justCreated;
  const { t, date, price } = useI18n();
  const order = useAsync(() => services.orders.get(id), [id]);
  const o = order.data;
  useDocumentMeta({ title: o ? t('orders.no', { no: orderCode(o.id) }) : t('orders.title'), noindex: true });

  if (order.loading) return <Skeleton style={{ height: 320 }} />;
  if (order.error || !o) {
    return <ErrorState error={order.error} onRetry={order.reload} />;
  }

  return (
    <div className="stack">
      <Breadcrumb
        items={[
          { label: t('orders.title'), to: ROUTES.accountOrders },
          { label: t('orders.no', { no: orderCode(o.id) }) },
        ]}
      />
      {justCreated && (
        <Alert kind="success">
          {t('checkout.orderCreatedBanner')}
        </Alert>
      )}
      {o.isDeleted && (
        <Alert kind="warning">
          <strong>{t('orders.cancelledNotice')}</strong>
        </Alert>
      )}
      <div className="dash__head order-detail__head">
        <div>
          <h1 className="order-detail__title">
            <span>{orderCode(o.id)}</span>
            <span className="order-detail__date muted">- {date(o.createdAt, true)}</span>
          </h1>
        </div>
        {o.isDeleted ? (
          <Badge kind="danger" dot>{t('orderStatus.CANCELLED')}</Badge>
        ) : (
          <OrderStatusBadge status={o.status} />
        )}
      </div>

      <div className="card">
        <h2 className="card__title">{t('orders.progress')}</h2>
        {o.isDeleted ? (
          <p style={{ margin: 0, color: 'var(--danger)' }}>{t('orders.cancelledNotice')}</p>
        ) : (
          <>
            <OrderTimeline status={o.status} />
            <p style={{ margin: 0 }}>{t(`orders.statusText.${o.status}`)}</p>
          </>
        )}
      </div>

      <div className="card">
        <h2 className="card__title">{t('orders.items')}</h2>
        <OrderItemsList order={o} />
        <div className="summary__row summary__total" style={{ marginTop: 16 }}>
          <span>{t('orders.total')}</span>
          <span>{price(o.totalPrice)}</span>
        </div>
        {o.customerNote && (
          <div style={{ marginTop: 16 }}>
            <span className="muted">{t('orders.customerNote')}</span>
            <div className="note-box">{o.customerNote}</div>
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="card__title">{t('orders.messagesTitle')}</h2>
        <MessagePanel orderId={o.id} />
      </div>

      <div>
        <LinkButton to={ROUTES.accountOrders} variant="ghost">
          {t('orders.backToOrders')}
        </LinkButton>
      </div>
    </div>
  );
}
