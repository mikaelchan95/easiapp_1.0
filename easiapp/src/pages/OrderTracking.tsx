import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bell, Share2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import OrderStatusFeed from '../components/Mobile/OrderStatusFeed';
import FloatingNavigation from '../components/Mobile/FloatingNavigation';
import { Order } from '../types';

interface OrderTrackingProps {
  orderId: string;
  onBack: () => void;
}

const OrderTracking: React.FC<OrderTrackingProps> = ({ orderId, onBack }) => {
  const { state, dispatch, getCartItemCount } = useApp();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    findOrder();
  }, [orderId]);

  const findOrder = () => {
    const foundOrder = state.orders.find(o => o.id === orderId);
    setOrder(foundOrder || null);
    setLoading(false);
  };

  const handleStatusUpdate = (orderId: string, status: string) => {
    dispatch({
      type: 'UPDATE_ORDER_STATUS',
      payload: { orderId, status: status as any }
    });
    
    // Update local state
    if (order) {
      setOrder({
        ...order,
        status: status as any,
        statusTimestamps: {
          ...order.statusTimestamps,
          [status]: new Date().toISOString()
        }
      });
    }
  };

  const handleNavigationClick = (item: string) => {
    switch (item) {
      case 'Home':
        onBack();
        break;
      default:
        break;
    }
  };

  const shareOrder = () => {
    if (navigator.share && order) {
      navigator.share({
        title: `Order ${order.id}`,
        text: `Tracking my order from EASI`,
        url: window.location.href
      });
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen w-full max-w-sm mx-auto">
        <div className="flex items-center justify-center h-screen">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-gray-50 min-h-screen w-full max-w-sm mx-auto">
        <div className="sticky top-0 z-30 bg-white border-b border-gray-100">
          <div className="px-4 py-4 flex items-center space-x-3">
            <button 
              onClick={onBack}
              className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4 text-gray-700" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">Order Not Found</h1>
          </div>
        </div>
        
        <div className="flex flex-col items-center justify-center px-8 py-20">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <span className="text-2xl">📦</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 text-center">
            The order you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen w-full max-w-sm mx-auto relative">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-lg border-b border-gray-100">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button 
                onClick={onBack}
                className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center"
              >
                <ArrowLeft className="w-4 h-4 text-gray-700" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Order Tracking</h1>
                <p className="text-sm text-gray-500">{order.id}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button 
                onClick={shareOrder}
                className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center"
              >
                <Share2 className="w-4 h-4 text-gray-700" />
              </button>
              <button className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                <Bell className="w-4 h-4 text-gray-700" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="overflow-y-auto pb-24 scrollbar-hide">
        <div className="px-4 py-6">
          <OrderStatusFeed 
            order={order} 
            onStatusUpdate={handleStatusUpdate}
          />
        </div>
      </div>

      {/* Floating Navigation */}
      <FloatingNavigation 
        onNavigationClick={handleNavigationClick}
        cartCount={getCartItemCount()}
      />
    </div>
  );
};

export default OrderTracking;