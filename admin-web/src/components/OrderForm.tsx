import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Order, OrderItem, User, Product } from '../types';
import { Card } from './ui/Card';
import {
  ArrowLeft,
  Save,
  ShoppingBag,
  Plus,
  Trash2,
  Search,
} from 'lucide-react';

interface OrderFormData extends Partial<Order> {
  items: Partial<OrderItem>[];
}

const INITIAL_ORDER: OrderFormData = {
  user_id: '',
  status: 'pending',
  order_type: 'standard',
  subtotal: 0,
  gst: 0,
  delivery_fee: 0,
  discount_amount: 0,
  total: 0,
  currency: 'SGD',
  payment_method: 'credit_card',
  payment_status: 'pending',
  delivery_address: {},
  delivery_instructions: '',
  shipping_address: '',
  items: [],
};

export default function OrderForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [formData, setFormData] = useState<OrderFormData>(INITIAL_ORDER);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchProducts();
    if (isEditMode) {
      fetchOrder(id);
    } else {
      setFetched(true);
    }
  }, [id]);

  useEffect(() => {
    calculateTotals();
  }, [formData.items, formData.delivery_fee, formData.discount_amount]);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('users')
      .select('id, name, email')
      .order('name');
    setUsers(data || []);
  };

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('id, name, sku, retail_price, image_url, stock_quantity')
      .eq('is_active', true)
      .order('name');
    setProducts(data || []);
  };

  const fetchOrder = async (orderId: string) => {
    setLoading(true);
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;

      setFormData({
        ...orderData,
        items: itemsData || [],
      });
    } catch (error) {
      alert('Error fetching order');
      navigate('/orders');
    } finally {
      setLoading(false);
      setFetched(true);
    }
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce(
      (sum, item) => sum + (item.unit_price || 0) * (item.quantity || 0),
      0
    );
    const gst = subtotal * 0.09; // 9% GST
    const total =
      subtotal +
      gst +
      (formData.delivery_fee || 0) -
      (formData.discount_amount || 0);

    setFormData(prev => ({
      ...prev,
      subtotal,
      gst,
      total,
    }));
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddProduct = (product: Product) => {
    const existingItem = formData.items.find(
      item => item.product_id === product.id
    );

    if (existingItem) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.map(item =>
          item.product_id === product.id
            ? { ...item, quantity: (item.quantity || 0) + 1 }
            : item
        ),
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        items: [
          ...prev.items,
          {
            product_id: product.id,
            product_name: product.name,
            product_image_url: product.image_url,
            sku: product.sku,
            quantity: 1,
            unit_price: product.retail_price,
            total_price: product.retail_price,
            discount_amount: 0,
            price: product.retail_price, // backward compatibility
          },
        ],
      }));
    }
    setSearchQuery('');
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i !== index) return item;
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unit_price') {
          updatedItem.total_price =
            (updatedItem.quantity || 0) * (updatedItem.unit_price || 0);
        }
        return updatedItem;
      }),
    }));
  };

  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.user_id) {
        alert('Please select a customer');
        setLoading(false);
        return;
      }

      if (formData.items.length === 0) {
        alert('Please add at least one product');
        setLoading(false);
        return;
      }

      // Generate order number if new
      if (!isEditMode) {
        formData.order_number = `ORD-${Date.now()}`;
      }

      const orderPayload = {
        user_id: formData.user_id,
        status: formData.status,
        order_type: formData.order_type,
        subtotal: formData.subtotal,
        gst: formData.gst,
        delivery_fee: formData.delivery_fee || 0,
        discount_amount: formData.discount_amount || 0,
        total: formData.total,
        currency: formData.currency || 'SGD',
        payment_method: formData.payment_method,
        payment_status: formData.payment_status,
        delivery_address: formData.delivery_address,
        delivery_instructions: formData.delivery_instructions || '',
        shipping_address: formData.shipping_address || '',
        order_number: formData.order_number,
      };

      let orderId = id;

      if (isEditMode) {
        const { error } = await supabase
          .from('orders')
          .update(orderPayload)
          .eq('id', id);

        if (error) throw error;

        // Delete existing items and re-insert
        await supabase.from('order_items').delete().eq('order_id', id);
      } else {
        const { data, error } = await supabase
          .from('orders')
          .insert([orderPayload])
          .select()
          .single();

        if (error) throw error;
        orderId = data.id;
      }

      // Insert order items
      const itemsPayload = formData.items.map(item => ({
        order_id: orderId,
        product_id: item.product_id,
        product_name: item.product_name,
        product_image_url: item.product_image_url,
        sku: item.sku,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        discount_amount: item.discount_amount || 0,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(itemsPayload);

      if (itemsError) throw itemsError;

      navigate('/orders');
    } catch (error) {
      alert('Error saving order: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(
    p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!fetched && isEditMode) return <div>Loading...</div>;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/orders')}
            className="rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)] p-2 text-[var(--text-secondary)] shadow-sm transition-colors hover:bg-[var(--bg-tertiary)]"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)]">
              <ShoppingBag size={20} />
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              {isEditMode ? 'Edit Order' : 'New Order'}
            </h1>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-6 lg:grid-cols-3"
      >
        {/* Main Column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Customer Selection */}
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-bold text-[var(--text-primary)]">
              Customer
            </h2>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                Select Customer <span className="text-red-500">*</span>
              </label>
              <select
                name="user_id"
                value={formData.user_id}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 py-2.5 focus:border-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]"
              >
                <option value="">Choose a customer...</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>
          </Card>

          {/* Products */}
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-bold text-[var(--text-primary)]">
              Order Items
            </h2>

            {/* Product Search */}
            <div className="mb-4">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-tertiary)]"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search products to add..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] py-2.5 pl-10 pr-4 focus:border-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]"
                />
              </div>
              {searchQuery && filteredProducts.length > 0 && (
                <div className="mt-2 max-h-60 overflow-y-auto rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-lg z-10 relative">
                  {filteredProducts.slice(0, 10).map(product => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleAddProduct(product)}
                      className="flex w-full items-center justify-between px-4 py-2 text-left transition-colors hover:bg-[var(--bg-tertiary)]"
                    >
                      <div>
                        <div className="font-medium text-[var(--text-primary)]">
                          {product.name}
                        </div>
                        <div className="text-xs text-[var(--text-secondary)]">
                          {product.sku} • Stock: {product.stock_quantity}
                        </div>
                      </div>
                      <div className="font-medium text-[var(--text-primary)]">
                        S${product.retail_price.toFixed(2)}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Order Items List */}
            {formData.items.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-8 text-center">
                <p className="text-[var(--text-secondary)]">
                  No items added. Search and add products above.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 rounded-lg border border-[var(--border-primary)] p-4 bg-[var(--bg-secondary)]"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-[var(--text-primary)]">
                        {item.product_name}
                      </div>
                      <div className="text-xs text-[var(--text-secondary)]">
                        {item.sku}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={e =>
                          handleUpdateItem(
                            index,
                            'quantity',
                            parseInt(e.target.value) || 1
                          )
                        }
                        className="w-20 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-3 py-1.5 text-center focus:border-[var(--text-primary)] focus:outline-none"
                      />
                      <span className="text-[var(--text-secondary)]">×</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unit_price}
                        onChange={e =>
                          handleUpdateItem(
                            index,
                            'unit_price',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-24 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-3 py-1.5 text-right focus:border-[var(--text-primary)] focus:outline-none"
                      />
                    </div>
                    <div className="font-medium text-[var(--text-primary)]">
                      S${item.total_price?.toFixed(2)}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="rounded-lg p-2 text-[var(--text-secondary)] transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Delivery Information */}
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-bold text-[var(--text-primary)]">
              Delivery Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                  Shipping Address
                </label>
                <textarea
                  name="shipping_address"
                  rows={3}
                  value={formData.shipping_address || ''}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 py-2.5 focus:border-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                  Delivery Instructions
                </label>
                <textarea
                  name="delivery_instructions"
                  rows={2}
                  value={formData.delivery_instructions || ''}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 py-2.5 focus:border-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]"
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Details */}
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-bold text-[var(--text-primary)]">
              Order Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 py-2.5 focus:border-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready">Ready</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                  Payment Method
                </label>
                <select
                  name="payment_method"
                  value={formData.payment_method}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 py-2.5 focus:border-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]"
                >
                  <option value="credit_card">Credit Card</option>
                  <option value="debit_card">Debit Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="paynow">PayNow</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                  Payment Status
                </label>
                <select
                  name="payment_status"
                  value={formData.payment_status}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 py-2.5 focus:border-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Pricing */}
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-bold text-[var(--text-primary)]">
              Pricing
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                  Delivery Fee
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
                    S$
                  </span>
                  <input
                    type="number"
                    name="delivery_fee"
                    step="0.01"
                    min="0"
                    value={formData.delivery_fee}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] py-2.5 pl-10 pr-4 focus:border-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                  Discount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
                    S$
                  </span>
                  <input
                    type="number"
                    name="discount_amount"
                    step="0.01"
                    min="0"
                    value={formData.discount_amount}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] py-2.5 pl-10 pr-4 focus:border-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]"
                  />
                </div>
              </div>

              <div className="space-y-2 border-t border-[var(--border-primary)] pt-4">
                <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                  <span>Subtotal</span>
                  <span>S${formData.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                  <span>GST (9%)</span>
                  <span>S${formData.gst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                  <span>Delivery</span>
                  <span>S${(formData.delivery_fee || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                  <span>Discount</span>
                  <span>-S${(formData.discount_amount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-[var(--border-primary)] pt-2 text-lg font-bold text-[var(--text-primary)]">
                  <span>Total</span>
                  <span>S${formData.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--text-primary)] px-4 py-3 font-bold text-[var(--bg-primary)] transition-colors hover:opacity-90 disabled:opacity-50"
          >
            <Save size={20} />
            {loading ? 'Saving...' : 'Save Order'}
          </button>
        </div>
      </form>
    </div>
  );
}
