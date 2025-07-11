import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { User, Edit, Plus, RefreshCw, Key } from 'lucide-react-native';
import { useUserStore } from '@/store/userStore';
import { useFoodLogStore } from '@/store/foodLogStore';
import { useRecipeStore } from '@/store/recipeStore';
import DateSelector from '@/components/DateSelector';
import NutritionBar from '@/components/NutritionBar';
import FoodLogItem from '@/components/FoodLogItem';
import Colors from '@/constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as edamamService from '@/services/edamamService';
import { FoodItem } from '@/types';
import TutorialOverlay from '@/components/TutorialOverlay';
import { useTutorialStore } from '@/store/tutorialStore';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile } = useUserStore();
  const { resetTutorial } = useTutorialStore();
  const { foodLog, removeFoodEntry } = useFoodLogStore();
  const { apiSources, setApiSource, loadRecipesFromApi } = useRecipeStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [edamamConfigured, setEdamamConfigured] = useState(false);
  
  const dateString = selectedDate.toISOString().split('T')[0];
  const dayLog = foodLog[dateString] || { 
    totalCalories: 0, 
    totalProtein: 0, 
    totalCarbs: 0, 
    totalFat: 0,
    meals: []
  };

  // Check if Edamam credentials are configured
  useEffect(() => {
    const checkEdamamCredentials = async () => {
      const isConfigured = await edamamService.checkEdamamCredentials();
      setEdamamConfigured(isConfigured);
    };
    
    checkEdamamCredentials();
  }, []);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  const handleAddFood = () => {
    router.push(`/add-food/${dateString}`);
  };

  const handleRemoveFood = (index: number) => {
    removeFoodEntry(dateString, index);
  };

  const handleEditFood = (index: number) => {
    router.push(`/add-food/${dateString}?index=${index}`);
  };

  const handleRefreshRecipes = () => {
    loadRecipesFromApi(false);
    Alert.alert(
      "Recipes Refreshed",
      "Recipe data has been refreshed from the selected sources.",
      [{ text: "OK" }]
    );
  };

  // Group meals by meal type
  const groupedMeals: Record<string, FoodItem[]> = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: []
  };

  // Populate grouped meals
  dayLog.meals.forEach((meal) => {
    const mealType = meal.mealType === 'snacks' ? 'snack' : meal.mealType;
    if (!groupedMeals[mealType]) {
      groupedMeals[mealType] = [];
    }
    groupedMeals[mealType].push(meal);
  });

  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];

  // Calculate remaining calories and macros
  const remainingCalories = (profile.calorieGoal || 2000) - dayLog.totalCalories;
  const remainingProtein = (profile.proteinGoal || 100) - dayLog.totalProtein;
  const remainingCarbs = (profile.carbsGoal || 250) - dayLog.totalCarbs;
  const remainingFat = (profile.fatGoal || 70) - dayLog.totalFat;
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <TutorialOverlay currentScreen="profile" />
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
          
          <Text style={styles.userName}>{profile.name || 'User'}</Text>
          
          <View style={styles.userInfoRow}>
            <View style={styles.userInfoItem}>
              <Text style={styles.userInfoLabel}>Diet Type</Text>
              <Text style={styles.userInfoValue}>{profile.dietType || 'Not set'}</Text>
            </View>
            
            <View style={styles.userInfoItem}>
              <Text style={styles.userInfoLabel}>Calorie Goal</Text>
              <Text style={styles.userInfoValue}>{profile.calorieGoal} kcal</Text>
            </View>
          </View>
          
          <View style={styles.allergiesContainer}>
            <Text style={styles.allergiesLabel}>Allergies:</Text>
            <Text style={styles.allergiesValue}>
              {profile.allergies && profile.allergies.length > 0 ? profile.allergies.join(', ') : 'None'}
            </Text>
          </View>
          
          <Pressable 
            style={styles.editButton} 
            onPress={() => router.push('/profile/edit')}
          >
            <Edit size={16} color={Colors.white} />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </Pressable>
        </View>
        
        {/* Subscription Section Removed */}
        
        {/* Calorie Tracker Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Calorie Tracker</Text>
          <Text style={styles.sectionSubtitle}>Track your daily nutrition</Text>
        </View>

        <DateSelector selectedDate={selectedDate} onDateChange={handleDateChange} />

        <NutritionBar
          calories={dayLog.totalCalories}
          protein={dayLog.totalProtein}
          carbs={dayLog.totalCarbs}
          fat={dayLog.totalFat}
        />

        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Remaining Today</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{remainingCalories > 0 ? remainingCalories : 0}</Text>
              <Text style={styles.summaryLabel}>Calories</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{remainingProtein > 0 ? remainingProtein : 0}g</Text>
              <Text style={styles.summaryLabel}>Protein</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{remainingCarbs > 0 ? remainingCarbs : 0}g</Text>
              <Text style={styles.summaryLabel}>Carbs</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{remainingFat > 0 ? remainingFat : 0}g</Text>
              <Text style={styles.summaryLabel}>Fat</Text>
            </View>
          </View>
        </View>

        <View style={styles.addButtonContainer}>
          <Pressable style={styles.addButton} onPress={handleAddFood}>
            <Plus size={20} color={Colors.white} />
            <Text style={styles.addButtonText}>Add Food</Text>
          </Pressable>
        </View>

        {dayLog.meals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No food entries for this day</Text>
            <Text style={styles.emptySubtext}>Tap the button above to add your first meal</Text>
          </View>
        ) : (
          mealTypes.map(mealType => {
            const meals = mealType === 'snack' ? 
              groupedMeals['snack'] : 
              groupedMeals[mealType];
              
            if (!meals || meals.length === 0) return null;
            
            return (
              <View key={mealType} style={styles.mealTypeContainer}>
                <Text style={styles.mealTypeTitle}>{mealType.charAt(0).toUpperCase() + mealType.slice(1)}</Text>
                {meals.map((meal: FoodItem, index: number) => {
                  // Find the original index in the combined array
                  const originalIndex = dayLog.meals.findIndex(m => 
                    m.id === meal.id && m.time === meal.time
                  );
                  
                  return (
                    <FoodLogItem
                      key={`${meal.name}-${meal.time}-${index}`}
                      entry={meal}
                      onRemove={() => handleRemoveFood(originalIndex)}
                      onPress={() => handleEditFood(originalIndex)}
                    />
                  );
                })}
              </View>
            );
          })
        )}
        
        {/* Recipe Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recipe Data</Text>
          
          <Pressable style={styles.refreshButton} onPress={handleRefreshRecipes}>
            <RefreshCw size={16} color={Colors.white} />
            <Text style={styles.refreshButtonText}>Refresh Recipes</Text>
          </Pressable>
        </View>
        
        {/* Tutorial Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Help & Tutorial</Text>
          
          <Pressable style={styles.tutorialButton} onPress={resetTutorial}>
            <Text style={styles.tutorialButtonText}>Restart Tutorial</Text>
          </Pressable>
          
          <Pressable style={styles.helpButton} onPress={() => router.push('/help')}>
            <Text style={styles.helpButtonText}>Help & FAQ</Text>
          </Pressable>
        </View>
        
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>App Version 1.0.0</Text>
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
  allergiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  allergiesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginRight: 8,
  },
  allergiesValue: {
    fontSize: 15,
    color: Colors.text,
    flex: 1,
    fontWeight: '500',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  editButtonText: {
    color: Colors.white,
    fontWeight: '700',
    marginLeft: 10,
    fontSize: 16,
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
  addButtonContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 17,
    marginLeft: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
  },
  mealTypeContainer: {
    marginBottom: 20,
  },
  mealTypeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  refreshButtonText: {
    color: Colors.white,
    fontWeight: '600',
    marginLeft: 8,
  },
  tutorialButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  tutorialButtonText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  helpButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  helpButtonText: {
    color: Colors.text,
    fontWeight: '600',
  },
  versionContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  versionText: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 8,
  },
});