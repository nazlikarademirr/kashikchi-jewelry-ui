import { useState } from 'react';
import { Link } from 'react-router-dom';
import { QuantityStepper } from '@/components/ImageGallery';
import { PriceTag, StockBadge } from '@/components/product';
import { Button, LinkButton } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/Modal';
import { EmptyState, Skeleton } from '@/components/ui/State';
import { MAX_CART_QUANTITY } from '@/constants';
import { ROUTES } from '@/constants/routes';
import { useCart } from '@/contexts/CartContext';
import { useI18n } from '@/contexts/I18nContext';
import { useToast } from '@/contexts/ToastContext';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import type { CartItem } from '@/types';
import { finalPrice } from '@/utils/format';
import { mediaUrl } from '@/utils/media';

function CartLine({ item }: { item: CartItem }) {
  const { t, loc, price, errorMessage } = useI18n();
  const cart = useCart();
  const toast = useToast();
  const [note, setNote] = useState(item.customizationNote);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const p = item.product;
  const maxQty = p.stock > 0 ? Math.min(p.stock, MAX_CART_QUANTITY) : MAX_CART_QUANTITY;
  const name = loc(p.name);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="cart-line">
      <Link to={ROUTES.product(p.slug)}>
        {p.images[0] ? (
          <img className="cart-line__img" src={mediaUrl(p.images[0].storageKey)} alt={name} width={110} height={138} loading="lazy" />
        ) : (
          <div className="cart-line__img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--surface)', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.7rem', textAlign: 'center' }}>
            <span>{t('product.comingSoon')}</span>
          </div>
        )}
      </Link>
      <div className="cart-line__body">
        <Link to={ROUTES.product(p.slug)} className="cart-line__name">
          {name}
        </Link>
        <span className="muted" style={{ fontSize: '0.82rem' }}>
          {p.code}
        </span>
        <div className="row">
          <PriceTag product={p} />
          <StockBadge stock={p.stock} />
        </div>
        <Textarea
          label={t('cart.note')}
          value={note}
          rows={2}
          maxLength={1000}
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => {
            if (note !== item.customizationNote) void run(() => cart.updateNote(item.id, note));
          }}
          placeholder={t('product.customizationPlaceholder')}
          style={{ minHeight: 64 }}
        />
      </div>
      <div className="cart-line__side">
        <strong>{price(finalPrice(p) * item.quantity)}</strong>
        <QuantityStepper
          value={item.quantity}
          max={maxQty}
          disabled={busy}
          label={t('cart.quantity')}
          onChange={(q) => void run(() => cart.updateQuantity(item.id, q))}
        />
        <Button variant="ghost" size="sm" onClick={() => setConfirm(true)} disabled={busy}>
          {t('cart.remove')}
        </Button>
      </div>
      <ConfirmDialog
        open={confirm}
        danger
        title={t('cart.removeTitle')}
        message={t('cart.removeMessage', { name })}
        confirmLabel={t('cart.remove')}
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          setConfirm(false);
          void run(async () => {
            await cart.remove(item.id);
            toast.success('cart.removed');
          });
        }}
      />
    </li>
  );
}

export default function CartPage() {
  const { t, price } = useI18n();
  const { items, loading, total, count } = useCart();
  useDocumentMeta({ title: t('cart.title'), noindex: true });

  return (
    <>
      <div className="page-head">
        <div className="container">
          <h1>{t('cart.title')}</h1>
        </div>
      </div>
      <div className="container section section--tight">
        {loading && items.length === 0 ? (
          <Skeleton style={{ height: 180 }} />
        ) : items.length === 0 ? (
          <EmptyState
            icon="bag"
            title={t('cart.emptyTitle')}
            description={t('cart.emptyText')}
            action={<LinkButton to={ROUTES.products}>{t('cart.continueShopping')}</LinkButton>}
          />
        ) : (
          <div className="checkout-layout">
            <ul aria-label={t('cart.title')}>
              {items.map((i) => (
                <CartLine key={i.id} item={i} />
              ))}
            </ul>
            <aside className="summary" aria-label={t('cart.summary')}>
              <h2 style={{ fontSize: '1.5rem' }}>{t('cart.summary')}</h2>
              <div className="summary__row">
                <span>{t('cart.items', { n: count })}</span>
                <span>{price(total)}</span>
              </div>
              <div className="summary__row summary__total">
                <span>{t('cart.total')}</span>
                <span>{price(total)}</span>
              </div>
              <p className="muted" style={{ fontSize: '0.84rem' }}>{t('cart.noPaymentNote')}</p>
              <LinkButton to={ROUTES.checkout} size="lg" block>
                {t('cart.checkout')}
              </LinkButton>
              <LinkButton to={ROUTES.products} variant="ghost" block>
                {t('cart.continueShopping')}
              </LinkButton>
            </aside>
          </div>
        )}
      </div>
    </>
  );
}
