import { useState } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import type { Product } from '@/types';
import { mediaUrl } from '@/utils/media';
import { Icon } from './ui/Icon';

export function ImageGallery({ product }: { product: Product }) {
  const { t, loc } = useI18n();
  const [index, setIndex] = useState(0);
  const images = product.images;
  const name = loc(product.name);
  if (images.length === 0) return (
    <div className="gallery__main" aria-hidden="true" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--surface)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', aspectRatio: '4/5', borderRadius: 'var(--r-control)' }}>
      {t('product.comingSoon')}
    </div>
  );
  const current = images[Math.min(index, images.length - 1)];
  const go = (d: number) => setIndex((i) => (i + d + images.length) % images.length);

  return (
    <div
      className="gallery"
      role="group"
      aria-roledescription="carousel"
      aria-label={t('product.gallery')}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') go(-1);
        if (e.key === 'ArrowRight') go(1);
      }}
    >
      <div className="gallery__main">
        <img
          key={current.id}
          className="fade-in"
          src={mediaUrl(current.storageKey)}
          alt={t('product.imageN', { name, n: index + 1, total: images.length })}
          width={800}
          height={1000}
          decoding="async"
        />
        {images.length > 1 && (
          <>
            <button type="button" className="gallery__nav gallery__nav--prev" onClick={() => go(-1)} aria-label={t('common.prev')}>
              <Icon name="arrowLeft" size={18} />
            </button>
            <button type="button" className="gallery__nav gallery__nav--next" onClick={() => go(1)} aria-label={t('common.next')}>
              <Icon name="arrowRight" size={18} />
            </button>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="gallery__thumbs">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              className="gallery__thumb"
              aria-current={i === index}
              aria-label={t('product.showImage', { n: i + 1 })}
              onClick={() => setIndex(i)}
            >
              <img src={mediaUrl(img.storageKey)} alt="" loading="lazy" width={84} height={84} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function QuantityStepper({
  value,
  min = 1,
  max,
  onChange,
  disabled,
  label,
}: {
  value: number;
  min?: number;
  max: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  label: string;
}) {
  const { t } = useI18n();
  return (
    <div className="qty" role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(value - 1)} disabled={disabled || value <= min} aria-label={t('cart.decrease')}>
        −
      </button>
      <output aria-live="polite">{value}</output>
      <button type="button" onClick={() => onChange(value + 1)} disabled={disabled || value >= max} aria-label={t('cart.increase')}>
        +
      </button>
    </div>
  );
}
