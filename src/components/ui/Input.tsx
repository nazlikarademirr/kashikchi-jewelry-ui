import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { useI18n } from '@/contexts/I18nContext';

interface FieldProps {
  label: string;
  error?: string | null;
  hint?: string;
  required?: boolean;
  /** Hata/ipucu satırı için her zaman yer ayırır; hata çıkınca/kaybolunca form kaymaz. Varsayılan true. */
  reserveMessageSpace?: boolean;
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
        <span id={`${id}-err`} className="field__error" role="alert">
          {error}
        </span>
      ) : hint ? (
        <span id={`${id}-hint`} className="field__hint">
          {hint}
        </span>
      ) : reserveMessageSpace ? (
        <span className="field__slot" aria-hidden="true">
          &nbsp;
        </span>
      ) : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, FieldProps & InputHTMLAttributes<HTMLInputElement>>(function Input(
  { label, error, hint, required, reserveMessageSpace = true, className, id, ...rest },
  ref,
) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <Field id={fid} label={label} error={error} hint={hint} required={required} reserveMessageSpace={reserveMessageSpace}>
      {(a) => <input ref={ref} className={`input ${className ?? ''}`} required={required} {...a} {...rest} />}
    </Field>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ label, error, hint, required, reserveMessageSpace = true, className, id, ...rest }, ref) {
    const auto = useId();
    const fid = id ?? auto;
    return (
      <Field id={fid} label={label} error={error} hint={hint} required={required} reserveMessageSpace={reserveMessageSpace}>
        {(a) => <textarea ref={ref} className={`textarea ${className ?? ''}`} required={required} {...a} {...rest} />}
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
