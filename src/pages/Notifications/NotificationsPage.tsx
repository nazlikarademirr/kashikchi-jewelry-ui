import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/State';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useNotificationsBadge } from '@/contexts/NotificationsContext';
import { useToast } from '@/contexts/ToastContext';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { services } from '@/services';
import type { Notification } from '@/types';
import type { TranslationKey } from '@/locales';
import { orderCode } from '@/utils/format';

export default function NotificationsPage() {
  const { t, tDynamic, date, errorMessage, loc, price } = useI18n();
  const { isAdmin } = useAuth();
  const { refresh, revision } = useNotificationsBadge();
  const toast = useToast();
  const navigate = useNavigate();
  const list = useAsync(() => services.notifications.list(), [revision]);
  useDocumentMeta({ title: t('notifications.title'), noindex: true });

  const text = (n: Notification): string => {
    switch (n.type) {
      case 'ORDER_CREATED':
        return t(isAdmin ? 'notifications.templates.ORDER_CREATED_ADMIN' : 'notifications.templates.ORDER_CREATED_USER', {
          customer: n.params.customer ?? '',
        });
      case 'ORDER_STATUS_CHANGED':
        return t('notifications.templates.ORDER_STATUS_CHANGED', {
          status: tDynamic(`orderStatus.${n.params.status ?? ''}`),
        });
      case 'NEW_MESSAGE':
        return t('notifications.templates.NEW_MESSAGE', { sender: n.params.sender ?? '' });
      case 'FAVORITE_PRICE_DROP':
        return t('notifications.templates.FAVORITE_PRICE_DROP', { name: loc({ tr: n.params.nameTr ?? '', en: n.params.nameEn ?? '' }), price: price(Number(n.params.newPrice ?? 0)) });
      case 'FAVORITE_BACK_IN_STOCK':
        return t('notifications.templates.FAVORITE_BACK_IN_STOCK', { name: loc({ tr: n.params.nameTr ?? '', en: n.params.nameEn ?? '' }) });
    }
  };

  const open = async (n: Notification) => {
    try {
      if (!n.isRead) {
        await services.notifications.markRead(n.id);
        void refresh();
      }
    } catch (e) {
      toast.error(errorMessage(e));
      return;
    }
    if (n.type === 'NEW_MESSAGE') {
      const messagesPath = isAdmin ? ROUTES.adminMessages : ROUTES.accountMessages;
      const query = n.orderId ? `?${new URLSearchParams({ orderId: n.orderId })}` : '';
      navigate(`${messagesPath}${query}`);
    } else if (n.orderId) {
      navigate(isAdmin ? ROUTES.adminOrder(n.orderId) : ROUTES.accountOrder(n.orderId));
    } else if ((n.type === 'FAVORITE_PRICE_DROP' || n.type === 'FAVORITE_BACK_IN_STOCK') && n.params.slug) {
      navigate(ROUTES.product(n.params.slug));
    } else {
      list.reload();
    }
  };

  const markReadOnly = async (n: Notification) => {
    try {
      await services.notifications.markRead(n.id);
      void refresh();
      list.reload();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const markAll = async () => {
    try {
      await services.notifications.markAllRead();
      toast.success('notifications.markedAll' satisfies TranslationKey);
      void refresh();
      list.reload();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const hasUnread = list.data?.some((n) => !n.isRead) ?? false;

  return (
    <>
      <div className="dash__head">
        <div>
          <h1>{t('notifications.title')}</h1>
          <p className="muted" style={{ margin: 0 }}>
            {t('notifications.subtitle')}
          </p>
        </div>
        {hasUnread && (
          <Button variant="secondary" onClick={() => void markAll()}>
            {t('notifications.markAll')}
          </Button>
        )}
      </div>
      {list.loading && !list.data ? (
        <div className="stack">
          <Skeleton style={{ height: 64 }} />
          <Skeleton style={{ height: 64 }} />
        </div>
      ) : list.error ? (
        <ErrorState error={list.error} onRetry={list.reload} />
      ) : list.data && list.data.length > 0 ? (
        <ul>
          {list.data.map((n) => (
            <li key={n.id}>
              <div
                className={`list-card ${n.isRead ? '' : 'list-card--unread'}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: n.isRead ? 'transparent' : undefined,
                  opacity: n.isRead ? 0.7 : 1,
                  cursor: 'pointer',
                  flexWrap: 'nowrap',
                  gap: '1rem'
                }}
                onClick={() => void open(n)}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong>{n.orderId ? `${orderCode(n.orderId)} - ` : ''}{text(n)}</strong>
                  <br />
                  <span className="muted" style={{ fontSize: '0.86rem' }}>
                    {date(n.createdAt, true)}
                  </span>
                </div>
                {!n.isRead ? (
                  <button
                    type="button"
                    className="icon-btn"
                    title={t('notifications.markRead')}
                    aria-label={t('notifications.markRead')}
                    onClick={(e) => { e.stopPropagation(); void markReadOnly(n); }}
                    style={{
                      color: 'var(--primary-text)',
                      background: 'transparent',
                      border: 'none',
                      flexShrink: 0,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      padding: 6,
                      borderRadius: '50%'
                    }}
                  >
                    <Icon name="checkDouble" size={20} strokeWidth={2.2} />
                  </button>
                ) : (
                  <span
                    style={{
                      color: 'var(--text-muted)',
                      flexShrink: 0,
                      opacity: 0.45,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 6
                    }}
                    title={t('notifications.markedAll')}
                  >
                    <Icon name="checkDouble" size={18} strokeWidth={2} />
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon="bell" title={t('notifications.emptyTitle')} description={t('notifications.emptyText')} />
      )}
    </>
  );
}
