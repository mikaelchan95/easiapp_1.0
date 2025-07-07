import React, { useState } from 'react';
import { 
  BarChart3, 
  Package, 
  Users, 
  DollarSign, 
  TrendingUp, 
  ShoppingCart,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const Admin: React.FC = () => {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'customers'>('overview');
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  // Calculate stats
  const totalOrders = state.orders.length;
  const totalRevenue = state.orders.reduce((sum, order) => sum + order.total, 0);
  const pendingOrders = state.orders.filter(order => order.status === 'pending').length;
  const lowStockProducts = state.products.filter(product => product.stock < 10).length;

  const ordersByStatus = {
    pending: state.orders.filter(o => o.status === 'pending').length,
    processing: state.orders.filter(o => o.status === 'processing').length,
    shipped: state.orders.filter(o => o.status === 'shipped').length,
    delivered: state.orders.filter(o => o.status === 'delivered').length,
    cancelled: state.orders.filter(o => o.status === 'cancelled').length,
  };

  const updateOrderStatus = (orderId: string, status: any) => {
    dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { orderId, status } });
  };

  const StatCard: React.FC<{ 
    title: string; 
    value: string; 
    icon: React.ReactNode; 
    trend?: string; 
    trendUp?: boolean;
    color: string 
  }> = ({ title, value, icon, trend, trendUp, color }) => (
    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 card-hover">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && (
            <p className={`text-sm flex items-center mt-2 font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
              {trendUp ? <ArrowUp className="w-4 h-4 mr-1" /> : <ArrowDown className="w-4 h-4 mr-1" />}
              {trend}
            </p>
          )}
        </div>
        <div className={`${color} p-4 rounded-xl shadow-sm`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your store operations</p>
        </div>

        {/* Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8 border-b border-gray-200">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'products', label: 'Products', icon: Package },
              { id: 'orders', label: 'Orders', icon: ShoppingCart },
              { id: 'customers', label: 'Customers', icon: Users },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-all ${
                  activeTab === tab.id
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Revenue"
                value={`$${totalRevenue.toFixed(0)}`}
                icon={<DollarSign className="w-6 h-6 text-white" />}
                trend="+12.5%"
                trendUp={true}
                color="bg-green-500"
              />
              <StatCard
                title="Orders"
                value={totalOrders.toString()}
                icon={<ShoppingCart className="w-6 h-6 text-white" />}
                trend="+5.2%"
                trendUp={true}
                color="bg-blue-500"
              />
              <StatCard
                title="Pending"
                value={pendingOrders.toString()}
                icon={<Clock className="w-6 h-6 text-white" />}
                color="bg-yellow-500"
              />
              <StatCard
                title="Low Stock"
                value={lowStockProducts.toString()}
                icon={<AlertCircle className="w-6 h-6 text-white" />}
                color="bg-red-500"
              />
            </div>

            {/* Order Status */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Order Status</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(ordersByStatus).map(([status, count]) => (
                  <div key={status} className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className={`text-2xl font-bold mb-2 ${
                      status === 'delivered' ? 'text-green-600' :
                      status === 'pending' ? 'text-yellow-600' :
                      status === 'processing' ? 'text-blue-600' :
                      status === 'shipped' ? 'text-purple-600' :
                      'text-red-600'
                    }`}>
                      {count}
                    </div>
                    <div className="text-sm text-gray-600 font-medium capitalize">{status}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Recent Orders</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-bold text-gray-900">Order</th>
                      <th className="text-left py-3 px-4 font-bold text-gray-900">Date</th>
                      <th className="text-left py-3 px-4 font-bold text-gray-900">Status</th>
                      <th className="text-left py-3 px-4 font-bold text-gray-900">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.orders.slice(0, 5).map((order) => (
                      <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900">
                          {order.id}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-xl capitalize ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-gray-900">
                          ${order.total.toFixed(0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Products */}
        {activeTab === 'products' && (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Product Management</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-bold text-gray-900">Product</th>
                    <th className="text-left py-3 px-4 font-bold text-gray-900">SKU</th>
                    <th className="text-left py-3 px-4 font-bold text-gray-900">Stock</th>
                    <th className="text-left py-3 px-4 font-bold text-gray-900">Retail</th>
                    <th className="text-left py-3 px-4 font-bold text-gray-900">Trade</th>
                    <th className="text-left py-3 px-4 font-bold text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {state.products.map((product) => (
                    <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <img className="h-12 w-12 rounded-xl object-cover" src={product.image} alt="" />
                          <div className="ml-4">
                            <div className="text-sm font-bold text-gray-900 line-clamp-1">{product.name}</div>
                            <div className="text-sm text-gray-500 capitalize">{product.category}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-900 font-mono text-sm">
                        {product.sku}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-bold ${
                          product.stock < 10 ? 'text-red-600' : 
                          product.stock < 25 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-gray-900">
                        ${product.retailPrice.toFixed(0)}
                      </td>
                      <td className="py-3 px-4 font-bold text-gray-900">
                        ${product.tradePrice.toFixed(0)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-xl ${
                          product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Orders */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Order Management</h3>
            <div className="space-y-4">
              {state.orders.map((order) => (
                <div key={order.id} className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-4">
                      <h4 className="font-bold text-gray-900">{order.id}</h4>
                      <p className="text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString()} • ${order.total.toFixed(0)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <button
                        onClick={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)}
                        className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 btn-ios-press"
                      >
                        <Eye className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {order.items.length} items • {order.shippingAddress.city}, {order.shippingAddress.country}
                  </div>
                  
                  {selectedOrder === order.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200 animate-slide-down">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="font-bold text-gray-900 mb-2">Items</h5>
                          <div className="space-y-2">
                            {order.items.map(item => (
                              <div key={item.product.id} className="flex items-center space-x-3 text-sm">
                                <img src={item.product.image} alt="" className="w-8 h-8 rounded object-cover" />
                                <span className="flex-1 line-clamp-1">{item.product.name}</span>
                                <span className="font-medium">×{item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h5 className="font-bold text-gray-900 mb-2">Address</h5>
                          <div className="text-sm text-gray-600">
                            <p>{order.shippingAddress.street}</p>
                            <p>{order.shippingAddress.city}, {order.shippingAddress.postalCode}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Customers */}
        {activeTab === 'customers' && (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Customer Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 border border-gray-200 rounded-xl bg-gray-50">
                <div className="text-3xl font-bold text-black mb-2">1</div>
                <div className="text-gray-600 font-medium">Admin Users</div>
              </div>
              <div className="text-center p-6 border border-gray-200 rounded-xl bg-gray-50">
                <div className="text-3xl font-bold text-blue-600 mb-2">1</div>
                <div className="text-gray-600 font-medium">Retail Customers</div>
              </div>
              <div className="text-center p-6 border border-gray-200 rounded-xl bg-gray-50">
                <div className="text-3xl font-bold text-purple-600 mb-2">1</div>
                <div className="text-gray-600 font-medium">Trade Customers</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;