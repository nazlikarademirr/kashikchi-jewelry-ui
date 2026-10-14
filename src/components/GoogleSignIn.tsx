import { useEffect, useRef, useState } from 'react';
import { services } from '@/services';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/State';

export function GoogleSignIn() {
  const { googleComplete } = useAuth();
  const { errorMessage, t, tError } = useI18n();
  const toast = useToast();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const completion = useRef<ReturnType<typeof googleComplete> | null>(null);
  const [callback] = useState(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    return { ticket: params.get('google_ticket'), failure: params.get('google_error'), proof: sessionStorage.getItem('kj:google-proof') };
  });
  useEffect(() => {
    let active = true;
    void services.auth.googleConfig().then((config) => {
      if (active) setReady(config.enabled);
    }).catch(() => { if (active) setError(t('auth.googleUnavailable')); });
    const { ticket, failure, proof } = callback;
    if (ticket || failure) {
      window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search);
      if (failure) {
        sessionStorage.removeItem('kj:google-proof');
        setError(tError(['GOOGLE_NOT_CONFIGURED', 'GOOGLE_LOGIN_CANCELLED', 'GOOGLE_ACCOUNT_CONFLICT'].includes(failure) ? failure : 'GOOGLE_LOGIN_FAILED'));
      } else if (ticket) {
        if (!proof) setError(tError('GOOGLE_LOGIN_FAILED'));
        else {
          setBusy(true);
          completion.current ??= googleComplete(ticket, proof);
          void completion.current.then(() => {
            if (active) toast.success('auth.loggedIn');
          }).catch((err) => { if (active) setError(errorMessage(err)); })
            .finally(() => { sessionStorage.removeItem('kj:google-proof'); if (active) setBusy(false); });
        }
      }
    }
    return () => { active = false; };
  }, [callback, googleComplete, errorMessage, t, tError, toast]);

  const start = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try { await services.auth.googleStart(); }
    catch { setBusy(false); setError(t('auth.googleUnavailable')); }
  };

  return (
    <div className={`auth__google${ready || error ? ' auth__google--ready' : ''}`}>
      {ready && <>
        <div className="auth__google-divider"><span>{t('auth.googleOr')}</span></div>
        <Button variant="secondary" size="lg" block className="auth__google-login" loading={busy} onClick={() => void start()}>
          {!busy && <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor">
            <path d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z" />
            <path d="M12 22c2.7 0 4.97-.9 6.62-2.41l-3.24-2.51c-.9.6-2.04.97-3.38.97-2.6 0-4.81-1.76-5.6-4.12H3.06v2.59A10 10 0 0 0 12 22Z" />
            <path d="M6.4 13.93A6 6 0 0 1 6.09 12c0-.67.11-1.32.31-1.93V7.48H3.06A10 10 0 0 0 2 12c0 1.61.38 3.14 1.06 4.52l3.34-2.59Z" />
            <path d="M12 5.95c1.48 0 2.79.51 3.84 1.51l2.88-2.88A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.94 5.48l3.34 2.59C7.19 7.71 9.4 5.95 12 5.95Z" />
          </svg>}
          {t('auth.googleSignIn')}
        </Button>
      </>}
      {error && <Alert kind="error">{error}</Alert>}
    </div>
  );
}
