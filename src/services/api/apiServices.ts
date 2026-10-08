import type { Category, CartItem, Message, MessageThread, Notification, Order, Paged, Product, User, DashboardStats } from '@/types';
import type { Services } from '../contracts';
import { http, setTokens } from './httpClient';

export const apiServices: Services = {
  auth: {
    login: async (input) => {
      const res = await http<{ user: User; accessToken: string; refreshToken: string }>('/auth/login', { method: 'POST', body: input });
      setTokens(res.accessToken, res.refreshToken);
      return res.user;
    },
    register: async (input) => {
      const res = await http<{ user: User; accessToken: string; refreshToken: string }>('/auth/register', { method: 'POST', body: input });
      setTokens(res.accessToken, res.refreshToken);
      return res.user;
    },
    logout: async () => {
      try { await http('/auth/logout', { method: 'POST' }); } catch {}
      setTokens(null, null);
    },
    me: async () => {
      const user = await http<User | null>('/auth/me', { allowUnauthorized: true });
      if (!user) setTokens(null, null);
      return user;
    },
  },
  categories: {
    getTree: () => http<Category[]>('/categories'),
    create: (input) => http<Category>('/categories', { method: 'POST', body: input }),
    update: (id, input) => http<Category>(`/categories/${id}`, { method: 'PUT', body: input }),
    reorder: (items) => http('/categories/reorder', { method: 'PUT', body: items }),
    delete: (id) => http(`/categories/${id}`, { method: 'DELETE' }),
  },
  products: {
    list: (query = {}) => http<Paged<Product>>('/products', { query: { ...query } }),
    get: (idOrSlug) => http<Product>(`/products/${encodeURIComponent(idOrSlug)}`),
    uploadImage: async (file) => {
      const fd = new FormData();
      fd.append('file', file);
      const res = await http<{ storageKey: string }>('/admin/products/images', { method: 'POST', formData: fd });
      return res.storageKey;
    },
    create: (input) => http<Product>('/admin/products', { method: 'POST', body: input }),
    update: (id, input) => http<Product>(`/admin/products/${id}`, { method: 'PUT', body: input }),
    updateStock: (id, stock) => http<Product>(`/admin/products/${id}/stock`, { method: 'PATCH', body: { stock } }),
    setActive: (id, isActive) => http<Product>(`/admin/products/${id}/active`, { method: 'PATCH', body: { isActive } }),
  },
  favorites: {
    list: () => http<Product[]>('/favorites'),
    listIds: () => http<string[]>('/favorites/ids'),
    add: (productId) => http(`/favorites/${productId}`, { method: 'PUT' }),
    remove: (productId) => http(`/favorites/${productId}`, { method: 'DELETE' }),
  },
  cart: {
    get: () => http<CartItem[]>('/cart'),
    add: (input) => http<CartItem[]>('/cart/items', { method: 'POST', body: input }),
    updateQuantity: (id, quantity) => http<CartItem[]>(`/cart/items/${id}/quantity`, { method: 'PATCH', body: { quantity } }),
    updateNote: (id, note) => http<CartItem[]>(`/cart/items/${id}/note`, { method: 'PATCH', body: { note } }),
    remove: (id) => http<CartItem[]>(`/cart/items/${id}`, { method: 'DELETE' }),
    clear: () => http('/cart', { method: 'DELETE' }),
  },
  orders: {
    create: (input) => http<Order>('/orders', { method: 'POST', body: input }),
    list: (filter) => http<Order[]>('/orders', { query: { ...filter } }),
    get: (id) => http<Order>(`/orders/${id}`),
    updateStatus: (id, status) => http<Order>(`/admin/orders/${id}/status`, { method: 'PATCH', body: { status } }),
  },
  notifications: {
    list: () => http<Notification[]>('/notifications'),
    unreadCount: async () => (await http<{ count: number }>('/notifications/unread-count')).count,
    markRead: (id) => http(`/notifications/${id}/read`, { method: 'POST' }),
    markAllRead: () => http('/notifications/read-all', { method: 'POST' }),
  },
  messages: {
    listThreads: () => http<MessageThread[]>('/messages/threads'),
    list: (orderId) => http<Message[]>(`/orders/${orderId}/messages`),
    send: (orderId, message) => http<Message>(`/orders/${orderId}/messages`, { method: 'POST', body: { message } }),
    markRead: (orderId) => http(`/orders/${orderId}/messages/read`, { method: 'POST' }),
    
    subscribe: (_orderId, onChange) => {
      const timer = window.setInterval(onChange, 8000);
      return () => window.clearInterval(timer);
    },
  },
  dashboard: {
    getStats: () => http<DashboardStats>('/admin/dashboard'),
  },
};
