import type { LocalizedText } from './common';
import type { Product, User } from './catalog';

export type OrderStatus = 'ORDER_RECEIVED' | 'IN_PRODUCTION' | 'READY';

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
    customizationNote: string;
  product: Product;
}

export interface AddToCartInput {
  productId: string;
  quantity: number;
  customizationNote?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
    productName: LocalizedText;
  productCode: string;
  productImage: string | null;
  quantity: number;
    unitPrice: number;
  customizationNote: string;
    customizationAttributes?: Record<string, string>;
}

export interface Order {
  id: string;
  userId: string;
  customer: Pick<User, 'name' | 'surname' | 'email'>;
  status: OrderStatus;
  totalPrice: number;
  contactPhone: string;
  customerNote: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
  inProductionAt: string | null;
  readyAt: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
  deletionReason: string | null;
  deletionNote: string | null;
}

export type DeleteOrderReason = 'ORDER_CANCELLED' | 'WRONG_ORDER' | 'TEST_ORDER' | 'OTHER';

export interface DeleteOrderInput {
  reason: DeleteOrderReason;
  note?: string;
}

export interface CreateOrderInput {
  contactPhone: string;
  customerNote?: string;
}

export interface OrderFilter {
  status?: OrderStatus;
  isDeleted?: boolean;
}

export type NotificationType = 'ORDER_CREATED' | 'ORDER_STATUS_CHANGED' | 'NEW_MESSAGE';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  orderId: string | null;
    params: Record<string, string>;
  isRead: boolean;
  createdAt: string;
}

export interface Message {
  id: string;
  orderId: string;
  senderUserId: string;
  senderName: string;
  senderRole: 0 | 1;
  message: string;
  createdAt: string;
  isRead: boolean;
}

export interface MessageThread {
  orderId: string;
  customerName: string;
  lastMessage: Message | null;
  unreadCount: number;
  orderStatus: OrderStatus;
}

export interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  ordersByStatus: Record<OrderStatus, number>;
  revenue: number;
  recentOrders: Order[];
}
