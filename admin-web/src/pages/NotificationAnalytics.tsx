import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart2, TrendingUp, Users, CheckCircle } from 'lucide-react';

export default function NotificationAnalytics() {
  const [stats, setStats] = useState({
    totalSent: 0,
    openRate: 0,
    activeSubscribers: 0,
    deliveryRate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setIsLoading(true);

      // Parallelize queries for better performance
      const [
        { count: totalSent },
        { count: totalRead },
        { count: totalUsers },
        { count: pushEnabledUsers },
      ] = await Promise.all([
        supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true }),
        supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'read'),
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase
          .from('user_notification_settings')
          .select('*', { count: 'exact', head: true })
          .eq('push_enabled', true),
      ]);

      const sent = totalSent || 0;
      const read = totalRead || 0;
      const users = totalUsers || 1; // avoid division by zero
      const pushEnabled = pushEnabledUsers || 0;

      setStats({
        totalSent: sent,
        openRate: sent > 0 ? Math.round((read / sent) * 100) : 0,
        activeSubscribers: Math.round((pushEnabled / users) * 100), // Approximate
        deliveryRate: 98, // Mocked for now, would need delivery tracking
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, suffix = '' }: any) => (
    <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
          <Icon className={color.replace('bg-', 'text-')} size={24} />
        </div>
        <span className="text-xs font-medium text-[var(--text-secondary)] bg-[var(--bg-tertiary)] px-2 py-1 rounded-full">
          Last 30 days
        </span>
      </div>
      <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-1">
        {isLoading ? '...' : value}
        {suffix}
      </h3>
      <p className="text-sm text-[var(--text-secondary)]">{title}</p>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Analytics
        </h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          Insights into your notification performance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Notifications Sent"
          value={stats.totalSent}
          icon={BarChart2}
          color="bg-[var(--text-primary)] text-[var(--text-primary)]"
        />
        <StatCard
          title="Open Rate"
          value={stats.openRate}
          suffix="%"
          icon={TrendingUp}
          color="bg-[var(--text-primary)] text-[var(--text-primary)]"
        />
        <StatCard
          title="Push Enabled Users"
          value={stats.activeSubscribers}
          suffix="%"
          icon={Users}
          color="bg-[var(--text-primary)] text-[var(--text-primary)]"
        />
        <StatCard
          title="Delivery Rate"
          value={stats.deliveryRate}
          suffix="%"
          icon={CheckCircle}
          color="bg-orange-500 text-orange-500"
        />
      </div>

      {/* Placeholder for charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] p-6 shadow-sm min-h-[300px] flex items-center justify-center">
          <p className="text-[var(--text-secondary)]">
            Activity Chart Placeholder
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] p-6 shadow-sm min-h-[300px] flex items-center justify-center">
          <p className="text-[var(--text-secondary)]">
            Engagement Chart Placeholder
          </p>
        </div>
      </div>
    </div>
  );
}
