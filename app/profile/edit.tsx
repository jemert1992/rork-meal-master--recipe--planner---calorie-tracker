import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useUserStore } from '@/store/userStore';
import Colors from '@/constants/colors';
import { DietType } from '@/types';

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile, updateProfile } = useUserStore();
  
  // Local state for form fields
  const [name, setName] = useState(profile.name);
  const [dietType, setDietType] = useState<DietType | undefined>(profile.dietType);
  const [calorieGoal, setCalorieGoal] = useState(profile.calorieGoal?.toString() || '');
  const [allergies, setAllergies] = useState(profile.allergies?.join(', ') || '');
  
  // Custom handler for diet type input
  const handleDietTypeChange = (text: string) => {
    // Validate if the input is a valid diet type
    const validDietTypes: DietType[] = [
      'any', 'vegetarian', 'vegan', 'keto', 'paleo', 
      'gluten-free', 'dairy-free', 'low-carb'
    ];
    
    if (validDietTypes.includes(text as DietType)) {
      setDietType(text as DietType);
    } else if (text === '') {
      // Allow empty input
      setDietType(undefined);
    }
    // Ignore invalid inputs
  };
  
  const handleSave = () => {
    // Update user profile
    updateProfile({
      name,
      dietType,
      calorieGoal: parseInt(calorieGoal) || 2000,
      allergies: allergies.split(',').map((item: string) => item.trim()).filter((item: string) => item),
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
            <TextInput
              style={styles.input}
              value={dietType}
              onChangeText={handleDietTypeChange}
              placeholder="e.g., vegetarian, keto, etc."
            />
            <Text style={styles.helperText}>
              Valid options: any, vegetarian, vegan, keto, paleo, gluten-free, dairy-free, low-carb
            </Text>
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
            <TextInput
              style={styles.input}
              value={allergies}
              onChangeText={setAllergies}
              placeholder="e.g., nuts, dairy, gluten"
            />
            <Text style={styles.helperText}>Separate with commas</Text>
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
    marginBottom: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
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
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 4,
  },
});