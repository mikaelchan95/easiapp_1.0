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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent"></div>
      </div>
    );
  }

  if (!company)
    return (
      <div className="p-8 text-center text-gray-500">Company not found</div>
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

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    company_name: '',
    status: 'active',
    uen: '',
    credit_limit: 0,
  });

  useEffect(() => {
    if (!company) return;
    setEditFormData({
      name: company.name || '',
      company_name: company.company_name || '',
      status: company.status || 'active',
      uen: company.uen || '',
      credit_limit: company.credit_limit || 0,
    });
  }, [company]);

  const handleSaveCompany = async () => {
    if (!company) return;
    try {
      const { error } = await supabase
        .from('companies')
        .update(editFormData)
        .eq('id', company.id);

      if (error) throw error;

      setCompany({
        ...company,
        ...editFormData,
        status: editFormData.status as Company['status'],
      });
      setIsEditModalOpen(false);
      alert('Company updated successfully');
    } catch (err) {
      console.error('Error updating company:', err);
      alert(
        'Failed to update company: ' +
          ((err as Error)?.message || 'Unknown error')
      );
    }
  };

  // ... (render)

  return (
    <div className="mx-auto max-w-6xl space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link to="/companies">
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 rounded-full p-0"
            >
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-light text-brand-dark border border-gray-100">
              <Building2 size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
                {company.name || company.company_name || 'Unnamed Company'}
                <Badge variant={statusVariant} className="ml-2 text-sm">
                  {company.status.replace('_', ' ')}
                </Badge>
              </h1>
              <p className="text-sm text-gray-500 font-mono">
                UEN: {company.uen}
              </p>
            </div>
          </div>
        </div>
        <div>
          <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
            Edit Company
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Total Spent</h3>
            <div className="p-2 bg-green-100 text-green-600 rounded-lg">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-brand-dark">
            $
            {totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <ShoppingBag size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-brand-dark">
            {companyOrders.length}
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Employees</h3>
            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
              <Users size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-brand-dark">
            {employees.length}
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Credit Used</h3>
            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-brand-dark">
            ${company.current_credit.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            of ${company.credit_limit.toLocaleString()} limit
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('employees')}
            className={`pb-4 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'employees'
                ? 'border-brand-dark text-brand-dark'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Employees ({employees.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-4 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'orders'
                ? 'border-brand-dark text-brand-dark'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Orders ({companyOrders.length})
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
              <table className="w-full text-left text-sm text-gray-500">
                <thead className="bg-brand-light text-xs uppercase text-brand-dark font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Order #</th>
                    <th className="px-6 py-4 font-semibold">Placed By</th>
                    <th className="px-6 py-4 font-semibold">Date</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {companyOrders.map(order => (
                    <tr
                      key={order.id}
                      className="hover:bg-brand-light/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-brand-dark">
                        <Link
                          to={`/orders/${order.id}`}
                          className="hover:text-brand-accent transition-colors"
                        >
                          #{order.order_number}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        {/* @ts-expect-error */}
                        {order.user?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold capitalize
                           ${
                             order.status === 'delivered'
                               ? 'bg-green-100 text-green-700'
                               : order.status === 'cancelled'
                                 ? 'bg-red-100 text-red-700'
                                 : 'bg-blue-100 text-blue-700'
                           }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-brand-dark">
                        ${order.total?.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {companyOrders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center">
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

      {/* Edit Company Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold text-brand-dark">
              Edit Company
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Company Name
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={e =>
                    setEditFormData({ ...editFormData, name: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Display Name
                </label>
                <input
                  type="text"
                  value={editFormData.company_name}
                  onChange={e =>
                    setEditFormData({
                      ...editFormData,
                      company_name: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  UEN
                </label>
                <input
                  type="text"
                  value={editFormData.uen}
                  onChange={e =>
                    setEditFormData({ ...editFormData, uen: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  value={editFormData.status}
                  onChange={e =>
                    setEditFormData({ ...editFormData, status: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white focus:border-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark"
                >
                  <option value="active">Active</option>
                  <option value="pending_verification">
                    Pending Verification
                  </option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Credit Limit
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.credit_limit}
                  onChange={e =>
                    setEditFormData({
                      ...editFormData,
                      credit_limit: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveCompany}>Save Changes</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
