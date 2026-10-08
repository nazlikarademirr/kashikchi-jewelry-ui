import { ProductGrid } from '@/components/product';
import { LinkButton } from '@/components/ui/Button';
import { EmptyState, ErrorState, ProductGridSkeleton } from '@/components/ui/State';
import { ROUTES } from '@/constants/routes';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useI18n } from '@/contexts/I18nContext';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { services } from '@/services';

export default function FavoritesPage() {
  const { t } = useI18n();
  const { ids } = useFavorites();
  
  const { data, error, loading, reload } = useAsync(() => services.favorites.list(), [ids.size]);
  useDocumentMeta({ title: t('favorites.title'), noindex: true });

  return (
    <>
      <div className="page-head">
        <div className="container">
          <h1>{t('favorites.title')}</h1>
          <p>{t('favorites.subtitle')}</p>
        </div>
      </div>
      <div className="container section section--tight">
        {loading && !data ? (
          <ProductGridSkeleton count={4} />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : data && data.length === 0 ? (
          <EmptyState
            icon="heart"
            title={t('favorites.emptyTitle')}
            description={t('favorites.emptyText')}
            action={<LinkButton to={ROUTES.products}>{t('cart.continueShopping')}</LinkButton>}
          />
        ) : (
          data && <ProductGrid products={data} />
        )}
      </div>
    </>
  );
}
