import type { UpdateProfileInput, User } from '@/types';
import { toTitleCase } from './validation';

export function getCheckoutProfileUpdate(
  user: Pick<User, 'name' | 'surname' | 'email' | 'phone'> | null,
  fullName: string, email: string, phone: string,
): UpdateProfileInput | null {
  if (!user) return null;
  const parts = toTitleCase(fullName.trim()).split(/\s+/);
  const name = parts[0] || user.name;
  const surname = parts.slice(1).join(' ') || user.surname;
  // Email is optional at checkout; leaving it empty must not erase the account email.
  const nextEmail = email.trim().toLowerCase() || user.email || null;
  const nextPhone = phone.trim();
  if (name === user.name && surname === user.surname && nextEmail === (user.email ?? null) && nextPhone === (user.phone ?? ''))
    return null;
  return { name, surname, email: nextEmail, phone: nextPhone || null };
}
