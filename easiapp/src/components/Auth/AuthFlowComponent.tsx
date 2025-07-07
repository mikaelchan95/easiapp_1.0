import React, { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Mail, Lock, User, Phone, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface AuthFlowComponentProps {
  onBack: () => void;
  onSuccess: () => void;
}

type AuthMode = 'login' | 'register';

const AuthFlowComponent: React.FC<AuthFlowComponentProps> = ({ onBack, onSuccess }) => {
  const { login, state } = useApp();
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setLoading(true);
    
    try {
      // Simulate network delay for better UX
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const success = await login(loginData.email, loginData.password);
      if (success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 1200);
      } else {
        setError('Invalid email or password');
        setFieldErrors({
          email: 'Check your credentials',
          password: 'Check your credentials'
        });
      }
    } catch (err) {
      setError('Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    
    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match');
      setFieldErrors({
        password: 'Passwords must match',
        confirmPassword: 'Passwords must match'
      });
      return;
    }
    
    setLoading(true);
    
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        setMode('login');
        setError('');
        setSuccess(false);
        setLoginData({ email: registerData.email, password: '' });
      }, 1500);
    }, 1500);
  };

  const demoAccounts = [
    { email: 'retail@example.com', password: 'retail123', role: 'Retail Customer', color: 'bg-blue-50 border-blue-200' },
    { email: 'trade@business.com', password: 'trade123', role: 'Trade Account', color: 'bg-purple-50 border-purple-200' },
  ];

  const fillDemoAccount = (email: string, password: string) => {
    setLoginData({ email, password });
  };

  if (success) {
    return (
      <div className="bg-white min-h-screen max-w-sm mx-auto flex items-center justify-center">
        <div className="text-center px-8">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-in">
            <Check className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2 animate-fade-in">
            {mode === 'login' ? 'Welcome back!' : 'Account created!'}
          </h2>
          <p className="text-gray-600 animate-fade-in">
            {mode === 'login' ? 'Redirecting to your dashboard...' : 'You can now sign in with your credentials'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen max-w-sm mx-auto">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-4 h-4 text-gray-700" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">
            {mode === 'login' ? 'Sign In' : 'Sign Up'}
          </h1>
        </div>
      </div>

      <div className="px-6 py-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4 animate-bounce-in">
            <span className="text-white font-bold text-2xl">E</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2 animate-fade-in">
            {mode === 'login' ? 'Welcome Back' : 'Join EASI'}
          </h2>
          <p className="text-gray-600 animate-fade-in">
            {mode === 'login' 
              ? 'Sign in to your account' 
              : 'Create account to start shopping'
            }
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 animate-slide-down error-glow">
            <p className="text-sm text-red-700 text-center font-medium">{error}</p>
          </div>
        )}

        {/* Login Form */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={loginData.email}
                  onChange={(e) => {
                    setLoginData({...loginData, email: e.target.value});
                    if (fieldErrors.email) setFieldErrors(prev => ({...prev, email: ''}));
                  }}
                  placeholder="Enter email"
                  className={`w-full pl-12 pr-4 py-3 bg-gray-50 border rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none transition-all duration-200 ${
                    fieldErrors.email 
                      ? 'border-red-300 error-glow' 
                      : 'border-gray-200 focus:ring-2 focus:ring-black focus:border-black'
                  }`}
                  required
                />
                {fieldErrors.email && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-red-500">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>
              {fieldErrors.email && (
                <p className="text-xs text-red-600 mt-1 animate-fade-in">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginData.password}
                  onChange={(e) => {
                    setLoginData({...loginData, password: e.target.value});
                    if (fieldErrors.password) setFieldErrors(prev => ({...prev, password: ''}));
                  }}
                  placeholder="Enter password"
                  className={`w-full pl-12 pr-12 py-3 bg-gray-50 border rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none transition-all duration-200 ${
                    fieldErrors.password 
                      ? 'border-red-300 error-glow' 
                      : 'border-gray-200 focus:ring-2 focus:ring-black focus:border-black'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 active:scale-95 transition-transform"
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
              className="w-full bg-black text-white py-4 rounded-xl font-bold disabled:opacity-50 active:scale-95 transition-transform relative overflow-hidden"
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
        )}

        {/* Register Form */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                  placeholder="Full name"
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                  placeholder="Email address"
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">Phone</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="tel"
                  value={registerData.phone}
                  onChange={(e) => setRegisterData({...registerData, phone: e.target.value})}
                  placeholder="+65 XXXX XXXX"
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={registerData.password}
                  onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                  placeholder="Create password"
                  className={`w-full pl-12 pr-12 py-3 bg-gray-50 border rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none transition-all duration-200 ${
                    fieldErrors.password 
                      ? 'border-red-300 error-glow' 
                      : 'border-gray-200 focus:ring-2 focus:ring-black focus:border-black'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 active:scale-95 transition-transform"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">Confirm</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                  placeholder="Confirm password"
                  className={`w-full pl-12 pr-4 py-3 bg-gray-50 border rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none transition-all duration-200 ${
                    fieldErrors.confirmPassword 
                      ? 'border-red-300 error-glow' 
                      : 'border-gray-200 focus:ring-2 focus:ring-black focus:border-black'
                  }`}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-4 rounded-xl font-bold disabled:opacity-50 active:scale-95 transition-transform relative overflow-hidden"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  <span>Creating...</span>
                </div>
              ) : (
                'Create Account'
              )}
              {loading && <div className="absolute inset-0 loading-shimmer"></div>}
            </button>
          </form>
        )}

        {/* Switch Mode */}
        <div className="mt-8 text-center animate-fade-in">
          <p className="text-gray-600 mb-4">
            {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
          </p>
          <button
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="text-black font-bold active:scale-95 transition-transform"
          >
            {mode === 'login' ? 'Create Account' : 'Sign In'}
          </button>
        </div>

        {/* Demo Accounts */}
        {mode === 'login' && (
          <div className="mt-8 pt-8 border-t border-gray-200 animate-fade-in">
            <h3 className="text-sm font-bold text-gray-700 mb-4 text-center">Demo Access</h3>
            <div className="space-y-3">
              {demoAccounts.map((account, index) => (
                <button
                  key={index}
                  onClick={() => fillDemoAccount(account.email, account.password)}
                  className={`w-full p-4 ${account.color} rounded-xl text-left active:scale-95 transition-all duration-200`}
                >
                  <div className="font-bold text-sm text-gray-900">{account.role}</div>
                  <div className="text-xs text-gray-600">{account.email}</div>
                  <div className="text-xs text-gray-500 mt-1">Tap to fill form</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthFlowComponent;