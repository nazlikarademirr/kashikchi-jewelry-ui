import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { useI18n } from './I18nContext';
import type { TranslationKey } from '@/locales';

export type ToastKind = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastValue {
  show: (kind: ToastKind, message: string) => void;
  success: (key: TranslationKey) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => setToasts((prev) => prev.filter((x) => x.id !== id)), []);

  const show = useCallback(
    (kind: ToastKind, message: string) => {
      const id = ++counter.current;
      setToasts((prev) => [...prev.slice(-3), { id, kind, message }]);
      window.setTimeout(() => dismiss(id), kind === 'error' ? 6000 : 3800);
    },
    [dismiss],
  );

  const value = useMemo<ToastValue>(
    () => ({
      show,
      success: (key) => show('success', t(key)),
      error: (message) => show('error', message),
    }),
    [show, t],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-region" role="region" aria-label={t('a11y.notifications')} aria-live="polite">
        {toasts.map((x) => (
          <div key={x.id} className={`toast toast--${x.kind}`} role={x.kind === 'error' ? 'alert' : 'status'}>
            <span className="toast__icon" aria-hidden="true">
              {x.kind === 'success' ? '✓' : x.kind === 'error' ? '!' : 'i'}
            </span>
            <span className="toast__msg">{x.message}</span>
            <button type="button" className="toast__close" onClick={() => dismiss(x.id)} aria-label={t('common.close')}>
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
