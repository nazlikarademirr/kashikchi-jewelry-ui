import type { ReactNode } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import type { AppError } from '@/types';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';

export function EmptyState({
  icon = 'inbox',
  title,
  description,
  action,
}: {
  icon?: IconName;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="state" role="status">
      <div className="state__icon">
        <Icon name={icon} />
      </div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error?: AppError | null; onRetry?: () => void }) {
  const { t, tError } = useI18n();
  return (
    <div className="state state--error" role="alert">
      <div className="state__icon">
        <Icon name="alert" />
      </div>
      <h3>{t('common.errorTitle')}</h3>
      <p>{error ? tError(error.code) : t('errors.UNKNOWN')}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          {t('common.retry')}
        </Button>
      )}
    </div>
  );
}

export function Spinner() {
  const { t } = useI18n();
  return (
    <div className="row" role="status" style={{ justifyContent: 'center', padding: 48 }}>
      <span className="btn__spinner" style={{ color: 'var(--primary-text)', width: 28, height: 28 }} aria-hidden="true" />
      <span className="sr-only">{t('common.loading')}</span>
    </div>
  );
}

export function Skeleton({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return <span className={`skeleton ${className}`} style={style} aria-hidden="true" />;
}

export function ProductCardSkeleton() {
  return (
    <div className="product-card" aria-hidden="true">
      <Skeleton className="skeleton--media" />
      <div className="product-card__body">
        <Skeleton className="skeleton--text" style={{ width: '40%' }} />
        <Skeleton className="skeleton--title" />
        <Skeleton className="skeleton--text" style={{ width: '50%' }} />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  const { t } = useI18n();
  return (
    <div className="product-grid" role="status" aria-label={t('common.loading')}>
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function Alert({ kind, children }: { kind: 'error' | 'success' | 'info' | 'warning'; children: ReactNode }) {
  return (
    <div className={`alert alert--${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}
