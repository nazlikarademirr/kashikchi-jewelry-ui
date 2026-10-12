import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QuantityStepper } from '@/components/ImageGallery';
import { PriceTag, StockBadge } from '@/components/product';
import { Button, LinkButton } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/Modal';
import { Alert, EmptyState, Skeleton } from '@/components/ui/State';
import { INPUT_LIMITS, MAX_CART_QUANTITY } from '@/constants';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useI18n } from '@/contexts/I18nContext';
import { useToast } from '@/contexts/ToastContext';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { services } from '@/services';
import type { CartItem } from '@/types';
import { finalPrice } from '@/utils/format';
import { mediaUrl } from '@/utils/media';
import { v } from '@/utils/validation';

function CartLine({ item }: { item: CartItem }) {
  const { t, loc, price, errorMessage } = useI18n();
  const cart = useCart();
  const toast = useToast();
  const [note, setNote] = useState(item.customizationNote);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const p = item.product;
  const maxQty = p.stock > 0 ? Math.min(p.stock, MAX_CART_QUANTITY) : MAX_CART_QUANTITY;
  const name = loc(p.name);

  const adjustTextareaHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const borderOffset = el.offsetHeight - el.clientHeight;
    el.style.height = `${Math.max(44, el.scrollHeight + borderOffset)}px`;
  };

  useEffect(() => {
    adjustTextareaHeight();
    window.addEventListener('resize', adjustTextareaHeight);
    return () => window.removeEventListener('resize', adjustTextareaHeight);
  }, [note]);

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

  const isOver = note.length > INPUT_LIMITS.note;
  const noteError = isOver ? t('validation.maxLength', { max: INPUT_LIMITS.note }) : null;

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
      </div>
      <div className="cart-line__side">
        <strong className="cart-line__price">{price(finalPrice(p) * item.quantity)}</strong>
        <div className="cart-line__actions">
          <QuantityStepper
            value={item.quantity}
            max={maxQty}
            disabled={busy}
            label={t('cart.quantity')}
            onChange={(q) => void run(() => cart.updateQuantity(item.id, q))}
          />
          <Button variant="ghost" size="sm" className="cart-line__remove-btn" onClick={() => setConfirm(true)} disabled={busy}>
            {t('cart.remove')}
          </Button>
        </div>
      </div>
      <div className="cart-line__note">
        <Textarea
          ref={textareaRef}
          label={t('cart.note')}
          value={note}
          rows={1}
          error={noteError}
          reserveMessageSpace={false}
          className="cart-line__note-input"
          onChange={(e) => {
            setNote(e.target.value);
            e.target.style.height = 'auto';
            const borderOffset = e.target.offsetHeight - e.target.clientHeight;
            e.target.style.height = `${e.target.scrollHeight + borderOffset}px`;
          }}
          onBlur={() => {
            if (!isOver && note !== item.customizationNote) void run(() => cart.updateNote(item.id, note));
          }}
          placeholder={t('product.customizationPlaceholder')}
        />
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
  const { t, tDynamic, price, errorMessage } = useI18n();
  const { user, updateProfile } = useAuth();
  const { items, loading, total, count, reset } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(() => (user ? `${user.name} ${user.surname}`.trim() : ''));
  const [email, setEmail] = useState(() => user?.email ?? '');
  const [phone, setPhone] = useState(() => user?.phone ?? '');
  const [orderNote, setOrderNote] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useDocumentMeta({ title: t('cart.title'), noindex: true });

  useEffect(() => {
    if (user) {
      setFullName((f) => f || `${user.name} ${user.surname}`.trim());
      setEmail((e) => e || user.email || '');
      setPhone((p) => p || user.phone || '');
    }
  }, [user]);

  const nameError = fullName.trim() ? null : 'validation.required';
  const emailError = email.trim() ? v.email(email) : null;
  const phoneError = v.phone(phone);
  const hasErrors = Boolean(nameError || emailError || phoneError);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setServerError(null);
    if (hasErrors) return;
    setBusy(true);
    try {
      const parts = fullName.trim().split(/\s+/);
      const newName = parts[0] || (user?.name ?? '');
      const newSurname = parts.slice(1).join(' ') || (user?.surname ?? '');
      const newEmail = email.trim() || null;
      const newPhone = phone.trim();

      const profileChanged =
        user &&
        (newName !== user.name ||
          newSurname !== user.surname ||
          newEmail !== (user.email ?? null) ||
          newPhone !== (user.phone ?? ''));

      if (profileChanged && updateProfile) {
        await updateProfile({
          name: newName,
          surname: newSurname,
          email: newEmail,
          phone: newPhone || null,
        });
      }

      const order = await services.orders.create({ contactPhone: newPhone, customerNote: orderNote });
      reset();
      toast.success('checkout.success');
      navigate(ROUTES.accountOrder(order.id), { replace: true, state: { justCreated: true } });
    } catch (err) {
      setServerError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

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
          <form onSubmit={submit} noValidate>
            <div className="checkout-layout">
              <div className="stack" style={{ gap: 'var(--space-6)' }}>
                <ul aria-label={t('cart.title')}>
                  {items.map((i) => (
                    <CartLine key={i.id} item={i} />
                  ))}
                </ul>

                <div className="card">
                  <h2 className="card__title">{t('checkout.contact')}</h2>
                  <div className="form-grid form-grid--2">
                    <Input
                      label={t('checkout.fullName')}
                      required
                      maxLength={INPUT_LIMITS.name + INPUT_LIMITS.surname}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      error={submitted && nameError ? tDynamic(nameError) : null}
                    />
                    <Input
                      label={t('auth.email')}
                      type="email"
                      maxLength={INPUT_LIMITS.email}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      error={submitted && emailError ? tDynamic(emailError) : null}
                    />
                  </div>
                  <div className="form-grid" style={{ marginTop: 'var(--space-4)' }}>
                    <Input
                      label={t('checkout.phone')}
                      type="tel"
                      required
                      maxLength={INPUT_LIMITS.phone}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      error={submitted && phoneError ? tDynamic(phoneError) : null}
                      placeholder="+90 5xx xxx xx xx"
                    />
                  </div>
                  <div className="form-grid" style={{ marginTop: 'var(--space-4)' }}>
                    <Textarea
                      label={t('checkout.note')}
                      rows={3}
                      maxLength={INPUT_LIMITS.note}
                      value={orderNote}
                      onChange={(e) => setOrderNote(e.target.value)}
                      hint={t('checkout.noteHint')}
                    />
                  </div>
                </div>
              </div>

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
                <Alert kind="info">{t('checkout.noPayment')}</Alert>
                {serverError && <Alert kind="error">{serverError}</Alert>}
                <LinkButton to={ROUTES.products} variant="ghost" block>
                  {t('cart.continueShopping')}
                </LinkButton>
                <Button type="submit" size="lg" block loading={busy}>
                  {t('checkout.placeOrder')}
                </Button>
              </aside>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
