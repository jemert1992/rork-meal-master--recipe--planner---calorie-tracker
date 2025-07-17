import React from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Target, Heart, ChefHat } from 'lucide-react-native';
import Colors from '@/constants/colors';

export default function TutorialOnboardingScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <ChefHat size={32} color={Colors.primary} />
          </View>
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>
            Help us personalize your nutrition journey
          </Text>
        </View>

        {/* Personal Information Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <User size={20} color={Colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Personal Information</Text>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.input}>
              <Text style={styles.inputText}>John Doe</Text>
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Age</Text>
              <View style={styles.input}>
                <Text style={styles.inputText}>28</Text>
              </View>
            </View>
            
            <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.input}>
                <Text style={styles.inputText}>Male</Text>
              </View>
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Height (cm)</Text>
              <View style={styles.input}>
                <Text style={styles.inputText}>175</Text>
              </View>
            </View>
            
            <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Weight (kg)</Text>
              <View style={styles.input}>
                <Text style={styles.inputText}>70</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Dietary Preferences Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Heart size={20} color={Colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Dietary Preferences</Text>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Diet Type</Text>
            <View style={styles.optionsGrid}>
              <View style={[styles.optionCard, styles.optionCardSelected]}>
                <Text style={[styles.optionText, styles.optionTextSelected]}>Balanced</Text>
              </View>
              <View style={styles.optionCard}>
                <Text style={styles.optionText}>Vegetarian</Text>
              </View>
              <View style={styles.optionCard}>
                <Text style={styles.optionText}>Vegan</Text>
              </View>
              <View style={styles.optionCard}>
                <Text style={styles.optionText}>Keto</Text>
              </View>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Allergies & Restrictions</Text>
            <View style={styles.optionsGrid}>
              <View style={styles.optionCard}>
                <Text style={styles.optionText}>Nuts</Text>
              </View>
              <View style={styles.optionCard}>
                <Text style={styles.optionText}>Dairy</Text>
              </View>
              <View style={styles.optionCard}>
                <Text style={styles.optionText}>Gluten</Text>
              </View>
              <View style={styles.optionCard}>
                <Text style={styles.optionText}>Shellfish</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Nutrition Goals Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Target size={20} color={Colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Nutrition Goals</Text>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Fitness Goal</Text>
            <View style={styles.optionsGrid}>
              <View style={[styles.optionCard, styles.optionCardSelected]}>
                <Text style={[styles.optionText, styles.optionTextSelected]}>Maintain Weight</Text>
              </View>
              <View style={styles.optionCard}>
                <Text style={styles.optionText}>Lose Weight</Text>
              </View>
              <View style={styles.optionCard}>
                <Text style={styles.optionText}>Gain Muscle</Text>
              </View>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Daily Calorie Goal</Text>
            <View style={styles.input}>
              <Text style={styles.inputText}>2000 calories</Text>
            </View>
          </View>

          <View style={styles.macroGoals}>
            <Text style={styles.label}>Macro Goals</Text>
            <View style={styles.macroRow}>
              <View style={styles.macroItem}>
                <Text style={styles.macroLabel}>Protein</Text>
                <Text style={styles.macroValue}>150g</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroLabel}>Carbs</Text>
                <Text style={styles.macroValue}>250g</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroLabel}>Fat</Text>
                <Text style={styles.macroValue}>70g</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>Setup Progress</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '75%' }]} />
          </View>
          <Text style={styles.progressLabel}>3 of 4 steps completed</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Pressable style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Back</Text>
          </Pressable>
          
          <Pressable style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Continue</Text>
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
  content: {
    flex: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '400',
    lineHeight: 22,
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.2,
  },
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '400',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionCard: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionCardSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: Colors.white,
  },
  macroGoals: {
    marginBottom: 0,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.backgroundLight,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  macroItem: {
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  macroValue: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '700',
  },
  progressContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});