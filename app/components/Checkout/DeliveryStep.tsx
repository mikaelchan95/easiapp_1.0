import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CalendarView from './CalendarView';
import TimeSlots from './TimeSlots';
import { DeliveryAddress, DeliverySlot } from './CheckoutScreen';
import { COLORS } from '../../utils/theme';

interface DeliveryStepProps {
  address: DeliveryAddress;
  onSelectSlot: (slot: DeliverySlot) => void;
  subtotal: number;
}

const DeliveryStep: React.FC<DeliveryStepProps> = ({
  address,
  onSelectSlot,
  subtotal
}) => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [selectedTimeText, setSelectedTimeText] = useState<string>('');
  const [queueCount, setQueueCount] = useState<number>(0);
  const [isSameDay, setIsSameDay] = useState<boolean>(false);
  
  // Delivery fee calculation - memoized to prevent recalculation
  const deliveryFeeData = useMemo(() => {
    const FREE_DELIVERY_THRESHOLD = 250;
    const isFreeDelivery = subtotal >= FREE_DELIVERY_THRESHOLD;
    const standardDeliveryFee = 9.99;
    const sameDayDeliveryFee = 19.99;
    const deliveryFee = isFreeDelivery ? 0 : (isSameDay ? sameDayDeliveryFee : standardDeliveryFee);
    
    return {
      isFreeDelivery,
      standardDeliveryFee,
      sameDayDeliveryFee,
      deliveryFee
    };
  }, [subtotal, isSameDay]);
  
  // Check if the selected date is today (same day delivery)
  useEffect(() => {
    if (selectedDate) {
      const today = new Date().toISOString().split('T')[0];
      setIsSameDay(selectedDate === today);
      
      // Reset time slot if we change the date
      setSelectedTimeSlot(null);
      setSelectedTimeText('');
      setQueueCount(0);
    }
  }, [selectedDate]);
  
  // Handle date selection - use callback to prevent recreation
  const handleSelectDate = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);
  
  // Handle time slot selection - use callback to prevent recreation
  const handleSelectTimeSlot = useCallback((timeSlotId: string, timeSlot: string, queue: number) => {
    setSelectedTimeSlot(timeSlotId);
    setSelectedTimeText(timeSlot);
    setQueueCount(queue);
  }, []);
  
  // When both date and time slot are selected, notify parent - with proper dependencies
  useEffect(() => {
    if (selectedDate && selectedTimeSlot) {
      // Format the date for display
      const dateObj = new Date(selectedDate);
      const formattedDate = dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      });
      
      const slot: DeliverySlot = {
        id: `${selectedDate}-${selectedTimeSlot}`,
        date: formattedDate,
        timeSlot: selectedTimeText,
        queueCount: queueCount,
        sameDayAvailable: isSameDay,
        price: deliveryFeeData.deliveryFee
      };
      
      onSelectSlot(slot);
    }
  }, [selectedDate, selectedTimeSlot, selectedTimeText, queueCount, isSameDay, deliveryFeeData.deliveryFee, onSelectSlot]);
  
  // Memoize the address display to prevent unnecessary re-renders
  const addressDisplay = useMemo(() => {
    return (
      <View style={styles.addressCard}>
        <View style={styles.addressHeader}>
          <Ionicons name="location" size={20} color={COLORS.text} />
          <Text style={styles.addressTitle}>Delivering to</Text>
        </View>
        
        <View style={styles.addressContent}>
          <Text style={styles.addressName}>{address.name}</Text>
          <Text style={styles.addressText}>
            {address.street}{address.unit ? `, ${address.unit}` : ''}
          </Text>
          <Text style={styles.addressText}>
            {address.city}, {address.postalCode}
          </Text>
          <Text style={styles.addressText}>{address.phone}</Text>
        </View>
      </View>
    );
  }, [address]);
  
  // Memoize the delivery fee display to prevent unnecessary re-renders
  const deliveryFeeDisplay = useMemo(() => {
    const { isFreeDelivery, standardDeliveryFee, sameDayDeliveryFee } = deliveryFeeData;
    
    return (
      <View style={styles.feeContainer}>
        <Text style={styles.feeTitle}>Delivery Fees</Text>
        
        <View style={styles.feeRow}>
          <View style={styles.feeInfo}>
            <Text style={styles.feeName}>Standard Delivery</Text>
            <Text style={styles.feeDescription}>
              {isFreeDelivery ? 'Free for orders over $250' : `$${standardDeliveryFee.toFixed(2)}`}
            </Text>
          </View>
          
          {isFreeDelivery && (
            <View style={styles.feeBadge}>
              <Text style={styles.feeBadgeText}>FREE</Text>
            </View>
          )}
        </View>
        
        <View style={styles.feeRow}>
          <View style={styles.feeInfo}>
            <Text style={styles.feeName}>Same-Day Delivery</Text>
            <Text style={styles.feeDescription}>
              {isFreeDelivery ? 'Available today before 9pm' : `$${sameDayDeliveryFee.toFixed(2)}`}
            </Text>
          </View>
          
          {isSameDay && isFreeDelivery && (
            <View style={styles.feeBadge}>
              <Text style={styles.feeBadgeText}>FREE</Text>
            </View>
          )}
        </View>
      </View>
    );
  }, [deliveryFeeData, isSameDay]);
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Address Summary */}
      {addressDisplay}
      
      {/* Calendar View */}
      <Text style={styles.sectionTitle}>Select Delivery Date</Text>
      <CalendarView 
        onSelectDate={handleSelectDate}
        selectedDate={selectedDate}
      />
      
      {/* Time Slots */}
      {selectedDate && (
        <TimeSlots 
          selectedTimeSlot={selectedTimeSlot}
          onSelectTimeSlot={handleSelectTimeSlot}
          isSameDay={isSameDay}
        />
      )}
      
      {/* Delivery Fee Info */}
      {deliveryFeeDisplay}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 16,
    marginLeft: 16,
    marginBottom: 0,
  },
  addressCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    margin: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 8,
  },
  addressContent: {
    paddingLeft: 28,
  },
  addressName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: COLORS.inactive,
    lineHeight: 20,
  },
  feeContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    margin: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  feeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  feeInfo: {
    flex: 1,
  },
  feeName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  feeDescription: {
    fontSize: 13,
    color: COLORS.inactive,
  },
  feeBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  feeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4CAF50',
  },
});

export default DeliveryStep; 