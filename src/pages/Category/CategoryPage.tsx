import { NavLink, useParams } from 'react-router-dom';
import { ProductListing } from '@/components/ProductListing';
import { Breadcrumb } from '@/components/ui/Misc';
import { LinkButton } from '@/components/ui/Button';
import { EmptyState, Spinner } from '@/components/ui/State';
import { ROUTES } from '@/constants/routes';
import { useCategories } from '@/contexts/CategoriesContext';
import { useI18n } from '@/contexts/I18nContext';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';

export default function CategoryPage() {
  const { category = '', subCategory } = useParams();
  const { t, loc } = useI18n();
  const { findTop, findSub, loading } = useCategories();
  const top = findTop(category);
  const sub = subCategory ? findSub(category, subCategory) : undefined;
  const title = sub ? `${loc(top?.name)} · ${loc(sub.name)}` : top ? loc(top.name) : t('listing.allTitle');
  const description = t('listing.categoryDescription', { name: sub ? loc(sub.name) : loc(top?.name) });

  useDocumentMeta({ title, description, noindex: !loading && (!top || (Boolean(subCategory) && !sub)) });

  if (loading) return <Spinner />;
  if (!top || (subCategory && !sub)) {
    return (
      <div className="container section">
        <EmptyState
          icon="search"
          title={t('listing.categoryNotFound')}
          description={t('listing.categoryNotFoundText')}
          action={<LinkButton to={ROUTES.products}>{t('nav.allProducts')}</LinkButton>}
        />
      </div>
    );
  }

  return (
    <>
      <div className="page-head">
        <div className="container">
          <Breadcrumb
            items={[
              { label: t('nav.home'), to: ROUTES.home },
              { label: loc(top.name), to: ROUTES.category(top.id) },
              ...(sub ? [{ label: loc(sub.name) }] : []),
            ]}
          />
          <h1>{sub ? loc(sub.name) : loc(top.name)}</h1>
          <p>{description}</p>
        </div>
      </div>
      <div className="container section section--tight">
        {top.children.length > 0 && (
          <nav className="chips" aria-label={t('listing.subCategories')}>
            <NavLink to={ROUTES.category(top.id)} end className={({ isActive }) => `chip ${isActive ? 'active' : ''}`}>
              {t('listing.all')}
            </NavLink>
            {top.children.map((s) => (
              <NavLink key={s.id} to={ROUTES.category(top.id, s.id)} className={({ isActive }) => `chip ${isActive ? 'active' : ''}`}>
                {loc(s.name)}
              </NavLink>
            ))}
          </nav>
        )}
        <ProductListing category={top.id} subCategory={sub?.id} />
      </div>
    </>
  );
}
