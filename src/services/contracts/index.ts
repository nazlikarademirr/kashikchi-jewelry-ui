import type {
  AddToCartInput,
  CartItem,
  Category,
  CategoryInput,
  CreateOrderInput,
  DashboardStats,
  LoginInput,
  Message,
  MessageThread,
  Notification,
  Order,
  OrderFilter,
  OrderStatus,
  Paged,
  Product,
  ProductInput,
  ProductQuery,
  RegisterInput,
  User,
} from '@/types';


export interface AuthService {
  login(input: LoginInput): Promise<User>;
  register(input: RegisterInput): Promise<User>;
  logout(): Promise<void>;
    me(): Promise<User | null>;
}

export interface CategoryService {
  getTree(): Promise<Category[]>;
  create(input: CategoryInput): Promise<Category>;
  update(id: string, input: CategoryInput): Promise<Category>;
  reorder(items: { id: string; sortOrder: number }[]): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface ProductService {
  list(query?: ProductQuery): Promise<Paged<Product>>;
    get(idOrSlug: string): Promise<Product>;
    uploadImage(file: File): Promise<string>;
  create(input: ProductInput): Promise<Product>;
  update(id: string, input: ProductInput): Promise<Product>;
  updateStock(id: string, stock: number): Promise<Product>;
  setActive(id: string, isActive: boolean): Promise<Product>;
}

export interface FavoriteService {
  list(): Promise<Product[]>;
  listIds(): Promise<string[]>;
  add(productId: string): Promise<void>;
  remove(productId: string): Promise<void>;
}

export interface CartService {
  get(): Promise<CartItem[]>;
  add(input: AddToCartInput): Promise<CartItem[]>;
  updateQuantity(itemId: string, quantity: number): Promise<CartItem[]>;
  updateNote(itemId: string, note: string): Promise<CartItem[]>;
  remove(itemId: string): Promise<CartItem[]>;
  clear(): Promise<void>;
}

export interface OrderService {
    create(input: CreateOrderInput): Promise<Order>;
    list(filter?: OrderFilter): Promise<Order[]>;
  get(id: string): Promise<Order>;
  updateStatus(id: string, status: OrderStatus): Promise<Order>;
}

export interface NotificationService {
  list(): Promise<Notification[]>;
  unreadCount(): Promise<number>;
  markRead(id: string): Promise<void>;
  markAllRead(): Promise<void>;
}

export type Unsubscribe = () => void;

export interface MessageService {
  listThreads(): Promise<MessageThread[]>;
  list(orderId: string): Promise<Message[]>;
  send(orderId: string, text: string): Promise<Message>;
  markRead(orderId: string): Promise<void>;
    subscribe(orderId: string, onChange: () => void): Unsubscribe;
}

export interface DashboardService {
  getStats(): Promise<DashboardStats>;
}

export interface Services {
  auth: AuthService;
  categories: CategoryService;
  products: ProductService;
  favorites: FavoriteService;
  cart: CartService;
  orders: OrderService;
  notifications: NotificationService;
  messages: MessageService;
  dashboard: DashboardService;
}
