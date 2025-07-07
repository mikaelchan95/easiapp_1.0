import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions, 
  ScrollView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../utils/theme';

interface CalendarViewProps {
  onSelectDate: (dateString: string) => void;
  selectedDate: string | null;
  minDate?: Date;
  maxDate?: Date;
  initialMonth?: Date;
}

interface DayItem {
  date: Date | null;
  dateString: string | null;
  day: number | null;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelectable: boolean;
  isSelected: boolean;
}

const { width } = Dimensions.get('window');
const CELL_SIZE = Math.floor((width - 32) / 7);

// Days of the week - memoized to avoid recreation
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CalendarView: React.FC<CalendarViewProps> = ({
  onSelectDate,
  selectedDate,
  minDate = new Date(),
  maxDate = new Date(new Date().setDate(new Date().getDate() + 60)), // 60 days from now
  initialMonth = new Date()
}) => {
  // Store current month state
  const [currentMonth, setCurrentMonth] = useState(() => {
    // Initialize with initialMonth to prevent unnecessary updates
    return new Date(initialMonth);
  });
  
  // Store today's date as a memoized string to prevent recreation
  const todayString = useMemo(() => {
    const today = new Date();
    return formatDateString(today);
  }, []);
  
  // Format a date to YYYY-MM-DD string - memoized to prevent recreation
  const formatDateString = useCallback((date: Date): string => {
    return date.toISOString().split('T')[0];
  }, []);
  
  // Generate calendar days for the current month - memoized to prevent recreation
  const calendarDays = useMemo(() => {
    const days: DayItem[][] = [];
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Calculate days needed from previous month to fill first week
    const daysFromPreviousMonth = firstDay.getDay();
    
    // Generate grid with previous month, current month, and next month days
    let currentWeek: DayItem[] = [];
    
    // Add days from previous month
    const previousMonth = new Date(year, month, 0);
    for (let i = daysFromPreviousMonth - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, previousMonth.getDate() - i);
      const dateString = formatDateString(date);
      const isSelectable = date >= minDate && date <= maxDate;
      
      currentWeek.push({
        date,
        dateString,
        day: date.getDate(),
        isCurrentMonth: false,
        isToday: dateString === todayString,
        isSelectable,
        isSelected: dateString === selectedDate
      });
    }
    
    // Add days from current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      const dateString = formatDateString(date);
      const isSelectable = date >= minDate && date <= maxDate;
      
      currentWeek.push({
        date,
        dateString,
        day: i,
        isCurrentMonth: true,
        isToday: dateString === todayString,
        isSelectable,
        isSelected: dateString === selectedDate
      });
      
      if (currentWeek.length === 7) {
        days.push([...currentWeek]); // Create a new array to break reference
        currentWeek = [];
      }
    }
    
    // Add days from next month to complete the last week
    if (currentWeek.length > 0) {
      const daysToAdd = 7 - currentWeek.length;
      for (let i = 1; i <= daysToAdd; i++) {
        const date = new Date(year, month + 1, i);
        const dateString = formatDateString(date);
        const isSelectable = date >= minDate && date <= maxDate;
        
        currentWeek.push({
          date,
          dateString,
          day: i,
          isCurrentMonth: false,
          isToday: dateString === todayString,
          isSelectable,
          isSelected: dateString === selectedDate
        });
      }
      days.push([...currentWeek]); // Create a new array to break reference
    }
    
    return days;
  }, [currentMonth, selectedDate, minDate, maxDate, todayString, formatDateString]);
  
  // Navigate to previous month - memoized to prevent recreation
  const goToPreviousMonth = useCallback(() => {
    setCurrentMonth(prevMonth => {
      const newMonth = new Date(prevMonth);
      newMonth.setMonth(newMonth.getMonth() - 1);
      return newMonth;
    });
  }, []);
  
  // Navigate to next month - memoized to prevent recreation
  const goToNextMonth = useCallback(() => {
    setCurrentMonth(prevMonth => {
      const newMonth = new Date(prevMonth);
      newMonth.setMonth(newMonth.getMonth() + 1);
      return newMonth;
    });
  }, []);
  
  // Format month name - memoized to prevent recreation
  const monthYearString = useMemo(() => {
    return currentMonth.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  }, [currentMonth]);
  
  // Handle day selection - memoized to prevent recreation
  const handleSelectDay = useCallback((dayItem: DayItem) => {
    if (dayItem.isSelectable && dayItem.dateString) {
      onSelectDate(dayItem.dateString);
    }
  }, [onSelectDate]);
  
  // Check if previous month button should be disabled - memoized to prevent recreation
  const isPreviousMonthDisabled = useMemo(() => {
    const previousMonth = new Date(currentMonth);
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    return previousMonth.getMonth() < minDate.getMonth() && 
           previousMonth.getFullYear() <= minDate.getFullYear();
  }, [currentMonth, minDate]);
  
  return (
    <View style={styles.container}>
      {/* Calendar header with month navigation */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={goToPreviousMonth}
          disabled={isPreviousMonthDisabled}
          style={[
            styles.navButton,
            isPreviousMonthDisabled && styles.disabledNavButton
          ]}
        >
          <Ionicons name="chevron-back" size={24} color={isPreviousMonthDisabled ? COLORS.inactive : COLORS.text} />
        </TouchableOpacity>
        
        <Text style={styles.monthTitle}>{monthYearString}</Text>
        
        <TouchableOpacity 
          onPress={goToNextMonth}
          style={styles.navButton}
        >
          <Ionicons name="chevron-forward" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>
      
      {/* Day labels (Sun, Mon, etc.) */}
      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((day, index) => (
          <View key={index} style={styles.weekdayCell}>
            <Text style={styles.weekdayText}>{day}</Text>
          </View>
        ))}
      </View>
      
      {/* Calendar grid */}
      <View style={styles.calendarGrid}>
        {calendarDays.map((week, weekIndex) => (
          <View key={`week-${weekIndex}`} style={styles.weekRow}>
            {week.map((dayItem, dayIndex) => (
              <TouchableOpacity
                key={`day-${weekIndex}-${dayIndex}`}
                style={[
                  styles.dayCell,
                  dayItem.isSelectable ? styles.selectableDay : styles.unselectableDay,
                  dayItem.isSelected && styles.selectedDay,
                  !dayItem.isCurrentMonth && styles.outsideMonthDay,
                  dayItem.isToday && styles.todayDay
                ]}
                onPress={() => handleSelectDay(dayItem)}
                disabled={!dayItem.isSelectable}
              >
                <Text style={[
                  styles.dayText,
                  !dayItem.isCurrentMonth && styles.outsideMonthText,
                  dayItem.isToday && styles.todayText,
                  dayItem.isSelected && styles.selectedDayText
                ]}>
                  {dayItem.day}
                </Text>
                
                {dayItem.isToday && !dayItem.isSelected && (
                  <View style={styles.todayDot} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
      
      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.todayLegendDot]} />
          <Text style={styles.legendText}>Today</Text>
        </View>
        
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.selectedLegendDot]} />
          <Text style={styles.legendText}>Selected</Text>
        </View>
        
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.availableLegendDot]} />
          <Text style={styles.legendText}>Available</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    margin: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  disabledNavButton: {
    opacity: 0.5,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayCell: {
    width: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.inactive,
  },
  calendarGrid: {
    marginBottom: 16,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: CELL_SIZE / 2,
  },
  selectableDay: {
    backgroundColor: 'transparent',
  },
  unselectableDay: {
    opacity: 0.3,
  },
  selectedDay: {
    backgroundColor: COLORS.primary,
  },
  outsideMonthDay: {
    opacity: 0.3,
  },
  todayDay: {
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  outsideMonthText: {
    color: COLORS.inactive,
  },
  todayText: {
    color: COLORS.primary,
  },
  selectedDayText: {
    color: COLORS.accent,
  },
  todayDot: {
    position: 'absolute',
    bottom: 6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  todayLegendDot: {
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  selectedLegendDot: {
    backgroundColor: COLORS.primary,
  },
  availableLegendDot: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.inactive,
  },
  legendText: {
    fontSize: 12,
    color: COLORS.text,
  },
});

export default CalendarView; 