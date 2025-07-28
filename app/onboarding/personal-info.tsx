import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowRight } from 'lucide-react-native';
import { useUserStore } from '@/store/userStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useTutorialStore } from '@/store/tutorialStore';
import { poundsToKg, feetInchesToCm } from '@/utils/unitConversions';
import Colors from '@/constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Validation constants
const VALIDATION_RANGES = {
  age: { min: 13, max: 120 },
  weight: { min: 50, max: 1000 }, // pounds
  height: {
    feet: { min: 3, max: 8 },
    inches: { min: 0, max: 11 }
  }
};

// Validation functions
const validateAge = (age: string): { isValid: boolean; error?: string } => {
  const ageNum = parseInt(age);
  if (isNaN(ageNum)) return { isValid: false, error: 'Please enter a valid age' };
  if (ageNum < VALIDATION_RANGES.age.min) return { isValid: false, error: `Age must be at least ${VALIDATION_RANGES.age.min}` };
  if (ageNum > VALIDATION_RANGES.age.max) return { isValid: false, error: `Age must be less than ${VALIDATION_RANGES.age.max}` };
  return { isValid: true };
};

const validateWeight = (weight: string): { isValid: boolean; error?: string } => {
  const weightNum = parseInt(weight);
  if (isNaN(weightNum)) return { isValid: false, error: 'Please enter a valid weight' };
  if (weightNum < VALIDATION_RANGES.weight.min) return { isValid: false, error: `Weight must be at least ${VALIDATION_RANGES.weight.min} lbs` };
  if (weightNum > VALIDATION_RANGES.weight.max) return { isValid: false, error: `Weight must be less than ${VALIDATION_RANGES.weight.max} lbs` };
  return { isValid: true };
};

const validateHeight = (feet: string, inches: string): { isValid: boolean; error?: string } => {
  const feetNum = parseInt(feet);
  const inchesNum = parseInt(inches);
  
  if (isNaN(feetNum)) return { isValid: false, error: 'Please enter valid feet' };
  if (isNaN(inchesNum)) return { isValid: false, error: 'Please enter valid inches' };
  
  if (feetNum < VALIDATION_RANGES.height.feet.min) return { isValid: false, error: `Height must be at least ${VALIDATION_RANGES.height.feet.min} feet` };
  if (feetNum > VALIDATION_RANGES.height.feet.max) return { isValid: false, error: `Height must be less than ${VALIDATION_RANGES.height.feet.max + 1} feet` };
  if (inchesNum < VALIDATION_RANGES.height.inches.min) return { isValid: false, error: 'Inches must be 0 or more' };
  if (inchesNum > VALIDATION_RANGES.height.inches.max) return { isValid: false, error: 'Inches must be 11 or less' };
  
  // Additional check for extremely short heights
  const totalInches = feetNum * 12 + inchesNum;
  if (totalInches < 36) return { isValid: false, error: 'Height must be at least 3 feet' };
  if (totalInches > 108) return { isValid: false, error: 'Height must be less than 9 feet' };
  
  return { isValid: true };
};

export default function PersonalInfoScreen() {
  const router = useRouter();
  const { updateHeightImperial, updateWeightImperial, updateProfile, setUserInfoSubmitted } = useUserStore();
  const { data, updatePersonalInfo } = useOnboardingStore();
  const { setShouldRedirectToOnboarding } = useTutorialStore();
  
  const [name, setName] = useState(data.name || '');
  const [age, setAge] = useState(data.age?.toString() || '');
  const [weightPounds, setWeightPounds] = useState('');
  const [heightFeet, setHeightFeet] = useState('');
  const [heightInches, setHeightInches] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>(data.gender || '');
  const [activityLevel, setActivityLevel] = useState<'sedentary' | 'light' | 'moderate' | 'active' | 'very-active' | ''>(data.activityLevel || '');
  
  // Initialize weight and height from stored data
  React.useEffect(() => {
    if (data.weight) {
      // Convert kg to pounds for display
      setWeightPounds(Math.round(data.weight * 2.20462).toString());
    }
    if (data.height) {
      // Convert cm to feet/inches for display
      const totalInches = data.height / 2.54;
      const feet = Math.floor(totalInches / 12);
      const inches = Math.round(totalInches % 12);
      setHeightFeet(feet.toString());
      setHeightInches(inches.toString());
    }
  }, [data.weight, data.height]);
  
  // Validation state
  const ageValidation = validateAge(age);
  const weightValidation = validateWeight(weightPounds);
  const heightValidation = validateHeight(heightFeet, heightInches);
  
  const isFormValid = name.trim() !== '' && 
                      age.trim() !== '' && 
                      weightPounds.trim() !== '' && 
                      heightFeet.trim() !== '' && 
                      heightInches.trim() !== '' && 
                      gender !== '' && 
                      activityLevel !== '' &&
                      ageValidation.isValid &&
                      weightValidation.isValid &&
                      heightValidation.isValid;
  
  const handleNext = async () => {
    if (!isFormValid) {
      // Show specific validation errors with helpful messages
      if (!ageValidation.isValid) {
        Alert.alert('Age Required', ageValidation.error! + '\n\nThis helps us calculate your daily nutrition needs.');
        return;
      }
      if (!weightValidation.isValid) {
        Alert.alert('Weight Required', weightValidation.error! + '\n\nWe use this to personalize your calorie goals.');
        return;
      }
      if (!heightValidation.isValid) {
        Alert.alert('Height Required', heightValidation.error! + '\n\nHeight helps us calculate your metabolic rate.');
        return;
      }
      if (name.trim() === '') {
        Alert.alert('Name Required', 'Please enter your name so we can personalize your experience.');
        return;
      }
      if (gender === '') {
        Alert.alert('Gender Required', 'This helps us provide more accurate nutrition recommendations.');
        return;
      }
      if (activityLevel === '') {
        Alert.alert('Activity Level Required', 'This helps us calculate your daily calorie needs.');
        return;
      }
      return;
    }
    
    try {
      // Convert imperial to metric and save to onboarding store
      const weightInKg = poundsToKg(parseInt(weightPounds));
      const heightInCm = feetInchesToCm(parseInt(heightFeet), parseInt(heightInches));
      
      const personalData = {
        name: name.trim(),
        age: parseInt(age),
        gender: gender as 'male' | 'female' | 'other',
        activityLevel: activityLevel as 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active',
        weight: weightInKg,
        height: heightInCm,
      };
      
      // Save to onboarding store
      updatePersonalInfo(personalData);
      
      // Save to user store for immediate use
      updateProfile(personalData);
      updateHeightImperial(parseInt(heightFeet), parseInt(heightInches));
      updateWeightImperial(parseInt(weightPounds));
      
      // Persist the data to AsyncStorage
      await AsyncStorage.setItem('user_personal_info', JSON.stringify(personalData));
      
      // Mark user info as submitted
      setUserInfoSubmitted(true);
      
      // Clear the redirect flag
      setShouldRedirectToOnboarding(false);
      
      // Navigate to dietary preferences to continue onboarding
      router.push('/onboarding/dietary-preferences');
    } catch (error) {
      console.error('Error saving personal info:', error);
      Alert.alert('Error', 'Failed to save your information. Please try again.');
    }
  };
  
  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <StatusBar style="dark" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Let's get to know you</Text>
          <Text style={styles.subtitle}>Tell us about yourself to get personalized meal recommendations</Text>
        </View>
        
        <View style={styles.form}>
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
              style={[styles.input, !ageValidation.isValid && age.trim() !== '' && styles.inputError]}
              placeholder="Your age (13-120)"
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
              placeholderTextColor={Colors.textLight}
            />
            {!ageValidation.isValid && age.trim() !== '' && (
              <Text style={styles.errorText}>{ageValidation.error}</Text>
            )}
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Weight (lbs)</Text>
            <TextInput
              style={[styles.input, !weightValidation.isValid && weightPounds.trim() !== '' && styles.inputError]}
              placeholder="Weight in pounds (50-1000)"
              value={weightPounds}
              onChangeText={setWeightPounds}
              keyboardType="numeric"
              placeholderTextColor={Colors.textLight}
            />
            {!weightValidation.isValid && weightPounds.trim() !== '' && (
              <Text style={styles.errorText}>{weightValidation.error}</Text>
            )}
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Height</Text>
            <View style={styles.heightInputContainer}>
              <View style={styles.heightInput}>
                <TextInput
                  style={[styles.input, !heightValidation.isValid && heightFeet.trim() !== '' && heightInches.trim() !== '' && styles.inputError]}
                  placeholder="Feet (3-8)"
                  value={heightFeet}
                  onChangeText={setHeightFeet}
                  keyboardType="numeric"
                  placeholderTextColor={Colors.textLight}
                />
                <Text style={styles.heightUnit}>ft</Text>
              </View>
              
              <View style={styles.heightInput}>
                <TextInput
                  style={[styles.input, !heightValidation.isValid && heightFeet.trim() !== '' && heightInches.trim() !== '' && styles.inputError]}
                  placeholder="Inches (0-11)"
                  value={heightInches}
                  onChangeText={setHeightInches}
                  keyboardType="numeric"
                  placeholderTextColor={Colors.textLight}
                />
                <Text style={styles.heightUnit}>in</Text>
              </View>
            </View>
            {!heightValidation.isValid && heightFeet.trim() !== '' && heightInches.trim() !== '' && (
              <Text style={styles.errorText}>{heightValidation.error}</Text>
            )}
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
                <Text style={styles.activityDescription}>Desk job, little to no exercise</Text>
              </Pressable>
              
              <Pressable
                style={[styles.activityOption, activityLevel === 'light' && styles.optionSelected]}
                onPress={() => setActivityLevel('light')}
              >
                <Text style={[styles.activityTitle, activityLevel === 'light' && styles.optionTextSelected]}>Lightly Active</Text>
                <Text style={styles.activityDescription}>Light exercise 1-3 days/week</Text>
              </Pressable>
              
              <Pressable
                style={[styles.activityOption, activityLevel === 'moderate' && styles.optionSelected]}
                onPress={() => setActivityLevel('moderate')}
              >
                <Text style={[styles.activityTitle, activityLevel === 'moderate' && styles.optionTextSelected]}>Moderately Active</Text>
                <Text style={styles.activityDescription}>Moderate exercise 3-5 days/week</Text>
              </Pressable>
              
              <Pressable
                style={[styles.activityOption, activityLevel === 'active' && styles.optionSelected]}
                onPress={() => setActivityLevel('active')}
              >
                <Text style={[styles.activityTitle, activityLevel === 'active' && styles.optionTextSelected]}>Very Active</Text>
                <Text style={styles.activityDescription}>Hard exercise 6-7 days/week</Text>
              </Pressable>
              
              <Pressable
                style={[styles.activityOption, activityLevel === 'very-active' && styles.optionSelected]}
                onPress={() => setActivityLevel('very-active')}
              >
                <Text style={[styles.activityTitle, activityLevel === 'very-active' && styles.optionTextSelected]}>Extremely Active</Text>
                <Text style={styles.activityDescription}>Very hard exercise & physical job</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <Pressable 
          style={[styles.button, !isFormValid && styles.buttonDisabled]} 
          onPress={handleNext}
          disabled={!isFormValid}
        >
          <Text style={styles.buttonText}>Next</Text>
          <ArrowRight size={20} color={Colors.white} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
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
  form: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
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
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
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
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
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
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
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
  buttonDisabled: {
    backgroundColor: Colors.primaryLight,
  },
  buttonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 18,
    marginRight: 8,
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
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