import React from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { User, Edit, RefreshCw, Info } from 'lucide-react-native';
import { useUserStore } from '@/store/userStore';
import { useRecipeStore } from '@/store/recipeStore';
import Colors from '@/constants/colors';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile } = useUserStore();
  const { apiSources, setApiSource, loadRecipesFromApi } = useRecipeStore();
  
  const handleRefreshRecipes = async () => {
    await loadRecipesFromApi();
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recipe Data Sources</Text>
          <Text style={styles.sectionSubtitle}>Choose which recipe APIs to use</Text>
          
          <View style={styles.toggleGroup}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>TheMealDB</Text>
              <Text style={styles.toggleDescription}>Free recipe database</Text>
            </View>
            <Switch
              value={apiSources.useMealDB}
              onValueChange={(value) => setApiSource('useMealDB', value)}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={apiSources.useMealDB ? Colors.primary : Colors.white}
            />
          </View>
          
          <View style={styles.toggleGroup}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Spoonacular</Text>
              <Text style={styles.toggleDescription}>Comprehensive recipe API</Text>
            </View>
            <Switch
              value={apiSources.useSpoonacular}
              onValueChange={(value) => setApiSource('useSpoonacular', value)}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={apiSources.useSpoonacular ? Colors.primary : Colors.white}
            />
          </View>
          
          <View style={styles.toggleGroup}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Edamam</Text>
              <Text style={styles.toggleDescription}>Nutrition-focused API</Text>
            </View>
            <Switch
              value={apiSources.useEdamam}
              onValueChange={(value) => setApiSource('useEdamam', value)}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={apiSources.useEdamam ? Colors.primary : Colors.white}
            />
          </View>
          
          <Pressable 
            style={styles.refreshButton} 
            onPress={handleRefreshRecipes}
          >
            <RefreshCw size={16} color={Colors.white} />
            <Text style={styles.refreshButtonText}>Refresh Recipe Database</Text>
          </Pressable>
        </View>
        
        <View style={styles.section}>
          <View style={styles.infoBox}>
            <Info size={20} color={Colors.primary} style={styles.infoIcon} />
            <Text style={styles.infoText}>
              This app uses TheMealDB and Spoonacular APIs to provide recipe data. 
              You can enable or disable each source above.
            </Text>
          </View>
          
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
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 16,
  },
  toggleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  toggleInfo: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  toggleDescription: {
    fontSize: 12,
    color: Colors.textLight,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 16,
  },
  refreshButtonText: {
    color: Colors.white,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  infoIcon: {
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textLight,
  },
});