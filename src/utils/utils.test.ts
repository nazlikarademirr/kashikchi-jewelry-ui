import { describe, expect, it } from 'vitest';
import { finalPrice, formatPrice, isMadeToOrder, localized, shortId } from './format';
import { sanitizeText, slugify, v } from './validation';
import { mediaUrl } from './media';

describe('format', () => {
  it('indirimli fiyatı yuvarlayarak hesaplar', () => {
    expect(finalPrice({ price: 96500, discount: 10 })).toBe(86850);
    expect(finalPrice({ price: 100, discount: 0 })).toBe(100);
    expect(finalPrice({ price: 100, discount: 100 })).toBe(0);
  });

  it('stok 0 ise sipariş üzerine yapılır', () => {
    expect(isMadeToOrder({ stock: 0 })).toBe(true);
    expect(isMadeToOrder({ stock: 1 })).toBe(false);
  });

  it('dile göre metin seçer, eksikse varsayılana düşer', () => {
    expect(localized({ tr: 'Yüzük', en: 'Ring' }, 'en')).toBe('Ring');
    expect(localized({ tr: 'Yüzük', en: '' }, 'en')).toBe('Yüzük');
  });

  it('fiyatı TRY olarak biçimlendirir', () => {
    expect(formatPrice(1000, 'tr')).toContain('1.000');
  });

  it('kısa sipariş numarası üretir', () => {
    expect(shortId('30000000-0000-4000-8000-000000000001')).toBe('30000000');
  });
});

describe('validation', () => {
  it('e-posta doğrular', () => {
    expect(v.email('')).toBe('validation.required');
    expect(v.email('abc')).toBe('validation.email');
    expect(v.email('ad@ornek.com')).toBeNull();
  });

  it('şifre kurallarını uygular', () => {
    expect(v.password('')).toBe('validation.required');
    expect(v.password('abc1')).toBe('validation.passwordMin');
    expect(v.password('abcdefgh')).toBe('validation.passwordStrength');
    expect(v.password('abcdefg1')).toBeNull();
  });

  it('şifre tekrarını karşılaştırır', () => {
    expect(v.passwordMatch('abc12345', 'abc12345')).toBeNull();
    expect(v.passwordMatch('abc12345', 'abc12346')).toBe('validation.passwordMatch');
  });

  it('negatif stok ve fiyatı reddeder', () => {
    expect(v.nonNegativeInt(-1)).toBe('validation.nonNegative');
    expect(v.nonNegativeInt(1.5)).toBe('validation.integer');
    expect(v.nonNegativeInt(0)).toBeNull();
    expect(v.positive(0)).toBe('validation.positive');
    expect(v.positive(10)).toBeNull();
  });

  it('indirim 0–100 aralığında olmalı', () => {
    expect(v.discount(-1)).toBe('validation.discountRange');
    expect(v.discount(101)).toBe('validation.discountRange');
    expect(v.discount(100)).toBeNull();
  });

  it('ürün kodu biçimini doğrular', () => {
    expect(v.code('kj-001')).toBe('validation.codeFormat');
    expect(v.code('KJ-YZK-001')).toBeNull();
  });

  it('kontrol karakterlerini temizler ve uzunluğu sınırlar', () => {
    expect(sanitizeText('  merhaba\u0000 dünya  ')).toBe('merhaba dünya');
    expect(sanitizeText('abcdef', 3)).toBe('abc');
  });

  it('Türkçe karakterli slug üretir', () => {
    expect(slugify('Étoile Beştaş Yüzük')).toBe('etoile-bestas-yuzuk');
  });
});

describe('media', () => {
  it('mutlak ve yerel yolları olduğu gibi bırakır', () => {
    expect(mediaUrl('/images/a.jpg')).toBe('/images/a.jpg');
    expect(mediaUrl('https://cdn.example/a.jpg')).toBe('https://cdn.example/a.jpg');
  });
});
