import { Link } from 'react-router-dom';
import { useI18n } from '@/contexts/I18nContext';

export function Badge({
  kind = 'default',
  dot,
  children,
}: {
  kind?: 'default' | 'success' | 'warning' | 'danger' | 'primary' | 'info';
  dot?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span className={`badge ${kind !== 'default' ? `badge--${kind}` : ''}`}>
      {dot && <span className="badge__dot" aria-hidden="true" />}
      {children}
    </span>
  );
}

export interface Crumb {
  label: string;
  to?: string;
}

export function Breadcrumb({ items }: { items: Crumb[] }) {
  const { t } = useI18n();
  return (
    <nav aria-label={t('a11y.breadcrumb')}>
      <ol className="breadcrumb">
        {items.map((c, i) => (
          <li key={i} aria-current={i === items.length - 1 ? 'page' : undefined}>
            {c.to && i < items.length - 1 ? <Link to={c.to}>{c.label}</Link> : c.label}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function Pagination({
  page,
  pageSize,
  total,
  onChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onChange: (p: number) => void;
}) {
  const { t } = useI18n();
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) return null;
  return (
    <nav className="pagination" aria-label={t('a11y.pagination')}>
      <button type="button" onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label={t('common.prev')}>
        ‹
      </button>
      {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          aria-current={p === page ? 'page' : undefined}
          aria-label={t('a11y.pageN', { n: p })}
        >
          {p}
        </button>
      ))}
      <button type="button" onClick={() => onChange(page + 1)} disabled={page >= pages} aria-label={t('common.next')}>
        ›
      </button>
    </nav>
  );
}
