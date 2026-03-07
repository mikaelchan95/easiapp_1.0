import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type {
  StaffProfile,
  Order,
  Company,
  CustomerOnboardingRequest,
} from '../types';
import {
  ArrowLeft,
  Phone,
  Mail,
  ShoppingBag,
  DollarSign,
  Building2,
  ClipboardList,
  Loader2,
  UserCheck,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

type Tab = 'orders' | 'customers' | 'onboarding';

const getOrderStatusVariant = (status: string) => {
  switch (status) {
    case 'delivered':
      return 'success' as const;
    case 'cancelled':
    case 'returned':
      return 'error' as const;
    case 'pending':
      return 'warning' as const;
    case 'out_for_delivery':
      return 'info' as const;
    case 'preparing':
    case 'confirmed':
      return 'purple' as const;
    default:
      return 'default' as const;
  }
};

const getOnboardingStatusVariant = (status: string) => {
  switch (status) {
    case 'approved':
      return 'success' as const;
    case 'pending':
      return 'warning' as const;
    case 'rejected':
      return 'error' as const;
    default:
      return 'default' as const;
  }
};

const getCompanyStatusVariant = (status: string) => {
  switch (status) {
    case 'active':
      return 'success' as const;
    case 'suspended':
      return 'error' as const;
    case 'pending_verification':
      return 'warning' as const;
    default:
      return 'default' as const;
  }
};

export default function SalesmanDetail() {
  const { id } = useParams<{ id: string }>();
  const [salesman, setSalesman] = useState<StaffProfile | null>(null);
  const [orders, setOrders] = useState<(Order & { company?: Company })[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [onboardingRequests, setOnboardingRequests] = useState<
    CustomerOnboardingRequest[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('orders');
  const [togglingActive, setTogglingActive] = useState(false);

  useEffect(() => {
    if (id) fetchSalesmanData();
  }, [id]);

  const fetchSalesmanData = async () => {
    try {
      const { data: staffData, error: staffError } = await supabase
        .from('staff_profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (staffError) throw staffError;
      setSalesman(staffData);

      const [ordersRes, onboardingRes] = await Promise.all([
        supabase
          .from('orders')
          .select('*')
          .eq('placed_by_staff_id', id)
          .order('created_at', { ascending: false }),
        supabase
          .from('customer_onboarding_requests')
          .select('*')
          .eq('salesman_id', id)
          .order('created_at', { ascending: false }),
      ]);

      if (ordersRes.error) throw ordersRes.error;
      if (onboardingRes.error) throw onboardingRes.error;

      const orderData = ordersRes.data || [];
      setOnboardingRequests(onboardingRes.data || []);

      const companyIds = [
        ...new Set(orderData.map(o => o.company_id).filter(Boolean)),
      ] as string[];

      if (companyIds.length > 0) {
        const { data: companiesData, error: companiesError } = await supabase
          .from('companies')
          .select('*')
          .in('id', companyIds);

        if (companiesError) throw companiesError;

        const companyMap: Record<string, Company> = {};
        (companiesData || []).forEach(c => {
          companyMap[c.id] = c;
        });

        setCompanies(companiesData || []);
        setOrders(
          orderData.map(o => ({
            ...o,
            company: o.company_id ? companyMap[o.company_id] : undefined,
          }))
        );
      } else {
        setCompanies([]);
        setOrders(orderData);
      }
    } catch (error) {
      console.error('Error fetching salesman details:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async () => {
    if (!salesman) return;
    setTogglingActive(true);
    try {
      const { error } = await supabase
        .from('staff_profiles')
        .update({ is_active: !salesman.is_active })
        .eq('id', salesman.id);

      if (error) throw error;
      setSalesman({ ...salesman, is_active: !salesman.is_active });
    } catch (error) {
      console.error('Error toggling salesman status:', error);
    } finally {
      setTogglingActive(false);
    }
  };

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const activeCustomers = new Set(orders.map(o => o.company_id).filter(Boolean))
    .size;
  const pendingOnboardings = onboardingRequests.filter(
    r => r.status === 'pending'
  ).length;

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

  if (!salesman) {
    return (
      <div className="p-8 text-center text-[var(--text-secondary)]">
        Salesman not found
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'orders', label: 'Orders' },
    { key: 'customers', label: 'Customers' },
    { key: 'onboarding', label: 'Onboarding Requests' },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 sm:space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link to="/salesmen">
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 rounded-full p-0 min-w-[40px]"
            >
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] font-bold text-xl sm:text-2xl border border-[var(--border-primary)] flex-shrink-0">
              {salesman.full_name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] truncate">
                {salesman.full_name}
              </h1>
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] flex-wrap">
                <Badge variant={salesman.is_active ? 'success' : 'default'}>
                  {salesman.is_active ? 'Active' : 'Inactive'}
                </Badge>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <Mail size={14} className="text-[var(--text-tertiary)]" />
                  <span className="truncate">{salesman.email}</span>
                </div>
                {salesman.phone && (
                  <>
                    <span>•</span>
                    <a
                      href={`tel:${salesman.phone}`}
                      className="flex items-center gap-1.5 hover:underline"
                    >
                      <Phone
                        size={14}
                        className="text-[var(--text-tertiary)]"
                      />
                      {salesman.phone}
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0">
          <Button
            variant={salesman.is_active ? 'outline' : 'primary'}
            isLoading={togglingActive}
            onClick={toggleActive}
            className="w-full sm:w-auto"
          >
            {salesman.is_active ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[var(--text-secondary)]">
              Total Orders
            </h3>
            <div className="p-2 bg-blue-50 text-blue-600 ring-1 ring-blue-600/20 rounded-lg">
              <ShoppingBag size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">
            {orders.length.toLocaleString('en-US')}
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[var(--text-secondary)]">
              Total Revenue
            </h3>
            <div className="p-2 bg-emerald-50 text-emerald-600 ring-1 ring-emerald-600/20 rounded-lg">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">
            $
            {totalRevenue.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[var(--text-secondary)]">
              Active Customers
            </h3>
            <div className="p-2 bg-purple-50 text-purple-600 ring-1 ring-purple-600/20 rounded-lg">
              <Building2 size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">
            {activeCustomers.toLocaleString('en-US')}
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[var(--text-secondary)]">
              Pending Onboardings
            </h3>
            <div className="p-2 bg-amber-50 text-amber-600 ring-1 ring-amber-600/20 rounded-lg">
              <ClipboardList size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">
            {pendingOnboardings.toLocaleString('en-US')}
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border-primary)] overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`pb-3 sm:pb-4 px-3 sm:px-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap min-h-[44px] touch-manipulation ${
              activeTab === tab.key
                ? 'border-[var(--text-primary)] text-[var(--text-primary)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'orders' && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[700px]">
              <thead className="bg-[var(--bg-tertiary)] font-medium text-[var(--text-secondary)]">
                <tr>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                    Order #
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                    Company
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                    Status
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)] text-right">
                    Total
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-primary)]">
                {orders.map(order => (
                  <tr
                    key={order.id}
                    className="hover:bg-[var(--bg-tertiary)] transition-colors"
                  >
                    <td className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-[var(--text-primary)]">
                      <Link
                        to={`/orders/${order.id}`}
                        className="hover:underline transition-colors"
                      >
                        #{order.order_number}
                      </Link>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-[var(--text-secondary)]">
                      {order.company?.name ||
                        order.company?.company_name ||
                        '—'}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <Badge variant={getOrderStatusVariant(order.status)}>
                        {order.status?.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-right font-medium text-[var(--text-primary)]">
                      $
                      {order.total?.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-[var(--text-secondary)]">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-[var(--text-secondary)]"
                    >
                      No orders found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'customers' && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[700px]">
              <thead className="bg-[var(--bg-tertiary)] font-medium text-[var(--text-secondary)]">
                <tr>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                    Company Name
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                    UEN
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                    Payment Terms
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)] text-right">
                    Credit Limit
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-primary)]">
                {companies.map(company => (
                  <tr
                    key={company.id}
                    className="hover:bg-[var(--bg-tertiary)] transition-colors"
                  >
                    <td className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-[var(--text-primary)]">
                      <Link
                        to={`/companies/${company.id}`}
                        className="hover:underline transition-colors"
                      >
                        {company.name || company.company_name}
                      </Link>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-[var(--text-secondary)] font-mono">
                      {company.uen || '—'}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-[var(--text-secondary)] uppercase">
                      {company.payment_terms || '—'}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-right font-medium text-[var(--text-primary)]">
                      $
                      {company.credit_limit?.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <Badge variant={getCompanyStatusVariant(company.status)}>
                        {company.status?.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {companies.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-[var(--text-secondary)]"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <Building2 className="mb-3 h-10 w-10 text-[var(--text-tertiary)]" />
                        <p>No customers yet</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'onboarding' && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[800px]">
              <thead className="bg-[var(--bg-tertiary)] font-medium text-[var(--text-secondary)]">
                <tr>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                    Company Name
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                    Contact
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                    UEN
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)] text-right">
                    Proposed Credit
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                    Proposed Terms
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                    Status
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-primary)]">
                {onboardingRequests.map(req => (
                  <tr
                    key={req.id}
                    className="hover:bg-[var(--bg-tertiary)] transition-colors"
                  >
                    <td className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-[var(--text-primary)]">
                      {req.company_name}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <div className="text-[var(--text-primary)]">
                        {req.contact_name}
                      </div>
                      {req.contact_email && (
                        <div className="text-xs text-[var(--text-tertiary)]">
                          {req.contact_email}
                        </div>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-[var(--text-secondary)] font-mono">
                      {req.uen || '—'}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-right font-medium text-[var(--text-primary)]">
                      {req.proposed_credit_limit != null
                        ? `$${req.proposed_credit_limit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : '—'}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-[var(--text-secondary)] uppercase">
                      {req.proposed_payment_terms || '—'}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <Badge variant={getOnboardingStatusVariant(req.status)}>
                        {req.status}
                      </Badge>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-[var(--text-secondary)]">
                      {new Date(req.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {onboardingRequests.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-8 text-center text-[var(--text-secondary)]"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <UserCheck className="mb-3 h-10 w-10 text-[var(--text-tertiary)]" />
                        <p>No onboarding requests</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
