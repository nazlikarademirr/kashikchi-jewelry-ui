import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { CategoriesProvider } from '@/contexts/CategoriesContext';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { I18nProvider } from '@/contexts/I18nContext';
import { NotificationsProvider } from '@/contexts/NotificationsContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { AppRoutes } from '@/AppRouter';

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <ToastProvider>
          <AuthProvider>
            <CategoriesProvider>
              <NotificationsProvider>
                <FavoritesProvider>
                  <CartProvider>
                    <AppRoutes />
                  </CartProvider>
                </FavoritesProvider>
              </NotificationsProvider>
            </CategoriesProvider>
          </AuthProvider>
        </ToastProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
