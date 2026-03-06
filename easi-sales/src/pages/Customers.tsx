import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Building2, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/Badge';
import type { Company } from '../types';

interface CompanyWithLastOrder extends Company {
  last_order_date?: string;
}

export function Customers() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<CompanyWithLastOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTerms, setFilterTerms] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadCompanies();
  }, []);

  async function loadCompanies() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error loading companies:', error);
        return;
      }

      const companiesData = (data ?? []) as CompanyWithLastOrder[];

      // Fetch last order dates
      const companyIds = companiesData.map(c => c.id);
      if (companyIds.length > 0) {
        const { data: orderData } = await supabase
          .from('orders')
          .select('company_id, created_at')
          .in('company_id', companyIds)
          .order('created_at', { ascending: false });

        if (orderData) {
          const lastOrderMap = new Map<string, string>();
          for (const o of orderData) {
            if (!lastOrderMap.has(o.company_id)) {
              lastOrderMap.set(o.company_id, o.created_at);
            }
          }
          for (const c of companiesData) {
            c.last_order_date = lastOrderMap.get(c.id);
          }
        }
      }

      setCompanies(companiesData);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    let result = companies;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        c =>
          c.name.toLowerCase().includes(q) ||
          c.uen?.toLowerCase().includes(q) ||
          c.contact_name?.toLowerCase().includes(q)
      );
    }

    if (filterTerms !== 'all') {
      result = result.filter(c => c.payment_terms === filterTerms);
    }

    if (filterStatus !== 'all') {
      result = result.filter(c => c.status === filterStatus);
    }

    return result;
  }, [companies, search, filterTerms, filterStatus]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <Button
          onClick={() => navigate('/customers/new')}
          icon={<Plus className="h-4 w-4" />}
        >
          Add Customer
        </Button>
      </div>

      {/* Search and filters */}
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by company name, UEN, or contact…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            icon={<Filter className="h-4 w-4" />}
          >
            Filters
          </Button>
        </div>

        {showFilters && (
          <div className="mt-3 flex flex-wrap gap-3 border-t border-gray-100 pt-3">
            <select
              value={filterTerms}
              onChange={e => setFilterTerms(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-black/10"
            >
              <option value="all">All Payment Terms</option>
              <option value="CBD">CBD</option>
              <option value="COD">COD</option>
              <option value="NET7">NET7</option>
              <option value="NET14">NET14</option>
              <option value="NET30">NET30</option>
              <option value="NET45">NET45</option>
              <option value="NET60">NET60</option>
            </select>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-black/10"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="on_hold">On Hold</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        )}
      </Card>

      {/* Customer list */}
      {loading ? (
        <Card>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-lg bg-gray-100"
              />
            ))}
          </div>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="py-16 text-center">
          <Building2 className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="text-sm text-gray-500">
            {search || filterTerms !== 'all' || filterStatus !== 'all'
              ? 'No customers match your filters'
              : 'No customers yet'}
          </p>
        </Card>
      ) : (
        <Card padding="none">
          {/* Desktop table header */}
          <div className="hidden border-b border-gray-100 px-6 py-3 sm:grid sm:grid-cols-6 sm:gap-4">
            <span className="col-span-2 text-xs font-medium uppercase text-gray-500">
              Company
            </span>
            <span className="text-xs font-medium uppercase text-gray-500">
              UEN
            </span>
            <span className="text-xs font-medium uppercase text-gray-500">
              Terms
            </span>
            <span className="text-xs font-medium uppercase text-gray-500">
              Status
            </span>
            <span className="text-xs font-medium uppercase text-gray-500">
              Last Order
            </span>
          </div>

          <div className="divide-y divide-gray-50">
            {filtered.map(company => (
              <button
                key={company.id}
                onClick={() => navigate(`/customers/${company.id}`)}
                className="w-full px-6 py-4 text-left transition-colors hover:bg-gray-50 sm:grid sm:grid-cols-6 sm:items-center sm:gap-4"
              >
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-900">
                    {company.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {company.contact_name ?? '—'}
                  </p>
                </div>
                <p className="text-sm text-gray-600">{company.uen ?? '—'}</p>
                <p className="text-sm text-gray-600">{company.payment_terms}</p>
                <div>
                  <StatusBadge status={company.status} />
                </div>
                <p className="text-sm text-gray-500">
                  {company.last_order_date
                    ? new Date(company.last_order_date).toLocaleDateString(
                        'en-SG'
                      )
                    : '—'}
                </p>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
