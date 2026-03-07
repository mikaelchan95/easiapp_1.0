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
  Receipt,
  Users,
  Building2,
  FolderTree,
  Warehouse,
  Gift,
  FileImage,
  Truck,
  UserCheck,
  ClipboardList,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  CreditCard,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

function NavItem({
  to,
  icon: Icon,
  label,
  active,
  collapsed,
}: {
  to: string;
  icon: any;
  label: string;
  active: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 rounded-xl transition-all duration-200 text-sm font-medium ${
        active
          ? 'bg-[var(--color-primary-bg)] text-[var(--color-primary)]'
          : 'text-[var(--text-secondary)] hover:bg-gray-50 hover:text-[var(--text-primary)]'
      } ${collapsed ? 'justify-center px-2 py-3' : 'px-4 py-3'}`}
      title={collapsed ? label : undefined}
    >
      <Icon size={20} strokeWidth={active ? 2.5 : 2} className="shrink-0" />
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}

function SectionHeader({
  label,
  collapsed,
}: {
  label: string;
  collapsed: boolean;
}) {
  if (collapsed) return <div className="h-2" />;
  return (
    <div className="px-4 py-2 mt-6 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
      {label}
    </div>
  );
}

export const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
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
        className={`fixed inset-y-0 left-0 z-50 bg-[var(--bg-sidebar)] shadow-sm transition-[width] duration-300 ease-in-out lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'w-20' : 'w-64'}`}
      >
        <div
          className={`flex h-12 items-center border-b border-dashed border-[var(--border-subtle)] justify-between ${isCollapsed ? 'px-3' : 'px-5'}`}
        >
          <div
            className={`flex items-center gap-2 text-[var(--text-primary)] ${isCollapsed ? 'justify-center w-full' : ''}`}
          >
            <div
              className={`rounded-lg bg-[var(--color-primary)] flex items-center justify-center text-white font-bold text-lg shrink-0 transition-all duration-300 ${isCollapsed ? 'h-9 w-9' : 'h-8 w-8'}`}
            >
              E
            </div>
            {!isCollapsed && (
              <span className="text-lg font-bold tracking-tight">
                EASI Admin
              </span>
            )}
          </div>
          {!isCollapsed && (
            <button
              className="ml-auto lg:hidden text-gray-500"
              onClick={() => setMobileOpen(false)}
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Sidebar search */}
        <div
          className={`border-b border-dashed border-[var(--border-subtle)] ${isCollapsed ? 'px-2 py-2 flex justify-center' : 'px-4 py-2'}`}
        >
          {isCollapsed ? (
            <button
              className="p-2 text-[var(--text-tertiary)] hover:bg-gray-50 rounded-lg transition-colors"
              title="Search"
            >
              <Search size={18} />
            </button>
          ) : (
            <div className="relative">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                size={14}
              />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-8 pr-8 py-1.5 bg-gray-50 rounded-lg border border-[var(--border-subtle)] text-sm focus:ring-1 focus:ring-[var(--color-primary)] focus:border-transparent placeholder-gray-400 transition-all"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <span className="px-1 py-0.5 bg-gray-100 rounded text-[10px] font-medium text-gray-400">
                  ⌘K
                </span>
              </div>
            </div>
          )}
        </div>

        <div
          className={`flex flex-col h-[calc(100vh-92px)] justify-between ${isCollapsed ? 'p-2' : 'p-2 sm:p-4'}`}
        >
          <nav className="space-y-1 overflow-y-auto custom-scrollbar">
            <SectionHeader label="Main Menu" collapsed={isCollapsed} />
            <NavItem
              to="/"
              icon={LayoutDashboard}
              label="Overview"
              active={isActive('/')}
              collapsed={isCollapsed}
            />
            <NavItem
              to="/products"
              icon={Package}
              label="Products"
              active={isActive('/products')}
              collapsed={isCollapsed}
            />
            <NavItem
              to="/inventory"
              icon={Warehouse}
              label="Inventory"
              active={isActive('/inventory')}
              collapsed={isCollapsed}
            />
            <NavItem
              to="/categories"
              icon={FolderTree}
              label="Categories"
              active={isActive('/categories')}
              collapsed={isCollapsed}
            />
            <NavItem
              to="/orders"
              icon={ShoppingCart}
              label="Orders"
              active={isActive('/orders')}
              collapsed={isCollapsed}
            />

            <SectionHeader label="Customers" collapsed={isCollapsed} />
            <NavItem
              to="/customers"
              icon={Users}
              label="Customers"
              active={isActive('/customers')}
              collapsed={isCollapsed}
            />
            <NavItem
              to="/companies"
              icon={Building2}
              label="Companies"
              active={isActive('/companies')}
              collapsed={isCollapsed}
            />

            <SectionHeader label="Staff" collapsed={isCollapsed} />
            <NavItem
              to="/drivers"
              icon={Truck}
              label="Drivers"
              active={isActive('/drivers')}
              collapsed={isCollapsed}
            />
            <NavItem
              to="/salesmen"
              icon={UserCheck}
              label="Salesmen"
              active={isActive('/salesmen')}
              collapsed={isCollapsed}
            />

            <SectionHeader label="Operations" collapsed={isCollapsed} />
            <NavItem
              to="/deliveries"
              icon={ClipboardList}
              label="Deliveries"
              active={isActive('/deliveries')}
              collapsed={isCollapsed}
            />
            <NavItem
              to="/onboarding"
              icon={UserPlus}
              label="Onboarding"
              active={isActive('/onboarding')}
              collapsed={isCollapsed}
            />

            <SectionHeader label="Finance" collapsed={isCollapsed} />
            <NavItem
              to="/invoices"
              icon={Receipt}
              label="Invoices"
              active={isActive('/invoices')}
              collapsed={isCollapsed}
            />
            <NavItem
              to="/company-invoices"
              icon={Receipt}
              label="Company SOA"
              active={isActive('/company-invoices')}
              collapsed={isCollapsed}
            />
            <NavItem
              to="/credit-ar"
              icon={CreditCard}
              label="Credit & AR"
              active={isActive('/credit-ar')}
              collapsed={isCollapsed}
            />

            <SectionHeader label="Engagement" collapsed={isCollapsed} />
            <NavItem
              to="/rewards"
              icon={Gift}
              label="Rewards"
              active={isActive('/rewards')}
              collapsed={isCollapsed}
            />
            <NavItem
              to="/content"
              icon={FileImage}
              label="Content"
              active={isActive('/content')}
              collapsed={isCollapsed}
            />
            <NavItem
              to="/notifications"
              icon={Bell}
              label="Notifications"
              active={isActive('/notifications')}
              collapsed={isCollapsed}
            />

            <SectionHeader label="System" collapsed={isCollapsed} />
            <NavItem
              to="/settings"
              icon={Settings}
              label="Settings"
              active={isActive('/settings')}
              collapsed={isCollapsed}
            />
          </nav>

          <div className="pt-4 mt-auto border-t border-[var(--border-subtle)] space-y-2">
            {/* Profile */}
            <div
              className={`flex items-center gap-3 rounded-lg py-2 ${isCollapsed ? 'justify-center px-2' : 'px-4'}`}
            >
              <div className="h-8 w-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white font-bold text-xs shrink-0">
                {user.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate leading-tight">
                    {user.name || 'Admin'}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)] truncate">
                    {user.email || 'admin@easi.sg'}
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`hidden lg:flex w-full items-center gap-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-gray-50 rounded-lg transition-colors ${isCollapsed ? 'justify-center px-2' : 'px-4'}`}
            >
              {isCollapsed ? (
                <ChevronRight size={20} />
              ) : (
                <ChevronLeft size={20} />
              )}
              {!isCollapsed && <span>Collapse</span>}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={`flex w-full items-center gap-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors ${isCollapsed ? 'justify-center px-2' : 'px-4'}`}
            >
              <LogOut size={18} />
              {!isCollapsed && (
                <span>{isLoggingOut ? 'Signing out...' : 'Sign out'}</span>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden absolute top-4 left-4 z-10 p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
        >
          <Menu size={20} />
        </button>

        {/* Content Scroll Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 sm:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
