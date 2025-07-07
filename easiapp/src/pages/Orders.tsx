import React, { useState } from 'react';
import { Package, Truck, CheckCircle, Clock, XCircle, Eye } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Order } from '../types';

const Orders: React.FC = () => {
  const { state } = useApp();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const userOrders = state.orders.filter(order => order.userId === state.user?.id);

  const getStatusIcon = (status: Order['status']) => {
    const iconClass = "w-5 h-5";
    switch (status) {
      case 'pending': return <Clock className={`${iconClass} text-yellow-500`} />;
      case 'processing': return <Package className={`${iconClass} text-blue-500`} />;
      case 'shipped': return <Truck className={`${iconClass} text-purple-500`} />;
      case 'delivered': return <CheckCircle className={`${iconClass} text-green-500`} />;
      case 'cancelled': return <XCircle className={`${iconClass} text-red-500`} />;
      default: return <Clock className={`${iconClass} text-gray-500`} />;
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusProgress = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 25;
      case 'processing': return 50;
      case 'shipped': return 75;
      case 'delivered': return 100;
      case 'cancelled': return 0;
      default: return 0;
    }
  };

  if (userOrders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-8">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-in">
            <Package className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3 animate-fade-in">No Orders</h2>
          <p className="text-gray-600 mb-8 leading-relaxed animate-fade-in">
            Start shopping to see orders here
          </p>
          <a
            href="/products"
            className="inline-block bg-black text-white px-8 py-4 rounded-xl font-bold btn-premium animate-fade-in"
          >
            Shop Now
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Orders</h1>
          <p className="text-gray-600">{userOrders.length} orders total</p>
        </div>

        <div className="space-y-6">
          {userOrders.map((order, index) => (
            <div 
              key={order.id} 
              className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm card-hover animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-200">
                      {getStatusIcon(order.status)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        Order {order.id}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {new Date(order.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className={`px-3 py-2 rounded-xl text-sm font-bold capitalize border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </div>
                    <span className="text-xl font-bold text-gray-900">
                      ${order.total.toFixed(0)}
                    </span>
                    <button
                      onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                      className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200 btn-ios-press"
                    >
                      <Eye className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>
                
                {/* Progress Bar */}
                {order.status !== 'cancelled' && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-1000 progress-bar"
                        style={{ width: `${getStatusProgress(order.status)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>Pending</span>
                      <span>Processing</span>
                      <span>Shipped</span>
                      <span>Delivered</span>
                    </div>
                  </div>
                )}

                {order.trackingNumber && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-blue-800">Tracking</span>
                      <span className="font-mono text-sm font-bold text-blue-900">{order.trackingNumber}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Expanded Details */}
              {selectedOrder?.id === order.id && (
                <div className="p-6 bg-gray-50 animate-slide-down">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Items */}
                    <div>
                      <h4 className="font-bold text-gray-900 mb-4">Items ({order.items.length})</h4>
                      <div className="space-y-3">
                        {order.items.map((item, idx) => (
                          <div 
                            key={item.product.id} 
                            className="flex items-center space-x-4 bg-white p-3 rounded-xl border border-gray-200 animate-fade-in"
                            style={{ animationDelay: `${idx * 100}ms` }}
                          >
                            <img
                              src={item.product.image}
                              alt={item.product.name}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                            <div className="flex-1">
                              <h5 className="font-bold text-gray-900 text-sm line-clamp-1">{item.product.name}</h5>
                              <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-gray-900 text-sm">
                                ${((state.user?.role === 'trade' ? item.product.tradePrice : item.product.retailPrice) * item.quantity).toFixed(0)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-6">
                      <div>
                        <h5 className="font-bold text-gray-900 mb-3">Delivery Address</h5>
                        <div className="text-sm text-gray-700 bg-white p-4 rounded-xl border border-gray-200">
                          <p className="font-bold">{order.shippingAddress.street}</p>
                          <p>{order.shippingAddress.city}, {order.shippingAddress.state}</p>
                          <p>{order.shippingAddress.postalCode}, {order.shippingAddress.country}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="font-bold text-gray-900 mb-3">Payment</h5>
                        <div className="text-sm text-gray-700 bg-white p-4 rounded-xl border border-gray-200">
                          <p className="font-bold capitalize">
                            {order.paymentMethod.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Orders;