import { Link } from 'react-router-dom';
import { OrderStatusBadge } from '@/components/product';
import { LinkButton } from '@/components/ui/Button';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/State';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useI18n } from '@/contexts/I18nContext';
import { useNotificationsBadge } from '@/contexts/NotificationsContext';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { services } from '@/services';
import { shortId } from '@/utils/format';

export default function AccountHome() {
  const { t, date, price } = useI18n();
  const { user, isAdmin } = useAuth();
  const { ids } = useFavorites();
  const { unreadCount } = useNotificationsBadge();
  const orders = useAsync(() => services.orders.list(), []);
  useDocumentMeta({ title: t('account.metaTitle'), noindex: true });

  return (
    <>
      <div className="dash__head">
        <h1>{t('account.hello', { name: user?.name ?? '' })}</h1>
        {isAdmin && <LinkButton to={ROUTES.admin}>{t('account.adminPanel')}</LinkButton>}
      </div>
      <p className="muted">{t('account.helloText')}</p>

      <div className="stat-grid" style={{ marginTop: 24 }}>
        <div className="stat-card">
          <div className="stat-card__label">{t('account.statOrders')}</div>
          <div className="stat-card__value">{orders.data?.length ?? '–'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">{t('account.statUnread')}</div>
          <div className="stat-card__value">{unreadCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">{t('account.statFavorites')}</div>
          <div className="stat-card__value">{ids.size}</div>
        </div>
      </div>

      <div className="dash__head">
        <h2 style={{ fontSize: '1.6rem', margin: 0 }}>{t('account.recentOrders')}</h2>
        <Link to={ROUTES.accountOrders}>{t('account.viewAll')}</Link>
      </div>

      {orders.loading ? (
        <Skeleton style={{ height: 76 }} />
      ) : orders.error ? (
        <ErrorState error={orders.error} onRetry={orders.reload} />
      ) : orders.data && orders.data.length > 0 ? (
        orders.data.slice(0, 3).map((o) => (
          <Link key={o.id} to={ROUTES.accountOrder(o.id)} className="list-card">
            <span>
              <strong>{t('orders.no', { no: shortId(o.id) })}</strong>
              <br />
              <span className="muted">{date(o.createdAt)}</span>
            </span>
            <OrderStatusBadge status={o.status} />
            <strong>{price(o.totalPrice)}</strong>
          </Link>
        ))
      ) : (
        <EmptyState
          icon="package"
          title={t('orders.emptyTitle')}
          description={t('account.noOrders')}
          action={<LinkButton to={ROUTES.products}>{t('orders.browse')}</LinkButton>}
        />
      )}
    </>
  );
}
