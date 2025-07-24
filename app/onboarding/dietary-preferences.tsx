import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Check, ChevronRight } from 'lucide-react-native';
import { useUserStore } from '@/store/userStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import Colors from '@/constants/colors';
import { DIET_TYPES } from '@/constants/dietTypes';
import { COMMON_ALLERGIES } from '@/constants/allergies';
import { DietType } from '@/types';

export default function DietaryPreferencesScreen() {
  const router = useRouter();
  const { profile, updateProfile } = useUserStore();
  const { data, updateDietaryPreferences } = useOnboardingStore();
  
  const [selectedDietType, setSelectedDietType] = useState<DietType>(data.dietType || 'any');
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>(data.allergies || []);
  
  const handleDietTypeSelect = (dietType: DietType) => {
    setSelectedDietType(dietType);
  };
  
  const handleAllergyToggle = (allergy: string) => {
    if (selectedAllergies.includes(allergy)) {
      setSelectedAllergies(selectedAllergies.filter(a => a !== allergy));
    } else {
      setSelectedAllergies([...selectedAllergies, allergy]);
    }
  };
  
  const handleNext = () => {
    // Save to onboarding store
    updateDietaryPreferences({
      dietType: selectedDietType,
      allergies: selectedAllergies,
    });
    
    // Also update user store for backward compatibility
    updateProfile({
      dietType: selectedDietType,
      allergies: selectedAllergies,
    });
    
    router.push('/onboarding/nutrition-goals');
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Dietary Preferences</Text>
          <Text style={styles.subtitle}>
            Help us find recipes that match your lifestyle and dietary needs
          </Text>
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>Step 2 of 3</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '66%' }]} />
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What's your diet style?</Text>
          <Text style={styles.sectionSubtitle}>Choose the option that best fits your eating habits</Text>
          
          <View style={styles.optionsContainer}>
            {DIET_TYPES.map((dietType) => (
              <Pressable
                key={dietType.id}
                style={[
                  styles.dietTypeOption,
                  selectedDietType === dietType.id && styles.selectedOption
                ]}
                onPress={() => handleDietTypeSelect(dietType.id)}
              >
                <View style={styles.optionContent}>
                  <Text style={[
                    styles.optionLabel,
                    selectedDietType === dietType.id && styles.selectedOptionLabel
                  ]}>
                    {dietType.label}
                  </Text>
                  {dietType.description && (
                    <Text style={[
                      styles.optionDescription,
                      selectedDietType === dietType.id && styles.selectedOptionDescription
                    ]}>
                      {dietType.description}
                    </Text>
                  )}
                </View>
                {selectedDietType === dietType.id && (
                  <View style={styles.checkIconContainer}>
                    <Check size={20} color={Colors.white} />
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Any allergies or intolerances?</Text>
          <Text style={styles.sectionSubtitle}>Select any that apply (we'll filter recipes accordingly)</Text>
          
          <View style={styles.allergiesContainer}>
            {COMMON_ALLERGIES.map((allergy) => (
              <Pressable
                key={allergy}
                style={[
                  styles.allergyOption,
                  selectedAllergies.includes(allergy) && styles.selectedAllergyOption
                ]}
                onPress={() => handleAllergyToggle(allergy)}
              >
                <Text style={[
                  styles.allergyLabel,
                  selectedAllergies.includes(allergy) && styles.selectedAllergyLabel
                ]}>
                  {allergy}
                </Text>
                {selectedAllergies.includes(allergy) && (
                  <Check size={16} color={Colors.white} style={styles.allergyCheckIcon} />
                )}
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <Pressable style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>Continue</Text>
          <ChevronRight size={20} color={Colors.white} />
        </Pressable>
      </View>
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
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
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
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 16,
  },
  optionsContainer: {
    gap: 12,
  },
  dietTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedOption: {
    borderColor: Colors.success,
    backgroundColor: Colors.successLight,
  },
  optionContent: {
    flex: 1,
    marginRight: 8,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  selectedOptionLabel: {
    color: Colors.text,
  },
  optionDescription: {
    fontSize: 14,
    color: Colors.textLight,
  },
  selectedOptionDescription: {
    color: Colors.text,
  },
  checkIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allergiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  allergyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedAllergyOption: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  allergyLabel: {
    fontSize: 14,
    color: Colors.text,
  },
  selectedAllergyLabel: {
    color: Colors.white,
  },
  allergyCheckIcon: {
    marginLeft: 6,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
    marginRight: 8,
  },
  progressContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  progressBar: {
    width: 120,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
});