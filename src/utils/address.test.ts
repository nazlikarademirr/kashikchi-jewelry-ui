import { describe, expect, it } from 'vitest';
import { getDeliveryAddressErrors, normalizeAddressTitle } from './address';

describe('address title matching', () => {
  it('ignores surrounding/repeated whitespace and Turkish letter case', () => {
    expect(normalizeAddressTitle('  İş  Yeri  ')).toBe(normalizeAddressTitle('İŞ YERİ'));
    expect(normalizeAddressTitle('ev')).toBe(normalizeAddressTitle('EV'));
    expect(normalizeAddressTitle('ışık')).toBe(normalizeAddressTitle('IŞIK'));
  });
  it('normalizes equivalent Unicode forms while keeping different names distinct', () => {
    expect(normalizeAddressTitle('İş')).toBe(normalizeAddressTitle('I\u0307ş'));
    expect(normalizeAddressTitle('Ev')).not.toBe(normalizeAddressTitle('İş Yeri'));
  });
});

describe('checkout delivery choice', () => {
  const blank = { id: '', title: '', country: 'Türkiye', city: '', district: '', fullAddress: '' };
  const complete = { ...blank, title: 'Ev', city: 'İstanbul', district: 'Fatih', fullAddress: 'Mahalle, sokak, bina 1' };

  it('does not require an address for collection, even after an incomplete delivery entry', () => {
    expect(Object.values(getDeliveryAddressErrors(blank, [], false, false)).every((error) => error === null)).toBe(true);
    expect(Object.values(getDeliveryAddressErrors({ ...complete, fullAddress: '' }, [complete], false, true))
      .every((error) => error === null)).toBe(true);
  });

  it('requires all address fields as soon as delivery is chosen', () => {
    expect(getDeliveryAddressErrors(blank, [], true, false)).toEqual({
      title: 'validation.required', country: null, city: 'validation.required',
      district: 'validation.required', fullAddress: 'validation.required',
    });
    expect(getDeliveryAddressErrors({ ...complete, fullAddress: '' }, [complete], true, false).fullAddress)
      .toBe('validation.required');
  });

  it('allows an existing delivery address and only rejects its title when saving a new copy', () => {
    expect(Object.values(getDeliveryAddressErrors(complete, [complete], true, false)).every((error) => error === null)).toBe(true);
    expect(getDeliveryAddressErrors(complete, [complete], true, true).title).toBe('validation.addressTitleTaken');
  });
});
