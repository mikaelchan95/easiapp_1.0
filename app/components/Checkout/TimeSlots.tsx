import React, { useMemo, memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';

// Time slot options - moved outside component to prevent recreation
const TIME_SLOTS = [
  { id: '1', time: '9am - 12pm', label: 'Morning' },
  { id: '2', time: '12pm - 3pm', label: 'Afternoon' },
  { id: '3', time: '3pm - 6pm', label: 'Evening' },
  { id: '4', time: '6pm - 9pm', label: 'Night' },
];

interface TimeSlotsProps {
  selectedTimeSlot: string | null;
  onSelectTimeSlot: (
    timeSlotId: string,
    timeSlot: string,
    queueCount: number
  ) => void;
  isSameDay: boolean;
  isSpecialLocation?: boolean;
}

// Using memo to prevent unnecessary re-renders
const TimeSlots: React.FC<TimeSlotsProps> = memo(
  ({
    selectedTimeSlot,
    onSelectTimeSlot,
    isSameDay,
    isSpecialLocation = false,
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
        '4': currentHour >= 18,
      };
    }, [isSameDay, currentHour]);

    // Memoize the rendered time slots to prevent recreation
    const timeSlotItems = useMemo(() => {
      return TIME_SLOTS.map(slot => {
        // Check if this time slot is disabled
        const isDisabled = isSameDay && disabledSlots[slot.id];
        const isSelected = selectedTimeSlot === slot.id;

        return (
          <TouchableOpacity
            key={slot.id}
            style={[
              styles.timeSlot,
              isSelected && styles.selectedTimeSlot,
              isDisabled && styles.disabledTimeSlot,
            ]}
            onPress={() =>
              !isDisabled && onSelectTimeSlot(slot.id, slot.time, 0)
            }
            disabled={isDisabled}
          >
            <View style={styles.timeInfo}>
              <View style={styles.timeHeader}>
                <View style={styles.timeContent}>
                  <Text
                    style={[
                      styles.timeText,
                      isSelected && styles.selectedTimeText,
                      isDisabled && styles.disabledTimeText,
                    ]}
                  >
                    {slot.time}
                  </Text>
                  <Text
                    style={[
                      styles.timeLabelText,
                      isSelected && styles.selectedTimeText,
                      isDisabled && styles.disabledTimeText,
                    ]}
                  >
                    {slot.label}
                  </Text>
                </View>
                {isSpecialLocation && (
                  <View style={styles.priorityBadge}>
                    <Ionicons name="flash" size={12} color="#FF9500" />
                    <Text style={styles.priorityText}>Priority</Text>
                  </View>
                )}
              </View>
              {isDisabled && (
                <View style={styles.unavailableContainer}>
                  <Ionicons
                    name="time-outline"
                    size={14}
                    color={COLORS.textSecondary}
                  />
                  <Text style={styles.unavailableText}>
                    No longer available today
                  </Text>
                </View>
              )}
            </View>
            {isSelected && (
              <View style={styles.checkmark}>
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={COLORS.card}
                />
              </View>
            )}
          </TouchableOpacity>
        );
      });
    }, [selectedTimeSlot, isSameDay, disabledSlots, onSelectTimeSlot]);

    return (
      <View style={styles.container}>
        <View style={styles.slotsContainer}>{timeSlotItems}</View>

        {isSameDay && (
          <View style={styles.sameDayInfo}>
            <View style={styles.sameDayBadge}>
              <Ionicons name="flash" size={16} color="#FF9500" />
              <Text style={styles.sameDayText}>Same-day delivery</Text>
            </View>
            <Text style={styles.sameDaySubtext}>
              Premium delivery option - arrives today
            </Text>
          </View>
        )}
      </View>
    );
  }
);

// For better debugging
TimeSlots.displayName = 'TimeSlots';

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.xl,
  },
  slotsContainer: {
    gap: SPACING.sm,
  },
  timeSlot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.light,
    minHeight: 72,
  },
  selectedTimeSlot: {
    backgroundColor: COLORS.text,
    borderColor: COLORS.text,
    transform: [{ scale: 1.02 }],
    ...SHADOWS.medium,
  },
  disabledTimeSlot: {
    opacity: 0.5,
  },
  timeInfo: {
    flex: 1,
  },
  timeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  timeContent: {
    flex: 1,
  },
  timeText: {
    ...TYPOGRAPHY.h4,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  timeLabelText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  selectedTimeText: {
    color: COLORS.card,
  },
  disabledTimeText: {
    color: COLORS.inactive,
  },
  unavailableContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  unavailableText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginLeft: 4,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  checkmark: {
    marginLeft: SPACING.sm,
  },
  sameDayInfo: {
    backgroundColor: '#FFF8E1',
    borderRadius: 16,
    padding: SPACING.md,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  sameDayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sameDayText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    marginLeft: 6,
    fontWeight: '700',
  },
  sameDaySubtext: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  priorityText: {
    ...TYPOGRAPHY.caption,
    color: '#FF9500',
    marginLeft: 2,
    fontWeight: '700',
  },
});

export default TimeSlots;
