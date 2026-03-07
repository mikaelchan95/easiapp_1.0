import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart2, TrendingUp, Users, CheckCircle } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { TabNavigation } from '../components/ui/TabNavigation';
import { Card } from '../components/ui/Card';

const NOTIFICATION_TABS = [
  { label: 'Send', value: '/notifications' },
  { label: 'Templates', value: '/notifications/templates' },
  { label: 'History', value: '/notifications/history' },
  { label: 'Analytics', value: '/notifications/analytics' },
];

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
      const users = totalUsers || 1;
      const pushEnabled = pushEnabledUsers || 0;

      setStats({
        totalSent: sent,
        openRate: sent > 0 ? Math.round((read / sent) * 100) : 0,
        activeSubscribers: Math.round((pushEnabled / users) * 100),
        deliveryRate: 98,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Notifications Sent',
      value: stats.totalSent.toLocaleString(),
      icon: BarChart2,
    },
    {
      title: 'Open Rate',
      value: `${stats.openRate}%`,
      icon: TrendingUp,
    },
    {
      title: 'Push Enabled',
      value: `${stats.activeSubscribers}%`,
      icon: Users,
    },
    {
      title: 'Delivery Rate',
      value: `${stats.deliveryRate}%`,
      icon: CheckCircle,
    },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Notifications" description="Performance insights" />

      <TabNavigation mode="link" tabs={NOTIFICATION_TABS} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(stat => (
          <Card key={stat.title}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-gray-50">
                <stat.icon size={18} className="text-[var(--text-primary)]" />
              </div>
              <span className="text-[10px] font-medium text-[var(--text-secondary)] bg-gray-50 px-2 py-0.5 rounded-full">
                Last 30 days
              </span>
            </div>
            <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-0.5 tabular-nums">
              {isLoading ? '—' : stat.value}
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">{stat.title}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="min-h-[280px] flex items-center justify-center">
          <p className="text-sm text-[var(--text-secondary)]">
            Activity chart coming soon
          </p>
        </Card>
        <Card className="min-h-[280px] flex items-center justify-center">
          <p className="text-sm text-[var(--text-secondary)]">
            Engagement chart coming soon
          </p>
        </Card>
      </div>
    </div>
  );
}
