import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFoodLogStore } from '@/store/foodLogStore';
import { FoodEntry } from '@/types';
import Colors from '@/constants/colors';
import { X } from 'lucide-react-native';

export default function AddFoodScreen() {
  const { date, index } = useLocalSearchParams<{ date: string; index?: string }>();
  const router = useRouter();
  const { foodLog, addFoodEntry, updateFoodEntry } = useFoodLogStore();
  
  const isEditing = index !== undefined;
  const editIndex = isEditing ? parseInt(index) : -1;
  
  // Get the existing entry if we're editing
  const existingEntry = isEditing && foodLog[date]?.meals[editIndex];
  
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [mealType, setMealType] = useState<FoodEntry['mealType']>('breakfast');
  const [time, setTime] = useState(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
  
  // Initialize form with existing data if editing
  useEffect(() => {
    if (existingEntry) {
      setName(existingEntry.name);
      setCalories(existingEntry.calories.toString());
      if (existingEntry.protein !== undefined) {
        setProtein(existingEntry.protein.toString());
      }
      if (existingEntry.carbs !== undefined) {
        setCarbs(existingEntry.carbs.toString());
      }
      if (existingEntry.fat !== undefined) {
        setFat(existingEntry.fat.toString());
      }
      setMealType(existingEntry.mealType);
      setTime(existingEntry.time);
    }
  }, [existingEntry]);
  
  const mealTypes = [
    { value: 'breakfast' as const, label: 'Breakfast' },
    { value: 'lunch' as const, label: 'Lunch' },
    { value: 'dinner' as const, label: 'Dinner' },
    { value: 'snack' as const, label: 'Snack' },
  ];
  
  const handleSave = () => {
    if (!name.trim() || !calories.trim()) return;
    
    const foodEntry: FoodEntry = {
      name: name.trim(),
      calories: parseInt(calories),
      protein: protein ? parseInt(protein) : undefined,
      carbs: carbs ? parseInt(carbs) : undefined,
      fat: fat ? parseInt(fat) : undefined,
      time,
      mealType,
    };
    
    if (isEditing) {
      updateFoodEntry(date, editIndex, foodEntry);
    } else {
      addFoodEntry(date, foodEntry);
    }
    
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <X size={24} color={Colors.text} />
            </Pressable>
            <Text style={styles.title}>{isEditing ? 'Edit Food' : 'Add Food'}</Text>
            <View style={styles.placeholder} />
          </View>
          <Text style={styles.subtitle}>Track what you eat</Text>
        </View>
        
        <View style={styles.formContainer}>
          <Text style={styles.label}>Food Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Grilled Chicken Salad"
            value={name}
            onChangeText={setName}
            placeholderTextColor={Colors.textLight}
          />
          
          <Text style={styles.label}>Calories *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 350"
            value={calories}
            onChangeText={setCalories}
            keyboardType="numeric"
            placeholderTextColor={Colors.textLight}
          />
          
          <View style={styles.macrosContainer}>
            <View style={styles.macroInput}>
              <Text style={styles.label}>Protein (g)</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                value={protein}
                onChangeText={setProtein}
                keyboardType="numeric"
                placeholderTextColor={Colors.textLight}
              />
            </View>
            
            <View style={styles.macroInput}>
              <Text style={styles.label}>Carbs (g)</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                value={carbs}
                onChangeText={setCarbs}
                keyboardType="numeric"
                placeholderTextColor={Colors.textLight}
              />
            </View>
            
            <View style={styles.macroInput}>
              <Text style={styles.label}>Fat (g)</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                value={fat}
                onChangeText={setFat}
                keyboardType="numeric"
                placeholderTextColor={Colors.textLight}
              />
            </View>
          </View>
          
          <Text style={styles.label}>Meal Type</Text>
          <View style={styles.mealTypeContainer}>
            {mealTypes.map((type) => (
              <Pressable
                key={type.value}
                style={[
                  styles.mealTypeButton,
                  mealType === type.value && styles.mealTypeButtonActive,
                ]}
                onPress={() => setMealType(type.value)}
              >
                <Text
                  style={[
                    styles.mealTypeText,
                    mealType === type.value && styles.mealTypeTextActive,
                  ]}
                >
                  {type.label}
                </Text>
              </Pressable>
            ))}
          </View>
          
          <Text style={styles.label}>Time</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 12:30"
            value={time}
            onChangeText={setTime}
            placeholderTextColor={Colors.textLight}
          />
          
          <Pressable
            style={[styles.saveButton, (!name.trim() || !calories.trim()) && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!name.trim() || !calories.trim()}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backButton: {
    padding: 4,
  },
  placeholder: {
    width: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textLight,
    marginBottom: 16,
  },
  formContainer: {
    margin: 20,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    color: Colors.text,
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroInput: {
    flex: 1,
    marginRight: 8,
  },
  mealTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  mealTypeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colors.card,
    marginRight: 8,
    marginBottom: 8,
  },
  mealTypeButtonActive: {
    backgroundColor: Colors.primary,
  },
  mealTypeText: {
    color: Colors.text,
  },
  mealTypeTextActive: {
    color: Colors.white,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.primaryLight,
  },
  saveButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});