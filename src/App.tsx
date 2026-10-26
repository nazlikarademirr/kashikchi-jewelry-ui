import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { CategoriesProvider } from '@/contexts/CategoriesContext';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { I18nProvider } from '@/contexts/I18nContext';
import { NotificationsProvider } from '@/contexts/NotificationsContext';
import { ProductCompareProvider } from '@/contexts/ProductCompareContext';
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
                  <ProductCompareProvider>
                    <CartProvider>
                      <AppRoutes />
                    </CartProvider>
                  </ProductCompareProvider>
                </FavoritesProvider>
              </NotificationsProvider>
            </CategoriesProvider>
          </AuthProvider>
        </ToastProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
