import type { UserAddress } from '@/types';

export function normalizeAddressTitle(title: string): string {
  return title.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleUpperCase('tr-TR');
}

export function getDeliveryAddressErrors(address: UserAddress, saved: readonly UserAddress[], required: boolean, saveToAccount: boolean) {
  const missing = (value: string) => required && !value.trim() ? 'validation.required' : null;
  return {
    title: missing(address.title) ?? (required && saveToAccount && saved.some((item) =>
      normalizeAddressTitle(item.title) === normalizeAddressTitle(address.title)) ? 'validation.addressTitleTaken' : null),
    country: missing(address.country),
    city: missing(address.city),
    district: missing(address.district),
    fullAddress: missing(address.fullAddress) ?? (required && address.fullAddress.length > 500 ? 'validation.addressMaxLength' : null),
  };
}
