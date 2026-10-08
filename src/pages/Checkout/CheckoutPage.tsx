import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button, LinkButton } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Alert, EmptyState, Spinner } from '@/components/ui/State';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useI18n } from '@/contexts/I18nContext';
import { useToast } from '@/contexts/ToastContext';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { services } from '@/services';
import { isAppError } from '@/types';
import { finalPrice } from '@/utils/format';
import { mediaUrl } from '@/utils/media';
import { v } from '@/utils/validation';

export default function CheckoutPage() {
  const { t, tDynamic, loc, price, errorMessage } = useI18n();
  const { user } = useAuth();
  const { items, total, loading, reset, refresh } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const done = false;
  useDocumentMeta({ title: t('checkout.title'), noindex: true });

  const phoneError = v.phone(phone);

  if (loading && items.length === 0) return <Spinner />;
  if (items.length === 0 && !done) {
    return (
      <div className="container section">
        <EmptyState
          icon="bag"
          title={t('cart.emptyTitle')}
          description={t('cart.emptyText')}
          action={<LinkButton to={ROUTES.products}>{t('cart.continueShopping')}</LinkButton>}
        />
      </div>
    );
  }
  if (done) return <Navigate to={ROUTES.accountOrders} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setServerError(null);
    if (phoneError) return;
    setBusy(true);
    try {
      const order = await services.orders.create({ contactPhone: phone.trim(), customerNote: note });
      reset();
      toast.success('checkout.success');
      navigate(ROUTES.accountOrder(order.id), { replace: true });
    } catch (err) {
      setServerError(errorMessage(err));
      if (isAppError(err) && (err.code === 'INSUFFICIENT_STOCK' || err.code === 'NOT_FOUND')) void refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <div className="container">
          <h1>{t('checkout.title')}</h1>
          <p>{t('checkout.subtitle')}</p>
        </div>
      </div>
      <div className="container section section--tight">
        <form className="checkout-layout" onSubmit={submit} noValidate>
          <div className="stack">
            <div className="card">
              <h2 className="card__title">{t('checkout.contact')}</h2>
              <div className="form-grid form-grid--2">
                <Input label={t('auth.name')} value={user ? `${user.name} ${user.surname}` : ''} readOnly />
                <Input label={t('auth.email')} value={user?.email ?? ''} readOnly />
              </div>
              <div className="form-grid" style={{ marginTop: 'var(--space-4)' }}>
                <Input
                  label={t('checkout.phone')}
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  error={submitted && phoneError ? tDynamic(phoneError) : null}
                  placeholder="+90 5xx xxx xx xx"
                />
                <Textarea
                  label={t('checkout.note')}
                  value={note}
                  maxLength={1000}
                  onChange={(e) => setNote(e.target.value)}
                  hint={t('checkout.noteHint')}
                />
              </div>
            </div>

            <div className="card">
              <h2 className="card__title">{t('checkout.itemsTitle')}</h2>
              <ul className="order-items">
                {items.map((i) => (
                  <li className="order-item" key={i.id}>
                    {i.product.images[0] ? (
                      <img src={mediaUrl(i.product.images[0].storageKey)} alt="" width={64} height={80} loading="lazy" style={{ objectFit: 'cover', borderRadius: 'var(--r-control)' }} />
                    ) : (
                      <div style={{ width: 64, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--surface)', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.6rem', textAlign: 'center', borderRadius: 'var(--r-control)' }}>
                        <span>{t('product.comingSoon')}</span>
                      </div>
                    )}
                    <div>
                      <strong>{loc(i.product.name)}</strong>
                      <div className="muted" style={{ fontSize: '0.85rem' }}>
                        {i.quantity} × {price(finalPrice(i.product))}
                      </div>
                      {i.customizationNote && <div className="note-box" style={{ marginTop: 6 }}>{i.customizationNote}</div>}
                    </div>
                    <strong>{price(finalPrice(i.product) * i.quantity)}</strong>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <aside className="summary">
            <h2 style={{ fontSize: '1.5rem' }}>{t('cart.summary')}</h2>
            <div className="summary__row summary__total">
              <span>{t('cart.total')}</span>
              <span>{price(total)}</span>
            </div>
            <Alert kind="info">{t('checkout.noPayment')}</Alert>
            {serverError && <Alert kind="error">{serverError}</Alert>}
            <Button type="submit" size="lg" block loading={busy}>
              {t('checkout.placeOrder')}
            </Button>
            <LinkButton to={ROUTES.cart} variant="ghost" block>
              {t('checkout.backToCart')}
            </LinkButton>
          </aside>
        </form>
      </div>
    </>
  );
}
