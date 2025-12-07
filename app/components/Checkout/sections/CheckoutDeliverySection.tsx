/**
 * CheckoutDeliverySection - Delivery date/time selection for unified checkout
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DeliveryAddress, DeliverySlot } from '../../../types/checkout';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../../../utils/theme';
import { HapticFeedback } from '../../../utils/haptics';

interface Props {
  address: DeliveryAddress | null;
  selectedSlot: DeliverySlot | null;
  onSelectSlot: (slot: DeliverySlot) => void;
  onComplete: () => void;
  subtotal: number;
}

// Time slot definitions
const TIME_SLOTS = [
  { id: 'morning', label: '9AM - 12PM', start: '09:00', end: '12:00' },
  { id: 'afternoon', label: '12PM - 3PM', start: '12:00', end: '15:00' },
  { id: 'evening', label: '3PM - 6PM', start: '15:00', end: '18:00' },
  { id: 'night', label: '6PM - 9PM', start: '18:00', end: '21:00' },
];

// Generate next 7 days
function generateDates(): Array<{
  date: string;
  dayName: string;
  dayNum: string;
  month: string;
  isToday: boolean;
}> {
  const dates = [];
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    dates.push({
      date: d.toISOString().split('T')[0],
      dayName:
        i === 0
          ? 'Today'
          : i === 1
            ? 'Tomorrow'
            : d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: d.getDate().toString(),
      month: d.toLocaleDateString('en-US', { month: 'short' }),
      isToday: i === 0,
    });
  }

  return dates;
}

export default function CheckoutDeliverySection({
  address,
  selectedSlot,
  onSelectSlot,
  onComplete,
  subtotal,
}: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(
    selectedSlot?.date ? new Date().toISOString().split('T')[0] : null
  );
  const [selectedTimeId, setSelectedTimeId] = useState<string | null>(null);

  const dates = useMemo(() => generateDates(), []);

  // Delivery fee calculation
  const FREE_DELIVERY_THRESHOLD = 250;
  const isFreeDelivery = subtotal >= FREE_DELIVERY_THRESHOLD;
  const standardFee = 9.99;
  const sameDayFee = 19.99;

  const handleDateSelect = (date: string) => {
    HapticFeedback.selection();
    setSelectedDate(date);

    // If time slot already selected, create slot
    if (selectedTimeId) {
      createSlot(date, selectedTimeId);
    }
  };

  const handleTimeSelect = (timeId: string) => {
    HapticFeedback.selection();
    setSelectedTimeId(timeId);

    // If date already selected, create slot
    if (selectedDate) {
      createSlot(selectedDate, timeId);
    }
  };

  const createSlot = (date: string, timeId: string) => {
    const dateObj = new Date(date);
    const isToday = date === dates[0].date;
    const timeSlot = TIME_SLOTS.find(t => t.id === timeId);

    if (!timeSlot) return;

    const fee = isFreeDelivery ? 0 : isToday ? sameDayFee : standardFee;

    const slot: DeliverySlot = {
      id: `${date}-${timeId}`,
      date: dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
      timeSlot: timeSlot.label,
      startTime: timeSlot.start,
      endTime: timeSlot.end,
      fee,
      price: fee,
      isFree: isFreeDelivery,
      isExpress: isToday,
      available: true,
      sameDayAvailable: isToday,
      queueCount: Math.floor(Math.random() * 5), // Mock queue count
    };

    onSelectSlot(slot);
  };

  const handleContinue = () => {
    if (selectedSlot) {
      HapticFeedback.success();
      onComplete();
    } else {
      HapticFeedback.error();
    }
  };

  const isValid = !!selectedSlot;

  // Check if time slot is available for same-day
  const isTimeSlotAvailable = (timeId: string, date: string): boolean => {
    if (date !== dates[0].date) return true; // Not today, all slots available

    const now = new Date();
    const currentHour = now.getHours();
    const slot = TIME_SLOTS.find(t => t.id === timeId);

    if (!slot) return false;

    const slotStartHour = parseInt(slot.start.split(':')[0]);
    // Need at least 2 hours before slot starts
    return currentHour + 2 < slotStartHour;
  };

  return (
    <View style={styles.container}>
      {/* Date Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Date</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.datesContainer}
        >
          {dates.map(d => (
            <TouchableOpacity
              key={d.date}
              style={[
                styles.dateCard,
                selectedDate === d.date && styles.dateCardSelected,
              ]}
              onPress={() => handleDateSelect(d.date)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.dateDayName,
                  selectedDate === d.date && styles.dateTextSelected,
                ]}
              >
                {d.dayName}
              </Text>
              <Text
                style={[
                  styles.dateDayNum,
                  selectedDate === d.date && styles.dateTextSelected,
                ]}
              >
                {d.dayNum}
              </Text>
              <Text
                style={[
                  styles.dateMonth,
                  selectedDate === d.date && styles.dateTextSelected,
                ]}
              >
                {d.month}
              </Text>
              {d.isToday && (
                <View
                  style={[
                    styles.sameDayBadge,
                    selectedDate === d.date && styles.sameDayBadgeSelected,
                  ]}
                >
                  <Ionicons
                    name="flash"
                    size={10}
                    color={selectedDate === d.date ? COLORS.text : COLORS.card}
                  />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Time Selection */}
      {selectedDate && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Time</Text>
          <View style={styles.timeSlotsGrid}>
            {TIME_SLOTS.map(slot => {
              const available = isTimeSlotAvailable(slot.id, selectedDate);
              const isSelected = selectedTimeId === slot.id;

              return (
                <TouchableOpacity
                  key={slot.id}
                  style={[
                    styles.timeSlot,
                    isSelected && styles.timeSlotSelected,
                    !available && styles.timeSlotDisabled,
                  ]}
                  onPress={() => available && handleTimeSelect(slot.id)}
                  disabled={!available}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="time-outline"
                    size={18}
                    color={
                      isSelected
                        ? COLORS.card
                        : available
                          ? COLORS.text
                          : COLORS.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.timeSlotText,
                      isSelected && styles.timeSlotTextSelected,
                      !available && styles.timeSlotTextDisabled,
                    ]}
                  >
                    {slot.label}
                  </Text>
                  {!available && (
                    <Text style={styles.unavailableText}>Unavailable</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Delivery Fee Info */}
      <View style={styles.feeInfo}>
        <View style={styles.feeRow}>
          <View style={styles.feeIconContainer}>
            <Ionicons name="car" size={18} color={COLORS.text} />
          </View>
          <View style={styles.feeDetails}>
            <Text style={styles.feeName}>Standard Delivery</Text>
            <Text style={styles.feeDescription}>
              {isFreeDelivery
                ? `Free for orders over $${FREE_DELIVERY_THRESHOLD}`
                : 'Next day delivery'}
            </Text>
          </View>
          {isFreeDelivery ? (
            <View style={styles.freeBadge}>
              <Text style={styles.freeBadgeText}>FREE</Text>
            </View>
          ) : (
            <Text style={styles.feePrice}>${standardFee.toFixed(2)}</Text>
          )}
        </View>

        {selectedDate === dates[0].date && (
          <View style={styles.feeRow}>
            <View style={styles.feeIconContainer}>
              <Ionicons name="flash" size={18} color={COLORS.text} />
            </View>
            <View style={styles.feeDetails}>
              <Text style={styles.feeName}>Same-Day Delivery</Text>
              <Text style={styles.feeDescription}>Today before 9pm</Text>
            </View>
            {isFreeDelivery ? (
              <View style={styles.freeBadge}>
                <Text style={styles.freeBadgeText}>FREE</Text>
              </View>
            ) : (
              <Text style={styles.feePrice}>${sameDayFee.toFixed(2)}</Text>
            )}
          </View>
        )}
      </View>

      {/* Selected Slot Summary */}
      {selectedSlot && (
        <View style={styles.selectedSummary}>
          <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
          <Text style={styles.selectedSummaryText}>
            {selectedSlot.date} • {selectedSlot.timeSlot}
          </Text>
        </View>
      )}

      {/* Continue Button */}
      <TouchableOpacity
        style={[
          styles.continueButton,
          !isValid && styles.continueButtonDisabled,
        ]}
        onPress={handleContinue}
        disabled={!isValid}
        activeOpacity={0.8}
      >
        <Text style={styles.continueButtonText}>Continue to Payment</Text>
        <Ionicons name="arrow-forward" size={18} color={COLORS.card} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.lg,
  },
  section: {
    gap: SPACING.sm,
  },
  sectionTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: COLORS.text,
  },
  datesContainer: {
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  dateCard: {
    width: 72,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
  },
  dateCardSelected: {
    backgroundColor: COLORS.text,
    borderColor: COLORS.text,
  },
  dateDayName: {
    ...TYPOGRAPHY.small,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  dateDayNum: {
    ...TYPOGRAPHY.h3,
    fontWeight: '800',
    color: COLORS.text,
  },
  dateMonth: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  dateTextSelected: {
    color: COLORS.card,
  },
  sameDayBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.text,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sameDayBadgeSelected: {
    backgroundColor: COLORS.card,
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  timeSlot: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  timeSlotSelected: {
    backgroundColor: COLORS.text,
    borderColor: COLORS.text,
  },
  timeSlotDisabled: {
    opacity: 0.5,
  },
  timeSlotText: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  timeSlotTextSelected: {
    color: COLORS.card,
  },
  timeSlotTextDisabled: {
    color: COLORS.textSecondary,
  },
  unavailableText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  feeInfo: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feeIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  feeDetails: {
    flex: 1,
  },
  feeName: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  feeDescription: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
  },
  feePrice: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: COLORS.text,
  },
  freeBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  freeBadgeText: {
    ...TYPOGRAPHY.small,
    fontWeight: '700',
    color: '#4CAF50',
  },
  selectedSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: SPACING.md,
    borderRadius: 12,
    gap: SPACING.sm,
  },
  selectedSummaryText: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: '#2E7D32',
    flex: 1,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.text,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  continueButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  continueButtonText: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.card,
  },
});
