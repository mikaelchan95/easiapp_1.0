import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Truck, Navigation, Clock, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { StaffProfile } from '../types';

interface LayoutProps {
  driver: StaffProfile;
  onLogout: () => void;
}

const tabs = [
  { to: '/', icon: Truck, label: 'Queue' },
  { to: '/active', icon: Navigation, label: 'Active' },
  { to: '/history', icon: Clock, label: 'History' },
] as const;

export function Layout({ driver, onLogout }: LayoutProps) {
  const navigate = useNavigate();

  async function handleLogout() {
    await supabase.auth.signOut();
    onLogout();
    navigate('/login');
  }

  return (
    <div className="flex flex-col h-dvh bg-gray-100">
      {/* Top header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Truck className="h-6 w-6 text-black" />
          <span className="text-lg font-bold text-gray-900">EasiDriver</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 hidden sm:block">
            {driver.full_name}
          </span>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
            aria-label="Log out"
          >
            <LogOut className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </header>

      {/* Scrollable content area */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom tab navigation */}
      <nav className="bg-white border-t border-gray-200 shrink-0">
        <div className="flex items-center justify-around h-16">
          {tabs.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                  isActive ? 'text-black' : 'text-gray-400 hover:text-gray-600'
                }`
              }
            >
              <Icon className="h-6 w-6" />
              <span className="text-xs font-medium">{label}</span>
            </NavLink>
          ))}
        </div>
        {/* Safe area spacer for iPhones with home bar */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </div>
  );
}
