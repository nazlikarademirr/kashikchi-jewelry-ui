import { type ReactNode, useEffect, useState } from 'react';
import { useI18n } from '@/contexts/I18nContext';

const SLIDES = [
  '/slides/slide_1_1791369657512.jpg',
  '/slides/new_slide_1_1791370444806.jpg',
  '/slides/slide_9_1791369752827.jpg',
  '/slides/slide_10_1791369763221.jpg',
  '/slides/new_slide_2_1791370455295.jpg',
  '/slides/slide_2_1791369669224.jpg',
  '/slides/slide_8_1791369742522.jpg',
  '/slides/new_slide_3_1791370465525.jpg',
  '/slides/new_slide_4_1791370476542.jpg',
  '/slides/new_slide_5_1791370486733.jpg',
  '/slides/new_slide_6_1791370495450.jpg',
  '/slides/new_slide_7_1791370506019.jpg',
  '/slides/new_slide_8_1791370516232.jpg',
];

export function AuthShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((s) => (s + 1) % SLIDES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="auth">
      <aside 
        className="auth__aside" 
        aria-hidden="false"
        style={{
          position: 'relative',
          padding: '0 0 8vh 4vw',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          alignItems: 'flex-start',
          overflow: 'hidden'
        }}
      >
        {SLIDES.map((slide, i) => (
          <div
            key={slide}
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 60%), url(${slide})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: i === currentSlide ? 1 : 0,
              transition: 'opacity 1.5s ease-in-out',
              zIndex: 0
            }}
          />
        ))}
        <p style={{ position: 'relative', zIndex: 1, color: 'rgba(255,255,255,0.75)', textShadow: '0 1px 2px rgba(0,0,0,0.5)', fontSize: '1.25rem', lineHeight: '1.6', maxWidth: '600px', fontWeight: 300, letterSpacing: '0.02em' }}>{t('auth.asideText')}</p>
      </aside>
      <div className="auth__main">
        <div className="auth__card">{children}</div>
      </div>
    </div>
  );
}
