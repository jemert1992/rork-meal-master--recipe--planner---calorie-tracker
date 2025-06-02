import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowRight } from 'lucide-react-native';
import { useUserStore } from '@/store/userStore';
import Colors from '@/constants/colors';

export default function PersonalInfoScreen() {
  const router = useRouter();
  const { updateHeightImperial, updateWeightImperial, updateProfile } = useUserStore();
  
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [weightPounds, setWeightPounds] = useState('');
  const [heightFeet, setHeightFeet] = useState('');
  const [heightInches, setHeightInches] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
  const [activityLevel, setActivityLevel] = useState<'sedentary' | 'light' | 'moderate' | 'active' | 'very-active' | ''>('');
  
  const isFormValid = name.trim() !== '' && 
                      age.trim() !== '' && 
                      weightPounds.trim() !== '' && 
                      heightFeet.trim() !== '' && 
                      heightInches.trim() !== '' && 
                      gender !== '' && 
                      activityLevel !== '';
  
  const handleNext = () => {
    if (!isFormValid) return;
    
    // Update profile with name, age, gender, and activity level
    updateProfile({
      name: name.trim(),
      age: parseInt(age),
      gender: gender as 'male' | 'female' | 'other',
      activityLevel: activityLevel as 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active',
    });
    
    // Update height and weight with imperial values
    updateHeightImperial(parseInt(heightFeet), parseInt(heightInches));
    updateWeightImperial(parseInt(weightPounds));
    
    router.push('/onboarding/dietary-preferences');
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
          <Text style={styles.title}>Tell us about yourself</Text>
          <Text style={styles.subtitle}>We'll use this information to personalize your experience</Text>
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
});