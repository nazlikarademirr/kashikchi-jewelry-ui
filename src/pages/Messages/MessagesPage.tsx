import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessagePanel } from '@/components/order';
import { OrderStatusBadge } from '@/components/product';
import { Icon } from '@/components/ui/Icon';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/State';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useNotificationsBadge } from '@/contexts/NotificationsContext';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { services } from '@/services';
import { orderCode } from '@/utils/format';

export default function MessagesPage() {
  const { t, date } = useI18n();
  const { isAdmin } = useAuth();
  const { refresh } = useNotificationsBadge();
  const threads = useAsync(() => services.messages.listThreads(), []);
  const [selected, setSelected] = useState<string | null>(null);
  const initialOpened = useRef(false);
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
    if (!initialOpened.current && threads.data && threads.data.length > 0) {
      setSelected(threads.data[0].orderId);
      initialOpened.current = true;
    }
  }, [threads.data]);

  return (
    <>
      <div className="dash__head">
        <div>
          <h1>{t('messages.title')}</h1>
        </div>
      </div>
      {threads.loading && !threads.data ? (
        <Skeleton style={{ height: 240 }} />
      ) : threads.error ? (
        <ErrorState error={threads.error} onRetry={threads.reload} />
      ) : !threads.data || threads.data.length === 0 ? (
        <EmptyState icon="chat" title={t('messages.emptyTitle')} description={t('messages.emptyText')} />
      ) : (
        <div className="threads-accordion" role="list" aria-label={t('messages.threadsLabel')}>
          {threads.data.map((th) => {
            const isOpen = selected === th.orderId;
            return (
              <div key={th.orderId} className={`thread-item ${isOpen ? 'thread-item--open' : ''}`} role="listitem">
                <div
                  className="thread-item__header"
                  role="button"
                  tabIndex={0}
                  aria-expanded={isOpen}
                  onClick={() => setSelected(isOpen ? null : th.orderId)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelected(isOpen ? null : th.orderId);
                    }
                  }}
                >
                  <div className="thread-item__top">
                    <div className="thread-item__title-group">
                      <span className="thread-item__chevron" aria-hidden="true">
                        <Icon name="chevronDown" size={18} />
                      </span>
                      <span className="thread-item__title">
                        {`${orderCode(th.orderId)} - ${th.customerName}`}
                      </span>
                      <OrderStatusBadge status={th.orderStatus} />
                      {th.unreadCount > 0 && (
                        <span className="badge badge--primary">{th.unreadCount}</span>
                      )}
                    </div>
                    <div className="thread-item__meta" onClick={(e) => e.stopPropagation()}>
                      <Link
                        to={isAdmin ? ROUTES.adminOrder(th.orderId) : ROUTES.accountOrder(th.orderId)}
                        className="thread-item__open-link"
                      >
                        {t('messages.openOrder')}
                      </Link>
                    </div>
                  </div>

                  <div className="thread-item__preview">
                    <span className="thread-item__preview-text">
                      {th.lastMessage ? th.lastMessage.message : t('messages.noMessagesYet')}
                    </span>
                    {th.lastMessage && (
                      <span className="muted" style={{ fontSize: '0.8rem', flexShrink: 0 }}>
                        {date(th.lastMessage.createdAt, true)}
                      </span>
                    )}
                  </div>
                </div>

                {isOpen && (
                  <div className="thread-item__body">
                    <MessagePanel key={th.orderId} orderId={th.orderId} onSent={threads.reload} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
