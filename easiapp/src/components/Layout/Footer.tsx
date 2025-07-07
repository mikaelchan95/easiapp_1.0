import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Wine } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Wine className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold">EASI</span>
                <span className="text-gray-400 ml-2">by Epico</span>
              </div>
            </div>
            <p className="text-gray-400 mb-6 max-w-md leading-relaxed">
              Singapore's premier alcohol distribution platform. From fine wines to premium spirits, 
              we deliver quality beverages for connoisseurs and businesses alike.
            </p>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-gray-400">
                <MapPin className="w-4 h-4 text-amber-500" />
                <span>123 Marina Bay, Singapore 018956</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-400">
                <Phone className="w-4 h-4 text-amber-500" />
                <span>+65 6789 1234</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-400">
                <Mail className="w-4 h-4 text-amber-500" />
                <span>hello@easi.epico.com</span>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-amber-400">Categories</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/products?category=wine" className="text-gray-400 hover:text-white transition-colors flex items-center">
                  <span className="mr-2">🍷</span>
                  Fine Wines
                </Link>
              </li>
              <li>
                <Link to="/products?category=whisky" className="text-gray-400 hover:text-white transition-colors flex items-center">
                  <span className="mr-2">🥃</span>
                  Premium Whisky
                </Link>
              </li>
              <li>
                <Link to="/products?category=spirits" className="text-gray-400 hover:text-white transition-colors flex items-center">
                  <span className="mr-2">🍸</span>
                  Craft Spirits
                </Link>
              </li>
              <li>
                <Link to="/products?category=liqueurs" className="text-gray-400 hover:text-white transition-colors flex items-center">
                  <span className="mr-2">🍹</span>
                  Artisan Liqueurs
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-amber-400">Account</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/login" className="text-gray-400 hover:text-white transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-gray-400 hover:text-white transition-colors">
                  Create Account
                </Link>
              </li>
              <li>
                <Link to="/orders" className="text-gray-400 hover:text-white transition-colors">
                  Track Orders
                </Link>
              </li>
              <li>
                <Link to="/trade" className="text-gray-400 hover:text-white transition-colors">
                  Trade Account
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <p className="text-gray-400 text-sm">
              © 2024 EASI by Epico. All rights reserved.
            </p>
            <div className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
              Drink Responsibly. Must be 21+
            </div>
          </div>
          <div className="flex space-x-6">
            <Link to="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">
              Terms of Service
            </Link>
            <Link to="/age-verification" className="text-gray-400 hover:text-white text-sm transition-colors">
              Age Verification
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;