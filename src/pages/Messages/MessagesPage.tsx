import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessagePanel } from '@/components/order';
import { OrderStatusBadge } from '@/components/product';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/State';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useNotificationsBadge } from '@/contexts/NotificationsContext';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { services } from '@/services';
import { shortId } from '@/utils/format';

export default function MessagesPage() {
  const { t, date } = useI18n();
  const { isAdmin } = useAuth();
  const { refresh } = useNotificationsBadge();
  const threads = useAsync(() => services.messages.listThreads(), []);
  const [selected, setSelected] = useState<string | null>(null);
  useDocumentMeta({ title: t('messages.title'), noindex: true });

  
  useEffect(() => {
    const timer = window.setInterval(() => {
      threads.reload();
      void refresh();
    }, 20_000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selected && threads.data && threads.data.length > 0) setSelected(threads.data[0].orderId);
  }, [threads.data, selected]);

  const current = threads.data?.find((x) => x.orderId === selected) ?? null;

  return (
    <>
      <div className="dash__head">
        <div>
          <h1>{t('messages.title')}</h1>
          <p className="muted" style={{ margin: 0 }}>
            {t('messages.subtitle')}
          </p>
        </div>
      </div>
      {threads.loading && !threads.data ? (
        <Skeleton style={{ height: 240 }} />
      ) : threads.error ? (
        <ErrorState error={threads.error} onRetry={threads.reload} />
      ) : !threads.data || threads.data.length === 0 ? (
        <EmptyState icon="chat" title={t('messages.emptyTitle')} description={t('messages.emptyText')} />
      ) : (
        <div className="split split--threads">
          <div className="threads" role="list" aria-label={t('messages.threadsLabel')}>
            {threads.data.map((th) => (
              <button
                key={th.orderId}
                type="button"
                role="listitem"
                className="thread"
                aria-current={th.orderId === selected}
                onClick={() => setSelected(th.orderId)}
              >
                <span className="thread__top">
                  <span>{isAdmin ? th.customerName : t('messages.orderRef', { no: shortId(th.orderId) })}</span>
                  {th.unreadCount > 0 && <span className="badge badge--primary">{th.unreadCount}</span>}
                </span>
                <span className="thread__last">
                  {th.lastMessage ? th.lastMessage.message : t('messages.noMessagesYet')}
                </span>
                {th.lastMessage && (
                  <span className="muted" style={{ fontSize: '0.8rem' }}>
                    {date(th.lastMessage.createdAt, true)}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="stack">
            {current ? (
              <>
                <div className="row row--between">
                  <div className="row">
                    <strong>{t('messages.orderRef', { no: shortId(current.orderId) })}</strong>
                    <OrderStatusBadge status={current.orderStatus} />
                  </div>
                  <Link to={isAdmin ? ROUTES.adminOrder(current.orderId) : ROUTES.accountOrder(current.orderId)}>
                    {t('messages.openOrder')}
                  </Link>
                </div>
                <MessagePanel key={current.orderId} orderId={current.orderId} onSent={threads.reload} />
              </>
            ) : (
              <p className="muted">{t('messages.selectThread')}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
