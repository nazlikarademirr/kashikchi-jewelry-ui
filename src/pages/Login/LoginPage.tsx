import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AuthShell } from '@/components/AuthShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { INPUT_LIMITS } from '@/constants';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useToast } from '@/contexts/ToastContext';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { isAppError } from '@/types';
import { v } from '@/utils/validation';

export default function LoginPage() {
  const { t, tDynamic, errorMessage } = useI18n();
  const { login } = useAuth();
  const toast = useToast();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverErrorCode, setServerErrorCode] = useState<string | null>(null);
  const [showForgot, setShowForgot] = useState(false);
  useDocumentMeta({ title: t('auth.loginMeta'), noindex: true });

  const identifierVal = identifier.trim();
  const identifierError = !identifierVal
    ? 'validation.required'
    : identifierVal.includes('@')
    ? v.email(identifierVal)
    : null;
  const passwordError = v.required(password);

  const clearErrors = () => {
    if (serverError || serverErrorCode) {
      setServerError(null);
      setServerErrorCode(null);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    clearErrors();
    if (identifierError || passwordError) return;
    setBusy(true);
    try {
      await login({ email: identifierVal, password });
      toast.success('auth.loggedIn');
    } catch (err) {
      if (isAppError(err)) {
        setServerErrorCode(err.code);
        setServerError(errorMessage(err));
      } else {
        setServerErrorCode(null);
        setServerError(errorMessage(err));
      }
      setBusy(false);
    }
  };

  return (
    <AuthShell>
      <h1 style={{ marginBottom: 24 }}>{t('auth.loginTitle')}</h1>
      <form className="form-grid" onSubmit={submit} noValidate style={{ display: 'grid', gap: 0 }}>
        <Input
          label={t('auth.emailOrPhone')}
          type="text"
          autoComplete="username"
          required
          reserveMessageSpace={2}
          maxLength={INPUT_LIMITS.email}
          value={identifier}
          onChange={(e) => {
            setIdentifier(e.target.value);
            clearErrors();
          }}
          error={
            submitted && identifierError
              ? tDynamic(identifierError)
              : serverErrorCode === 'USER_NOT_FOUND'
              ? serverError
              : null
          }
        />
        <Input
          label={t('auth.password')}
          type="password"
          autoComplete="current-password"
          required
          reserveMessageSpace={2}
          maxLength={INPUT_LIMITS.password}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            clearErrors();
          }}
          error={
            submitted && passwordError
              ? tDynamic(passwordError)
              : serverErrorCode && serverErrorCode !== 'USER_NOT_FOUND'
              ? serverError
              : null
          }
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 0, marginBottom: showForgot ? 8 : 14 }}>
          <Button type="button" variant="ghost" size="sm" aria-expanded={showForgot} onClick={() => setShowForgot((s) => !s)} style={{ padding: '4px 8px', height: 'auto' }}>
            {t('auth.forgot')}
          </Button>
        </div>
        {showForgot && (
          <p className="muted" style={{ fontSize: '0.85rem', margin: '0 0 16px', textAlign: 'right' }}>
            {t('auth.forgotSoon')}
          </p>
        )}
        <Button type="submit" size="lg" block loading={busy}>
          {t('auth.loginSubmit')}
        </Button>
      </form>
      <p className="auth__foot">
        {t('auth.noAccount')} <Link to={ROUTES.register}>{t('auth.registerLink')}</Link>
      </p>
    </AuthShell>
  );
}
