export function parseRangeNumber(value: string): number | undefined {
  if (!/^(?:\d+(?:,\d{0,3})?|,\d{1,3})$/.test(value)) return undefined;
  const number = Number(value.replace(',', '.'));
  return Number.isFinite(number) && number >= 0 ? number : undefined;
}

export function parsePriceRangeNumber(value: string): number | undefined {
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)$/.test(value)) return undefined;
  const number = Number(value.replace(/\./g, ''));
  return Number.isSafeInteger(number) && number >= 0 ? number : undefined;
}

export function formatPriceRange(value: string): string {
  if (!/^[\d.]*$/.test(value)) return value;
  return value.replace(/\./g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
