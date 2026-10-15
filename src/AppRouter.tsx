import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Spinner } from '@/components/ui/State';
import { ROUTES } from '@/constants/routes';
import PublicLayout from '@/layout/PublicLayout';
import { AccountLayout, AdminLayout } from '@/layout/DashLayouts';
import { GuestOnly, RequireRole } from './routes/guards';
import HomePage from '@/pages/Home/HomePage';


const ProductsPage = lazy(() => import('@/pages/Products/ProductsPage'));
const CategoryPage = lazy(() => import('@/pages/Category/CategoryPage'));
const ProductDetailPage = lazy(() => import('@/pages/ProductDetail/ProductDetailPage'));
const FavoritesPage = lazy(() => import('@/pages/Favorites/FavoritesPage'));
const CartPage = lazy(() => import('@/pages/Cart/CartPage'));
const LoginPage = lazy(() => import('@/pages/Login/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/Register/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPassword/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPassword/ResetPasswordPage'));
const LegalPage = lazy(() => import('@/pages/Legal/LegalPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFound/NotFoundPage'));

const AccountHome = lazy(() => import('@/pages/Account/Home/AccountHome'));
const AccountOrders = lazy(() => import('@/pages/Account/Orders/OrdersPage'));
const AccountOrderDetail = lazy(() => import('@/pages/Account/OrderDetail/OrderDetailPage'));
const AccountProfile = lazy(() => import('@/pages/Account/Profile/ProfilePage'));
const NotificationsPage = lazy(() => import('@/pages/Notifications/NotificationsPage'));
const MessagesPage = lazy(() => import('@/pages/Messages/MessagesPage'));

const AdminDashboard = lazy(() => import('@/pages/Admin/Dashboard/DashboardPage'));
const AdminCategories = lazy(() => import('@/pages/Admin/Categories/CategoriesPage'));
const AdminProducts = lazy(() => import('@/pages/Admin/Products/ProductsPage'));
const AdminProductForm = lazy(() => import('@/pages/Admin/ProductForm/ProductFormPage'));
const AdminFeaturedProducts = lazy(() => import('@/pages/Admin/Featured/FeaturedProductsPage'));
const AdminOrders = lazy(() => import('@/pages/Admin/Orders/OrdersPage'));
const AdminOrderDetail = lazy(() => import('@/pages/Admin/OrderDetail/OrderDetailPage'));
const AdminDeletedOrders = lazy(() => import('@/pages/Admin/DeletedOrders/DeletedOrdersPage'));

export function AppRoutes() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/:id" element={<ProductDetailPage />} />
          <Route path="category/:category" element={<CategoryPage />} />
          <Route path="category/:category/:subCategory" element={<CategoryPage />} />
          <Route path="legal/:doc" element={<LegalPage />} />

          <Route element={<GuestOnly />}>
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
            <Route path="reset-password" element={<ResetPasswordPage />} />
          </Route>

          <Route element={<RequireRole role={0} />}>
            <Route path="favorites" element={<FavoritesPage />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="checkout" element={<Navigate to={ROUTES.cart} replace />} />
            <Route path="account" element={<AccountLayout />}>
              <Route index element={<AccountHome />} />
              <Route path="orders" element={<AccountOrders />} />
              <Route path="orders/:id" element={<AccountOrderDetail />} />
              <Route path="profile" element={<AccountProfile />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="messages" element={<MessagesPage />} />
            </Route>
          </Route>

          <Route element={<RequireRole role={1} />}>
            <Route path="admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="products/new" element={<AdminProductForm />} />
              <Route path="products/:id/edit" element={<AdminProductForm />} />
              <Route path="featured" element={<AdminFeaturedProducts />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="orders/:id" element={<AdminOrderDetail />} />
              <Route path="deleted-orders" element={<AdminDeletedOrders />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="messages" element={<MessagesPage />} />
              <Route path="profile" element={<AccountProfile />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
