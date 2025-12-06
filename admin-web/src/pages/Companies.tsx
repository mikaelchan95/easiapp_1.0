import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import type { Company } from '../types';
import { Link } from 'react-router-dom';
import { Building2, Merge, AlertTriangle, X, Check, Loader2 } from 'lucide-react';
import { DataTable, type Column } from '../components/DataTable';

export default function Companies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<(string | number)[]>([]);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
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

  const filteredData = useMemo(() => {
     if (statusFilter === 'all') return companies;
     return companies.filter(company => company.status === statusFilter);
  }, [companies, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'suspended': return 'bg-red-100 text-red-700';
      case 'pending_verification': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const columns: Column<Company>[] = [
    {
        key: 'name',
        header: 'Company Name',
        sortable: true,
        render: (company) => (
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-light text-brand-dark">
                <Building2 size={20} />
                </div>
                <div>
                <Link to={`/companies/${company.id}`} className="font-medium text-brand-dark hover:text-brand-accent">
                    {company.name || company.company_name || 'Unnamed Company'}
                </Link>
                </div>
            </div>
        )
    },
    {
        key: 'uen',
        header: 'UEN',
        sortable: true,
        render: (company) => <span className="font-mono text-xs text-gray-600">{company.uen}</span>
    },
    {
        key: 'status',
        header: 'Status',
        sortable: true,
        render: (company) => (
            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold capitalize ${getStatusColor(company.status)}`}>
                {company.status.replace('_', ' ')}
            </span>
        )
    },
    {
        key: 'credit_usage',
        header: 'Credit Usage',
        render: (company) => {
            const usagePercentage = company.credit_limit > 0 
                ? ((company.current_credit / company.credit_limit) * 100).toFixed(1) 
                : '0';
            return (
                <div className="flex flex-col text-right">
                    <span className="font-medium text-brand-dark">${company.current_credit.toLocaleString()}</span>
                    <span className="text-xs text-gray-400">{usagePercentage}% of limit</span>
                </div>
            )
        }
    },
    {
        key: 'available_credit',
        header: 'Available Credit',
        render: (company) => (
            <div className="text-right font-medium text-brand-dark">
                ${(company.credit_limit - company.current_credit).toLocaleString()}
            </div>
        )
    }
  ];

  const handleMergeCompanies = async () => {
    if (!masterCompanyId || selectedCompanyIds.length < 2) return;
    
    try {
        setMerging(true);
        const sourceCompanyIds = selectedCompanyIds.filter(id => id !== masterCompanyId);

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
        <Loader2 className="animate-spin text-brand-accent" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-dark">Companies</h1>
        {selectedCompanyIds.length > 1 && (
            <button
                onClick={() => {
                    setMasterCompanyId(selectedCompanyIds[0] as string);
                    setIsMergeModalOpen(true);
                }}
                className="flex items-center gap-2 rounded-lg bg-brand-dark px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark/90 transition-colors"
            >
                <Merge size={16} />
                Merge {selectedCompanyIds.length} Companies
            </button>
        )}
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
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none rounded-lg border border-gray-300 bg-brand-white py-2 pl-4 pr-10 hover:bg-white focus:border-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark text-sm"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-brand-dark">Merge Companies</h2>
                    <button onClick={() => setIsMergeModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="mb-6 rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800">
                    <div className="flex items-start gap-2">
                        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                        <p>
                            Merging companies is irreversible. All users and orders from the selected companies will be moved to the <strong>Master Company</strong>. The other companies will be permanently deleted.
                        </p>
                    </div>
                </div>

                <div className="mb-6 space-y-4">
                    <p className="text-sm font-medium text-gray-700">Select Master Company (Target):</p>
                    <div className="max-h-60 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-200">
                        {selectedCompaniesList.map(company => (
                            <div 
                                key={company.id}
                                className={`flex cursor-pointer items-center justify-between p-3 transition-colors ${
                                    masterCompanyId === company.id ? 'bg-brand-light/50' : 'hover:bg-gray-50'
                                }`}
                                onClick={() => setMasterCompanyId(company.id)}
                            >
                                <div className="flex flex-col">
                                    <span className="font-medium text-brand-dark">{company.name}</span>
                                    <span className="text-xs text-gray-500">UEN: {company.uen}</span>
                                </div>
                                {masterCompanyId === company.id && (
                                    <Check size={20} className="text-brand-accent" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={() => setIsMergeModalOpen(false)}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        disabled={merging}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleMergeCompanies}
                        disabled={merging || !masterCompanyId}
                        className="flex items-center gap-2 rounded-lg bg-brand-dark px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark/90 disabled:opacity-50"
                    >
                        {merging ? <Loader2 className="animate-spin" size={16} /> : <Merge size={16} />}
                        Confirm Merge
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
