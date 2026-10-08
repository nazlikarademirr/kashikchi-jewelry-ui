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
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to={ROUTES.login} replace state={{ from: location.pathname + location.search }} />;
  if (user.role !== role) return <Forbidden />;
  return <Outlet />;
}

export function GuestOnly() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner />;
  if (user) {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={user.role === 1 ? ROUTES.admin : (from ?? ROUTES.home)} replace />;
  }
  return <Outlet />;
}
