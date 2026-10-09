import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState, Skeleton } from '@/components/ui/State';
import { useCategories } from '@/contexts/CategoriesContext';
import { useI18n } from '@/contexts/I18nContext';
import { useToast } from '@/contexts/ToastContext';
import { services } from '@/services';
import type { Category, CategoryInput } from '@/types';
import { Modal } from '@/components/ui/Modal';

function reorderArray<T>(list: T[], fromId: string, toId: string, isAfter: boolean, getId: (item: T) => string): T[] {
  const fromIndex = list.findIndex((item) => getId(item) === fromId);
  if (fromIndex === -1) return list;

  const result = [...list];
  const [moved] = result.splice(fromIndex, 1);

  const targetIndex = result.findIndex((item) => getId(item) === toId);
  if (targetIndex === -1) return list;

  const insertIndex = isAfter ? targetIndex + 1 : targetIndex;
  result.splice(insertIndex, 0, moved);
  return result;
}

function OrderHandle({
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  disabled,
}: {
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  disabled?: boolean;
}) {
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    dragStartPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleClick = (e: React.MouseEvent, action?: () => void, isArrowDisabled?: boolean) => {
    e.stopPropagation();
    if (disabled || isArrowDisabled) return;

    if (dragStartPos.current) {
      const dx = Math.abs(e.clientX - dragStartPos.current.x);
      const dy = Math.abs(e.clientY - dragStartPos.current.y);
      if (dx > 4 || dy > 4) {
        return;
      }
    }

    action?.();
  };

  return (
    <span
      className="order-handle"
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: '10px',
        userSelect: 'none',
        flexShrink: 0,
        cursor: disabled ? 'default' : 'grab',
        gap: '2px',
        padding: '2px 0',
      }}
      title={disabled ? undefined : 'Sıralamak için basılı tutup kaydırın veya oklara tıklayın'}
    >
      <span
        role="button"
        tabIndex={disabled || isFirst ? -1 : 0}
        title={disabled || isFirst ? undefined : 'Yukarı taşı'}
        aria-label="Yukarı taşı"
        onMouseDown={handleMouseDown}
        onClick={(e) => handleClick(e, onMoveUp, isFirst)}
        onKeyDown={(e) => {
          if (disabled || isFirst) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            onMoveUp?.();
          }
        }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '18px',
          height: '11px',
          borderRadius: '3px',
          cursor: disabled || isFirst ? 'default' : 'pointer',
          opacity: isFirst || disabled ? 0.2 : 0.6,
          color: 'var(--text)',
          transition: 'opacity 0.15s, color 0.15s, background-color 0.15s',
        }}
        onMouseEnter={(e) => {
          if (!disabled && !isFirst) {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.color = 'var(--primary)';
            e.currentTarget.style.backgroundColor = 'var(--primary-soft, rgba(90, 15, 30, 0.12))';
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled && !isFirst) {
            e.currentTarget.style.opacity = '0.6';
            e.currentTarget.style.color = 'var(--text)';
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 5L5 1L9 5" />
        </svg>
      </span>

      <span
        role="button"
        tabIndex={disabled || isLast ? -1 : 0}
        title={disabled || isLast ? undefined : 'Aşağı taşı'}
        aria-label="Aşağı taşı"
        onMouseDown={handleMouseDown}
        onClick={(e) => handleClick(e, onMoveDown, isLast)}
        onKeyDown={(e) => {
          if (disabled || isLast) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            onMoveDown?.();
          }
        }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '18px',
          height: '11px',
          borderRadius: '3px',
          cursor: disabled || isLast ? 'default' : 'pointer',
          opacity: isLast || disabled ? 0.2 : 0.6,
          color: 'var(--text)',
          transition: 'opacity 0.15s, color 0.15s, background-color 0.15s',
        }}
        onMouseEnter={(e) => {
          if (!disabled && !isLast) {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.color = 'var(--primary)';
            e.currentTarget.style.backgroundColor = 'var(--primary-soft, rgba(90, 15, 30, 0.12))';
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled && !isLast) {
            e.currentTarget.style.opacity = '0.6';
            e.currentTarget.style.color = 'var(--text)';
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 1L5 5L9 1" />
        </svg>
      </span>
    </span>
  );
}

export default function AdminCategoriesPage() {
  const { t, loc, errorMessage } = useI18n();
  const { tree, loading, reload } = useCategories();
  const toast = useToast();

  const [categoriesList, setCategoriesList] = useState<Category[]>(tree);

  useEffect(() => {
    const sorted = [...tree]
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((cat) => ({
        ...cat,
        children: [...(cat.children || [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
      }));
    setCategoriesList(sorted);
  }, [tree]);

  // Modal state only for creating new categories
  const [formOpen, setFormOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string>('');

  // Inline editing state for existing categories/subcategories
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [savingId, setSavingId] = useState<string | null>(null);

  // Drag and drop state for main categories
  const [draggedCatId, setDraggedCatId] = useState<string | null>(null);
  const [dragOverCat, setDragOverCat] = useState<{ id: string; isAfter: boolean } | null>(null);

  // Drag and drop state for subcategories
  const [draggedSub, setDraggedSub] = useState<{ parentId: string; id: string } | null>(null);
  const [dragOverSub, setDragOverSub] = useState<{ id: string; isAfter: boolean } | null>(null);

  const openAddForm = (pId?: string) => {
    cancelEditing();
    setName('');
    setParentId(pId || '');
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
  };

  const startEditing = (cat: Category) => {
    setEditingId(cat.id);
    setEditingName(cat.name.tr || cat.name.en || '');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName('');
  };

  const saveInline = async (cat: Category) => {
    const trimmed = editingName.trim();
    if (!trimmed) return;
    if (trimmed === (cat.name.tr || cat.name.en || '')) {
      cancelEditing();
      return;
    }
    setSavingId(cat.id);
    try {
      const input: CategoryInput = {
        name: { tr: trimmed, en: trimmed },
        parentId: cat.parentId || null,
        sortOrder: cat.sortOrder,
      };

      // Optimistic update
      setCategoriesList((prev) =>
        prev.map((c) => {
          if (c.id === cat.id) {
            return { ...c, name: { tr: trimmed, en: trimmed } };
          }
          if (c.children?.some((s) => s.id === cat.id)) {
            return {
              ...c,
              children: c.children.map((s) => (s.id === cat.id ? { ...s, name: { tr: trimmed, en: trimmed } } : s)),
            };
          }
          return c;
        }),
      );

      await services.categories.update(cat.id, input);
      toast.success(t('admin.form.updated') as any);
      await reload();
      cancelEditing();
    } catch (er) {
      toast.error(errorMessage(er));
      await reload();
    } finally {
      setSavingId(null);
    }
  };

  const saveNew = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      let finalSortOrder = 1;
      if (parentId) {
        const parent = categoriesList.find((c) => c.id === parentId);
        const maxSort = parent && parent.children.length > 0 ? Math.max(...parent.children.map((c) => c.sortOrder || 0)) : 0;
        finalSortOrder = maxSort + 1;
      } else {
        const maxSort = categoriesList.length > 0 ? Math.max(...categoriesList.map((c) => c.sortOrder || 0)) : 0;
        finalSortOrder = maxSort + 1;
      }

      const input: CategoryInput = {
        name: { tr: name.trim(), en: name.trim() },
        parentId: parentId || null,
        sortOrder: finalSortOrder,
      };

      await services.categories.create(input);
      toast.success(t('admin.form.created') as any);
      await reload();
      closeForm();
    } catch (er) {
      toast.error(errorMessage(er));
    } finally {
      setBusy(false);
    }
  };

  const saveReorder = async (items: { id: string; sortOrder: number }[]) => {
    try {
      await services.categories.reorder(items);
      await reload();
      toast.success('Sıralama güncellendi' as any);
    } catch (er) {
      toast.error(errorMessage(er));
      await reload();
    }
  };

  const moveMainCategory = async (id: string, direction: 'up' | 'down') => {
    if (editingId !== null) return;
    const index = categoriesList.findIndex((c) => c.id === id);
    if (index === -1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categoriesList.length) return;

    const updated = [...categoriesList];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    setCategoriesList(updated);
    const items = updated.map((c, i) => ({ id: c.id, sortOrder: i + 1 }));
    await saveReorder(items);
  };

  const moveSubCategory = async (parentId: string, id: string, direction: 'up' | 'down') => {
    if (editingId !== null) return;
    const parent = categoriesList.find((c) => c.id === parentId);
    if (!parent) return;

    const index = parent.children.findIndex((s) => s.id === id);
    if (index === -1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= parent.children.length) return;

    const newChildren = [...parent.children];
    const [moved] = newChildren.splice(index, 1);
    newChildren.splice(targetIndex, 0, moved);

    const updated = categoriesList.map((c) => (c.id === parentId ? { ...c, children: newChildren } : c));
    setCategoriesList(updated);

    const items = newChildren.map((s, i) => ({ id: s.id, sortOrder: i + 1 }));
    await saveReorder(items);
  };

  const handleMainDragStart = (e: React.DragEvent, id: string) => {
    if (draggedSub || editingId !== null) return;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    setDraggedCatId(id);
  };

  const handleMainDragOver = (e: React.DragEvent, id: string) => {
    if (draggedSub || editingId !== null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedCatId && draggedCatId !== id) {
      const rect = e.currentTarget.getBoundingClientRect();
      const isAfter = e.clientY - rect.top > rect.height / 2;
      if (!dragOverCat || dragOverCat.id !== id || dragOverCat.isAfter !== isAfter) {
        setDragOverCat({ id, isAfter });
      }
    }
  };

  const handleMainDragLeave = (e: React.DragEvent, id: string) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      if (dragOverCat?.id === id) setDragOverCat(null);
    }
  };

  const handleMainDrop = async (e: React.DragEvent, targetId: string) => {
    if (draggedSub || editingId !== null) return;
    e.preventDefault();
    if (!draggedCatId || draggedCatId === targetId) {
      setDraggedCatId(null);
      setDragOverCat(null);
      return;
    }

    const isAfter = dragOverCat?.id === targetId ? dragOverCat.isAfter : false;
    const fromIndex = categoriesList.findIndex((c) => c.id === draggedCatId);
    if (fromIndex !== -1) {
      const updated = reorderArray(categoriesList, draggedCatId, targetId, isAfter, (c) => c.id);
      setCategoriesList(updated);
      setDraggedCatId(null);
      setDragOverCat(null);

      const items = updated.map((c, i) => ({ id: c.id, sortOrder: i + 1 }));
      await saveReorder(items);
    } else {
      setDraggedCatId(null);
      setDragOverCat(null);
    }
  };

  const handleSubDragStart = (e: React.DragEvent, pId: string, id: string) => {
    if (editingId !== null) return;
    e.stopPropagation();
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    setDraggedSub({ parentId: pId, id });
  };

  const handleSubDragOver = (e: React.DragEvent, pId: string, id: string) => {
    if (draggedCatId || editingId !== null) return;
    if (!draggedSub || draggedSub.parentId !== pId) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (draggedSub.id !== id) {
      const rect = e.currentTarget.getBoundingClientRect();
      const isAfter = e.clientY - rect.top > rect.height / 2;
      if (!dragOverSub || dragOverSub.id !== id || dragOverSub.isAfter !== isAfter) {
        setDragOverSub({ id, isAfter });
      }
    }
  };

  const handleSubDragLeave = (e: React.DragEvent, id: string) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      if (dragOverSub?.id === id) setDragOverSub(null);
    }
  };

  const handleSubDrop = async (e: React.DragEvent, pId: string, targetId: string) => {
    if (draggedCatId || editingId !== null) return;
    if (!draggedSub || draggedSub.parentId !== pId) return;
    e.preventDefault();
    e.stopPropagation();

    if (draggedSub.id === targetId) {
      setDraggedSub(null);
      setDragOverSub(null);
      return;
    }

    const parent = categoriesList.find((c) => c.id === pId);
    if (!parent) return;

    const isAfter = dragOverSub?.id === targetId ? dragOverSub.isAfter : false;
    const newChildren = reorderArray(parent.children, draggedSub.id, targetId, isAfter, (s) => s.id);

    const updated = categoriesList.map((c) => (c.id === pId ? { ...c, children: newChildren } : c));
    setCategoriesList(updated);
    setDraggedSub(null);
    setDragOverSub(null);

    const items = newChildren.map((s, i) => ({ id: s.id, sortOrder: i + 1 }));
    await saveReorder(items);
  };

  const del = async (id: string) => {
    if (!window.confirm(t('common.confirmDelete') || 'Are you sure?')) return;
    try {
      await services.categories.delete(id);
      await reload();
      toast.success(t('admin.form.updated') as any);
    } catch (er) {
      toast.error(errorMessage(er));
    }
  };

  if (loading) return <Skeleton style={{ height: 400 }} />;

  return (
    <>
      <div className="dash__head">
        <h1>{t('admin.nav.categories')}</h1>
        <Button onClick={() => openAddForm()}>
          +&nbsp; {t('admin.categories.add') || 'Yeni Kategori Ekle'}
        </Button>
      </div>

      {categoriesList.length === 0 ? (
        <EmptyState
          icon="inbox"
          title={t('admin.categories.emptyTitle') || 'Henüz kategori bulunmuyor.'}
          description={t('admin.categories.emptyText') || 'İlk kategorinizi ekleyerek başlayabilirsiniz.'}
          action={
            <Button onClick={() => openAddForm()}>
              +&nbsp; {t('admin.categories.add') || 'Yeni Kategori Ekle'}
            </Button>
          }
        />
      ) : (
        <div className="card">
          <ul className="stack" style={{ listStyle: 'none', margin: 0, padding: 0, gap: 'var(--space-4)' }}>
            {categoriesList.map((cat, catIdx) => {
              const isCatOver = dragOverCat?.id === cat.id && draggedCatId !== cat.id;
              const isEditingCat = editingId === cat.id;
              const isFirst = catIdx === 0;
              const isLast = catIdx === categoriesList.length - 1;
              return (
                <li
                  key={cat.id}
                  className="card"
                  draggable={editingId === null}
                  onDragStart={(e) => handleMainDragStart(e, cat.id)}
                  onDragOver={(e) => handleMainDragOver(e, cat.id)}
                  onDragLeave={(e) => handleMainDragLeave(e, cat.id)}
                  onDrop={(e) => handleMainDrop(e, cat.id)}
                  onDragEnd={() => {
                    setDraggedCatId(null);
                    setDragOverCat(null);
                  }}
                  style={{
                    padding: 'var(--space-4)',
                    opacity: draggedCatId === cat.id ? 0.35 : 1,
                    borderTop: isCatOver && !dragOverCat?.isAfter ? '3px solid var(--primary)' : undefined,
                    borderBottom: isCatOver && dragOverCat?.isAfter ? '3px solid var(--primary)' : undefined,
                    boxShadow: isCatOver ? '0 0 0 1px var(--primary-soft, rgba(90, 15, 30, 0.2))' : undefined,
                    transition: 'opacity 0.15s, border-color 0.15s, box-shadow 0.15s',
                    cursor: editingId === null ? 'grab' : 'default',
                  }}
                >
                  <div className="row row--between" style={{ alignItems: 'center', flexWrap: 'nowrap', gap: 'var(--space-2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0, marginRight: 'var(--space-3)' }}>
                      <OrderHandle
                        onMoveUp={() => void moveMainCategory(cat.id, 'up')}
                        onMoveDown={() => void moveMainCategory(cat.id, 'down')}
                        isFirst={isFirst}
                        isLast={isLast}
                        disabled={editingId !== null}
                      />
                      {isEditingCat ? (
                        <input
                          type="text"
                          autoFocus
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') void saveInline(cat);
                            if (e.key === 'Escape') cancelEditing();
                          }}
                          onFocus={(e) => e.target.select()}
                          style={{
                            fontSize: '1.15rem',
                            fontWeight: 600,
                            fontFamily: 'inherit',
                            height: '36px',
                            padding: '0 10px',
                            width: '100%',
                            maxWidth: '360px',
                            border: '1.5px solid var(--primary)',
                            borderRadius: 'var(--r-control)',
                            background: 'var(--surface)',
                            color: 'var(--text)',
                            outline: 'none',
                            boxShadow: '0 0 0 2px var(--primary-soft, rgba(90, 15, 30, 0.15))',
                          }}
                        />
                      ) : (
                        <strong style={{ fontSize: '1.15rem' }}>{loc(cat.name)}</strong>
                      )}
                    </div>
                    {isEditingCat ? (
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0, cursor: 'default' }}
                        onMouseDown={(e) => e.stopPropagation()}
                        draggable={false}
                      >
                        <div style={{ width: 165 }} />
                        <Button
                          size="sm"
                          variant="primary"
                          loading={savingId === cat.id}
                          disabled={!editingName.trim() || savingId === cat.id}
                          style={{ width: 76, textAlign: 'center' }}
                          onClick={() => void saveInline(cat)}
                        >
                          {t('admin.form.save') || 'Kaydet'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={savingId === cat.id}
                          style={{ width: 76, textAlign: 'center' }}
                          onClick={cancelEditing}
                        >
                          {t('common.cancel') || 'Vazgeç'}
                        </Button>
                      </div>
                    ) : (
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0, cursor: 'default' }}
                        onMouseDown={(e) => e.stopPropagation()}
                        draggable={false}
                      >
                        <Button
                          size="sm"
                          variant="secondary"
                          style={{ width: 165, whiteSpace: 'nowrap', textAlign: 'center', padding: '0 8px' }}
                          onClick={() => openAddForm(cat.id)}
                        >
                          +&nbsp; Alt Kategori Ekle
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          style={{ width: 76, textAlign: 'center' }}
                          onClick={() => startEditing(cat)}
                        >
                          {t('common.edit') || 'Düzenle'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          style={{ width: 56, textAlign: 'center', color: 'var(--color-error)' }}
                          onClick={() => del(cat.id)}
                        >
                          Sil
                        </Button>
                      </div>
                    )}
                  </div>
                  {cat.children.length > 0 && (
                    <ul
                      className="stack"
                      style={{ listStyle: 'none', margin: 0, padding: 0, marginTop: 'var(--space-3)', gap: 'var(--space-2)' }}
                      onDragOver={(e) => {
                        if (draggedCatId) {
                          e.preventDefault();
                        }
                      }}
                      onDrop={(e) => {
                        if (draggedCatId) {
                          e.preventDefault();
                          handleMainDrop(e, cat.id);
                        }
                      }}
                    >
                      {cat.children.map((sub, subIdx) => {
                        const isSubOver = dragOverSub?.id === sub.id && draggedSub?.id !== sub.id;
                        const isEditingSub = editingId === sub.id;
                        const isFirstSub = subIdx === 0;
                        const isLastSub = subIdx === cat.children.length - 1;
                        return (
                          <li
                            key={sub.id}
                            className="row row--between"
                            draggable={editingId === null}
                            onDragStart={(e) => handleSubDragStart(e, cat.id, sub.id)}
                            onDragOver={(e) => handleSubDragOver(e, cat.id, sub.id)}
                            onDragLeave={(e) => handleSubDragLeave(e, sub.id)}
                            onDrop={(e) => handleSubDrop(e, cat.id, sub.id)}
                            onDragEnd={() => {
                              setDraggedSub(null);
                              setDragOverSub(null);
                            }}
                            style={{
                              padding: 'var(--space-2) 0',
                              borderTop:
                                isSubOver && !dragOverSub?.isAfter
                                  ? '2px solid var(--primary)'
                                  : '1px solid var(--border-subtle, rgba(0, 0, 0, 0.06))',
                              borderBottom: isSubOver && dragOverSub?.isAfter ? '2px solid var(--primary)' : undefined,
                              alignItems: 'center',
                              flexWrap: 'nowrap',
                              gap: 'var(--space-2)',
                              opacity: draggedSub?.id === sub.id ? 0.35 : 1,
                              backgroundColor: isSubOver ? 'var(--primary-soft, rgba(90, 15, 30, 0.04))' : undefined,
                              borderRadius: '4px',
                              transition: 'opacity 0.15s, background-color 0.15s',
                              cursor: editingId === null ? 'grab' : 'default',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0, marginRight: 'var(--space-3)' }}>
                              <OrderHandle
                                onMoveUp={() => void moveSubCategory(cat.id, sub.id, 'up')}
                                onMoveDown={() => void moveSubCategory(cat.id, sub.id, 'down')}
                                isFirst={isFirstSub}
                                isLast={isLastSub}
                                disabled={editingId !== null}
                              />
                              {isEditingSub ? (
                                <input
                                  type="text"
                                  autoFocus
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') void saveInline(sub);
                                    if (e.key === 'Escape') cancelEditing();
                                  }}
                                  onFocus={(e) => e.target.select()}
                                  style={{
                                    fontSize: '0.98rem',
                                    fontFamily: 'inherit',
                                    height: '32px',
                                    padding: '0 10px',
                                    width: '100%',
                                    maxWidth: '320px',
                                    border: '1.5px solid var(--primary)',
                                    borderRadius: 'var(--r-control)',
                                    background: 'var(--surface)',
                                    color: 'var(--text)',
                                    outline: 'none',
                                    boxShadow: '0 0 0 2px var(--primary-soft, rgba(90, 15, 30, 0.15))',
                                  }}
                                />
                              ) : (
                                <span>{loc(sub.name)}</span>
                              )}
                            </div>
                            {isEditingSub ? (
                              <div
                                style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0, cursor: 'default' }}
                                onMouseDown={(e) => e.stopPropagation()}
                                draggable={false}
                              >
                                <div style={{ width: 165 }} />
                                <Button
                                  size="sm"
                                  variant="primary"
                                  loading={savingId === sub.id}
                                  disabled={!editingName.trim() || savingId === sub.id}
                                  style={{ width: 76, textAlign: 'center' }}
                                  onClick={() => void saveInline(sub)}
                                >
                                  {t('admin.form.save') || 'Kaydet'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  disabled={savingId === sub.id}
                                  style={{ width: 76, textAlign: 'center' }}
                                  onClick={cancelEditing}
                                >
                                  {t('common.cancel') || 'Vazgeç'}
                                </Button>
                              </div>
                            ) : (
                              <div
                                style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0, cursor: 'default' }}
                                onMouseDown={(e) => e.stopPropagation()}
                                draggable={false}
                              >
                                <div style={{ width: 165 }} />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  style={{ width: 76, textAlign: 'center' }}
                                  onClick={() => startEditing(sub)}
                                >
                                  {t('common.edit') || 'Düzenle'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  style={{ width: 56, textAlign: 'center', color: 'var(--color-error)' }}
                                  onClick={() => del(sub.id)}
                                >
                                  Sil
                                </Button>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={closeForm}
        footer={
          <>
            <Button variant="ghost" onClick={closeForm}>{t('common.cancel')}</Button>
            <Button loading={busy} disabled={!name.trim() || busy} onClick={saveNew}>
              {t('admin.form.save')}
            </Button>
          </>
        }
      >
        <div className="stack">
          <Input label="Kategori Adı" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
      </Modal>
    </>
  );
}
