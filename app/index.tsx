import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Target, Calendar, ShoppingCart, Sparkles } from 'lucide-react-native';
import { useUserStore } from '@/store/userStore';
import Colors from '@/constants/colors';

export default function WelcomeScreen() {
  const router = useRouter();
  const { isLoggedIn, profile } = useUserStore();

  useEffect(() => {
    // If user is already logged in and completed onboarding, redirect to main app
    if (isLoggedIn && profile.onboardingCompleted) {
      router.replace('/(tabs)');
    }
  }, [isLoggedIn, profile.onboardingCompleted]);

  const handleGetStarted = () => {
    router.push('/onboarding/personal-info');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <LinearGradient
        colors={[Colors.background, Colors.primaryLight]}
        style={styles.gradient}
      />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              style={styles.logo}
            >
              <Sparkles size={32} color={Colors.white} />
            </LinearGradient>
          </View>
          <Text style={styles.title}>Zestora</Text>
          <Text style={styles.subtitle}>
            Your personal meal planning and nutrition tracking companion
          </Text>
        </View>
        
        <View style={styles.featuresGrid}>
          <View style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: Colors.primaryLight }]}>
              <Target size={24} color={Colors.primary} />
            </View>
            <Text style={styles.featureTitle}>Smart Nutrition</Text>
            <Text style={styles.featureDescription}>
              Track calories and macros effortlessly
            </Text>
          </View>
          
          <View style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: Colors.secondaryLight }]}>
              <Calendar size={24} color={Colors.secondary} />
            </View>
            <Text style={styles.featureTitle}>Meal Planning</Text>
            <Text style={styles.featureDescription}>
              Plan your week with personalized recipes
            </Text>
          </View>
          
          <View style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: Colors.accentLight }]}>
              <ShoppingCart size={24} color={Colors.accent} />
            </View>
            <Text style={styles.featureTitle}>Auto Grocery Lists</Text>
            <Text style={styles.featureDescription}>
              Never forget ingredients again
            </Text>
          </View>
          
          <View style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: Colors.infoLight }]}>
              <Sparkles size={24} color={Colors.info} />
            </View>
            <Text style={styles.featureTitle}>AI Recommendations</Text>
            <Text style={styles.featureDescription}>
              Get meals picked just for you
            </Text>
          </View>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Ready to transform your eating habits?
          </Text>
          <Text style={styles.footerSubtext}>
            Let's take a quick tour to get you started!
          </Text>
          
          <Pressable style={styles.button} onPress={handleGetStarted}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Start Tutorial</Text>
              <Sparkles size={20} color={Colors.white} />
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 17,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 48,
  },
  featureCard: {
    width: '48%',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 13,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 18,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  footerSubtext: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    width: '100%',
    borderRadius: 16,
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
  },
  buttonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 18,
    marginRight: 8,
  },
});