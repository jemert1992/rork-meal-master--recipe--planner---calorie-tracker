import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import Colors from '@/constants/colors';

type DateSelectorProps = {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
};

export default function DateSelector({ selectedDate, onDateChange }: DateSelectorProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    onDateChange(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    onDateChange(newDate);
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  return (
    <View style={styles.container} accessible accessibilityRole="toolbar" accessibilityLabel="Date selector">
      <Pressable style={styles.arrowButton} onPress={goToPreviousDay} accessibilityRole="button" accessibilityLabel="Previous day">
        <ChevronLeft size={24} color={Colors.text} />
      </Pressable>
      
      <Pressable onPress={goToToday} accessibilityRole="button" accessibilityLabel="Go to today">
        <Text style={styles.dateText} accessibilityRole="text">
          {formatDate(selectedDate)}
          {isToday(selectedDate) && <Text style={styles.todayText}> (Today)</Text>}
        </Text>
      </Pressable>
      
      <Pressable style={styles.arrowButton} onPress={goToNextDay} accessibilityRole="button" accessibilityLabel="Next day">
        <ChevronRight size={24} color={Colors.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  arrowButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.backgroundLight,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.2,
  },
  todayText: {
    color: Colors.primary,
    fontWeight: '600',
  },
});