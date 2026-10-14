import { afterEach, expect, it, vi } from 'vitest';
import { apiServices } from './apiServices';

afterEach(() => vi.unstubAllGlobals());

it('sends every selected category without losing other product filters', async () => {
  vi.stubGlobal('localStorage', { getItem: () => null, removeItem: vi.fn() });
  vi.stubGlobal('window', { location: { origin: 'http://localhost' } });
  const fetchMock = vi.fn(async (url: URL | string) => {
    const query = new URL(url).searchParams;
    expect(query.getAll('categories')).toEqual(['ring-id', 'necklace-id']);
    expect(query.get('minCarat')).toBe('1');
    expect(query.get('sort')).toBe('caratAsc');
    expect(query.get('pageSize')).toBe('50');
    return Response.json({ items: [], total: 0, page: 1, pageSize: 50 });
  });
  vi.stubGlobal('fetch', fetchMock);
  await apiServices.products.list({ categories: ['ring-id', 'necklace-id'], minCarat: 1, sort: 'caratAsc', pageSize: 50 });
  expect(fetchMock).toHaveBeenCalledOnce();
});
