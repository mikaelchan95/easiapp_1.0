import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CalendarDay {
  date: Date;
  dayNumber: number;
  dayName: string;
  monthName: string;
  isToday: boolean;
  isSelectable: boolean;
  isSelected: boolean;
}

interface DeliveryCalendarProps {
  onSelectDate: (date: string) => void;
  selectedDate: string | null;
}

const DeliveryCalendar: React.FC<DeliveryCalendarProps> = ({
  onSelectDate,
  selectedDate
}) => {
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  
  // Generate calendar days for the next 14 days
  useEffect(() => {
    const today = new Date();
    const days: CalendarDay[] = [];
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Format date as ISO string (YYYY-MM-DD)
      const dateString = date.toISOString().split('T')[0];
      const isSelected = selectedDate === dateString;
      
      days.push({
        date,
        dayNumber: date.getDate(),
        dayName: getDayName(date),
        monthName: getMonthName(date),
        isToday: i === 0,
        isSelectable: true, // All future days are selectable
        isSelected
      });
    }
    
    setCalendarDays(days);
  }, [selectedDate]);
  
  const getDayName = (date: Date): string => {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };
  
  const getMonthName = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'short' });
  };
  
  const handleSelectDay = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    onSelectDate(dateString);
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Delivery Date</Text>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.daysContainer}
      >
        {calendarDays.map((day, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dayCard,
              day.isToday && styles.todayCard,
              day.isSelected && styles.selectedCard,
              !day.isSelectable && styles.disabledCard
            ]}
            onPress={() => day.isSelectable && handleSelectDay(day.date)}
            disabled={!day.isSelectable}
          >
            <Text style={[
              styles.dayName,
              day.isSelected && styles.selectedText,
              day.isToday && styles.todayText
            ]}>
              {day.dayName}
            </Text>
            <View style={[
              styles.dayNumber,
              day.isSelected && styles.selectedDayNumber
            ]}>
              <Text style={[
                styles.dayNumberText,
                day.isSelected && styles.selectedDayNumberText
              ]}>
                {day.dayNumber}
              </Text>
            </View>
            <Text style={[
              styles.monthName,
              day.isSelected && styles.selectedText
            ]}>
              {day.monthName}
            </Text>
            
            {day.isToday && (
              <View style={styles.todayBadge}>
                <Text style={styles.todayBadgeText}>Today</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  daysContainer: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  dayCard: {
    width: 80,
    height: 100,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 4,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  todayCard: {
    borderColor: '#4CAF50',
  },
  selectedCard: {
    borderColor: '#1a1a1a',
    backgroundColor: '#1a1a1a',
  },
  disabledCard: {
    opacity: 0.5,
  },
  dayName: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  todayText: {
    color: '#4CAF50',
  },
  selectedText: {
    color: '#fff',
  },
  dayNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f9f9f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  selectedDayNumber: {
    backgroundColor: '#fff',
  },
  dayNumberText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  selectedDayNumberText: {
    color: '#1a1a1a',
  },
  monthName: {
    fontSize: 13,
    color: '#666',
  },
  todayBadge: {
    position: 'absolute',
    top: -8,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  todayBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '700',
  },
});

export default DeliveryCalendar; 