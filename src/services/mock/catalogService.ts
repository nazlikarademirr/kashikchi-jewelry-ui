import { IMAGE_UPLOAD } from '@/constants';
import { AppError, type Paged, type Product, type ProductInput, type ProductQuery } from '@/types';
import type { CategoryService, ProductService } from '../contracts';
import { currentUser, delay, readDb, requireRole, writeDb } from './db';
import { toCategoryTree, toProduct } from './mappers';
import type { MockDb, ProductRecord } from './seed';
import { finalPrice } from '@/utils/format';
import { sanitizeText, slugify, v } from '@/utils/validation';

export const mockCategoryService: CategoryService = {
  async getTree() {
    await delay(80);
    const db = await readDb();
    return toCategoryTree(db.categories);
  },
  async create() { throw new Error('Not implemented'); },
  async update() { throw new Error('Not implemented'); },
  async reorder() {},
  async delete() { throw new Error('Not implemented'); },
};

async function sniffImage(file: File): Promise<boolean> {
  const b = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const hex = (i: number, n: number) => Array.from(b.slice(i, i + n), (x) => x.toString(16).padStart(2, '0')).join('');
  const isJpeg = hex(0, 3) === 'ffd8ff';
  const isPng = hex(0, 4) === '89504e47';
  const isWebp = hex(0, 4) === '52494646' && hex(8, 4) === '57454250';
  return isJpeg || isPng || isWebp;
}

const readAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new AppError('UPLOAD_FAILED'));
    r.readAsDataURL(file);
  });

function validateInput(db: MockDb, input: ProductInput, excludeId?: string): Record<string, string> {
  const e: Record<string, string> = {};
  const set = (key: string, r: string | null) => {
    if (r) e[key] = r;
  };
  set('name', v.required(input.name.tr));
  // Description is optional
  if (input.description.tr && input.description.tr.length > 4000) e.description = 'validation.maxLength';
  set('code', v.code(input.code));
  if (!e.code) {
    const code = input.code.trim().toUpperCase();
    if (db.products.some((p) => p.code.toUpperCase() === code && p.id !== excludeId)) e.code = 'validation.codeTaken';
  }
  set('stock', v.nonNegativeInt(input.stock));
  set('price', v.positive(input.price));
  if (input.carat !== null && input.carat !== undefined) set('carat', v.positive(input.carat));
  set('discount', v.discount(input.discount));

  const cat = db.categories.find((c) => c.id === input.category && c.parentId === null);
  if (!cat) e.category = 'validation.categoryInvalid';
  if (input.subCategory) {
    const sub = db.categories.find((c) => c.id === input.subCategory && c.parentId === cat?.id);
    if (!sub) e.subCategory = 'validation.categoryInvalid';
  }
  if (input.imageKeys.length < 1 || input.imageKeys.length > IMAGE_UPLOAD.maxFiles) e.images = 'validation.imagesRequired';
  return e;
}

function uniqueSlug(db: MockDb, base: string, excludeId?: string): string {
  const root = slugify(base) || 'urun';
  let slug = root;
  let n = 2;
  while (db.products.some((p) => p.slug === slug && p.id !== excludeId)) slug = `${root}-${n++}`;
  return slug;
}

function apply(db: MockDb, input: ProductInput, target: Partial<ProductRecord>): void {
  const cat = db.categories.find((c) => c.id === input.category && c.parentId === null)!;
  const sub = input.subCategory ? db.categories.find((c) => c.id === input.subCategory && c.parentId === cat.id) : null;
  Object.assign(target, {
    name: { tr: sanitizeText(input.name.tr, 160), en: sanitizeText(input.name.en, 160) || sanitizeText(input.name.tr, 160) },
    description: {
      tr: sanitizeText(input.description.tr, 4000),
      en: sanitizeText(input.description.en, 4000) || sanitizeText(input.description.tr, 4000),
    },
    code: input.code.trim().toUpperCase(),
    stock: input.stock,
    categoryId: cat.id,
    subCategoryId: sub?.id ?? null,
    carat: input.carat,
    price: input.price,
    discount: input.discount,
    imageKeys: input.imageKeys,
    isActive: input.isActive,
    featured: input.featured,
    updatedAt: new Date().toISOString(),
  } satisfies Partial<ProductRecord>);
}

export const mockProductService: ProductService = {
  async list(query: ProductQuery = {}): Promise<Paged<Product>> {
    await delay();
    const db = await readDb();
    const isAdmin = currentUser(db)?.role === 1;
    const showInactive = Boolean(query.includeInactive) && isAdmin; 

    let rows = db.products.filter((p) => showInactive || p.isActive);
    if (query.category) {
      const cat = db.categories.find((c) => c.id === query.category && c.parentId === null);
      rows = rows.filter((p) => p.categoryId === cat?.id);
      if (query.subCategory) {
        const sub = db.categories.find((c) => c.id === query.subCategory && c.parentId === cat?.id);
        rows = rows.filter((p) => p.subCategoryId === sub?.id);
      }
    }
    if (query.featured) rows = rows.filter((p) => p.featured);
    if (query.search?.trim()) {
      const q = query.search.trim().toLocaleLowerCase('tr');
      rows = rows.filter((p) =>
        [p.name.tr, p.name.en, p.code].some((s) => s.toLocaleLowerCase('tr').includes(q)),
      );
    }
    const sorters: Record<NonNullable<ProductQuery['sort']>, (a: ProductRecord, b: ProductRecord) => number> = {
      newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
      priceAsc: (a, b) => finalPrice(a) - finalPrice(b),
      priceDesc: (a, b) => finalPrice(b) - finalPrice(a),
      caratDesc: (a, b) => (b.carat ?? 0) - (a.carat ?? 0),
    };
    rows = [...rows].sort(sorters[query.sort ?? 'newest']);

    const pageSize = Math.min(Math.max(query.pageSize ?? 12, 1), 48);
    const page = Math.max(query.page ?? 1, 1);
    const start = (page - 1) * pageSize;
    return {
      items: rows.slice(start, start + pageSize).map((p) => toProduct(db, p)),
      total: rows.length,
      page,
      pageSize,
    };
  },

  async get(idOrSlug) {
    await delay(100);
    const db = await readDb();
    const rec = db.products.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
    const isAdmin = currentUser(db)?.role === 1;
    if (!rec || (!rec.isActive && !isAdmin)) throw new AppError('NOT_FOUND', { status: 404 });
    return toProduct(db, rec);
  },

  async uploadImage(file) {
    await delay(200);
    const db = await readDb();
    requireRole(db, 1);
    if (!(IMAGE_UPLOAD.allowedTypes as readonly string[]).includes(file.type)) throw new AppError('UPLOAD_TYPE', { status: 415 });
    if (file.size > IMAGE_UPLOAD.maxBytes) throw new AppError('UPLOAD_TOO_LARGE', { status: 413 });
    if (!(await sniffImage(file))) throw new AppError('UPLOAD_TYPE', { status: 415 });
    
    return readAsDataUrl(file);
  },

  async create(input) {
    await delay();
    const db = await readDb();
    requireRole(db, 1);
    const fieldErrors = validateInput(db, input);
    if (Object.keys(fieldErrors).length) throw new AppError('VALIDATION_FAILED', { fieldErrors, status: 422 });
    const now = new Date().toISOString();
    const rec = { id: crypto.randomUUID(), slug: uniqueSlug(db, input.name.tr), createdAt: now } as ProductRecord;
    apply(db, input, rec);
    db.products.push(rec);
    writeDb(db);
    return toProduct(db, rec);
  },

  async update(id, input) {
    await delay();
    const db = await readDb();
    requireRole(db, 1);
    const rec = db.products.find((p) => p.id === id);
    if (!rec) throw new AppError('NOT_FOUND', { status: 404 });
    const fieldErrors = validateInput(db, input, id);
    if (Object.keys(fieldErrors).length) throw new AppError('VALIDATION_FAILED', { fieldErrors, status: 422 });
    apply(db, input, rec);
    writeDb(db);
    return toProduct(db, rec);
  },

  async updateStock(id, stock) {
    await delay(100);
    const db = await readDb();
    requireRole(db, 1);
    const rec = db.products.find((p) => p.id === id);
    if (!rec) throw new AppError('NOT_FOUND', { status: 404 });
    if (v.nonNegativeInt(stock)) throw new AppError('VALIDATION_FAILED', { fieldErrors: { stock: v.nonNegativeInt(stock)! }, status: 422 });
    rec.stock = stock;
    rec.updatedAt = new Date().toISOString();
    writeDb(db);
    return toProduct(db, rec);
  },

  async setActive(id, isActive) {
    await delay(100);
    const db = await readDb();
    requireRole(db, 1);
    const rec = db.products.find((p) => p.id === id);
    if (!rec) throw new AppError('NOT_FOUND', { status: 404 });
    rec.isActive = isActive;
    rec.updatedAt = new Date().toISOString();
    writeDb(db);
    return toProduct(db, rec);
  },
};
