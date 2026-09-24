import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { LoginPage } from '@/features/auth/LoginPage';
import { DashboardLayout } from '@/features/dashboard/DashboardLayout';
import { OverviewPage } from '@/features/overview/OverviewPage';
import { SubscriptionsPage } from '@/features/subscriptions/SubscriptionsPage';
import { ReceivablesPage } from '@/features/receivables/ReceivablesPage';
import { ProductsPage } from '@/features/products/ProductsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard/*"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<OverviewPage />} />
        <Route path="assinaturas" element={<SubscriptionsPage />} />
        <Route path="contas-a-receber" element={<ReceivablesPage />} />
        <Route path="produtos" element={<ProductsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
