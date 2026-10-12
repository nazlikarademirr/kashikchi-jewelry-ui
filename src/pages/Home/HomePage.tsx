import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ProductGrid } from '@/components/product';
import { LinkButton } from '@/components/ui/Button';
import { ROUTES } from '@/constants/routes';
import { useCategories } from '@/contexts/CategoriesContext';
import { useI18n } from '@/contexts/I18nContext';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { services } from '@/services';
import { mediaUrl } from '@/utils/media';

const HERO_SLIDES = [
  '/images/hero.jpg',
  '/images/hero-slide-1.jpg',
  '/images/hero-slide-2.jpg',
  '/images/hero-slide-3.jpg',
  '/images/hero-slide-4.jpg',
];

const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  yuzuk: '/images/ring-solitaire.jpg',
  ring: '/images/ring-solitaire.jpg',
  kolye: '/images/necklace-solitaire.jpg',
  necklace: '/images/necklace-solitaire.jpg',
  kupe: '/images/earrings.jpg',
  earring: '/images/earrings.jpg',
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
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const featured = useAsync(() => services.products.list({ featured: true, pageSize: 6 }), []);
  useDocumentMeta({ title: t('home.metaTitle'), description: t('home.metaDescription') });

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__slides" aria-hidden="true">
          {HERO_SLIDES.map((slide, i) => (
            <div
              key={slide}
              className="hero__slide"
              style={{
                backgroundImage: `url(${slide})`,
                opacity: i === currentSlide ? 1 : 0,
              }}
            />
          ))}
          <div className="hero__overlay" />
        </div>
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

      {featured.data && featured.data.items.length > 0 && (
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
            <ProductGrid products={featured.data.items} columns={3} />
          </div>
        </section>
      )}
    </>
  );
}
