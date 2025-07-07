import React, { useState, useEffect } from 'react';
import { Clock, Truck, CheckCircle, MapPin, Phone, Package, ShieldCheck, User } from 'lucide-react';
import { Order } from '../../types';
import { notificationService } from '../../services/notificationService';

interface OrderStatusFeedProps {
  order: Order;
  onStatusUpdate?: (orderId: string, status: string) => void;
}

interface StatusStep {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  timestamp?: string;
  completed: boolean;
  current: boolean;
}

const OrderStatusFeed: React.FC<OrderStatusFeedProps> = ({ order, onStatusUpdate }) => {
  const [currentStatus, setCurrentStatus] = useState(order.status);
  const [statusHistory, setStatusHistory] = useState<{ status: string; timestamp: string }[]>([]);

  useEffect(() => {
    // Subscribe to order notifications
    notificationService.subscribeToOrder(order.id, order.userId);

    // Request notification permission
    notificationService.requestPermission();

    // Simulate status updates for same-day orders
    if (order.sameDay && order.status === 'pending') {
      simulateStatusUpdates();
    }

    // Build initial status history
    buildStatusHistory();
  }, []);

  const simulateStatusUpdates = () => {
    // Simulate processing after 5 seconds
    setTimeout(() => {
      updateOrderStatus('processing');
    }, 5000);

    // Simulate out for delivery after 30 seconds (for demo - would be based on actual delivery times)
    setTimeout(() => {
      updateOrderStatus('outForDelivery');
      notificationService.notifyOrderStatus(order.id, 'outForDelivery', order.id);
    }, 30000);
  };

  const updateOrderStatus = (newStatus: string) => {
    setCurrentStatus(newStatus);
    const timestamp = new Date().toISOString();
    
    setStatusHistory(prev => [...prev, { status: newStatus, timestamp }]);
    
    if (onStatusUpdate) {
      onStatusUpdate(order.id, newStatus);
    }
  };

  const buildStatusHistory = () => {
    const history: { status: string; timestamp: string }[] = [];
    
    history.push({ status: 'pending', timestamp: order.createdAt });
    
    if (order.statusTimestamps?.processing) {
      history.push({ status: 'processing', timestamp: order.statusTimestamps.processing });
    }
    
    if (order.statusTimestamps?.outForDelivery) {
      history.push({ status: 'outForDelivery', timestamp: order.statusTimestamps.outForDelivery });
    }
    
    if (order.statusTimestamps?.delivered) {
      history.push({ status: 'delivered', timestamp: order.statusTimestamps.delivered });
    }
    
    setStatusHistory(history);
  };

  const getStatusSteps = (): StatusStep[] => {
    const steps: StatusStep[] = [
      {
        id: 'pending',
        label: 'Order Received',
        description: 'We\'re preparing your order',
        icon: Package,
        completed: ['processing', 'outForDelivery', 'delivered'].includes(currentStatus),
        current: currentStatus === 'pending',
        timestamp: statusHistory.find(s => s.status === 'pending')?.timestamp
      },
      {
        id: 'processing',
        label: 'Order Processing',
        description: 'Items being packed',
        icon: Clock,
        completed: ['outForDelivery', 'delivered'].includes(currentStatus),
        current: currentStatus === 'processing',
        timestamp: statusHistory.find(s => s.status === 'processing')?.timestamp
      }
    ];

    if (order.sameDay) {
      steps.push({
        id: 'outForDelivery',
        label: 'Out for Delivery',
        description: 'Driver is on the way',
        icon: Truck,
        completed: currentStatus === 'delivered',
        current: currentStatus === 'outForDelivery',
        timestamp: statusHistory.find(s => s.status === 'outForDelivery')?.timestamp
      });
    } else {
      steps.push({
        id: 'shipped',
        label: 'Shipped',
        description: 'Package is in transit',
        icon: Truck,
        completed: currentStatus === 'delivered',
        current: currentStatus === 'shipped',
        timestamp: statusHistory.find(s => s.status === 'shipped')?.timestamp
      });
    }

    steps.push({
      id: 'delivered',
      label: 'Delivered',
      description: 'Order completed successfully',
      icon: CheckCircle,
      completed: currentStatus === 'delivered',
      current: currentStatus === 'delivered',
      timestamp: statusHistory.find(s => s.status === 'delivered')?.timestamp
    });

    return steps;
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return null;
    
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    }
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const statusSteps = getStatusSteps();
  const deliveryTime = order.deliverySlot?.timeSlot || (order.sameDay ? '6 PM - 9 PM' : '12 PM - 3 PM');

  return (
    <div className="space-y-6">
      {/* Current Status Card */}
      <div className={`rounded-2xl p-6 border-2 ${
        currentStatus === 'delivered' ? 'border-green-500 bg-green-50' :
        currentStatus === 'outForDelivery' ? 'border-blue-500 bg-blue-50' :
        'border-gray-200 bg-white'
      }`}>
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            currentStatus === 'delivered' ? 'bg-green-500' :
            currentStatus === 'outForDelivery' ? 'bg-blue-500' :
            'bg-gray-500'
          }`}>
            {currentStatus === 'delivered' ? (
              <CheckCircle className="w-6 h-6 text-white" />
            ) : currentStatus === 'outForDelivery' ? (
              <Truck className="w-6 h-6 text-white" />
            ) : (
              <Clock className="w-6 h-6 text-white" />
            )}
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">
              {currentStatus === 'delivered' ? 'Delivered' :
               currentStatus === 'outForDelivery' ? 'Out for Delivery' :
               currentStatus === 'processing' ? 'Processing' :
               'Order Received'}
            </h3>
            <p className="text-gray-600">
              {currentStatus === 'delivered' ? 'Your order has been delivered successfully' :
               currentStatus === 'outForDelivery' ? `Arriving between ${deliveryTime}` :
               currentStatus === 'processing' ? 'Your order is being prepared' :
               'We\'ve received your order and will process it soon'}
            </p>
          </div>
        </div>
      </div>

      {/* Delivery Info */}
      {order.sameDay && currentStatus !== 'delivered' && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <div className="flex items-start space-x-3">
            <Truck className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Same-Day Delivery</h4>
              <p className="text-sm text-blue-700">
                {currentStatus === 'outForDelivery' 
                  ? `Your order will arrive between ${deliveryTime}`
                  : 'Your order will go out for delivery shortly'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Age Verification Info */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
        <div className="flex items-start space-x-3">
          <ShieldCheck className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-yellow-900 mb-1">ID Verification</h4>
            <p className="text-sm text-yellow-700">
              Valid ID required for alcohol delivery
            </p>
          </div>
        </div>
      </div>

      {/* Status Timeline */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Order Progress</h3>
        <div className="space-y-4">
          {statusSteps.map((step, index) => {
            const IconComponent = step.icon;
            const isLast = index === statusSteps.length - 1;
            
            return (
              <div key={step.id} className="relative">
                <div className="flex items-start space-x-4">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                    step.completed ? 'bg-green-500' :
                    step.current ? 'bg-blue-500' :
                    'bg-gray-300'
                  }`}>
                    <IconComponent className={`w-5 h-5 ${
                      step.completed || step.current ? 'text-white' : 'text-gray-600'
                    }`} />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between">
                      <h4 className={`font-semibold ${
                        step.completed || step.current ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        {step.label}
                      </h4>
                      {step.timestamp && (
                        <span className="text-sm text-gray-500">
                          {formatTimestamp(step.timestamp)}
                        </span>
                      )}
                    </div>
                    <p className={`text-sm ${
                      step.completed || step.current ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      {step.description}
                    </p>
                  </div>
                </div>
                
                {/* Timeline line */}
                {!isLast && (
                  <div className={`absolute left-5 top-10 w-0.5 h-8 ${
                    step.completed ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Delivery Instructions */}
      {order.deliveryNotes && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
          <div className="flex items-start space-x-3">
            <User className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-yellow-900 mb-1">Delivery Instructions</h4>
              <p className="text-sm text-yellow-800">{order.deliveryNotes}</p>
            </div>
          </div>
        </div>
      )}

      {/* Contact Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
        <h4 className="font-semibold text-gray-900 mb-3">Need Help?</h4>
        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center space-x-2 bg-white border border-gray-200 rounded-xl p-3 hover:bg-gray-50 transition-colors active:scale-95">
            <Phone className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">Call Support</span>
          </button>
          <button className="flex items-center space-x-2 bg-white border border-gray-200 rounded-xl p-3 hover:bg-gray-50 transition-colors active:scale-95">
            <MapPin className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">Track Live</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderStatusFeed;