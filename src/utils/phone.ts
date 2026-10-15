import { COUNTRY_CODES } from '@/constants/countries';

/**
 * Formats digits typed by user into grouped chunks.
 * e.g. for TR: 535 535 53 35 (3 - 3 - 2 - 2)
 */
export function formatNationalNumber(input: string, dialCode = '+90'): string {
  let digits = input.replace(/\D/g, '');
  if (!digits) return '';

  if (dialCode === '+90') {
    if (digits.startsWith('90')) digits = digits.slice(2);
    if (digits.startsWith('0')) digits = digits.slice(1);
    digits = digits.slice(0, 10);
    const p1 = digits.slice(0, 3);
    const p2 = digits.slice(3, 6);
    const p3 = digits.slice(6, 8);
    const p4 = digits.slice(8, 10);
    return [p1, p2, p3, p4].filter(Boolean).join(' ');
  }

  const dialDigits = dialCode.replace(/\D/g, '');
  if (dialDigits && digits.startsWith(dialDigits)) {
    digits = digits.slice(dialDigits.length);
  }
  if (digits.startsWith('0')) digits = digits.slice(1);
  digits = digits.slice(0, 12);

  const p1 = digits.slice(0, 3);
  const p2 = digits.slice(3, 6);
  const p3 = digits.slice(6, 8);
  const p4 = digits.slice(8, 10);
  const p5 = digits.slice(10, 12);
  return [p1, p2, p3, p4, p5].filter(Boolean).join(' ');
}

/**
 * Parses full phone string into country dial code and formatted national number.
 */
export function parsePhoneNumber(fullValue: string): { dialCode: string; nationalNumber: string } {
  if (!fullValue || !fullValue.trim()) {
    return { dialCode: '+90', nationalNumber: '' };
  }
  const clean = fullValue.trim();

  // Find longest matching dial code
  const sortedCodes = [...COUNTRY_CODES].sort((a, b) => b.dialCode.length - a.dialCode.length);
  const match = sortedCodes.find((c) => clean.startsWith(c.dialCode));
  if (match) {
    const rawNational = clean.slice(match.dialCode.length);
    return {
      dialCode: match.dialCode,
      nationalNumber: formatNationalNumber(rawNational, match.dialCode),
    };
  }

  if (clean.startsWith('+')) {
    return {
      dialCode: '+90',
      nationalNumber: formatNationalNumber(clean.slice(1), '+90'),
    };
  }

  return {
    dialCode: '+90',
    nationalNumber: formatNationalNumber(clean, '+90'),
  };
}

/**
 * Formats phone number as '+90 535 535 53 35' while typing or displaying.
 */
export function formatPhoneNumber(value: string): string {
  const { dialCode, nationalNumber } = parsePhoneNumber(value);
  if (!nationalNumber) return '';
  return `${dialCode} ${nationalNumber}`;
}
