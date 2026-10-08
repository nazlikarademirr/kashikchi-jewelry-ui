import { ORDER_STATUSES, LOW_STOCK_THRESHOLD } from '@/constants';
import { AppError, type DashboardStats, type Message, type MessageThread, type OrderStatus } from '@/types';
import type { DashboardService, MessageService, NotificationService } from '../contracts';
import { delay, pushNotification, readDb, requireRole, requireUser, writeDb } from './db';
import { toOrder } from './mappers';
import type { MockDb } from './seed';
import { finalPrice } from '@/utils/format';
import { sanitizeText } from '@/utils/validation';


export const mockNotificationService: NotificationService = {
  async list() {
    await delay(100);
    const db = await readDb();
    const user = requireUser(db);
    return db.notifications.filter((n) => n.userId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async unreadCount() {
    const db = await readDb();
    const user = requireUser(db);
    return db.notifications.filter((n) => n.userId === user.id && !n.isRead).length;
  },

  async markRead(id) {
    const db = await readDb();
    const user = requireUser(db);
    const n = db.notifications.find((x) => x.id === id && x.userId === user.id);
    if (n && !n.isRead) {
      n.isRead = true;
      writeDb(db);
    }
  },

  async markAllRead() {
    const db = await readDb();
    const user = requireUser(db);
    db.notifications.forEach((n) => {
      if (n.userId === user.id) n.isRead = true;
    });
    writeDb(db);
  },
};


function authorizeOrder(db: MockDb, orderId: string) {
  const user = requireUser(db);
  const order = db.orders.find((o) => o.id === orderId);
  if (!order || (user.role !== 1 && order.userId !== user.id)) throw new AppError('NOT_FOUND', { status: 404 });
  return { user, order };
}

export const mockMessageService: MessageService = {
  async listThreads() {
    await delay(100);
    const db = await readDb();
    const user = requireUser(db);
    const orders = db.orders.filter((o) => (user.role === 1 ? true : o.userId === user.id));
    const threads: MessageThread[] = orders.map((o) => {
      const msgs = db.messages.filter((m) => m.orderId === o.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      const owner = db.users.find((u) => u.id === o.userId);
      return {
        orderId: o.id,
        customerName: owner ? `${owner.name} ${owner.surname}` : '—',
        lastMessage: msgs[msgs.length - 1] ?? null,
        unreadCount: msgs.filter((m) => m.senderUserId !== user.id && !m.isRead && (user.role === 1 ? m.senderRole === 0 : true)).length,
        orderStatus: o.status,
      };
    });
    return threads
      .filter((t) => user.role !== 1 || t.lastMessage)
      .sort((a, b) => (b.lastMessage?.createdAt ?? '').localeCompare(a.lastMessage?.createdAt ?? ''));
  },

  async list(orderId) {
    await delay(80);
    const db = await readDb();
    authorizeOrder(db, orderId);
    return db.messages.filter((m) => m.orderId === orderId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },

  async send(orderId, text) {
    await delay(120);
    const db = await readDb();
    const { user, order } = authorizeOrder(db, orderId);
    const body = sanitizeText(text, 2000);
    if (!body) throw new AppError('VALIDATION_FAILED', { fieldErrors: { message: 'validation.required' }, status: 422 });
    const message: Message = {
      id: crypto.randomUUID(),
      orderId,
      senderUserId: user.id,
      senderName: user.role === 1 ? 'Kashikchi' : `${user.name} ${user.surname}`,
      senderRole: user.role,
      message: body,
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    db.messages.push(message);
    const recipients = user.role === 1 ? [order.userId] : db.users.filter((u) => u.role === 1).map((u) => u.id);
    for (const userId of recipients) {
      pushNotification(db, { userId, type: 'NEW_MESSAGE', orderId, params: { sender: message.senderName } });
    }
    writeDb(db);
    return message;
  },

  async markRead(orderId) {
    const db = await readDb();
    const { user } = authorizeOrder(db, orderId);
    let changed = false;
    db.messages.forEach((m) => {
      if (m.orderId === orderId && m.senderUserId !== user.id && !m.isRead && (user.role !== 1 || m.senderRole === 0)) {
        m.isRead = true;
        changed = true;
      }
    });
    db.notifications.forEach((n) => {
      if (n.userId === user.id && n.orderId === orderId && n.type === 'NEW_MESSAGE' && !n.isRead) {
        n.isRead = true;
        changed = true;
      }
    });
    if (changed) writeDb(db);
  },

  subscribe(_orderId, onChange) {
    
    const timer = window.setInterval(onChange, 5000);
    const onStorage = () => onChange();
    window.addEventListener('storage', onStorage);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('storage', onStorage);
    };
  },
};


export const mockDashboardService: DashboardService = {
  async getStats(): Promise<DashboardStats> {
    await delay(150);
    const db = await readDb();
    requireRole(db, 1);
    const ordersByStatus = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0])) as Record<OrderStatus, number>;
    db.orders.forEach((o) => (ordersByStatus[o.status] += 1));
    const activeOrders = db.orders.filter(o => o.status === 'ORDER_RECEIVED' || o.status === 'IN_PRODUCTION');
    return {
      totalProducts: db.products.length,
      activeProducts: db.products.filter((p) => p.isActive).length,
      lowStockProducts: db.products.filter((p) => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD).length,
      madeToOrderProducts: db.products.filter((p) => p.stock === 0).length,
      totalOrders: activeOrders.length,
      ordersByStatus,
      revenue: activeOrders.reduce((s, o) => s + o.items.reduce((x, i) => x + i.unitPrice * i.quantity, 0), 0),
      recentOrders: [...db.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5).map((o) => toOrder(db, o)),
    };
  },
};


void finalPrice;
