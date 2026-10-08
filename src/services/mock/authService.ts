import { PASSWORD_MIN_LENGTH } from '@/constants';
import { AppError, type AuthService, type LoginInput, type RegisterInput, type User } from '@/types';
import { delay, hashPassword, readDb, session, verifyPassword, writeDb, currentUser } from './db';
import { toUser } from './mappers';
import { sanitizeText, v } from '@/utils/validation';

const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60_000;

export const mockAuthService: AuthService = {
  async register(input: RegisterInput): Promise<User> {
    await delay();
    
    const name = sanitizeText(input.name, 60);
    const surname = sanitizeText(input.surname, 60);
    const email = input.email.trim().toLowerCase();
    const fieldErrors: Record<string, string> = {};
    if (!name) fieldErrors.name = 'validation.required';
    if (!surname) fieldErrors.surname = 'validation.required';
    const emailErr = v.email(email);
    if (emailErr) fieldErrors.email = emailErr;
    const pwErr = v.password(input.password);
    if (pwErr) fieldErrors.password = pwErr;
    if (Object.keys(fieldErrors).length) throw new AppError('VALIDATION_FAILED', { fieldErrors, status: 422 });
    if (input.password.length < PASSWORD_MIN_LENGTH) throw new AppError('VALIDATION_FAILED', { status: 422 });

    const db = await readDb();
    if (db.users.some((u) => u.email.toLowerCase() === email)) {
      throw new AppError('EMAIL_TAKEN', { fieldErrors: { email: 'validation.emailTaken' }, status: 409 });
    }
    const { hash, salt } = await hashPassword(input.password);
    const record = {
      id: crypto.randomUUID(),
      name,
      surname,
      email,
      role: 0 as const, 
      passwordHash: hash,
      salt,
      createdAt: new Date().toISOString(),
      failedAttempts: 0,
      lockedUntil: null,
    };
    db.users.push(record);
    writeDb(db);
    session.set(record.id);
    return toUser(record);
  },

  async login(input: LoginInput): Promise<User> {
    await delay();
    const db = await readDb();
    const email = input.email.trim().toLowerCase();
    const user = db.users.find((u) => u.email.toLowerCase() === email);

    if (!user) {
      
      await hashPassword(input.password);
      throw new AppError('INVALID_CREDENTIALS', { status: 401 });
    }
    if (user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now()) {
      throw new AppError('TOO_MANY_ATTEMPTS', { status: 429 });
    }
    const ok = await verifyPassword(input.password, user.salt, user.passwordHash);
    if (!ok) {
      user.failedAttempts += 1;
      if (user.failedAttempts >= MAX_ATTEMPTS) {
        user.lockedUntil = new Date(Date.now() + LOCK_MS).toISOString();
        user.failedAttempts = 0;
      }
      writeDb(db);
      throw new AppError('INVALID_CREDENTIALS', { status: 401 });
    }
    user.failedAttempts = 0;
    user.lockedUntil = null;
    writeDb(db);
    session.set(user.id);
    return toUser(user);
  },

  async logout(): Promise<void> {
    await delay(60);
    session.clear();
  },

  async me(): Promise<User | null> {
    const db = await readDb();
    const u = currentUser(db);
    return u ? toUser(u) : null;
  },
};
