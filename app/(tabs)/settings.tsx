import React, { useState } from 'react';
import { StyleSheet, View, Text, Switch, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RefreshCw, Info, HelpCircle, ExternalLink } from 'lucide-react-native';
import { useRecipeStore } from '@/store/recipeStore';
import Colors from '@/constants/colors';

export default function SettingsScreen() {
  const { 
    apiSources, 
    setApiSource, 
    loadRecipesFromApi, 
    isLoading,
    recipes
  } = useRecipeStore();
  
  const [refreshing, setRefreshing] = useState(false);
  
  const handleToggleSource = (source: string, value: boolean) => {
    setApiSource(source, value);
  };
  
  const handleRefreshRecipes = async () => {
    setRefreshing(true);
    try {
      await loadRecipesFromApi();
      Alert.alert('Success', `Loaded ${recipes.length} recipes successfully!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh recipes. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Configure app preferences</Text>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recipe Data Sources</Text>
          <Text style={styles.sectionSubtitle}>
            Choose which recipe APIs to use for searching and generating meal plans.
          </Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>TheMealDB</Text>
              <Text style={styles.settingDescription}>
                Free recipe database with images and instructions
              </Text>
            </View>
            <Switch
              value={apiSources.useMealDB}
              onValueChange={(value) => handleToggleSource('useMealDB', value)}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Spoonacular</Text>
              <Text style={styles.settingDescription}>
                Comprehensive recipe API with nutrition data
              </Text>
            </View>
            <Switch
              value={apiSources.useSpoonacular}
              onValueChange={(value) => handleToggleSource('useSpoonacular', value)}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Edamam</Text>
              <Text style={styles.settingDescription}>
                Recipe API with detailed nutrition analysis
              </Text>
            </View>
            <Switch
              value={apiSources.useEdamam}
              onValueChange={(value) => handleToggleSource('useEdamam', value)}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>
          
          <Pressable 
            style={styles.refreshButton} 
            onPress={handleRefreshRecipes}
            disabled={isLoading || refreshing}
          >
            <RefreshCw size={16} color={Colors.white} />
            <Text style={styles.refreshButtonText}>
              {refreshing ? 'Refreshing...' : 'Refresh Recipe Database'}
            </Text>
          </Pressable>
          
          <Text style={styles.recipeCount}>
            {recipes.length} recipes available
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <View style={styles.aboutItem}>
            <Info size={20} color={Colors.primary} style={styles.aboutIcon} />
            <View style={styles.aboutContent}>
              <Text style={styles.aboutTitle}>App Version</Text>
              <Text style={styles.aboutDescription}>1.0.0</Text>
            </View>
          </View>
          
          <View style={styles.aboutItem}>
            <HelpCircle size={20} color={Colors.primary} style={styles.aboutIcon} />
            <View style={styles.aboutContent}>
              <Text style={styles.aboutTitle}>Help & Support</Text>
              <Text style={styles.aboutDescription}>
                Need help with the app? Contact our support team.
              </Text>
            </View>
            <ExternalLink size={16} color={Colors.textLight} />
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
  subtitle: {
    fontSize: 16,
    color: Colors.textLight,
    marginBottom: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: Colors.textLight,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  refreshButtonText: {
    color: Colors.white,
    fontWeight: '500',
    marginLeft: 8,
  },
  recipeCount: {
    textAlign: 'center',
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 8,
  },
  aboutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  aboutIcon: {
    marginRight: 12,
  },
  aboutContent: {
    flex: 1,
  },
  aboutTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  aboutDescription: {
    fontSize: 14,
    color: Colors.textLight,
  },
});