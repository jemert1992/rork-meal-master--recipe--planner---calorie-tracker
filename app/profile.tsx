import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronRight, Database, Cloud, RefreshCw, Upload, Key } from 'lucide-react-native';
import { useRecipeStore } from '@/store/recipeStore';
import { useUserStore } from '@/store/userStore';
import Colors from '@/constants/colors';
import * as edamamService from '@/services/edamamService';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile } = useUserStore();
  const { 
    useFirestore, 
    setUseFirestore, 
    apiSources, 
    setApiSource, 
    loadRecipesFromApi,
    recipes
  } = useRecipeStore();
  const [edamamConfigured, setEdamamConfigured] = useState(false);

  // Check if Edamam credentials are configured
  useEffect(() => {
    const checkEdamamCredentials = async () => {
      const isConfigured = await edamamService.checkEdamamCredentials();
      setEdamamConfigured(isConfigured);
    };
    
    checkEdamamCredentials();
  }, []);

  const handleEditProfile = () => {
    router.push('/profile/edit');
  };

  const handleToggleFirestore = () => {
    if (!useFirestore) {
      Alert.alert(
        "Enable Firestore",
        "This will switch the app to use Firestore for recipe storage. Make sure you have configured Firebase correctly.",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Enable",
            onPress: () => {
              setUseFirestore(true);
              // Reload recipes from Firestore
              loadRecipesFromApi(false);
            }
          }
        ]
      );
    } else {
      Alert.alert(
        "Disable Firestore",
        "This will switch the app to use external APIs for recipe data instead of Firestore.",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Disable",
            onPress: () => {
              setUseFirestore(false);
              // Reload recipes from APIs
              loadRecipesFromApi(false);
            }
          }
        ]
      );
    }
  };

  const handleToggleApiSource = (source: string, enabled: boolean) => {
    if (source === 'useEdamam' && enabled && !edamamConfigured) {
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
      return;
    }
    
    setApiSource(source, enabled);
    
    if (source === 'useSpoonacular' && enabled) {
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
    } else if (source === 'useEdamam' && enabled) {
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
    }
  };

  const handleRefreshRecipes = () => {
    loadRecipesFromApi(false);
    Alert.alert(
      "Recipes Refreshed",
      "Recipe data has been refreshed from the selected sources.",
      [{ text: "OK" }]
    );
  };

  const handleImportRecipes = () => {
    router.push('/admin/import-recipes');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Information</Text>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile.name || 'User'}</Text>
            {profile.age && <Text style={styles.profileDetail}>Age: {profile.age}</Text>}
            {profile.weight && <Text style={styles.profileDetail}>Weight: {profile.weight} kg</Text>}
            {profile.height && <Text style={styles.profileDetail}>Height: {profile.height} cm</Text>}
            {profile.dietType && <Text style={styles.profileDetail}>Diet: {profile.dietType}</Text>}
            {profile.fitnessGoals && profile.fitnessGoals.length > 0 && (
              <Text style={styles.profileDetail}>
                Goal: {profile.fitnessGoals[0].replace('-', ' ')}
              </Text>
            )}
          </View>
          <Pressable style={styles.editButton} onPress={handleEditProfile}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
            <ChevronRight size={20} color={Colors.primary} />
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recipe Data Sources</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              {useFirestore ? (
                <Database size={20} color={Colors.primary} style={styles.settingIcon} />
              ) : (
                <Cloud size={20} color={Colors.primary} style={styles.settingIcon} />
              )}
              <Text style={styles.settingLabel}>Use Firestore Database</Text>
            </View>
            <Switch
              value={useFirestore}
              onValueChange={handleToggleFirestore}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={useFirestore ? Colors.primary : Colors.textLight}
            />
          </View>
          
          {!useFirestore && (
            <>
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>MealDB API</Text>
                <Switch
                  value={apiSources.useMealDB}
                  onValueChange={(value) => handleToggleApiSource('useMealDB', value)}
                  trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                  thumbColor={apiSources.useMealDB ? Colors.primary : Colors.textLight}
                />
              </View>
              
              <View style={styles.settingItem}>
                <View style={styles.settingLabelContainer}>
                  <Text style={styles.settingLabel}>Spoonacular API</Text>
                  {apiSources.useSpoonacular && (
                    <Text style={styles.apiKeyStatus}>API Key: Active</Text>
                  )}
                </View>
                <Switch
                  value={apiSources.useSpoonacular}
                  onValueChange={(value) => handleToggleApiSource('useSpoonacular', value)}
                  trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                  thumbColor={apiSources.useSpoonacular ? Colors.primary : Colors.textLight}
                />
              </View>
              
              <View style={styles.settingItem}>
                <View style={styles.settingLabelContainer}>
                  <Text style={styles.settingLabel}>Edamam API</Text>
                  {edamamConfigured && (
                    <View style={styles.apiKeyBadge}>
                      <Key size={12} color={Colors.success} />
                      <Text style={styles.apiKeyBadgeText}>Configured</Text>
                    </View>
                  )}
                </View>
                <Switch
                  value={apiSources.useEdamam}
                  onValueChange={(value) => handleToggleApiSource('useEdamam', value)}
                  trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                  thumbColor={apiSources.useEdamam ? Colors.primary : Colors.textLight}
                />
              </View>
            </>
          )}
          
          <Pressable style={styles.actionButton} onPress={handleRefreshRecipes}>
            <RefreshCw size={20} color={Colors.white} />
            <Text style={styles.actionButtonText}>Refresh Recipe Data</Text>
          </Pressable>
          
          <Pressable 
            style={styles.configButton} 
            onPress={() => router.push('/api-settings')}
          >
            <Key size={18} color={Colors.primary} />
            <Text style={styles.configButtonText}>API Configuration</Text>
          </Pressable>
          
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>Total Recipes: {recipes.length}</Text>
            <Text style={styles.statsText}>Data Source: {useFirestore ? 'Firestore' : 'External APIs'}</Text>
            {apiSources.useSpoonacular && (
              <Text style={styles.statsText}>Spoonacular API: Enabled</Text>
            )}
            {apiSources.useEdamam && (
              <Text style={styles.statsText}>Edamam API: {edamamConfigured ? 'Configured' : 'Not Configured'}</Text>
            )}
          </View>
        </View>

        {useFirestore && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Admin Tools</Text>
            <Pressable style={styles.adminButton} onPress={handleImportRecipes}>
              <Upload size={20} color={Colors.white} />
              <Text style={styles.adminButtonText}>Import Recipes to Firestore</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>
            Zestora is a nutrition app designed to help you plan meals, track your diet, and achieve your fitness goals.
          </Text>
          <Text style={styles.versionText}>Version 1.0.0</Text>
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
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  profileInfo: {
    marginBottom: 16,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  profileDetail: {
    fontSize: 16,
    color: Colors.textLight,
    marginBottom: 4,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primaryLight,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primary,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: 8,
  },
  settingLabel: {
    fontSize: 16,
    color: Colors.text,
    flex: 1,
  },
  apiKeyStatus: {
    fontSize: 12,
    color: Colors.success,
    backgroundColor: Colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
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
  actionButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  actionButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  configButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  configButtonText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
  },
  statsContainer: {
    padding: 12,
    backgroundColor: Colors.background,
    borderRadius: 8,
  },
  statsText: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 4,
  },
  adminButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  aboutText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  versionText: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'center',
  },
});