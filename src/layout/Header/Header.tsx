import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useCategories } from '@/contexts/CategoriesContext';
import { useI18n } from '@/contexts/I18nContext';
import { useNotificationsBadge } from '@/contexts/NotificationsContext';
import { useTheme } from '@/contexts/ThemeContext';
import { SUPPORTED_LOCALES } from '@/locales';
import { Icon } from '@/components/ui/Icon';

export function Logo({ noLink }: { noLink?: boolean }) {
  const { t } = useI18n();
  const content = (
    <>
      <svg className="brand__mark" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 8h20l8 10-18 22L6 18l8-10Z" />
        <path d="M6 18h36M18 8l6 10 6-10M18 18l6 22 6-22" strokeWidth="1.3" />
      </svg>
      <span className="brand__text">
        <span className="brand__name">KASHIKCHI</span>
        <span className="brand__sub">JEWELERY</span>
      </span>
    </>
  );

  if (noLink) {
    return <div className="brand">{content}</div>;
  }

  return (
    <Link to={ROUTES.home} className="brand" aria-label={t('header.homeAria')}>
      {content}
    </Link>
  );
}

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  return (
    <div className="lang-switch" role="group" aria-label={t('header.language')}>
      {SUPPORTED_LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={locale === l}
          lang={l}
          onClick={() => setLocale(l)}
          aria-label={t(l === 'tr' ? 'header.langTr' : 'header.langEn')}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      className="icon-btn"
      onClick={toggleTheme}
      aria-pressed={dark}
      aria-label={dark ? t('header.switchToLight') : t('header.switchToDark')}
    >
      <Icon name={dark ? 'sun' : 'moon'} />
    </button>
  );
}

function navCls({ isActive }: { isActive: boolean }) {
  return `nav-link ${isActive ? 'active' : ''}`;
}

export function CategoryNav() {
  const { tree } = useCategories();
  const { t, loc } = useI18n();
  return (
    <nav className="main-nav" aria-label={t('a11y.mainNav')}>
      <ul className="main-nav__list">
        <li className="nav-item">
          <NavLink to={ROUTES.home} end className={navCls}>
            {t('nav.home')}
          </NavLink>
        </li>
        {tree.map((c) => (
          <li className="nav-item" key={c.id}>
            <NavLink to={ROUTES.category(c.id)} className={navCls} onClick={(e) => e.currentTarget.blur()}>
              {loc(c.name)}
              {c.children.length > 0 && <Icon name="chevronDown" size={12} />}
            </NavLink>
            {c.children.length > 0 && (
              <div className="nav-dropdown">
                <NavLink to={ROUTES.category(c.id)} end onClick={(e) => e.currentTarget.blur()}>
                  {t('nav.all', { name: loc(c.name) })}
                </NavLink>
                {c.children.map((s) => (
                  <NavLink key={s.id} to={ROUTES.category(c.id, s.id)} onClick={(e) => e.currentTarget.blur()}>
                    {loc(s.name)}
                  </NavLink>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

function MobileNav({ onClose }: { onClose: () => void }) {
  const { tree } = useCategories();
  const { t, loc } = useI18n();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>('button, a')?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prev?.focus?.();
    };
  }, [onClose]);

  const cls = ({ isActive }: { isActive: boolean }) => (isActive ? 'active' : '');
  return (
    <div className="mobile-nav" role="dialog" aria-modal="true" aria-label={t('a11y.mainNav')}>
      <div className="mobile-nav__backdrop" onClick={onClose} />
      <div className="mobile-nav__panel" ref={ref}>
        <div className="mobile-nav__head">
          <Logo />
          <button type="button" className="icon-btn" onClick={onClose} aria-label={t('common.close')}>
            <Icon name="close" />
          </button>
        </div>
        <nav aria-label={t('a11y.mainNav')}>
          <NavLink to={ROUTES.home} end className={cls} onClick={onClose}>
            {t('nav.home')}
          </NavLink>
          {tree.map((c) => (
            <div key={c.id}>
              <NavLink to={ROUTES.category(c.id)} end className={cls} onClick={onClose}>
                {loc(c.name)}
              </NavLink>
              <div className="sub">
                {c.children.map((s) => (
                  <NavLink key={s.id} to={ROUTES.category(c.id, s.id)} className={cls} onClick={onClose}>
                    {loc(s.name)}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
          <NavLink to={ROUTES.products} className={cls} onClick={onClose}>
            {t('nav.allProducts')}
          </NavLink>
        </nav>
      </div>
    </div>
  );
}

function UserMenu() {
  const { user, isAdmin, logout } = useAuth();
  const { unreadCount } = useNotificationsBadge();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) {
    return (
      <Link to={ROUTES.login} className="icon-btn" aria-label={t('header.login')}>
        <Icon name="user" />
      </Link>
    );
  }
  return (
    <div className="user-menu" ref={wrapRef}>
      <button
        type="button"
        className="icon-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('header.account')}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name="user" />
        {unreadCount > 0 && <span className="icon-btn__badge" aria-label={t('notifications.unreadN', { n: unreadCount })}>{unreadCount}</span>}
      </button>
      {open && (
        <div className="user-menu__panel" role="menu">
          <div className="user-menu__who">
            <strong>
              {user.name} {user.surname}
            </strong>
            <span>{user.email}</span>
          </div>
          {isAdmin ? (
            <>
              <Link to={ROUTES.admin} role="menuitem">{t('account.adminPanel')}</Link>
              <Link to={ROUTES.adminOrders} role="menuitem">{t('admin.nav.orders')}</Link>
              <Link to={ROUTES.adminNotifications} role="menuitem">
                {t('admin.nav.notifications')}
                {unreadCount > 0 && <span className="badge badge--primary">{unreadCount}</span>}
              </Link>
            </>
          ) : (
            <>
              <Link to={ROUTES.account} role="menuitem">{t('account.nav.overview')}</Link>
              <Link to={ROUTES.accountOrders} role="menuitem">{t('account.nav.orders')}</Link>
              <Link to={ROUTES.accountNotifications} role="menuitem">
                {t('account.nav.notifications')}
                {unreadCount > 0 && <span className="badge badge--primary">{unreadCount}</span>}
              </Link>
              <Link to={ROUTES.accountMessages} role="menuitem">{t('account.nav.messages')}</Link>
            </>
          )}
          <button
            type="button"
            className="menu-item"
            role="menuitem"
            onClick={async () => {
              await logout();
              navigate(ROUTES.home);
            }}
          >
            {t('header.logout')}
          </button>
        </div>
      )}
    </div>
  );
}

export function Header() {
  const { t } = useI18n();
  const { isAdmin } = useAuth();
  const { count } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setMobileOpen(false), [location.pathname]);

  return (
    <>
      <header className="site-header">
        <div className="container header__inner">
          <button
            type="button"
            className="icon-btn menu-toggle"
            onClick={() => setMobileOpen(true)}
            aria-label={t('header.openMenu')}
            aria-expanded={mobileOpen}
          >
            <Icon name="menu" />
          </button>
          <Logo />
          <CategoryNav />
          <div className="header__actions">
            <UserMenu />
            {!isAdmin && (
              <>
                <Link to={ROUTES.favorites} className="icon-btn" aria-label={t('header.favorites')}>
                  <Icon name="heart" />
                </Link>
                <Link to={ROUTES.cart} className="icon-btn" aria-label={t('header.cartN', { n: count })}>
                  <Icon name="bag" />
                  {count > 0 && <span className="icon-btn__badge" aria-hidden="true">{count}</span>}
                </Link>
              </>
            )}
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>
      {mobileOpen && <MobileNav onClose={() => setMobileOpen(false)} />}
    </>
  );
}
