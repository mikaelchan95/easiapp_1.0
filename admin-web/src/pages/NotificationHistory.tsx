import { useState, useEffect } from 'react';
import { Search, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { TabNavigation } from '../components/ui/TabNavigation';
import { Badge } from '../components/ui/Badge';
import { notificationService } from '../services/notificationService';
import type { NotificationData } from '../types/notification';

const NOTIFICATION_TABS = [
  { label: 'Send', value: '/notifications' },
  { label: 'Templates', value: '/notifications/templates' },
  { label: 'History', value: '/notifications/history' },
  { label: 'Analytics', value: '/notifications/analytics' },
];

export default function NotificationHistory() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    status: 'all',
  });

  useEffect(() => {
    loadNotifications();
  }, [filters]);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const { data } = await notificationService.getNotifications(1, 50, {
        search: filters.search,
        type: filters.type === 'all' ? undefined : filters.type,
        status: filters.status === 'all' ? undefined : filters.status,
      });
      setNotifications(data);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'read':
        return <CheckCircle size={14} className="text-[var(--text-primary)]" />;
      case 'dismissed':
        return <XCircle size={14} className="text-[var(--text-secondary)]" />;
      default:
        return (
          <AlertCircle size={14} className="text-[var(--text-secondary)]" />
        );
    }
  };

  const inputClass =
    'rounded-lg border border-gray-200 bg-white text-[var(--text-primary)] text-sm focus:border-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]/20 transition-all';

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Notifications"
        description="Sent notification history"
      />

      <TabNavigation mode="link" tabs={NOTIFICATION_TABS} />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Search by title..."
            value={filters.search}
            onChange={e =>
              setFilters(prev => ({ ...prev, search: e.target.value }))
            }
            className={`${inputClass} w-full pl-9 pr-3 py-2`}
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filters.type}
            onChange={e =>
              setFilters(prev => ({ ...prev, type: e.target.value }))
            }
            className={`${inputClass} px-3 py-2`}
          >
            <option value="all">All Types</option>
            <option value="marketing">Marketing</option>
            <option value="system">System</option>
            <option value="order_status">Order Status</option>
          </select>
          <select
            value={filters.status}
            onChange={e =>
              setFilters(prev => ({ ...prev, status: e.target.value }))
            }
            className={`${inputClass} px-3 py-2`}
          >
            <option value="all">All Status</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                  Status
                </th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                  Type
                </th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                  Title
                </th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                  User
                </th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                  Sent
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-5 py-3.5">
                      <div className="h-4 w-full bg-gray-50 rounded" />
                    </td>
                  </tr>
                ))
              ) : notifications.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-12 text-center text-sm text-[var(--text-secondary)]"
                  >
                    No notifications yet
                  </td>
                </tr>
              ) : (
                notifications.map(notification => (
                  <tr
                    key={notification.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 text-sm">
                        {getStatusIcon(notification.status)}
                        <span className="capitalize text-[var(--text-primary)]">
                          {notification.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant="mono-outline"
                        className="!min-w-0 capitalize"
                      >
                        {notification.type.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-medium text-[var(--text-primary)]">
                      {notification.title}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-[var(--text-secondary)]">
                      {notification.user?.email || 'Unknown'}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-[var(--text-secondary)]">
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(notification.created_at).toLocaleString()}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
