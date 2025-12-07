import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock, Mail } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-secondary)] px-4 py-8">
      <div className="w-full max-w-md rounded-xl bg-[var(--bg-primary)] p-6 sm:p-8 shadow-xl border border-[var(--border-primary)]">
        <div className="mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
            Welcome Back
          </h1>
          <p className="mt-2 text-[var(--text-secondary)] text-sm sm:text-base">
            Sign in to access admin panel
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] py-3 pl-10 pr-4 focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all"
                placeholder="admin@example.com"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] py-3 pl-10 pr-4 focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[48px] rounded-lg bg-[var(--text-primary)] text-[var(--bg-primary)] py-3 font-semibold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
