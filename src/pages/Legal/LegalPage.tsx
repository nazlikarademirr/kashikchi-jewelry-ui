import { useParams } from 'react-router-dom';
import { LinkButton } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/State';
import { Breadcrumb } from '@/components/ui/Misc';
import { LEGAL_DOCS, type LegalDoc } from '@/constants';
import { ROUTES } from '@/constants/routes';
import { useI18n } from '@/contexts/I18nContext';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';

const SECTIONS = ['s1', 's2', 's3'] as const;

function isLegalDoc(value: string | undefined): value is LegalDoc {
  return (LEGAL_DOCS as readonly string[]).includes(value ?? '');
}

export default function LegalPage() {
  const { doc } = useParams();
  const { t } = useI18n();
  const valid = isLegalDoc(doc);
  useDocumentMeta({
    title: valid ? t(`legal.${doc}.title`) : t('legal.notFoundTitle'),
    description: valid ? t(`legal.${doc}.intro`) : undefined,
  });

  if (!valid) {
    return (
      <div className="container section">
        <EmptyState
          icon="alert"
          title={t('legal.notFoundTitle')}
          action={<LinkButton to={ROUTES.home}>{t('common.backHome')}</LinkButton>}
        />
      </div>
    );
  }

  return (
    <>
      <div className="page-head">
        <div className="container">
          <Breadcrumb items={[{ label: t('nav.home'), to: ROUTES.home }, { label: t(`legal.${doc}.title`) }]} />
          <h1>{t(`legal.${doc}.title`)}</h1>
        </div>
      </div>
      <div className="container section section--tight">
        <article className="legal">
          <p>{t(`legal.${doc}.intro`)}</p>
          {SECTIONS.map((s) => (
            <section key={s}>
              <h2>{t(`legal.${doc}.${s}Title`)}</h2>
              <p>{t(`legal.${doc}.${s}Text`)}</p>
            </section>
          ))}
        </article>
      </div>
    </>
  );
}
