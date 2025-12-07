import { useState } from 'react';
import {
  Send,
  Users,
  Building2,
  Bell,
  AlertCircle,
  CheckCircle,
  FileText,
  BarChart2,
  Clock,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { notificationService } from '../services/notificationService';
import type {
  NotificationType,
  NotificationPriority,
} from '../types/notification';

export default function Notifications() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState<'all' | 'customers' | 'companies'>(
    'all'
  );
  const [type, setType] = useState<NotificationType>('marketing');
  const [priority, setPriority] = useState<NotificationPriority>('low');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      await notificationService.sendNotification({
        audience,
        type,
        priority,
        title,
        message,
      });

      setFeedback({
        type: 'success',
        message: 'Notification sent successfully!',
      });
      setTitle('');
      setMessage('');
    } catch (error) {
      console.error('Error sending notification:', error);
      setFeedback({
        type: 'error',
        message: 'Failed to send notification. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
            Push Notifications
          </h1>
          <p className="mt-2 text-[var(--text-secondary)] text-sm sm:text-base">
            Send alerts and updates to your users.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/notifications/templates"
            className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors text-sm font-medium"
          >
            <FileText size={18} />
            Templates
          </Link>
          <Link
            to="/notifications/history"
            className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors text-sm font-medium"
          >
            <Clock size={18} />
            History
          </Link>
          <Link
            to="/notifications/analytics"
            className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors text-sm font-medium"
          >
            <BarChart2 size={18} />
            Analytics
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-sm p-4 sm:p-6">
            <form onSubmit={handleSend} className="space-y-6">
              {feedback && (
                <div
                  className={`p-4 rounded-lg flex items-center gap-3 ${
                    feedback.type === 'success'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {feedback.type === 'success' ? (
                    <CheckCircle size={20} />
                  ) : (
                    <AlertCircle size={20} />
                  )}
                  <span className="text-sm font-medium">
                    {feedback.message}
                  </span>
                </div>
              )}

              <div>
                <label className="mb-3 block text-sm font-medium text-[var(--text-primary)]">
                  Target Audience
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  {[
                    { id: 'all', label: 'All Users', icon: Users },
                    { id: 'customers', label: 'Customers', icon: Users },
                    { id: 'companies', label: 'Companies', icon: Building2 },
                  ].map(option => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setAudience(option.id as any)}
                      className={`flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-all min-h-[80px] touch-manipulation ${
                        audience === option.id
                          ? 'border-[var(--text-primary)] bg-[var(--text-primary)]/5 text-[var(--text-primary)] shadow-sm'
                          : 'border-[var(--border-primary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
                      }`}
                    >
                      <option.icon size={24} />
                      <span className="text-sm font-medium">
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                    Type
                  </label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as NotificationType)}
                    className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 py-3 focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all"
                  >
                    <option value="marketing">Marketing</option>
                    <option value="system">System</option>
                    <option value="order_status">Order Status</option>
                    <option value="billing">Billing</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={e =>
                      setPriority(e.target.value as NotificationPriority)
                    }
                    className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 py-3 focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 py-3 focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all min-h-[44px]"
                  placeholder="e.g. Flash Sale! 50% Off"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                  Message
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 py-3 focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all resize-none"
                  placeholder="Enter your notification message..."
                  required
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--text-primary)] text-[var(--bg-primary)] px-4 py-3 font-semibold transition-all hover:opacity-90 shadow-sm min-h-[48px] touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="w-5 h-5 border-2 border-[var(--bg-primary)] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send size={20} />
                      Send Notification
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-sm p-4 sm:p-6">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Bell size={20} />
              Preview
            </h2>
            <div className="bg-gray-100 dark:bg-zinc-900 rounded-lg p-4 border border-gray-200 dark:border-zinc-800">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm">
                  <img
                    src="/logo.png"
                    alt="App Logo"
                    className="w-6 h-6 object-contain"
                    onError={e => (e.currentTarget.style.display = 'none')}
                  />
                  <Bell size={16} className="text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      EASI App
                    </p>
                    <span className="text-xs text-gray-500">now</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1 truncate">
                    {title || 'Notification Title'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                    {message || 'Your notification message will appear here...'}
                  </p>
                </div>
              </div>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-4 text-center">
              This is a preview of how the notification might look on a device.
            </p>
          </div>

          <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-sm p-4 sm:p-6">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">
              Quick Tips
            </h2>
            <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
              <li className="flex gap-2">
                <span className="text-[var(--text-primary)]">•</span>
                Keep titles short and punchy (under 40 chars).
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--text-primary)]">•</span>
                Use emojis to increase engagement 🚀.
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--text-primary)]">•</span>
                Avoid using all caps.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
