import React from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { User, Edit } from 'lucide-react-native';
import { useUserStore } from '@/store/userStore';
import Colors from '@/constants/colors';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile } = useUserStore();
  
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textLight,
  },
});