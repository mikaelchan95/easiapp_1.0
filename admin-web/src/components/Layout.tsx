import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  LogOut,
  Users,
  ShoppingCart,
  FileText,
  Building2,
  Gift,
  Menu,
  X,
  Megaphone,
  Bell,
  Tags,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Receipt,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';

export const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Persist desktop sidebar state
  useEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved !== null) {
      setDesktopCollapsed(saved === 'true');
    }
  }, []);

  const toggleDesktopSidebar = () => {
    const newState = !desktopCollapsed;
    setDesktopCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', String(newState));
  };

  const isActive = (path: string) => location.pathname === path;

  const NavItem = ({
    to,
    icon: Icon,
    label,
  }: {
    to: string;
    icon: any;
    label: string;
  }) => (
    <Link
      to={to}
      className={`group relative flex items-center gap-3 rounded-md transition-all duration-200 ${
        desktopCollapsed ? 'justify-center p-3 lg:p-3' : 'px-3 py-2.5'
      } ${
        isActive(to)
          ? 'bg-brand-white text-brand-dark shadow-sm'
          : 'text-gray-400 hover:bg-white/5 hover:text-white'
      }`}
      title={desktopCollapsed ? label : undefined}
    >
      <Icon size={20} className="flex-shrink-0" />
      <span
        className={`font-medium text-sm transition-opacity duration-200 ${
          desktopCollapsed ? 'lg:hidden' : ''
        }`}
      >
        {label}
      </span>

      {/* Tooltip for collapsed state */}
      {desktopCollapsed && (
        <div className="hidden lg:block absolute left-full ml-2 px-2 py-1 bg-brand-dark text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-white/10">
          {label}
        </div>
      )}
    </Link>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-secondary)]">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between px-4 shadow-md bg-[var(--bg-primary)] border-b border-[var(--border-primary)]">
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">
          EasiApp
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded-md transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 -mr-2 text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded-md transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 shadow-xl transition-all duration-300 ease-in-out bg-[var(--bg-primary)] border-r border-[var(--border-primary)]
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:relative lg:translate-x-0
          ${desktopCollapsed ? 'lg:w-16' : 'lg:w-64'}
          w-64
        `}
      >
        {/* Desktop Header with Collapse Button */}
        <div className="hidden lg:flex h-14 items-center justify-between px-3 border-b border-[var(--border-primary)]">
          <h1
            className={`font-semibold text-[var(--text-primary)] transition-opacity duration-200 ${
              desktopCollapsed ? 'opacity-0 w-0' : 'opacity-100'
            }`}
          >
            EasiApp Admin
          </h1>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-md transition-colors"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <button
              onClick={toggleDesktopSidebar}
              className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-md transition-colors"
              aria-label={
                desktopCollapsed ? 'Expand sidebar' : 'Collapse sidebar'
              }
            >
              {desktopCollapsed ? (
                <ChevronRight size={18} />
              ) : (
                <ChevronLeft size={18} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="lg:hidden flex h-14 items-center justify-between px-4 border-b border-[var(--border-primary)]">
          <h1 className="font-semibold text-[var(--text-primary)]">
            EasiApp Admin
          </h1>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 -mr-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-md transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav
          className={`flex flex-col gap-1 overflow-y-auto h-[calc(100vh-112px)] mt-2 ${
            desktopCollapsed ? 'px-2' : 'px-3'
          }`}
        >
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
          <NavItem to="/products" icon={Package} label="Products" />
          <NavItem to="/categories" icon={Tags} label="Categories" />
          <NavItem to="/customers" icon={Users} label="Customers" />
          <NavItem to="/rewards" icon={Gift} label="Rewards" />
          <NavItem to="/companies" icon={Building2} label="Companies" />
          <NavItem to="/orders" icon={ShoppingCart} label="Orders" />
          <NavItem to="/invoices" icon={FileText} label="Invoices" />
          <NavItem to="/company-invoices" icon={Receipt} label="Company SOA" />
          <NavItem to="/content" icon={Megaphone} label="Content & Banners" />
          <NavItem to="/notifications" icon={Bell} label="Notifications" />
          <NavItem to="/settings" icon={Settings} label="Settings" />
        </nav>

        {/* Logout Button */}
        <div
          className={`absolute bottom-0 w-full border-t border-[var(--border-primary)] bg-[var(--bg-primary)] ${
            desktopCollapsed ? 'p-2' : 'p-3'
          }`}
        >
          <button
            onClick={handleLogout}
            className={`group relative flex w-full items-center gap-3 rounded-md text-red-500 dark:text-red-400 transition-all duration-200 hover:bg-red-500/10 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-300 ${
              desktopCollapsed ? 'justify-center p-3 lg:p-3' : 'px-3 py-2.5'
            }`}
            title={desktopCollapsed ? 'Sign Out' : undefined}
          >
            <LogOut size={20} className="flex-shrink-0" />
            <span
              className={`font-medium text-sm transition-opacity duration-200 ${
                desktopCollapsed ? 'lg:hidden' : ''
              }`}
            >
              Sign Out
            </span>

            {/* Tooltip for collapsed state */}
            {desktopCollapsed && (
              <div className="hidden lg:block absolute left-full ml-2 px-2 py-1 bg-[var(--bg-primary)] text-[var(--text-primary)] text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-[var(--border-primary)] shadow-lg">
                Sign Out
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full overflow-y-auto bg-[var(--bg-secondary)] pt-14 lg:pt-0">
        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
