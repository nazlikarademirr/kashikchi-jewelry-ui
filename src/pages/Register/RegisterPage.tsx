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
import { sanitizeText, v } from '@/utils/validation';

export default function RegisterPage() {
  const { t, tDynamic, errorMessage } = useI18n();
  const { register } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', surname: '', email: '', phone: '', password: '', passwordRepeat: '' });
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverFields, setServerFields] = useState<Record<string, string>>({});
  useDocumentMeta({ title: t('auth.registerMeta'), noindex: true });

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setServerFields((s) => (s[key] ? { ...s, [key]: '' } : s));
  };

  const emailVal = form.email.trim();
  const phoneVal = form.phone.trim();
  const neitherProvided = !emailVal && !phoneVal;

  const errors = {
    name: v.required(form.name),
    surname: v.required(form.surname),
    email: v.optionalEmail(emailVal),
    phone: v.optionalPhone(phoneVal),
    password: v.password(form.password),
    passwordRepeat: v.passwordMatch(form.passwordRepeat, form.password),
  };
  const hasErrors = Object.values(errors).some(Boolean) || neitherProvided;
  const hasServerFieldErrors = Object.values(serverFields).some(Boolean);

  const fieldError = (key: keyof typeof errors) => {
    const local = submitted ? errors[key] : null;
    const remote = serverFields[key] || serverFields[key.charAt(0).toUpperCase() + key.slice(1)];
    const code = local ?? (remote || null);
    if (!code || code === 'validation.emailOrPhoneRequired') return null;
    return tDynamic(code);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setServerError(null);
    if (hasErrors) return;
    setBusy(true);
    try {
      await register({
        name: sanitizeText(form.name, INPUT_LIMITS.name),
        surname: sanitizeText(form.surname, INPUT_LIMITS.surname),
        email: emailVal ? emailVal.toLowerCase() : undefined,
        phone: phoneVal || undefined,
        password: form.password,
      });
      toast.success('auth.registered');
    } catch (err) {
      if (isAppError(err) && err.fieldErrors) setServerFields(err.fieldErrors);
      setServerError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <AuthShell>
      <h1 style={{ marginBottom: 24 }}>{t('auth.registerTitle')}</h1>
      <form className="form-grid" onSubmit={submit} noValidate style={{ gap: 0 }}>
        <div className="form-grid form-grid--2">
          <Input
            label={t('auth.name')}
            autoComplete="given-name"
            required
            reserveMessageSpace
            maxLength={INPUT_LIMITS.name}
            value={form.name}
            onChange={set('name')}
            error={fieldError('name')}
          />
          <Input
            label={t('auth.surname')}
            autoComplete="family-name"
            required
            reserveMessageSpace
            maxLength={INPUT_LIMITS.surname}
            value={form.surname}
            onChange={set('surname')}
            error={fieldError('surname')}
          />
        </div>
        <Input
          label={t('auth.email')}
          type="email"
          autoComplete="email"
          reserveMessageSpace
          maxLength={INPUT_LIMITS.email}
          value={form.email}
          onChange={set('email')}
          error={fieldError('email')}
        />
        <Input
          label={t('auth.phone')}
          type="tel"
          autoComplete="tel"
          reserveMessageSpace
          maxLength={INPUT_LIMITS.phone}
          value={form.phone}
          onChange={set('phone')}
          error={fieldError('phone')}
        />
        <p
          className={submitted && neitherProvided ? 'field__error' : 'muted'}
          style={{ fontSize: '0.82rem', margin: '-6px 0 12px' }}
          role={submitted && neitherProvided ? 'alert' : undefined}
        >
          {t('auth.emailOrPhoneHint')}
        </p>
        <Input
          label={t('auth.password')}
          type="password"
          autoComplete="new-password"
          required
          reserveMessageSpace
          maxLength={INPUT_LIMITS.password}
          value={form.password}
          onChange={set('password')}
          hint={t('auth.passwordHint')}
          error={fieldError('password')}
        />
        <Input
          label={t('auth.passwordRepeat')}
          type="password"
          autoComplete="new-password"
          required
          reserveMessageSpace={2}
          maxLength={INPUT_LIMITS.password}
          value={form.passwordRepeat}
          onChange={set('passwordRepeat')}
          // Sunucu hatası, alan hatalarıyla aynı ayrılmış satırda gösterilir; mesaj gelince yerleşim kaymaz.
          error={fieldError('passwordRepeat') ?? (hasServerFieldErrors ? null : serverError)}
        />
        <Button type="submit" size="lg" block loading={busy} style={{ marginTop: 4 }}>
          {t('auth.registerSubmit')}
        </Button>
      </form>
      <p className="auth__foot">
        {t('auth.haveAccount')} <Link to={ROUTES.login}>{t('auth.loginLink')}</Link>
      </p>
    </AuthShell>
  );
}
