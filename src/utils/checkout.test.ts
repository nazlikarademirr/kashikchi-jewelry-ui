import { describe, expect, it } from 'vitest';
import { getCheckoutProfileUpdate } from './checkout';

describe('checkout profile updates', () => {
  const user = { name: 'Test', surname: 'Test', email: 'test@example.com', phone: '+90 532 000 00 00' };

  it('does not attempt to delete the required account email when optional checkout email is cleared', () => {
    expect(getCheckoutProfileUpdate(user, 'Test Test', '', user.phone)).toBeNull();
    expect(getCheckoutProfileUpdate(user, 'Test Test', '   ', '+90 533 000 00 00'))
      .toEqual({ name: 'Test', surname: 'Test', email: user.email, phone: '+90 533 000 00 00' });
  });

  it('still saves an explicitly entered email and other edited contact details', () => {
    expect(getCheckoutProfileUpdate(user, 'yeni isim', ' NEW@example.com ', user.phone))
      .toEqual({ name: 'Yeni', surname: 'İsim', email: 'new@example.com', phone: user.phone });
  });
});
