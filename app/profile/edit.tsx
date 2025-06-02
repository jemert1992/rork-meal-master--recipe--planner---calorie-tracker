import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Check, X } from 'lucide-react-native';
import { useUserStore } from '@/store/userStore';
import { cmToFeetInches, kgToPounds } from '@/utils/unitConversions';
import Colors from '@/constants/colors';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile, updateProfile, updateHeightImperial, updateWeightImperial } = useUserStore();
  
  // Initialize state with current profile values
  const [name, setName] = useState(profile.name || '');
  const [age, setAge] = useState(profile.age?.toString() || '');
  
  // Convert stored metric values to imperial for display
  const initialWeight = profile.weight ? Math.round(kgToPounds(profile.weight)) : 0;
  const initialHeight = profile.height ? cmToFeetInches(profile.height) : { feet: 0, inches: 0 };
  
  const [weightPounds, setWeightPounds] = useState(initialWeight ? initialWeight.toString() : '');
  const [heightFeet, setHeightFeet] = useState(initialHeight.feet ? initialHeight.feet.toString() : '');
  const [heightInches, setHeightInches] = useState(initialHeight.inches ? initialHeight.inches.toString() : '');
  
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>(profile.gender || '');
  const [activityLevel, setActivityLevel] = useState<'sedentary' | 'light' | 'moderate' | 'active' | 'very-active' | ''>(profile.activityLevel || '');
  const [calorieGoal, setCalorieGoal] = useState(profile.calorieGoal?.toString() || '');
  const [proteinGoal, setProteinGoal] = useState(profile.proteinGoal?.toString() || '');
  const [carbsGoal, setCarbsGoal] = useState(profile.carbsGoal?.toString() || '');
  const [fatGoal, setFatGoal] = useState(profile.fatGoal?.toString() || '');
  
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>(profile.dietaryPreferences || []);
  
  const dietaryOptions = [
    { id: 'vegetarian', label: 'Vegetarian' },
    { id: 'vegan', label: 'Vegan' },
    { id: 'pescatarian', label: 'Pescatarian' },
    { id: 'gluten-free', label: 'Gluten-Free' },
    { id: 'dairy-free', label: 'Dairy-Free' },
    { id: 'keto', label: 'Keto' },
    { id: 'paleo', label: 'Paleo' },
    { id: 'low-carb', label: 'Low-Carb' },
    { id: 'low-fat', label: 'Low-Fat' },
    { id: 'mediterranean', label: 'Mediterranean' },
  ];
  
  const togglePreference = useCallback((id: string) => {
    setSelectedPreferences(prev => {
      if (prev.includes(id)) {
        return prev.filter(p => p !== id);
      } else {
        return [...prev, id];
      }
    });
  }, []);
  
  const handleSave = () => {
    // Update profile with name, age, gender, activity level, and nutrition goals
    updateProfile({
      name: name.trim(),
      age: parseInt(age) || profile.age,
      gender: gender as 'male' | 'female' | 'other',
      activityLevel: activityLevel as 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active',
      dietaryPreferences: selectedPreferences,
      calorieGoal: parseInt(calorieGoal) || profile.calorieGoal,
      proteinGoal: parseInt(proteinGoal) || profile.proteinGoal,
      carbsGoal: parseInt(carbsGoal) || profile.carbsGoal,
      fatGoal: parseInt(fatGoal) || profile.fatGoal,
    });
    
    // Update height and weight with imperial values
    if (heightFeet && heightInches) {
      updateHeightImperial(parseInt(heightFeet), parseInt(heightInches));
    }
    
    if (weightPounds) {
      updateWeightImperial(parseInt(weightPounds));
    }
    
    router.back();
  };
  
  const handleRecalculate = () => {
    // Update profile with current form values
    updateProfile({
      name: name.trim(),
      age: parseInt(age) || profile.age,
      gender: gender as 'male' | 'female' | 'other',
      activityLevel: activityLevel as 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active',
    });
    
    // Update height and weight with imperial values
    if (heightFeet && heightInches) {
      updateHeightImperial(parseInt(heightFeet), parseInt(heightInches));
    }
    
    if (weightPounds) {
      updateWeightImperial(parseInt(weightPounds));
    }
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <StatusBar style="dark" />
        
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <X size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={styles.placeholder} />
        </View>
        
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Edit Profile</Text>
            <Text style={styles.subtitle}>Update your personal information</Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Your name"
                value={name}
                onChangeText={setName}
                placeholderTextColor={Colors.textLight}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Age</Text>
              <TextInput
                style={styles.input}
                placeholder="Your age"
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                placeholderTextColor={Colors.textLight}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Weight (lbs)</Text>
              <TextInput
                style={styles.input}
                placeholder="Weight in pounds"
                value={weightPounds}
                onChangeText={setWeightPounds}
                keyboardType="numeric"
                placeholderTextColor={Colors.textLight}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Height</Text>
              <View style={styles.heightInputContainer}>
                <View style={styles.heightInput}>
                  <TextInput
                    style={styles.input}
                    placeholder="Feet"
                    value={heightFeet}
                    onChangeText={setHeightFeet}
                    keyboardType="numeric"
                    placeholderTextColor={Colors.textLight}
                  />
                  <Text style={styles.heightUnit}>ft</Text>
                </View>
                
                <View style={styles.heightInput}>
                  <TextInput
                    style={styles.input}
                    placeholder="Inches"
                    value={heightInches}
                    onChangeText={setHeightInches}
                    keyboardType="numeric"
                    placeholderTextColor={Colors.textLight}
                  />
                  <Text style={styles.heightUnit}>in</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.optionsContainer}>
                <Pressable
                  style={[styles.option, gender === 'male' && styles.optionSelected]}
                  onPress={() => setGender('male')}
                >
                  <Text style={[styles.optionText, gender === 'male' && styles.optionTextSelected]}>Male</Text>
                </Pressable>
                
                <Pressable
                  style={[styles.option, gender === 'female' && styles.optionSelected]}
                  onPress={() => setGender('female')}
                >
                  <Text style={[styles.optionText, gender === 'female' && styles.optionTextSelected]}>Female</Text>
                </Pressable>
                
                <Pressable
                  style={[styles.option, gender === 'other' && styles.optionSelected]}
                  onPress={() => setGender('other')}
                >
                  <Text style={[styles.optionText, gender === 'other' && styles.optionTextSelected]}>Other</Text>
                </Pressable>
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Activity Level</Text>
              <View style={styles.activityOptions}>
                <Pressable
                  style={[styles.activityOption, activityLevel === 'sedentary' && styles.optionSelected]}
                  onPress={() => setActivityLevel('sedentary')}
                >
                  <Text style={[styles.activityTitle, activityLevel === 'sedentary' && styles.optionTextSelected]}>Sedentary</Text>
                  <Text style={styles.activityDescription}>Little or no exercise</Text>
                </Pressable>
                
                <Pressable
                  style={[styles.activityOption, activityLevel === 'light' && styles.optionSelected]}
                  onPress={() => setActivityLevel('light')}
                >
                  <Text style={[styles.activityTitle, activityLevel === 'light' && styles.optionTextSelected]}>Light</Text>
                  <Text style={styles.activityDescription}>Light exercise 1-3 days/week</Text>
                </Pressable>
                
                <Pressable
                  style={[styles.activityOption, activityLevel === 'moderate' && styles.optionSelected]}
                  onPress={() => setActivityLevel('moderate')}
                >
                  <Text style={[styles.activityTitle, activityLevel === 'moderate' && styles.optionTextSelected]}>Moderate</Text>
                  <Text style={styles.activityDescription}>Moderate exercise 3-5 days/week</Text>
                </Pressable>
                
                <Pressable
                  style={[styles.activityOption, activityLevel === 'active' && styles.optionSelected]}
                  onPress={() => setActivityLevel('active')}
                >
                  <Text style={[styles.activityTitle, activityLevel === 'active' && styles.optionTextSelected]}>Active</Text>
                  <Text style={styles.activityDescription}>Hard exercise 6-7 days/week</Text>
                </Pressable>
                
                <Pressable
                  style={[styles.activityOption, activityLevel === 'very-active' && styles.optionSelected]}
                  onPress={() => setActivityLevel('very-active')}
                >
                  <Text style={[styles.activityTitle, activityLevel === 'very-active' && styles.optionTextSelected]}>Very Active</Text>
                  <Text style={styles.activityDescription}>Very hard exercise & physical job</Text>
                </Pressable>
              </View>
            </View>
          </View>
          
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Nutrition Goals</Text>
              <Pressable style={styles.recalculateButton} onPress={handleRecalculate}>
                <Text style={styles.recalculateButtonText}>Recalculate</Text>
              </Pressable>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Daily Calories (kcal)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 2000"
                value={calorieGoal}
                onChangeText={setCalorieGoal}
                keyboardType="numeric"
                placeholderTextColor={Colors.textLight}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Protein (g)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 100"
                value={proteinGoal}
                onChangeText={setProteinGoal}
                keyboardType="numeric"
                placeholderTextColor={Colors.textLight}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Carbs (g)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 250"
                value={carbsGoal}
                onChangeText={setCarbsGoal}
                keyboardType="numeric"
                placeholderTextColor={Colors.textLight}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Fat (g)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 70"
                value={fatGoal}
                onChangeText={setFatGoal}
                keyboardType="numeric"
                placeholderTextColor={Colors.textLight}
              />
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dietary Preferences</Text>
            <View style={styles.preferencesContainer}>
              {dietaryOptions.map((option) => (
                <Pressable
                  key={option.id}
                  style={[
                    styles.preferenceOption,
                    selectedPreferences.includes(option.id) && styles.preferenceSelected
                  ]}
                  onPress={() => togglePreference(option.id)}
                >
                  <Text style={[
                    styles.preferenceText,
                    selectedPreferences.includes(option.id) && styles.preferenceTextSelected
                  ]}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>
        
        <View style={styles.footer}>
          <Pressable style={styles.saveButton} onPress={handleSave}>
            <Check size={20} color={Colors.white} />
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textLight,
  },
  section: {
    marginBottom: 32,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  recalculateButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
  },
  recalculateButtonText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
  },
  heightInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heightInput: {
    width: '48%',
    position: 'relative',
  },
  heightUnit: {
    position: 'absolute',
    right: 16,
    top: 16,
    fontSize: 16,
    color: Colors.textLight,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  option: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  optionSelected: {
    backgroundColor: Colors.primary,
  },
  optionText: {
    fontSize: 16,
    color: Colors.text,
  },
  optionTextSelected: {
    color: Colors.white,
    fontWeight: '500',
  },
  activityOptions: {
    gap: 12,
  },
  activityOption: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 14,
    color: Colors.textLight,
  },
  preferencesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  preferenceOption: {
    backgroundColor: Colors.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  preferenceSelected: {
    backgroundColor: Colors.primary,
  },
  preferenceText: {
    fontSize: 14,
    color: Colors.text,
  },
  preferenceTextSelected: {
    color: Colors.white,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 8,
  },
});