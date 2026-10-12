import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { SOCIAL_LINKS, LEGAL_DOCS, STORE_CONTACT } from '@/constants';
import { useI18n } from '@/contexts/I18nContext';
import { Logo } from '../Header/Header';
import { Icon } from '@/components/ui/Icon';

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer__grid">
          <div className="footer__brand">
            <Logo noLink variant="light" />
            <div className="social">
              {SOCIAL_LINKS.map((s) => (
                <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.name}>
                  <Icon name={s.icon} />
                </a>
              ))}
            </div>
          </div>

          <nav aria-label={t('footer.legal')}>
            <h2 className="footer__title">{t('footer.legal')}</h2>
            <ul className="footer__list">
              {LEGAL_DOCS.map((d) => (
                <li key={d}><Link to={ROUTES.legal(d)}>{t(`legal.${d}.title`)}</Link></li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="footer__title">{t('footer.contact')}</h2>
            <address className="footer__contact">
              <a href={`tel:${STORE_CONTACT.phone.replace(/\s/g, '')}`} className="footer__contact-item">
                <Icon name="phone" size={18} />
                <span>{STORE_CONTACT.phone}</span>
              </a>
              <a href={`mailto:${STORE_CONTACT.email}`} className="footer__contact-item">
                <Icon name="mail" size={18} />
                <span>{STORE_CONTACT.email}</span>
              </a>
              <a
                href="https://www.google.com/maps/place/Molla+Fenari,+K%C4%B1l%C4%B1%C3%A7%C3%A7%C4%B1lar+Sok.,+34120+Fatih%2F%C4%B0stanbul/@41.0108369,28.9709054,17z/data=!3m1!4b1!4m6!3m5!1s0x14cab99400b21ddd:0x2f7f144cc932c884!8m2!3d41.0108369!4d28.9709054!16s%2Fg%2F1tdj7z81?entry=ttu&g_ep=EgoyMDI2MTAwNC4wIKXMDSoASAFQAw%3D%3D"
                target="_blank"
                rel="noopener noreferrer"
                className="footer__contact-item"
              >
                <Icon name="pin" size={18} />
                <span>{t('footer.address')}</span>
              </a>
              <div className="footer__contact-item">
                <Icon name="clock" size={18} />
                <span>
                  {t('footer.hoursWeekday')}
                  <br />
                  {t('footer.hoursWeekend')}
                </span>
              </div>
            </address>
          </div>
        </div>
        <div className="footer__bottom">
          <span>© {new Date().getFullYear()} Kashikchi Jewelry. {t('footer.rights')}</span>
        </div>
      </div>
    </footer>
  );
}
