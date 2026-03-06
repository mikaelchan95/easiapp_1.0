import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  LogOut,
  ShoppingCart,
  Menu,
  X,
  Bell,
  Settings,
  Search,
  ChevronDown,
  Receipt,
  Users,
  Building2,
  FolderTree,
  Gift,
  FileImage,
  Truck,
  UserCheck,
  ClipboardList,
  UserPlus,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Overview',
  '/products': 'Products',
  '/categories': 'Categories',
  '/customers': 'Customers',
  '/companies': 'Companies',
  '/orders': 'Orders',
  '/invoices': 'Invoices',
  '/company-invoices': 'Company Invoices',
  '/drivers': 'Drivers',
  '/salesmen': 'Salesmen',
  '/deliveries': 'Deliveries',
  '/onboarding': 'Onboarding Requests',
  '/rewards': 'Rewards',
  '/content': 'Content',
  '/notifications': 'Notifications',
  '/settings': 'Settings',
};

export const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [user, setUser] = useState({ name: '', email: '', role: '' });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const meta = session.user.user_metadata;
        const email = session.user.email ?? '';
        const name = meta?.full_name || meta?.name || email.split('@')[0];
        setUser({ name, email, role: meta?.role || 'Admin' });
      }
    });
  }, []);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout failed:', error);
      }
    } catch (error) {
      console.error('Unexpected logout error:', error);
    } finally {
      navigate('/login', { replace: true });
      setIsLoggingOut(false);
    }
  };

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const NavItem = ({
    to,
    icon: Icon,
    label,
  }: {
    to: string;
    icon: any;
    label: string;
  }) => {
    const active = isActive(to);
    return (
      <Link
        to={to}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
          active
            ? 'bg-[var(--color-primary-bg)] text-[var(--color-primary)]'
            : 'text-[var(--text-secondary)] hover:bg-gray-50 hover:text-[var(--text-primary)]'
        }`}
      >
        <Icon size={20} strokeWidth={active ? 2.5 : 2} />
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-app)] font-sans">
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[var(--bg-sidebar)] shadow-sm transition-transform duration-300 lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-20 items-center px-6 border-b border-dashed border-[var(--border-subtle)]">
          <div className="flex items-center gap-2 text-[var(--text-primary)]">
            <div className="h-8 w-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center text-white font-bold text-xl">
              E
            </div>
            <span className="text-xl font-bold tracking-tight">EASI Admin</span>
          </div>
          <button
            className="ml-auto lg:hidden text-gray-500"
            onClick={() => setMobileOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col h-[calc(100vh-80px)] justify-between p-4">
          <nav className="space-y-1 overflow-y-auto custom-scrollbar">
            <div className="px-4 py-2 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
              Main Menu
            </div>
            <NavItem to="/" icon={LayoutDashboard} label="Overview" />
            <NavItem to="/products" icon={Package} label="Products" />
            <NavItem to="/categories" icon={FolderTree} label="Categories" />
            <NavItem to="/orders" icon={ShoppingCart} label="Orders" />

            <div className="px-4 py-2 mt-6 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
              Customers
            </div>
            <NavItem to="/customers" icon={Users} label="Customers" />
            <NavItem to="/companies" icon={Building2} label="Companies" />

            <div className="px-4 py-2 mt-6 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
              Staff
            </div>
            <NavItem to="/drivers" icon={Truck} label="Drivers" />
            <NavItem to="/salesmen" icon={UserCheck} label="Salesmen" />

            <div className="px-4 py-2 mt-6 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
              Operations
            </div>
            <NavItem to="/deliveries" icon={ClipboardList} label="Deliveries" />
            <NavItem to="/onboarding" icon={UserPlus} label="Onboarding" />

            <div className="px-4 py-2 mt-6 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
              Finance
            </div>
            <NavItem to="/invoices" icon={Receipt} label="Invoices" />
            <NavItem
              to="/company-invoices"
              icon={Receipt}
              label="Company SOA"
            />

            <div className="px-4 py-2 mt-6 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
              Engagement
            </div>
            <NavItem to="/rewards" icon={Gift} label="Rewards" />
            <NavItem to="/content" icon={FileImage} label="Content" />
            <NavItem to="/notifications" icon={Bell} label="Notifications" />

            <div className="px-4 py-2 mt-6 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
              System
            </div>
            <NavItem to="/settings" icon={Settings} label="Settings" />
          </nav>

          <div className="pt-4 mt-auto border-t border-[var(--border-subtle)] space-y-2">
            <div className="flex items-center justify-between px-4 py-2">
              <span className="text-sm font-medium text-[var(--text-secondary)]">
                Dark Mode
              </span>
              <button
                onClick={toggleTheme}
                className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition-colors focus:outline-none dark:bg-gray-700"
              >
                <span
                  className={`${
                    theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200`}
                />
              </button>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={18} />
              <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="flex h-20 items-center justify-between gap-4 px-8 bg-[var(--bg-app)]">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] hidden sm:block">
              {ROUTE_TITLES[location.pathname] ??
                ROUTE_TITLES['/' + location.pathname.split('/')[1]] ??
                location.pathname.split('/')[1].charAt(0).toUpperCase() +
                  location.pathname.split('/')[1].slice(1)}
            </h1>
          </div>

          <div className="flex items-center gap-4 flex-1 justify-end max-w-4xl">
            {/* Search */}
            <div className="hidden md:flex relative w-full max-w-md">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search"
                className="w-full pl-10 pr-12 py-2.5 bg-white rounded-xl border-none shadow-sm text-sm focus:ring-2 focus:ring-[var(--color-primary)] placeholder-gray-400"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <span className="p-1 bg-gray-100 rounded text-[10px] font-medium text-gray-500">
                  ⌘
                </span>
                <span className="p-1 bg-gray-100 rounded text-[10px] font-medium text-gray-500">
                  K
                </span>
              </div>
            </div>

            {/* Profile */}
            <div className="flex items-center gap-3 pl-2">
              <div className="h-10 w-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-sm">
                {user.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="hidden xl:block">
                <p className="text-sm font-bold text-[var(--text-primary)]">
                  {user.name || 'Admin'}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  {user.role || 'Admin'}
                </p>
              </div>
              <button className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                <ChevronDown size={16} className="text-gray-400" />
              </button>
            </div>
          </div>
        </header>

        {/* Content Scroll Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 pt-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
