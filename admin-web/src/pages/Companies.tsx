import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import type { Company } from '../types';
import { Link } from 'react-router-dom';
import {
  Building2,
  Merge,
  AlertTriangle,
  X,
  Check,
  Loader2,
  Plus,
  Edit,
  Trash2,
  ShieldOff,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { DataTable, type Column } from '../components/DataTable';
import CompanyImport from '../components/CompanyImport';

export default function Companies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<
    (string | number)[]
  >([]);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [merging, setMerging] = useState(false);
  const [masterCompanyId, setMasterCompanyId] = useState<string | null>(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCompany = async (companyId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this company? This will also delete all associated orders and data. This action cannot be undone.'
      )
    )
      return;

    try {
      // First, delete all orders associated with this company
      // This prevents constraint violations when company is deleted
      const { error: ordersError } = await supabase
        .from('orders')
        .delete()
        .eq('company_id', companyId);

      if (ordersError) {
        console.error('Error deleting company orders:', ordersError);
        // Continue anyway as orders might not exist
      }

      // Delete all users associated with this company
      // Update them to individual accounts instead of deleting
      const { error: usersError } = await supabase
        .from('users')
        .update({
          company_id: null,
          account_type: 'individual',
          role: null,
        })
        .eq('company_id', companyId);

      if (usersError) {
        console.error('Error updating company users:', usersError);
      }

      // Now delete the company
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', companyId);

      if (error) throw error;
      fetchCompanies();
    } catch (error) {
      alert('Error deleting company: ' + (error as Error).message);
    }
  };

  const handleToggleStatus = async (
    companyId: string,
    currentStatus: string
  ) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const { error } = await supabase
        .from('companies')
        .update({ status: newStatus })
        .eq('id', companyId);

      if (error) throw error;
      fetchCompanies();
    } catch (error) {
      alert('Error updating company status: ' + (error as Error).message);
    }
  };

  const filteredData = useMemo(() => {
    if (statusFilter === 'all') return companies;
    return companies.filter(company => company.status === statusFilter);
  }, [companies, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-[var(--text-primary)] text-[var(--bg-primary)]';
      case 'suspended':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'pending_verification':
        return 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] dark:bg-[var(--bg-tertiary)] dark:text-[var(--text-tertiary)]';
    }
  };

  const columns: Column<Company>[] = [
    {
      key: 'name',
      header: 'Company Name',
      sortable: true,
      render: company => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] flex-shrink-0">
            <Building2 size={20} />
          </div>
          <div className="min-w-0">
            <Link
              to={`/companies/${company.id}`}
              className="font-medium text-[var(--text-primary)] hover:underline transition-colors block truncate"
            >
              {company.name || company.company_name || 'Unnamed Company'}
            </Link>
          </div>
        </div>
      ),
    },
    {
      key: 'uen',
      header: 'UEN',
      sortable: true,
      render: company => (
        <span className="font-mono text-xs text-[var(--text-secondary)]">
          {company.uen}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: company => (
        <span
          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold capitalize ${getStatusColor(company.status)}`}
        >
          {company.status.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'credit_usage',
      header: 'Credit Usage',
      render: company => {
        const creditLimit = company.credit_limit || 0;
        const currentCredit = company.current_credit || 0;
        const usagePercentage =
          creditLimit > 0
            ? ((currentCredit / creditLimit) * 100).toFixed(1)
            : '0';
        return (
          <div className="flex flex-col text-right">
            <span className="font-medium text-[var(--text-primary)]">
              $
              {currentCredit.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <span className="text-xs text-[var(--text-tertiary)]">
              {usagePercentage}% of $
              {creditLimit.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        );
      },
    },
    {
      key: 'available_credit',
      header: 'Available Credit',
      render: company => {
        const creditLimit = company.credit_limit || 0;
        const currentCredit = company.current_credit || 0;
        const available = creditLimit - currentCredit;
        return (
          <div className="text-right">
            <div className="font-medium text-[var(--text-primary)]">
              $
              {available.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <div className="text-xs text-[var(--text-tertiary)]">
              of $
              {creditLimit.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: company => (
        <div className="flex justify-end gap-1 sm:gap-2">
          <button
            onClick={() => handleToggleStatus(company.id, company.status)}
            className={`rounded-lg p-2 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center touch-manipulation ${
              company.status === 'active'
                ? 'text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                : 'text-[var(--text-tertiary)] hover:bg-[var(--bg-tertiary)]'
            }`}
            title={
              company.status === 'active'
                ? 'Suspend company'
                : 'Activate company'
            }
          >
            {company.status === 'active' ? (
              <ShieldCheck size={18} />
            ) : (
              <ShieldOff size={18} />
            )}
          </button>
          <Link
            to={`/companies/${company.id}/edit`}
            className="rounded-lg p-2 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] min-w-[36px] min-h-[36px] flex items-center justify-center touch-manipulation"
          >
            <Edit size={18} />
          </Link>
          <button
            onClick={() => handleDeleteCompany(company.id)}
            className="rounded-lg p-2 text-[var(--text-tertiary)] transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 min-w-[36px] min-h-[36px] flex items-center justify-center touch-manipulation"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ),
    },
  ];

  const handleMergeCompanies = async () => {
    if (!masterCompanyId || selectedCompanyIds.length < 2) return;

    try {
      setMerging(true);
      const sourceCompanyIds = selectedCompanyIds.filter(
        id => id !== masterCompanyId
      );

      // 1. Move Users
      const { error: usersError } = await supabase
        .from('users')
        .update({ company_id: masterCompanyId })
        .in('company_id', sourceCompanyIds);

      if (usersError) throw usersError;

      // 2. Move Orders
      const { error: ordersError } = await supabase
        .from('orders')
        .update({ company_id: masterCompanyId })
        .in('company_id', sourceCompanyIds);

      if (ordersError) throw ordersError;

      // 3. Delete old companies
      const { error: deleteError } = await supabase
        .from('companies')
        .delete()
        .in('id', sourceCompanyIds);

      if (deleteError) throw deleteError;

      // Success
      await fetchCompanies();
      setSelectedCompanyIds([]);
      setIsMergeModalOpen(false);
      setMasterCompanyId(null);
    } catch (error) {
      console.error('Error merging companies:', error);
      alert('Failed to merge companies. Please try again.');
    } finally {
      setMerging(false);
    }
  };

  const selectedCompaniesList = useMemo(() => {
    return companies.filter(c => selectedCompanyIds.includes(c.id));
  }, [companies, selectedCompanyIds]);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
          Companies
        </h1>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {selectedCompanyIds.length > 1 && (
            <button
              onClick={() => {
                setMasterCompanyId(selectedCompanyIds[0] as string);
                setIsMergeModalOpen(true);
              }}
              className="flex items-center gap-2 rounded-lg bg-[var(--text-primary)] text-[var(--bg-primary)] px-4 py-2 text-sm font-semibold transition-all hover:opacity-90 shadow-sm min-h-[44px] touch-manipulation"
            >
              <Merge size={16} />
              <span>Merge {selectedCompanyIds.length} Companies</span>
            </button>
          )}
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] px-4 py-2 font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-tertiary)] min-h-[44px] touch-manipulation"
          >
            <Upload size={20} />
            <span className="hidden sm:inline">Import CSV</span>
            <span className="sm:hidden">Import</span>
          </button>
          <Link
            to="/companies/new"
            className="flex items-center gap-2 rounded-lg bg-[var(--text-primary)] text-[var(--bg-primary)] px-4 py-2 font-semibold transition-all hover:opacity-90 shadow-sm min-h-[44px] touch-manipulation"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Add Company</span>
            <span className="sm:hidden">Add</span>
          </Link>
        </div>
      </div>

      <DataTable
        data={filteredData}
        columns={columns}
        isLoading={loading}
        searchPlaceholder="Search companies by name or UEN..."
        selectable={true}
        selectedIds={selectedCompanyIds}
        onSelectionChange={setSelectedCompanyIds}
        filters={
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="appearance-none rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] py-3 pl-4 pr-10 focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 text-sm min-h-[44px] touch-manipulation transition-all"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending_verification">Pending Verification</option>
            <option value="suspended">Suspended</option>
          </select>
        }
      />

      {/* Merge Dialog */}
      {isMergeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">
                Merge Companies
              </h2>
              <button
                onClick={() => setIsMergeModalOpen(false)}
                className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors min-w-[36px] min-h-[36px] touch-manipulation"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-6 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-4 text-sm text-yellow-800 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <p>
                  Merging companies is irreversible. All users and orders from
                  the selected companies will be moved to the{' '}
                  <strong>Master Company</strong>. The other companies will be
                  permanently deleted.
                </p>
              </div>
            </div>

            <div className="mb-6 space-y-4">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Select Master Company (Target):
              </p>
              <div className="max-h-60 overflow-y-auto rounded-lg border border-[var(--border-primary)] divide-y divide-[var(--border-primary)]">
                {selectedCompaniesList.map(company => (
                  <div
                    key={company.id}
                    className={`flex cursor-pointer items-center justify-between p-3 transition-colors min-h-[44px] touch-manipulation ${
                      masterCompanyId === company.id
                        ? 'bg-[var(--bg-tertiary)]'
                        : 'hover:bg-[var(--bg-tertiary)]'
                    }`}
                    onClick={() => setMasterCompanyId(company.id)}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-[var(--text-primary)]">
                        {company.name}
                      </span>
                      <span className="text-xs text-[var(--text-secondary)]">
                        UEN: {company.uen}
                      </span>
                    </div>
                    {masterCompanyId === company.id && (
                      <Check
                        size={20}
                        className="text-[var(--text-primary)]"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsMergeModalOpen(false)}
                className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors min-h-[44px] touch-manipulation"
                disabled={merging}
              >
                Cancel
              </button>
              <button
                onClick={handleMergeCompanies}
                disabled={merging || !masterCompanyId}
                className="flex items-center gap-2 rounded-lg bg-[var(--text-primary)] text-[var(--bg-primary)] px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-h-[44px] touch-manipulation shadow-sm"
              >
                {merging ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Merge size={16} />
                )}
                Confirm Merge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <CompanyImport
          onClose={() => setShowImport(false)}
          onSuccess={() => {
            fetchCompanies();
            setShowImport(false);
          }}
        />
      )}
    </div>
  );
}
