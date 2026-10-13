import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthShell } from '@/components/AuthShell';
import { Button, LinkButton } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { INPUT_LIMITS } from '@/constants';
import { ROUTES } from '@/constants/routes';
import { useI18n } from '@/contexts/I18nContext';
import { useToast } from '@/contexts/ToastContext';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { services } from '@/services';
import { isAppError } from '@/types';
import { v } from '@/utils/validation';

export default function ResetPasswordPage() {
  const { t, tDynamic, errorMessage } = useI18n();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [passwordRepeat, setPasswordRepeat] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useDocumentMeta({ title: t('auth.resetMeta'), noindex: true });

  const isInvalidParams = !token || !email;

  const passwordError = v.password(password);
  const passwordRepeatError = v.passwordMatch(passwordRepeat, password);
  const hasErrors = Boolean(passwordError || passwordRepeatError);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setServerError(null);
    if (hasErrors || isInvalidParams) return;

    setBusy(true);
    try {
      await services.auth.resetPassword({
        email: email.trim().toLowerCase(),
        token,
        newPassword: password,
      });
      toast.success('auth.resetSuccessToast');
      navigate(ROUTES.login, { replace: true });
    } catch (err) {
      if (isAppError(err) && (err.code === 'INVALID_RESET_TOKEN' || err.fieldErrors?.token)) {
        setServerError(t('errors.INVALID_RESET_TOKEN'));
      } else {
        setServerError(errorMessage(err));
      }
      setBusy(false);
    }
  };

  return (
    <AuthShell>
      <h1 style={{ marginBottom: 12 }}>{isInvalidParams ? t('auth.resetInvalidTitle') : t('auth.resetTitle')}</h1>
      {isInvalidParams ? (
        <div style={{ display: 'grid', gap: 16 }}>
          <p className="muted" style={{ lineHeight: 1.6, fontSize: '0.95rem' }}>
            {t('errors.INVALID_RESET_TOKEN')}
          </p>
          <div style={{ marginTop: 8 }}>
            <LinkButton to={ROUTES.forgotPassword} size="lg" block>
              {t('auth.resetInvalidAction')}
            </LinkButton>
          </div>
          <p className="auth__foot" style={{ marginTop: 12 }}>
            <Link to={ROUTES.login}>{t('auth.backToLogin')}</Link>
          </p>
        </div>
      ) : (
        <>
          <p className="muted" style={{ lineHeight: 1.5, fontSize: '0.9rem', marginBottom: 24 }}>
            {t('auth.resetSubtitle')}
          </p>
          <form onSubmit={submit} noValidate style={{ display: 'grid', gap: 0 }}>
            <Input
              label={t('account.newPassword')}
              type="password"
              autoComplete="new-password"
              required
              autoFocus
              reserveMessageSpace
              maxLength={INPUT_LIMITS.password}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (serverError) setServerError(null);
              }}
              hint={t('auth.passwordHint')}
              error={submitted && passwordError ? tDynamic(passwordError) : null}
            />
            <Input
              label={t('account.confirmNewPassword')}
              type="password"
              autoComplete="new-password"
              required
              reserveMessageSpace={2}
              maxLength={INPUT_LIMITS.password}
              value={passwordRepeat}
              onChange={(e) => {
                setPasswordRepeat(e.target.value);
                if (serverError) setServerError(null);
              }}
              error={
                submitted && passwordRepeatError
                  ? tDynamic(passwordRepeatError)
                  : serverError
              }
            />
            <Button type="submit" size="lg" block loading={busy} style={{ marginTop: 8 }}>
              {t('auth.resetSubmit')}
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
