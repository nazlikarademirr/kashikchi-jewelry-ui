export function parseRangeNumber(value: string): number | undefined {
  if (!/^(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(value)) return undefined;
  const number = Number(value.replace(',', '.'));
  return Number.isFinite(number) && number >= 0 ? number : undefined;
}
