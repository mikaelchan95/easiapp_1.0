import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import ProductForm from './components/ProductForm';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import OrderForm from './components/OrderForm';
import Invoices from './pages/Invoices';
import CompanyInvoices from './pages/CompanyInvoices';
import Rewards from './pages/Rewards';
import Companies from './pages/Companies';
import CompanyDetail from './pages/CompanyDetail';
import CompanyForm from './components/CompanyForm';
import Settings from './pages/Settings';
import Content from './pages/Content';
import Notifications from './pages/Notifications';
import NotificationTemplates from './pages/NotificationTemplates';
import NotificationHistory from './pages/NotificationHistory';
import NotificationAnalytics from './pages/NotificationAnalytics';
import Categories from './pages/Categories';
import Brands from './pages/Brands';
import Maintenance from './pages/Maintenance';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/new" element={<ProductForm />} />
            <Route path="/products/:id" element={<ProductForm />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/brands" element={<Brands />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/:id" element={<CustomerDetail />} />

            <Route path="/companies" element={<Companies />} />
            <Route path="/companies/new" element={<CompanyForm />} />
            <Route path="/companies/:id/edit" element={<CompanyForm />} />
            <Route path="/companies/:id" element={<CompanyDetail />} />

            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/new" element={<OrderForm />} />
            <Route path="/orders/:id/edit" element={<OrderForm />} />
            <Route path="/orders/:id" element={<OrderDetail />} />

            <Route path="/invoices" element={<Invoices />} />
            <Route path="/company-invoices" element={<CompanyInvoices />} />
            <Route path="/rewards" element={<Rewards />} />
            <Route path="/content" element={<Content />} />

            {/* Notification Routes */}
            <Route path="/notifications" element={<Notifications />} />
            <Route
              path="/notifications/templates"
              element={<NotificationTemplates />}
            />
            <Route
              path="/notifications/history"
              element={<NotificationHistory />}
            />
            <Route
              path="/notifications/analytics"
              element={<NotificationAnalytics />}
            />

            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
