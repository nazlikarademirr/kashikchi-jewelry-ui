import { useState, useEffect, type FormEvent } from 'react';
import { INPUT_LIMITS } from '@/constants';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useToast } from '@/contexts/ToastContext';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { isAppError } from '@/types';
import { sanitizeText, v } from '@/utils/validation';

export default function ProfilePage() {
  const { t, tDynamic, errorMessage } = useI18n();
  const { user, updateProfile } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState({
    name: user?.name ?? '',
    surname: user?.surname ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    newPassword: '',
    confirmPassword: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverFields, setServerFields] = useState<Record<string, string>>({});

  useDocumentMeta({ title: t('account.profileTitle'), noindex: true });

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        name: user.name ?? '',
        surname: user.surname ?? '',
        email: user.email ?? '',
        phone: user.phone ?? '',
      }));
    }
  }, [user]);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setServerFields((s) => (s[key] ? { ...s, [key]: '' } : s));
  };

  const emailVal = form.email.trim();
  const phoneVal = form.phone.trim();
  const neitherProvided = !emailVal && !phoneVal;

  const isChangingPassword = Boolean(form.newPassword || form.confirmPassword);
  const newPasswordError = isChangingPassword ? v.password(form.newPassword) : null;
  const confirmPasswordError = isChangingPassword
    ? !form.confirmPassword
      ? 'validation.required'
      : form.confirmPassword !== form.newPassword
      ? 'validation.passwordMatch'
      : null
    : null;

  const errors = {
    name: v.required(form.name),
    surname: v.required(form.surname),
    email: v.optionalEmail(emailVal),
    phone: v.optionalPhone(phoneVal),
    newPassword: newPasswordError,
    confirmPassword: confirmPasswordError,
  };

  const hasErrors = Object.values(errors).some(Boolean) || neitherProvided;
  const hasServerFieldErrors = Object.values(serverFields).some(Boolean);

  const fieldError = (key: keyof typeof errors) => {
    const local = submitted ? errors[key] : null;
    const remote = serverFields[key];
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
      await updateProfile({
        name: sanitizeText(form.name, INPUT_LIMITS.name),
        surname: sanitizeText(form.surname, INPUT_LIMITS.surname),
        email: emailVal.toLowerCase() || null,
        phone: phoneVal || null,
        password: isChangingPassword ? form.newPassword : null,
      });
      setForm((f) => ({ ...f, newPassword: '', confirmPassword: '' }));
      toast.success('account.profileSaved');
    } catch (err) {
      if (isAppError(err) && err.fieldErrors) setServerFields(err.fieldErrors);
      setServerError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="dash__head">
        <div>
          <h1>{t('account.profileTitle')}</h1>
          <p className="muted" style={{ margin: 0 }}>
            {t('account.profileSubtitle')}
          </p>
        </div>
      </div>

      <div className="card" style={{ width: '100%' }}>
        <form onSubmit={submit} noValidate style={{ display: 'grid', gap: 0 }}>
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

          <div className="form-grid form-grid--2">
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
          </div>

          <p
            className={submitted && neitherProvided ? 'field__error' : 'muted'}
            style={{ fontSize: '0.85rem', margin: '-4px 0 20px' }}
            role={submitted && neitherProvided ? 'alert' : undefined}
          >
            {t('account.emailOrPhoneHint')}
          </p>

          <div style={{ margin: '8px 0 20px', borderTop: '1px solid var(--border)', paddingTop: 20 }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: 4, color: 'var(--text)' }}>
              {t('account.passwordSection')}
            </h2>
            <p className="muted" style={{ fontSize: '0.86rem', margin: 0 }}>
              {t('account.passwordSectionHint')}
            </p>
          </div>

          <div className="form-grid form-grid--2">
            <Input
              label={t('account.newPassword')}
              type="password"
              autoComplete="new-password"
              reserveMessageSpace
              maxLength={INPUT_LIMITS.password}
              value={form.newPassword}
              onChange={set('newPassword')}
              error={fieldError('newPassword')}
            />
            <Input
              label={t('account.confirmNewPassword')}
              type="password"
              autoComplete="new-password"
              reserveMessageSpace
              maxLength={INPUT_LIMITS.password}
              value={form.confirmPassword}
              onChange={set('confirmPassword')}
              error={fieldError('confirmPassword')}
            />
          </div>

          {serverError && !hasServerFieldErrors && (
            <p className="field__error" role="alert" style={{ margin: '8px 0 16px' }}>
              {serverError}
            </p>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
            <Button type="submit" size="lg" loading={busy}>
              {t('account.saveProfile')}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
