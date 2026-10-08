import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useI18n } from '@/contexts/I18nContext';
import { ROUTES } from '@/constants/routes';

export function useRequireCustomer(): () => boolean {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { t } = useI18n();

  return useCallback(() => {
    if (!user) {
      navigate(ROUTES.login, { state: { from: location.pathname + location.search } });
      return false;
    }
    if (isAdmin) {
      toast.error(t('errors.FORBIDDEN'));
      return false;
    }
    return true;
  }, [user, isAdmin, navigate, location, toast, t]);
}
