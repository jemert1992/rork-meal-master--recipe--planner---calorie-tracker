import React from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronRight, Database, Cloud, RefreshCw, Upload } from 'lucide-react-native';
import { useRecipeStore } from '@/store/recipeStore';
import { useUserStore } from '@/store/userStore';
import Colors from '@/constants/colors';

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
    setApiSource(source, enabled);
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
            {profile.fitnessGoal && <Text style={styles.profileDetail}>Goal: {profile.fitnessGoal.replace('-', ' ')}</Text>}
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
                <Text style={styles.settingLabel}>Spoonacular API (Coming Soon)</Text>
                <Switch
                  value={apiSources.useSpoonacular}
                  onValueChange={(value) => handleToggleApiSource('useSpoonacular', value)}
                  trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                  thumbColor={apiSources.useSpoonacular ? Colors.primary : Colors.textLight}
                  disabled={true}
                />
              </View>
              
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Edamam API (Coming Soon)</Text>
                <Switch
                  value={apiSources.useEdamam}
                  onValueChange={(value) => handleToggleApiSource('useEdamam', value)}
                  trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                  thumbColor={apiSources.useEdamam ? Colors.primary : Colors.textLight}
                  disabled={true}
                />
              </View>
            </>
          )}
          
          <Pressable style={styles.actionButton} onPress={handleRefreshRecipes}>
            <RefreshCw size={20} color={Colors.white} />
            <Text style={styles.actionButtonText}>Refresh Recipe Data</Text>
          </Pressable>
          
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>Total Recipes: {recipes.length}</Text>
            <Text style={styles.statsText}>Data Source: {useFirestore ? 'Firestore' : 'External APIs'}</Text>
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
  },
  settingIcon: {
    marginRight: 8,
  },
  settingLabel: {
    fontSize: 16,
    color: Colors.text,
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
  },
  actionButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  statsContainer: {
    marginTop: 16,
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