import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MessagePanel, OrderItemsList, OrderTimeline } from '@/components/order';
import { OrderStatusBadge } from '@/components/product';
import { Button, LinkButton } from '@/components/ui/Button';
import { Breadcrumb } from '@/components/ui/Misc';
import { ErrorState, Skeleton } from '@/components/ui/State';
import { ROUTES } from '@/constants/routes';
import { useI18n } from '@/contexts/I18nContext';
import { useToast } from '@/contexts/ToastContext';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { services } from '@/services';
import type { OrderStatus } from '@/types';
import { shortId } from '@/utils/format';

export default function AdminOrderDetailPage() {
  const { id = '' } = useParams();
  const { t, date, price, errorMessage } = useI18n();
  const toast = useToast();
  const order = useAsync(() => services.orders.get(id), [id]);
  const [status, setStatus] = useState<OrderStatus>('ORDER_RECEIVED');
  const [busy, setBusy] = useState(false);
  const o = order.data;
  useDocumentMeta({ title: o ? t('orders.no', { no: shortId(o.id) }) : t('admin.orders.title'), noindex: true });

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
          { label: t('admin.orders.title'), to: ROUTES.adminOrders },
          { label: t('orders.no', { no: shortId(o.id) }) },
        ]}
      />
      <div className="dash__head">
        <div>
          <h1>{t('orders.no', { no: shortId(o.id) })}</h1>
          <p className="muted" style={{ margin: 0 }}>
            {t('orders.date')}: {date(o.createdAt, true)}
          </p>
        </div>
        <OrderStatusBadge status={o.status} />
      </div>

      <div className="split">
        <div className="stack">
          <div className="card">
            <h2 className="card__title">{t('orders.progress')}</h2>
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
          </div>
          <div className="card">
            <h2 className="card__title">{t('admin.order.messagesTitle')}</h2>
            <MessagePanel orderId={o.id} />
          </div>
        </div>
      </div>

      <div>
        <LinkButton to={ROUTES.adminOrders} variant="ghost">
          {t('orders.backToOrders')}
        </LinkButton>
      </div>
    </div>
  );
}
