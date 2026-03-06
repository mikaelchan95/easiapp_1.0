import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  ShoppingCart,
  CreditCard,
  FileText,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/Badge';
import type { Company, Order, Invoice } from '../types';

type Tab = 'orders' | 'invoices';

export function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('orders');

  useEffect(() => {
    if (id) loadCustomer(id);
  }, [id]);

  async function loadCustomer(companyId: string) {
    setLoading(true);
    try {
      const [companyRes, ordersRes, invoicesRes] = await Promise.all([
        supabase.from('companies').select('*').eq('id', companyId).single(),
        supabase
          .from('orders')
          .select('*')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('invoices')
          .select('*')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false })
          .limit(50),
      ]);

      if (companyRes.data) setCompany(companyRes.data as Company);
      setOrders((ordersRes.data ?? []) as Order[]);
      setInvoices((invoicesRes.data ?? []) as Invoice[]);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-200" />
        <div className="grid gap-4 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <div className="h-24 animate-pulse rounded-lg bg-gray-100" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center">
        <p className="text-gray-500">Customer not found</p>
        <Button
          variant="ghost"
          onClick={() => navigate('/customers')}
          className="mt-4"
        >
          Back to Customers
        </Button>
      </div>
    );
  }

  const availableCredit = company.credit_limit - company.credit_used;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/customers')}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {company.name}
              </h1>
              <StatusBadge status={company.status} />
            </div>
            {company.uen && (
              <p className="text-sm text-gray-500">UEN: {company.uen}</p>
            )}
          </div>
        </div>
        <Button
          onClick={() =>
            navigate('/orders/new', { state: { companyId: company.id } })
          }
          icon={<ShoppingCart className="h-4 w-4" />}
        >
          Place Order
        </Button>
      </div>

      {/* Info cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gray-100 p-2">
              <CreditCard className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Credit Limit</p>
              <p className="text-lg font-bold text-gray-900">
                ${company.credit_limit.toLocaleString('en-SG')}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-50 p-2">
              <CreditCard className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Credit Used</p>
              <p className="text-lg font-bold text-gray-900">
                ${company.credit_used.toLocaleString('en-SG')}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div
              className={`rounded-lg p-2 ${availableCredit > 0 ? 'bg-green-50' : 'bg-red-50'}`}
            >
              <CreditCard
                className={`h-5 w-5 ${availableCredit > 0 ? 'text-green-600' : 'text-red-600'}`}
              />
            </div>
            <div>
              <p className="text-xs text-gray-500">Available Credit</p>
              <p
                className={`text-lg font-bold ${availableCredit > 0 ? 'text-green-700' : 'text-red-700'}`}
              >
                ${availableCredit.toLocaleString('en-SG')}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div>
            <p className="text-xs text-gray-500">Payment Terms</p>
            <p className="mt-1 text-lg font-bold text-gray-900">
              {company.payment_terms}
            </p>
            <p className="text-xs text-gray-500">
              Pricing Tier: {company.pricing_tier}
            </p>
          </div>
        </Card>
      </div>

      {/* Contact info */}
      <Card>
        <h3 className="mb-3 text-sm font-semibold text-gray-900">
          Contact Information
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="h-4 w-4 text-gray-400" />
            {company.contact_phone || '—'}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="h-4 w-4 text-gray-400" />
            {company.contact_email || '—'}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4 text-gray-400" />
            {company.address || '—'}
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'orders'
              ? 'border-b-2 border-black text-gray-900'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <span className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Orders ({orders.length})
          </span>
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'invoices'
              ? 'border-b-2 border-black text-gray-900'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <span className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Invoices ({invoices.length})
          </span>
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'orders' && (
        <Card padding="none">
          {orders.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-gray-400">
              No orders found
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {orders.map(order => (
                <div
                  key={order.id}
                  className="flex items-center justify-between px-6 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {order.order_number}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.created_at).toLocaleDateString('en-SG')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-900">
                      $
                      {(order.total ?? 0).toLocaleString('en-SG', {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                    <StatusBadge status={order.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === 'invoices' && (
        <Card padding="none">
          {invoices.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-gray-400">
              No invoices found
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {invoices.map(inv => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between px-6 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {inv.invoice_number}
                    </p>
                    <p className="text-xs text-gray-500">
                      {inv.due_date
                        ? `Due: ${new Date(inv.due_date).toLocaleDateString('en-SG')}`
                        : new Date(inv.created_at).toLocaleDateString('en-SG')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-900">
                      $
                      {inv.amount.toLocaleString('en-SG', {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                    <StatusBadge status={inv.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
