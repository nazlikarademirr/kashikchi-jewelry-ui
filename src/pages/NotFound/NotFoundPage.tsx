import { LinkButton } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/State';
import { ROUTES } from '@/constants/routes';
import { useI18n } from '@/contexts/I18nContext';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';

export default function NotFoundPage() {
  const { t } = useI18n();
  useDocumentMeta({ title: t('notFound.title'), noindex: true });
  return (
    <div className="container section">
      <EmptyState
        icon="search"
        title={t('notFound.title')}
        description={t('notFound.text')}
        action={
          <div className="row" style={{ justifyContent: 'center' }}>
            <LinkButton to={ROUTES.home}>{t('common.backHome')}</LinkButton>
            <LinkButton to={ROUTES.products} variant="secondary">
              {t('notFound.browse')}
            </LinkButton>
          </div>
        }
      />
    </div>
  );
}
