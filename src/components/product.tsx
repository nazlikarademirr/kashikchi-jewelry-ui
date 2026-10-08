import { memo } from 'react';
import { Link } from 'react-router-dom';
import { LOW_STOCK_THRESHOLD, ORDER_STATUS_I18N } from '@/constants';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useI18n } from '@/contexts/I18nContext';
import { useRequireCustomer } from '@/hooks/useRequireCustomer';
import type { OrderStatus, Product } from '@/types';
import { finalPrice } from '@/utils/format';
import { mediaUrl } from '@/utils/media';
import { Icon } from './ui/Icon';
import { Badge } from './ui/Misc';

export function FavoriteButton({ productId, large }: { productId: string; large?: boolean }) {
  const { t } = useI18n();
  const { isAdmin } = useAuth();
  const { has, toggle } = useFavorites();
  const requireCustomer = useRequireCustomer();
  if (isAdmin) return null; 
  const active = has(productId);
  return (
    <button
      type="button"
      className={`fav-btn ${large ? 'fav-btn--lg' : ''}`}
      aria-pressed={active}
      aria-label={active ? t('favorites.remove') : t('favorites.add')}
      onClick={() => {
        if (requireCustomer()) void toggle(productId);
      }}
    >
      <Icon name="heart" />
    </button>
  );
}

export function StockBadge({ stock }: { stock: number }) {
  const { t } = useI18n();
  if (stock <= 0) return <Badge kind="warning" dot>{t('product.madeToOrder')}</Badge>;
  if (stock <= LOW_STOCK_THRESHOLD) return <Badge kind="warning" dot>{t('product.lowStock', { n: stock })}</Badge>;
  return <Badge kind="success" dot>{t('product.inStock')}</Badge>;
}

const STATUS_KIND: Record<OrderStatus, 'info' | 'warning' | 'success'> = {
  ORDER_RECEIVED: 'info',
  IN_PRODUCTION: 'warning',
  READY: 'success',
};
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useI18n();
  return <Badge kind={STATUS_KIND[status]} dot>{t(ORDER_STATUS_I18N[status])}</Badge>;
}

export function PriceTag({ product, large }: { product: Pick<Product, 'price' | 'discount'>; large?: boolean }) {
  const { price } = useI18n();
  const final = finalPrice(product);
  return (
    <span className={`price ${large ? 'price--lg' : ''}`}>
      <span className="price__current">{price(final)}</span>
      {product.discount > 0 && (
        <>
          <s className="price__old">{price(product.price)}</s>
        </>
      )}
    </span>
  );
}

export const ProductCard = memo(function ProductCard({ product, priority }: { product: Product; priority?: boolean }) {
  const { loc, carat, t } = useI18n();
  const img = product.images[0];
  const name = loc(product.name);
  return (
    <article className="product-card">
      <div className="product-card__fav">
        <FavoriteButton productId={product.id} />
      </div>
      <Link to={ROUTES.product(product.slug)} className="product-card__link" aria-label={name}>
        <div className="product-card__media">
          {img ? (
            <img
              src={mediaUrl(img.storageKey)}
              alt={name}
              width={640}
              height={800}
              loading={priority ? 'eager' : 'lazy'}
              decoding="async"
            />
          ) : (
            <div className="product-card__placeholder">
              <span>{t('product.comingSoon')}</span>
            </div>
          )}
          <div className="product-card__tags">
            {product.discount > 0 && <Badge kind="danger">-%{product.discount}</Badge>}
            {product.stock <= 0 && <Badge kind="warning">{t('product.madeToOrder')}</Badge>}
            {!product.isActive && <Badge>{t('product.inactive')}</Badge>}
          </div>
        </div>
        <div className="product-card__body">
          <span className="product-card__meta">{product.code}</span>
          <h3 className="product-card__name">
            {name}
            {Boolean(product.carat && product.carat > 0) && ` · ${carat(product.carat)} ct`}
          </h3>
          <PriceTag product={product} />
        </div>
      </Link>
    </article>
  );
});

export function ProductGrid({ products, columns }: { products: Product[]; columns?: 3 }) {
  return (
    <div className={`product-grid ${columns === 3 ? 'product-grid--3' : ''}`}>
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < 4} />
      ))}
    </div>
  );
}
