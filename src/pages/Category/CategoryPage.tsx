import { useParams } from 'react-router-dom';
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
  const title = sub ? `${loc(top?.name, top ? `category:${top.id}` : undefined)} · ${loc(sub.name, `category:${sub.id}`)}` : top ? loc(top.name, `category:${top.id}`) : t('listing.allTitle');
  const description = t('listing.categoryDescription', { name: sub ? loc(sub.name, `category:${sub.id}`) : loc(top?.name, top ? `category:${top.id}` : undefined) });

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
              { label: loc(top.name, `category:${top.id}`), to: ROUTES.category(top.id) },
              ...(sub ? [{ label: loc(sub.name, `category:${sub.id}`) }] : []),
            ]}
          />
          <h1>{sub ? loc(sub.name, `category:${sub.id}`) : loc(top.name, `category:${top.id}`)}</h1>
        </div>
      </div>
      <div className="container section section--tight catalog-section">
        <ProductListing category={top.id} subCategory={sub?.id} />
      </div>
    </>
  );
}
