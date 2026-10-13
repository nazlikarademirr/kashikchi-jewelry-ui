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

export function Logo({ noLink, variant, onClick }: { noLink?: boolean; variant?: 'light' | 'dark'; onClick?: () => void }) {
  const { t } = useI18n();
  const { theme } = useTheme();

  const isLightLogo = variant === 'light' || (!variant && theme === 'dark');
  const logoSrc = isLightLogo ? '/logo-light.png' : '/logo.png';

  const content = (
    <>
      <img
        src={logoSrc}
        alt="Kashikchi Jewelry"
        className="brand__mark"
        width={35}
        height={48}
      />
      <span className="brand__text">
        <span className="brand__name">KASHIKCHI</span>
        <span className="brand__sub">JEWELRY</span>
      </span>
    </>
  );

  if (noLink) {
    return <div className="brand">{content}</div>;
  }

  return (
    <Link to={ROUTES.home} className="brand" aria-label={t('header.homeAria')} onClick={onClick}>
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

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      className={`icon-btn theme-toggle ${className}`.trim()}
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
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
      if (e.key === 'Tab') {
        const items = ref.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
        if (!items?.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      prev?.focus?.();
    };
  }, []);

  const cls = ({ isActive }: { isActive: boolean }) => (isActive ? 'active' : '');
  return (
    <div className="mobile-nav" role="dialog" aria-modal="true" aria-label={t('a11y.mainNav')}>
      <div className="mobile-nav__backdrop" onClick={onClose} />
      <div className="mobile-nav__panel" ref={ref}>
        <div className="mobile-nav__head">
          <Logo onClick={onClose} />
          <button ref={closeRef} type="button" className="icon-btn" onClick={onClose} aria-label={t('common.close')}>
            <Icon name="close" />
          </button>
        </div>
        <nav aria-label={t('a11y.mainNav')}>
          <NavLink to={ROUTES.home} end className={cls} onClick={onClose}>
            {t('nav.home')}
          </NavLink>
          <NavLink to={ROUTES.products} className={cls} onClick={onClose}>
            {t('nav.allProducts')}
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
        </nav>
        <div className="mobile-nav__footer">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
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
            <span>{user.email || user.phone}</span>
          </div>
          {isAdmin ? (
            <>
              <Link to={ROUTES.admin} role="menuitem">{t('account.adminPanel')}</Link>
              <Link to={ROUTES.adminOrders} role="menuitem">{t('admin.nav.orders')}</Link>
              <Link to={ROUTES.adminNotifications} role="menuitem">
                {t('admin.nav.notifications')}
                {unreadCount > 0 && <span className="badge badge--primary">{unreadCount}</span>}
              </Link>
              <Link to={ROUTES.adminMessages} role="menuitem">{t('admin.nav.messages')}</Link>
              <Link to={ROUTES.adminProfile} role="menuitem">{t('account.nav.profile')}</Link>
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
              <Link to={ROUTES.accountProfile} role="menuitem">{t('account.nav.profile')}</Link>
            </>
          )}
          <button
            type="button"
            className="menu-item"
            role="menuitem"
            onClick={async () => {
              setOpen(false);
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
            <div className="header__desktop-only">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>
      {mobileOpen && <MobileNav onClose={() => setMobileOpen(false)} />}
    </>
  );
}
