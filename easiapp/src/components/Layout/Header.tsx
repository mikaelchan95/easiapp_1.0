import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  User, 
  Bell, 
  Menu, 
  X, 
  LogOut, 
  Settings, 
  Package,
  Search,
  Wine
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

const Header: React.FC = () => {
  const { state, logout, getCartItemCount } = useApp();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsProfileOpen(false);
  };

  const unreadNotifications = state.notifications.filter(n => !n.read).length;

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-sm">
              <Wine className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-gray-900">EASI</span>
              <span className="text-xs text-gray-500 -mt-1">by Epico</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/products" className="text-gray-700 hover:text-amber-600 transition-colors font-medium">
              Browse
            </Link>
            {state.user?.role === 'admin' && (
              <Link to="/admin" className="text-gray-700 hover:text-amber-600 transition-colors font-medium">
                Admin
              </Link>
            )}
            {state.user && (
              <Link to="/orders" className="text-gray-700 hover:text-amber-600 transition-colors font-medium">
                Orders
              </Link>
            )}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-3">
            {/* Search - Desktop */}
            <Link to="/products" className="hidden md:flex items-center space-x-2 p-2 text-gray-600 hover:text-amber-600 transition-colors bg-gray-50 rounded-lg hover:bg-gray-100">
              <Search className="w-4 h-4" />
              <span className="text-sm">Search</span>
            </Link>

            {/* Cart */}
            {state.user && (
              <Link to="/cart" className="relative p-2 text-gray-600 hover:text-amber-600 transition-colors">
                <ShoppingCart className="w-5 h-5" />
                {getCartItemCount() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                    {getCartItemCount()}
                  </span>
                )}
              </Link>
            )}

            {/* Notifications */}
            {state.user && (
              <button className="relative p-2 text-gray-600 hover:text-amber-600 transition-colors">
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}
              </button>
            )}

            {/* User Profile */}
            {state.user ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-medium text-gray-700">{state.user.name}</div>
                    {state.user.role === 'trade' && (
                      <div className="text-xs text-amber-600">Trade Account</div>
                    )}
                  </div>
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border py-2">
                    <div className="px-4 py-3 border-b">
                      <p className="text-sm font-medium text-gray-900">{state.user.name}</p>
                      <p className="text-xs text-gray-500 capitalize flex items-center">
                        {state.user.role} Account
                        {state.user.role === 'trade' && (
                          <span className="ml-2 bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs">
                            Wholesale
                          </span>
                        )}
                      </p>
                    </div>
                    <Link
                      to="/profile"
                      className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      <span>Account Settings</span>
                    </Link>
                    <Link
                      to="/orders"
                      className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Package className="w-4 h-4" />
                      <span>Order History</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors font-medium shadow-sm"
              >
                Sign In
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-amber-600 transition-colors"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t py-4 bg-gray-50 -mx-4 px-4">
            <nav className="flex flex-col space-y-4">
              <Link
                to="/products"
                className="text-gray-700 hover:text-amber-600 transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Browse Products
              </Link>
              {state.user?.role === 'admin' && (
                <Link
                  to="/admin"
                  className="text-gray-700 hover:text-amber-600 transition-colors font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Admin Dashboard
                </Link>
              )}
              {state.user && (
                <Link
                  to="/orders"
                  className="text-gray-700 hover:text-amber-600 transition-colors font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  My Orders
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;