import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AuthShell } from '@/components/AuthShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useToast } from '@/contexts/ToastContext';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { isMockMode } from '@/services';
import { DEMO_ACCOUNTS } from '@/services/mock/seed';
import { v } from '@/utils/validation';

export default function LoginPage() {
  const { t, tDynamic, errorMessage } = useI18n();
  const { login } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showForgot, setShowForgot] = useState(false);
  useDocumentMeta({ title: t('auth.loginMeta'), noindex: true });

  const emailError = v.email(email);
  const passwordError = v.required(password);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setServerError(null);
    if (emailError || passwordError) return;
    setBusy(true);
    try {
      await login({ email: email.trim(), password });
      toast.success('auth.loggedIn');
    } catch (err) {
      setServerError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <AuthShell>
      <h1 style={{ marginBottom: 24 }}>{t('auth.loginTitle')}</h1>
      <form className="form-grid" onSubmit={submit} noValidate style={{ display: 'grid', gap: 0 }}>
        <Input
          label={t('auth.email')}
          type="email"
          autoComplete="email"
          required
          reserveMessageSpace
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={submitted && emailError ? tDynamic(emailError) : null}
        />
        <Input
          label={t('auth.password')}
          type="password"
          autoComplete="current-password"
          required
          reserveMessageSpace
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          // Sunucu hatası (ör. "Kullanıcı adı veya şifre hatalı.") alan hatası gibi aynı ayrılmış satırda gösterilir; yerleşim kaymaz.
          error={submitted && passwordError ? tDynamic(passwordError) : serverError}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 0, marginBottom: 20 }}>
          <Button type="button" variant="ghost" size="sm" aria-expanded={showForgot} onClick={() => setShowForgot((s) => !s)} style={{ padding: '4px 8px', height: 'auto' }}>
            {t('auth.forgot')}
          </Button>
        </div>
        <Button type="submit" size="lg" block loading={busy}>
          {t('auth.loginSubmit')}
        </Button>
      </form>
      <p className="auth__foot">
        {t('auth.noAccount')} <Link to={ROUTES.register}>{t('auth.registerLink')}</Link>
      </p>
      {isMockMode && (
        <div className="demo-box">
          <strong>{t('auth.demoTitle')}</strong>
          <div style={{ marginTop: 8 }}>
            <strong>Müşteriler:</strong>
            <br />
            <code>{DEMO_ACCOUNTS.user.email}</code> / <code>{DEMO_ACCOUNTS.user.password}</code>
            <br />
            <code>{DEMO_ACCOUNTS.user2.email}</code> / <code>{DEMO_ACCOUNTS.user2.password}</code>
            <br />
            <code>{DEMO_ACCOUNTS.user3.email}</code> / <code>{DEMO_ACCOUNTS.user3.password}</code>
          </div>
          <div style={{ marginTop: 8 }}>
            <strong>Yöneticiler:</strong>
            <br />
            <code>{DEMO_ACCOUNTS.admin.email}</code> / <code>{DEMO_ACCOUNTS.admin.password}</code>
            <br />
            <code>{DEMO_ACCOUNTS.admin2.email}</code> / <code>{DEMO_ACCOUNTS.admin2.password}</code>
            <br />
            <code>{DEMO_ACCOUNTS.admin3.email}</code> / <code>{DEMO_ACCOUNTS.admin3.password}</code>
          </div>
        </div>
      )}
    </AuthShell>
  );
}
