import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  Package,
  LogOut,
  ShoppingCart,
  Menu,
  X,
  Bell,
  Settings,
  Calendar,
  ChevronDown,
  Receipt,
  Tags,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  User,
  Wrench,
  Building2,
  Users,
  Gift,
  Layers,
  Tag,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';

export const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Profile Dropdown State
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Real user data
  const [user, setUser] = useState<{
    name: string;
    email: string;
    role: string;
    avatar: string;
  } | null>(null);

  // Fetch authenticated user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (authUser) {
          // Try to get user profile from database
          const { data: profile } = await supabase
            .from('users')
            .select('name, email, role')
            .eq('id', authUser.id)
            .single();

          setUser({
            name: profile?.name || authUser.email?.split('@')[0] || 'User',
            email: profile?.email || authUser.email || '',
            role: profile?.role || 'Admin',
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || authUser.email?.split('@')[0] || 'User')}&background=000000&color=fff`,
          });
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        // Fallback
        setUser({
          name: 'Admin',
          email: '',
          role: 'Admin',
          avatar:
            'https://ui-avatars.com/api/?name=Admin&background=000000&color=fff',
        });
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  useEffect(() => {
    setMobileOpen(false);
    setShowProfileMenu(false);
  }, [location.pathname]);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${
          active
            ? 'bg-[var(--color-primary-bg)] text-[var(--color-primary)] shadow-sm scale-[1.02]'
            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] hover:scale-[1.02] hover:shadow-sm'
        } ${collapsed ? 'justify-center px-2' : ''}`}
      >
        <div
          className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}
        >
          <Icon size={20} strokeWidth={active ? 2.5 : 2} />
        </div>

        {!collapsed && (
          <span className="transition-opacity duration-300 animate-fade-in whitespace-nowrap">
            {label}
          </span>
        )}

        {/* Tooltip for collapsed mode */}
        {collapsed && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-[var(--text-primary)] text-[var(--color-primary-text)] text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
            {label}
          </div>
        )}
      </Link>
    );
  };

  const SectionLabel = ({ label }: { label: string }) => {
    if (collapsed) return <div className="h-4 my-2" />;
    return (
      <div className="px-4 py-2 mt-6 first:mt-2 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider transition-all duration-300 whitespace-nowrap overflow-hidden">
        {label}
      </div>
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
        className={`fixed inset-y-0 left-0 z-50 bg-[var(--bg-sidebar)] shadow-xl lg:shadow-sm transition-all duration-300 ease-in-out lg:static ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${collapsed ? 'w-20' : 'w-64'}`}
      >
        <div
          className={`flex h-20 items-center px-4 border-b border-dashed border-[var(--border-subtle)] relative ${collapsed ? 'justify-center' : 'justify-between'}`}
        >
          <div className="flex items-center gap-3 text-[var(--text-primary)] overflow-hidden">
            <div
              className={`flex-shrink-0 h-10 w-10 rounded-xl bg-[var(--color-primary)] flex items-center justify-center text-[var(--color-primary-text)] font-bold text-xl shadow-lg transition-all duration-300 ${collapsed ? 'scale-110' : ''}`}
            >
              E
            </div>
            {!collapsed && (
              <span className="text-xl font-bold tracking-tight whitespace-nowrap transition-opacity duration-300">
                EASI Admin
              </span>
            )}
          </div>

          {/* Mobile Close Button */}
          <button
            className="lg:hidden text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            <X size={20} />
          </button>

          {/* Desktop Collapse Toggle - positioned on the border */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-full items-center justify-center text-[var(--text-secondary)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all duration-300 shadow-sm z-10"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        <div className="flex flex-col h-[calc(100vh-80px)] justify-between p-3">
          <nav className="space-y-1 overflow-y-auto custom-scrollbar overflow-x-hidden">
            <SectionLabel label="Operations" />
            <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
            <NavItem to="/orders" icon={ShoppingCart} label="Orders" />
            <NavItem to="/invoices" icon={Receipt} label="Invoices" />

            <SectionLabel label="Catalog" />
            <NavItem to="/products" icon={Package} label="Products" />
            <NavItem to="/categories" icon={Layers} label="Categories" />
            <NavItem to="/brands" icon={Tag} label="Brands" />

            <SectionLabel label="Accounts" />
            <NavItem to="/customers" icon={Users} label="Customers" />
            <NavItem to="/companies" icon={Building2} label="Companies" />

            <SectionLabel label="Loyalty" />
            <NavItem to="/rewards" icon={Gift} label="Rewards & Points" />

            <SectionLabel label="System" />
            <NavItem to="/notifications" icon={Bell} label="Notifications" />
            <NavItem to="/maintenance" icon={Wrench} label="Maintenance" />
            <NavItem to="/settings" icon={Settings} label="Settings" />
          </nav>

          <div className="pt-4 mt-auto border-t border-[var(--border-subtle)] space-y-2">
            {!collapsed ? (
              <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg-tertiary)] rounded-xl mx-1 transition-all duration-300">
                <span className="text-sm font-medium text-[var(--text-secondary)]">
                  Dark Mode
                </span>
                <button
                  onClick={toggleTheme}
                  className="relative inline-flex h-6 w-11 items-center rounded-full bg-[var(--border-default)] transition-colors focus:outline-none dark:bg-[var(--bg-tertiary)]"
                >
                  <span
                    className={`${
                      theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-[var(--bg-card)] transition-transform duration-200 shadow-sm`}
                  />
                </button>
              </div>
            ) : (
              <button
                onClick={toggleTheme}
                className="flex w-full items-center justify-center p-3 text-[var(--text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--bg-tertiary)] rounded-xl transition-all duration-300"
                title="Toggle Theme"
              >
                <div
                  className={`w-4 h-4 rounded-full ${theme === 'dark' ? 'bg-[var(--text-primary)]' : 'bg-[var(--border-default)] border-2 border-[var(--text-tertiary)]'}`}
                ></div>
              </button>
            )}

            <button
              onClick={handleLogout}
              className={`flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 hover:shadow-sm rounded-xl transition-all duration-300 ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? 'Logout' : ''}
            >
              <LogOut
                size={18}
                className="transition-transform group-hover:scale-110"
              />
              {!collapsed && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300">
        {/* Top Header */}
        <header className="flex h-20 items-center justify-between gap-4 px-8 bg-[var(--bg-app)]">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] hidden sm:block animate-fade-in">
              {location.pathname === '/'
                ? 'Dashboard'
                : location.pathname.split('/')[1].charAt(0).toUpperCase() +
                  location.pathname.split('/')[1].slice(1)}
            </h1>
          </div>

          <div className="flex items-center gap-4 flex-1 justify-end max-w-4xl">
            {/* Search - Removed */}

            {/* Profile */}
            {user && (
              <div ref={profileRef} className="relative">
                <div
                  className="flex items-center gap-3 pl-2 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                  <div className="hidden xl:block">
                    <p className="text-sm font-bold text-[var(--text-primary)]">
                      {user.name}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {user.role}
                    </p>
                  </div>
                  <button
                    className={`p-1 hover:bg-[var(--border-default)] rounded-full transition-all duration-200 ${showProfileMenu ? 'rotate-180 bg-[var(--border-default)]' : ''}`}
                  >
                    <ChevronDown
                      size={16}
                      className="text-[var(--text-tertiary)]"
                    />
                  </button>
                </div>

                {/* Profile Dropdown */}
                {showProfileMenu && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-[var(--bg-card)] rounded-xl shadow-lg border border-[var(--border-subtle)] z-50 overflow-hidden animate-fade-in">
                    <div className="px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-tertiary)]">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        {user.name}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {user.email}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)] mt-1">
                        {user.role}
                      </p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => {
                          navigate('/settings');
                          setShowProfileMenu(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] flex items-center gap-2"
                      >
                        <Settings size={16} />
                        Settings
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <LogOut size={16} />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Content Scroll Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 pt-0 custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
