import React from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowRight, Target, Calendar, ShoppingCart, Sparkles } from 'lucide-react-native';
import Colors from '@/constants/colors';

const { width: screenWidth } = Dimensions.get('window');

export default function OnboardingWelcomeScreen() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/onboarding/personal-info');
  };

  const features = [
    {
      icon: Target,
      title: 'Smart Nutrition Tracking',
      description: 'Track calories, macros, and nutrients with ease. Get personalized insights about your eating patterns.',
      color: Colors.primary,
    },
    {
      icon: Calendar,
      title: 'Weekly Meal Planning',
      description: 'Plan your entire week with drag-and-drop simplicity. Get recipe recommendations based on your goals.',
      color: Colors.secondary,
    },
    {
      icon: ShoppingCart,
      title: 'Auto Grocery Lists',
      description: 'Never forget ingredients again! Your shopping list is automatically generated from your meal plans.',
      color: Colors.accent,
    },
    {
      icon: Sparkles,
      title: 'AI-Powered Recommendations',
      description: 'Get personalized meal suggestions and recipe modifications tailored to your preferences.',
      color: Colors.success,
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoEmoji}>🍽️</Text>
            </View>
          </View>
          <Text style={styles.title}>Welcome to Zestora</Text>
          <Text style={styles.subtitle}>
            Your complete meal planning and nutrition companion
          </Text>
        </View>

        {/* Hero Image */}
        <View style={styles.heroImageContainer}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' }}
            style={styles.heroImage}
          />
          <View style={styles.heroOverlay}>
            <Text style={styles.heroText}>Transform Your Eating Habits</Text>
          </View>
        </View>

        {/* Core Features */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>What You Can Do</Text>
          
          {features.map((feature, index) => (
            <View key={index} style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: `${feature.color}15` }]}>
                <feature.icon size={24} color={feature.color} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Benefits */}
        <View style={styles.benefitsSection}>
          <Text style={styles.sectionTitle}>Why Choose Zestora?</Text>
          
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitEmoji}>⚡</Text>
              <Text style={styles.benefitText}>Save 2+ hours per week on meal planning</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitEmoji}>🎯</Text>
              <Text style={styles.benefitText}>Reach your nutrition goals faster</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitEmoji}>💰</Text>
              <Text style={styles.benefitText}>Reduce food waste and grocery costs</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitEmoji}>🧠</Text>
              <Text style={styles.benefitText}>AI learns your preferences over time</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Call to Action */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Ready to start your healthy eating journey?
        </Text>
        <Pressable 
          style={({ pressed }) => [
            styles.getStartedButton,
            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
          ]}
          onPress={handleGetStarted}
        >
          <Text style={styles.getStartedButtonText}>Get Started</Text>
          <ArrowRight size={20} color={Colors.white} />
        </Pressable>
        <Text style={styles.setupTime}>Takes less than 2 minutes to set up</Text>
      </View>
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
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  logoEmoji: {
    fontSize: 36,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  heroImageContainer: {
    marginHorizontal: 24,
    marginBottom: 40,
    borderRadius: 20,
    overflow: 'hidden',
    height: 200,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  featuresSection: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  featureDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  benefitsSection: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  benefitsList: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  benefitEmoji: {
    fontSize: 20,
    marginRight: 12,
    width: 32,
  },
  benefitText: {
    fontSize: 16,
    color: Colors.text,
    flex: 1,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  getStartedButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 280,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 12,
  },
  getStartedButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
    marginRight: 8,
  },
  setupTime: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
  },
});