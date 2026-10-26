import type { ReactNode } from 'react';
import type { Product } from '@/types';
import { useI18n } from '@/contexts/I18nContext';
import { mediaUrl } from '@/utils/media';
import { Modal } from './ui/Modal';

interface ProductCompareDrawerProps {
  products: Product[];
  onClose: () => void;
  onRemove: (productId: string) => void;
}

export function ProductCompareDrawer({ products, onClose, onRemove }: ProductCompareDrawerProps) {
  const { t, loc, price, carat } = useI18n();
  const emptyValue = '–';
  const rows: { label: string; value: (product: Product) => ReactNode }[] = [
    { label: t('listing.compareCode'), value: (product) => product.code || emptyValue },
    { label: t('listing.comparePrice'), value: (product) => price(product.price * (1 - product.discount / 100)) },
    { label: t('listing.compareKarat'), value: (product) => product.goldKarat || emptyValue },
    { label: t('product.metal'), value: (product) => product.metal || emptyValue },
    { label: t('product.carat'), value: (product) => product.carat == null ? emptyValue : `${carat(product.carat)} ct` },
    { label: t('product.diamondColor'), value: (product) => product.diamondColor || emptyValue },
    { label: t('product.diamondClarity'), value: (product) => product.diamondClarity || emptyValue },
    { label: t('listing.compareFeatures'), value: (product) => (
      <div className="compare-table__features">
        {product.features && <p>{product.features}</p>}
        {product.extraFeatures?.map((feature, index) => (
          <p key={`${feature.name}-${index}`}><strong>{feature.name}:</strong> {feature.detail}</p>
        ))}
        {!product.features && !product.extraFeatures?.length && emptyValue}
      </div>
    ) },
  ];

  return (
    <Modal
      open
      title={t('listing.compareTitle')}
      onClose={onClose}
      className="compare-drawer"
      backdropClassName="modal-backdrop--drawer"
    >
      <div className="compare-drawer__table-wrap">
        <table className="compare-table">
          <thead>
            <tr>
              <th scope="col" aria-label={t('listing.compareFeature')} />
              {products.map((product) => (
                <th scope="col" key={product.id}>
                  <div className="compare-table__product">
                    {product.images[0] && <img src={mediaUrl(product.images[0].storageKey)} alt={loc(product.name, `product:${product.code}`)} />}
                    <strong>{loc(product.name, `product:${product.code}`)}</strong>
                    <button type="button" className="compare-table__remove" onClick={() => onRemove(product.id)}>
                      {t('listing.compareRemove')}
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                {products.map((product) => <td key={product.id}>{row.value(product)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
