import React, { useState } from 'react';
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
    <View style={styles.container}>
      <Pressable style={styles.arrowButton} onPress={goToPreviousDay}>
        <ChevronLeft size={24} color={Colors.text} />
      </Pressable>
      
      <Pressable onPress={goToToday}>
        <Text style={styles.dateText}>
          {formatDate(selectedDate)}
          {isToday(selectedDate) && <Text style={styles.todayText}> (Today)</Text>}
        </Text>
      </Pressable>
      
      <Pressable style={styles.arrowButton} onPress={goToNextDay}>
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
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  arrowButton: {
    padding: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  todayText: {
    color: Colors.primary,
    fontWeight: 'normal',
  },
});