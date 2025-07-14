import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, SafeAreaView, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Target, Calendar, ShoppingCart, Sparkles, ArrowRight } from 'lucide-react-native';
import { useUserStore } from '@/store/userStore';
import Colors from '@/constants/colors';

const { height: screenHeight } = Dimensions.get('window');
const isSmallScreen = screenHeight < 700;

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
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              style={styles.logo}
            >
              <Sparkles size={isSmallScreen ? 28 : 32} color={Colors.white} />
            </LinearGradient>
          </View>
          <Text style={styles.title}>Zestora</Text>
          <Text style={styles.subtitle}>
            Your personal meal planning and nutrition tracking companion
          </Text>
        </View>
        
        {/* Features Section - Compact Grid */}
        <View style={styles.featuresSection}>
          <View style={styles.featuresRow}>
            <View style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: Colors.primaryLight }]}>
                <Target size={20} color={Colors.primary} />
              </View>
              <Text style={styles.featureTitle}>Smart Nutrition</Text>
            </View>
            
            <View style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: Colors.secondaryLight }]}>
                <Calendar size={20} color={Colors.secondary} />
              </View>
              <Text style={styles.featureTitle}>Meal Planning</Text>
            </View>
          </View>
          
          <View style={styles.featuresRow}>
            <View style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: Colors.accentLight }]}>
                <ShoppingCart size={20} color={Colors.accent} />
              </View>
              <Text style={styles.featureTitle}>Auto Grocery Lists</Text>
            </View>
            
            <View style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: Colors.infoLight }]}>
                <Sparkles size={20} color={Colors.info} />
              </View>
              <Text style={styles.featureTitle}>AI Recommendations</Text>
            </View>
          </View>
        </View>
        
        {/* Call to Action */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>
            Ready to transform your eating habits?
          </Text>
          <Text style={styles.ctaSubtitle}>
            Let's take a quick tour to get you started!
          </Text>
        </View>
      </ScrollView>
      
      {/* Fixed Bottom Button */}
      <View style={styles.bottomContainer}>
        <Pressable style={styles.startButton} onPress={handleGetStarted}>
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDark]}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>Start Tutorial</Text>
            <ArrowRight size={20} color={Colors.white} />
          </LinearGradient>
        </Pressable>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: isSmallScreen ? 20 : 40,
    paddingBottom: 120, // Space for fixed button
  },
  header: {
    alignItems: 'center',
    marginBottom: isSmallScreen ? 32 : 40,
  },
  logoContainer: {
    marginBottom: isSmallScreen ? 16 : 24,
  },
  logo: {
    width: isSmallScreen ? 70 : 80,
    height: isSmallScreen ? 70 : 80,
    borderRadius: isSmallScreen ? 35 : 40,
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
    fontSize: isSmallScreen ? 32 : 36,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: isSmallScreen ? 16 : 17,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: isSmallScreen ? 22 : 24,
    paddingHorizontal: 20,
  },
  featuresSection: {
    marginBottom: isSmallScreen ? 32 : 40,
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  featureCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: isSmallScreen ? 16 : 20,
    marginHorizontal: 6,
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
    width: isSmallScreen ? 44 : 48,
    height: isSmallScreen ? 44 : 48,
    borderRadius: isSmallScreen ? 22 : 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: isSmallScreen ? 13 : 14,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  ctaSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  ctaTitle: {
    fontSize: isSmallScreen ? 18 : 20,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  ctaSubtitle: {
    fontSize: isSmallScreen ? 15 : 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: isSmallScreen ? 20 : 22,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 34, // Safe area padding
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  startButton: {
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