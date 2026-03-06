import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { toast } from '../components/ui/Toast';
import type { Company, Product, CartItem, StaffProfile } from '../types';

type Step = 1 | 2 | 3;

export function NewOrder() {
  const navigate = useNavigate();
  const location = useLocation();
  const preselectedCompanyId = (location.state as { companyId?: string })
    ?.companyId;

  const [step, setStep] = useState<Step>(1);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companySearch, setCompanySearch] = useState('');

  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);

  const [notes, setNotes] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [companiesRes, productsRes] = await Promise.all([
        supabase
          .from('companies')
          .select('*')
          .eq('status', 'active')
          .order('name'),
        supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('name'),
      ]);

      const companiesData = (companiesRes.data ?? []) as Company[];
      setCompanies(companiesData);
      setProducts((productsRes.data ?? []) as Product[]);

      if (preselectedCompanyId) {
        const match = companiesData.find(c => c.id === preselectedCompanyId);
        if (match) {
          setSelectedCompany(match);
          setDeliveryAddress(match.address ?? '');
          setStep(2);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  const filteredCompanies = companySearch.trim()
    ? companies.filter(
        c =>
          c.name.toLowerCase().includes(companySearch.toLowerCase()) ||
          c.uen?.toLowerCase().includes(companySearch.toLowerCase())
      )
    : companies;

  const filteredProducts = productSearch.trim()
    ? products.filter(
        p =>
          p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
          p.sku?.toLowerCase().includes(productSearch.toLowerCase())
      )
    : products;

  function addToCart(product: Product) {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        return prev.map(i =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }

  function updateQuantity(productId: string, delta: number) {
    setCart(prev =>
      prev
        .map(i =>
          i.product.id === productId
            ? { ...i, quantity: Math.max(0, i.quantity + delta) }
            : i
        )
        .filter(i => i.quantity > 0)
    );
  }

  function removeFromCart(productId: string) {
    setCart(prev => prev.filter(i => i.product.id !== productId));
  }

  function getPrice(product: Product): number {
    return product.trade_price ?? product.unit_price;
  }

  const cartTotal = cart.reduce(
    (sum, item) => sum + getPrice(item.product) * item.quantity,
    0
  );

  async function handleSubmit() {
    if (!selectedCompany || cart.length === 0) return;
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

      const year = new Date().getFullYear();
      const seq = String(Math.floor(Math.random() * 999999)).padStart(6, '0');
      const generatedOrderNumber = `ORD-${year}-${seq}`;

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: generatedOrderNumber,
          company_id: selectedCompany.id,
          placed_by_staff_id: staffProfile.id,
          status: 'confirmed',
          total: cartTotal,
          delivery_address: deliveryAddress || selectedCompany.address,
          order_notes: notes || null,
          payment_method: selectedCompany.payment_terms,
        })
        .select('id, order_number')
        .single();

      if (orderError) throw orderError;

      const orderItems = cart.map(item => ({
        order_id: orderData.id,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: getPrice(item.product),
        total_price: getPrice(item.product) * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      setOrderNumber(orderData.order_number);
      toast('success', `Order ${orderData.order_number} placed successfully`);
    } catch (err) {
      console.error('Order submission error:', err);
      toast('error', 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">New Order</h1>
        <Card>
          <div className="h-48 animate-pulse rounded-lg bg-gray-100" />
        </Card>
      </div>
    );
  }

  // Success state
  if (orderNumber) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="mb-4 rounded-full bg-green-50 p-4">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Order Placed!</h2>
        <p className="mt-2 text-gray-500">
          Order <span className="font-mono font-medium">{orderNumber}</span> has
          been confirmed
        </p>
        <div className="mt-6 flex gap-3">
          <Button variant="outline" onClick={() => navigate('/')}>
            Dashboard
          </Button>
          <Button
            onClick={() => {
              setOrderNumber('');
              setStep(1);
              setSelectedCompany(null);
              setCart([]);
              setNotes('');
              setDeliveryAddress('');
            }}
          >
            New Order
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">New Order</h1>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {[
          { num: 1, label: 'Customer' },
          { num: 2, label: 'Products' },
          { num: 3, label: 'Review' },
        ].map((s, i) => (
          <div key={s.num} className="flex items-center gap-2">
            {i > 0 && <div className="h-px w-8 bg-gray-200" />}
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                step >= (s.num as Step)
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {s.num}
            </div>
            <span
              className={`text-sm ${
                step >= (s.num as Step)
                  ? 'font-medium text-gray-900'
                  : 'text-gray-400'
              }`}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Step 1: Select Customer */}
      {step === 1 && (
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Select Customer
          </h2>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search companies…"
              value={companySearch}
              onChange={e => setCompanySearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>
          <div className="max-h-80 divide-y divide-gray-50 overflow-y-auto rounded-lg border border-gray-100">
            {filteredCompanies.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">
                No companies found
              </div>
            ) : (
              filteredCompanies.map(c => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedCompany(c);
                    setDeliveryAddress(c.address ?? '');
                    setStep(2);
                  }}
                  className={`flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                    selectedCompany?.id === c.id ? 'bg-gray-50' : ''
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {c.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {c.uen ?? '—'} · {c.payment_terms}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-300" />
                </button>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Step 2: Add Products */}
      {step === 2 && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Product search */}
          <div className="space-y-4 lg:col-span-2">
            <Card>
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Add Products
              </h2>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products by name or SKU…"
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10"
                />
              </div>
              <div className="max-h-96 divide-y divide-gray-50 overflow-y-auto">
                {filteredProducts.length === 0 ? (
                  <div className="py-8 text-center text-sm text-gray-400">
                    No products found
                  </div>
                ) : (
                  filteredProducts.map(p => {
                    const inCart = cart.find(i => i.product.id === p.id);
                    return (
                      <div
                        key={p.id}
                        className="flex items-center justify-between py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {p.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {p.sku ? `${p.sku} · ` : ''}$
                            {getPrice(p).toFixed(2)}
                            {p.case_size ? ` · ${p.case_size}pk` : ''}
                          </p>
                        </div>
                        {inCart ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(p.id, -1)}
                              className="rounded-md p-1 text-gray-400 hover:bg-gray-100"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-8 text-center text-sm font-medium">
                              {inCart.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(p.id, 1)}
                              className="rounded-md p-1 text-gray-400 hover:bg-gray-100"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addToCart(p)}
                            icon={<Plus className="h-3.5 w-3.5" />}
                          >
                            Add
                          </Button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          </div>

          {/* Cart sidebar */}
          <div className="space-y-4">
            <Card>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900">Cart</h3>
                <span className="text-sm text-gray-500">
                  {cart.length} item{cart.length !== 1 ? 's' : ''}
                </span>
              </div>
              {cart.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-400">
                  No items added yet
                </p>
              ) : (
                <>
                  <div className="mb-4 divide-y divide-gray-50">
                    {cart.map(item => (
                      <div
                        key={item.product.id}
                        className="flex items-center justify-between py-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-gray-900">
                            {item.product.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.quantity} × $
                            {getPrice(item.product).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            $
                            {(getPrice(item.product) * item.quantity).toFixed(
                              2
                            )}
                          </span>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="p-1 text-gray-300 hover:text-red-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                    <span className="text-sm font-semibold text-gray-900">
                      Total
                    </span>
                    <span className="text-lg font-bold text-gray-900">
                      $
                      {cartTotal.toLocaleString('en-SG', {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </>
              )}
            </Card>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button
                className="flex-1"
                disabled={cart.length === 0}
                onClick={() => setStep(3)}
              >
                Review
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Review and Submit */}
      {step === 3 && selectedCompany && (
        <div className="space-y-4">
          <Card>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Order Review
            </h2>

            <div className="mb-6 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-gray-500">Customer</p>
                <p className="text-sm font-medium text-gray-900">
                  {selectedCompany.name}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Payment Terms</p>
                <p className="text-sm font-medium text-gray-900">
                  {selectedCompany.payment_terms}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Delivery Address
              </label>
              <input
                type="text"
                value={deliveryAddress}
                onChange={e => setDeliveryAddress(e.target.value)}
                placeholder="Enter delivery address"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Order Notes
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Optional notes for this order…"
                rows={3}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>

            {/* Items */}
            <div className="rounded-lg border border-gray-100">
              <div className="border-b border-gray-100 px-4 py-2">
                <span className="text-xs font-medium uppercase text-gray-500">
                  Order Items
                </span>
              </div>
              <div className="divide-y divide-gray-50">
                {cart.map(item => (
                  <div
                    key={item.product.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div>
                      <p className="text-sm text-gray-900">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.quantity} × ${getPrice(item.product).toFixed(2)}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      ${(getPrice(item.product) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-3">
                <span className="text-sm font-semibold text-gray-900">
                  Total
                </span>
                <span className="text-lg font-bold text-gray-900">
                  $
                  {cartTotal.toLocaleString('en-SG', {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </Card>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setStep(2)}
            >
              Back
            </Button>
            <Button
              className="flex-1"
              loading={submitting}
              onClick={handleSubmit}
            >
              Place Order
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
