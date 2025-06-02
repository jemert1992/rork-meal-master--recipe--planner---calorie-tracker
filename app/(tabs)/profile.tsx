import React from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronRight, LogOut, Settings, User, Heart, Info, HelpCircle } from 'lucide-react-native';
import { useUserStore } from '@/store/userStore';
import { formatHeight, formatWeight } from '@/utils/unitConversions';
import NutritionBar from '@/components/NutritionBar';
import Colors from '@/constants/colors';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, logout } = useUserStore();
  
  const handleEditProfile = () => {
    router.push('/profile/edit');
  };
  
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive', 
          onPress: () => {
            logout();
            router.replace('/');
          }
        },
      ]
    );
  };
  
  const getActivityLevelText = (level: string | undefined) => {
    switch (level) {
      case 'sedentary': return 'Sedentary';
      case 'light': return 'Light Activity';
      case 'moderate': return 'Moderate Activity';
      case 'active': return 'Active';
      case 'very-active': return 'Very Active';
      default: return 'Not specified';
    }
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Your personal information and settings</Text>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{profile.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profile.name}</Text>
              <Text style={styles.profileDetails}>
                {profile.age} years • {profile.weight ? formatWeight(profile.weight) : '--'} • {profile.height ? formatHeight(profile.height) : '--'}
              </Text>
              <Text style={styles.profileActivity}>
                {getActivityLevelText(profile.activityLevel)}
              </Text>
            </View>
          </View>
          
          <Pressable style={styles.editButton} onPress={handleEditProfile}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </Pressable>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nutrition Goals</Text>
          <NutritionBar
            calories={0}
            protein={0}
            carbs={0}
            fat={0}
            goal={{
              calories: profile.calorieGoal || 2000,
              protein: profile.proteinGoal || 100,
              carbs: profile.carbsGoal || 250,
              fat: profile.fatGoal || 70,
            }}
          />
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dietary Preferences</Text>
          <View style={styles.preferencesContainer}>
            {profile.dietaryPreferences && profile.dietaryPreferences.length > 0 ? (
              profile.dietaryPreferences.map((preference, index) => (
                <View key={index} style={styles.preferenceTag}>
                  <Text style={styles.preferenceText}>{preference}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No dietary preferences set</Text>
            )}
          </View>
        </View>
        
        <View style={styles.menuSection}>
          <Pressable style={styles.menuItem} onPress={handleEditProfile}>
            <View style={styles.menuItemLeft}>
              <User size={20} color={Colors.primary} style={styles.menuIcon} />
              <Text style={styles.menuText}>Edit Profile</Text>
            </View>
            <ChevronRight size={20} color={Colors.textLight} />
          </Pressable>
          
          <Pressable style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Settings size={20} color={Colors.primary} style={styles.menuIcon} />
              <Text style={styles.menuText}>App Settings</Text>
            </View>
            <ChevronRight size={20} color={Colors.textLight} />
          </Pressable>
          
          <Pressable style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Heart size={20} color={Colors.primary} style={styles.menuIcon} />
              <Text style={styles.menuText}>Favorite Recipes</Text>
            </View>
            <ChevronRight size={20} color={Colors.textLight} />
          </Pressable>
          
          <Pressable style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <HelpCircle size={20} color={Colors.primary} style={styles.menuIcon} />
              <Text style={styles.menuText}>Help & Support</Text>
            </View>
            <ChevronRight size={20} color={Colors.textLight} />
          </Pressable>
          
          <Pressable style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Info size={20} color={Colors.primary} style={styles.menuIcon} />
              <Text style={styles.menuText}>About</Text>
            </View>
            <ChevronRight size={20} color={Colors.textLight} />
          </Pressable>
        </View>
        
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color={Colors.error} style={styles.logoutIcon} />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
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
  profileCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  profileDetails: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 2,
  },
  profileActivity: {
    fontSize: 14,
    color: Colors.textLight,
  },
  editButton: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  preferencesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  preferenceTag: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  preferenceText: {
    fontSize: 14,
    color: Colors.primary,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textLight,
    fontStyle: 'italic',
  },
  menuSection: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    marginRight: 12,
  },
  menuText: {
    fontSize: 16,
    color: Colors.text,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 40,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.error,
  },
});