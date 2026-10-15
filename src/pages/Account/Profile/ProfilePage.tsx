import { useState, useEffect, type FormEvent } from 'react';
import { INPUT_LIMITS } from '@/constants';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useToast } from '@/contexts/ToastContext';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { isAppError } from '@/types';
import { sanitizeText, toTitleCase, v } from '@/utils/validation';

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
    setServerError(null);
  };

  const emailVal = form.email.trim();
  const phoneVal = form.phone.trim();

  const isChangingPassword = Boolean(form.newPassword || form.confirmPassword);
  const isDirty = Boolean(user && (
    toTitleCase(sanitizeText(form.name, INPUT_LIMITS.name)) !== toTitleCase(user.name ?? '')
    || toTitleCase(sanitizeText(form.surname, INPUT_LIMITS.surname)) !== toTitleCase(user.surname ?? '')
    || emailVal.toLowerCase() !== (user.email ?? '').trim().toLowerCase()
    || phoneVal !== (user.phone ?? '').trim()
    || isChangingPassword
  ));
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
    email: v.email(emailVal),
    phone: v.optionalPhone(phoneVal),
    newPassword: newPasswordError,
    confirmPassword: confirmPasswordError,
  };

  const hasErrors = Object.values(errors).some(Boolean);
  const hasServerFieldErrors = Object.values(serverFields).some(Boolean);

  const fieldError = (key: keyof typeof errors) => {
    const local = submitted ? errors[key] : null;
    const remote = serverFields[key];
    const code = local ?? (remote || null);
    if (!code) return null;
    return tDynamic(code);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setServerError(null);
    if (hasErrors || !isDirty || busy) return;

    setBusy(true);
    try {
      const updated = await updateProfile({
        name: toTitleCase(sanitizeText(form.name, INPUT_LIMITS.name)),
        surname: toTitleCase(sanitizeText(form.surname, INPUT_LIMITS.surname)),
        email: emailVal.toLowerCase(),
        phone: phoneVal || null,
        password: isChangingPassword ? form.newPassword : null,
      });
      setForm({ name: updated.name ?? '', surname: updated.surname ?? '', email: updated.email ?? '',
        phone: updated.phone ?? '', newPassword: '', confirmPassword: '' });
      setSubmitted(false);
      setServerFields({});
      toast.success('account.profileSaved');
    } catch (err) {
      if (isAppError(err) && err.fieldErrors && Object.values(err.fieldErrors).some(Boolean)) {
        setServerFields(err.fieldErrors);
        setServerError(null);
      } else {
        setServerError(errorMessage(err));
      }
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
              onBlur={() => setForm((f) => ({ ...f, name: toTitleCase(f.name) }))}
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
              onBlur={() => setForm((f) => ({ ...f, surname: toTitleCase(f.surname) }))}
              error={fieldError('surname')}
            />
          </div>

          <div className="form-grid form-grid--2">
            <Input
              label={t('auth.email')}
              type="email"
              required
              autoComplete="email"
              reserveMessageSpace
              maxLength={INPUT_LIMITS.email}
              value={form.email}
              style={{ textTransform: 'lowercase' }}
              onChange={(e) => {
                setForm((f) => ({ ...f, email: e.target.value.toLowerCase() }));
                setServerFields((s) => (s.email ? { ...s, email: '' } : s));
                setServerError(null);
              }}
              onBlur={() => setForm((f) => ({ ...f, email: f.email.trim().toLowerCase() }))}
              error={fieldError('email')}
            />
            <PhoneInput
              label={t('auth.phone')}
              reserveMessageSpace
              value={form.phone}
              onChange={(val) => {
                setForm((f) => ({ ...f, phone: val }));
                setServerFields((s) => (s.phone ? { ...s, phone: '' } : s));
                setServerError(null);
              }}
              error={fieldError('phone')}
            />
          </div>

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
            <Button type="submit" size="lg" loading={busy} disabled={!isDirty}>
              {t('account.saveProfile')}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
