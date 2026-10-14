import { expect, it } from 'vitest';
import { formatCarat } from './format';

it('always displays carat decimals with commas without dot grouping', () => {
  expect(formatCarat(1)).toBe('1,00');
  expect(formatCarat(2.2)).toBe('2,20');
  expect(formatCarat(0.235)).toBe('0,235');
  expect(formatCarat(1000.25)).toBe('1000,25');
});
