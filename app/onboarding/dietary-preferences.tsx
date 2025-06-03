import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowRight, Check } from 'lucide-react-native';
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

export default function DietaryPreferencesScreen() {
  const router = useRouter();
  const { updateProfile } = useUserStore();
  
  const [selectedDietType, setSelectedDietType] = useState<DietType>('any');
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  
  const toggleAllergy = (allergy: string) => {
    if (selectedAllergies.includes(allergy)) {
      setSelectedAllergies(selectedAllergies.filter(a => a !== allergy));
    } else {
      setSelectedAllergies([...selectedAllergies, allergy]);
    }
  };
  
  const handleNext = () => {
    updateProfile({
      dietType: selectedDietType,
      allergies: selectedAllergies,
    });
    
    router.push('/onboarding/nutrition-goals');
  };
  
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Dietary Preferences</Text>
          <Text style={styles.subtitle}>Select your diet type and any allergies you have</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Diet Type</Text>
          <Text style={styles.sectionSubtitle}>Select the diet that best describes your eating habits</Text>
          
          <View style={styles.dietTypesContainer}>
            {DIET_TYPES.map((option) => (
              <Pressable
                key={option.id}
                style={[
                  styles.dietOption,
                  selectedDietType === option.id && styles.dietOptionSelected
                ]}
                onPress={() => setSelectedDietType(option.id)}
              >
                <View style={styles.dietOptionContent}>
                  <Text style={[
                    styles.dietOptionLabel,
                    selectedDietType === option.id && styles.dietOptionLabelSelected
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={styles.dietOptionDescription}>{option.description}</Text>
                </View>
                
                {selectedDietType === option.id && (
                  <View style={styles.checkmark}>
                    <Check size={20} color={Colors.white} />
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Allergies</Text>
          <Text style={styles.sectionSubtitle}>Select any food allergies or intolerances you have</Text>
          
          <View style={styles.allergiesContainer}>
            {COMMON_ALLERGIES.map((allergy) => (
              <Pressable
                key={allergy}
                style={[
                  styles.allergyChip,
                  selectedAllergies.includes(allergy) && styles.allergyChipSelected
                ]}
                onPress={() => toggleAllergy(allergy)}
              >
                <Text style={[
                  styles.allergyChipText,
                  selectedAllergies.includes(allergy) && styles.allergyChipTextSelected
                ]}>
                  {allergy}
                </Text>
                
                {selectedAllergies.includes(allergy) && (
                  <View style={styles.allergyCheckmark}>
                    <Check size={14} color={Colors.white} />
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <Pressable style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>Next</Text>
          <ArrowRight size={20} color={Colors.white} />
        </Pressable>
      </View>
    </View>
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
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 16,
  },
  dietTypesContainer: {
    gap: 12,
  },
  dietOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dietOptionSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  dietOptionContent: {
    flex: 1,
  },
  dietOptionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  dietOptionLabelSelected: {
    color: Colors.primary,
  },
  dietOptionDescription: {
    fontSize: 14,
    color: Colors.textLight,
  },
  checkmark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  allergiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  allergyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 4,
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
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
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
  button: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 18,
    marginRight: 8,
  },
});