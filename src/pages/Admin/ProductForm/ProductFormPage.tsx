import { useEffect, useLayoutEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, LinkButton } from '@/components/ui/Button';
import { ComboBox, Input, Select, Textarea } from '@/components/ui/Input';
import { Icon } from '@/components/ui/Icon';
import { Breadcrumb } from '@/components/ui/Misc';
import { Alert, ErrorState, Skeleton } from '@/components/ui/State';
import { DIAMOND_CLARITY_OPTIONS, DIAMOND_COLOR_OPTIONS, GOLD_KARAT_OPTIONS, IMAGE_UPLOAD, INPUT_LIMITS } from '@/constants';
import { ROUTES } from '@/constants/routes';
import { useCategories } from '@/contexts/CategoriesContext';
import { useI18n } from '@/contexts/I18nContext';
import { useToast } from '@/contexts/ToastContext';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { services } from '@/services';
import { isAppError, type Product, type ProductInput } from '@/types';
import { mediaUrl } from '@/utils/media';
import { sanitizeText, toTitleCase, uid, v, type Validation } from '@/utils/validation';

interface FormState {
  name: string;
  description: string;
  features: string;
  extraFeatures: { id: string; name: string; detail: string }[];
  weightGrams: string;
  metal: string;
  diamondColor: string;
  diamondClarity: string;
  code: string;
  category: string;
  subCategory: string;
  goldKarat: string;
  carat: string;
  price: string;
  discount: string;
  imageKeys: string[];
  isActive: boolean;
  featured: boolean;
}

const EMPTY: FormState = {
  name: '',
  description: '',
  features: '',
  extraFeatures: [],
  weightGrams: '',
  metal: '',
  diamondColor: '',
  diamondClarity: '',
  code: '',
  category: '',
  subCategory: '',
  goldKarat: '14K',
  carat: '',
  price: '',
  discount: '0',
  imageKeys: [],
  isActive: true,
  featured: false,
};

const parsePrice = (s: string): number | '' => {
  const clean = s.replace(/\./g, '').trim();
  return clean === '' ? '' : Number(clean);
};

const parseIntNum = (s: string): number | '' => {
  const clean = s.trim();
  return clean === '' ? '' : Number(clean);
};

const parseCarat = (s: string): number | null => {
  const clean = s.trim();
  if (clean === '') return null;
  const n = Number(clean);
  return Number.isFinite(n) ? n : null;
};

const isCaratValid = (s: string): boolean => {
  const clean = s.trim();
  if (clean === '') return true;
  if (!/^\d+(\.\d{1,3})?$/.test(clean)) return false;
  const n = Number(clean);
  return Number.isFinite(n) && n > 0;
};

function fromProduct(p: Product): FormState {
  return {
    name: p.name.tr || p.name.en,
    description: p.description.tr || p.description.en,
    features: p.features ?? '',
    extraFeatures: (p.extraFeatures ?? []).map((feature) => ({ ...feature, id: uid() })),
    weightGrams: p.weightGrams != null ? String(p.weightGrams).replace('.', ',') : '',
    metal: p.metal ?? '',
    diamondColor: p.diamondColor ?? '',
    diamondClarity: p.diamondClarity ?? '',
    code: p.code,
    category: p.category,
    subCategory: p.subCategory ?? '',
    goldKarat: p.goldKarat || '14K',
    carat: p.carat != null ? String(p.carat) : '',
    price: p.price ? p.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : '',
    discount: String(p.discount),
    imageKeys: p.images.map((i) => i.storageKey),
    isActive: p.isActive,
    featured: p.featured,
  };
}

function isFormEqual(a: FormState, b: FormState): boolean {
  if (a.name.trim() !== b.name.trim()) return false;
  if (a.weightGrams.trim().replace(',', '.') !== b.weightGrams.trim().replace(',', '.')) return false;
  if (a.metal.trim() !== b.metal.trim() || a.diamondColor.trim() !== b.diamondColor.trim() || a.diamondClarity.trim() !== b.diamondClarity.trim()) return false;
  const normalizedFeatures = (form: FormState) => form.extraFeatures
    .filter((feature) => feature.name.trim() || feature.detail.trim())
    .map((feature) => ({ name: feature.name.trim(), detail: feature.detail.trim() }));
  if (JSON.stringify(normalizedFeatures(a)) !== JSON.stringify(normalizedFeatures(b))) return false;
  if (a.features.trim() !== b.features.trim()) return false;
  if (a.description.trim() !== b.description.trim()) return false;
  if (a.code.trim().toUpperCase() !== b.code.trim().toUpperCase()) return false;
  if (a.category !== b.category) return false;
  if ((a.subCategory || '') !== (b.subCategory || '')) return false;
  if (a.goldKarat !== b.goldKarat) return false;
  const aCarat = a.carat.trim();
  const bCarat = b.carat.trim();
  if (aCarat !== bCarat) {
    const an = parseCarat(aCarat);
    const bn = parseCarat(bCarat);
    if (an === null || bn === null || an !== bn) return false;
  }
  if (parsePrice(a.price) !== parsePrice(b.price)) return false;
  if (parseIntNum(a.discount) !== parseIntNum(b.discount)) return false;
  if (a.isActive !== b.isActive) return false;
  if (a.featured !== b.featured) return false;
  if (a.imageKeys.length !== b.imageKeys.length) return false;
  for (let i = 0; i < a.imageKeys.length; i++) {
    if (a.imageKeys[i] !== b.imageKeys[i]) return false;
  }
  return true;
}

function ProductForm({ product, onSaved }: { product: Product | null; onSaved?: (updated: Product) => void }) {
  const { t, tDynamic, errorMessage } = useI18n();
  const { tree } = useCategories();
  const toast = useToast();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [savedForm, setSavedForm] = useState<FormState>(() => (product ? fromProduct(product) : EMPTY));
  const [form, setForm] = useState<FormState>(savedForm);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const resize = () => {
      for (const element of [descriptionRef.current]) {
        if (!element) continue;
        element.style.height = 'auto';
        const borders = element.offsetHeight - element.clientHeight;
        element.style.height = `${element.scrollHeight + borders}px`;
      }
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [form.description]);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverFields, setServerFields] = useState<Record<string, string>>({});

  useEffect(() => {
    if (product) {
      const pForm = fromProduct(product);
      setSavedForm(pForm);
      setForm(pForm);
    }
  }, [product]);

  const isDirty = !isFormEqual(form, savedForm);

  const set =
    <K extends keyof FormState>(key: K) =>
      (value: FormState[K]) => {
        setForm((f) => ({ ...f, [key]: value }));
        setServerFields((s) => (s[key] ? { ...s, [key]: '' } : s));
      };
  const onText =
    (key: keyof FormState) =>
      (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        set(key)(e.target.value as never);

  const handlePriceChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (!val) {
      set('price')('');
      return;
    }
    set('price')(val.replace(/\B(?=(\d{3})+(?!\d))/g, "."));
  };

  const handleWeightChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!/^\d*(,\d{0,3})?$/.test(value)) return;
    set('weightGrams')(value.startsWith(',') ? `0${value}` : value);
  };

  const handleWeightKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.ctrlKey || e.metaKey || e.key.length !== 1) return;
    if (!/^[0-9,]$/.test(e.key)) {
      e.preventDefault();
      return;
    }
    if (e.key === ',') {
      const input = e.currentTarget;
      const remaining = input.value.slice(0, input.selectionStart ?? 0) + input.value.slice(input.selectionEnd ?? 0);
      if (remaining.includes(',')) e.preventDefault();
    }
  };

  const handleWeightPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const next = input.value.slice(0, input.selectionStart ?? 0)
      + e.clipboardData.getData('text') + input.value.slice(input.selectionEnd ?? 0);
    if (!/^\d*(,\d{0,3})?$/.test(next)) e.preventDefault();
  };

  const handleCaratKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      e.key === 'Backspace' ||
      e.key === 'Delete' ||
      e.key === 'Tab' ||
      e.key === 'Escape' ||
      e.key === 'Enter' ||
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight' ||
      e.key === 'ArrowUp' ||
      e.key === 'ArrowDown' ||
      e.key === 'Home' ||
      e.key === 'End' ||
      e.ctrlKey ||
      e.metaKey
    ) {
      return;
    }

    if (e.key === ',' || e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
      e.preventDefault();
      return;
    }

    if (e.key === '.') {
      const input = e.currentTarget;
      const val = input.value;
      const start = input.selectionStart ?? 0;
      const end = input.selectionEnd ?? 0;
      const selectedText = val.slice(start, end);
      if (val.includes('.') && !selectedText.includes('.')) {
        e.preventDefault();
      }
      return;
    }

    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleCaratPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const paste = e.clipboardData.getData('text');
    if (/[,eE+-]/.test(paste) || !/^[0-9.]*$/.test(paste)) {
      e.preventDefault();
      return;
    }
    const input = e.currentTarget;
    const val = input.value;
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    const existingWithoutSelected = val.slice(0, start) + val.slice(end);
    const totalDots = (existingWithoutSelected.match(/\./g) || []).length + (paste.match(/\./g) || []).length;
    if (totalDots > 1) {
      e.preventDefault();
      return;
    }
  };

  const handleCaratChange = (e: ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[,eE+-]/g, '').replace(/[^0-9.]/g, '');

    if (val.startsWith('.')) {
      val = '0' + val;
    }

    const parts = val.split('.');
    if (parts.length > 2) {
      val = parts[0] + '.' + parts.slice(1).join('');
    }
    if (parts.length >= 2 && parts[1].length > 3) {
      val = parts[0] + '.' + parts[1].slice(0, 3);
    }
    if (val.length > INPUT_LIMITS.carat) {
      val = val.slice(0, INPUT_LIMITS.carat);
    }
    set('carat')(val);
  };

  const handleCaratBlur = () => {
    if (form.carat.endsWith('.')) {
      set('carat')(form.carat.slice(0, -1));
    }
  };

  const topCategory = tree.find((c) => c.id === form.category);
  const subCategories = topCategory?.children ?? [];

  const errors: Record<string, Validation> = {
    weightGrams: isCaratValid(form.weightGrams.replace(',', '.')) ? null : 'validation.positive',
    metal: v.maxLength(form.metal, 80),
    diamondColor: v.maxLength(form.diamondColor, 80),
    diamondClarity: v.maxLength(form.diamondClarity, 80),
    name: v.required(form.name),
    code: v.code(form.code),
    category: form.category ? null : 'validation.categoryInvalid',
    goldKarat: form.goldKarat ? null : 'validation.required',
    carat: isCaratValid(form.carat) ? null : 'validation.positive',
    price: v.positive(parsePrice(form.price)),
    discount: v.discount(parseIntNum(form.discount)),
    images: form.imageKeys.length > 0 ? null : 'validation.imagesRequired',
  };
  form.extraFeatures.forEach((feature, index) => {
    if (feature.name.trim() || feature.detail.trim()) {
      errors[`extraFeatures[${index}].name`] = v.required(feature.name) || v.maxLength(feature.name, 80);
      errors[`extraFeatures[${index}].detail`] = v.required(feature.detail) || v.maxLength(feature.detail, 1000);
    }
  });
  const hasErrors = Object.values(errors).some(Boolean);

  const err = (key: string): string | null => {
    const code = (submitted ? errors[key] : null) ?? (serverFields[key] || null);
    return code ? tDynamic(code) : null;
  };

  const onFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;
    setServerError(null);
    setUploading(true);
    try {
      const room = IMAGE_UPLOAD.maxFiles - form.imageKeys.length;
      const keys: string[] = [];
      for (const file of files.slice(0, Math.max(room, 0))) keys.push(await services.products.uploadImage(file));
      setForm((f) => ({ ...f, imageKeys: [...f.imageKeys, ...keys] }));
      setServerFields((s) => ({ ...s, images: '' }));
    } catch (er) {
      setServerError(errorMessage(er));
    } finally {
      setUploading(false);
    }
  };

  const move = (index: number, dir: -1 | 1) =>
    setForm((f) => {
      const keys = [...f.imageKeys];
      const target = index + dir;
      if (target < 0 || target >= keys.length) return f;
      [keys[index], keys[target]] = [keys[target], keys[index]];
      return { ...f, imageKeys: keys };
    });
  const removeImage = (index: number) =>
    setForm((f) => ({ ...f, imageKeys: f.imageKeys.filter((_, i) => i !== index) }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setServerError(null);
    if (hasErrors || !isDirty) return;
    const name = toTitleCase(sanitizeText(form.name, INPUT_LIMITS.productName));
    const desc = sanitizeText(form.description, INPUT_LIMITS.productDescription);
    const caratNum = parseCarat(form.carat);
    const input: ProductInput = {
      name: { tr: name, en: name },
      description: { tr: desc, en: desc },
      features: sanitizeText(form.features, INPUT_LIMITS.productDescription),
      extraFeatures: form.extraFeatures.filter((feature) => feature.name.trim() || feature.detail.trim())
        .map((feature) => ({ name: toTitleCase(sanitizeText(feature.name, 80)), detail: sanitizeText(feature.detail, 1000) })),
      weightGrams: form.weightGrams.trim() ? Number(form.weightGrams.replace(',', '.')) : null,
      metal: sanitizeText(form.metal, 80),
      diamondColor: sanitizeText(form.diamondColor, 80),
      diamondClarity: sanitizeText(form.diamondClarity, 80),
      code: form.code.trim().toLocaleUpperCase('tr-TR'),
      category: form.category,
      subCategory: form.subCategory || null,
      goldKarat: form.goldKarat,
      carat: caratNum !== null && isCaratValid(form.carat) ? caratNum : null,
      price: Number(parsePrice(form.price)),
      discount: Number(parseIntNum(form.discount)),
      imageKeys: form.imageKeys,
      isActive: form.isActive,
      featured: form.featured,
    };
    setBusy(true);
    try {
      if (product) {
        const updated = await services.products.update(product.id, input);
        const updatedForm = fromProduct(updated);
        setSavedForm(updatedForm);
        setForm(updatedForm);
        setSubmitted(false);
        setBusy(false);
        toast.success('admin.form.updated');
        onSaved?.(updated);
      } else {
        const created = await services.products.create(input);
        toast.success('admin.form.created');
        navigate(ROUTES.adminProductEdit(created.id));
      }
    } catch (er) {
      if (isAppError(er) && er.fieldErrors) setServerFields(er.fieldErrors);
      setServerError(errorMessage(er));
      setBusy(false);
    }
  };

  return (
    <form className="stack" onSubmit={submit} noValidate>
      <div className="card">
        <div className="stack">
          <div className="form-grid form-grid--2">
            <Input
              label={t('admin.form.code')}
              required
              maxLength={INPUT_LIMITS.productCode}
              value={form.code}
              style={{ textTransform: 'uppercase' }}
              onChange={(e) => set('code')(e.target.value.toLocaleUpperCase('tr-TR'))}
              error={err('code')}
            />
            <Input
              label={t('admin.form.nameTr')}
              required
              maxLength={INPUT_LIMITS.productName}
              value={form.name}
              onChange={onText('name')}
              onBlur={() => set('name')(toTitleCase(form.name))}
              error={err('name')}
            />
            <Select
              label={t('admin.form.category')}
              required
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value, subCategory: '' }))}
              error={err('category')}
            >
              <option value=""></option>
              {tree.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name.tr}
                </option>
              ))}
            </Select>
            <Select label={t('admin.form.subCategory')} value={form.subCategory} onChange={onText('subCategory')} error={err('subCategory')}>
              <option value=""></option>
              {subCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name.tr}
                </option>
              ))}
            </Select>
            <Select
              label={t('admin.form.goldKarat')}
              required
              value={form.goldKarat}
              onChange={onText('goldKarat')}
              error={err('goldKarat')}
            >
              {GOLD_KARAT_OPTIONS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </Select>
            <Input
              label={t('admin.form.carat')}
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={form.carat}
              onKeyDown={handleCaratKeyDown}
              onPaste={handleCaratPaste}
              onChange={handleCaratChange}
              onBlur={handleCaratBlur}
              error={err('carat')}
            />
            <Input label={t('product.weightGrams')} inputMode="decimal" placeholder="5,13"
              value={form.weightGrams} onChange={handleWeightChange} onKeyDown={handleWeightKeyDown} onPaste={handleWeightPaste}
              onBlur={() => set('weightGrams')(form.weightGrams.replace(/,$/, ''))} maxLength={18} error={err('weightGrams')} />
            <ComboBox label={t('product.metal')} value={form.metal} onChange={set('metal')}
              options={[t('product.metals.whiteGold'), t('product.metals.yellowGold'), t('product.metals.greenGold'), t('product.metals.roseGold'), t('product.metals.platinum'), t('product.metals.silver')]}
              placeholder={t('admin.form.selectOrType')} error={err('metal')} />
            <ComboBox label={t('product.diamondColor')} value={form.diamondColor} onChange={set('diamondColor')}
              options={DIAMOND_COLOR_OPTIONS} placeholder={t('admin.form.selectOrType')} error={err('diamondColor')} />
            <ComboBox label={t('product.diamondClarity')} value={form.diamondClarity} onChange={set('diamondClarity')}
              options={DIAMOND_CLARITY_OPTIONS} placeholder={t('admin.form.selectOrType')} error={err('diamondClarity')} />
          </div>
          <div className="product-feature-editor">
            {form.extraFeatures.map((feature, index) => (
              <div key={feature.id} className="product-feature-editor__row">
                <Input label={t('admin.form.featureName')} value={feature.name} maxLength={80}
                  onChange={(e) => set('extraFeatures')(form.extraFeatures.map((row) => row.id === feature.id ? { ...row, name: e.target.value } : row))}
                  onBlur={() => set('extraFeatures')(form.extraFeatures.map((row) => row.id === feature.id ? { ...row, name: toTitleCase(row.name) } : row))}
                  error={err(`extraFeatures[${index}].name`)} />
                <Input label={t('admin.form.featureDetail')} value={feature.detail} maxLength={1000}
                  onChange={(e) => set('extraFeatures')(form.extraFeatures.map((row) => row.id === feature.id ? { ...row, detail: e.target.value } : row))}
                  error={err(`extraFeatures[${index}].detail`)} />
                <Button type="button" variant="ghost" size="sm" className="product-feature-editor__remove" aria-label={t('admin.form.removeFeature')} title={t('admin.form.removeFeature')}
                  onClick={() => set('extraFeatures')(form.extraFeatures.filter((row) => row.id !== feature.id))}>
                  <Icon name="trash" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="secondary" size="sm" className="product-feature-editor__add" disabled={form.extraFeatures.length >= 30}
              onClick={() => set('extraFeatures')([...form.extraFeatures, { id: uid(), name: '', detail: '' }])}>
              {t('admin.form.addFeature')}
            </Button>
          </div>
          <Textarea
            ref={descriptionRef}
            label={t('admin.form.descTr')}
            style={{ resize: 'none', overflowY: 'hidden', boxSizing: 'border-box' }}
            rows={4}
            maxLength={INPUT_LIMITS.productDescription}
            value={form.description}
            onChange={onText('description')}
            error={err('description')}
          />
        </div>
      </div>

      <div className="card">
        <h2 className="card__title">{t('admin.form.pricing')}</h2>
        <div className="form-grid form-grid--2">
          <Input label={t('admin.form.price')} required type="text" inputMode="numeric" maxLength={INPUT_LIMITS.price} value={form.price} onChange={handlePriceChange} error={err('price')} />
          <Input label={t('admin.form.discount')} required type="number" min={0} max={100} step="1" inputMode="decimal" value={form.discount} onChange={onText('discount')} error={err('discount')} />
        </div>
      </div>

      <div className="card">
        <h2 className="card__title">
          {t('admin.form.media')}{' '}
          <span className="field__required" aria-hidden="true">*</span>
        </h2>
        <p className="muted" style={{ marginTop: 0 }}>
          {t('admin.form.mediaHint')}
        </p>
        {form.imageKeys.length > 0 && (
          <ul className="upload-grid" style={{ marginBottom: 16 }}>
            {form.imageKeys.map((key, i) => (
              <li key={`${key.slice(0, 40)}-${i}`} className="upload-tile">
                <img src={mediaUrl(key)} alt="" />
                {i === 0 && <span className="badge badge--primary" style={{ position: 'absolute', top: 4, left: 4 }}>{t('admin.form.cover')}</span>}
                <div className="upload-tile__actions">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={t('admin.form.moveLeft')}>
                    ‹
                  </button>
                  <button type="button" onClick={() => removeImage(i)} aria-label={t('admin.form.removeImage')}>
                    ×
                  </button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === form.imageKeys.length - 1} aria-label={t('admin.form.moveRight')}>
                    ›
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {form.imageKeys.length < IMAGE_UPLOAD.maxFiles && (
          <label className="dropzone">
            <span>{uploading ? t('admin.form.uploading') : t('admin.form.dropzone')}</span>
            <input
              ref={fileRef}
              className="sr-only"
              type="file"
              accept={IMAGE_UPLOAD.allowedTypes.join(',')}
              multiple
              disabled={uploading}
              onChange={(e) => void onFiles(e)}
            />
          </label>
        )}
        {err('images') && (
          <span className="field__error" role="alert" style={{ display: 'block', marginTop: 8 }}>
            {err('images')}
          </span>
        )}
      </div>

      <div className="card">
        <h2 className="card__title">{t('admin.form.visibility')}</h2>
        <div className="form-grid form-grid--2">
          <label className="checkbox">
            <input type="checkbox" checked={form.isActive} onChange={(e) => {
              const isActive = e.target.checked;
              setForm((prev) => ({ ...prev, isActive, featured: isActive && prev.featured }));
            }} />
            {t('admin.form.isActive')}
          </label>
          <label className="checkbox">
            <input type="checkbox" checked={form.featured} disabled={!form.isActive} onChange={(e) => set('featured')(e.target.checked)} />
            {t('admin.form.featured')}
          </label>
        </div>
      </div>

      {serverError && <Alert kind="error">{serverError}</Alert>}
      <div className="row" style={{ justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
        <LinkButton to={ROUTES.adminProducts} variant="ghost" size="lg">
          {t('common.cancel')}
        </LinkButton>
        <Button type="submit" size="lg" loading={busy} disabled={busy || !isDirty}>
          {t('admin.form.save')}
        </Button>
      </div>
    </form>
  );
}

export default function AdminProductFormPage() {
  const { id } = useParams();
  const { t } = useI18n();
  const editing = Boolean(id);
  const product = useAsync(() => (id ? services.products.get(id) : Promise.resolve(null)), [id]);
  useDocumentMeta({ title: editing ? t('admin.form.titleEdit') : t('admin.form.titleNew'), noindex: true });

  return (
    <>
      <Breadcrumb
        items={[
          { label: t('admin.products.title'), to: ROUTES.adminProducts },
          { label: editing ? t('admin.form.titleEdit') : t('admin.form.titleNew') },
        ]}
      />
      <div className="dash__head">
        <h1>{editing ? t('admin.form.titleEdit') : t('admin.form.titleNew')}</h1>
      </div>
      {product.loading && !product.data ? (
        <Skeleton style={{ height: 320 }} />
      ) : product.error ? (
        <ErrorState error={product.error} onRetry={product.reload} />
      ) : (
        <ProductForm key={id ?? 'new'} product={product.data} onSaved={product.setData} />
      )}
    </>
  );
}
