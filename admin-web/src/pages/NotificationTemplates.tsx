import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { TabNavigation } from '../components/ui/TabNavigation';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { notificationService } from '../services/notificationService';
import type {
  NotificationTemplate,
  NotificationType,
  NotificationPriority,
} from '../types/notification';

const NOTIFICATION_TABS = [
  { label: 'Send', value: '/notifications' },
  { label: 'Templates', value: '/notifications/templates' },
  { label: 'History', value: '/notifications/history' },
  { label: 'Analytics', value: '/notifications/analytics' },
];

export default function NotificationTemplates() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<
    Partial<NotificationTemplate>
  >({});

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const data = await notificationService.getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentTemplate.id) {
        await notificationService.updateTemplate(
          currentTemplate.id,
          currentTemplate
        );
      } else {
        await notificationService.createTemplate(currentTemplate as any);
      }
      setIsEditing(false);
      setCurrentTemplate({});
      loadTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    try {
      await notificationService.deleteTemplate(id);
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-gray-200 bg-white text-[var(--text-primary)] px-3 py-2.5 text-sm focus:border-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]/20 transition-all';

  if (isEditing) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader title="Notifications" />
        <TabNavigation mode="link" tabs={NOTIFICATION_TABS} />

        <div className="max-w-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              {currentTemplate.id ? 'Edit Template' : 'Add Template'}
            </h2>
            <button
              onClick={() => setIsEditing(false)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={18} className="text-[var(--text-secondary)]" />
            </button>
          </div>

          <Card>
            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
                  Template Name
                </label>
                <input
                  type="text"
                  value={currentTemplate.name || ''}
                  onChange={e =>
                    setCurrentTemplate({
                      ...currentTemplate,
                      name: e.target.value,
                    })
                  }
                  className={inputClass}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
                    Type
                  </label>
                  <select
                    value={currentTemplate.type || 'marketing'}
                    onChange={e =>
                      setCurrentTemplate({
                        ...currentTemplate,
                        type: e.target.value as NotificationType,
                      })
                    }
                    className={inputClass}
                  >
                    <option value="marketing">Marketing</option>
                    <option value="system">System</option>
                    <option value="order_status">Order Status</option>
                    <option value="payment">Payment</option>
                    <option value="billing">Billing</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
                    Priority
                  </label>
                  <select
                    value={currentTemplate.priority || 'low'}
                    onChange={e =>
                      setCurrentTemplate({
                        ...currentTemplate,
                        priority: e.target.value as NotificationPriority,
                      })
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
                  Title Template
                </label>
                <input
                  type="text"
                  value={currentTemplate.title_template || ''}
                  onChange={e =>
                    setCurrentTemplate({
                      ...currentTemplate,
                      title_template: e.target.value,
                    })
                  }
                  className={inputClass}
                  placeholder="e.g. Order {{order_number}} Confirmed"
                  required
                />
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  Use {'{{variable}}'} for dynamic content
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
                  Message Template
                </label>
                <textarea
                  rows={4}
                  value={currentTemplate.message_template || ''}
                  onChange={e =>
                    setCurrentTemplate({
                      ...currentTemplate,
                      message_template: e.target.value,
                    })
                  }
                  className={`${inputClass} resize-none`}
                  placeholder="e.g. Your order {{order_number}} has been confirmed."
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" leftIcon={<Check size={16} />}>
                  Save Template
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Notifications"
        description="Reusable notification templates"
      />

      <TabNavigation mode="link" tabs={NOTIFICATION_TABS} />

      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">
          Templates
        </h2>
        <Button
          size="sm"
          onClick={() => {
            setCurrentTemplate({
              type: 'marketing',
              priority: 'low',
              is_active: true,
              metadata: {},
            });
            setIsEditing(true);
          }}
          leftIcon={<Plus size={16} />}
        >
          Add Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading
          ? [...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-44 rounded-2xl bg-gray-50 border border-gray-100 animate-pulse"
              />
            ))
          : templates.map(template => (
              <Card key={template.id} hover className="group">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate mb-1">
                      {template.name}
                    </h3>
                    <Badge variant="mono-outline" className="!min-w-0">
                      {template.type}
                    </Badge>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                    <button
                      onClick={() => {
                        setCurrentTemplate(template);
                        setIsEditing(true);
                      }}
                      className="p-1.5 hover:bg-gray-100 rounded-lg text-[var(--text-secondary)] transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded-lg text-[var(--text-secondary)] transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <p className="text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-0.5">
                      Title
                    </p>
                    <p className="text-sm text-[var(--text-primary)] truncate">
                      {template.title_template}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-0.5">
                      Message
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
                      {template.message_template}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
      </div>
    </div>
  );
}
