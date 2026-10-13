import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthShell } from '@/components/AuthShell';
import { Button, LinkButton } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/State';
import { INPUT_LIMITS } from '@/constants';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useToast } from '@/contexts/ToastContext';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { isAppError } from '@/types';
import { v } from '@/utils/validation';

export default function LoginPage() {
  const location = useLocation();
  const { t, tDynamic, errorMessage } = useI18n();
  const { login } = useAuth();
  const toast = useToast();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverErrorCode, setServerErrorCode] = useState<string | null>(null);
  const [lockoutSeconds, setLockoutSeconds] = useState<number | null>(null);
  useDocumentMeta({ title: t('auth.loginMeta'), noindex: true });

  const isLockedOut = Boolean(lockoutSeconds !== null && lockoutSeconds > 0);

  // Kilitlenme durumunda saniyeyi geriye doğru sayma
  useEffect(() => {
    if (lockoutSeconds === null || lockoutSeconds <= 0) return;
    const interval = window.setInterval(() => {
      setLockoutSeconds((prev) => (prev !== null && prev > 1 ? prev - 1 : null));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [lockoutSeconds !== null && lockoutSeconds > 0]);

  useEffect(() => {
    if (lockoutSeconds === null && serverErrorCode === 'TOO_MANY_ATTEMPTS') {
      setServerError(null);
      setServerErrorCode(null);
    }
  }, [lockoutSeconds, serverErrorCode]);

  const identifierVal = identifier.trim();
  const identifierError = !identifierVal
    ? 'validation.required'
    : identifierVal.includes('@')
    ? v.email(identifierVal)
    : null;
  const passwordError = v.required(password);

  const clearErrors = () => {
    if (isLockedOut) return;
    if (serverError || serverErrorCode) {
      setServerError(null);
      setServerErrorCode(null);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (isLockedOut) return;
    setSubmitted(true);
    clearErrors();
    if (identifierError || passwordError) return;
    setBusy(true);
    try {
      await login({ email: identifierVal.toLowerCase(), password });
      toast.success('auth.loggedIn');
    } catch (err) {
      if (isAppError(err)) {
        setServerErrorCode(err.code);
        if (err.code === 'TOO_MANY_ATTEMPTS') {
          const secs = err.retryAfter && err.retryAfter > 0 ? err.retryAfter : 60;
          setLockoutSeconds(secs);
          setServerError(tDynamic('errors.TOO_MANY_ATTEMPTS', { seconds: secs }));
        } else {
          setLockoutSeconds(null);
          setServerError(errorMessage(err));
        }
      } else {
        setServerErrorCode(null);
        setLockoutSeconds(null);
        setServerError(errorMessage(err));
      }
      setBusy(false);
    }
  };

  return (
    <AuthShell>
      <h1 style={{ marginBottom: 24 }}>{t('auth.loginTitle')}</h1>
      {location.state?.sessionExpired && <Alert kind="warning">{t('auth.sessionExpired')}</Alert>}
      <form className="form-grid" onSubmit={submit} noValidate style={{ display: 'grid', gap: 0 }}>
        <Input
          label={t('auth.emailOrPhone')}
          type="text"
          autoComplete="username"
          required
          reserveMessageSpace={2}
          maxLength={INPUT_LIMITS.email}
          value={identifier}
          style={{ textTransform: 'lowercase' }}
          onChange={(e) => {
            setIdentifier(e.target.value.toLowerCase());
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
          reserveMessageSpace={1}
          maxLength={INPUT_LIMITS.password}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            clearErrors();
          }}
          error={
            submitted && passwordError
              ? tDynamic(passwordError)
              : serverErrorCode === 'TOO_MANY_ATTEMPTS' && isLockedOut
              ? tDynamic('errors.TOO_MANY_ATTEMPTS', { seconds: lockoutSeconds ?? 60 })
              : serverErrorCode && serverErrorCode !== 'USER_NOT_FOUND'
              ? serverError
              : null
          }
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4, marginBottom: 12 }}>
          <LinkButton
            to={ROUTES.forgotPassword}
            variant="ghost"
            size="sm"
            style={{ padding: '4px 8px', height: 'auto' }}
          >
            {t('auth.forgot')}
          </LinkButton>
        </div>
        <Button type="submit" size="lg" block loading={busy} disabled={isLockedOut}>
          {t('auth.loginSubmit')}
        </Button>
      </form>
      <p className="auth__foot">
        {t('auth.noAccount')} <Link to={ROUTES.register}>{t('auth.registerLink')}</Link>
      </p>
    </AuthShell>
  );
}
