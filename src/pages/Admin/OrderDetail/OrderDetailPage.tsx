import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DeleteOrderModal } from '@/components/DeleteOrderModal';
import { MessagePanel, OrderItemsList, OrderTimeline } from '@/components/order';
import { Button } from '@/components/ui/Button';
import { Breadcrumb } from '@/components/ui/Misc';
import { Alert, ErrorState, Skeleton } from '@/components/ui/State';
import { ROUTES } from '@/constants/routes';
import { useI18n } from '@/contexts/I18nContext';
import { useToast } from '@/contexts/ToastContext';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { services } from '@/services';
import type { OrderStatus } from '@/types';
import { orderCode } from '@/utils/format';

export default function AdminOrderDetailPage() {
  const { id = '' } = useParams();
  const { t, date, price, errorMessage } = useI18n();
  const toast = useToast();
  const order = useAsync(() => services.orders.get(id), [id]);
  const [status, setStatus] = useState<OrderStatus>('ORDER_RECEIVED');
  const [busy, setBusy] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const o = order.data;
  useDocumentMeta({ title: o ? t('orders.no', { no: orderCode(o.id) }) : t('admin.orders.title'), noindex: true });

  useEffect(() => {
    if (o) setStatus(o.status);
  }, [o]);

  if (order.loading && !o) return <Skeleton style={{ height: 320 }} />;
  if (order.error || !o) return <ErrorState error={order.error} onRetry={order.reload} />;

  const apply = async () => {
    setBusy(true);
    try {
      const updated = await services.orders.updateStatus(o.id, status);
      order.setData(updated);
      toast.success('admin.order.statusUpdated');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stack">
      <Breadcrumb
        items={[
          {
            label: o.isDeleted ? t('admin.deletedOrders.title') : t('admin.orders.title'),
            to: o.isDeleted ? ROUTES.adminDeletedOrders : ROUTES.adminOrders,
          },
          { label: t('orders.no', { no: orderCode(o.id) }) },
        ]}
      />

      <div className="dash__head order-detail__head">
        <div>
          <h1 className="order-detail__title">
            <span>{orderCode(o.id)}</span>
            <span className="order-detail__separator" aria-hidden="true" />
            <span className="order-detail__date muted">{date(o.createdAt, true)}</span>
          </h1>
        </div>
        <div className="row" style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
          {!o.isDeleted && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowDeleteModal(true)}
              >
                {t('admin.order.deleteOrderBtn')}
              </Button>
          )}
        </div>
      </div>

      <div className="split">
        <div className="stack">
          <div className="card">
            <h2 className="card__title">{t('orders.progress')}</h2>
            {o.isDeleted ? (
              <Alert kind="warning">
                <div>
                  {t('deleteOrder.deletedDate', {
                    date: o.deletedAt ? date(o.deletedAt, true) : '',
                  })}
                </div>
                <div style={{ marginTop: 4 }}>
                  <strong>{t('deleteOrder.deletedReasonLabel')}</strong>{' '}
                  {o.deletionReason
                    ? t(`deleteOrder.reasons.${o.deletionReason}` as Parameters<typeof t>[0])
                    : ''}.
                  {o.deletionNote ? ` - ${o.deletionNote}` : ''}
                </div>
              </Alert>
            ) : (
              <>
                <OrderTimeline
                  status={o.status}
                  interactive
                  targetStatus={status}
                  onSelectStatus={setStatus}
                  dates={{
                    ORDER_RECEIVED: o.createdAt,
                    IN_PRODUCTION: o.inProductionAt,
                    READY: o.readyAt,
                  }}
                />
                <div className="row" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
                  <Button onClick={() => void apply()} loading={busy} disabled={status === o.status}>
                    {t('admin.order.apply')}
                  </Button>
                </div>
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
          </div>
        </div>

        <div className="stack">
          <div className="card">
            <h2 className="card__title">{t('orders.customer')}</h2>
            <p style={{ margin: 0 }}>
              <strong>
                {o.customer.name} {o.customer.surname}
              </strong>
              {o.contactPhone && (
                <>
                  <br />
                  <a href={`tel:${o.contactPhone.replace(/\s/g, '')}`}>{o.contactPhone}</a>
                </>
              )}
              <br />
              <a href={`mailto:${o.customer.email}`}>{o.customer.email}</a>
            </p>
            <div style={{ marginTop: 16 }}>
              <span className="muted">{t('orders.customerNote')}</span>
              <div className="note-box">{o.customerNote || t('orders.noNote')}</div>
            </div>
            {o.deliveryAddress && (
              <div style={{ marginTop: 16 }}>
                <span className="muted">{t('address.deliveryAddress')}</span>
                <div className="note-box" style={{ marginTop: 4 }}>
                  <strong>{o.deliveryAddress.title}</strong>
                  <div>{o.deliveryAddress.fullAddress}</div>
                  <div className="muted" style={{ fontSize: '0.85rem', marginTop: 2 }}>
                    {o.deliveryAddress.district ? `${o.deliveryAddress.district} / ` : ''}{o.deliveryAddress.city} - {o.deliveryAddress.country}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="card">
            <h2 className="card__title">{t('admin.order.messagesTitle')}</h2>
            <MessagePanel orderId={o.id} />
          </div>
        </div>
      </div>

      <DeleteOrderModal
        open={showDeleteModal}
        orderId={o.id}
        orderNo={orderCode(o.id)}
        onClose={() => setShowDeleteModal(false)}
        onDeleted={() => {
          order.reload();
        }}
      />
    </div>
  );
}
