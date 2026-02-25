import { useState, useEffect } from 'react';
import { Search, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { notificationService } from '../services/notificationService';
import type { NotificationData } from '../types/notification';

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
        return <CheckCircle size={16} className="text-[var(--text-primary)]" />;
      case 'dismissed':
        return <XCircle size={16} className="text-[var(--text-tertiary)]" />;
      default:
        return <AlertCircle size={16} className="text-[var(--text-primary)]" />;
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Notification History
          </h1>
          <p className="mt-2 text-[var(--text-secondary)]">
            View and track sent notifications.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
            size={20}
          />
          <input
            type="text"
            placeholder="Search by title..."
            value={filters.search}
            onChange={e =>
              setFilters(prev => ({ ...prev, search: e.target.value }))
            }
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filters.type}
            onChange={e =>
              setFilters(prev => ({ ...prev, type: e.target.value }))
            }
            className="px-4 py-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20"
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
            className="px-4 py-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20"
          >
            <option value="all">All Status</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
              <tr>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium">Title</th>
                <th className="px-6 py-3 font-medium">User</th>
                <th className="px-6 py-3 font-medium">Sent At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-primary)]">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-4">
                      <div className="h-4 w-full bg-[var(--bg-tertiary)] rounded" />
                    </td>
                  </tr>
                ))
              ) : notifications.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-[var(--text-secondary)]"
                  >
                    No notifications found.
                  </td>
                </tr>
              ) : (
                notifications.map(notification => (
                  <tr
                    key={notification.id}
                    className="hover:bg-[var(--bg-tertiary)]/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(notification.status)}
                        <span className="capitalize">
                          {notification.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[var(--bg-tertiary)] text-[var(--text-secondary)] capitalize">
                        {notification.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-[var(--text-primary)]">
                      {notification.title}
                    </td>
                    <td className="px-6 py-4 text-[var(--text-secondary)]">
                      {notification.user?.email || 'Unknown User'}
                    </td>
                    <td className="px-6 py-4 text-[var(--text-secondary)]">
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
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
