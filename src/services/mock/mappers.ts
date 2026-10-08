import type { CartItem, Category, Order, Product, User } from '@/types';
import type { CartItemRecord, CategoryRecord, MockDb, OrderRecord, ProductRecord, UserRecord } from './seed';

export const toUser = (u: UserRecord): User => ({
  id: u.id,
  name: u.name,
  surname: u.surname,
  email: u.email,
  role: u.role,
});

export function toCategoryTree(records: CategoryRecord[], parentId: string | null = null): Category[] {
  return records
    .filter((c) => c.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((c) => ({ ...c, children: toCategoryTree(records, c.id) }));
}

export function toProduct(db: MockDb, p: ProductRecord): Product {
  const category = db.categories.find((c) => c.id === p.categoryId);
  const sub = p.subCategoryId ? db.categories.find((c) => c.id === p.subCategoryId) : null;
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    code: p.code,
    description: p.description,
    stock: p.stock,
    category: category?.id ?? '',
    subCategory: sub?.id ?? null,
    carat: p.carat,
    price: p.price,
    discount: p.discount,
    images: p.imageKeys.map((storageKey, i) => ({ id: `${p.id}-${i}`, storageKey, sortOrder: i })),
    isActive: p.isActive,
    featured: p.featured,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

export function toCartItems(db: MockDb, items: CartItemRecord[]): CartItem[] {
  return items.flatMap((i) => {
    const p = db.products.find((x) => x.id === i.productId && x.isActive);
    return p ? [{ ...i, product: toProduct(db, p) }] : [];
  });
}

export function toOrder(db: MockDb, o: OrderRecord): Order {
  const u = db.users.find((x) => x.id === o.userId);
  return {
    ...o,
    customer: { name: u?.name ?? '—', surname: u?.surname ?? '', email: u?.email ?? '' },
    inProductionAt: (o as any).inProductionAt ?? null,
    readyAt: (o as any).readyAt ?? null,
  };
}
