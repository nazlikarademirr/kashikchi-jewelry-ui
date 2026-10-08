import type { Services } from './contracts';
import { apiServices } from './api/apiServices';
import { mockAuthService } from './mock/authService';
import { mockCategoryService, mockProductService } from './mock/catalogService';
import { mockCartService, mockFavoriteService, mockOrderService } from './mock/commerceService';
import { mockDashboardService, mockMessageService, mockNotificationService } from './mock/communicationService';

const mockServices: Services = {
  auth: mockAuthService,
  categories: mockCategoryService,
  products: mockProductService,
  favorites: mockFavoriteService,
  cart: mockCartService,
  orders: mockOrderService,
  notifications: mockNotificationService,
  messages: mockMessageService,
  dashboard: mockDashboardService,
};

const useMock = (import.meta.env.VITE_USE_MOCK as string | undefined) !== 'false';

export const services: Services = useMock ? mockServices : apiServices;
export const isMockMode = useMock;
