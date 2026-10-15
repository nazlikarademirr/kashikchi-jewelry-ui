import { useId, useLayoutEffect, useRef } from 'react';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { COUNTRY_CODES } from '@/constants/countries';
import { TURKEY_PROVINCES, getDistricts } from '@/constants/turkeyLocations';
import { useI18n } from '@/contexts/I18nContext';
import type { UserAddress } from '@/types';

const ADDRESS_COUNTRIES = [...COUNTRY_CODES].sort((a, b) => a.name.localeCompare(b.name, 'tr'));

export interface AddressFieldsProps {
  value: UserAddress;
  onChange: (updated: UserAddress) => void;
  onDelete?: () => void;
  error?: Partial<Record<keyof UserAddress, string | null>>;
  disabled?: boolean;
  required?: boolean;
  showTitle?: boolean;
  reserveMessageSpace?: boolean | number;
  titleMessageLines?: number;
}

export function AddressFields({
  value,
  onChange,
  onDelete,
  error,
  disabled = false,
  required = false,
  showTitle = true,
  reserveMessageSpace = true,
  titleMessageLines,
}: AddressFieldsProps) {
  const { t, tDynamic } = useI18n();
  const id = useId();
  const fullAddressRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const field = fullAddressRef.current;
    if (!field) return;
    const resize = () => {
      field.style.height = 'auto';
      field.style.height = `${field.scrollHeight + field.offsetHeight - field.clientHeight}px`;
    };
    resize();
    let width = field.clientWidth;
    const observer = new ResizeObserver(() => {
      if (field.clientWidth !== width) {
        width = field.clientWidth;
        resize();
      }
    });
    observer.observe(field);
    return () => observer.disconnect();
  }, [value.fullAddress]);

  const resolveErr = (err?: string | null) => (err ? tDynamic(err) : null);

  const isTurkey = !value.country || value.country === 'Türkiye' || value.country === 'Turkey';
  const districts = isTurkey && value.city ? getDistricts(value.city) : [];

  const handleFieldChange = (field: keyof UserAddress, val: string) => {
    onChange({ ...value, [field]: val });
  };

  const handleCountryChange = (nextCountry: string) => {
    onChange({
      ...value,
      country: nextCountry,
      // If switched away from Turkey or to Turkey, reset city and district
      city: nextCountry === 'Türkiye' ? value.city : '',
      district: '',
    });
  };

  const handleCityChange = (nextCity: string) => {
    onChange({
      ...value,
      city: nextCity,
      district: '', // Reset district when city changes
    });
  };

  return (
    <div className="address-fields">
      {onDelete && (
        <div className="address-fields__header">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="address-fields__delete"
            style={{ color: 'var(--danger)', height: 32, padding: '4px 8px' }}
          >
            <Icon name="trash" size={16} />
            <span>{t('address.deleteAddress')}</span>
          </Button>
        </div>
      )}

      <div className="form-grid">
        <div className={`form-grid${showTitle ? ' form-grid--2 address-fields__title-country-row' : ''}`}>
          {showTitle && (
            <Input
              id={`${id}-title`}
              label={t('address.addressTitle')}
              value={value.title || ''}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              placeholder={t('address.addressTitlePlaceholder')}
              error={resolveErr(error?.title)}
              required={required}
              disabled={disabled}
              reserveMessageSpace={titleMessageLines ?? reserveMessageSpace}
            />
          )}

          <Select
            id={`${id}-country`}
            label={t('address.country')}
            value={value.country || 'Türkiye'}
            onChange={(e) => handleCountryChange(e.target.value)}
            error={resolveErr(error?.country)}
            required={required}
            disabled={disabled}
            reserveMessageSpace={reserveMessageSpace}
          >
            {ADDRESS_COUNTRIES.map((c) => (
              <option key={c.code} value={c.name}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="form-grid form-grid--2">
          {isTurkey ? (
            <Select
              id={`${id}-city`}
              label={t('address.city')}
              value={value.city || ''}
              onChange={(e) => handleCityChange(e.target.value)}
              error={resolveErr(error?.city)}
              required={required}
              disabled={disabled}
              reserveMessageSpace={reserveMessageSpace}
            >
              <option value="">{t('address.selectCity')}</option>
              {TURKEY_PROVINCES.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </Select>
          ) : (
            <Input
              id={`${id}-city`}
              label={t('address.city')}
              value={value.city || ''}
              onChange={(e) => handleFieldChange('city', e.target.value)}
              error={resolveErr(error?.city)}
              required={required}
              disabled={disabled}
              reserveMessageSpace={reserveMessageSpace}
            />
          )}
          {isTurkey ? (
            <Select
              id={`${id}-district`}
              label={t('address.district')}
              value={value.district || ''}
              onChange={(e) => handleFieldChange('district', e.target.value)}
              error={resolveErr(error?.district)}
              required={required}
              disabled={disabled || !value.city}
              reserveMessageSpace={reserveMessageSpace}
            >
              <option value="">{t('address.selectDistrict')}</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          ) : (
            <Input
              id={`${id}-district`}
              label={t('address.district')}
              value={value.district || ''}
              onChange={(e) => handleFieldChange('district', e.target.value)}
              error={resolveErr(error?.district)}
              required={required}
              disabled={disabled}
              reserveMessageSpace={reserveMessageSpace}
            />
          )}
        </div>

        <Textarea
          ref={fullAddressRef}
          className="address-fields__full-address"
          id={`${id}-fullAddress`}
          label={t('address.fullAddress')}
          value={value.fullAddress || ''}
          onChange={(e) => handleFieldChange('fullAddress', e.target.value.slice(0, 500))}
          placeholder={t('address.fullAddressPlaceholder')}
          rows={3}
          maxLength={500}
          error={resolveErr(error?.fullAddress)}
          required={required}
          disabled={disabled}
          reserveMessageSpace={reserveMessageSpace}
        />
      </div>
    </div>
  );
}
