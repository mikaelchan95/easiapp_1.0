import React, { useEffect } from 'react';
import OrderSuccessComponent from '../Success/OrderSuccess';
import { useNavigationControl } from '../../hooks/useNavigationControl';

interface OrderSuccessProps {
  orderId: string;
  onContinueShopping: () => void;
  onViewOrders: () => void;
}

const OrderSuccess: React.FC<OrderSuccessProps> = (props) => {
  // Hide navigation for this view
  useNavigationControl();
  
  return <OrderSuccessComponent {...props} />;
};

export default OrderSuccess;