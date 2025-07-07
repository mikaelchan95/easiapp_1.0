import React from 'react';
import { MapPin } from 'lucide-react';
import { DeliverySlot } from '../../types/cart';
import DeliveryCalendar from '../Mobile/DeliveryCalendar';

interface DeliveryStepProps {
  deliverySlots: DeliverySlot[];
  selectedSlot: DeliverySlot | null;
  onSelectSlot: (slot: DeliverySlot) => void;
  orderTotal: number;
  address: any;
}

const DeliveryStep: React.FC<DeliveryStepProps> = ({ 
  deliverySlots, 
  selectedSlot, 
  onSelectSlot,
  orderTotal,
  address
}) => {
  const handleDateTimeSelect = (date: string, timeSlot: string, isSameDay: boolean, price: number) => {
    if (date && timeSlot) {
      const selectedDateObj = new Date(date);
      const formattedDate = selectedDateObj.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'long', 
        day: 'numeric' 
      });
      
      // Create a new delivery slot with the selected date and time
      const newSlot: DeliverySlot = {
        id: `${date}-${timeSlot}`,
        date: formattedDate,
        timeSlot: timeSlot,
        price: price,
        label: isSameDay ? 'Same Day' : 'Scheduled',
      };
      
      onSelectSlot(newSlot);
    }
  };

  return (
    <div className="px-4 py-6 animate-fade-in">
      {/* Delivery Address Summary */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 mb-6">
        <div className="flex items-start space-x-3">
          <MapPin className="w-5 h-5 text-gray-600 mt-0.5" />
          <div>
            <h3 className="font-bold text-gray-900 mb-1">Delivery Address</h3>
            <p className="text-gray-700 text-sm">
              {address.street}{address.unit ? `, ${address.unit}` : ''}<br />
              {address.postalCode}, {address.city}
            </p>
          </div>
        </div>
      </div>
      
      {/* Calendar and Time Slot Selection */}
      <DeliveryCalendar
        onDateTimeSelect={handleDateTimeSelect}
        selectedDate={selectedSlot?.id?.split('-')[0]}
        selectedTimeSlot={selectedSlot?.timeSlot}
        orderTotal={orderTotal}
      />
    </div>
  );
};

export default DeliveryStep;