import React, { useState, useEffect } from 'react';
import { Clock, Truck, AlertCircle, CheckCircle } from 'lucide-react';
import { deliveryService } from '../../services/deliveryService';
import { CartItem } from '../../types';

interface SameDayToggleProps {
  cartItems: CartItem[];
  postalCode: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

const SameDayToggle: React.FC<SameDayToggleProps> = ({
  cartItems,
  postalCode,
  enabled,
  onToggle
}) => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [cutoffTime, setCutoffTime] = useState<string | null>(null);
  const [timeUntilCutoff, setTimeUntilCutoff] = useState<string>('');
  const [eligibilityIssues, setEligibilityIssues] = useState<string[]>([]);

  useEffect(() => {
    checkEligibility();
    const interval = setInterval(checkEligibility, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [cartItems, postalCode]);

  const checkEligibility = () => {
    const issues: string[] = [];
    
    // Check postal code eligibility
    const sameDayAvailable = deliveryService.isSameDayAvailable(postalCode);
    if (!sameDayAvailable) {
      issues.push('Same-day delivery not available in your area');
    }

    // Check item eligibility
    const itemsEligible = deliveryService.areItemsSameDayEligible(cartItems);
    if (!itemsEligible) {
      const ineligibleItems = cartItems.filter(item => item.product.sameDayEligible === false);
      issues.push(`${ineligibleItems.length} item(s) not eligible for same-day delivery`);
    }

    // Get cutoff time and check if passed
    const cutoff = deliveryService.getCutoffTime(postalCode);
    if (cutoff) {
      const timeLeft = deliveryService.formatTimeUntilCutoff(cutoff);
      if (timeLeft.includes('Cutoff passed')) {
        issues.push('Cutoff time has passed for today');
      } else {
        setTimeUntilCutoff(timeLeft);
      }
    }

    setIsAvailable(issues.length === 0);
    setCutoffTime(cutoff);
    setEligibilityIssues(issues);

    // Disable if not available
    if (issues.length > 0 && enabled) {
      onToggle(false);
    }
  };

  if (!isAvailable) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Same-Day Delivery Unavailable</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              {eligibilityIssues.map((issue, index) => (
                <li key={index}>• {issue}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`border-2 rounded-2xl p-4 transition-all duration-300 ${
      enabled 
        ? 'border-green-500 bg-green-50' 
        : 'border-gray-200 bg-white hover:border-gray-300'
    }`}>
      <div className="flex items-start space-x-3">
        <button
          onClick={() => onToggle(!enabled)}
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
            enabled 
              ? 'border-green-500 bg-green-500' 
              : 'border-gray-300 hover:border-green-400'
          }`}
        >
          {enabled && <CheckCircle className="w-4 h-4 text-white" />}
        </button>
        
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <Truck className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-gray-900">Same-Day Delivery</h3>
          </div>
          
          <p className="text-sm text-gray-600 mb-3">
            Order before {cutoffTime} for delivery by 6 PM today
          </p>
          
          {/* Cutoff Timer */}
          <div className="flex items-center space-x-2 bg-white rounded-xl p-3 border border-gray-200">
            <Clock className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-semibold text-gray-900">
              {timeUntilCutoff}
            </span>
          </div>
          
          {enabled && (
            <div className="mt-3 p-3 bg-green-100 rounded-xl border border-green-200">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-green-800">
                  Your order will go out for delivery by 12 PM
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SameDayToggle;