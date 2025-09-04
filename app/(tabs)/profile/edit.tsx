import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { ArrowLeft, Check } from 'lucide-react-native';
import { useUserStore } from '@/store/userStore';
import Colors from '@/constants/colors';
import { DIET_TYPES } from '@/constants/dietTypes';
import { DietType } from '@/types';

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile, updateProfile } = useUserStore();
  
  const [name, setName] = useState(profile.name || '');
  const [dietType, setDietType] = useState<DietType>(profile.dietType || 'any');
  const [calorieGoal, setCalorieGoal] = useState(profile.calorieGoal?.toString() || '');
  const [allergies, setAllergies] = useState(profile.allergies?.join(', ') || '');
  const [autoGenerateMeals, setAutoGenerateMeals] = useState(profile.autoGenerateMeals ?? true);
  
  const handleSave = () => {
    const parsedCalorieGoal = parseInt(calorieGoal);
    if (calorieGoal && (isNaN(parsedCalorieGoal) || parsedCalorieGoal <= 0)) {
      Alert.alert('Invalid Calorie Goal', 'Please enter a valid number for your daily calorie goal.');
      return;
    }
    const allergyList = allergies
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);
    updateProfile({
      name,
      dietType,
      calorieGoal: parsedCalorieGoal || undefined,
      allergies: allergyList,
      autoGenerateMeals,
    });
    router.back();
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()} testID="edit-back-btn">
          <ArrowLeft size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <Pressable style={styles.saveButton} onPress={handleSave} testID="edit-save-btn">
          <Text style={styles.saveButtonText}>Save</Text>
        </Pressable>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Profile</Text>
          
          <Text style={styles.inputLabel}>Name</Text>
          <TextInput
            style={styles.textInput}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
          />
          
          <Text style={styles.inputLabel}>Diet Type</Text>
          <View style={styles.dietTypeContainer}>
            {DIET_TYPES.map((option) => (
              <Pressable
                key={option.id}
                style={[
                  styles.dietTypeOption,
                  dietType === option.id && styles.selectedDietType
                ]}
                onPress={() => setDietType(option.id)}
              >
                <Text 
                  style={[
                    styles.dietTypeText,
                    dietType === option.id && styles.selectedDietTypeText
                  ]}
                >
                  {option.label}
                </Text>
                {dietType === option.id && (
                  <Check size={16} color={Colors.white} style={styles.checkIcon} />
                )}
              </Pressable>
            ))}
          </View>
          
          <Text style={styles.inputLabel}>Daily Calorie Goal</Text>
          <TextInput
            style={styles.textInput}
            value={calorieGoal}
            onChangeText={setCalorieGoal}
            placeholder="e.g., 2000"
            keyboardType="number-pad"
          />
          
          <Text style={styles.inputLabel}>Allergies</Text>
          <TextInput
            style={styles.textInput}
            value={allergies}
            onChangeText={setAllergies}
            placeholder="e.g., nuts, dairy, gluten"
          />
          <Text style={styles.helperText}>Separate with commas</Text>
          
          <Text style={styles.inputLabel}>Meal Planning</Text>
          <Pressable 
            style={[
              styles.toggleOption,
              autoGenerateMeals && styles.selectedToggleOption
            ]}
            onPress={() => setAutoGenerateMeals(!autoGenerateMeals)}
          >
            <View style={styles.toggleContent}>
              <Text style={[
                styles.toggleText,
                autoGenerateMeals && styles.selectedToggleText
              ]}>Auto-Generate Meals</Text>
              <Text style={[
                styles.toggleDescription,
                autoGenerateMeals && styles.selectedToggleDescription
              ]}>Show quick buttons to generate all meals for a day</Text>
            </View>
            {autoGenerateMeals && (
              <Check size={20} color={Colors.white} />
            )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  saveButtonText: {
    color: Colors.white,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  helperText: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 24,
  },
  dietTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  dietTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedDietType: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dietTypeText: {
    fontSize: 14,
    color: Colors.text,
  },
  selectedDietTypeText: {
    color: Colors.white,
  },
  checkIcon: {
    marginLeft: 6,
  },
  toggleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  selectedToggleOption: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  toggleContent: {
    flex: 1,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  selectedToggleText: {
    color: Colors.white,
  },
  toggleDescription: {
    fontSize: 14,
    color: Colors.textLight,
  },
  selectedToggleDescription: {
    color: Colors.white,
    opacity: 0.9,
  },
});
