import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Check } from 'lucide-react-native';
import { useUserStore } from '@/store/userStore';
import { useTutorialStore } from '@/store/tutorialStore';
import Colors from '@/constants/colors';

export default function NutritionGoalsScreen() {
  const router = useRouter();
  const { profile, updateProfile, calculateNutritionGoals, login } = useUserStore();
  const { startTutorial } = useTutorialStore();
  
  const [calorieGoal, setCalorieGoal] = useState(profile.calorieGoal?.toString() || '');
  const [proteinGoal, setProteinGoal] = useState(profile.proteinGoal?.toString() || '');
  const [carbsGoal, setCarbsGoal] = useState(profile.carbsGoal?.toString() || '');
  const [fatGoal, setFatGoal] = useState(profile.fatGoal?.toString() || '');
  const [useCalculated, setUseCalculated] = useState(true);
  
  // Use a ref to track if we've calculated goals to prevent infinite loops
  const hasCalculatedRef = useRef(false);
  
  // Calculate nutrition goals only once when the screen loads
  useEffect(() => {
    if (!hasCalculatedRef.current) {
      calculateNutritionGoals();
      hasCalculatedRef.current = true;
    }
  }, [calculateNutritionGoals]); // Include calculateNutritionGoals in dependencies
  
  // Update local state when profile is updated with calculated values
  // Only run when profile values or useCalculated changes
  useEffect(() => {
    if (profile.calorieGoal && useCalculated) {
      setCalorieGoal(profile.calorieGoal.toString());
      setProteinGoal(profile.proteinGoal?.toString() || '');
      setCarbsGoal(profile.carbsGoal?.toString() || '');
      setFatGoal(profile.fatGoal?.toString() || '');
    }
  }, [profile.calorieGoal, profile.proteinGoal, profile.carbsGoal, profile.fatGoal, useCalculated]);
  
  const handleCustomToggle = () => {
    setUseCalculated(!useCalculated);
  };
  
  const handleComplete = () => {
    // Update profile with final nutrition goals
    updateProfile({
      calorieGoal: parseInt(calorieGoal) || profile.calorieGoal,
      proteinGoal: parseInt(proteinGoal) || profile.proteinGoal,
      carbsGoal: parseInt(carbsGoal) || profile.carbsGoal,
      fatGoal: parseInt(fatGoal) || profile.fatGoal,
      completedOnboarding: true,
    });
    
    // Complete login process
    login({
      ...profile,
      completedOnboarding: true,
    });
    
    // Navigate to main app
    router.replace('/(tabs)');
  };
  
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Nutrition Goals</Text>
          <Text style={styles.subtitle}>Let's set your daily nutrition targets to help you reach your goals</Text>
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>Step 3 of 3</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '100%' }]} />
            </View>
          </View>
        </View>
        
        <View style={styles.toggleContainer}>
          <Pressable 
            style={[styles.toggleOption, useCalculated && styles.toggleOptionActive]} 
            onPress={() => setUseCalculated(true)}
          >
            <Text style={[styles.toggleText, useCalculated && styles.toggleTextActive]}>
              Calculated
            </Text>
          </Pressable>
          
          <Pressable 
            style={[styles.toggleOption, !useCalculated && styles.toggleOptionActive]} 
            onPress={() => setUseCalculated(false)}
          >
            <Text style={[styles.toggleText, !useCalculated && styles.toggleTextActive]}>
              Custom
            </Text>
          </Pressable>
        </View>
        
        {useCalculated ? (
          <View style={styles.calculatedContainer}>
            <Text style={styles.calculatedText}>
              Great! Based on your profile, we've calculated personalized daily nutrition goals for you:
            </Text>
            
            <View style={styles.goalItem}>
              <Text style={styles.goalLabel}>Calories</Text>
              <Text style={styles.goalValue}>{profile.calorieGoal || '—'} kcal</Text>
            </View>
            
            <View style={styles.goalItem}>
              <Text style={styles.goalLabel}>Protein</Text>
              <Text style={styles.goalValue}>{profile.proteinGoal || '—'} g</Text>
            </View>
            
            <View style={styles.goalItem}>
              <Text style={styles.goalLabel}>Carbs</Text>
              <Text style={styles.goalValue}>{profile.carbsGoal || '—'} g</Text>
            </View>
            
            <View style={styles.goalItem}>
              <Text style={styles.goalLabel}>Fat</Text>
              <Text style={styles.goalValue}>{profile.fatGoal || '—'} g</Text>
            </View>
            
            <Pressable style={styles.customizeButton} onPress={handleCustomToggle}>
              <Text style={styles.customizeButtonText}>Customize Goals</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.customContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Daily Calories (kcal)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 2000"
                value={calorieGoal}
                onChangeText={setCalorieGoal}
                keyboardType="numeric"
                placeholderTextColor={Colors.textLight}
                editable={!useCalculated}
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
                editable={!useCalculated}
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
                editable={!useCalculated}
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
                editable={!useCalculated}
              />
            </View>
          </View>
        )}
      </ScrollView>
      
      <View style={styles.footer}>
        <Pressable style={styles.completeButton} onPress={handleComplete}>
          <Check size={20} color={Colors.white} />
          <Text style={styles.completeButtonText}>Start Using Zestora</Text>
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
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 12,
    marginBottom: 24,
    padding: 4,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleOptionActive: {
    backgroundColor: Colors.white,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  toggleText: {
    fontSize: 16,
    color: Colors.textLight,
  },
  toggleTextActive: {
    color: Colors.text,
    fontWeight: '500',
  },
  calculatedContainer: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  calculatedText: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 20,
  },
  goalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  goalLabel: {
    fontSize: 16,
    color: Colors.text,
  },
  goalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  customizeButton: {
    marginTop: 20,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 12,
  },
  customizeButtonText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '500',
  },
  customContainer: {
    marginBottom: 24,
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
  completeButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 8,
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