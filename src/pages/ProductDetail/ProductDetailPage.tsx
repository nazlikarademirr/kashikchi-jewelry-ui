import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ImageGallery, QuantityStepper } from '@/components/ImageGallery';
import { FavoriteButton, PriceTag } from '@/components/product';
import { Button, LinkButton } from '@/components/ui/Button';
import { Textarea, Input } from '@/components/ui/Input';
import { Breadcrumb } from '@/components/ui/Misc';
import { Modal } from '@/components/ui/Modal';
import { ErrorState, Skeleton } from '@/components/ui/State';
import { INPUT_LIMITS, LOW_STOCK_THRESHOLD, MAX_CART_QUANTITY } from '@/constants';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useCategories } from '@/contexts/CategoriesContext';
import { useI18n } from '@/contexts/I18nContext';
import { useToast } from '@/contexts/ToastContext';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { useRequireCustomer } from '@/hooks/useRequireCustomer';
import { services } from '@/services';
import { isAppError } from '@/types';
import { finalPrice } from '@/utils/format';
import { mediaUrl } from '@/utils/media';

const NOTE_MAX = INPUT_LIMITS.note;

export default function ProductDetailPage() {
  const { id = '' } = useParams();
  const { t, loc, locale, carat, errorMessage } = useI18n();
  const { findTop, findSub } = useCategories();
  const { isAdmin } = useAuth();
  const cart = useCart();
  const toast = useToast();
  const requireCustomer = useRequireCustomer();
  const { data: product, error, loading, reload } = useAsync(() => services.products.get(id), [id]);

  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [note, setNote] = useState('');
  const [ringSize, setRingSize] = useState('');
  const noteRef = useRef<HTMLTextAreaElement | null>(null);

  const adjustNoteHeight = useCallback(() => {
    const el = noteRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const borderOffset = el.offsetHeight - el.clientHeight;
    el.style.height = `${Math.max(76, el.scrollHeight + borderOffset)}px`;
  }, []);

  useEffect(() => {
    if (customOpen) {
      requestAnimationFrame(() => adjustNoteHeight());
    }
  }, [customOpen, adjustNoteHeight]);

  useEffect(() => {
    adjustNoteHeight();
    window.addEventListener('resize', adjustNoteHeight);
    return () => window.removeEventListener('resize', adjustNoteHeight);
  }, [note, adjustNoteHeight]);

  const name = product ? loc(product.name) : '';
  const description = product ? loc(product.description) : '';
  const extraFeatures = product?.extraFeatures ?? [];
  useDocumentMeta({
    title: product ? name : t('product.metaFallback'),
    description: description.slice(0, 155),
    image: product?.images[0] ? mediaUrl(product.images[0].storageKey) : undefined,
    noindex: !product || !product.isActive,
    jsonLd: product
      ? {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name,
          sku: product.code,
          description,
          image: product.images.map((i) => mediaUrl(i.storageKey)),
          offers: {
            '@type': 'Offer',
            priceCurrency: 'USD',
            price: finalPrice(product),
            availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
          },
        }
      : undefined,
  });

  if (loading) {
    return (
      <div className="container product-detail-page">
        <div className="product-detail" role="status" aria-label={t('common.loading')}>
          <Skeleton style={{ aspectRatio: '1/1', borderRadius: 18 }} />
          <div>
            <Skeleton className="skeleton--title" />
            <Skeleton className="skeleton--text" style={{ width: '30%' }} />
            <Skeleton className="skeleton--text" style={{ height: 90, marginTop: 24 }} />
          </div>
        </div>
      </div>
    );
  }
  if (error || !product) {
    return (
      <div className="container product-detail-page">
        <ErrorState error={error} onRetry={reload} />
      </div>
    );
  }

  const top = findTop(product.category);
  const sub = product.subCategory ? findSub(product.category, product.subCategory) : undefined;
  const maxQty = MAX_CART_QUANTITY;
  const isRing = product.category === 'yuzuk';

  const isNoteOverLimit = note.length > NOTE_MAX;
  const noteError = isNoteOverLimit ? t('validation.maxLength', { max: NOTE_MAX }) : null;

  const addToCart = async (customizationNote?: string) => {
    if (!requireCustomer()) return false;
    setAdding(true);
    try {
      await cart.add({ productId: product.id, quantity, customizationNote });
      toast.success('cart.added');
      return true;
    } catch (e) {
      if (isAppError(e) && e.fieldErrors?.customizationNote) {
        toast.error(t('validation.maxLength', { max: NOTE_MAX }));
      } else {
        toast.error(errorMessage(e));
      }
      return false;
    } finally {
      setAdding(false);
    }
  };

  const submitCustom = async () => {
    if (isNoteOverLimit) return;
    const parts = [ringSize.trim() && `${t('product.ringSize')}: ${ringSize.trim()}`, note.trim()].filter(Boolean);
    const ok = await addToCart(parts.join('\n'));
    if (ok) setCustomOpen(false);
  };

  return (
    <div className="container product-detail-page">
      <Breadcrumb
        items={[
          { label: t('nav.home'), to: ROUTES.home },
          ...(top ? [{ label: loc(top.name), to: ROUTES.category(top.id) }] : []),
          ...(top && sub ? [{ label: loc(sub.name), to: ROUTES.category(top.id, sub.id) }] : []),
          { label: name },
        ]}
      />
      <div className="product-detail">
        <ImageGallery product={product} />

        <div className="product-info">
          <div className="row row--between" style={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}>
            <div style={{ minWidth: 0, flex: 1, paddingRight: 'var(--space-3)' }}>
              <h1>{name}</h1>
            </div>
            <FavoriteButton productId={product.id} large />
          </div>

          <p className="product-info__code">
            {t('product.code')}: {product.code}
          </p>

          <div className="row" style={{ gap: 'var(--space-4)' }}>
            <PriceTag product={product} large />
          </div>

          <div className="product-info__details">
            <span className="product-info__detail">
              <strong>{product.stock <= 0
                ? t('product.madeToOrder')
                : product.stock <= LOW_STOCK_THRESHOLD
                ? t('product.lowStock', { n: product.stock })
                : t('product.inStock')}</strong>
            </span>
            {product.goldKarat && (
              <span className="product-info__detail">
                <span className="muted">{t('product.goldKarat')}</span>
                <strong>{product.goldKarat}</strong>
              </span>
            )}
            {product.carat != null && product.carat > 0 && (
              <span className="product-info__detail">
                <span className="muted">{t('product.carat')}</span>
                <strong>{carat(product.carat)} {t('product.caratUnit')}</strong>
              </span>
            )}
            {product.weightGrams != null && (
              <span className="product-info__detail"><span className="muted">{t('product.weight')}</span><strong>{new Intl.NumberFormat(locale, { maximumFractionDigits: 3 }).format(product.weightGrams)} g</strong></span>
            )}
            {product.metal && (
              <span className="product-info__detail"><span className="muted">{t('product.metal')}</span><strong>{product.metal}</strong></span>
            )}
            {product.diamondColor && (
              <span className="product-info__detail"><span className="muted">{t('product.diamondColor')}</span><strong>{product.diamondColor}</strong></span>
            )}
            {product.diamondClarity && (
              <span className="product-info__detail"><span className="muted">{t('product.diamondClarity')}</span><strong>{product.diamondClarity}</strong></span>
            )}
            {extraFeatures.map((feature, index) => (
              <span className="product-info__detail product-info__detail--extra" key={`${feature.name}-${index}`}>
                <span className="muted">{feature.name}</span>
                <strong>{feature.detail}</strong>
              </span>
            ))}
          </div>

          {description && <hr className="product-info__divider" />}
          {description && (
            <p className="product-info__description">
              {description}
            </p>
          )}



          <div className="product-info__actions">
            {!isAdmin && product.stock <= 0 && (
              <div className="notice" role="note">
                <span>{t('product.madeToOrderNote')}</span>
              </div>
            )}
            {isAdmin ? (
              <LinkButton to={ROUTES.adminProductEdit(product.id)} variant="secondary" block>
                {t('admin.products.edit')}
              </LinkButton>
            ) : (
              <>
                <div className="product-info__buy">
                  <QuantityStepper value={quantity} max={maxQty} onChange={setQuantity} label={t('cart.quantity')} />
                  <Button size="lg" onClick={() => addToCart()} loading={adding}>
                    {t('product.addToCart')}
                  </Button>
                </div>
                <Button variant="secondary" size="lg" block onClick={() => (requireCustomer() ? setCustomOpen(true) : undefined)}>
                  {t('product.customize')}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <Modal
        open={customOpen}
        title={t('product.customizeTitle')}
        onClose={() => setCustomOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCustomOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={submitCustom} loading={adding} disabled={isNoteOverLimit}>
              {t('product.addCustomToCart')}
            </Button>
          </>
        }
      >
        <p className="muted customize-modal__help">{t('product.customizeHelp')}</p>
        <div className="form-grid">
          {isRing && (
            <Input
              label={t('product.ringSize')}
              value={ringSize}
              onChange={(e) => setRingSize(e.target.value)}
              maxLength={INPUT_LIMITS.ringSize}
              hint={t('product.ringSizeHint')}
            />
          )}
          <Textarea
            ref={noteRef}
            data-autofocus
            label={t('product.customizationNote')}
            value={note}
            error={noteError}
            reserveMessageSpace={false}
            className="customize-note-input"
            onChange={(e) => {
              setNote(e.target.value);
              e.target.style.height = 'auto';
              const borderOffset = e.target.offsetHeight - e.target.clientHeight;
              e.target.style.height = `${Math.max(76, e.target.scrollHeight + borderOffset)}px`;
            }}
            placeholder={t('product.customizationPlaceholder')}
          />
        </div>
      </Modal>
    </div>
  );
}
