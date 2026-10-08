import { NavLink, Outlet } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { useI18n } from '@/contexts/I18nContext';
import { useNotificationsBadge } from '@/contexts/NotificationsContext';
import { useAuth } from '@/contexts/AuthContext';
import type { TranslationKey } from '@/locales';

interface NavEntry {
  to: string;
  label: TranslationKey;
  end?: boolean;
  badge?: boolean;
}

function DashShell({ title, entries }: { title: TranslationKey; entries: NavEntry[] }) {
  const { t } = useI18n();
  const { unreadCount } = useNotificationsBadge();
  return (
    <div className="container dash">
      <nav className="dash__nav" aria-label={t(title)}>
        <div className="dash__nav-title">{t(title)}</div>
        {entries.map((e) => (
          <NavLink key={e.to} to={e.to} end={e.end} className={({ isActive }) => `dash__link ${isActive ? 'active' : ''}`}>
            {t(e.label)}
            {e.badge && unreadCount > 0 && <span className="badge badge--primary">{unreadCount}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="dash__main">
        <Outlet />
      </div>
    </div>
  );
}

export function AccountLayout() {
  const { user } = useAuth();
  void user;
  return (
    <DashShell
      title="account.title"
      entries={[
        { to: ROUTES.account, label: 'account.nav.overview', end: true },
        { to: ROUTES.accountOrders, label: 'account.nav.orders' },
        { to: ROUTES.accountNotifications, label: 'account.nav.notifications', badge: true },
        { to: ROUTES.accountMessages, label: 'account.nav.messages' },
        { to: ROUTES.favorites, label: 'header.favorites' },
      ]}
    />
  );
}

export function AdminLayout() {
  return (
    <DashShell
      title="admin.title"
      entries={[
        { to: ROUTES.admin, label: 'admin.nav.dashboard', end: true },
        { to: ROUTES.adminOrders, label: 'admin.nav.orders' },
        { to: ROUTES.adminNotifications, label: 'admin.nav.notifications', badge: true },
        { to: ROUTES.adminMessages, label: 'admin.nav.messages' },
        { to: ROUTES.adminProducts, label: 'admin.nav.products' },
        { to: ROUTES.adminStock, label: 'admin.nav.stock' },
        { to: ROUTES.adminCategories, label: 'admin.nav.categories' },
      ]}
    />
  );
}
