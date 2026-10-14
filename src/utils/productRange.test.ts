import { expect, it } from 'vitest';
import { formatPriceRange, parsePriceRangeNumber, parseRangeNumber } from './productRange';

it('accepts decimal commas and rejects dots without treating an empty bound as zero', () => {
  expect(parseRangeNumber('0')).toBe(0);
  expect(parseRangeNumber('1,25')).toBe(1.25);
  expect(parseRangeNumber('1.25')).toBeUndefined();
  expect(parseRangeNumber('1,2345')).toBeUndefined();
  expect(parseRangeNumber(',5')).toBe(0.5);
  expect(parseRangeNumber('')).toBeUndefined();
});

it('groups prices while keeping the numeric filter value unchanged', () => {
  for (const [input, display, number] of [
    ['123', '123', 123],
    ['1234', '1.234', 1234],
    ['123123123', '123.123.123', 123123123],
    ['123.123.123', '123.123.123', 123123123],
    ['0', '0', 0],
  ] as const) {
    expect(formatPriceRange(input)).toBe(display);
    expect(parsePriceRangeNumber(input)).toBe(number);
    expect(parsePriceRangeNumber(display)).toBe(number);
  }
  expect(formatPriceRange('')).toBe('');
  for (const invalid of ['', '12.34', '1,25', '-1', '1e3', '9007199254740992'])
    expect(parsePriceRangeNumber(invalid)).toBeUndefined();
});

it('ignores invalid, negative and non-finite bounds from a shared URL', () => {
  for (const value of ['-1', 'abc', '1,2,3', '1e3', 'Infinity', '9'.repeat(400)])
    expect(parseRangeNumber(value)).toBeUndefined();
});
