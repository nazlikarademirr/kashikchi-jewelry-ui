import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QuantityStepper } from '@/components/ImageGallery';
import { PriceTag } from '@/components/product';
import { Button, LinkButton } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { AddressFields } from '@/components/Address/AddressFields';
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
import { isAppError, type CartItem, type UserAddress } from '@/types';
import { getDeliveryAddressErrors } from '@/utils/address';
import { getCheckoutProfileUpdate } from '@/utils/checkout';
import { finalPrice } from '@/utils/format';
import { mediaUrl } from '@/utils/media';
import { formatPhoneNumber } from '@/utils/phone';
import { toTitleCase, v } from '@/utils/validation';

function CartLine({ item }: { item: CartItem }) {
  const { t, loc, price, errorMessage } = useI18n();
  const cart = useCart();
  const toast = useToast();
  const [note, setNote] = useState(item.customizationNote);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const p = item.product;
  const maxQty = MAX_CART_QUANTITY;
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
            e.target.style.height = `${Math.max(44, e.target.scrollHeight + borderOffset)}px`;
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
  const { user, updateProfile, reloadUser } = useAuth();
  const { items, loading, total, count, reset } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(() => (user ? `${user.name} ${user.surname}`.trim() : ''));
  const [email, setEmail] = useState(() => user?.email ?? '');
  const [phone, setPhone] = useState(() => formatPhoneNumber(user?.phone ?? ''));
  const [orderNote, setOrderNote] = useState('');
  const orderNoteRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const field = orderNoteRef.current;
    if (!field) return;
    const resize = () => {
      field.style.height = 'auto';
      field.style.height = `${field.scrollHeight + field.offsetHeight - field.clientHeight}px`;
    };
    resize();
    let width = field.clientWidth;
    const observer = new ResizeObserver(() => {
      if (field.clientWidth !== width) {
        width = field.clientWidth;
        resize();
      }
    });
    observer.observe(field);
    return () => observer.disconnect();
  }, [orderNote, loading, items.length]);

  const userAddresses = user?.addresses ?? [];
  const [address, setAddress] = useState<UserAddress>(() => {
    return {
      id: '',
      title: '',
      country: 'Türkiye',
      city: '',
      district: '',
      fullAddress: '',
    };
  });
  const [selectedSavedId, setSelectedSavedId] = useState('__pickup__');
  const needsDeliveryAddress = selectedSavedId !== '' && selectedSavedId !== '__pickup__';
  const isSavedAddress = selectedSavedId !== '' && selectedSavedId !== '__new__' && selectedSavedId !== '__pickup__';

  const [saveAddress, setSaveAddress] = useState(false);
  const [addressServerErrors, setAddressServerErrors] = useState<Record<string, string>>({});
  const isNewAddress = selectedSavedId === '__new__';

  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [contactServerErrors, setContactServerErrors] = useState<Record<string, string>>({});

  const selectDelivery = (choice: string) => {
    setSelectedSavedId(choice);
    setSaveAddress(false);
    setAddressServerErrors({});
    const saved = userAddresses.find((item) => item.id === choice);
    setAddress(saved ? { ...saved } : { id: '', title: '', country: 'Türkiye', city: '', district: '', fullAddress: '' });
  };

  useDocumentMeta({ title: t('cart.title'), noindex: true });

  useEffect(() => {
    if (user) {
      setFullName((f) => f || `${user.name} ${user.surname}`.trim());
      setEmail((e) => e || user.email || '');
      setPhone((p) => p || formatPhoneNumber(user.phone ?? ''));
    }
  }, [user]);

  const nameError = fullName.trim() ? null : 'validation.required';
  const emailError = email.trim() ? v.email(email) : null;
  const phoneError = v.phone(phone);
  const hasErrors = Boolean(nameError || emailError || phoneError);

  const addressErrors = getDeliveryAddressErrors(address, userAddresses, needsDeliveryAddress, isNewAddress && saveAddress);
  const hasAddressError = Object.values(addressErrors).some(Boolean);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setSubmitted(true);
    setContactServerErrors({});
    if (hasErrors) {
      const missingRequired = nameError === 'validation.required' || phoneError === 'validation.required';
      toast.error(t(missingRequired ? 'checkout.requiredContact' : 'checkout.invalidContact'));
      return;
    }
    if (!selectedSavedId || hasAddressError) return;
    setBusy(true);
    try {
      const newPhone = phone.trim();
      const profileUpdate = getCheckoutProfileUpdate(user, fullName, email, phone);
      if (profileUpdate) await updateProfile(profileUpdate);

      const order = await services.orders.create({
        contactPhone: newPhone,
        customerNote: orderNote,
        deliveryAddress: needsDeliveryAddress ? address : null,
        saveDeliveryAddress: isNewAddress && saveAddress,
      });
      if (isNewAddress && saveAddress) {
        await reloadUser().catch(() => { /* The order and address were saved; a refresh must not retry the order. */ });
      }
      reset();
      navigate(ROUTES.accountOrder(order.id), { replace: true, state: { justCreated: true } });
    } catch (err) {
      if (isAppError(err) && err.fieldErrors) {
        const fields: Record<string, string> = {};
        const contacts: Record<string, string> = {};
        for (const [key, message] of Object.entries(err.fieldErrors)) {
          if (key.startsWith('deliveryAddress.')) fields[key.slice('deliveryAddress.'.length)] = message;
          else if (key === 'name' || key === 'surname') contacts.fullName = message;
          else if (key === 'email') contacts.email = message;
          else if (key === 'phone' || key === 'contactPhone') contacts.phone = message;
        }
        if (Object.keys(contacts).length > 0) {
          setContactServerErrors(contacts);
          toast.error(tDynamic(Object.values(contacts)[0]));
        }
        if (Object.keys(fields).length > 0) setAddressServerErrors(fields);
        if (Object.keys(fields).length > 0 || Object.keys(contacts).length > 0) return;
      }
      toast.error(errorMessage(err));
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
                      onChange={(e) => { setFullName(e.target.value); setContactServerErrors((prev) => ({ ...prev, fullName: '' })); }}
                      onBlur={() => setFullName((f) => toTitleCase(f))}
                      error={submitted && (nameError || contactServerErrors.fullName) ? tDynamic(nameError || contactServerErrors.fullName) : null}
                    />
                    <Input
                      label={t('auth.email')}
                      type="email"
                      maxLength={INPUT_LIMITS.email}
                      value={email}
                      style={{ textTransform: 'lowercase' }}
                      onChange={(e) => { setEmail(e.target.value.toLowerCase()); setContactServerErrors((prev) => ({ ...prev, email: '' })); }}
                      onBlur={() => setEmail((e) => e.trim().toLowerCase())}
                      error={submitted && (emailError || contactServerErrors.email) ? tDynamic(emailError || contactServerErrors.email) : null}
                    />
                  </div>
                  <div className="form-grid" style={{ marginTop: 'var(--space-4)' }}>
                    <PhoneInput
                      label={t('checkout.phone')}
                      required
                      value={phone}
                      onChange={(val) => { setPhone(val); setContactServerErrors((prev) => ({ ...prev, phone: '' })); }}
                      error={submitted && (phoneError || contactServerErrors.phone) ? tDynamic(phoneError || contactServerErrors.phone) : null}
                    />
                  </div>
                  <div className="form-grid" style={{ marginTop: 'var(--space-4)' }}>
                    <Textarea
                      ref={orderNoteRef}
                      className="checkout__note-input"
                      label={t('checkout.note')}
                      rows={3}
                      maxLength={500}
                      value={orderNote}
                      onChange={(e) => setOrderNote(e.target.value.slice(0, 500))}
                      hint={t('checkout.noteHint')}
                    />
                  </div>

                  <div style={{ margin: 'var(--space-6) 0 var(--space-2)', borderTop: '1px solid var(--border)', paddingTop: 'var(--space-4)' }}>
                    <h2 className="card__title" style={{ marginBottom: 6 }}>{t('address.sectionTitle')}</h2>
                    <p className="address-notice">
                      {t('address.shippingNotice')}
                    </p>

                    <fieldset className="checkout__delivery-choice" disabled={busy}>
                      <legend className="sr-only">{t('address.deliveryChoice')}</legend>
                      <Select
                        label={t('address.savedAddresses')}
                        value={isSavedAddress ? selectedSavedId : ''}
                        disabled={busy || userAddresses.length === 0}
                        onChange={(e) => selectDelivery(e.target.value)}
                        error={submitted && !selectedSavedId ? t('validation.deliveryChoiceRequired') : null}
                      >
                        <option value="">
                          {userAddresses.length > 0 ? t('address.selectSavedAddress') : t('address.noSavedAddresses')}
                        </option>
                        {userAddresses.map((saved) => (
                          <option key={saved.id} value={saved.id}>{saved.title}</option>
                        ))}
                      </Select>
                      <label className="checkout__delivery-option">
                        <input type="radio" name="checkout-delivery-mode" value="__new__"
                          checked={isNewAddress} onChange={() => selectDelivery('__new__')} />
                        <span>{t('address.enterNewAddress')}</span>
                      </label>
                      <label className="checkout__delivery-option">
                        <input type="radio" name="checkout-delivery-mode" value="__pickup__"
                          checked={selectedSavedId === '__pickup__'} onChange={() => selectDelivery('__pickup__')} />
                        <span>{t('address.collectMyself')}</span>
                      </label>
                    </fieldset>

                    {needsDeliveryAddress && (
                      <>
                        <AddressFields
                          value={address}
                          onChange={(updated) => {
                            setAddress(updated);
                            setAddressServerErrors({});
                            if (selectedSavedId && selectedSavedId !== '__new__') {
                              const currentSaved = userAddresses.find((a) => a.id === selectedSavedId);
                              if (
                                currentSaved &&
                                (currentSaved.title !== updated.title ||
                                  currentSaved.country !== updated.country ||
                                  currentSaved.city !== updated.city ||
                                  currentSaved.district !== updated.district ||
                                  currentSaved.fullAddress !== updated.fullAddress)
                              ) {
                                setSelectedSavedId('__new__');
                              }
                            }
                          }}
                          error={submitted ? { ...addressErrors, ...addressServerErrors } : undefined}
                          showTitle
                          required
                          disabled={busy}
                          reserveMessageSpace
                          titleMessageLines={3}
                        />
                        {isNewAddress && (
                          <label className="checkbox">
                            <input type="checkbox" checked={saveAddress} disabled={busy}
                              onChange={(e) => { setSaveAddress(e.target.checked); setAddressServerErrors({}); }} />
                            <span>{t('address.saveToAccount')}</span>
                          </label>
                        )}
                      </>
                    )}
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
