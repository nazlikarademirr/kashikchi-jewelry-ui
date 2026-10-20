import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthShell } from '@/components/AuthShell';
import { GoogleSignIn } from '@/components/GoogleSignIn';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { Alert } from '@/components/ui/State';
import { INPUT_LIMITS } from '@/constants';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useToast } from '@/contexts/ToastContext';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { ForgotPasswordModal } from '@/components/ForgotPasswordModal';
import { AppError, isAppError } from '@/types';
import { getPostLoginRedirect } from '@/utils/navigation';
import { v } from '@/utils/validation';

export default function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, tDynamic, errorMessage } = useI18n();
  const { login } = useAuth();
  const toast = useToast();
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState<AppError | null>(null);
  const [lockoutSeconds, setLockoutSeconds] = useState<number | null>(null);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  useDocumentMeta({ title: t('auth.loginMeta'), noindex: true });

  const isLockedOut = Boolean(lockoutSeconds !== null && lockoutSeconds > 0);
  const visibleError = serverError?.code === 'TOO_MANY_ATTEMPTS' && !isLockedOut ? null : serverError;
  const serverErrorCode = visibleError?.code;
  const serverErrorText = visibleError ? errorMessage(visibleError) : null;

  // Kilitlenme durumunda saniyeyi geriye doğru sayma
  useEffect(() => {
    if (!isLockedOut) return;
    const interval = window.setInterval(() => {
      setLockoutSeconds((prev) => (prev !== null && prev > 1 ? prev - 1 : null));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isLockedOut]);

  const emailVal = email.trim();
  const phoneVal = phone.trim();
  const emailError = v.email(emailVal);
  const phoneError = v.phone(phoneVal);
  const identifierError = loginMethod === 'email' ? emailError : phoneError;
  const identifier = loginMethod === 'email' ? emailVal.toLowerCase() : phoneVal;
  const passwordError = v.required(password);

  const clearErrors = () => {
    if (isLockedOut) return;
    setServerError(null);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (isLockedOut) return;
    setSubmitted(true);
    clearErrors();
    if (identifierError || passwordError) return;
    setBusy(true);
    try {
      const u = await login({ email: identifier, password });
      toast.success('auth.loggedIn');
      const target = getPostLoginRedirect(location.state, u.role);
      navigate(target, { replace: true });
    } catch (err) {
      const failure = isAppError(err) ? err : new AppError('UNKNOWN');
      setServerError(failure);
      setLockoutSeconds(failure.code === 'TOO_MANY_ATTEMPTS'
        ? (failure.retryAfter && failure.retryAfter > 0 ? failure.retryAfter : 60)
        : null);
      setBusy(false);
    }
  };

  return (
    <AuthShell cardClassName="auth__card--login">
      <h1 style={{ marginBottom: 24 }}>{t('auth.loginTitle')}</h1>
      {location.state?.sessionExpired && <Alert kind="warning">{t('auth.sessionExpired')}</Alert>}
      <form className="form-grid" onSubmit={submit} noValidate style={{ display: 'grid', gap: 0 }}>
        <div className="login-method-group" role="radiogroup" aria-label={t('auth.loginMethod')}>
          <label className="login-method-option">
            <input
              type="radio"
              name="loginMethod"
              value="email"
              checked={loginMethod === 'email'}
              onChange={() => {
                setLoginMethod('email');
                clearErrors();
              }}
            />
            <span>{t('auth.loginWithEmail')}</span>
          </label>
          <label className="login-method-option">
            <input
              type="radio"
              name="loginMethod"
              value="phone"
              checked={loginMethod === 'phone'}
              onChange={() => {
                setLoginMethod('phone');
                clearErrors();
              }}
            />
            <span>{t('auth.loginWithPhone')}</span>
          </label>
        </div>

        {loginMethod === 'email' ? (
          <Input
            label={t('auth.email')}
            type="email"
            autoComplete="username"
            required
            reserveMessageSpace={2}
            maxLength={INPUT_LIMITS.email}
            value={email}
            style={{ textTransform: 'lowercase' }}
            onChange={(e) => {
              setEmail(e.target.value.toLowerCase());
              clearErrors();
            }}
            error={
              submitted && emailError
                ? tDynamic(emailError)
                : serverErrorCode === 'USER_NOT_FOUND'
                ? serverErrorText
                : null
            }
          />
        ) : (
          <PhoneInput
            label={t('auth.phone')}
            required
            reserveMessageSpace={2}
            value={phone}
            onChange={(val) => {
              setPhone(val);
              clearErrors();
            }}
            error={
              submitted && phoneError
                ? tDynamic(phoneError)
                : serverErrorCode === 'USER_NOT_FOUND'
                ? serverErrorText
                : null
            }
          />
        )}
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
              ? serverErrorText
              : null
          }
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4, marginBottom: 12 }}>
          <Button type="button" variant="ghost" size="sm" onClick={() => setForgotPasswordOpen(true)} style={{ padding: '4px 8px', height: 'auto' }}>
            {t('auth.forgot')}
          </Button>
        </div>
        <Button type="submit" size="lg" block loading={busy} disabled={isLockedOut}>
          {t('auth.loginSubmit')}
        </Button>
      </form>
      <GoogleSignIn />
      <p className="auth__foot">
        {t('auth.noAccount')} <Link to={ROUTES.register} state={location.state}>{t('auth.registerLink')}</Link>
      </p>
      <ForgotPasswordModal open={forgotPasswordOpen} onClose={() => setForgotPasswordOpen(false)} />
    </AuthShell>
  );
}
