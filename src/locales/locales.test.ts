import { describe, expect, it } from 'vitest';
import { tr } from './tr';
import { en } from './en';

function flatten(value: object, prefix = ''): Record<string, string> {
  return Object.fromEntries(Object.entries(value).flatMap(([key, entry]) => {
    if (key === 'catalog') return [];
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof entry === 'string' ? [[path, entry]] : Object.entries(flatten(entry, path));
  }));
}

describe('English translations stay consistent with Turkish', () => {
  const turkish = flatten(tr);
  const english = flatten(en);

  it('covers every key with the same interpolation variables', () => {
    expect(Object.keys(english).sort()).toEqual(Object.keys(turkish).sort());
    for (const [key, value] of Object.entries(turkish)) {
      const placeholders = (text: string) => [...text.matchAll(/\{([^{}]+)\}/g)].map(match => match[1]).sort();
      expect(placeholders(english[key]), key).toEqual(placeholders(value));
    }
  });

  it('preserves ending punctuation and initial capitalization', () => {
    for (const [key, value] of Object.entries(turkish)) {
      expect(english[key].match(/[.!?…:]$/)?.[0] ?? '', key).toBe(value.match(/[.!?…:]$/)?.[0] ?? '');
      if (/^[A-ZÇĞİÖŞÜ]/.test(value)) expect(english[key], key).toMatch(/^[A-Z]/);
    }
  });

  it('uses English messages and title capitalization for key actions', () => {
    expect(en.auth.forgotSoon).toBe('This feature will be available soon. If you are having trouble signing in, please contact us by email. We will get back to you as soon as possible.');
    expect(en.messages.openOrder).toBe('View Order');
    expect(en.orders.customization).toBe('Special Request');
    expect(en.orderStatus.READY).toBe('Your Order Is Ready');
  });
});
