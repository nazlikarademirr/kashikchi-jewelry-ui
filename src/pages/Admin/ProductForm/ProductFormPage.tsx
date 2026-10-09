import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, LinkButton } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Breadcrumb } from '@/components/ui/Misc';
import { Alert, ErrorState, Skeleton } from '@/components/ui/State';
import { IMAGE_UPLOAD } from '@/constants';
import { ROUTES } from '@/constants/routes';
import { useCategories } from '@/contexts/CategoriesContext';
import { useI18n } from '@/contexts/I18nContext';
import { useToast } from '@/contexts/ToastContext';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { services } from '@/services';
import { isAppError, type Product, type ProductInput } from '@/types';
import { mediaUrl } from '@/utils/media';
import { sanitizeText, v, type Validation } from '@/utils/validation';

interface FormState {
  name: string;
  description: string;
  code: string;
  category: string;
  subCategory: string;
  carat: string;
  price: string;
  discount: string;
  stock: string;
  imageKeys: string[];
  isActive: boolean;
  featured: boolean;
}

const EMPTY: FormState = {
  name: '',
  description: '',
  code: '',
  category: '',
  subCategory: '',
  carat: '',
  price: '',
  discount: '0',
  stock: '0',
  imageKeys: [],
  isActive: true,
  featured: false,
};

const num = (s: string): number | '' => (s.trim() === '' ? '' : Number(s.replace(/\./g, '').replace(',', '.')));

function fromProduct(p: Product): FormState {
  return {
    name: p.name.tr || p.name.en,
    description: p.description.tr || p.description.en,
    code: p.code,
    category: p.category,
    subCategory: p.subCategory ?? '',
    carat: String(p.carat),
    price: p.price ? p.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : '',
    discount: String(p.discount),
    stock: String(p.stock),
    imageKeys: p.images.map((i) => i.storageKey),
    isActive: p.isActive,
    featured: p.featured,
  };
}

function ProductForm({ product }: { product: Product | null }) {
  const { t, tDynamic, errorMessage } = useI18n();
  const { tree } = useCategories();
  const toast = useToast();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<FormState>(product ? fromProduct(product) : EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverFields, setServerFields] = useState<Record<string, string>>({});
  const editing = product !== null;

  // Yeni üründe ilk kategoriyi varsayılan seç
  useEffect(() => {
    if (!editing && !form.category && tree.length > 0) setForm((f) => ({ ...f, category: tree[0].id }));
  }, [tree, editing, form.category]);

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

  const topCategory = tree.find((c) => c.id === form.category);
  const subCategories = topCategory?.children ?? [];

  const errors: Record<string, Validation> = {
    name: v.required(form.name),
    code: v.code(form.code),
    category: form.category ? null : 'validation.categoryInvalid',
    carat: num(form.carat) !== '' ? v.positive(num(form.carat)) : null,
    price: v.positive(num(form.price)),
    discount: v.discount(num(form.discount)),
    stock: v.nonNegativeInt(num(form.stock)),

  };
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
    if (hasErrors) return;
    const name = sanitizeText(form.name, 160);
    const desc = sanitizeText(form.description, 4000);
    const input: ProductInput = {
      name: { tr: name, en: name },
      description: { tr: desc, en: desc },
      code: form.code.trim().toUpperCase(),
      stock: Number(num(form.stock)),
      category: form.category,
      subCategory: form.subCategory || null,
      carat: Number(num(form.carat)),
      price: Number(num(form.price)),
      discount: Number(num(form.discount)),
      imageKeys: form.imageKeys,
      isActive: form.isActive,
      featured: form.featured,
    };
    setBusy(true);
    try {
      if (product) await services.products.update(product.id, input);
      else await services.products.create(input);
      toast.success(product ? 'admin.form.updated' : 'admin.form.created');
      navigate(ROUTES.adminProducts);
    } catch (er) {
      if (isAppError(er) && er.fieldErrors) setServerFields(er.fieldErrors);
      setServerError(errorMessage(er));
      setBusy(false);
    }
  };

  return (
    <form className="stack" onSubmit={submit} noValidate>
      <div className="card">
        <h2 className="card__title">{t('admin.form.basics')}</h2>
        <div className="stack">
          <Input
            label={t('admin.form.code')}
            required
            maxLength={30}
            value={form.code}
            onChange={(e) => set('code')(e.target.value.toUpperCase())}
            error={err('code')}
          />
          <Input label={t('admin.form.nameTr')} required maxLength={160} value={form.name} onChange={onText('name')} error={err('name')} />
          <Textarea label={t('admin.form.descTr')} rows={4} maxLength={4000} value={form.description} onChange={onText('description')} error={err('description')} />
        </div>
      </div>

      <div className="card">
        <h2 className="card__title">{t('admin.form.classification')}</h2>
        <div className="form-grid form-grid--2">
          <Select
            label={t('admin.form.category')}
            required
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value, subCategory: '' }))}
            error={err('category')}
          >
            {tree.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name.tr}
              </option>
            ))}
          </Select>
          <Select label={t('admin.form.subCategory')} value={form.subCategory} onChange={onText('subCategory')} error={err('subCategory')}>
            <option value="">{t('admin.form.noSubCategory')}</option>
            {subCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name.tr}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="card">
        <h2 className="card__title">{t('admin.form.pricing')}</h2>
        <div className="form-grid form-grid--2">
          <Input label={t('admin.form.carat')} type="number" min={0} step="0.01" inputMode="decimal" value={form.carat} onChange={onText('carat')} error={err('carat')} />
          <Input label={t('admin.form.price')} required type="text" inputMode="numeric" value={form.price} onChange={handlePriceChange} error={err('price')} />
          <Input label={t('admin.form.discount')} required type="number" min={0} max={100} step="1" inputMode="decimal" value={form.discount} onChange={onText('discount')} error={err('discount')} />
          <Input
            label={t('admin.form.stock')}
            required
            type="number"
            min={0}
            step="1"
            inputMode="numeric"
            value={form.stock}
            onChange={onText('stock')}
            error={err('stock')}
          />
        </div>
      </div>

      <div className="card">
        <h2 className="card__title">{t('admin.form.media')}</h2>
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
            <input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive')(e.target.checked)} />
            {t('admin.form.isActive')}
          </label>
          <label className="checkbox">
            <input type="checkbox" checked={form.featured} onChange={(e) => set('featured')(e.target.checked)} />
            {t('admin.form.featured')}
          </label>
        </div>
      </div>

      {serverError && <Alert kind="error">{serverError}</Alert>}
      <div className="row">
        <Button type="submit" size="lg" loading={busy}>
          {t('admin.form.save')}
        </Button>
        <LinkButton to={ROUTES.adminProducts} variant="ghost" size="lg">
          {t('common.cancel')}
        </LinkButton>
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
      {product.loading ? (
        <Skeleton style={{ height: 320 }} />
      ) : product.error ? (
        <ErrorState error={product.error} onRetry={product.reload} />
      ) : (
        <ProductForm key={id ?? 'new'} product={product.data} />
      )}
    </>
  );
}
