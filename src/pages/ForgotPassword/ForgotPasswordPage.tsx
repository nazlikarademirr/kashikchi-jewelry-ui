import { AuthShell } from '@/components/AuthShell';
import { LinkButton } from '@/components/ui/Button';
import { Alert } from '@/components/ui/State';
import { ROUTES } from '@/constants/routes';
import { useI18n } from '@/contexts/I18nContext';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  useDocumentMeta({ title: t('auth.forgotMeta'), noindex: true });
  return (
    <AuthShell>
      <h1>{t('auth.forgotMeta')}</h1>
      <Alert kind="info">{t('auth.forgotSoon')}</Alert>
      <LinkButton to={ROUTES.login} variant="secondary" block>{t('auth.backToLogin')}</LinkButton>
    </AuthShell>
  );
}
