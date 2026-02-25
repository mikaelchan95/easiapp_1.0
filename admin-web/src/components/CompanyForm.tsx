import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Company } from '../types';
import { ArrowLeft, Save, Building2 } from 'lucide-react';

const INITIAL_COMPANY: Partial<Company> = {
  name: '',
  company_name: '',
  uen: '',
  address: '',
  phone: '',
  email: '',
  logo: '',
  credit_limit: 0,
  current_credit: 0,
  payment_terms: 'COD',
  require_approval: false,
  approval_threshold: 0,
  multi_level_approval: false,
  auto_approve_below: 0,
  status: 'active',
};

export default function CompanyForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [formData, setFormData] = useState<Partial<Company>>(INITIAL_COMPANY);

  useEffect(() => {
    if (isEditMode) {
      fetchCompany(id);
    } else {
      setFetched(true);
    }
  }, [id]);

  const fetchCompany = async (companyId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (error) {
      alert('Error fetching company');
      navigate('/companies');
    } else if (data) {
      setFormData(data);
    }
    setLoading(false);
    setFetched(true);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
      return;
    }

    if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        updated_at: new Date().toISOString(),
      };

      let error;
      if (isEditMode) {
        const { error: updateError } = await supabase
          .from('companies')
          .update(payload)
          .eq('id', id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('companies')
          .insert([payload]);
        error = insertError;
      }

      if (error) throw error;

      navigate('/companies');
    } catch (error) {
      alert('Error saving company: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!fetched && isEditMode)
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--text-primary)]"></div>
      </div>
    );

  return (
    <div className="mx-auto max-w-5xl animate-fade-in">
      <div className="mb-6 flex items-center gap-3 sm:gap-4">
        <button
          onClick={() => navigate('/companies')}
          className="rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)] p-2 text-[var(--text-secondary)] shadow-sm transition-colors hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] min-w-[40px] min-h-[40px] touch-manipulation"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)]">
            <Building2 size={20} />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
            {isEditMode ? 'Edit Company' : 'New Company'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Basic Information */}
        <div className="rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] p-4 sm:p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-[var(--text-primary)]">
            Basic Information
          </h2>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                Company Name{' '}
                <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 py-3 focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all min-h-[44px]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                Display Name{' '}
                <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 py-3 focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all min-h-[44px]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                UEN <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <input
                type="text"
                name="uen"
                value={formData.uen}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 py-3 font-mono focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all min-h-[44px]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                Status <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 py-3 focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all min-h-[44px] touch-manipulation"
              >
                <option value="active">Active</option>
                <option value="pending_verification">
                  Pending Verification
                </option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                Address{' '}
                <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <textarea
                name="address"
                rows={3}
                value={formData.address}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 py-3 focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all resize-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone || ''}
                onChange={handleChange}
                className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 py-3 focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all min-h-[44px]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email || ''}
                onChange={handleChange}
                className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 py-3 focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all min-h-[44px]"
              />
            </div>
          </div>
        </div>

        {/* Credit & Payment Settings */}
        <div className="rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] p-4 sm:p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-[var(--text-primary)]">
            Credit & Payment Settings
          </h2>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                Credit Limit
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">
                  S$
                </span>
                <input
                  type="number"
                  name="credit_limit"
                  step="0.01"
                  min="0"
                  value={formData.credit_limit}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] py-3 pl-10 pr-4 focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all min-h-[44px]"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                Current Credit Used
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">
                  S$
                </span>
                <input
                  type="number"
                  name="current_credit"
                  step="0.01"
                  min="0"
                  value={formData.current_credit}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] py-3 pl-10 pr-4 focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all min-h-[44px]"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                Payment Terms
              </label>
              <select
                name="payment_terms"
                value={formData.payment_terms}
                onChange={handleChange}
                className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 py-3 focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all min-h-[44px] touch-manipulation"
              >
                <option value="COD">Cash on Delivery (COD)</option>
                <option value="NET7">Net 7 Days</option>
                <option value="NET15">Net 15 Days</option>
                <option value="NET30">Net 30 Days</option>
                <option value="NET60">Net 60 Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Approval Settings */}
        <div className="rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] p-4 sm:p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-[var(--text-primary)]">
            Approval Settings
          </h2>

          <div className="space-y-5">
            <label className="flex items-start gap-3 cursor-pointer min-h-[44px] touch-manipulation">
              <input
                type="checkbox"
                name="require_approval"
                checked={!!formData.require_approval}
                onChange={handleChange}
                className="mt-1 h-5 w-5 flex-shrink-0 rounded border-[var(--border-primary)] text-[var(--text-primary)] focus:ring-[var(--text-primary)] touch-manipulation"
              />
              <div>
                <span className="font-medium text-[var(--text-primary)]">
                  Require Approval for Orders
                </span>
                <p className="text-sm text-[var(--text-tertiary)]">
                  Enable order approval workflow for this company
                </p>
              </div>
            </label>

            {formData.require_approval && (
              <>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 pl-8">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                      Approval Threshold
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">
                        S$
                      </span>
                      <input
                        type="number"
                        name="approval_threshold"
                        step="0.01"
                        min="0"
                        value={formData.approval_threshold || ''}
                        onChange={handleChange}
                        placeholder="Orders above this amount"
                        className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] py-3 pl-10 pr-4 focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all min-h-[44px]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                      Auto-Approve Below
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">
                        S$
                      </span>
                      <input
                        type="number"
                        name="auto_approve_below"
                        step="0.01"
                        min="0"
                        value={formData.auto_approve_below || ''}
                        onChange={handleChange}
                        placeholder="Auto-approve below this"
                        className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] py-3 pl-10 pr-4 focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all min-h-[44px]"
                      />
                    </div>
                  </div>
                </div>

                <label className="flex items-start gap-3 cursor-pointer min-h-[44px] pl-8 touch-manipulation">
                  <input
                    type="checkbox"
                    name="multi_level_approval"
                    checked={!!formData.multi_level_approval}
                    onChange={handleChange}
                    className="mt-1 h-5 w-5 flex-shrink-0 rounded border-[var(--border-primary)] text-[var(--text-primary)] focus:ring-[var(--text-primary)] touch-manipulation"
                  />
                  <div>
                    <span className="font-medium text-[var(--text-primary)]">
                      Multi-Level Approval
                    </span>
                    <p className="text-sm text-[var(--text-tertiary)]">
                      Require multiple approvers for large orders
                    </p>
                  </div>
                </label>
              </>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/companies')}
            className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] px-6 py-3 font-medium text-[var(--text-primary)] transition-all hover:bg-[var(--bg-tertiary)] min-h-[48px] touch-manipulation"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-lg bg-[var(--text-primary)] text-[var(--bg-primary)] px-6 py-3 font-semibold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm min-h-[48px] touch-manipulation"
          >
            <Save size={20} />
            {loading ? 'Saving...' : 'Save Company'}
          </button>
        </div>
      </form>
    </div>
  );
}
