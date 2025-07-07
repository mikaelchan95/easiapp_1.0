import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  
  const { login } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const success = await login(email, password);
      if (success) {
        setSuccess(true);
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 1200);
      } else {
        setError('Invalid credentials');
        setFieldErrors({
          email: 'Check your email',
          password: 'Check your password'
        });
      }
    } catch (err) {
      setError('Login failed');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { email: 'admin@epico.com', password: 'admin123', role: 'Admin', color: 'bg-black' },
    { email: 'retail@example.com', password: 'retail123', role: 'Retail', color: 'bg-blue-600' },
    { email: 'trade@business.com', password: 'trade123', role: 'Trade', color: 'bg-purple-600' },
  ];

  const fillDemoAccount = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center max-w-md mx-auto">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-in">
            <Check className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2 animate-fade-in">Welcome back!</h2>
          <p className="text-gray-600 animate-fade-in">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 max-w-md mx-auto">
      <div className="w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4 animate-bounce-in">
            <span className="text-white font-bold text-2xl">E</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2 animate-fade-in">
            Sign In
          </h2>
          <p className="text-gray-600 animate-fade-in">
            Access your account
          </p>
        </div>

        <div className="bg-white py-8 px-8 shadow-sm rounded-2xl border border-gray-100">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 error-glow animate-slide-down">
              <div className="text-sm text-red-600 font-medium text-center">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors(prev => ({...prev, email: ''}));
                  }}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none transition-all duration-200 ${
                    fieldErrors.email 
                      ? 'border-red-300 error-glow' 
                      : 'border-gray-200 focus:ring-2 focus:ring-black/10 focus:border-black'
                  }`}
                  placeholder="Enter email"
                  required
                />
                <Mail className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
              {fieldErrors.email && (
                <p className="text-xs text-red-600 mt-1 animate-fade-in">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors(prev => ({...prev, password: ''}));
                  }}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none transition-all duration-200 ${
                    fieldErrors.password 
                      ? 'border-red-300 error-glow' 
                      : 'border-gray-200 focus:ring-2 focus:ring-black/10 focus:border-black'
                  }`}
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-xs text-red-600 mt-1 animate-fade-in">{fieldErrors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-4 rounded-xl font-bold btn-premium disabled:opacity-50 relative overflow-hidden"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  <span>Signing In...</span>
                </div>
              ) : (
                'Sign In'
              )}
              {loading && <div className="absolute inset-0 loading-shimmer"></div>}
            </button>
          </form>

          {/* Demo Accounts */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-sm font-bold text-gray-700 mb-4 text-center">Demo Access</h3>
            <div className="grid gap-3">
              {demoAccounts.map((account, index) => (
                <button
                  key={index}
                  onClick={() => fillDemoAccount(account.email, account.password)}
                  className="w-full p-4 text-left rounded-xl border border-gray-200 hover:bg-gray-50 transition-all duration-200 hover-lift card-hover"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${account.color}`}></div>
                    <div>
                      <div className="font-bold text-sm text-gray-900">{account.role} Account</div>
                      <div className="text-xs text-gray-500">{account.email}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Need an account?{' '}
              <Link to="/register" className="font-bold text-black hover:underline">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;