import React, { useState } from 'react';
import { Package, ArrowRight, Clock, Truck, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Order } from '../../types';
import ProfileHeader from './ProfileHeader';

interface OrderHistoryViewProps {
  orders: Order[];
  onBack: () => void;
  onShopNow: () => void;
}

const OrderHistoryView: React.FC<OrderHistoryViewProps> = ({ orders, onBack, onShopNow }) => {
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const toggleOrderExpanded = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'processing': return <Package className="w-5 h-5 text-blue-500" />;
      case 'shipped': case 'outForDelivery': return <Truck className="w-5 h-5 text-purple-500" />;
      case 'delivered': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'cancelled': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusClass = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-50 text-yellow-800 border-yellow-100';
      case 'processing': return 'bg-blue-50 text-blue-800 border-blue-100';
      case 'shipped': case 'outForDelivery': return 'bg-purple-50 text-purple-800 border-purple-100';
      case 'delivered': return 'bg-green-50 text-green-800 border-green-100';
      case 'cancelled': return 'bg-red-50 text-red-800 border-red-100';
      default: return 'bg-gray-50 text-gray-800 border-gray-100';
    }
  };

  const getProgressPercentage = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 25;
      case 'processing': return 50;
      case 'shipped': case 'outForDelivery': return 75;
      case 'delivered': return 100;
      case 'cancelled': return 0;
      default: return 0;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (orders.length === 0) {
    return (
      <div className="page-container bg-gray-50">
        <ProfileHeader title="Orders" onBack={onBack} />

        <div className="page-content flex flex-col items-center justify-center px-8 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 mt-16">
            <Package className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">No Orders Yet</h3>
          <p className="text-gray-600 mb-8">
            Start shopping to see your orders here
          </p>
          <button
            onClick={onShopNow}
            className="bg-black text-white px-6 py-4 rounded-xl font-bold flex items-center space-x-2 active:scale-95 transition-transform"
          >
            <span>Shop Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container bg-gray-50">
      <ProfileHeader title="Orders" onBack={onBack} />

      <div className="page-content pb-24">
        <div className="px-4 py-6 space-y-4">
          {orders.map((order, index) => (
            <div 
              key={order.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"
            >
              {/* Order Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200">
                      {getStatusIcon(order.status)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{order.id}</h3>
                      <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className={`px-3 py-1 rounded-full text-xs font-bold capitalize border ${getStatusClass(order.status)}`}>
                      {order.status === 'outForDelivery' ? 'Out for Delivery' : order.status}
                    </div>
                    <p className="font-bold text-gray-900 mt-1">${order.total.toFixed(0)}</p>
                  </div>
                </div>
                
                {/* Progress Bar */}
                {order.status !== 'cancelled' && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-green-500 h-2 transition-all duration-500"
                        style={{ width: `${getProgressPercentage(order.status)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Order Summary */}
              <div 
                className="p-4 flex justify-between items-center cursor-pointer active:bg-gray-50"
                onClick={() => toggleOrderExpanded(order.id)}
              >
                <div>
                  <p className="text-sm text-gray-600">
                    {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                  </p>
                </div>
                <div className="flex items-center space-x-1 text-gray-600">
                  <span className="text-sm">Details</span>
                  {expandedOrder === order.id ? 
                    <ChevronUp className="w-4 h-4" /> : 
                    <ChevronDown className="w-4 h-4" />
                  }
                </div>
              </div>
              
              {/* Expanded Order Details */}
              {expandedOrder === order.id && (
                <div className="p-4 bg-gray-50 border-t border-gray-100 animate-slide-down">
                  <div className="space-y-4">
                    {/* Items */}
                    <div>
                      <h4 className="font-bold text-gray-900 mb-3">Items</h4>
                      <div className="space-y-3">
                        {order.items.map((item, i) => (
                          <div 
                            key={i} 
                            className="flex items-center space-x-3 bg-white p-3 rounded-lg border border-gray-200"
                          >
                            <img 
                              src={item.product.image} 
                              alt={item.product.name} 
                              className="w-12 h-12 object-cover rounded-md"
                            />
                            <div className="flex-1">
                              <p className="font-bold text-gray-900 text-sm line-clamp-1">{item.product.name}</p>
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                                <p className="text-sm font-bold text-gray-900">${item.product.retailPrice.toFixed(0)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Shipping Info */}
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">Shipping Address</h4>
                      <div className="bg-white p-3 rounded-lg border border-gray-200 text-sm">
                        <p>{order.shippingAddress.street}</p>
                        <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
                        <p>{order.shippingAddress.country}</p>
                      </div>
                    </div>
                    
                    {/* Payment Method */}
                    <div className="flex justify-between">
                      <h4 className="font-bold text-gray-900">Payment Method</h4>
                      <p className="text-gray-900 capitalize">{order.paymentMethod.replace('_', ' ')}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Track Order Button - For orders that are not delivered or cancelled */}
              {(order.status === 'processing' || order.status === 'shipped' || order.status === 'outForDelivery') && (
                <div className="p-4 border-t border-gray-100">
                  <button className="w-full bg-black text-white py-3 rounded-xl font-bold flex items-center justify-center space-x-2 active:scale-95 transition-transform">
                    <Truck className="w-4 h-4" />
                    <span>Track Order</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderHistoryView;