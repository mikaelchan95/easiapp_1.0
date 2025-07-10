import React, { useMemo, memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';

// Time slot options with queue counts - moved outside component to prevent recreation
const TIME_SLOTS = [
  { id: '1', time: '9am - 12pm', queueCount: 2 },
  { id: '2', time: '12pm - 3pm', queueCount: 5 },
  { id: '3', time: '3pm - 6pm', queueCount: 3 },
  { id: '4', time: '6pm - 9pm', queueCount: 1 },
];

interface TimeSlotsProps {
  selectedTimeSlot: string | null;
  onSelectTimeSlot: (timeSlotId: string, timeSlot: string, queueCount: number) => void;
  isSameDay: boolean;
}

// Using memo to prevent unnecessary re-renders
const TimeSlots: React.FC<TimeSlotsProps> = memo(({
  selectedTimeSlot,
  onSelectTimeSlot,
  isSameDay
}) => {
  // Get current hour only once per render
  const currentHour = useMemo(() => new Date().getHours(), []);
  
  // Memoize the disabled slot calculations
  const disabledSlots = useMemo(() => {
    if (!isSameDay) return {};
    
    return {
      '1': currentHour >= 9,
      '2': currentHour >= 12,
      '3': currentHour >= 15,
      '4': currentHour >= 18
    };
  }, [isSameDay, currentHour]);
  
  // Memoize the rendered time slots to prevent recreation
  const timeSlotItems = useMemo(() => {
    return TIME_SLOTS.map((slot) => {
      // Check if this time slot is disabled
      const isDisabled = isSameDay && disabledSlots[slot.id];
      const isSelected = selectedTimeSlot === slot.id;
      
      return (
        <TouchableOpacity
          key={slot.id}
          style={[
            styles.timeSlot,
            isSelected && styles.selectedTimeSlot,
            isDisabled && styles.disabledTimeSlot
          ]}
          onPress={() => !isDisabled && onSelectTimeSlot(slot.id, slot.time, slot.queueCount)}
          disabled={isDisabled}
        >
          <View style={styles.timeInfo}>
            <Text 
              style={[
                styles.timeText,
                isSelected && styles.selectedTimeText,
                isDisabled && styles.disabledTimeText
              ]}
            >
              {slot.time}
            </Text>
            <View style={styles.queueContainer}>
              <Ionicons 
                name="people-outline" 
                size={14} 
                color={isSelected ? COLORS.accent : COLORS.inactive} 
              />
              <Text 
                style={[
                  styles.queueText,
                  isSelected && styles.selectedTimeText
                ]}
              >
                {slot.queueCount} {slot.queueCount === 1 ? 'order' : 'orders'} in queue
              </Text>
            </View>
          </View>
          {isSelected && (
            <View style={styles.checkmark}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.accent} />
            </View>
          )}
        </TouchableOpacity>
      );
    });
  }, [selectedTimeSlot, isSameDay, disabledSlots, onSelectTimeSlot]);
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Delivery Time</Text>
      
      <View style={styles.slotsContainer}>
        {timeSlotItems}
      </View>
      
      {isSameDay && (
        <View style={styles.sameDayInfo}>
          <Ionicons name="flash" size={16} color="#FF9800" />
          <Text style={styles.sameDayText}>Same-day delivery selected</Text>
        </View>
      )}
    </View>
  );
});

// For better debugging
TimeSlots.displayName = 'TimeSlots';

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.xl,
  },
  title: {
    ...TYPOGRAPHY.h4,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  slotsContainer: {
    paddingHorizontal: 0,
  },
  timeSlot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.light,
  },
  selectedTimeSlot: {
    backgroundColor: COLORS.text,
    borderColor: COLORS.text,
  },
  disabledTimeSlot: {
    opacity: 0.5,
  },
  timeInfo: {
    flex: 1,
  },
  timeText: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  selectedTimeText: {
    color: COLORS.card,
  },
  disabledTimeText: {
    color: COLORS.inactive,
  },
  queueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  queueText: {
    ...TYPOGRAPHY.small,
    color: COLORS.inactive,
    marginLeft: 4,
  },
  checkmark: {
    marginLeft: 8,
  },
  sameDayInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    marginHorizontal: 16,
  },
  sameDayText: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 8,
    fontWeight: '600',
  },
});

export default TimeSlots; 