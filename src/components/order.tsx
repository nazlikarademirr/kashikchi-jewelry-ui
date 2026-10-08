import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { Alert } from '@/components/ui/State';
import { ORDER_STATUSES } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useNotificationsBadge } from '@/contexts/NotificationsContext';
import { services } from '@/services';
import type { Message, Order, OrderStatus } from '@/types';
import { mediaUrl } from '@/utils/media';
import { sanitizeText } from '@/utils/validation';

interface OrderTimelineProps {
  status: OrderStatus;
  interactive?: boolean;
  targetStatus?: OrderStatus;
  onSelectStatus?: (status: OrderStatus) => void;
  dates?: Record<OrderStatus, string | null>;
}

export function OrderTimeline({ status, interactive, targetStatus, onSelectStatus, dates }: OrderTimelineProps) {
  const { t, date } = useI18n();
  const current = ORDER_STATUSES.indexOf(status);
  const target = targetStatus ? ORDER_STATUSES.indexOf(targetStatus) : current;

  return (
    <ol className={`timeline ${interactive ? 'timeline--interactive' : ''}`} aria-label={t('orders.progress')}>
      {ORDER_STATUSES.map((s, i) => {
        const isDone = i <= current;
        const isTargeted = interactive && i > current && i <= target;
        const isDisabled = interactive && i <= current; // geçmişe dönülemez
        const stepDate = dates?.[s];

        return (
          <li
            key={s}
            className={`timeline__step ${isDone || isTargeted ? 'timeline__step--done' : ''} ${isDisabled ? 'timeline__step--disabled' : ''}`}
            aria-current={i === current ? 'step' : undefined}
            onClick={() => {
              if (interactive && !isDisabled && onSelectStatus) {
                onSelectStatus(s);
              }
            }}
            style={{ cursor: interactive && !isDisabled ? 'pointer' : 'default' }}
          >
            <div>{t(`orderStatus.${s}`)}</div>
            {stepDate && (
              <div className="timeline__date muted" style={{ fontSize: '0.8rem', marginTop: 4 }}>
                {date(stepDate)}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function OrderItemsList({ order }: { order: Order }) {
  const { t, loc, price } = useI18n();
  return (
    <ul className="order-items" aria-label={t('orders.items')}>
      {order.items.map((i) => (
        <li className="order-item" key={i.id}>
          {i.productImage ? (
            <img src={mediaUrl(i.productImage)} alt="" width={64} height={80} loading="lazy" />
          ) : (
            <span />
          )}
          <div>
            <strong>{loc(i.productName)}</strong>
            <div className="muted" style={{ fontSize: '0.85rem' }}>
              {i.productCode} · {t('orders.quantityPrice', { qty: i.quantity, price: price(i.unitPrice) })}
            </div>
            {i.customizationNote && (
              <div style={{ marginTop: 6 }}>
                <span className="muted" style={{ fontSize: '0.82rem' }}>
                  {t('orders.customization')}
                </span>
                <div className="note-box">{i.customizationNote}</div>
              </div>
            )}
          </div>
          <strong>{price(i.unitPrice * i.quantity)}</strong>
        </li>
      ))}
    </ul>
  );
}

export function MessagePanel({ orderId, onSent }: { orderId: string; onSent?: () => void }) {
  const { t, date, errorMessage } = useI18n();
  const { user } = useAuth();
  const { refresh } = useNotificationsBadge();
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const list = await services.messages.list(orderId);
      setMessages(list);
      if (list.some((m) => !m.isRead && m.senderUserId !== user?.id)) {
        await services.messages.markRead(orderId);
        void refresh();
      }
    } catch (e) {
      setMessages([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, user?.id]);

  useEffect(() => {
    setMessages(null);
    void load();
    return services.messages.subscribe(orderId, () => void load());
  }, [orderId, load]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resetTextarea = () => {
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const send = async (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    const body = sanitizeText(text, 2000);
    if (!body) return;
    setBusy(true);
    setError(null);
    try {
      await services.messages.send(orderId, body);
      resetTextarea();
      await load();
      onSent?.();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="chat">
      <div className="chat__list" ref={listRef} role="log" aria-live="polite" aria-label={t('messages.title')}>
        {messages && messages.length === 0 && !error && <p className="muted">{t('messages.noMessages')}</p>}
        {messages?.map((m) => {
          const mine = m.senderUserId === user?.id;
          return (
            <div key={m.id} className={`chat__msg ${mine ? 'chat__msg--mine' : ''}`}>
              <p>{m.message}</p>
              <span className="chat__meta">
                {mine ? t('messages.you') : m.senderRole === 1 ? t('messages.seller') : m.senderName} ·{' '}
                {date(m.createdAt, true)}
              </span>
            </div>
          );
        })}
      </div>
      <form className="chat__form" onSubmit={send}>
        <div className="grow">
          <Textarea
            ref={textareaRef}
            label={t('messages.label')}
            placeholder={t('messages.placeholder')}
            value={text}
            maxLength={2000}
            onChange={handleInput}
            style={{ overflow: 'hidden', resize: 'none' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
          />
        </div>
        <Button type="submit" loading={busy} disabled={!text.trim()}>
          {t('messages.send')}
        </Button>
      </form>
      {error && <Alert kind="error">{error}</Alert>}
    </div>
  );
}
