import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, Truck, MapPin, Calendar, AlertCircle, CheckCircle } from 'lucide-react';

interface DeliveryCalendarProps {
  onDateTimeSelect: (date: string, timeSlot: string, isSameDay: boolean, price: number) => void;
  selectedDate?: string;
  selectedTimeSlot?: string;
  orderTotal: number;
}

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
  price: number;
  label: string;
  isSameDay?: boolean;
}

const DeliveryCalendar: React.FC<DeliveryCalendarProps> = ({
  onDateTimeSelect,
  selectedDate = '',
  selectedTimeSlot = '',
  orderTotal
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string>(selectedDate || new Date().toISOString().split('T')[0]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [freeDeliveryThreshold] = useState(250);

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = currentDate.getMonth() === month;
      const isToday = currentDate.getTime() === today.getTime();
      const isAvailable = isCurrentMonth && currentDate >= today;
      const isPast = currentDate < today;
      
      days.push({
        date: currentDate,
        day: currentDate.getDate(),
        isCurrentMonth,
        isToday,
        isAvailable,
        isPast,
        dateString: currentDate.toISOString().split('T')[0]
      });
    }

    return days;
  };

  // Generate time slots based on selected date
  const generateTimeSlots = (dateString: string) => {
    const selectedDateObj = new Date(dateString);
    const today = new Date();
    const isToday = selectedDateObj.toDateString() === today.toDateString();
    const currentHour = today.getHours();
    const currentTime = today.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit', hour12: false});
    
    // Check if past the cutoff time (11:30 AM)
    const isPastCutoff = isToday && (
      (currentHour > 11) || 
      (currentHour === 11 && today.getMinutes() >= 30)
    );

    // Base time slots
    const slots: TimeSlot[] = [
      { 
        id: 'slot-12-15', 
        time: '12:00 PM - 3:00 PM', 
        available: !isPastCutoff, 
        price: orderTotal >= freeDeliveryThreshold ? 0 : 5, 
        label: 'Afternoon',
        isSameDay: isToday
      },
      { 
        id: 'slot-15-18', 
        time: '3:00 PM - 6:00 PM', 
        available: true, 
        price: orderTotal >= freeDeliveryThreshold ? 0 : 5, 
        label: 'Late Afternoon',
        isSameDay: isToday
      },
      { 
        id: 'slot-18-21', 
        time: '6:00 PM - 9:00 PM', 
        available: true, 
        price: orderTotal >= freeDeliveryThreshold ? 0 : 8, 
        label: 'Evening',
        isSameDay: isToday
      }
    ];

    // If it's today and past cutoff, disable same-day delivery
    if (isToday && isPastCutoff) {
      slots.forEach(slot => {
        if (slot.isSameDay) {
          slot.available = false;
        }
      });
    }

    return slots;
  };

  useEffect(() => {
    if (selectedDay) {
      const slots = generateTimeSlots(selectedDay);
      setTimeSlots(slots);
    }
  }, [selectedDay, orderTotal]);

  const handleDateSelect = (dateString: string) => {
    setSelectedDay(dateString);
    // Clear time slot selection when date changes
    if (dateString !== selectedDate) {
      onDateTimeSelect(dateString, '', false, 0);
    }
  };

  const handleTimeSlotSelect = (timeSlot: TimeSlot) => {
    if (selectedDay && timeSlot.available) {
      onDateTimeSelect(selectedDay, timeSlot.time, !!timeSlot.isSameDay, timeSlot.price);
    }
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const calendarDays = generateCalendarDays();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const isCutoffPassed = () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    if (selectedDay !== today) return false;
    
    const hour = now.getHours();
    const minutes = now.getMinutes();
    
    // Cutoff is 11:30 AM
    return hour > 11 || (hour === 11 && minutes >= 30);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Choose Delivery Date</h2>
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-600" />
          <p className="text-sm text-gray-600">Select a delivery date and time</p>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {/* Calendar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <button 
            onClick={prevMonth}
            className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center active:scale-95 transition-transform"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          
          <h3 className="font-bold text-gray-900">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
          
          <button 
            onClick={nextMonth}
            className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center active:scale-95 transition-transform"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {dayNames.map((day) => (
            <div key={day} className="p-2 text-center text-xs font-bold text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => (
            <button
              key={index}
              onClick={() => day.isAvailable && handleDateSelect(day.dateString)}
              disabled={!day.isAvailable}
              className={`
                aspect-square p-2 text-sm font-medium transition-all duration-200 relative
                ${!day.isCurrentMonth ? 'text-gray-300' : ''}
                ${day.isToday ? 'bg-blue-50 text-blue-600 font-bold' : ''}
                ${day.isAvailable ? 'hover:bg-gray-50' : 'cursor-not-allowed'}
                ${selectedDay === day.dateString ? 'bg-black text-white' : ''}
                ${day.isPast ? 'text-gray-300' : ''}
              `}
            >
              {day.day}
              {day.isToday && (
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Cutoff Warning */}
      {isCutoffPassed() && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 animate-fade-in">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-bold text-yellow-900 mb-1">Cutoff Time Passed</h4>
              <p className="text-sm text-yellow-700">
                Today's same-day delivery is no longer available as it's past 11:30 AM.
                Please select another delivery time or date.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Time Slots */}
      {selectedDay && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-600" />
            <h3 className="font-bold text-gray-900">Choose Time Slot</h3>
          </div>
          
          <div className="space-y-3">
            {timeSlots.map((slot) => (
              <button
                key={slot.id}
                onClick={() => slot.available && handleTimeSlotSelect(slot)}
                disabled={!slot.available}
                className={`
                  w-full p-4 rounded-xl border-2 transition-all duration-200 text-left
                  ${selectedTimeSlot === slot.time ? 'border-black bg-black text-white' : 
                    slot.available ? 'border-gray-200 bg-white hover:border-gray-300' : 
                    'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'}
                `}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold">{slot.label}</div>
                    <div className="text-sm opacity-80">{slot.time}</div>
                    {slot.isSameDay && slot.available && (
                      <div className={`text-xs mt-1 ${selectedTimeSlot === slot.time ? 'text-green-200' : 'text-green-600'} font-bold`}>
                        Same-day delivery
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    {slot.price === 0 ? (
                      <span className={`text-sm font-bold ${selectedTimeSlot === slot.time ? 'text-green-200' : 'text-green-600'}`}>
                        Free
                      </span>
                    ) : (
                      <span className="text-sm font-bold">+${slot.price}</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-bold text-blue-900 mb-1">Delivery Hours</h4>
                <p className="text-sm text-blue-700">
                  All deliveries start from 12:00 PM. Evening slots have additional fees.
                  Free delivery on orders above $250.
                </p>
              </div>
            </div>
          </div>

          {/* Selected Summary */}
          {selectedTimeSlot && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 animate-fade-in">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Truck className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <div className="font-bold text-green-900">
                    {formatDate(selectedDay)}
                  </div>
                  <div className="text-sm text-green-700">{selectedTimeSlot}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Free delivery threshold notice */}
      {orderTotal < freeDeliveryThreshold && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mt-4">
          <div className="flex items-start space-x-3">
            <MapPin className="w-5 h-5 text-purple-600 mt-0.5" />
            <div>
              <h4 className="font-bold text-purple-900 mb-1">Free Delivery</h4>
              <p className="text-sm text-purple-700">
                Add ${(freeDeliveryThreshold - orderTotal).toFixed(0)} more to your order for free delivery
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Already eligible for free delivery */}
      {orderTotal >= freeDeliveryThreshold && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mt-4">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-bold text-green-900 mb-1">Free Delivery</h4>
              <p className="text-sm text-green-700">
                Your order qualifies for free delivery
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryCalendar;