import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User } from 'lucide-react-native';
import NutritionBar from '@/components/NutritionBar';
import Colors from '@/constants/colors';

export default function TutorialNutritionScreen() {
  // Mock data for demonstration
  const mockProfile = {
    name: 'John Doe',
    calorieGoal: 2000,
    proteinGoal: 150,
    carbsGoal: 250,
    fatGoal: 70,
  };

  const mockNutrition = {
    calories: 1200,
    protein: 80,
    carbs: 150,
    fat: 45,
  };

  const remainingCalories = mockProfile.calorieGoal - mockNutrition.calories;
  const remainingProtein = mockProfile.proteinGoal - mockNutrition.protein;
  const remainingCarbs = mockProfile.carbsGoal - mockNutrition.carbs;
  const remainingFat = mockProfile.fatGoal - mockNutrition.fat;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.userSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <User size={40} color={Colors.white} />
            </View>
          </View>
          
          <Text style={styles.userName}>{mockProfile.name}</Text>
          
          <View style={styles.userInfoRow}>
            <View style={styles.userInfoItem}>
              <Text style={styles.userInfoLabel}>Diet Type</Text>
              <Text style={styles.userInfoValue}>Balanced</Text>
            </View>
            
            <View style={styles.userInfoItem}>
              <Text style={styles.userInfoLabel}>Calorie Goal</Text>
              <Text style={styles.userInfoValue}>{mockProfile.calorieGoal} kcal</Text>
            </View>
          </View>
        </View>
        
        {/* Nutrition Tracking Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Daily Nutrition Tracking</Text>
          <Text style={styles.sectionSubtitle}>Monitor your progress with visual indicators</Text>
        </View>

        <NutritionBar
          calories={mockNutrition.calories}
          protein={mockNutrition.protein}
          carbs={mockNutrition.carbs}
          fat={mockNutrition.fat}
          calorieGoal={mockProfile.calorieGoal}
          proteinGoal={mockProfile.proteinGoal}
          carbsGoal={mockProfile.carbsGoal}
          fatGoal={mockProfile.fatGoal}
        />

        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Remaining Today</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{remainingCalories}</Text>
              <Text style={styles.summaryLabel}>Calories</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{remainingProtein}g</Text>
              <Text style={styles.summaryLabel}>Protein</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{remainingCarbs}g</Text>
              <Text style={styles.summaryLabel}>Carbs</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{remainingFat}g</Text>
              <Text style={styles.summaryLabel}>Fat</Text>
            </View>
          </View>
        </View>

        {/* Goals Section */}
        <View style={styles.goalsContainer}>
          <Text style={styles.goalsTitle}>Your Nutrition Goals</Text>
          
          <View style={styles.goalItem}>
            <View style={styles.goalHeader}>
              <Text style={styles.goalLabel}>Daily Calories</Text>
              <Text style={styles.goalValue}>{mockNutrition.calories} / {mockProfile.calorieGoal}</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar, 
                  { width: `${(mockNutrition.calories / mockProfile.calorieGoal) * 100}%` }
                ]} 
              />
            </View>
          </View>
          
          <View style={styles.goalItem}>
            <View style={styles.goalHeader}>
              <Text style={styles.goalLabel}>Protein</Text>
              <Text style={styles.goalValue}>{mockNutrition.protein}g / {mockProfile.proteinGoal}g</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar, 
                  styles.progressBarProtein,
                  { width: `${(mockNutrition.protein / mockProfile.proteinGoal) * 100}%` }
                ]} 
              />
            </View>
          </View>
          
          <View style={styles.goalItem}>
            <View style={styles.goalHeader}>
              <Text style={styles.goalLabel}>Carbs</Text>
              <Text style={styles.goalValue}>{mockNutrition.carbs}g / {mockProfile.carbsGoal}g</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar, 
                  styles.progressBarCarbs,
                  { width: `${(mockNutrition.carbs / mockProfile.carbsGoal) * 100}%` }
                ]} 
              />
            </View>
          </View>
          
          <View style={styles.goalItem}>
            <View style={styles.goalHeader}>
              <Text style={styles.goalLabel}>Fat</Text>
              <Text style={styles.goalValue}>{mockNutrition.fat}g / {mockProfile.fatGoal}g</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar, 
                  styles.progressBarFat,
                  { width: `${(mockNutrition.fat / mockProfile.fatGoal) * 100}%` }
                ]} 
              />
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
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: Colors.surface,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 8,
  },
  userSection: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  avatarContainer: {
    marginBottom: 20,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 20,
    letterSpacing: -0.4,
  },
  userInfoRow: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 20,
  },
  userInfoItem: {
    flex: 1,
    alignItems: 'center',
  },
  userInfoLabel: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 6,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userInfoValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.1,
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '400',
  },
  summaryContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    marginTop: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  summaryLabel: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '500',
    marginTop: 2,
  },
  goalsContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  goalsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  goalItem: {
    marginBottom: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  goalLabel: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
  },
  goalValue: {
    fontSize: 14,
    color: Colors.textLight,
    fontWeight: '500',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  progressBarProtein: {
    backgroundColor: '#4CAF50',
  },
  progressBarCarbs: {
    backgroundColor: '#2196F3',
  },
  progressBarFat: {
    backgroundColor: '#FF9800',
  },
});