import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Company, User, Order } from '../types';
import {
  ArrowLeft,
  Building2,
  Users,
  ShoppingBag,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { CompanyEmployees } from '../components/Companies/CompanyEmployees';

export default function CompanyDetail() {
  const { id } = useParams<{ id: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [employees, setEmployees] = useState<User[]>([]);
  const [companyOrders, setCompanyOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'employees' | 'orders'>(
    'employees'
  );

  useEffect(() => {
    if (id) fetchCompanyDetails();
  }, [id]);

  const fetchCompanyDetails = async () => {
    try {
      // 1. Fetch Company Info
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .single();

      if (companyError) throw companyError;
      setCompany(companyData);

      // 2. Fetch Employees
      const { data: employeesData, error: employeesError } = await supabase
        .from('users')
        .select('*')
        .eq('company_id', id);

      if (employeesError) throw employeesError;
      setEmployees(employeesData || []);

      // 3. Fetch Orders via Employees
      const employeeIds = employeesData?.map(e => e.id) || [];
      if (employeeIds.length > 0) {
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*, user:users!user_id(name)')
          .in('user_id', employeeIds)
          .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;
        setCompanyOrders(ordersData || []);
      }
    } catch (error) {
      console.error('Error fetching company details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--text-primary)]"></div>
      </div>
    );
  }

  if (!company)
    return (
      <div className="p-8 text-center text-[var(--text-secondary)]">
        Company not found
      </div>
    );

  const totalSpent = companyOrders.reduce(
    (sum, order) => sum + (order.total || 0),
    0
  );
  const statusVariant =
    company.status === 'active'
      ? 'success'
      : company.status === 'suspended'
        ? 'error'
        : 'warning';

  return (
    <div className="mx-auto max-w-6xl space-y-6 sm:space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link to="/companies">
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 rounded-full p-0 min-w-[40px]"
            >
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] flex-shrink-0">
              <Building2 size={24} />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2 flex-wrap">
                <span className="truncate">
                  {company.name || company.company_name || 'Unnamed Company'}
                </span>
                <Badge variant={statusVariant} className="text-sm">
                  {company.status.replace('_', ' ')}
                </Badge>
              </h1>
              <p className="text-sm text-[var(--text-secondary)] font-mono truncate">
                UEN: {company.uen}
              </p>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0">
          <Link to={`/companies/${company.id}/edit`}>
            <Button variant="outline" className="w-full sm:w-auto">
              Edit Company
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[var(--text-secondary)]">
              Total Spent
            </h3>
            <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">
            $
            {totalSpent.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </Card>
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[var(--text-secondary)]">
              Total Orders
            </h3>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
              <ShoppingBag size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">
            {companyOrders.length.toLocaleString('en-US')}
          </div>
        </Card>
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[var(--text-secondary)]">
              Employees
            </h3>
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
              <Users size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">
            {employees.length.toLocaleString('en-US')}
          </div>
        </Card>
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[var(--text-secondary)]">
              Credit Used
            </h3>
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">
            $
            {company.current_credit.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <div className="text-xs text-[var(--text-tertiary)] mt-1">
            of $
            {company.credit_limit.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{' '}
            limit
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-[var(--border-primary)] overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-4 sm:gap-6">
          <button
            onClick={() => setActiveTab('employees')}
            className={`pb-3 sm:pb-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap min-h-[44px] touch-manipulation ${
              activeTab === 'employees'
                ? 'border-[var(--text-primary)] text-[var(--text-primary)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Employees ({employees.length.toLocaleString('en-US')})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-3 sm:pb-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap min-h-[44px] touch-manipulation ${
              activeTab === 'orders'
                ? 'border-[var(--text-primary)] text-[var(--text-primary)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Orders ({companyOrders.length.toLocaleString('en-US')})
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'employees' ? (
          <CompanyEmployees
            companyId={company.id}
            employees={employees}
            onRefresh={fetchCompanyDetails}
          />
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[700px]">
                <thead className="bg-[var(--bg-tertiary)] text-xs uppercase text-[var(--text-primary)] font-bold tracking-wider">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 sm:py-4">Order #</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4">Placed By</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4">Date</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4">Status</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-primary)]">
                  {companyOrders.map(order => (
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
                        {/* @ts-expect-error */}
                        {order.user?.name || 'Unknown'}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-[var(--text-secondary)]">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                            order.status === 'delivered'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : order.status === 'cancelled'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-right font-medium text-[var(--text-primary)]">
                        $
                        {order.total?.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  ))}
                  {companyOrders.length === 0 && (
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
      </div>
    </div>
  );
}
