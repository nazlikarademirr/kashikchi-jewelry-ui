import { Link } from 'react-router-dom';
import { ProductGrid } from '@/components/product';
import { LinkButton } from '@/components/ui/Button';
import { ErrorState, ProductGridSkeleton } from '@/components/ui/State';
import { ROUTES } from '@/constants/routes';
import { useCategories } from '@/contexts/CategoriesContext';
import { useI18n } from '@/contexts/I18nContext';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { services } from '@/services';
import { mediaUrl } from '@/utils/media';

const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  '10000000-0000-4000-8000-000000000001': '/images/ring-solitaire.jpg',
  '10000000-0000-4000-8000-000000000002': '/images/necklace-solitaire.jpg',
  '10000000-0000-4000-8000-000000000003': '/images/hero_diamond.jpg',
  '10000000-0000-4000-8000-000000000004': '/images/bracelet-tennis.jpg',
  '10000000-0000-4000-8000-000000000005': '/images/wedding-bands.jpg',
  '10000000-0000-4000-8000-000000000006': '/images/mens-jewelry.jpg',
  '10000000-0000-4000-8000-000000000007': '/images/set-bridal.jpg',
  '10000000-0000-4000-8000-000000000008': '/images/collections-showcase.jpg',
  yuzuk: '/images/ring-solitaire.jpg',
  ring: '/images/ring-solitaire.jpg',
  kolye: '/images/necklace-solitaire.jpg',
  necklace: '/images/necklace-solitaire.jpg',
  kupe: '/images/hero_diamond.jpg',
  earring: '/images/hero_diamond.jpg',
  bileklik: '/images/bracelet-tennis.jpg',
  bracelet: '/images/bracelet-tennis.jpg',
  alyans: '/images/wedding-bands.jpg',
  wedding: '/images/wedding-bands.jpg',
  erkek: '/images/mens-jewelry.jpg',
  men: '/images/mens-jewelry.jpg',
  setler: '/images/set-bridal.jpg',
  set: '/images/set-bridal.jpg',
  koleksiyonlar: '/images/collections-showcase.jpg',
  collection: '/images/collections-showcase.jpg',
};

function resolveCategoryImage(c: { id: string; imageKey?: string | null; name: { tr: string; en: string } }): string {
  if (c.imageKey) return c.imageKey;
  if (CATEGORY_FALLBACK_IMAGES[c.id]) return CATEGORY_FALLBACK_IMAGES[c.id];
  const tr = (c.name?.tr || '').toLowerCase();
  const en = (c.name?.en || '').toLowerCase();
  for (const [key, path] of Object.entries(CATEGORY_FALLBACK_IMAGES)) {
    if (tr.includes(key) || en.includes(key)) return path;
  }
  return '/images/ring-solitaire.jpg';
}

export default function HomePage() {
  const { t, loc } = useI18n();
  const { tree } = useCategories();
  const featured = useAsync(() => services.products.list({ featured: true, pageSize: 6 }), []);
  useDocumentMeta({ title: t('home.metaTitle'), description: t('home.metaDescription') });

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="container hero__inner">
          <div className="hero__copy">
            <h1 id="hero-title">{t('home.heroTitle')}</h1>
            <p>{t('home.heroText')}</p>
            <div className="hero__cta">
              <LinkButton to={ROUTES.products} variant="light" size="lg">
                {t('home.heroCta')}
              </LinkButton>
            </div>
          </div>
          <div className="hero__gem" aria-hidden="true">
            <svg viewBox="0 0 500 660" className="hero__gem-svg" aria-hidden="true">
              <defs>
                <clipPath id="hero-gem-clip">
                  <path d="M 86.16 362.95 A 199 199 0 1 1 413.84 362.95 L 257 590 Q 250 602 243 590 Z" />
                </clipPath>
              </defs>
              <path
                d="M 70.22 378.53 A 221 221 0 1 1 429.78 378.53 L 258 618 Q 250 630 242 618 Z"
                className="hero__gem-echo"
                fill="none"
              />
              <g clipPath="url(#hero-gem-clip)" className="hero__gem-frame">
                <image
                  href="/images/hero.jpg"
                  xlinkHref="/images/hero.jpg"
                  x="0"
                  y="51"
                  width="500"
                  height="551"
                  preserveAspectRatio="xMidYMid slice"
                />
              </g>
            </svg>
          </div>
        </div>
      </section>

      {tree.length > 0 && (
        <section className="section" aria-labelledby="cat-title">
          <div className="container">
            <div className="section__head">
              <h2 id="cat-title">{t('home.categoriesTitle')}</h2>
            </div>
            <div className="category-tiles">
              {tree.map((c) => {
                const imgPath = resolveCategoryImage(c);
                return (
                  <Link key={c.id} to={ROUTES.category(c.id)} className="category-tile">
                    <div className="category-tile__arch">
                      <img src={mediaUrl(imgPath)} alt={loc(c.name)} loading="lazy" width={600} height={800} />
                    </div>
                    <span className="category-tile__name">{loc(c.name)}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section className="section section--alt" aria-labelledby="featured-title">
        <div className="container">
          <div className="section__head">
            <div>
              <h2 id="featured-title">{t('home.featuredTitle')}</h2>
              <p>{t('home.featuredText')}</p>
            </div>
            <LinkButton to={ROUTES.products} variant="secondary">
              {t('home.viewAll')}
            </LinkButton>
          </div>
          {featured.loading ? (
            <ProductGridSkeleton count={6} />
          ) : featured.error ? (
            <ErrorState error={featured.error} onRetry={featured.reload} />
          ) : (
            featured.data && <ProductGrid products={featured.data.items} columns={3} />
          )}
        </div>
      </section>
    </>
  );
}
