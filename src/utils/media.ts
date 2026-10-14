const MEDIA_BASE = (import.meta.env.VITE_MEDIA_BASE_URL as string | undefined) ?? '';

const BUNDLED_MEDIA: Record<string, string> = {
  'products/92d4f938f3a342898b225697146000df.jpg': '/images/products/92d4f938f3a342898b225697146000df.jpg',
  'products/5af982cbeb8f4656a5cdafa1e4ecf49a.jpg': '/images/products/5af982cbeb8f4656a5cdafa1e4ecf49a.jpg',
};

export function mediaUrl(storageKey: string): string {
  if (!storageKey) return '';
  if (BUNDLED_MEDIA[storageKey]) return BUNDLED_MEDIA[storageKey];
  if (/^(https?:|data:image\/|\/)/.test(storageKey)) return storageKey;
  return `${MEDIA_BASE.replace(/\/$/, '')}/${storageKey}`;
}

