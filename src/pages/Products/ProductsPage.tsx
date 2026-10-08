import { ProductListing } from '@/components/ProductListing';
import { Breadcrumb } from '@/components/ui/Misc';
import { ROUTES } from '@/constants/routes';
import { useCategories } from '@/contexts/CategoriesContext';
import { useI18n } from '@/contexts/I18nContext';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { LinkButton } from '@/components/ui/Button';
import { Link } from 'react-router-dom';

export default function ProductsPage() {
  const { t, loc } = useI18n();
  const { tree } = useCategories();
  useDocumentMeta({ title: t('listing.allTitle'), description: t('listing.allDescription') });
  return (
    <>
      <div className="page-head">
        <div className="container">
          <Breadcrumb items={[{ label: t('nav.home'), to: ROUTES.home }, { label: t('nav.allProducts') }]} />
          <h1>{t('listing.allTitle')}</h1>
          <p>{t('listing.allDescription')}</p>
        </div>
      </div>
      <div className="container section--tight section">
        <div className="chips" role="list" aria-label={t('nav.categories')}>
          {tree.map((c) => (
            <Link key={c.id} className="chip" role="listitem" to={ROUTES.category(c.id)}>
              {loc(c.name)}
            </Link>
          ))}
        </div>
        <ProductListing />
        <noscript>
          <LinkButton to={ROUTES.home}>{t('common.backHome')}</LinkButton>
        </noscript>
      </div>
    </>
  );
}
