import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { User, Edit, Plus, RefreshCw, Key, Crown } from 'lucide-react-native';
import { useUserStore } from '@/store/userStore';
import { useFoodLogStore } from '@/store/foodLogStore';
import { useRecipeStore } from '@/store/recipeStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import DateSelector from '@/components/DateSelector';
import NutritionBar from '@/components/NutritionBar';
import FoodLogItem from '@/components/FoodLogItem';
import Colors from '@/constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as edamamService from '@/services/edamamService';
import { FoodItem } from '@/types';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile } = useUserStore();
  const { foodLog, removeFoodEntry } = useFoodLogStore();
  const { apiSources, setApiSource, loadRecipesFromApi } = useRecipeStore();
  const { subscription } = useSubscriptionStore();
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

  const handleToggleSpoonacular = () => {
    const newValue = !apiSources.useSpoonacular;
    setApiSource('useSpoonacular', newValue);
    
    if (newValue) {
      Alert.alert(
        "Spoonacular API Enabled",
        "The app will now use Spoonacular API to fetch recipes. Refresh recipes to see new content.",
        [
          {
            text: "Refresh Now",
            onPress: () => loadRecipesFromApi(false)
          },
          {
            text: "Later",
            style: "cancel"
          }
        ]
      );
    } else {
      Alert.alert(
        "Spoonacular API Disabled",
        "The app will no longer use Spoonacular API to fetch recipes.",
        [{ text: "OK" }]
      );
    }
  };

  const handleToggleEdamam = () => {
    if (!apiSources.useEdamam) {
      if (edamamConfigured) {
        setApiSource('useEdamam', true);
        Alert.alert(
          "Edamam API Enabled",
          "The app will now use Edamam API to fetch recipes. Refresh recipes to see new content.",
          [
            {
              text: "Refresh Now",
              onPress: () => loadRecipesFromApi(false)
            },
            {
              text: "Later",
              style: "cancel"
            }
          ]
        );
      } else {
        Alert.alert(
          "Edamam API Configuration Required",
          "To use Edamam API, you need to configure your API credentials in the API Settings screen.",
          [
            {
              text: "Configure Now",
              onPress: () => router.push('/api-settings')
            },
            {
              text: "Later",
              style: "cancel"
            }
          ]
        );
      }
    } else {
      setApiSource('useEdamam', false);
      Alert.alert(
        "Edamam API Disabled",
        "The app will no longer use Edamam API to fetch recipes.",
        [{ text: "OK" }]
      );
    }
  };

  const handleManageSubscription = () => {
    router.push('/subscription');
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
        
        {/* Subscription Section */}
        <View style={styles.subscriptionSection}>
          <View style={styles.subscriptionHeader}>
            <View style={styles.subscriptionIconContainer}>
              <Crown size={24} color={Colors.white} />
            </View>
            <View style={styles.subscriptionInfo}>
              <Text style={styles.subscriptionTitle}>
                {subscription.status === 'active' || subscription.isLifetime
                  ? 'Premium Subscription'
                  : subscription.status === 'trial'
                  ? 'Trial Subscription'
                  : 'Free Plan'}
              </Text>
              <Text style={styles.subscriptionStatus}>
                {subscription.status === 'active'
                  ? `${subscription.plan?.charAt(0).toUpperCase()}${subscription.plan?.slice(1)} Plan`
                  : subscription.isLifetime
                  ? 'Lifetime Access'
                  : subscription.status === 'trial'
                  ? 'Trial Period'
                  : 'Upgrade to unlock all features'}
              </Text>
            </View>
          </View>
          
          <Pressable 
            style={styles.subscriptionButton} 
            onPress={handleManageSubscription}
          >
            <Text style={styles.subscriptionButtonText}>
              {subscription.status === 'active' || subscription.isLifetime
                ? 'Manage Subscription'
                : 'Upgrade to Premium'}
            </Text>
          </Pressable>
        </View>
        
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
        
        {/* API Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recipe Data</Text>
          
          <View style={styles.apiInfoRow}>
            <Text style={styles.apiInfoLabel}>MealDB API:</Text>
            <Pressable 
              style={styles.apiToggleButton} 
              onPress={() => setApiSource('useMealDB', !apiSources.useMealDB)}
            >
              <Text style={[
                styles.apiToggleText, 
                apiSources.useMealDB ? styles.apiToggleTextEnabled : styles.apiToggleTextDisabled
              ]}>
                {apiSources.useMealDB ? 'Enabled' : 'Disabled'}
              </Text>
            </Pressable>
          </View>
          
          <View style={styles.apiInfoRow}>
            <Text style={styles.apiInfoLabel}>Spoonacular API:</Text>
            <Pressable 
              style={styles.apiToggleButton} 
              onPress={handleToggleSpoonacular}
            >
              <Text style={[
                styles.apiToggleText, 
                apiSources.useSpoonacular ? styles.apiToggleTextEnabled : styles.apiToggleTextDisabled
              ]}>
                {apiSources.useSpoonacular ? 'Enabled' : 'Disabled'}
              </Text>
            </Pressable>
          </View>
          
          <View style={styles.apiInfoRow}>
            <View style={styles.apiInfoLabelContainer}>
              <Text style={styles.apiInfoLabel}>Edamam API:</Text>
              {edamamConfigured && (
                <View style={styles.apiKeyBadge}>
                  <Key size={12} color={Colors.success} />
                  <Text style={styles.apiKeyBadgeText}>Configured</Text>
                </View>
              )}
            </View>
            <Pressable 
              style={styles.apiToggleButton} 
              onPress={handleToggleEdamam}
            >
              <Text style={[
                styles.apiToggleText, 
                apiSources.useEdamam ? styles.apiToggleTextEnabled : styles.apiToggleTextDisabled
              ]}>
                {apiSources.useEdamam ? 'Enabled' : 'Disabled'}
              </Text>
            </Pressable>
          </View>
          
          <Pressable style={styles.refreshButton} onPress={handleRefreshRecipes}>
            <RefreshCw size={16} color={Colors.white} />
            <Text style={styles.refreshButtonText}>Refresh Recipes</Text>
          </Pressable>
          
          <Pressable 
            style={styles.advancedButton} 
            onPress={() => router.push('/api-settings')}
          >
            <Text style={styles.advancedButtonText}>Advanced API Settings</Text>
          </Pressable>
        </View>
        
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>App Version 1.0.0</Text>
          
          {/* Debug button - remove in production */}
          <Pressable 
            style={styles.debugButton} 
            onPress={() => router.push('/subscription/debug')}
          >
            <Text style={styles.debugButtonText}>Debug Subscription</Text>
          </Pressable>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 0,
  },
  userSection: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  userInfoRow: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 16,
  },
  userInfoItem: {
    flex: 1,
    alignItems: 'center',
  },
  userInfoLabel: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 4,
  },
  userInfoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  allergiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  allergiesLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textLight,
    marginRight: 4,
  },
  allergiesValue: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  editButtonText: {
    color: Colors.white,
    fontWeight: '600',
    marginLeft: 8,
  },
  subscriptionSection: {
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
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  subscriptionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  subscriptionStatus: {
    fontSize: 14,
    color: Colors.textLight,
  },
  subscriptionButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  subscriptionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
  },
  sectionHeader: {
    marginTop: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
  },
  summaryContainer: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textLight,
  },
  addButtonContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
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
  apiInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  apiInfoLabel: {
    fontSize: 16,
    color: Colors.text,
  },
  apiInfoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  apiKeyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  apiKeyBadgeText: {
    fontSize: 10,
    color: Colors.success,
    marginLeft: 4,
  },
  apiToggleButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: Colors.background,
  },
  apiToggleText: {
    fontSize: 14,
    fontWeight: '500',
  },
  apiToggleTextEnabled: {
    color: Colors.primary,
  },
  apiToggleTextDisabled: {
    color: Colors.textLight,
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
    marginBottom: 12,
  },
  refreshButtonText: {
    color: Colors.white,
    fontWeight: '600',
    marginLeft: 8,
  },
  advancedButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  advancedButtonText: {
    color: Colors.primary,
    fontWeight: '500',
    fontSize: 14,
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
  debugButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  debugButtonText: {
    fontSize: 12,
    color: Colors.textLight,
    textDecorationLine: 'underline',
  },
});