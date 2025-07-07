import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CalendarView from './CalendarView';
import TimeSlots from './TimeSlots';
import { DeliveryAddress, DeliverySlot } from './CheckoutScreen';
import { COLORS } from '../../utils/theme';
import { GoogleMapsService } from '../../services/googleMapsService';
import { GOOGLE_MAPS_CONFIG } from '../../config/googleMaps';

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
  
  // Check if the address is in a special location using Google Maps service
  const deliveryZoneInfo = useMemo(() => {
    // Try to create a coordinate from the address for checking
    // In a real implementation, you might geocode the address first
    // For now, we'll check if it's a known Marina Bay area location
    const marinaBayKeywords = ['Marina Bay', 'Marina', 'Gardens by the Bay', 'Raffles', 'Downtown Core'];
    const isMarinaBayArea = marinaBayKeywords.some(keyword => 
      address.street?.includes(keyword) || address.city?.includes(keyword)
    );

    if (isMarinaBayArea) {
      // Find the Marina Bay zone from config
      const marinaBayZone = GOOGLE_MAPS_CONFIG.deliveryZones.find(zone => 
        zone.name === 'Marina Bay' || zone.specialPricing
      );
      
      return {
        isSpecialLocation: true,
        zone: marinaBayZone,
        zoneName: 'Marina Bay'
      };
    }

    return {
      isSpecialLocation: false,
      zone: null,
      zoneName: null
    };
  }, [address]);
  
  // Delivery fee calculation - memoized to prevent recalculation
  const deliveryFeeData = useMemo(() => {
    const { isSpecialLocation, zone } = deliveryZoneInfo;
    
    // Use zone-specific pricing if available
    const FREE_DELIVERY_THRESHOLD = isSpecialLocation ? 200 : 250;
    const isFreeDelivery = subtotal >= FREE_DELIVERY_THRESHOLD;
    
    // Special pricing for Marina Bay and other special zones
    const standardDeliveryFee = isSpecialLocation ? 7.99 : 9.99;
    const sameDayDeliveryFee = isSpecialLocation ? 14.99 : 19.99;
    const deliveryFee = isFreeDelivery ? 0 : (isSameDay ? sameDayDeliveryFee : standardDeliveryFee);
    
    return {
      isFreeDelivery,
      standardDeliveryFee,
      sameDayDeliveryFee,
      deliveryFee,
      thresholdAmount: FREE_DELIVERY_THRESHOLD,
      isSpecialLocation,
      zoneName: deliveryZoneInfo.zoneName
    };
  }, [subtotal, isSameDay, deliveryZoneInfo]);
  
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
        price: deliveryFeeData.deliveryFee,
        isSpecialLocation: deliveryFeeData.isSpecialLocation
      };
      
      onSelectSlot(slot);
    }
  }, [selectedDate, selectedTimeSlot, selectedTimeText, queueCount, isSameDay, deliveryFeeData.deliveryFee, deliveryFeeData.isSpecialLocation, onSelectSlot]);
  
  // Memoize the address display to prevent unnecessary re-renders
  const addressDisplay = useMemo(() => {
    const { isSpecialLocation, zoneName } = deliveryFeeData;
    
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
          
          {isSpecialLocation && zoneName && (
            <View style={styles.specialLocationBadge}>
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text style={styles.specialLocationText}>{zoneName} Area</Text>
            </View>
          )}
        </View>
      </View>
    );
  }, [address, deliveryFeeData]);
  
  // Memoize the delivery fee display to prevent unnecessary re-renders
  const deliveryFeeDisplay = useMemo(() => {
    const { isFreeDelivery, standardDeliveryFee, sameDayDeliveryFee, thresholdAmount, isSpecialLocation, zoneName } = deliveryFeeData;
    
    return (
      <View style={styles.feeContainer}>
        <Text style={styles.feeTitle}>Delivery Fees</Text>
        
        <View style={styles.feeRow}>
          <View style={styles.feeInfo}>
            <Text style={styles.feeName}>Standard Delivery</Text>
            <Text style={styles.feeDescription}>
              {isFreeDelivery ? `Free for orders over $${thresholdAmount}` : `$${standardDeliveryFee.toFixed(2)}`}
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
        
        {isSpecialLocation && zoneName && (
          <View style={styles.specialNotice}>
            <Ionicons name="information-circle" size={16} color="#4A90E2" style={styles.noticeIcon} />
            <Text style={styles.noticeText}>
              {zoneName} area receives priority delivery service with lower fees and extended hours.
            </Text>
          </View>
        )}
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
          isSpecialLocation={deliveryFeeData.isSpecialLocation}
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
  specialLocationBadge: {
    backgroundColor: '#FFD700',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 4,
  },
  specialLocationText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
  },
  specialNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  noticeIcon: {
    marginRight: 8,
  },
  noticeText: {
    fontSize: 13,
    color: COLORS.text,
  },
});

export default DeliveryStep; 