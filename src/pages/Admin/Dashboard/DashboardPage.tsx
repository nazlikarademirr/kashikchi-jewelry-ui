import { Link } from 'react-router-dom';
import { OrderStatusBadge } from '@/components/product';
import { ErrorState, Skeleton } from '@/components/ui/State';
import { ORDER_STATUSES } from '@/constants';
import { ROUTES } from '@/constants/routes';
import { useI18n } from '@/contexts/I18nContext';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { services } from '@/services';
import { shortId } from '@/utils/format';

export default function AdminDashboardPage() {
  const { t, price, date } = useI18n();
  const stats = useAsync(() => services.dashboard.getStats(), []);
  useDocumentMeta({ title: t('admin.dashboard.title'), noindex: true });
  const s = stats.data;

  return (
    <>
      <div className="dash__head">
        <div>
          <h1>{t('admin.dashboard.title')}</h1>
        </div>
      </div>

      {stats.loading ? (
        <Skeleton style={{ height: 220 }} />
      ) : stats.error || !s ? (
        <ErrorState error={stats.error} onRetry={stats.reload} />
      ) : (
        <>
          <div className="stat-grid">
            <Stat label={t('admin.dashboard.products')} value={s.totalProducts} />
            <Stat label={t('admin.dashboard.active')} value={s.activeProducts} />
            <Stat label={t('admin.dashboard.lowStock')} value={s.lowStockProducts} />
            <Stat label={t('admin.dashboard.madeToOrder')} value={s.madeToOrderProducts} />
            <Stat label={t('admin.dashboard.orders')} value={s.totalOrders} />
            <Stat label={t('admin.dashboard.revenue')} value={price(s.revenue)} />
          </div>

          <h2 style={{ fontSize: '1.5rem' }}>{t('admin.dashboard.byStatus')}</h2>
          <div className="stat-grid">
            {ORDER_STATUSES.map((st) => (
              <Stat key={st} label={t(`orderStatus.${st}`)} value={s.ordersByStatus[st] ?? 0} />
            ))}
          </div>

          <div className="dash__head">
            <h2 style={{ fontSize: '1.5rem', margin: 0 }}>{t('admin.dashboard.recent')}</h2>
            <Link to={ROUTES.adminOrders}>{t('account.viewAll')}</Link>
          </div>
          {s.recentOrders.length === 0 ? (
            <p className="muted">{t('admin.dashboard.noOrders')}</p>
          ) : (
            s.recentOrders.map((o) => (
              <Link key={o.id} to={ROUTES.adminOrder(o.id)} className="list-card">
                <span>
                  <strong>{t('orders.no', { no: shortId(o.id) })}</strong>
                  <br />
                  <span className="muted">
                    {o.customer.name} {o.customer.surname} · {date(o.createdAt)}
                  </span>
                </span>
                <OrderStatusBadge status={o.status} />
                <strong>{price(o.totalPrice)}</strong>
              </Link>
            ))
          )}
        </>
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="stat-card">
      <div className="stat-card__label">{label}</div>
      <div className="stat-card__value">{value}</div>
    </div>
  );
}
