import type { LocalizedText } from './common';

export type UserRole = 0 | 1;

export interface User {
  id: string;
  name: string;
  surname: string;
  email: string | null;
  phone?: string;
  role: UserRole;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  surname: string;
  email?: string;
  phone?: string;
  password: string;
}

export interface UpdateProfileInput {
  name: string;
  surname: string;
  email?: string | null;
  phone?: string | null;
  password?: string | null;
}

export interface Category {
  imageKey?: string;
  id: string;
  name: LocalizedText;
  parentId: string | null;
  sortOrder: number;
    children: Category[];
}

export interface CategoryInput {
  name: LocalizedText;
  parentId: string | null;
  sortOrder: number;
  imageKey?: string;
}

export interface ProductImage {
  id: string;
    storageKey: string;
  sortOrder: number;
}

export interface Product {
  id: string;
  slug: string;
  name: LocalizedText;
  code: string;
  description: LocalizedText;
  features?: string;
  stock: number;
  category: string;
  subCategory: string | null;
  goldKarat: string;
  carat: number | null;
  price: number;
  discount: number;
  images: ProductImage[];
  isActive: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductInput {
  name: LocalizedText;
  code: string;
  description: LocalizedText;
  features?: string;
  stock: number;
  category: string;
  subCategory: string | null;
  goldKarat: string;
  carat: number | null;
  price: number;
  discount: number;
  imageKeys: string[];
  isActive: boolean;
  featured: boolean;
}

export type ProductSort = 'newest' | 'priceAsc' | 'priceDesc' | 'caratDesc';

export interface ProductQuery {
  category?: string;
  subCategory?: string;
  search?: string;
  featured?: boolean;
    includeInactive?: boolean;
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
}

export interface Favorite {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
}
