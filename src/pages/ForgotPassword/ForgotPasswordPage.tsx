import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AuthShell } from '@/components/AuthShell';
import { Button, LinkButton } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { INPUT_LIMITS } from '@/constants';
import { ROUTES } from '@/constants/routes';
import { useI18n } from '@/contexts/I18nContext';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { services } from '@/services';
import { v } from '@/utils/validation';

export default function ForgotPasswordPage() {
  const { t, tDynamic, errorMessage } = useI18n();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useDocumentMeta({ title: t('auth.forgotMeta'), noindex: true });

  const emailVal = email.trim();
  const emailError = v.email(emailVal);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setServerError(null);
    if (emailError) return;

    setBusy(true);
    try {
      await services.auth.forgotPassword(emailVal.toLowerCase());
      setSent(true);
    } catch (err) {
      setServerError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell cardClassName={sent ? 'auth__card--wide' : undefined}>
      {sent ? (
        <div style={{ display: 'grid', gap: 16 }}>
          <h1
            style={{
              fontSize: 'clamp(1.05rem, 2.5vw, 1.32rem)',
              whiteSpace: 'nowrap',
              marginBottom: 4,
              letterSpacing: '-0.01em',
            }}
          >
            {t('auth.forgotSuccessTitle')}
          </h1>
          <p className="muted" style={{ lineHeight: 1.6, fontSize: '0.95rem' }}>
            {t('auth.forgotSuccessMessage')}
          </p>
          <div style={{ marginTop: 8 }}>
            <LinkButton to={ROUTES.login} size="lg" block>
              {t('auth.backToLogin')}
            </LinkButton>
          </div>
        </div>
      ) : (
        <>
          <h1 style={{ marginBottom: 12 }}>{t('auth.forgotTitle')}</h1>
          <p className="muted" style={{ lineHeight: 1.5, fontSize: '0.9rem', marginBottom: 24 }}>
            {t('auth.forgotSubtitle')}
          </p>
          <form onSubmit={submit} noValidate style={{ display: 'grid', gap: 0 }}>
            <Input
              label={t('auth.email')}
              type="email"
              autoComplete="email"
              required
              autoFocus
              reserveMessageSpace={2}
              maxLength={INPUT_LIMITS.email}
              value={email}
              style={{ textTransform: 'lowercase' }}
              onChange={(e) => {
                setEmail(e.target.value.toLowerCase());
                if (serverError) setServerError(null);
              }}
              onBlur={() => setEmail((e) => e.trim().toLowerCase())}
              error={submitted && emailError ? tDynamic(emailError) : serverError}
            />
            <Button type="submit" size="lg" block loading={busy} style={{ marginTop: 8 }}>
              {t('auth.forgotSubmit')}
            </Button>
          </form>
          <p className="auth__foot" style={{ marginTop: 24 }}>
            <Link to={ROUTES.login}>{t('auth.backToLogin')}</Link>
          </p>
        </>
      )}
    </AuthShell>
  );
}
