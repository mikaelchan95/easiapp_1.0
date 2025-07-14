import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
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
  onEditAddress?: () => void;
}

const DeliveryStep: React.FC<DeliveryStepProps> = ({
  address,
  onSelectSlot,
  subtotal,
  onEditAddress,
}) => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [selectedTimeText, setSelectedTimeText] = useState<string>('');
  const [queueCount, setQueueCount] = useState<number>(0);
  const [isSameDay, setIsSameDay] = useState<boolean>(false);

  // Use ref to store the callback to prevent infinite re-renders
  const onSelectSlotRef = useRef(onSelectSlot);
  onSelectSlotRef.current = onSelectSlot;

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];
  const cardScaleAnim = useState(new Animated.Value(0.95))[0];

  // Singapore-wide delivery - no special zones
  const deliveryZoneInfo = useMemo(() => {
    return {
      isSpecialLocation: false,
      zone: null,
      zoneName: null,
    };
  }, []);

  // Delivery fee calculation - standard Singapore pricing
  const deliveryFeeData = useMemo(() => {
    const FREE_DELIVERY_THRESHOLD = 250;
    const isFreeDelivery = subtotal >= FREE_DELIVERY_THRESHOLD;

    // Standard Singapore delivery pricing
    const standardDeliveryFee = 9.99;
    const sameDayDeliveryFee = 19.99;
    const deliveryFee = isFreeDelivery
      ? 0
      : isSameDay
        ? sameDayDeliveryFee
        : standardDeliveryFee;

    return {
      isFreeDelivery,
      standardDeliveryFee,
      sameDayDeliveryFee,
      deliveryFee,
      thresholdAmount: FREE_DELIVERY_THRESHOLD,
      isSpecialLocation: false,
      zoneName: null,
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
  const handleSelectTimeSlot = useCallback(
    (timeSlotId: string, timeSlot: string, queue: number) => {
      setSelectedTimeSlot(timeSlotId);
      setSelectedTimeText(timeSlot);
      setQueueCount(queue);
    },
    []
  );

  // When both date and time slot are selected, notify parent - with proper dependencies
  useEffect(() => {
    if (selectedDate && selectedTimeSlot) {
      // Format the date for display
      const dateObj = new Date(selectedDate);
      const formattedDate = dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });

      const slot: DeliverySlot = {
        id: `${selectedDate}-${selectedTimeSlot}`,
        date: formattedDate,
        timeSlot: selectedTimeText,
        fee: deliveryFeeData.deliveryFee,
        price: deliveryFeeData.deliveryFee,
        queueCount: queueCount,
        sameDayAvailable: isSameDay,
        isSpecialLocation: deliveryFeeData.isSpecialLocation,
        available: true,
        isFree: deliveryFeeData.isFreeDelivery,
      };

      onSelectSlotRef.current(slot);
    }
  }, [
    selectedDate,
    selectedTimeSlot,
    selectedTimeText,
    queueCount,
    isSameDay,
    deliveryFeeData.deliveryFee,
    deliveryFeeData.isSpecialLocation,
    deliveryFeeData.isFreeDelivery,
  ]);

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

  // Check if address is empty/default
  const isAddressEmpty = useMemo(() => {
    // Check if it's truly empty or just default empty strings
    // Less strict validation - only require name and address, postal code is optional
    const isEmpty =
      !address ||
      !address.address ||
      address.address.trim() === '' ||
      !address.name ||
      address.name.trim() === '';

    return isEmpty;
  }, [address]);

  // Memoize the address display to prevent unnecessary re-renders
  const addressDisplay = useMemo(() => {
    const { isSpecialLocation, zoneName } = deliveryFeeData;

    if (isAddressEmpty) {
      return (
        <Animated.View
          style={[
            styles.addressCard,
            styles.emptyAddressCard,
            {
              opacity: fadeAnim,
              transform: [{ scale: cardScaleAnim }],
            },
          ]}
        >
          <View style={styles.emptyAddressContent}>
            <Ionicons
              name="location-outline"
              size={48}
              color={COLORS.textSecondary}
            />
            <Text style={styles.emptyAddressTitle}>
              No delivery address set
            </Text>
            <Text style={styles.emptyAddressText}>
              Please select a delivery address to continue
            </Text>
            <TouchableOpacity
              style={styles.selectAddressButton}
              onPress={onEditAddress}
            >
              <Text style={styles.selectAddressButtonText}>Select Address</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      );
    }

    return (
      <Animated.View
        style={[
          styles.addressCard,
          {
            opacity: fadeAnim,
            transform: [{ scale: cardScaleAnim }],
          },
        ]}
      >
        <View style={styles.addressHeader}>
          <View style={styles.addressIconContainer}>
            <Ionicons name="location" size={18} color={COLORS.card} />
          </View>
          <View style={styles.addressHeaderContent}>
            <View style={styles.titleRow}>
              <Text style={styles.addressTitle}>Delivering to</Text>
              <TouchableOpacity
                style={styles.editButton}
                onPress={onEditAddress}
              >
                <Ionicons name="pencil" size={14} color={COLORS.text} />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.addressContent}>
          <Text style={styles.addressName}>{address.name}</Text>
          <Text style={styles.addressText}>
            {address.address}
            {address.unitNumber ? `, ${address.unitNumber}` : ''}
          </Text>
          <Text style={styles.addressText}>Singapore {address.postalCode}</Text>
          {address.phone && (
            <Text style={styles.addressPhone}>{address.phone}</Text>
          )}
        </View>
      </Animated.View>
    );
  }, [
    address,
    deliveryFeeData,
    isAddressEmpty,
    fadeAnim,
    cardScaleAnim,
    onEditAddress,
  ]);

  // Memoize the delivery fee display to prevent unnecessary re-renders
  const deliveryFeeDisplay = useMemo(() => {
    const {
      isFreeDelivery,
      standardDeliveryFee,
      sameDayDeliveryFee,
      thresholdAmount,
      isSpecialLocation,
      zoneName,
    } = deliveryFeeData;

    return (
      <Animated.View
        style={[
          styles.feeContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: cardScaleAnim }],
          },
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
              {isFreeDelivery
                ? `Free for orders over $${thresholdAmount}`
                : 'Next day delivery'}
            </Text>
          </View>

          <View style={styles.feePriceContainer}>
            {isFreeDelivery ? (
              <View style={styles.feeBadge}>
                <Text style={styles.feeBadgeText}>FREE</Text>
              </View>
            ) : (
              <Text style={styles.feePrice}>
                ${standardDeliveryFee.toFixed(2)}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.feeRow}>
          <View style={styles.feeInfo}>
            <Text style={styles.feeName}>Same-Day Delivery</Text>
            <Text style={styles.feeDescription}>
              {isFreeDelivery
                ? 'Available today before 9pm'
                : 'Order by 2pm for same day'}
            </Text>
          </View>

          <View style={styles.feePriceContainer}>
            {isSameDay && isFreeDelivery ? (
              <View style={styles.feeBadge}>
                <Text style={styles.feeBadgeText}>FREE</Text>
              </View>
            ) : (
              <Text style={styles.feePrice}>
                ${sameDayDeliveryFee.toFixed(2)}
              </Text>
            )}
          </View>
        </View>
      </Animated.View>
    );
  }, [deliveryFeeData, isSameDay]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        {/* Address Summary */}
        {addressDisplay}

        {/* Calendar Section - only show if address is set */}
        {!isAddressEmpty && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Date</Text>
            <Text style={styles.sectionSubtitle}>
              Choose your preferred delivery date
            </Text>
            <View style={styles.calendarContainer}>
              <CalendarView
                onSelectDate={handleSelectDate}
                selectedDate={selectedDate}
              />
            </View>
          </View>
        )}

        {/* Time Slots - only show if date is selected and address is set */}
        {!isAddressEmpty && selectedDate && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Select Delivery Time</Text>
              {isSameDay && (
                <View style={styles.sameDayBadge}>
                  <Ionicons name="flash" size={14} color={COLORS.card} />
                  <Text style={styles.sameDayText}>Same-day</Text>
                </View>
              )}
            </View>
            <Text style={styles.sectionSubtitle}>
              Choose your preferred delivery window
            </Text>

            {/* Delivery Time Estimate */}
            {selectedTimeSlot && (
              <View style={styles.deliveryEstimate}>
                <View style={styles.estimateHeader}>
                  <Ionicons name="time-outline" size={20} color={COLORS.text} />
                  <Text style={styles.estimateTitle}>Scheduled Delivery</Text>
                </View>
                <Text style={styles.estimateText}>
                  {isSameDay ? 'Today' : 'Tomorrow'} • {selectedTimeText}
                </Text>
                <Text style={styles.estimateSubtext}>
                  Your order will be delivered within the selected time window
                </Text>
              </View>
            )}

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
    backgroundColor: COLORS.background,
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
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
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
    borderRadius: 20,
    padding: SPACING.lg,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.medium,
    elevation: 6,
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
  emptyAddressCard: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  emptyAddressContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyAddressTitle: {
    ...TYPOGRAPHY.h4,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  emptyAddressText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  selectAddressButton: {
    backgroundColor: COLORS.text,
    borderRadius: 12,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    ...SHADOWS.medium,
  },
  selectAddressButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.card,
    fontWeight: '700',
  },
  feeContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: SPACING.lg,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
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
  calendarContainer: {
    marginHorizontal: 0, // Remove negative margin for better consistency
  },
  deliveryEstimate: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
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
