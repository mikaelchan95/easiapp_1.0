import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import { notificationService } from '../services/notificationService';
import type {
  NotificationTemplate,
  NotificationType,
  NotificationPriority,
} from '../types/notification';

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
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      await notificationService.deleteTemplate(id);
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  if (isEditing) {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            {currentTemplate.id ? 'Edit Template' : 'New Template'}
          </h1>
          <button
            onClick={() => setIsEditing(false)}
            className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
          >
            <X size={24} className="text-[var(--text-secondary)]" />
          </button>
        </div>

        <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-sm p-6">
          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
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
                className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 py-3"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
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
                  className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 py-3"
                >
                  <option value="marketing">Marketing</option>
                  <option value="system">System</option>
                  <option value="order_status">Order Status</option>
                  <option value="payment">Payment</option>
                  <option value="billing">Billing</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
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
                  className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 py-3"
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
                className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 py-3"
                placeholder="e.g. Order {{order_number}} Confirmed"
                required
              />
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Use {'{{variable}}'} for dynamic content.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
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
                className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 py-3 resize-none"
                placeholder="e.g. Your order {{order_number}} has been confirmed."
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--color-primary-text)] bg-[var(--text-primary)] rounded-lg hover:opacity-90 transition-opacity"
              >
                <Check size={18} />
                Save Template
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Notification Templates
          </h1>
          <p className="mt-2 text-[var(--text-secondary)]">
            Manage reusable templates for system notifications.
          </p>
        </div>
        <button
          onClick={() => {
            setCurrentTemplate({
              type: 'marketing',
              priority: 'low',
              is_active: true,
              metadata: {},
            });
            setIsEditing(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-lg hover:opacity-90 transition-opacity font-medium"
        >
          <Plus size={20} />
          New Template
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading
          ? [...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-48 rounded-xl bg-[var(--bg-tertiary)] animate-pulse"
              />
            ))
          : templates.map(template => (
              <div
                key={template.id}
                className="group rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-[var(--text-primary)] mb-1">
                      {template.name}
                    </h3>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        template.is_active
                          ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]'
                          : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] dark:bg-[var(--bg-tertiary)] dark:text-[var(--text-tertiary)]'
                      }`}
                    >
                      {template.type}
                    </span>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setCurrentTemplate(template);
                        setIsEditing(true);
                      }}
                      className="p-1.5 hover:bg-[var(--bg-tertiary)] rounded-lg text-[var(--text-secondary)] transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded-lg text-[var(--text-secondary)] transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-[var(--text-secondary)] uppercase mb-1">
                      Title
                    </p>
                    <p className="text-sm text-[var(--text-primary)] line-clamp-1">
                      {template.title_template}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--text-secondary)] uppercase mb-1">
                      Message
                    </p>
                    <p className="text-sm text-[var(--text-secondary)] line-clamp-2">
                      {template.message_template}
                    </p>
                  </div>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}
