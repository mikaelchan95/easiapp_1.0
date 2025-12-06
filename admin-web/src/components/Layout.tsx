import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  LogOut,
  Users,
  ShoppingCart,
  FileText,
  Building2,
  Gift,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen bg-brand-light">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-10 w-64 bg-brand-dark text-brand-white shadow-lg">
        <div className="flex h-16 items-center justify-center border-b border-white/10 px-4">
          <h1 className="text-xl font-bold">EasiApp Admin</h1>
        </div>

        <nav className="mt-6 flex flex-col gap-2 px-4">
          <Link
            to="/"
            className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
              isActive('/')
                ? 'bg-brand-white text-brand-dark font-medium shadow-sm'
                : 'text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <LayoutDashboard size={20} />
            <span className="font-medium">Dashboard</span>
          </Link>

          <Link
            to="/products"
            className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
              isActive('/products')
                ? 'bg-brand-white text-brand-dark font-medium shadow-sm'
                : 'text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Package size={20} />
            <span className="font-medium">Products</span>
          </Link>

          <Link
            to="/customers"
            className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
              isActive('/customers')
                ? 'bg-brand-white text-brand-dark font-medium shadow-sm'
                : 'text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Users size={20} />
            <span className="font-medium">Customers</span>
          </Link>

          <Link
            to="/rewards"
            className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
              isActive('/rewards')
                ? 'bg-brand-white text-brand-dark font-medium shadow-sm'
                : 'text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Gift size={20} />
            <span className="font-medium">Rewards</span>
          </Link>

          <Link
            to="/companies"
            className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
              isActive('/companies')
                ? 'bg-brand-white text-brand-dark font-medium shadow-sm'
                : 'text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Building2 size={20} />
            <span className="font-medium">Companies</span>
          </Link>

          <Link
            to="/orders"
            className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
              isActive('/orders')
                ? 'bg-brand-white text-brand-dark font-medium shadow-sm'
                : 'text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <ShoppingCart size={20} />
            <span className="font-medium">Orders</span>
          </Link>

          <Link
            to="/invoices"
            className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
              isActive('/invoices')
                ? 'bg-brand-white text-brand-dark font-medium shadow-sm'
                : 'text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <FileText size={20} />
            <span className="font-medium">Invoices</span>
          </Link>

          <Link
            to="/settings"
            className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
              isActive('/settings')
                ? 'bg-brand-white text-brand-dark font-medium shadow-sm'
                : 'text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            {/* Using generic specific icon for settings not available in import, using generic one or adding import */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.39a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span className="font-medium">Settings</span>
          </Link>
        </nav>

        <div className="absolute bottom-0 w-full border-t border-white/10 p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-red-400 transition-colors hover:bg-red-900/20 hover:text-red-300"
          >
            <LogOut size={20} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 w-full p-8 text-brand-dark">
        <div className="mx-auto max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
