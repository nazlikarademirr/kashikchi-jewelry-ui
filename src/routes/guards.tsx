import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Spinner } from '@/components/ui/State';
import { LinkButton } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/State';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import type { UserRole } from '@/types';


function Forbidden() {
  const { t } = useI18n();
  const { isAdmin } = useAuth();
  return (
    <div className="container section">
      <EmptyState
        icon="shield"
        title={t('errors.FORBIDDEN_TITLE')}
        description={t('errors.FORBIDDEN')}
        action={<LinkButton to={isAdmin ? ROUTES.admin : ROUTES.home}>{t(isAdmin ? 'account.adminPanel' : 'common.backHome')}</LinkButton>}
      />
    </div>
  );
}

export function RequireRole({ role }: { role: UserRole }) {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to={ROUTES.login} replace state={{ from: location.pathname + location.search }} />;
  if (user.role !== role) {
    if (isAdmin && location.pathname.startsWith('/account')) {
      if (location.pathname === '/account/profile') return <Navigate to={ROUTES.adminProfile} replace />;
      if (location.pathname === '/account/orders') return <Navigate to={ROUTES.adminOrders} replace />;
      if (location.pathname === '/account/notifications') return <Navigate to={ROUTES.adminNotifications} replace />;
      if (location.pathname === '/account/messages') return <Navigate to={ROUTES.adminMessages} replace />;
      return <Navigate to={ROUTES.admin} replace />;
    }
    return <Forbidden />;
  }
  return <Outlet />;
}

export function GuestOnly() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (user) {
    return <Navigate to={ROUTES.home} replace />;
  }
  return <Outlet />;
}
