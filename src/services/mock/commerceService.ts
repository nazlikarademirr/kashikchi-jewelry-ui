import { MAX_CART_QUANTITY } from '@/constants';
import { AppError } from '@/types';
import type { CartService, FavoriteService, OrderService } from '../contracts';
import { delay, pushNotification, readDb, requireRole, requireUser, writeDb } from './db';
import { toCartItems, toOrder, toProduct } from './mappers';
import type { CartRecord, MockDb, OrderRecord } from './seed';
import { finalPrice } from '@/utils/format';
import { sanitizeText, v } from '@/utils/validation';
import { ORDER_STATUSES } from '@/constants';


export const mockFavoriteService: FavoriteService = {
  async list() {
    await delay(100);
    const db = await readDb();
    const user = requireRole(db, 0);
    return db.favorites
      .filter((f) => f.userId === user.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .flatMap((f) => {
        const p = db.products.find((x) => x.id === f.productId && x.isActive);
        return p ? [toProduct(db, p)] : [];
      });
  },

  async listIds() {
    const db = await readDb();
    const user = requireRole(db, 0);
    return db.favorites.filter((f) => f.userId === user.id).map((f) => f.productId);
  },

  async add(productId) {
    await delay(80);
    const db = await readDb();
    const user = requireRole(db, 0);
    if (!db.products.some((p) => p.id === productId && p.isActive)) throw new AppError('NOT_FOUND', { status: 404 });
    
    if (db.favorites.some((f) => f.userId === user.id && f.productId === productId)) return;
    db.favorites.push({ id: crypto.randomUUID(), userId: user.id, productId, createdAt: new Date().toISOString() });
    writeDb(db);
  },

  async remove(productId) {
    await delay(80);
    const db = await readDb();
    const user = requireRole(db, 0);
    db.favorites = db.favorites.filter((f) => !(f.userId === user.id && f.productId === productId));
    writeDb(db);
  },
};


function getCart(db: MockDb, userId: string): CartRecord {
  let cart = db.carts.find((c) => c.userId === userId);
  if (!cart) {
    cart = { userId, items: [] };
    db.carts.push(cart);
  }
  return cart;
}

function assertQuantity(db: MockDb, cart: CartRecord, productId: string, quantity: number, ignoreItemId?: string): void {
  const product = db.products.find((p) => p.id === productId && p.isActive);
  if (!product) throw new AppError('NOT_FOUND', { status: 404 });
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_CART_QUANTITY) throw new AppError('INVALID_QUANTITY', { status: 422 });
  if (product.stock > 0) {
    const others = cart.items
      .filter((i) => i.productId === productId && i.id !== ignoreItemId)
      .reduce((s, i) => s + i.quantity, 0);
    if (others + quantity > product.stock) throw new AppError('INSUFFICIENT_STOCK', { status: 409 });
  }
}

export const mockCartService: CartService = {
  async get() {
    await delay(80);
    const db = await readDb();
    const user = requireRole(db, 0);
    return toCartItems(db, getCart(db, user.id).items);
  },

  async add({ productId, quantity, customizationNote }) {
    await delay(100);
    const db = await readDb();
    const user = requireRole(db, 0);
    const cart = getCart(db, user.id);
    const note = sanitizeText(customizationNote ?? '', 1000);
    const existing = cart.items.find((i) => i.productId === productId && i.customizationNote === note);
    assertQuantity(db, cart, productId, (existing?.quantity ?? 0) + quantity, existing?.id);
    if (existing) existing.quantity += quantity;
    else cart.items.push({ id: crypto.randomUUID(), productId, quantity, customizationNote: note });
    writeDb(db);
    return toCartItems(db, cart.items);
  },

  async updateQuantity(itemId, quantity) {
    await delay(60);
    const db = await readDb();
    const user = requireRole(db, 0);
    const cart = getCart(db, user.id);
    const item = cart.items.find((i) => i.id === itemId);
    if (!item) throw new AppError('NOT_FOUND', { status: 404 });
    assertQuantity(db, cart, item.productId, quantity, itemId);
    item.quantity = quantity;
    writeDb(db);
    return toCartItems(db, cart.items);
  },

  async updateNote(itemId, note) {
    await delay(60);
    const db = await readDb();
    const user = requireRole(db, 0);
    const cart = getCart(db, user.id);
    const item = cart.items.find((i) => i.id === itemId);
    if (!item) throw new AppError('NOT_FOUND', { status: 404 });
    item.customizationNote = sanitizeText(note, 1000);
    writeDb(db);
    return toCartItems(db, cart.items);
  },

  async remove(itemId) {
    await delay(60);
    const db = await readDb();
    const user = requireRole(db, 0);
    const cart = getCart(db, user.id);
    cart.items = cart.items.filter((i) => i.id !== itemId);
    writeDb(db);
    return toCartItems(db, cart.items);
  },

  async clear() {
    const db = await readDb();
    const user = requireRole(db, 0);
    getCart(db, user.id).items = [];
    writeDb(db);
  },
};


export const mockOrderService: OrderService = {
  async create({ contactPhone, customerNote }) {
    await delay(250);
    const db = await readDb();
    
    const user = requireRole(db, 0);
    const phoneErr = v.phone(contactPhone);
    if (phoneErr) throw new AppError('VALIDATION_FAILED', { fieldErrors: { contactPhone: phoneErr }, status: 422 });

    const cart = getCart(db, user.id);
    if (cart.items.length === 0) throw new AppError('CART_EMPTY', { status: 409 });

    const orderId = crypto.randomUUID();
    const now = new Date().toISOString();

    
    for (const line of cart.items) assertQuantity(db, cart, line.productId, line.quantity, line.id);

    const items = cart.items.map((line) => {
      const p = db.products.find((x) => x.id === line.productId)!;
      return {
        id: crypto.randomUUID(),
        orderId,
        productId: p.id,
        productName: p.name,
        productCode: p.code,
        productImage: p.imageKeys[0] ?? null,
        quantity: line.quantity,
        unitPrice: finalPrice(p), 
        customizationNote: line.customizationNote,
      };
    });

    
    for (const line of cart.items) {
      const p = db.products.find((x) => x.id === line.productId)!;
      if (p.stock > 0) p.stock = Math.max(0, p.stock - line.quantity);
    }

    const order: OrderRecord = {
      id: orderId,
      userId: user.id,
      status: 'ORDER_RECEIVED',
      totalPrice: items.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
      contactPhone: contactPhone.trim(),
      customerNote: sanitizeText(customerNote ?? '', 1000),
      items,
      createdAt: now,
      updatedAt: now,
    };
    db.orders.push(order);
    cart.items = [];

    // Tüm admin hesaplarına bildirim + müşteriye onay bildirimi
    const customer = `${user.name} ${user.surname}`;
    for (const admin of db.users.filter((u) => u.role === 1)) {
      pushNotification(db, { userId: admin.id, type: 'ORDER_CREATED', orderId, params: { customer } });
    }
    pushNotification(db, { userId: user.id, type: 'ORDER_CREATED', orderId, params: { customer } });

    writeDb(db);
    return toOrder(db, order);
  },

  async list(filter) {
    await delay(120);
    const db = await readDb();
    const user = requireUser(db);
    return db.orders
      .filter((o) => (user.role === 1 ? true : o.userId === user.id))
      .filter((o) => !filter?.status || o.status === filter.status)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((o) => toOrder(db, o));
  },

  async get(id) {
    await delay(100);
    const db = await readDb();
    const user = requireUser(db);
    const order = db.orders.find((o) => o.id === id);
    
    if (!order || (user.role !== 1 && order.userId !== user.id)) throw new AppError('NOT_FOUND', { status: 404 });
    return toOrder(db, order);
  },

  async updateStatus(id, status) {
    await delay(150);
    const db = await readDb();
    requireRole(db, 1);
    if (!ORDER_STATUSES.includes(status)) throw new AppError('VALIDATION_FAILED', { status: 422 });
    const order = db.orders.find((o) => o.id === id);
    if (!order) throw new AppError('NOT_FOUND', { status: 404 });
    if (order.status !== status) {
      order.status = status;
      order.updatedAt = new Date().toISOString();
      pushNotification(db, { userId: order.userId, type: 'ORDER_STATUS_CHANGED', orderId: id, params: { status } });
      writeDb(db);
    }
    return toOrder(db, order);
  },
};
