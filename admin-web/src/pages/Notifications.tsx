import { useState } from 'react';
import {
  Send,
  Users,
  Building2,
  Bell,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { TabNavigation } from '../components/ui/TabNavigation';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { notificationService } from '../services/notificationService';
import type {
  NotificationType,
  NotificationPriority,
} from '../types/notification';

const NOTIFICATION_TABS = [
  { label: 'Send', value: '/notifications' },
  { label: 'Templates', value: '/notifications/templates' },
  { label: 'History', value: '/notifications/history' },
  { label: 'Analytics', value: '/notifications/analytics' },
];

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
      setFeedback({ type: 'success', message: 'Notification sent' });
      setTitle('');
      setMessage('');
    } catch (error) {
      console.error('Error sending notification:', error);
      setFeedback({
        type: 'error',
        message: 'Could not send notification. Try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const audienceOptions = [
    { id: 'all', label: 'All Users', icon: Users },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'companies', label: 'Companies', icon: Building2 },
  ] as const;

  const inputClass =
    'w-full rounded-lg border border-gray-200 bg-white text-[var(--text-primary)] px-3 py-2.5 text-sm focus:border-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]/20 transition-all';

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Notifications"
        description="Send alerts and updates to users"
      />

      <TabNavigation mode="link" tabs={NOTIFICATION_TABS} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form */}
        <Card className="lg:col-span-3">
          <form onSubmit={handleSend} className="space-y-5">
            {feedback && (
              <div
                className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
                  feedback.type === 'success'
                    ? 'bg-gray-50 text-[var(--text-primary)] border border-gray-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle size={16} />
                ) : (
                  <AlertCircle size={16} />
                )}
                {feedback.message}
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                Audience
              </label>
              <div className="grid grid-cols-3 gap-2">
                {audienceOptions.map(option => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setAudience(option.id as any)}
                    className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-all ${
                      audience === option.id
                        ? 'border-[var(--text-primary)] bg-[var(--text-primary)] text-white'
                        : 'border-gray-200 text-[var(--text-secondary)] hover:border-gray-300 hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <option.icon size={16} />
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
                  Type
                </label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value as NotificationType)}
                  className={inputClass}
                >
                  <option value="marketing">Marketing</option>
                  <option value="system">System</option>
                  <option value="order_status">Order Status</option>
                  <option value="billing">Billing</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={e =>
                    setPriority(e.target.value as NotificationPriority)
                  }
                  className={inputClass}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className={inputClass}
                placeholder="e.g. Flash Sale! 50% Off"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
                Message
              </label>
              <textarea
                rows={4}
                value={message}
                onChange={e => setMessage(e.target.value)}
                className={`${inputClass} resize-none`}
                placeholder="Enter your notification message..."
                required
              />
            </div>

            <Button
              type="submit"
              isLoading={isSubmitting}
              leftIcon={<Send size={16} />}
              className="w-full"
            >
              Send Notification
            </Button>
          </form>
        </Card>

        {/* Sidebar */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
              <Bell size={16} />
              Preview
            </h2>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-100 shrink-0">
                  <Bell size={14} className="text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-xs font-semibold text-[var(--text-primary)]">
                      EASI App
                    </p>
                    <span className="text-[10px] text-[var(--text-secondary)]">
                      now
                    </span>
                  </div>
                  <p className="text-xs font-medium text-[var(--text-primary)] truncate">
                    {title || 'Notification title'}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mt-0.5">
                    {message || 'Your message appears here...'}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
              Tips
            </h2>
            <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
              <li className="flex gap-2">
                <span className="text-[var(--text-primary)] shrink-0">
                  &bull;
                </span>
                Keep titles under 40 characters
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--text-primary)] shrink-0">
                  &bull;
                </span>
                Use emojis to boost engagement
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--text-primary)] shrink-0">
                  &bull;
                </span>
                Avoid using all caps
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
