/** Formats Turkish phone numbers as +90 532 123 45 67 while typing. */
export function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) return value.startsWith('+') ? '+' : '';
  if (value.startsWith('+') && digits.length < 2) return `+${digits}`;
  // Keep international numbers with another country code intact.
  if (value.startsWith('+') && !digits.startsWith('90')) return `+${digits}`;

  const national = (digits.startsWith('90') ? digits.slice(2) : digits.startsWith('0') ? digits.slice(1) : digits).slice(0, 10);
  const groups = [national.slice(0, 3), national.slice(3, 6), national.slice(6, 8), national.slice(8, 10)];
  return ['+90', ...groups.filter(Boolean)].join(' ');
}
