import { ROUTES } from '@/constants/routes';

export const AUTH_ROUTES = ['/login', '/register'] as const;
export const LAST_VISITED_PAGE_KEY = 'kj:last-visited-page';

export function recordLastVisitedPage(pathname: string, search = '') {
  if (typeof window === 'undefined') return;
  const isAuth = AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  if (!isAuth && pathname.startsWith('/')) {
    try {
      sessionStorage.setItem(LAST_VISITED_PAGE_KEY, pathname + search);
    } catch {
      // Storage unavailable or quota exceeded
    }
  }
}

export function getPostLoginRedirect(locationState: unknown, userRole: number): string {
  const fromState = (locationState as { from?: string } | null)?.from;
  let target = typeof fromState === 'string' && fromState.trim().length > 0 ? fromState.trim() : null;

  if (!target && typeof window !== 'undefined') {
    try {
      const saved = sessionStorage.getItem(LAST_VISITED_PAGE_KEY);
      if (saved && typeof saved === 'string' && saved.trim().length > 0) {
        target = saved.trim();
      }
    } catch {}
  }

  // Clear after brief delay so concurrent guard and form navigations in the same cycle read the same target
  if (typeof window !== 'undefined') {
    try {
      window.setTimeout(() => {
        try {
          sessionStorage.removeItem(LAST_VISITED_PAGE_KEY);
        } catch {}
      }, 1000);
    } catch {}
  }

  // Validate target
  if (
    target &&
    target.startsWith('/') &&
    !AUTH_ROUTES.some((route) => target === route || target.startsWith(`${route}/`))
  ) {
    // If target is an admin-only page but user is a regular customer (role 0)
    if (target.startsWith('/admin') && userRole !== 1) {
      return ROUTES.home;
    }
    // If target is an account page but user is an admin (role 1)
    if (target.startsWith('/account') && userRole === 1) {
      if (target === '/account/profile') return ROUTES.adminProfile;
      if (target === '/account/orders') return ROUTES.adminOrders;
      if (target === '/account/notifications') return ROUTES.adminNotifications;
      if (target === '/account/messages') return ROUTES.adminMessages;
      return ROUTES.admin;
    }
    return target;
  }

  return userRole === 1 ? ROUTES.admin : ROUTES.home;
}
