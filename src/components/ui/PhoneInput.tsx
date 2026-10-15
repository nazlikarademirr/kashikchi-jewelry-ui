import {
  forwardRef,
  useId,
  useRef,
  useState,
  useEffect,
  type FocusEvent,
  type KeyboardEvent,
  type ChangeEvent,
} from 'react';
import { COUNTRY_CODES } from '@/constants/countries';
import { formatNationalNumber, parsePhoneNumber } from '@/utils/phone';
import { Field, type FieldProps } from './Input';

export interface PhoneInputProps extends FieldProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
  autoComplete?: string;
  name?: string;
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(function PhoneInput(
  {
    label,
    value,
    onChange,
    error,
    hint,
    required,
    reserveMessageSpace = true,
    disabled = false,
    id,
    className,
    autoComplete = 'tel-national',
    name,
    onBlur,
  },
  ref,
) {
  const auto = useId();
  const fid = id ?? auto;
  const selectId = `${fid}-dialcode`;
  const internalInputRef = useRef<HTMLInputElement | null>(null);

  // Parse external value into dialCode and national digits
  const parsed = parsePhoneNumber(value);
  const [dialCode, setDialCode] = useState(parsed.dialCode || '+90');
  const [national, setNational] = useState(parsed.nationalNumber);

  // Sync state when external value changes
  useEffect(() => {
    const p = parsePhoneNumber(value);
    setDialCode(p.dialCode || '+90');
    setNational(p.nationalNumber);
  }, [value]);

  const handleDialCodeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const nextDial = e.target.value;
    setDialCode(nextDial);
    const formatted = formatNationalNumber(national, nextDial);
    setNational(formatted);
    onChange(formatted ? `${nextDial} ${formatted}` : '');
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = formatNationalNumber(raw, dialCode);
    setNational(formatted);
    onChange(formatted ? `${dialCode} ${formatted}` : '');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      const input = e.currentTarget;
      const start = input.selectionStart ?? 0;
      const end = input.selectionEnd ?? 0;
      // If cursor is right after a space, delete the character before the space
      if (start === end && start > 1 && input.value[start - 1] === ' ') {
        e.preventDefault();
        const nextRaw = input.value.slice(0, start - 2) + input.value.slice(start);
        const formatted = formatNationalNumber(nextRaw, dialCode);
        setNational(formatted);
        onChange(formatted ? `${dialCode} ${formatted}` : '');
        requestAnimationFrame(() => {
          const nextPos = Math.max(0, start - 2);
          input.setSelectionRange(nextPos, nextPos);
        });
      }
    }
  };

  return (
    <Field id={fid} label={label} error={error} hint={hint} required={required} reserveMessageSpace={reserveMessageSpace}>
      {(a) => (
        <div className={`phone-input-wrap ${className ?? ''}`}>
          <div className="phone-input-select-wrap">
            <select
              id={selectId}
              className="select phone-input-select"
              value={dialCode}
              onChange={handleDialCodeChange}
              disabled={disabled}
              aria-label="Ülke Alan Kodu"
            >
              {COUNTRY_CODES.map((c) => (
                <option key={`${c.code}-${c.dialCode}`} value={c.dialCode}>
                  {c.flag} {c.dialCode} ({c.name})
                </option>
              ))}
            </select>
          </div>
          <input
            {...a}
            ref={(node) => {
              internalInputRef.current = node;
              if (typeof ref === 'function') ref(node);
              else if (ref) ref.current = node;
            }}
            type="tel"
            inputMode="numeric"
            name={name}
            className="input phone-input-field"
            value={national}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onBlur={onBlur}
            disabled={disabled}
            autoComplete={autoComplete}
            placeholder={dialCode === '+90' ? '535 535 53 35' : '535 535 53 35'}
            maxLength={18}
          />
        </div>
      )}
    </Field>
  );
});
