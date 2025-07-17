import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChefHat, Sparkles } from 'lucide-react-native';
import Colors from '@/constants/colors';

export default function TutorialWelcomeScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* App Branding */}
        <View style={styles.brandingContainer}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <ChefHat size={48} color={Colors.white} />
            </View>
            <View style={styles.brandTextContainer}>
              <Text style={styles.brandName}>Zestora</Text>
              <View style={styles.sparkleIcon}>
                <Sparkles size={16} color={Colors.primary} />
              </View>
            </View>
          </View>
          <Text style={styles.tagline}>Your personal nutrition companion</Text>
        </View>

        {/* Welcome Content */}
        <View style={styles.welcomeContent}>
          <Text style={styles.welcomeTitle}>Welcome to Zestora! 🎉</Text>
          <Text style={styles.welcomeDescription}>
            Transform your eating habits with personalized meal planning, smart nutrition tracking, and AI-powered recommendations.
          </Text>
        </View>

        {/* Feature Preview Cards */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureCard}>
            <Text style={styles.featureTitle}>📊 Smart Tracking</Text>
            <Text style={styles.featureDescription}>
              Monitor calories, macros, and nutrients with visual progress indicators
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureTitle}>📅 Meal Planning</Text>
            <Text style={styles.featureDescription}>
              Plan your entire week with personalized recipe recommendations
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureTitle}>🛒 Auto Lists</Text>
            <Text style={styles.featureDescription}>
              Generate shopping lists automatically from your meal plans
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureTitle}>✨ AI Powered</Text>
            <Text style={styles.featureDescription}>
              Get personalized suggestions tailored to your goals and preferences
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
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  brandingContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  brandTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandName: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.8,
  },
  sparkleIcon: {
    marginLeft: 8,
    marginTop: -4,
  },
  tagline: {
    fontSize: 18,
    color: Colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
  welcomeContent: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.4,
  },
  welcomeDescription: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
    fontWeight: '400',
  },
  featuresContainer: {
    gap: 16,
  },
  featureCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  featureDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    fontWeight: '400',
  },
});