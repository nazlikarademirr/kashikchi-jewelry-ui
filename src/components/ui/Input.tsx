import {
  forwardRef,
  useId,
  useState,
  type FocusEvent,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { Icon } from './Icon';

interface FieldProps {
  label: string;
  error?: string | null;
  hint?: string;
  required?: boolean;
  /** Hata/ipucu satırı için her zaman yer ayırır; hata çıkınca/kaybolunca form kaymaz. Satır sayısı belirtilebilir (varsayılan true / 1). */
  reserveMessageSpace?: boolean | number;
}

function Field({
  id,
  label,
  error,
  hint,
  required,
  reserveMessageSpace = true,
  children,
}: FieldProps & { id: string; children: (a11y: { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string }) => ReactNode }) {
  const { t } = useI18n();
  const descId = error ? `${id}-err` : hint ? `${id}-hint` : undefined;
  const lines = typeof reserveMessageSpace === 'number' ? reserveMessageSpace : reserveMessageSpace ? 1 : 0;
  const minHeightStyle = lines > 1 ? { minHeight: `${(lines * 1.35).toFixed(2)}em` } : undefined;

  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
        {required && (
          <span className="req" aria-hidden="true">
            *
          </span>
        )}
        {required && <span className="sr-only"> ({t('common.required')})</span>}
      </label>
      {children({ id, 'aria-invalid': Boolean(error), 'aria-describedby': descId })}
      {error ? (
        <span id={`${id}-err`} className="field__error" role="alert" style={minHeightStyle}>
          {error}
        </span>
      ) : hint ? (
        <span id={`${id}-hint`} className="field__hint" style={minHeightStyle}>
          {hint}
        </span>
      ) : reserveMessageSpace ? (
        <span className="field__slot" aria-hidden="true" style={minHeightStyle}>
          &nbsp;
        </span>
      ) : null}
    </div>
  );
}

function dispatchTrimmedValue(element: HTMLInputElement | HTMLTextAreaElement, trimmed: string) {
  const prototype = Object.getPrototypeOf(element);
  const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
  descriptor?.set?.call(element, trimmed);
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

export const Input = forwardRef<HTMLInputElement, FieldProps & InputHTMLAttributes<HTMLInputElement>>(function Input(
  { label, error, hint, required, reserveMessageSpace = true, className, id, onBlur, type = 'text', ...rest },
  ref,
) {
  const auto = useId();
  const fid = id ?? auto;
  const { t } = useI18n();
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type;

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    const isExempt = ['password', 'file', 'checkbox', 'radio'].includes(type);
    if (!isExempt && typeof e.target.value === 'string') {
      const trimmed = e.target.value.trim();
      if (trimmed !== e.target.value) {
        dispatchTrimmedValue(e.target, trimmed);
      }
    }
    onBlur?.(e);
  };

  return (
    <Field id={fid} label={label} error={error} hint={hint} required={required} reserveMessageSpace={reserveMessageSpace}>
      {(a) => (
        <div className="input-wrap">
          <input
            ref={ref}
            type={resolvedType}
            className={`input ${isPassword ? 'input--has-action' : ''} ${className ?? ''}`}
            required={required}
            onBlur={handleBlur}
            {...a}
            {...rest}
          />
          {isPassword && (
            <button
              type="button"
              className="input-action-btn"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={t(showPassword ? 'auth.hidePassword' : 'auth.showPassword')}
              title={t(showPassword ? 'auth.hidePassword' : 'auth.showPassword')}
              tabIndex={-1}
            >
              <Icon name={showPassword ? 'eyeOff' : 'eye'} size={20} />
            </button>
          )}
        </div>
      )}
    </Field>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ label, error, hint, required, reserveMessageSpace = true, className, id, onBlur, ...rest }, ref) {
    const auto = useId();
    const fid = id ?? auto;

    const handleBlur = (e: FocusEvent<HTMLTextAreaElement>) => {
      if (typeof e.target.value === 'string') {
        const trimmed = e.target.value.trim();
        if (trimmed !== e.target.value) {
          dispatchTrimmedValue(e.target, trimmed);
        }
      }
      onBlur?.(e);
    };

    return (
      <Field id={fid} label={label} error={error} hint={hint} required={required} reserveMessageSpace={reserveMessageSpace}>
        {(a) => <textarea ref={ref} className={`textarea ${className ?? ''}`} required={required} onBlur={handleBlur} {...a} {...rest} />}
      </Field>
    );
  },
);

export const Select = forwardRef<HTMLSelectElement, FieldProps & SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ label, error, hint, required, reserveMessageSpace = true, className, id, children, ...rest }, ref) {
    const auto = useId();
    const fid = id ?? auto;
    return (
      <Field id={fid} label={label} error={error} hint={hint} required={required} reserveMessageSpace={reserveMessageSpace}>
        {(a) => (
          <select ref={ref} className={`select ${className ?? ''}`} required={required} {...a} {...rest}>
            {children}
          </select>
        )}
      </Field>
    );
  },
);
