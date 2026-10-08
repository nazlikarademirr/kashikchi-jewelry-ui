import { STORAGE_KEYS } from '@/constants';
import { AppError, type UserRole } from '@/types';
import {
  DEMO_ACCOUNTS,
  SEED_IDS,
  buildSeedCategories,
  buildSeedOrders,
  buildSeedProducts,
  type MockDb,
  type UserRecord,
} from './seed';


const ITERATIONS = 100_000;
const enc = new TextEncoder();

const toB64 = (buf: ArrayBuffer | Uint8Array): string =>
  btoa(String.fromCharCode(...new Uint8Array(buf instanceof ArrayBuffer ? buf : buf.buffer)));
const fromB64 = (s: string): Uint8Array => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function derive(password: string, salt: Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as any, iterations: ITERATIONS },
    key,
    256,
  );
  return toB64(bits);
}

export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { hash: await derive(password, salt), salt: toB64(salt) };
}

export async function verifyPassword(password: string, salt: string, hash: string): Promise<boolean> {
  const candidate = await derive(password, fromB64(salt));
  
  if (candidate.length !== hash.length) return false;
  let diff = 0;
  for (let i = 0; i < hash.length; i++) diff |= candidate.charCodeAt(i) ^ hash.charCodeAt(i);
  return diff === 0;
}

let seeding: Promise<MockDb> | null = null;

async function seed(): Promise<MockDb> {
  const now = new Date().toISOString();
  const admin = await hashPassword(DEMO_ACCOUNTS.admin.password);
  const admin2 = await hashPassword(DEMO_ACCOUNTS.admin2.password);
  const admin3 = await hashPassword(DEMO_ACCOUNTS.admin3.password);
  const user = await hashPassword(DEMO_ACCOUNTS.user.password);
  const user2 = await hashPassword(DEMO_ACCOUNTS.user2.password);
  const user3 = await hashPassword(DEMO_ACCOUNTS.user3.password);
  
  const base = { createdAt: now, failedAttempts: 0, lockedUntil: null };
  const users: UserRecord[] = [
    { id: SEED_IDS.admin, name: 'Kashikchi', surname: 'Admin', email: DEMO_ACCOUNTS.admin.email, role: 1, passwordHash: admin.hash, salt: admin.salt, ...base },
    { id: SEED_IDS.admin2, name: 'Yönetici', surname: 'İki', email: DEMO_ACCOUNTS.admin2.email, role: 1, passwordHash: admin2.hash, salt: admin2.salt, ...base },
    { id: SEED_IDS.admin3, name: 'Destek', surname: 'Uzmanı', email: DEMO_ACCOUNTS.admin3.email, role: 1, passwordHash: admin3.hash, salt: admin3.salt, ...base },
    { id: SEED_IDS.user, name: 'Elif', surname: 'Yılmaz', email: DEMO_ACCOUNTS.user.email, role: 0, passwordHash: user.hash, salt: user.salt, ...base },
    { id: SEED_IDS.user2, name: 'Ayşe', surname: 'Kaya', email: DEMO_ACCOUNTS.user2.email, role: 0, passwordHash: user2.hash, salt: user2.salt, ...base },
    { id: SEED_IDS.user3, name: 'Mehmet', surname: 'Demir', email: DEMO_ACCOUNTS.user3.email, role: 0, passwordHash: user3.hash, salt: user3.salt, ...base },
  ];
  const db: MockDb = {
    users,
    categories: buildSeedCategories(),
    products: buildSeedProducts(),
    favorites: [],
    carts: [],
    ...buildSeedOrders(),
  };
  writeDb(db);
  return db;
}

export async function readDb(): Promise<MockDb> {
  const raw = localStorage.getItem(STORAGE_KEYS.mockDb);
  if (raw) {
    try {
      return JSON.parse(raw) as MockDb;
    } catch {
          }
  }
  seeding ??= seed().finally(() => {
    seeding = null;
  });
  return seeding;
}

export function writeDb(db: MockDb): void {
  try {
    localStorage.setItem(STORAGE_KEYS.mockDb, JSON.stringify(db));
  } catch {
    throw new AppError('STORAGE_FULL');
  }
}

export const delay = (ms = 140): Promise<void> => new Promise((r) => setTimeout(r, ms));


export const session = {
  get: (): string | null => sessionStorage.getItem(STORAGE_KEYS.session),
  set: (userId: string): void => sessionStorage.setItem(STORAGE_KEYS.session, userId),
  clear: (): void => sessionStorage.removeItem(STORAGE_KEYS.session),
};

export function currentUser(db: MockDb): UserRecord | null {
  const id = session.get();
  return id ? (db.users.find((u) => u.id === id) ?? null) : null;
}

export function requireUser(db: MockDb): UserRecord {
  const u = currentUser(db);
  if (!u) throw new AppError('UNAUTHORIZED', { status: 401 });
  return u;
}

export function requireRole(db: MockDb, role: UserRole): UserRecord {
  const u = requireUser(db);
  if (u.role !== role) throw new AppError('FORBIDDEN', { status: 403 });
  return u;
}

export function pushNotification(
  db: MockDb,
  n: Pick<MockDb['notifications'][number], 'userId' | 'type' | 'orderId' | 'params'>,
): void {
  db.notifications.push({
    id: crypto.randomUUID(),
    isRead: false,
    createdAt: new Date().toISOString(),
    ...n,
  });
}
