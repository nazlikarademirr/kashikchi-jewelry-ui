import { expect, it } from 'vitest';
import { parseRangeNumber } from './productRange';

it('accepts decimal commas and dots without treating an empty bound as zero', () => {
  expect(parseRangeNumber('0')).toBe(0);
  expect(parseRangeNumber('1,25')).toBe(1.25);
  expect(parseRangeNumber('1.25')).toBe(1.25);
  expect(parseRangeNumber(',5')).toBe(0.5);
  expect(parseRangeNumber('')).toBeUndefined();
});

it('ignores invalid, negative and non-finite bounds from a shared URL', () => {
  for (const value of ['-1', 'abc', '1,2,3', '1e3', 'Infinity', '9'.repeat(400)])
    expect(parseRangeNumber(value)).toBeUndefined();
});
