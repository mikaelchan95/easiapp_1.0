import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { toast } from '../components/ui/Toast';
import type { StaffProfile } from '../types';

interface FormData {
  company_name: string;
  uen: string;
  address: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  proposed_credit_limit: string;
  proposed_payment_terms: string;
  proposed_pricing_tier: string;
  notes: string;
}

const initialForm: FormData = {
  company_name: '',
  uen: '',
  address: '',
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  proposed_credit_limit: '',
  proposed_payment_terms: 'COD',
  proposed_pricing_tier: '1',
  notes: '',
};

export function NewCustomer() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {}
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function updateField(field: keyof FormData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!form.company_name.trim())
      newErrors.company_name = 'Company name is required';
    if (!form.contact_name.trim())
      newErrors.contact_name = 'Contact name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: staffData } = await supabase
        .from('staff_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      if (!staffData) throw new Error('Staff profile not found');

      const staffProfile = staffData as Pick<StaffProfile, 'id'>;

      const { error } = await supabase
        .from('customer_onboarding_requests')
        .insert({
          salesman_id: staffProfile.id,
          company_name: form.company_name.trim(),
          uen: form.uen.trim() || null,
          address: form.address.trim() || null,
          contact_name: form.contact_name.trim(),
          contact_email: form.contact_email.trim() || null,
          contact_phone: form.contact_phone.trim() || null,
          proposed_credit_limit: form.proposed_credit_limit
            ? Number(form.proposed_credit_limit)
            : null,
          proposed_payment_terms: form.proposed_payment_terms,
          proposed_pricing_tier: Number(form.proposed_pricing_tier),
          notes: form.notes.trim() || null,
          status: 'pending',
        });

      if (error) throw error;

      setSubmitted(true);
      toast('success', 'Customer onboarding request submitted');
    } catch (err) {
      console.error('Onboarding error:', err);
      toast('error', 'Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="mb-4 rounded-full bg-green-50 p-4">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Request Submitted!</h2>
        <p className="mt-2 max-w-sm text-gray-500">
          Your customer onboarding request has been sent for admin review.
          You'll be notified once it's approved.
        </p>
        <div className="mt-6 flex gap-3">
          <Button variant="outline" onClick={() => navigate('/')}>
            Dashboard
          </Button>
          <Button
            onClick={() => {
              setSubmitted(false);
              setForm(initialForm);
            }}
          >
            Submit Another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">New Customer</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Info */}
        <Card>
          <h2 className="mb-4 text-base font-semibold text-gray-900">
            Company Information
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.company_name}
                onChange={e => updateField('company_name', e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10 ${
                  errors.company_name ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="e.g. Wine & Dine Pte Ltd"
              />
              {errors.company_name && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.company_name}
                </p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                UEN
              </label>
              <input
                type="text"
                value={form.uen}
                onChange={e => updateField('uen', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10"
                placeholder="e.g. 202012345A"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Address
              </label>
              <input
                type="text"
                value={form.address}
                onChange={e => updateField('address', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10"
                placeholder="Business address"
              />
            </div>
          </div>
        </Card>

        {/* Contact */}
        <Card>
          <h2 className="mb-4 text-base font-semibold text-gray-900">
            Contact Person
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Contact Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.contact_name}
                onChange={e => updateField('contact_name', e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10 ${
                  errors.contact_name ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="Full name"
              />
              {errors.contact_name && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.contact_name}
                </p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={form.contact_email}
                onChange={e => updateField('contact_email', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10"
                placeholder="email@company.com"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Phone
              </label>
              <input
                type="tel"
                value={form.contact_phone}
                onChange={e => updateField('contact_phone', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10"
                placeholder="+65 XXXX XXXX"
              />
            </div>
          </div>
        </Card>

        {/* Credit Proposal */}
        <Card>
          <h2 className="mb-4 text-base font-semibold text-gray-900">
            Credit Proposal
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Credit Limit ($)
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={form.proposed_credit_limit}
                onChange={e =>
                  updateField('proposed_credit_limit', e.target.value)
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10"
                placeholder="0"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Payment Terms
              </label>
              <select
                value={form.proposed_payment_terms}
                onChange={e =>
                  updateField('proposed_payment_terms', e.target.value)
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-black/10"
              >
                <option value="CBD">CBD</option>
                <option value="COD">COD</option>
                <option value="NET7">NET 7</option>
                <option value="NET14">NET 14</option>
                <option value="NET30">NET 30</option>
                <option value="NET45">NET 45</option>
                <option value="NET60">NET 60</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Pricing Tier
              </label>
              <select
                value={form.proposed_pricing_tier}
                onChange={e =>
                  updateField('proposed_pricing_tier', e.target.value)
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-black/10"
              >
                <option value="1">Tier 1</option>
                <option value="2">Tier 2</option>
                <option value="3">Tier 3</option>
                <option value="4">Tier 4</option>
                <option value="5">Tier 5</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Notes */}
        <Card>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Additional Notes
          </label>
          <textarea
            value={form.notes}
            onChange={e => updateField('notes', e.target.value)}
            rows={4}
            placeholder="Any additional information about this customer…"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10"
          />
        </Card>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-1" loading={submitting}>
            Submit Request
          </Button>
        </div>
      </form>
    </div>
  );
}
