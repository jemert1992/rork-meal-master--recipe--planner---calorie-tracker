import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRecipeStore } from '@/store/recipeStore';
import { useMealPlanStore } from '@/store/mealPlanStore';
import { useUserStore } from '@/store/userStore';
import { Stack } from 'expo-router';
import { Settings, RefreshCw, Database, AlertCircle } from 'lucide-react-native';

export default function SettingsScreen() {
  const { apiSources, setApiSource, loadRecipesFromApi, isLoading } = useRecipeStore();
  const [refreshing, setRefreshing] = useState(false);
  const userProfile = useUserStore((state) => state.profile);
  
  const handleRefreshRecipes = async () => {
    setRefreshing(true);
    try {
      await loadRecipesFromApi();
      Alert.alert('Success', 'Recipe database refreshed successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh recipes. Please try again later.');
      console.error(error);
    } finally {
      setRefreshing(false);
    }
  };
  
  const handleToggleApiSource = (source: string, value: boolean) => {
    // For Spoonacular and Edamam, show a message about API keys
    if ((source === 'useSpoonacular' || source === 'useEdamam') && value) {
      Alert.alert(
        'API Key Required',
        `To use the ${source === 'useSpoonacular' ? 'Spoonacular' : 'Edamam'} API, you need to add your API key in the recipeApiService.ts file.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Enable Anyway', 
            onPress: () => setApiSource(source, value) 
          }
        ]
      );
    } else {
      setApiSource(source, value);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen 
        options={{
          title: 'Settings',
          headerRight: () => <Settings size={24} color="#007AFF" />,
        }}
      />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recipe Data Sources</Text>
          <Text style={styles.sectionDescription}>
            Choose which recipe APIs to use for searching and generating meal plans.
          </Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>TheMealDB</Text>
              <Text style={styles.settingDescription}>Free recipe database with images and instructions</Text>
            </View>
            <Switch
              value={apiSources.useMealDB}
              onValueChange={(value) => handleToggleApiSource('useMealDB', value)}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={apiSources.useMealDB ? '#007AFF' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Spoonacular</Text>
              <Text style={styles.settingDescription}>Comprehensive recipe API with nutrition data (requires API key)</Text>
            </View>
            <Switch
              value={apiSources.useSpoonacular}
              onValueChange={(value) => handleToggleApiSource('useSpoonacular', value)}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={apiSources.useSpoonacular ? '#007AFF' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Edamam</Text>
              <Text style={styles.settingDescription}>Recipe API with detailed nutrition analysis (requires API key)</Text>
            </View>
            <Switch
              value={apiSources.useEdamam}
              onValueChange={(value) => handleToggleApiSource('useEdamam', value)}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={apiSources.useEdamam ? '#007AFF' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.refreshContainer}>
            <Text style={styles.refreshText}>Refresh recipe database</Text>
            {refreshing || isLoading ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <RefreshCw 
                size={24} 
                color="#007AFF" 
                onPress={handleRefreshRecipes}
                style={styles.refreshIcon}
              />
            )}
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Profile</Text>
          
          <View style={styles.profileInfoItem}>
            <Text style={styles.profileLabel}>Diet Type:</Text>
            <Text style={styles.profileValue}>{userProfile.dietType || 'Not set'}</Text>
          </View>
          
          <View style={styles.profileInfoItem}>
            <Text style={styles.profileLabel}>Calorie Goal:</Text>
            <Text style={styles.profileValue}>{userProfile.calorieGoal || 'Not set'} kcal</Text>
          </View>
          
          <View style={styles.profileInfoItem}>
            <Text style={styles.profileLabel}>Allergies:</Text>
            <Text style={styles.profileValue}>
              {userProfile.allergies && userProfile.allergies.length > 0 
                ? userProfile.allergies.join(', ') 
                : 'None'}
            </Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Recipe APIs</Text>
          
          <View style={styles.infoBox}>
            <AlertCircle size={20} color="#007AFF" style={styles.infoIcon} />
            <Text style={styles.infoText}>
              To use Spoonacular or Edamam APIs, you need to register for an API key on their websites:
            </Text>
          </View>
          
          <Text style={styles.apiInfo}>• Spoonacular: spoonacular.com/food-api</Text>
          <Text style={styles.apiInfo}>• Edamam: developer.edamam.com/edamam-recipe-api</Text>
          
          <View style={styles.infoBox}>
            <Database size={20} color="#007AFF" style={styles.infoIcon} />
            <Text style={styles.infoText}>
              After getting your API keys, add them to the recipeApiService.ts file.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    marginVertical: 10,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  settingDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  refreshContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingVertical: 12,
  },
  refreshText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  refreshIcon: {
    padding: 4,
  },
  profileInfoItem: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  profileLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    width: 100,
  },
  profileValue: {
    fontSize: 15,
    color: '#666',
    flex: 1,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#F0F7FF',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  apiInfo: {
    fontSize: 14,
    color: '#666',
    marginLeft: 28,
    marginVertical: 4,
  },
});