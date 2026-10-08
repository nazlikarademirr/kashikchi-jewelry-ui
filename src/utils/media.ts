const MEDIA_BASE = (import.meta.env.VITE_MEDIA_BASE_URL as string | undefined) ?? '';

export function mediaUrl(storageKey: string): string {
  if (/^(https?:|data:image\/|\/)/.test(storageKey)) return storageKey;
  return `${MEDIA_BASE.replace(/\/$/, '')}/${storageKey}`;
}
