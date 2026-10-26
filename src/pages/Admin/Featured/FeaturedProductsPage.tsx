import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Misc';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/State';
import { useI18n } from '@/contexts/I18nContext';
import { useToast } from '@/contexts/ToastContext';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { services } from '@/services';
import { AppError, isAppError, type Product } from '@/types';
import { finalPrice } from '@/utils/format';
import { mediaUrl } from '@/utils/media';

const MAX_FEATURED = 20;

export default function FeaturedProductsPage() {
  const { t, loc, price, carat } = useI18n();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [items, setItems] = useState<Product[]>([]);
  const [savingOrder, setSavingOrder] = useState(false);

  // Remove confirmation modal
  const [removeTarget, setRemoveTarget] = useState<Product | null>(null);
  const [removing, setRemoving] = useState(false);

  // Add products modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [candidates, setCandidates] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);

  useDocumentMeta({ title: t('admin.featured.title'), noindex: true });

  const loadFeatured = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await services.products.list({ featured: true, pageSize: MAX_FEATURED });
      setItems(res.items);
    } catch (e) {
      setError(isAppError(e) ? e : new AppError('UNKNOWN'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFeatured();
  }, []);

  // Open modal to add products
  const openAddModal = async () => {
    setSelectedIds([]);
    setSearch('');
    setAddModalOpen(true);
    setLoadingCandidates(true);
    try {
      const res = await services.products.list({ includeInactive: false, pageSize: 200, sort: 'newest' });
      // Filter out products already featured
      const featuredSet = new Set(items.map((p) => p.id));
      setCandidates(res.items.filter((p) => !featuredSet.has(p.id)));
    } catch (e) {
      toast.error('errors.UNKNOWN');
      void e;
    } finally {
      setLoadingCandidates(false);
    }
  };

  const remainingSlots = Math.max(0, MAX_FEATURED - items.length);

  // Filter candidates by search term
  const filteredCandidates = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter((p) => {
      const trName = (p.name.tr || '').toLowerCase();
      const enName = (p.name.en || '').toLowerCase();
      const code = (p.code || '').toLowerCase();
      return trName.includes(q) || enName.includes(q) || code.includes(q);
    });
  }, [candidates, search]);

  const toggleSelectCandidate = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= remainingSlots) {
        toast.error('admin.featured.maxLimitReached');
        return prev;
      }
      return [...prev, id];
    });
  };

  // Add selected products to featured
  const handleAddSelected = async () => {
    if (selectedIds.length === 0) return;
    if (items.length + selectedIds.length > MAX_FEATURED) {
      toast.error('admin.featured.maxLimitReached');
      return;
    }
    setAdding(true);
    try {
      const combinedIds = [...items.map((p) => p.id), ...selectedIds];
      const updated = await services.products.updateFeatured(combinedIds);
      setItems(updated);
      toast.success('admin.featured.added');
      setAddModalOpen(false);
    } catch (e) {
      toast.error('errors.UNKNOWN');
      void e;
    } finally {
      setAdding(false);
    }
  };

  // Remove a product from featured
  const handleConfirmRemove = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await services.products.setFeatured(removeTarget.id, false);
      setItems((prev) => prev.filter((p) => p.id !== removeTarget.id));
      toast.success('admin.featured.removed');
      setRemoveTarget(null);
    } catch (e) {
      toast.error('errors.UNKNOWN');
      void e;
    } finally {
      setRemoving(false);
    }
  };

  // Move product up or down
  const moveItem = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const nextItems = [...items];
    const [moved] = nextItems.splice(index, 1);
    nextItems.splice(targetIndex, 0, moved);

    setItems(nextItems);
    setSavingOrder(true);
    try {
      const ids = nextItems.map((p) => p.id);
      const updated = await services.products.updateFeatured(ids);
      setItems(updated);
    } catch (e) {
      toast.error('errors.UNKNOWN');
      void loadFeatured();
      void e;
    } finally {
      setSavingOrder(false);
    }
  };

  return (
    <>
      <div className="dash__head">
        <div>
          <div className="row" style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
            <h1>{t('admin.featured.title')}</h1>
            <Badge kind={items.length >= MAX_FEATURED ? 'warning' : 'primary'}>
              {items.length} / {MAX_FEATURED}
            </Badge>
          </div>
          <p className="muted" style={{ margin: '4px 0 0' }}>
            {t('admin.featured.subtitle')}
          </p>
        </div>
        <div className="row" style={{ gap: 'var(--space-2)' }}>
          <Button
            variant="primary"
            disabled={items.length >= MAX_FEATURED || loading}
            onClick={() => void openAddModal()}
            title={items.length >= MAX_FEATURED ? t('admin.featured.maxLimitReached') : undefined}
          >
            <Icon name="plus" size={16} />
            <span style={{ marginLeft: 6 }}>{t('admin.featured.addProduct')}</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <Skeleton style={{ height: 280 }} />
      ) : error ? (
        <ErrorState error={error} onRetry={loadFeatured} />
      ) : items.length === 0 ? (
        <EmptyState
          icon="gem"
          title={t('admin.featured.emptyTitle')}
          description={t('admin.featured.emptyText')}
          action={
            <Button variant="primary" onClick={() => void openAddModal()}>
              <Icon name="plus" size={16} />
              <span style={{ marginLeft: 6 }}>{t('admin.featured.addProduct')}</span>
            </Button>
          }
        />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col" style={{ width: 60, textAlign: 'center' }}>
                  {t('admin.featured.colOrder')}
                </th>
                <th scope="col">{t('admin.featured.colProduct')}</th>
                <th scope="col">{t('admin.featured.colCode')}</th>
                <th scope="col">{t('admin.featured.colPrice')}</th>
                <th scope="col" style={{ textAlign: 'center', width: 120 }}>
                  {t('admin.featured.sortOrder')}
                </th>
                <th scope="col" style={{ textAlign: 'right', width: 80 }}>
                  <span className="sr-only">{t('admin.featured.colActions')}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((p, index) => {
                const img = p.images[0];
                return (
                  <tr key={p.id}>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)' }}>
                      #{index + 1}
                    </td>
                    <td>
                      <div className="featured-product">
                        {img ? (
                          <img className="featured-product__image" src={mediaUrl(img.storageKey)} alt="" width={48} height={60} />
                        ) : (
                          <div className="featured-product__image" />
                        )}
                        <div className="featured-product__text">
                          <span>{loc(p.name, `product:${p.code}`)}</span>
                          {p.carat != null && p.carat > 0 && <span className="muted">{carat(p.carat)} ct</span>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <code style={{ fontSize: '0.85rem' }}>{p.code}</code>
                    </td>
                    <td>
                      <strong>{price(finalPrice(p))}</strong>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="row" style={{ justifyContent: 'center', gap: 4 }}>
                        <button
                          type="button"
                          className="icon-btn"
                          disabled={index === 0 || savingOrder}
                          onClick={() => void moveItem(index, -1)}
                          aria-label={t('admin.featured.moveUp')}
                          title={t('admin.featured.moveUp')}
                        >
                          <Icon name="arrowUp" size={16} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn"
                          disabled={index === items.length - 1 || savingOrder}
                          onClick={() => void moveItem(index, 1)}
                          aria-label={t('admin.featured.moveDown')}
                          title={t('admin.featured.moveDown')}
                        >
                          <Icon name="arrowDown" size={16} />
                        </button>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="icon-btn icon-btn--danger"
                        onClick={() => setRemoveTarget(p)}
                        aria-label={t('admin.featured.remove')}
                        title={t('admin.featured.remove')}
                      >
                        <Icon name="trash" size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Remove Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(removeTarget)}
        title={t('admin.featured.remove')}
        message={
          removeTarget
            ? `${loc(removeTarget.name, `product:${removeTarget.code}`)} (${removeTarget.code}) ürününü ana sayfada öne çıkanlar listesinden kaldırmak istiyor musunuz?`
            : ''
        }
        confirmLabel={t('admin.featured.remove')}
        danger
        loading={removing}
        onConfirm={() => void handleConfirmRemove()}
        onCancel={() => setRemoveTarget(null)}
      />

      {/* Add Products Modal */}
      <Modal
        open={addModalOpen}
        title={t('admin.featured.modalTitle')}
        onClose={() => setAddModalOpen(false)}
        footer={
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <span className="muted" style={{ fontSize: '0.9rem' }}>
              {t('admin.featured.selectedCount', { count: selectedIds.length })} ({remainingSlots - selectedIds.length} kalan)
            </span>
            <div className="row" style={{ gap: 'var(--space-2)' }}>
              <Button variant="ghost" onClick={() => setAddModalOpen(false)} disabled={adding}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="primary"
                onClick={() => void handleAddSelected()}
                loading={adding}
                disabled={adding || selectedIds.length === 0}
              >
                {t('admin.featured.addSelected', { count: selectedIds.length })}
              </Button>
            </div>
          </div>
        }
      >
        <div className="stack" style={{ gap: 'var(--space-3)' }}>
          <p className="muted" style={{ margin: 0 }}>
            {t('admin.featured.modalSubtitle', { remaining: remainingSlots })}
          </p>

          <input
            type="text"
            className="input"
            placeholder={t('admin.featured.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div
            style={{
              maxHeight: '380px',
              overflowY: 'auto',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-control)',
            }}
          >
            {loadingCandidates ? (
              <div style={{ padding: 'var(--space-4)' }}>
                <Skeleton style={{ height: 160 }} />
              </div>
            ) : filteredCandidates.length === 0 ? (
              <div style={{ padding: 'var(--space-5)', textAlign: 'center', color: 'var(--text-muted)' }}>
                {t('admin.featured.noAvailableProducts')}
              </div>
            ) : (
              <div className="featured-picker">
                {filteredCandidates.map((p) => {
                  const isSelected = selectedIds.includes(p.id);
                  const disabled = !isSelected && selectedIds.length >= remainingSlots;
                  const img = p.images[0];
                  return (
                    <label
                      key={p.id}
                      className="featured-picker__item"
                      style={{ cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={disabled}
                        onChange={() => toggleSelectCandidate(p.id)}
                        aria-label={loc(p.name, `product:${p.code}`)}
                      />
                      {img ? (
                        <img className="featured-picker__image" src={mediaUrl(img.storageKey)} alt="" width={40} height={50} />
                      ) : (
                        <div className="featured-picker__image" />
                      )}
                      <span className="featured-picker__text">
                        <strong>{loc(p.name, `product:${p.code}`)}</strong>
                        <span className="muted">{p.code}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
