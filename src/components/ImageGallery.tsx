import { useLayoutEffect, useRef, useState } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import type { Product } from '@/types';
import { mediaUrl } from '@/utils/media';
import { Icon } from './ui/Icon';

function ImageZoom({ src, alt, onError }: { src: string; alt: string; onError: () => void }) {
  const { t } = useI18n();
  const [scale, setScale] = useState(1);
  const viewport = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  useLayoutEffect(() => {
    const node = viewport.current;
    if (node) {
      node.scrollLeft = (node.scrollWidth - node.clientWidth) / 2;
      node.scrollTop = (node.scrollHeight - node.clientHeight) / 2;
    }
  }, [scale]);
  return (
    <>
      <div className="gallery__zoom-controls">
        <button type="button" className="icon-btn" disabled={scale <= 1} onClick={() => setScale((s) => s - 0.5)} aria-label={t('product.zoomOut')}>−</button>
        <button type="button" className="icon-btn" disabled={scale >= 3} onClick={() => setScale((s) => s + 0.5)} aria-label={t('product.zoomIn')}>+</button>
      </div>
      <div
        ref={viewport}
        className={`image-zoom__viewport ${scale > 1 ? 'image-zoom__viewport--enlarged' : ''}`}
        onDoubleClick={() => setScale((s) => s === 1 ? 2 : 1)}
        onPointerDown={(e) => {
          if (scale <= 1) return;
          drag.current = { x: e.clientX, y: e.clientY, left: e.currentTarget.scrollLeft, top: e.currentTarget.scrollTop };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          e.currentTarget.scrollLeft = drag.current.left - (e.clientX - drag.current.x);
          e.currentTarget.scrollTop = drag.current.top - (e.clientY - drag.current.y);
        }}
        onPointerUp={() => { drag.current = null; }}
        onPointerCancel={() => { drag.current = null; }}
        onLostPointerCapture={() => { drag.current = null; }}
      >
        <div className="image-zoom__canvas" style={{ width: `${scale * 100}%`, height: `${scale * 100}%` }}>
          <img src={src} alt={alt} draggable={false} onError={onError} decoding="async" />
        </div>
      </div>
    </>
  );
}

export function ImageGallery({ product }: { product: Product }) {
  const { t, loc } = useI18n();
  const [index, setIndex] = useState(0);
  const [failedKeys, setFailedKeys] = useState<Record<string, boolean>>({});
  const [fallbackUrls, setFallbackUrls] = useState<Record<string, string>>({});
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const images = product.images;
  const name = loc(product.name);
  if (images.length === 0) {
    return (
      <div className="gallery" role="group" aria-label={t('product.gallery')}>
        <div className="gallery__main" aria-hidden="true">
          <div className="gallery__placeholder">
            <Icon name="image" size={40} style={{ opacity: 0.4 }} />
            <span>{t('product.comingSoon')}</span>
          </div>
        </div>
      </div>
    );
  }
  const current = images[Math.min(index, images.length - 1)];
  const go = (d: number) => setIndex((i) => (i + d + images.length) % images.length);

  const getSrc = (storageKey: string) => fallbackUrls[storageKey] || mediaUrl(storageKey);

  const handleImgError = (storageKey: string) => {
    const activeSrc = getSrc(storageKey);
    if (activeSrc && !activeSrc.startsWith('/images/')) {
      setFallbackUrls((prev) => ({ ...prev, [storageKey]: `/images/${storageKey}` }));
    } else {
      setFailedKeys((prev) => ({ ...prev, [storageKey]: true }));
    }
  };

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
      <div
        className="gallery__main"
        onTouchStart={(e) => {
          if (e.touches.length === 1) {
            touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          }
        }}
        onTouchEnd={(e) => {
          if (!touchStart.current || images.length <= 1) return;
          const touchEnd = e.changedTouches[0];
          const dx = touchEnd.clientX - touchStart.current.x;
          const dy = touchEnd.clientY - touchStart.current.y;
          touchStart.current = null;
          if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
            if (dx < 0) go(1);
            else go(-1);
          }
        }}
      >
        {!failedKeys[current.storageKey] ? (
          <ImageZoom
            key={current.id}
            src={getSrc(current.storageKey)}
            alt={t('product.imageN', { name, n: index + 1, total: images.length })}
            onError={() => handleImgError(current.storageKey)}
          />
        ) : (
          <div className="gallery__placeholder">
            <Icon name="image" size={40} style={{ opacity: 0.4 }} />
            <span>{t('product.comingSoon')}</span>
          </div>
        )}
        {images.length > 1 && (
          <>
            <button type="button" className="gallery__nav gallery__nav--prev" onClick={() => go(-1)} aria-label={t('common.prev')}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 3 8 12l7 9" /></svg>
            </button>
            <button type="button" className="gallery__nav gallery__nav--next" onClick={() => go(1)} aria-label={t('common.next')}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 3 7 9-7 9" /></svg>
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
              <img
                src={getSrc(img.storageKey)}
                alt=""
                loading="lazy"
                width={120}
                height={120}
                onError={() => handleImgError(img.storageKey)}
              />
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
