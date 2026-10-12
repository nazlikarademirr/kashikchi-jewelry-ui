import { Navigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';

export default function CheckoutPage() {
  return <Navigate to={ROUTES.cart} replace />;
}
