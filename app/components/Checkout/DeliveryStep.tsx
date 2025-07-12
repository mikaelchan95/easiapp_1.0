import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CalendarView from './CalendarView';
import TimeSlots from './TimeSlots';
import { DeliveryAddress, DeliverySlot } from '../../types/checkout';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../../utils/theme';
import { GoogleMapsService } from '../../services/googleMapsService';
import { GOOGLE_MAPS_CONFIG } from '../../config/googleMaps';
import { HapticFeedback } from '../../utils/haptics';

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
  
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];
  const cardScaleAnim = useState(new Animated.Value(0.95))[0];
  
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
  
  // Mount animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(cardScaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 150,
        friction: 8,
      }),
    ]).start();
  }, []);
  
  // Memoize the address display to prevent unnecessary re-renders
  const addressDisplay = useMemo(() => {
    const { isSpecialLocation, zoneName } = deliveryFeeData;
    
    return (
      <Animated.View 
        style={[
          styles.addressCard,
          {
            opacity: fadeAnim,
            transform: [{ scale: cardScaleAnim }]
          }
        ]}
      >
        <View style={styles.addressHeader}>
          <View style={styles.addressIconContainer}>
            <Ionicons name="location" size={18} color={COLORS.card} />
          </View>
          <View style={styles.addressHeaderContent}>
            <View style={styles.titleRow}>
              <Text style={styles.addressTitle}>Delivering to</Text>
              <TouchableOpacity style={styles.editButton}>
                <Ionicons name="pencil" size={14} color={COLORS.text} />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
            {isSpecialLocation && zoneName && (
              <View style={styles.specialLocationBadge}>
                <Ionicons name="star" size={10} color="#FF9500" />
                <Text style={styles.specialLocationText}>{zoneName}</Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.addressContent}>
          <Text style={styles.addressName}>{address.name}</Text>
          <Text style={styles.addressText}>
            {address.street}{address.unit ? `, ${address.unit}` : ''}
          </Text>
          <Text style={styles.addressText}>
            {address.city}, {address.postalCode}
          </Text>
          <Text style={styles.addressPhone}>{address.phone}</Text>
        </View>
      </Animated.View>
    );
  }, [address, deliveryFeeData]);
  
  // Memoize the delivery fee display to prevent unnecessary re-renders
  const deliveryFeeDisplay = useMemo(() => {
    const { isFreeDelivery, standardDeliveryFee, sameDayDeliveryFee, thresholdAmount, isSpecialLocation, zoneName } = deliveryFeeData;
    
    return (
      <Animated.View 
        style={[
          styles.feeContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: cardScaleAnim }]
          }
        ]}
      >
        <View style={styles.feeHeader}>
          <View style={styles.feeIconContainer}>
            <Ionicons name="car-sport" size={24} color={COLORS.text} />
          </View>
          <View style={styles.feeHeaderContent}>
            <Text style={styles.feeTitle}>Delivery Information</Text>
            <Text style={styles.feeSubtitle}>Pricing and availability</Text>
          </View>
        </View>
        
        <View style={styles.feeRow}>
          <View style={styles.feeInfo}>
            <Text style={styles.feeName}>Standard Delivery</Text>
            <Text style={styles.feeDescription}>
              {isFreeDelivery ? `Free for orders over $${thresholdAmount}` : 'Next day delivery'}
            </Text>
          </View>
          
          <View style={styles.feePriceContainer}>
            {isFreeDelivery ? (
              <View style={styles.feeBadge}>
                <Text style={styles.feeBadgeText}>FREE</Text>
              </View>
            ) : (
              <Text style={styles.feePrice}>${standardDeliveryFee.toFixed(2)}</Text>
            )}
          </View>
        </View>
        
        <View style={styles.feeRow}>
          <View style={styles.feeInfo}>
            <Text style={styles.feeName}>Same-Day Delivery</Text>
            <Text style={styles.feeDescription}>
              {isFreeDelivery ? 'Available today before 9pm' : 'Order by 2pm for same day'}
            </Text>
          </View>
          
          <View style={styles.feePriceContainer}>
            {isSameDay && isFreeDelivery ? (
              <View style={styles.feeBadge}>
                <Text style={styles.feeBadgeText}>FREE</Text>
              </View>
            ) : (
              <Text style={styles.feePrice}>${sameDayDeliveryFee.toFixed(2)}</Text>
            )}
          </View>
        </View>
        
        {isSpecialLocation && zoneName && (
          <View style={styles.specialNotice}>
            <Ionicons name="star" size={16} color="#FFD700" style={styles.noticeIcon} />
            <Text style={styles.noticeText}>
              {zoneName} area receives priority delivery with special pricing.
            </Text>
          </View>
        )}
      </Animated.View>
    );
  }, [deliveryFeeData, isSameDay]);
  
  return (
    <View style={styles.container}>
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }}
      >
        {/* Address Summary */}
        {addressDisplay}
        
        {/* Calendar Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <Text style={styles.sectionSubtitle}>Choose your preferred delivery date</Text>
          <View style={styles.calendarContainer}>
            <CalendarView 
              onSelectDate={handleSelectDate}
              selectedDate={selectedDate}
            />
          </View>
        </View>
        
        {/* Time Slots - only show if date is selected */}
        {selectedDate && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Available Time Slots</Text>
              {isSameDay && (
                <View style={styles.sameDayBadge}>
                  <Ionicons name="flash" size={14} color={COLORS.card} />
                  <Text style={styles.sameDayText}>Same-day</Text>
                </View>
              )}
            </View>
            <Text style={styles.sectionSubtitle}>Select your preferred delivery window</Text>
            
            {/* Delivery Time Estimate */}
            <View style={styles.deliveryEstimate}>
              <View style={styles.estimateHeader}>
                <Ionicons name="time-outline" size={20} color={COLORS.text} />
                <Text style={styles.estimateTitle}>Estimated Delivery Time</Text>
              </View>
              <Text style={styles.estimateText}>
                {isSameDay ? 'Today' : 'Tomorrow'} • {selectedTimeText || 'Select time slot'}
              </Text>
              {selectedTimeSlot && (
                <Text style={styles.estimateSubtext}>
                  Your order will be delivered within the selected time window
                </Text>
              )}
            </View>
            
            <TimeSlots 
              selectedTimeSlot={selectedTimeSlot}
              onSelectTimeSlot={handleSelectTimeSlot}
              isSameDay={isSameDay}
              isSpecialLocation={deliveryFeeData.isSpecialLocation}
            />
          </View>
        )}
        
        {/* Delivery Fee Info */}
        {deliveryFeeDisplay}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
  },
  title: {
    ...TYPOGRAPHY.h1,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
    fontWeight: '500',
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    fontWeight: '700',
    color: COLORS.text,
  },
  sectionSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    fontWeight: '500',
  },
  sameDayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.text,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
  },
  sameDayText: {
    ...TYPOGRAPHY.small,
    color: COLORS.card,
    fontWeight: '700',
    marginLeft: 4,
  },
  addressCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.light,
    elevation: 3,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  addressIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.text,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  addressHeaderContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  addressTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: COLORS.text,
  },
  addressContent: {
    gap: 2,
  },
  addressName: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  addressText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    lineHeight: 18,
    fontWeight: '500',
  },
  addressPhone: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  feeContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: SPACING.lg,
    marginTop: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
    elevation: 6,
  },
  feeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  feeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  feeHeaderContent: {
    flex: 1,
  },
  feeTitle: {
    ...TYPOGRAPHY.h4,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  feeSubtitle: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  feeInfo: {
    flex: 1,
  },
  feeName: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  feeDescription: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  feePriceContainer: {
    alignItems: 'flex-end',
  },
  feePrice: {
    ...TYPOGRAPHY.h4,
    fontWeight: '700',
    color: COLORS.text,
  },
  feeBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  feeBadgeText: {
    ...TYPOGRAPHY.small,
    fontWeight: '800',
    color: '#4CAF50',
  },
  specialLocationBadge: {
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE0B2',
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  specialLocationText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: '#FF9500',
    marginLeft: 2,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  editButtonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    fontWeight: '600',
    marginLeft: 2,
  },
  specialNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    padding: SPACING.sm,
    backgroundColor: '#FFF9C4',
    borderRadius: 12,
  },
  noticeIcon: {
    marginRight: SPACING.sm,
  },
  noticeText: {
    ...TYPOGRAPHY.small,
    color: '#F57C00',
    fontWeight: '600',
    flex: 1,
  },
  calendarContainer: {
    marginHorizontal: 0, // Keep normal padding for consistency
  },
  deliveryEstimate: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.light,
  },
  estimateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  estimateTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },
  estimateText: {
    ...TYPOGRAPHY.h4,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  estimateSubtext: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});

export default DeliveryStep; 