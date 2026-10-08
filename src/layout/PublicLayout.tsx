import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Footer } from '@/layout/Footer/Footer';
import { Header } from '@/layout/Header/Header';
import { useI18n } from '@/contexts/I18nContext';

export default function PublicLayout() {
  const { t } = useI18n();
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  return (
    <>
      <a href="#main" className="skip-link">
        {t('a11y.skipToContent')}
      </a>
      <Header />
      <main id="main" tabIndex={-1} style={{ outline: 'none' }}>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
