import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check } from 'lucide-react-native';
import { useUserStore } from '@/store/userStore';
import Colors from '@/constants/colors';
import { DietType } from '@/types';

// Common food allergies
const COMMON_ALLERGIES = [
  'Dairy',
  'Eggs',
  'Peanuts',
  'Tree nuts',
  'Shellfish',
  'Fish',
  'Wheat',
  'Gluten',
  'Soy',
  'Sesame',
  'Corn',
  'Mustard'
];

// Diet types from our type definition
const DIET_TYPES: { id: DietType; label: string; description: string }[] = [
  { id: 'any', label: 'Any', description: 'No specific diet restrictions' },
  { id: 'vegetarian', label: 'Vegetarian', description: 'No meat, fish, or poultry' },
  { id: 'vegan', label: 'Vegan', description: 'No animal products' },
  { id: 'keto', label: 'Keto', description: 'High-fat, low-carb diet' },
  { id: 'paleo', label: 'Paleo', description: 'Based on foods presumed to be available to paleolithic humans' },
  { id: 'gluten-free', label: 'Gluten-Free', description: 'No wheat, barley, or rye' },
  { id: 'dairy-free', label: 'Dairy-Free', description: 'No milk, cheese, or dairy products' },
  { id: 'low-carb', label: 'Low-Carb', description: 'Reduced carbohydrate consumption' },
];

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile, updateProfile } = useUserStore();
  
  // Local state for form fields
  const [name, setName] = useState(profile.name);
  const [dietType, setDietType] = useState<DietType>(profile.dietType || 'any');
  const [calorieGoal, setCalorieGoal] = useState(profile.calorieGoal?.toString() || '');
  const [allergies, setAllergies] = useState<string[]>(profile.allergies || []);
  const [showDietSelector, setShowDietSelector] = useState(false);
  
  const toggleAllergy = (allergy: string) => {
    if (allergies.includes(allergy)) {
      setAllergies(allergies.filter(a => a !== allergy));
    } else {
      setAllergies([...allergies, allergy]);
    }
  };
  
  const handleSave = () => {
    // Update user profile
    updateProfile({
      name,
      dietType,
      calorieGoal: parseInt(calorieGoal) || 2000,
      allergies,
    });
    
    router.back();
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <Pressable onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save</Text>
        </Pressable>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Profile</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Diet Type</Text>
            <Pressable 
              style={styles.dietSelector}
              onPress={() => setShowDietSelector(!showDietSelector)}
            >
              <Text style={styles.dietSelectorText}>
                {DIET_TYPES.find(dt => dt.id === dietType)?.label || 'Select a diet type'}
              </Text>
            </Pressable>
            
            {showDietSelector && (
              <View style={styles.dietOptions}>
                {DIET_TYPES.map((option) => (
                  <Pressable
                    key={option.id}
                    style={[
                      styles.dietOption,
                      dietType === option.id && styles.dietOptionSelected
                    ]}
                    onPress={() => {
                      setDietType(option.id);
                      setShowDietSelector(false);
                    }}
                  >
                    <View style={styles.dietOptionContent}>
                      <Text style={[
                        styles.dietOptionLabel,
                        dietType === option.id && styles.dietOptionLabelSelected
                      ]}>
                        {option.label}
                      </Text>
                      <Text style={styles.dietOptionDescription}>{option.description}</Text>
                    </View>
                    
                    {dietType === option.id && (
                      <View style={styles.checkmark}>
                        <Check size={16} color={Colors.white} />
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>
            )}
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Daily Calorie Goal</Text>
            <TextInput
              style={styles.input}
              value={calorieGoal}
              onChangeText={setCalorieGoal}
              keyboardType="numeric"
              placeholder="e.g., 2000"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Allergies</Text>
            <Text style={styles.helperText}>Select all that apply</Text>
            
            <View style={styles.allergyGrid}>
              {COMMON_ALLERGIES.map((allergy) => (
                <TouchableOpacity
                  key={allergy}
                  style={[
                    styles.allergyChip,
                    allergies.includes(allergy) && styles.allergyChipSelected
                  ]}
                  onPress={() => toggleAllergy(allergy)}
                >
                  <Text 
                    style={[
                      styles.allergyChipText,
                      allergies.includes(allergy) && styles.allergyChipTextSelected
                    ]}
                  >
                    {allergy}
                  </Text>
                  {allergies.includes(allergy) && (
                    <View style={styles.allergyCheckmark}>
                      <Check size={12} color={Colors.white} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
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
    backgroundColor: Colors.white,
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
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  saveButtonText: {
    color: Colors.white,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  helperText: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 8,
  },
  dietSelector: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dietSelectorText: {
    fontSize: 16,
    color: Colors.text,
  },
  dietOptions: {
    marginTop: 8,
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  dietOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dietOptionSelected: {
    backgroundColor: Colors.primaryLight,
  },
  dietOptionContent: {
    flex: 1,
  },
  dietOptionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 2,
  },
  dietOptionLabelSelected: {
    color: Colors.primary,
  },
  dietOptionDescription: {
    fontSize: 14,
    color: Colors.textLight,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  allergyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  allergyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  allergyChipSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  allergyChipText: {
    fontSize: 14,
    color: Colors.text,
  },
  allergyChipTextSelected: {
    color: Colors.primary,
    fontWeight: '500',
  },
  allergyCheckmark: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
});