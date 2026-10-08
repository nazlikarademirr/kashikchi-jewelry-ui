import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ImageGallery, QuantityStepper } from '@/components/ImageGallery';
import { FavoriteButton, PriceTag, StockBadge } from '@/components/product';
import { Button, LinkButton } from '@/components/ui/Button';
import { Textarea, Input } from '@/components/ui/Input';
import { Breadcrumb } from '@/components/ui/Misc';
import { Modal } from '@/components/ui/Modal';
import { ErrorState, Skeleton } from '@/components/ui/State';
import { MAX_CART_QUANTITY } from '@/constants';
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
import { finalPrice } from '@/utils/format';
import { mediaUrl } from '@/utils/media';

const NOTE_MAX = 1000;

export default function ProductDetailPage() {
  const { id = '' } = useParams();
  const { t, loc, errorMessage } = useI18n();
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

  const name = product ? loc(product.name) : '';
  const description = product ? loc(product.description) : '';
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
      <div className="container section">
        <div className="product-detail" role="status" aria-label={t('common.loading')}>
          <Skeleton style={{ aspectRatio: '4/5', borderRadius: 18 }} />
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
      <div className="container section">
        <ErrorState error={error} onRetry={reload} />
      </div>
    );
  }

  const top = findTop(product.category);
  const sub = product.subCategory ? findSub(product.category, product.subCategory) : undefined;
  const maxQty = product.stock > 0 ? Math.min(product.stock, MAX_CART_QUANTITY) : MAX_CART_QUANTITY;
  const isRing = product.category === 'yuzuk';

  const addToCart = async (customizationNote?: string) => {
    if (!requireCustomer()) return false;
    setAdding(true);
    try {
      await cart.add({ productId: product.id, quantity, customizationNote });
      toast.success('cart.added');
      return true;
    } catch (e) {
      toast.error(errorMessage(e));
      return false;
    } finally {
      setAdding(false);
    }
  };

  const submitCustom = async () => {
    const parts = [ringSize.trim() && `${t('product.ringSize')}: ${ringSize.trim()}`, note.trim()].filter(Boolean);
    const ok = await addToCart(parts.join('\n'));
    if (ok) setCustomOpen(false);
  };

  return (
    <div className="container section section--tight">
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
            <div>
              <h1>{name}</h1>
              <p className="product-info__code">
                {t('product.code')}: {product.code}
              </p>
            </div>
            <FavoriteButton productId={product.id} large />
          </div>

          <div className="row" style={{ gap: 'var(--space-4)' }}>
            <PriceTag product={product} large />
            <StockBadge stock={product.stock} />
          </div>

          <p style={{ marginTop: 'var(--space-5)', color: 'var(--text-muted)' }}>{description}</p>


          {product.stock <= 0 && (
            <div className="notice" role="note">
              <span>{t('product.madeToOrderNote')}</span>
            </div>
          )}

          <div className="product-info__actions">
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
            <Button onClick={submitCustom} loading={adding}>
              {t('product.addCustomToCart')}
            </Button>
          </>
        }
      >
        <p className="muted">{t('product.customizeHelp')}</p>
        <div className="form-grid">
          {isRing && (
            <Input
              label={t('product.ringSize')}
              value={ringSize}
              onChange={(e) => setRingSize(e.target.value)}
              maxLength={10}
              hint={t('product.ringSizeHint')}
            />
          )}
          <Textarea
            data-autofocus
            label={t('product.customizationNote')}
            value={note}
            maxLength={NOTE_MAX}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('product.customizationPlaceholder')}
            hint={`${note.length}/${NOTE_MAX}`}
          />
        </div>
      </Modal>
    </div>
  );
}
