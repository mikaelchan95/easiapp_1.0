import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import type { CustomerOnboardingRequest, OnboardingStatus } from '../types';
import { Link } from 'react-router-dom';
import {
  UserPlus,
  Loader2,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

const STATUS_BADGE_MAP: Record<
  OnboardingStatus,
  'warning' | 'success' | 'error'
> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
};

function formatCurrency(value: number | null): string {
  if (value == null) return '—';
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-SG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function Onboarding() {
  const [requests, setRequests] = useState<CustomerOnboardingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OnboardingStatus>(
    'all'
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('customer_onboarding_requests')
        .select(
          '*, salesman:staff_profiles!customer_onboarding_requests_salesman_id_fkey(id, full_name, email)'
        )
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching onboarding requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: CustomerOnboardingRequest) => {
    if (!confirm(`Approve "${request.company_name}" and create a new company?`))
      return;

    setApprovingId(request.id);
    try {
      const { error: companyError } = await supabase.from('companies').insert({
        name: request.company_name,
        uen: request.uen,
        address: request.address,
        contact_name: request.contact_name,
        contact_email: request.contact_email,
        contact_phone: request.contact_phone,
        credit_limit: request.proposed_credit_limit ?? 0,
        payment_terms: request.proposed_payment_terms ?? 'COD',
        pricing_tier: request.proposed_pricing_tier ?? 1,
        status: 'active',
      });

      if (companyError) throw companyError;

      const { error: updateError } = await supabase
        .from('customer_onboarding_requests')
        .update({ status: 'approved' })
        .eq('id', request.id);

      if (updateError) throw updateError;

      setRequests(prev =>
        prev.map(r =>
          r.id === request.id
            ? { ...r, status: 'approved' as OnboardingStatus }
            : r
        )
      );
    } catch (error) {
      alert('Error approving request: ' + (error as Error).message);
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (request: CustomerOnboardingRequest) => {
    if (
      !confirm(`Reject the onboarding request for "${request.company_name}"?`)
    )
      return;

    setRejectingId(request.id);
    try {
      const { error } = await supabase
        .from('customer_onboarding_requests')
        .update({ status: 'rejected' })
        .eq('id', request.id);

      if (error) throw error;

      setRequests(prev =>
        prev.map(r =>
          r.id === request.id
            ? { ...r, status: 'rejected' as OnboardingStatus }
            : r
        )
      );
    } catch (error) {
      alert('Error rejecting request: ' + (error as Error).message);
    } finally {
      setRejectingId(null);
    }
  };

  const counts = useMemo(() => {
    const c = { pending: 0, approved: 0, rejected: 0 };
    requests.forEach(r => c[r.status]++);
    return c;
  }, [requests]);

  const filtered = useMemo(() => {
    return requests.filter(r => {
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      if (!matchesStatus) return false;
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        r.company_name?.toLowerCase().includes(term) ||
        r.contact_name?.toLowerCase().includes(term) ||
        r.uen?.toLowerCase().includes(term)
      );
    });
  }, [requests, statusFilter, searchTerm]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2
          className="animate-spin text-[var(--text-primary)]"
          size={32}
        />
      </div>
    );
  }

  const statsCards = [
    {
      label: 'Pending',
      count: counts.pending,
      icon: Clock,
      color: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    },
    {
      label: 'Approved',
      count: counts.approved,
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
    {
      label: 'Rejected',
      count: counts.rejected,
      icon: XCircle,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/20',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
          Customer Onboarding
        </h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {statsCards.map(card => (
          <Card key={card.label} className="flex items-center gap-4">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.bg} flex-shrink-0`}
            >
              <card.icon size={24} className={card.color} />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">
                {card.label}
              </p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {card.count}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          value={statusFilter}
          onChange={e =>
            setStatusFilter(e.target.value as 'all' | OnboardingStatus)
          }
          className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-3 py-3 text-sm focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all min-h-[44px] touch-manipulation"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <div className="relative w-full sm:w-80">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
            size={20}
          />
          <input
            type="text"
            placeholder="Search by company, contact name, or UEN..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] py-3 pl-10 pr-4 focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all min-h-[44px]"
          />
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[1100px]">
            <thead className="bg-[var(--bg-tertiary)] text-xs uppercase text-[var(--text-primary)] font-bold tracking-wider">
              <tr>
                <th className="w-10 px-3 py-3 sm:py-4" />
                <th className="px-4 sm:px-6 py-3 sm:py-4">Company Name</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4">UEN</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4">Contact</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                  Credit Limit
                </th>
                <th className="px-4 sm:px-6 py-3 sm:py-4">Payment Terms</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4">Salesman</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4">Status</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4">Date</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-primary)]">
              {filtered.map(request => {
                const isExpanded = expandedId === request.id;
                return (
                  <RequestRow
                    key={request.id}
                    request={request}
                    isExpanded={isExpanded}
                    onToggleExpand={() =>
                      setExpandedId(isExpanded ? null : request.id)
                    }
                    onApprove={() => handleApprove(request)}
                    onReject={() => handleReject(request)}
                    isApproving={approvingId === request.id}
                    isRejecting={rejectingId === request.id}
                  />
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="p-12 text-center text-[var(--text-secondary)]">
            <div className="flex flex-col items-center justify-center">
              <UserPlus className="mb-4 h-12 w-12 text-[var(--text-tertiary)]" />
              <p className="text-lg font-medium text-[var(--text-primary)]">
                No onboarding requests found
              </p>
              <p className="text-sm">Try adjusting your search or filter.</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

interface RequestRowProps {
  request: CustomerOnboardingRequest;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onApprove: () => void;
  onReject: () => void;
  isApproving: boolean;
  isRejecting: boolean;
}

function RequestRow({
  request,
  isExpanded,
  onToggleExpand,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
}: RequestRowProps) {
  const salesman = request.salesman;

  return (
    <>
      <tr className="group hover:bg-[var(--bg-tertiary)] transition-colors">
        <td className="px-3 py-3 sm:py-4">
          <button
            onClick={onToggleExpand}
            className="rounded p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
          >
            {isExpanded ? (
              <ChevronDown size={18} />
            ) : (
              <ChevronRight size={18} />
            )}
          </button>
        </td>
        <td className="px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] flex-shrink-0">
              <UserPlus size={20} />
            </div>
            <span className="font-medium text-[var(--text-primary)]">
              {request.company_name}
            </span>
          </div>
        </td>
        <td className="px-4 sm:px-6 py-3 sm:py-4">
          <span className="font-mono text-xs text-[var(--text-secondary)]">
            {request.uen || '—'}
          </span>
        </td>
        <td className="px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-[var(--text-primary)] text-sm">
              {request.contact_name}
            </span>
            {request.contact_email && (
              <span className="text-xs text-[var(--text-secondary)]">
                {request.contact_email}
              </span>
            )}
            {request.contact_phone && (
              <span className="text-xs text-[var(--text-tertiary)]">
                {request.contact_phone}
              </span>
            )}
          </div>
        </td>
        <td className="px-4 sm:px-6 py-3 sm:py-4 text-right font-mono text-[var(--text-primary)]">
          {formatCurrency(request.proposed_credit_limit)}
        </td>
        <td className="px-4 sm:px-6 py-3 sm:py-4 text-[var(--text-secondary)]">
          {request.proposed_payment_terms || '—'}
        </td>
        <td className="px-4 sm:px-6 py-3 sm:py-4">
          {salesman ? (
            <Link
              to={`/salesmen/${salesman.id}`}
              className="text-[var(--text-primary)] hover:underline transition-colors text-sm font-medium"
            >
              {salesman.full_name}
            </Link>
          ) : (
            <span className="text-[var(--text-tertiary)]">—</span>
          )}
        </td>
        <td className="px-4 sm:px-6 py-3 sm:py-4">
          <Badge variant={STATUS_BADGE_MAP[request.status]}>
            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
          </Badge>
        </td>
        <td className="px-4 sm:px-6 py-3 sm:py-4 text-[var(--text-secondary)] text-sm whitespace-nowrap">
          {formatDate(request.created_at)}
        </td>
        <td className="px-4 sm:px-6 py-3 sm:py-4">
          {request.status === 'pending' ? (
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                isLoading={isApproving}
                onClick={onApprove}
                className="!bg-emerald-600 hover:!bg-emerald-700 !text-white focus:!ring-emerald-600"
              >
                Approve
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={isRejecting}
                onClick={onReject}
              >
                Reject
              </Button>
            </div>
          ) : null}
        </td>
      </tr>

      {/* Expanded detail row */}
      {isExpanded && (
        <tr className="bg-[var(--bg-tertiary)]/50">
          <td colSpan={10} className="px-6 py-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <DetailItem label="Full Address" value={request.address} />
              <DetailItem label="UEN" value={request.uen} />
              <DetailItem label="Contact Name" value={request.contact_name} />
              <DetailItem label="Contact Email" value={request.contact_email} />
              <DetailItem label="Contact Phone" value={request.contact_phone} />
              <DetailItem
                label="Proposed Credit Limit"
                value={formatCurrency(request.proposed_credit_limit)}
              />
              <DetailItem
                label="Proposed Payment Terms"
                value={request.proposed_payment_terms}
              />
              <DetailItem
                label="Proposed Pricing Tier"
                value={
                  request.proposed_pricing_tier != null
                    ? `Tier ${request.proposed_pricing_tier}`
                    : null
                }
              />
              <DetailItem
                label="Submitted"
                value={formatDate(request.created_at)}
              />
              {request.notes && (
                <div className="sm:col-span-2 lg:col-span-3">
                  <DetailItem label="Notes" value={request.notes} />
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1">
        {label}
      </p>
      <p className="text-sm text-[var(--text-primary)]">{value || '—'}</p>
    </div>
  );
}
