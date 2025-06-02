import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowRight, Check } from 'lucide-react-native';
import { useUserStore } from '@/store/userStore';
import Colors from '@/constants/colors';

export default function DietaryPreferencesScreen() {
  const router = useRouter();
  const { updateProfile } = useUserStore();
  
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
  
  const dietaryOptions = [
    { id: 'vegetarian', label: 'Vegetarian', description: 'No meat, fish, or poultry' },
    { id: 'vegan', label: 'Vegan', description: 'No animal products' },
    { id: 'pescatarian', label: 'Pescatarian', description: 'No meat or poultry, but includes fish' },
    { id: 'gluten-free', label: 'Gluten-Free', description: 'No wheat, barley, or rye' },
    { id: 'dairy-free', label: 'Dairy-Free', description: 'No milk, cheese, or dairy products' },
    { id: 'keto', label: 'Keto', description: 'High-fat, low-carb diet' },
    { id: 'paleo', label: 'Paleo', description: 'Based on foods presumed to be available to paleolithic humans' },
    { id: 'low-carb', label: 'Low-Carb', description: 'Reduced carbohydrate consumption' },
    { id: 'low-fat', label: 'Low-Fat', description: 'Reduced fat consumption' },
    { id: 'mediterranean', label: 'Mediterranean', description: 'Based on the traditional foods of Mediterranean countries' },
  ];
  
  const togglePreference = (id: string) => {
    if (selectedPreferences.includes(id)) {
      setSelectedPreferences(selectedPreferences.filter(p => p !== id));
    } else {
      setSelectedPreferences([...selectedPreferences, id]);
    }
  };
  
  const handleNext = () => {
    updateProfile({
      dietaryPreferences: selectedPreferences,
    });
    
    router.push('/onboarding/nutrition-goals');
  };
  
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Dietary Preferences</Text>
          <Text style={styles.subtitle}>Select any dietary preferences or restrictions you have</Text>
        </View>
        
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
              <View style={styles.preferenceContent}>
                <Text style={[
                  styles.preferenceLabel,
                  selectedPreferences.includes(option.id) && styles.preferenceLabelSelected
                ]}>
                  {option.label}
                </Text>
                <Text style={styles.preferenceDescription}>{option.description}</Text>
              </View>
              
              {selectedPreferences.includes(option.id) && (
                <View style={styles.checkmark}>
                  <Check size={20} color={Colors.white} />
                </View>
              )}
            </Pressable>
          ))}
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
  preferencesContainer: {
    marginBottom: 24,
  },
  preferenceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  preferenceSelected: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  preferenceContent: {
    flex: 1,
  },
  preferenceLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  preferenceLabelSelected: {
    color: Colors.primary,
  },
  preferenceDescription: {
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